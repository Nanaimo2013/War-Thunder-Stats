using System.Windows;

namespace WTBattleTracker;

public partial class App : Application
{
    private System.Windows.Forms.NotifyIcon? _trayIcon;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Global exception handlers
        DispatcherUnhandledException += (s, ex) =>
        {
            MessageBox.Show($"An error occurred:\n\n{ex.Exception.Message}", "WTBattleTracker Error",
                MessageBoxButton.OK, MessageBoxImage.Error);
            ex.Handled = true;
        };

        // System tray icon
        _trayIcon = new System.Windows.Forms.NotifyIcon
        {
            Text    = "WT Battle Tracker",
            Visible = true,
        };

        // Load icon from embedded resource or use default
        try
        {
            var iconPath = Path.Combine(AppContext.BaseDirectory, "Assets", "icon.ico");
            if (File.Exists(iconPath))
                _trayIcon.Icon = new System.Drawing.Icon(iconPath);
            else
                _trayIcon.Icon = System.Drawing.SystemIcons.Application;
        }
        catch
        {
            _trayIcon.Icon = System.Drawing.SystemIcons.Application;
        }

        var menu = new System.Windows.Forms.ContextMenuStrip();

        var showItem = new System.Windows.Forms.ToolStripMenuItem("Show Tracker");
        showItem.Font = new System.Drawing.Font(showItem.Font, System.Drawing.FontStyle.Bold);
        showItem.Click += (_, _) => ShowMainWindow();

        var exitItem = new System.Windows.Forms.ToolStripMenuItem("Exit");
        exitItem.Click += (_, _) => Shutdown();

        menu.Items.Add(showItem);
        menu.Items.Add(new System.Windows.Forms.ToolStripSeparator());
        menu.Items.Add(exitItem);

        _trayIcon.ContextMenuStrip = menu;
        _trayIcon.DoubleClick      += (_, _) => ShowMainWindow();
    }

    private void ShowMainWindow()
    {
        if (MainWindow != null)
        {
            MainWindow.Show();
            MainWindow.WindowState = WindowState.Normal;
            MainWindow.Activate();
        }
    }

    public void ShowTrayNotification(string title, string message)
    {
        _trayIcon?.ShowBalloonTip(4000, title, message, System.Windows.Forms.ToolTipIcon.Info);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _trayIcon?.Dispose();
        base.OnExit(e);
    }
}