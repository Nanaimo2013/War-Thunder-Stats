using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;
using Newtonsoft.Json;
using WTBattleTracker.Models;
using WTBattleTracker.Services;

namespace WTBattleTracker;

public partial class MainWindow : Window
{
    // ─── Services ─────────────────────────────────────────────────────────────
    private readonly BattleStore _store    = new();
    private readonly WTMonitor   _monitor  = new();
    private          AppSettings _settings = new();

    // ─── State ────────────────────────────────────────────────────────────────
    private DateTime? _pendingBattleTimestamp;   // set when WT detects battle end
    private string    _activeFilter   = "All";
    private string    _activeSort     = "BattleDate";
    private bool      _sortDesc       = true;
    private ParsedBattle? _selectedBattle;

    // ─── Timers ───────────────────────────────────────────────────────────────
    private readonly DispatcherTimer _battleTimer  = new() { Interval = TimeSpan.FromSeconds(1) };
    private readonly DispatcherTimer _statusTimer  = new() { Interval = TimeSpan.FromSeconds(30) };

    // ─── Native clipboard ─────────────────────────────────────────────────────
    private const int WM_CLIPBOARDUPDATE = 0x031D;
    [DllImport("user32.dll")] static extern bool AddClipboardFormatListener(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool RemoveClipboardFormatListener(IntPtr hwnd);
    private HwndSource? _hwndSource;

    // ─── Init ─────────────────────────────────────────────────────────────────

    public MainWindow()
    {
        InitializeComponent();
        _settings = _store.LoadSettings();

        RestoreWindowGeometry();
        SetupMonitor();
        SetupTimers();
        RefreshBattleList();
        UpdateStatsBar();
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        _hwndSource = HwndSource.FromHwnd(new WindowInteropHelper(this).Handle);
        _hwndSource.AddHook(WndProc);
        AddClipboardFormatListener(new WindowInteropHelper(this).Handle);
    }

    private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WM_CLIPBOARDUPDATE)
        {
            OnClipboardChanged();
            handled = false; // don't block others
        }
        return IntPtr.Zero;
    }

    // ─── WT Monitor setup ─────────────────────────────────────────────────────

    private void SetupMonitor()
    {
        _monitor.StateChanged  += (_, state) => Dispatcher.InvokeAsync(() => OnWTStateChanged(state));
        _monitor.BattleEnded   += (_, args)  => Dispatcher.InvokeAsync(() => OnBattleEnded(args));
        _monitor.StatusMessage += (_, msg)   => Dispatcher.InvokeAsync(() => LogStatus(msg));

        if (_settings.AutoDetectEnabled)
            _monitor.Start();
    }

    private void OnWTStateChanged(WTGameState state)
    {
        var (text, color) = state switch
        {
            WTGameState.InBattle       => ("▶ IN BATTLE",      "#22c55e"),
            WTGameState.Loading        => ("⟳ LOADING",        "#f59e0b"),
            WTGameState.ResultsScreen  => ("⊛ RESULTS",        "#3b82f6"),
            WTGameState.InMenu         => ("● WT CONNECTED",   "#64748b"),
            _                          => ("○ WT NOT DETECTED","#334155"),
        };

        TxtStatus.Text = text;
        TxtStatus.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString(color));
        StatusDotColor.Color = (Color)ColorConverter.ConvertFromString(color);

        // Start/stop battle timer
        if (state == WTGameState.InBattle)
            _battleTimer.Start();
        else if (state != WTGameState.InBattle)
            _battleTimer.Stop();
    }

    private void OnBattleEnded(BattleEndedEventArgs args)
    {
        _pendingBattleTimestamp = args.Timestamp;
        LogStatus($"Battle ended at {args.Timestamp:HH:mm:ss} — waiting for clipboard copy");

        // Notification
        if (_settings.ShowNotifications)
            ((App)Application.Current).ShowTrayNotification(
                "Battle Detected",
                $"Copy your battle results from WT to auto-import them.");

        // Give the user 5 minutes to copy before the timestamp expires
        var expiry = args.Timestamp;
        Task.Delay(TimeSpan.FromMinutes(5)).ContinueWith(_ =>
        {
            if (_pendingBattleTimestamp == expiry)
                Dispatcher.InvokeAsync(() =>
                {
                    _pendingBattleTimestamp = null;
                    LogStatus("Battle timestamp expired — paste manually if needed");
                });
        });
    }

    // ─── Clipboard monitoring ─────────────────────────────────────────────────

    private void OnClipboardChanged()
    {
        if (!_settings.ClipboardMonitor) return;

        try
        {
            if (!Clipboard.ContainsText()) return;
            var text = Clipboard.GetText();

            // Quick check before full validation
            if (text.Length < 100) return;
            if (!text.Contains("in the [", StringComparison.OrdinalIgnoreCase)) return;
            if (!BattleParser.IsValidBattleLog(text)) return;

            // Parse with the pending timestamp (from WT API) if available
            var timestamp = _pendingBattleTimestamp;
            _pendingBattleTimestamp = null; // consume

            TryAddBattleFromText(text, timestamp);
        }
        catch (Exception ex)
        {
            LogStatus($"Clipboard read error: {ex.Message}");
        }
    }

    // ─── Battle parsing + adding ──────────────────────────────────────────────

    private void TryAddBattleFromText(string text, DateTime? timestamp)
    {
        // Handle multiple battles pasted at once
        var logs = SplitMultipleLogs(text);
        int added = 0, dupes = 0, errors = 0;

        foreach (var log in logs)
        {
            if (!BattleParser.IsValidBattleLog(log)) continue;
            try
            {
                var battle = BattleParser.Parse(log, timestamp);
                var result = _store.Add(battle);
                if (result.Ok) added++;
                else if (result.Reason == "duplicate") dupes++;
            }
            catch { errors++; }
        }

        if (added > 0 || dupes > 0 || errors > 0)
        {
            RefreshBattleList();
            UpdateStatsBar();
            var msg = $"Added {added}";
            if (dupes > 0) msg += $", {dupes} duplicate(s) skipped";
            if (errors > 0) msg += $", {errors} error(s)";
            LogStatus(msg);

            if (_settings.ShowNotifications && added > 0)
                ((App)Application.Current).ShowTrayNotification(
                    "Battle Imported", $"{added} battle(s) added successfully.");
        }
    }

    private static List<string> SplitMultipleLogs(string text)
    {
        // Split on battle start patterns
        var parts = System.Text.RegularExpressions.Regex.Split(
            text,
            @"(?=(?:Defeat|Victory) in the \[.+?\] .+? mission!)",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return parts.Where(p => !string.IsNullOrWhiteSpace(p)).ToList();
    }

    // ─── UI refresh ───────────────────────────────────────────────────────────

    private void RefreshBattleList()
    {
        var filter = BuildFilter();
        var battles = _store.Filter(filter);

        // Sort
        var sorted = (_activeSort, _sortDesc) switch
        {
            ("BattleDate", true)  => battles.OrderByDescending(b => b.BattleTime ?? DateTime.MinValue),
            ("BattleDate", false) => battles.OrderBy(b => b.BattleTime ?? DateTime.MinValue),
            ("ParsedAt",   true)  => battles.OrderByDescending(b => b.ParsedAt),
            ("ParsedAt",   false) => battles.OrderBy(b => b.ParsedAt),
            ("Kills",      _)     => _sortDesc ? battles.OrderByDescending(b => b.TotalKills) : battles.OrderBy(b => b.TotalKills),
            ("SL",         _)     => _sortDesc ? battles.OrderByDescending(b => b.EarnedSL) : battles.OrderBy(b => b.EarnedSL),
            ("RP",         _)     => _sortDesc ? battles.OrderByDescending(b => b.TotalRP)  : battles.OrderBy(b => b.TotalRP),
            ("Activity",   _)     => _sortDesc ? battles.OrderByDescending(b => b.Activity) : battles.OrderBy(b => b.Activity),
            _                     => battles.OrderByDescending(b => b.BattleTime ?? DateTime.MinValue),
        };

        BattleList.ItemsSource = sorted.ToList();
        TxtBattleCount.Text    = $"{sorted.Count()} / {_store.Count} battles";
    }

    private void UpdateStatsBar()
    {
        var filter = BuildFilter();
        var scope  = _store.Filter(filter);
        var stats  = _store.GetStats(scope);

        TxtStatBattles.Text = stats.Total.ToString("N0");
        TxtStatWinRate.Text = stats.WinRateStr;
        TxtStatKills.Text   = stats.TotalKills.ToString("N0");
        TxtStatSL.Text      = FormatK(stats.TotalSL);
    }

    private BattleFilter BuildFilter()
    {
        return new BattleFilter
        {
            Search      = TxtSearch?.Text ?? "",
            Result      = _activeFilter,
            DateFrom    = DpFrom?.SelectedDate,
            DateTo      = DpTo?.SelectedDate,
            SortBy      = _activeSort,
            SortDesc    = _sortDesc,
        };
    }

    private void ShowBattleDetail(ParsedBattle? b)
    {
        _selectedBattle = b;
        DetailPanel.Visibility = b == null ? Visibility.Collapsed : Visibility.Visible;
        if (b == null) return;

        // Header
        TxtDetailResult.Text   = b.DisplayResult;
        TxtDetailResult.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString(b.ResultColor));
        TxtDetailMission.Text  = b.MissionName;
        TxtDetailType.Text     = $"[{b.MissionType}]";
        TxtDetailDate.Text     = b.BattleTime.HasValue
            ? b.BattleTime.Value.ToLocalTime().ToString("dddd, MMMM d yyyy  ·  HH:mm:ss")
            : "Battle date unknown";
        TxtDetailParsed.Text   = $"Uploaded: {(b.ParsedAt != null ? DateTime.Parse(b.ParsedAt).ToLocalTime().ToString("MMM d HH:mm") : "Unknown")}";
        TxtDetailSession.Text  = $"Session: {b.Session}";

        // Header background tint
        DetailHeaderBg.Color = b.Result switch
        {
            "Victory" => Color.FromRgb(0x0a, 0x1f, 0x12),
            "Defeat"  => Color.FromRgb(0x1f, 0x0a, 0x0a),
            _         => Color.FromRgb(0x11, 0x18, 0x20),
        };

        // Combat stats
        CombatStats.Children.Clear();
        AddStatRow(CombatStats, "Ground Kills",   b.KillsGround.ToString(),     "#ef4444");
        AddStatRow(CombatStats, "Air Kills",      b.KillsAircraft.ToString(),   "#3b82f6");
        AddStatRow(CombatStats, "Assists",        b.Assists.ToString(),          "#22c55e");
        AddStatRow(CombatStats, "Severe Dmg",     b.SevereDamage.ToString(),    "#f97316");
        AddStatRow(CombatStats, "Critical Dmg",   b.CriticalDamage.ToString(),  "#ef4444");
        AddStatRow(CombatStats, "Normal Dmg",     b.Damage.ToString(),           "#a855f7");

        // Economy stats
        EconomyStats.Children.Clear();
        AddStatRow(EconomyStats, "Earned SL",  b.EarnedSL.ToString("N0"),  "#f59e0b");
        AddStatRow(EconomyStats, "Total RP",   b.TotalRP.ToString("N0"),   "#a855f7");
        AddStatRow(EconomyStats, "CRP",        b.EarnedCRP.ToString("N0"), "#7c3aed");
        AddStatRow(EconomyStats, "Reward SL",  b.RewardSL.ToString("N0"),  "#f59e0b");
        AddStatRow(EconomyStats, "Repair Cost",Math.Abs(b.AutoRepairCost).ToString("N0"), "#ef4444");

        // Performance stats
        PerformanceStats.Children.Clear();
        AddStatRow(PerformanceStats, "Activity",     $"{b.Activity}%",       "#22c55e");
        AddStatRow(PerformanceStats, "Battle Time",  b.FormattedTime,        "#3b82f6");
        AddStatRow(PerformanceStats, "Skill RP",     b.SkillBonusRP.ToString("N0"), "#a855f7");
        AddStatRow(PerformanceStats, "Awards",       b.AwardsCount.ToString(), "#f59e0b");
        AddStatRow(PerformanceStats, "Activity SL",  b.ActivityTimeSL.ToString("N0"), "#f59e0b");

        // Kills list
        KillsList.Items.Clear();
        if (b.Kills.Any())
        {
            KillsSection.Visibility = Visibility.Visible;
            foreach (var kill in b.Kills)
            {
                var min = kill.TimeSec / 60;
                var sec = kill.TimeSec % 60;
                var typeColor = kill.Type == "aircraft" ? "#3b82f6" : "#ef4444";
                var row = MakeDetailRow($"{min}:{sec:D2}", kill.Type.ToUpper(),
                    $"{kill.Vehicle}  →  {kill.Target}  [{kill.Weapon}]",
                    typeColor);
                KillsList.Items.Add(row);
            }
        }
        else KillsSection.Visibility = Visibility.Collapsed;

        // Awards list
        AwardsList.Items.Clear();
        if (b.AwardsDetail.Any())
        {
            AwardsSection.Visibility = Visibility.Visible;
            foreach (var award in b.AwardsDetail)
            {
                var row = MakeDetailRow("🏅", award.Award, $"+{award.SL:N0} SL", "#f59e0b");
                AwardsList.Items.Add(row);
            }
        }
        else AwardsSection.Visibility = Visibility.Collapsed;

        // Research list
        ResearchList.Items.Clear();
        if (b.ResearchedUnits.Any() || b.ResearchingProgress.Any())
        {
            ResearchSection.Visibility = Visibility.Visible;
            foreach (var ru in b.ResearchedUnits)
            {
                ResearchList.Items.Add(MakeDetailRow("★", ru.Unit, $"{ru.RP:N0} RP unlocked", "#f59e0b"));
            }
            foreach (var rp in b.ResearchingProgress)
            {
                ResearchList.Items.Add(MakeDetailRow("◎", $"{rp.Unit} – {rp.Item}", $"+{rp.RP:N0} RP", "#a855f7"));
            }
        }
        else ResearchSection.Visibility = Visibility.Collapsed;
    }

    // ─── UI helpers ───────────────────────────────────────────────────────────

    private static void AddStatRow(StackPanel panel, string label, string value, string colorHex)
    {
        var grid = new Grid { Margin = new Thickness(0, 0, 0, 5) };
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var labelTb = new TextBlock
        {
            Text       = label,
            FontSize   = 11,
            Foreground = new SolidColorBrush(Color.FromRgb(0x64, 0x74, 0x8b)),
            FontFamily = new FontFamily("Segoe UI"),
        };
        var valueTb = new TextBlock
        {
            Text       = value,
            FontSize   = 13,
            FontFamily = new FontFamily("Consolas"),
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString(colorHex)),
        };

        Grid.SetColumn(labelTb, 0);
        Grid.SetColumn(valueTb, 1);
        grid.Children.Add(labelTb);
        grid.Children.Add(valueTb);
        panel.Children.Add(grid);
    }

    private static UIElement MakeDetailRow(string col1, string col2, string col3, string colorHex)
    {
        var sp = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Margin      = new Thickness(0, 2, 0, 2),
        };
        sp.Children.Add(new TextBlock
        {
            Text = col1, Width = 44, FontFamily = new FontFamily("Consolas"),
            FontSize = 10, Foreground = new SolidColorBrush(Color.FromRgb(0x47, 0x55, 0x69)),
            VerticalAlignment = VerticalAlignment.Center,
        });
        sp.Children.Add(new Border
        {
            Background    = new SolidColorBrush((Color)ColorConverter.ConvertFromString(colorHex + "22")),
            BorderBrush   = new SolidColorBrush((Color)ColorConverter.ConvertFromString(colorHex + "55")),
            BorderThickness = new Thickness(1),
            CornerRadius  = new CornerRadius(3),
            Padding       = new Thickness(5, 1, 5, 1),
            Margin        = new Thickness(0, 0, 8, 0),
            Child         = new TextBlock
            {
                Text = col2, FontFamily = new FontFamily("Rajdhani"),
                FontSize = 10, FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString(colorHex)),
            },
        });
        sp.Children.Add(new TextBlock
        {
            Text = col3, FontFamily = new FontFamily("Segoe UI"),
            FontSize = 12, Foreground = new SolidColorBrush(Color.FromRgb(0xe2, 0xe8, 0xf0)),
            VerticalAlignment = VerticalAlignment.Center, TextTrimming = TextTrimming.CharacterEllipsis,
            MaxWidth = 400,
        });
        return sp;
    }

    // ─── Timers ───────────────────────────────────────────────────────────────

    private void SetupTimers()
    {
        _battleTimer.Tick += (_, _) =>
        {
            if (_monitor.BattleDuration.HasValue)
            {
                var d = _monitor.BattleDuration.Value;
                TxtBattleTimer.Text = $"{(int)d.TotalMinutes:D2}:{d.Seconds:D2}";
                TxtBattleTimer.Foreground = new SolidColorBrush(Color.FromRgb(0x22, 0xc5, 0x5e));
            }
        };

        _statusTimer.Tick += (_, _) => TxtLastUpdate.Text = $"Last refresh: {DateTime.Now:HH:mm}";
        _statusTimer.Start();
    }

    // ─── Event handlers ───────────────────────────────────────────────────────

    private void BattleList_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (BattleList.SelectedItem is ParsedBattle b) ShowBattleDetail(b);
    }

    private void TxtSearch_TextChanged(object sender, TextChangedEventArgs e)
    {
        RefreshBattleList(); UpdateStatsBar();
    }

    private void FilterPill_Click(object sender, RoutedEventArgs e)
    {
        // Uncheck all, check only clicked one
        FilterAll.IsChecked     = false;
        FilterVictory.IsChecked = false;
        FilterDefeat.IsChecked  = false;

        if (sender is System.Windows.Controls.Primitives.ToggleButton btn)
        {
            btn.IsChecked = true;
            _activeFilter = btn.Tag?.ToString() ?? "All";
        }
        RefreshBattleList(); UpdateStatsBar();
    }

    private void CmbSort_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (CmbSort.SelectedItem is ComboBoxItem item && item.Tag is string tag)
        {
            var parts  = tag.Split(',');
            _activeSort = parts[0];
            _sortDesc   = parts.Length < 2 || parts[1] == "Desc";
        }
        RefreshBattleList();
    }

    private void DateFilter_Changed(object sender, SelectionChangedEventArgs e)
    {
        RefreshBattleList(); UpdateStatsBar();
    }

    private void BtnResetFilters_Click(object sender, RoutedEventArgs e)
    {
        TxtSearch.Text = "";
        DpFrom.SelectedDate = null;
        DpTo.SelectedDate   = null;
        FilterAll.IsChecked     = true;
        FilterVictory.IsChecked = false;
        FilterDefeat.IsChecked  = false;
        _activeFilter = "All";
        _activeSort   = "BattleDate";
        _sortDesc     = true;
        CmbSort.SelectedIndex = 0;
        RefreshBattleList(); UpdateStatsBar();
    }

    private void BtnPaste_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            if (!Clipboard.ContainsText()) { LogStatus("Nothing in clipboard"); return; }
            var text = Clipboard.GetText();
            if (!BattleParser.IsValidBattleLog(text)) { LogStatus("Clipboard doesn't look like a WT battle log"); return; }

            // Show timestamp dialog
            var tsDialog = new TimestampDialog(_pendingBattleTimestamp) { Owner = this };
            if (tsDialog.ShowDialog() == true)
            {
                TryAddBattleFromText(text, tsDialog.SelectedTimestamp);
                _pendingBattleTimestamp = null;
            }
        }
        catch (Exception ex) { LogStatus($"Paste error: {ex.Message}"); }
    }

    private void BtnSettings_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new SettingsDialog(_settings) { Owner = this };
        if (dialog.ShowDialog() == true)
        {
            _settings = dialog.Settings;
            _store.SaveSettings(_settings);
            ApplySettings();
        }
    }

    private void ApplySettings()
    {
        if (_settings.AutoDetectEnabled) _monitor.Start();
        else                             _monitor.Stop();
    }

    private void BtnDeleteSelected_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedBattle == null) return;
        if (MessageBox.Show($"Delete battle '{_selectedBattle.MissionName}'?",
            "Confirm Delete", MessageBoxButton.YesNo, MessageBoxImage.Question) == MessageBoxResult.Yes)
        {
            _store.Remove(_selectedBattle.Id);
            ShowBattleDetail(null);
            RefreshBattleList();
            UpdateStatsBar();
        }
    }

    private void BtnClearAll_Click(object sender, RoutedEventArgs e)
    {
        if (MessageBox.Show($"Delete ALL {_store.Count} battles? This cannot be undone.",
            "Confirm Clear All", MessageBoxButton.YesNo, MessageBoxImage.Warning) == MessageBoxResult.Yes)
        {
            _store.Clear();
            ShowBattleDetail(null);
            RefreshBattleList();
            UpdateStatsBar();
        }
    }

    private void BtnExport_Click(object sender, RoutedEventArgs e)
    {
        // What to export: filtered or all?
        var scope = _store.Filter(BuildFilter()).ToList();
        bool hasFilter = _activeFilter != "All" || !string.IsNullOrEmpty(TxtSearch.Text)
            || DpFrom.SelectedDate.HasValue || DpTo.SelectedDate.HasValue;

        if (hasFilter && scope.Count != _store.Count)
        {
            var q = MessageBox.Show(
                $"Export only the {scope.Count} filtered battles, or all {_store.Count}?",
                "Export Scope",
                MessageBoxButton.YesNoCancel, MessageBoxImage.Question);
            if (q == MessageBoxResult.Cancel) return;
            if (q == MessageBoxResult.No) scope = _store.GetAll().ToList();
        }

        var dlg = new Microsoft.Win32.SaveFileDialog
        {
            Title            = "Export Battles for WT Stats Website",
            Filter           = "JSON File (*.json)|*.json",
            FileName         = $"wt_battles_{DateTime.Now:yyyyMMdd_HHmmss}.json",
            InitialDirectory = string.IsNullOrEmpty(_settings.ExportPath)
                ? Environment.GetFolderPath(Environment.SpecialFolder.Desktop)
                : _settings.ExportPath,
        };

        if (dlg.ShowDialog(this) != true) return;

        try
        {
            var json = _store.ExportToWebsite(_settings.DefaultPilotName, scope);
            File.WriteAllText(dlg.FileName, json);
            _settings.ExportPath = Path.GetDirectoryName(dlg.FileName) ?? "";
            _store.SaveSettings(_settings);

            LogStatus($"Exported {scope.Count} battles → {Path.GetFileName(dlg.FileName)}");
            MessageBox.Show(
                $"✅ Exported {scope.Count} battles successfully!\n\n" +
                $"File: {dlg.FileName}\n\n" +
                "To import in the website:\n" +
                "  Data Management → Backup & Restore → Import Data\n" +
                "  Select this file. It will be assigned to a new pilot.\n" +
                "  You can rename/merge pilots on the website.",
                "Export Complete", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Export failed: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    // ─── Window chrome ────────────────────────────────────────────────────────

    private void TitleBar_MouseDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
            return;
        }
        if (e.ChangedButton == MouseButton.Left) DragMove();
    }

    private void BtnMinimize_Click(object sender, RoutedEventArgs e)
    {
        if (_settings.MinimizeToTray) { Hide(); return; }
        WindowState = WindowState.Minimized;
    }

    private void BtnMaximize_Click(object sender, RoutedEventArgs e)
        => WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void BtnClose_Click(object sender, RoutedEventArgs e)
    {
        if (_settings.MinimizeToTray) { Hide(); return; }
        ShutdownApp();
    }

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        if (_settings.MinimizeToTray) { e.Cancel = true; Hide(); return; }
        ShutdownApp();
    }

    private void ShutdownApp()
    {
        SaveWindowGeometry();
        _monitor.Stop();
        _monitor.Dispose();
        _hwndSource?.RemoveHook(WndProc);
        if (new WindowInteropHelper(this).Handle != IntPtr.Zero)
            RemoveClipboardFormatListener(new WindowInteropHelper(this).Handle);
        Application.Current.Shutdown();
    }

    private void SaveWindowGeometry()
    {
        _settings.WindowLeft   = Left;
        _settings.WindowTop    = Top;
        _settings.WindowWidth  = Width;
        _settings.WindowHeight = Height;
        _store.SaveSettings(_settings);
    }

    private void RestoreWindowGeometry()
    {
        Left   = _settings.WindowLeft;
        Top    = _settings.WindowTop;
        Width  = _settings.WindowWidth;
        Height = _settings.WindowHeight;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void LogStatus(string msg)
    {
        TxtLastUpdate.Text = $"{DateTime.Now:HH:mm:ss}  {msg}";
        System.Diagnostics.Debug.WriteLine($"[WTTracker] {msg}");
    }

    private static string FormatK(long n)
    {
        if (n >= 1_000_000) return $"{n / 1_000_000.0:F1}M";
        if (n >= 1_000)     return $"{n / 1_000.0:F1}K";
        return n.ToString("N0");
    }
}

// ─── Simple timestamp picker dialog ──────────────────────────────────────────

public class TimestampDialog : Window
{
    private readonly DatePicker _dp = new() { Width = 160 };
    private readonly System.Windows.Controls.Primitives.TickBar _timePicker;
    private readonly TextBox _timeBox = new() { Width = 80, Text = DateTime.Now.ToString("HH:mm") };

    public DateTime? SelectedTimestamp { get; private set; }

    public TimestampDialog(DateTime? defaultTime = null)
    {
        Title           = "When did this battle happen?";
        Width           = 380; Height = 220;
        WindowStyle     = WindowStyle.ToolWindow;
        ResizeMode      = ResizeMode.NoResize;
        Background      = new SolidColorBrush(Color.FromRgb(0x11, 0x18, 0x20));
        WindowStartupLocation = WindowStartupLocation.CenterOwner;

        var dt = defaultTime ?? DateTime.Now.AddMinutes(-5);
        _dp.SelectedDate = dt;
        _timeBox.Text    = dt.ToString("HH:mm");
        _timeBox.Foreground = new SolidColorBrush(Color.FromRgb(0xe2, 0xe8, 0xf0));
        _timeBox.Background = new SolidColorBrush(Color.FromRgb(0x1a, 0x22, 0x33));
        _dp.Foreground  = new SolidColorBrush(Color.FromRgb(0xe2, 0xe8, 0xf0));

        var panel = new StackPanel { Margin = new Thickness(20) };

        panel.Children.Add(new TextBlock
        {
            Text = "Set the date and time the battle took place:", Margin = new Thickness(0, 0, 0, 12),
            FontFamily = new FontFamily("Segoe UI"), FontSize = 13,
            Foreground = new SolidColorBrush(Color.FromRgb(0x94, 0xa3, 0xb8)),
        });

        var row = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 20) };
        row.Children.Add(_dp);
        row.Children.Add(new TextBlock { Text = " at ", VerticalAlignment = VerticalAlignment.Center,
            Foreground = new SolidColorBrush(Color.FromRgb(0x64, 0x74, 0x8b)) });
        row.Children.Add(_timeBox);
        row.Children.Add(new TextBlock { Text = " (HH:mm)", VerticalAlignment = VerticalAlignment.Center,
            FontSize = 11, Foreground = new SolidColorBrush(Color.FromRgb(0x47, 0x55, 0x69)) });
        panel.Children.Add(row);

        var btnRow = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };
        var okBtn = new Button
        {
            Content = "Import Battle", Padding = new Thickness(16, 7, 16, 7),
            Background = new SolidColorBrush(Color.FromRgb(0xf5, 0x9e, 0x0b)),
            Foreground = new SolidColorBrush(Color.FromRgb(0x0d, 0x11, 0x17)),
            BorderThickness = new Thickness(0), Cursor = Cursors.Hand,
            FontFamily = new FontFamily("Rajdhani"), FontWeight = FontWeights.Bold, FontSize = 12, Margin = new Thickness(0, 0, 8, 0),
        };
        var skipBtn = new Button
        {
            Content = "Skip / Unknown Time", Padding = new Thickness(12, 7, 12, 7),
            Background = Brushes.Transparent, BorderBrush = new SolidColorBrush(Color.FromRgb(0x1f, 0x2a, 0x3d)),
            BorderThickness = new Thickness(1), Foreground = new SolidColorBrush(Color.FromRgb(0x64, 0x74, 0x8b)),
            Cursor = Cursors.Hand,
        };

        okBtn.Click   += (_, _) => { SelectedTimestamp = ParseTimestamp(); DialogResult = true; };
        skipBtn.Click += (_, _) => { SelectedTimestamp = null; DialogResult = true; };

        btnRow.Children.Add(okBtn);
        btnRow.Children.Add(skipBtn);
        panel.Children.Add(btnRow);

        Content = panel;
    }

    private DateTime? ParseTimestamp()
    {
        if (_dp.SelectedDate == null) return null;
        var datePart = _dp.SelectedDate.Value;
        if (TimeSpan.TryParse(_timeBox.Text, out var timePart))
            return datePart.Add(timePart).ToUniversalTime();
        return datePart.ToUniversalTime();
    }
}

// ─── Settings dialog ──────────────────────────────────────────────────────────

public class SettingsDialog : Window
{
    public AppSettings Settings { get; private set; }

    private CheckBox _chkAutoDetect  = new() { Content = "Auto-detect battles via WT API (localhost:8111)", IsChecked = true };
    private CheckBox _chkClipboard   = new() { Content = "Monitor clipboard for battle logs", IsChecked = true };
    private CheckBox _chkMinimize    = new() { Content = "Minimize to system tray (instead of closing)", IsChecked = true };
    private CheckBox _chkNotif       = new() { Content = "Show notifications when a battle is captured", IsChecked = true };
    private TextBox  _tbPilotName    = new() { Width = 200 };

    public SettingsDialog(AppSettings current)
    {
        Settings  = current;
        Title     = "Settings";
        Width = 460; Height = 360;
        WindowStyle = WindowStyle.ToolWindow;
        ResizeMode  = ResizeMode.NoResize;
        Background  = new SolidColorBrush(Color.FromRgb(0x11, 0x18, 0x20));
        WindowStartupLocation = WindowStartupLocation.CenterOwner;

        _chkAutoDetect.IsChecked   = current.AutoDetectEnabled;
        _chkClipboard.IsChecked    = current.ClipboardMonitor;
        _chkMinimize.IsChecked     = current.MinimizeToTray;
        _chkNotif.IsChecked        = current.ShowNotifications;
        _tbPilotName.Text          = current.DefaultPilotName;
        _tbPilotName.Background    = new SolidColorBrush(Color.FromRgb(0x1a, 0x22, 0x33));
        _tbPilotName.Foreground    = new SolidColorBrush(Color.FromRgb(0xe2, 0xe8, 0xf0));
        _tbPilotName.BorderBrush   = new SolidColorBrush(Color.FromRgb(0x1f, 0x2a, 0x3d));
        _tbPilotName.BorderThickness = new Thickness(1);
        _tbPilotName.Padding       = new Thickness(8, 5, 8, 5);

        foreach (var cb in new[] { _chkAutoDetect, _chkClipboard, _chkMinimize, _chkNotif })
        {
            cb.Foreground = new SolidColorBrush(Color.FromRgb(0xe2, 0xe8, 0xf0));
            cb.Margin     = new Thickness(0, 0, 0, 10);
        }

        var panel = new StackPanel { Margin = new Thickness(24) };
        panel.Children.Add(new TextBlock { Text = "SETTINGS", FontFamily = new FontFamily("Rajdhani"),
            FontSize = 18, FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(0xf5, 0x9e, 0x0b)), Margin = new Thickness(0, 0, 0, 16) });

        panel.Children.Add(new TextBlock { Text = "Export Pilot Name:", FontSize = 12, Margin = new Thickness(0, 0, 0, 4),
            Foreground = new SolidColorBrush(Color.FromRgb(0x94, 0xa3, 0xb8)) });
        panel.Children.Add(_tbPilotName);
        panel.Children.Add(new TextBlock { Text = "Used as the pilot name in exported JSON files.",
            FontSize = 10, Foreground = new SolidColorBrush(Color.FromRgb(0x47, 0x55, 0x69)), Margin = new Thickness(0, 2, 0, 16) });

        panel.Children.Add(_chkAutoDetect);
        panel.Children.Add(_chkClipboard);
        panel.Children.Add(_chkMinimize);
        panel.Children.Add(_chkNotif);

        var saveBtn = new Button
        {
            Content = "Save Settings", HorizontalAlignment = HorizontalAlignment.Right,
            Padding = new Thickness(16, 8, 16, 8), Margin = new Thickness(0, 12, 0, 0),
            Background = new SolidColorBrush(Color.FromRgb(0xf5, 0x9e, 0x0b)),
            Foreground = new SolidColorBrush(Color.FromRgb(0x0d, 0x11, 0x17)),
            BorderThickness = new Thickness(0), Cursor = Cursors.Hand,
            FontFamily = new FontFamily("Rajdhani"), FontWeight = FontWeights.Bold, FontSize = 13,
        };
        saveBtn.Click += (_, _) =>
        {
            Settings.AutoDetectEnabled = _chkAutoDetect.IsChecked == true;
            Settings.ClipboardMonitor  = _chkClipboard.IsChecked  == true;
            Settings.MinimizeToTray    = _chkMinimize.IsChecked    == true;
            Settings.ShowNotifications = _chkNotif.IsChecked       == true;
            Settings.DefaultPilotName  = _tbPilotName.Text.Trim();
            if (string.IsNullOrEmpty(Settings.DefaultPilotName)) Settings.DefaultPilotName = "Pilot";
            DialogResult = true;
        };
        panel.Children.Add(saveBtn);
        Content = panel;
    }
}