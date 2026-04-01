/**
 * DataManagementPage.js  v3.0
 * Full-width overhaul — WTTheme consistent, lazy-loaded sections,
 * rich backup/restore with V1/V2 breakdown, seamless navbar integration.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Users, Upload, Download, Settings, Plus, Shield,
  ChevronDown, ChevronUp, Database, Package, HardDrive,
  Check, AlertTriangle, Info, FileJson, FileArchive,
  Sword, Target, DollarSign, Zap, Clock, BarChart2,
  RefreshCw, Trash2, Lock, Unlock, CheckSquare, Square,
  ArrowRight, Eye, EyeOff, Copy, ExternalLink, Layers,
  Server, Wifi, WifiOff, Globe, Terminal,
} from 'lucide-react';
import { notify } from '../utils/notifications';
import {
  StyleInjector, SectionHeader, WTSpinner, EmptyState,
  useInView, THEME, fmt, fmtK,
} from '../styles/wtTheme';
import { LazySection } from '../utils/loading';
import UserProfileEditor from './UserProfileEditor';
import BattleDataEntryComponent from './BattleDataEntry';

// ─── Inline page styles ───────────────────────────────────────────────────────

const PAGE_STYLES = `
  .dm-page-header {
    background: linear-gradient(180deg,
      rgba(7,10,13,0.98) 0%,
      rgba(13,17,23,0.96) 60%,
      rgba(13,17,23,0.0) 100%
    );
    padding: 28px 32px 36px;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid rgba(245,158,11,0.1);
    margin-bottom: 0;
  }
  .dm-page-header::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%, rgba(245,158,11,0.5) 30%,
      rgba(251,191,36,0.8) 50%, rgba(245,158,11,0.5) 70%,
      transparent 100%
    );
    animation: wt-shimmer 4s linear infinite;
    background-size: 200% 100%;
  }
  .dm-page-header::after {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .dm-section-wrapper {
    border: 1px solid rgba(59,130,246,0.12);
    border-radius: 12px;
    background: var(--wt-bg-panel);
    overflow: hidden;
    margin-bottom: 16px;
    transition: border-color 0.22s ease, box-shadow 0.22s ease;
  }
  .dm-section-wrapper:hover {
    border-color: rgba(59,130,246,0.22);
    box-shadow: 0 0 24px rgba(59,130,246,0.04);
  }

  .dm-section-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    cursor: pointer;
    transition: background 0.18s ease;
    user-select: none;
    border-bottom: 1px solid transparent;
  }
  .dm-section-toggle:hover { background: rgba(59,130,246,0.03); }
  .dm-section-toggle.open { border-bottom-color: rgba(59,130,246,0.08); }

  .dm-stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
  }

  .dm-quick-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 20px;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(59,130,246,0.08);
    border-radius: 10px;
    min-width: 90px;
    transition: all 0.2s ease;
  }
  .dm-quick-stat:hover {
    border-color: rgba(59,130,246,0.2);
    background: rgba(59,130,246,0.04);
  }

  /* Export option checkbox */
  .dm-export-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(0,0,0,0.15);
    cursor: pointer;
    transition: all 0.18s ease;
  }
  .dm-export-option:hover {
    border-color: rgba(59,130,246,0.25);
    background: rgba(59,130,246,0.04);
  }
  .dm-export-option.checked {
    border-color: rgba(59,130,246,0.35);
    background: rgba(59,130,246,0.07);
  }

  /* Format card */
  .dm-format-card {
    border-radius: 10px;
    padding: 16px;
    border: 2px solid transparent;
    background: rgba(0,0,0,0.2);
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
  }
  .dm-format-card:hover { border-color: rgba(59,130,246,0.2); }
  .dm-format-card.selected {
    border-color: #3b82f6;
    background: rgba(59,130,246,0.06);
    box-shadow: 0 0 16px rgba(59,130,246,0.1);
  }

  /* Drop zone */
  .dm-drop-zone {
    border: 2px dashed rgba(59,130,246,0.25);
    border-radius: 10px;
    padding: 36px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.22s ease;
    background: rgba(0,0,0,0.1);
  }
  .dm-drop-zone:hover, .dm-drop-zone.drag-over {
    border-color: rgba(59,130,246,0.6);
    background: rgba(59,130,246,0.05);
    box-shadow: 0 0 20px rgba(59,130,246,0.08);
  }

  /* Storage bar */
  .dm-storage-bar {
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
  }
  .dm-storage-fill {
    height: 100%;
    border-radius: 3px;
    animation: wt-bar-grow 1s cubic-bezier(0.34,1.56,0.64,1) both;
    animation-delay: 0.3s;
  }
`;

// ─── Collapsible Section ─────────────────────────────────────────────────────

const Section = ({
  id, title, icon: Icon, color = '#f59e0b',
  children, defaultOpen = true, badge, sub,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [ref, vis] = useInView(0.05);

  return (
    <div
      ref={ref}
      className="dm-section-wrapper"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div
        className={`dm-section-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Color accent bar */}
          <div style={{
            width: 3, height: 24, background: color,
            borderRadius: 2, boxShadow: `0 0 8px ${color}88`, flexShrink: 0,
          }} />
          {/* Icon with glow circle */}
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}15`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {Icon && <Icon size={18} style={{ color }} />}
          </div>
          <div>
            <div style={{
              fontFamily: "'Rajdhani'", fontWeight: 800, fontSize: 16,
              color: '#e2e8f0', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>{title}</div>
            {sub && (
              <div style={{ fontSize: 11, color: '#475569', fontFamily: "'Exo 2'", marginTop: 1 }}>
                {sub}
              </div>
            )}
          </div>
          {badge !== undefined && (
            <span className="dm-stat-pill" style={{
              background: `${color}15`, border: `1px solid ${color}35`, color,
            }}>
              {badge}
            </span>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, color: '#475569',
        }}>
          <span style={{ fontSize: 11, fontFamily: "'Share Tech Mono'", letterSpacing: '0.06em' }}>
            {open ? 'COLLAPSE' : 'EXPAND'}
          </span>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.25s ease',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {open && (
        <div style={{ animation: 'wt-slide-down 0.3s cubic-bezier(0.4,0,0.2,1) both' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Format Comparison Card ───────────────────────────────────────────────────

const FormatCard = ({ id, selected, onClick, children }) => (
  <div className={`dm-format-card ${selected ? 'selected' : ''}`} onClick={() => onClick(id)}>
    {children}
  </div>
);

// ─── Export Option Row ────────────────────────────────────────────────────────

const ExportOption = ({ id, label, sub, icon: Icon, checked, onChange, color = '#f59e0b', disabled }) => (
  <div
    className={`dm-export-option ${checked ? 'checked' : ''}`}
    onClick={() => !disabled && onChange(id)}
    style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    <div style={{ marginTop: 2, flexShrink: 0 }}>
      {checked
        ? <CheckSquare size={18} style={{ color }} />
        : <Square size={18} style={{ color: '#475569' }} />
      }
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        {Icon && <Icon size={13} style={{ color, flexShrink: 0 }} />}
        <span style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      {sub && <p style={{ margin: 0, fontSize: 11, color: '#475569', fontFamily: "'Exo 2'", lineHeight: 1.4 }}>{sub}</p>}
    </div>
  </div>
);

// ─── Backup & Restore Section ─────────────────────────────────────────────────

const BackupRestoreSection = ({ users }) => {
  const [exportFormat, setExportFormat] = useState('v2');
  const [exportNotes, setExportNotes] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  // Per-category export options
  const [exportOptions, setExportOptions] = useState({
    userProfiles: true,
    battleData:   true,
    battleDetails: true,   // v2 only: detailed events arrays
    vehicleInfo:  true,    // v2 only: vehicle metadata
    fingerprints: true,    // v2 only: dedup indices
    metadata:     true,    // v2 only: timestamp, totals
  });

  const toggleOption = useCallback((id) => {
    setExportOptions(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const storageKB = (() => {
    try {
      const raw = sessionStorage.getItem('warThunderUsers') || '';
      return Math.round((raw.length * 2) / 1024);
    } catch { return 0; }
  })();

  const totalBattles = users.reduce((s, u) => s + (u.battles?.length || 0), 0);
  const storagePct   = Math.min((storageKB / 5120) * 100, 100); // 5MB quota estimate

  const generateFilename = () => {
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const note  = exportNotes.trim() ? `_${exportNotes.trim().replace(/[^a-zA-Z0-9]/g,'_').slice(0,20)}` : '';
    return `wt_stats_${exportFormat.toUpperCase()}_${stamp}${note}.json`;
  };

  const handleExport = useCallback(() => {
    try {
      const raw = sessionStorage.getItem('warThunderUsers');
      if (!raw) { notify('No data to export.', 'error'); return; }

      const usersData = JSON.parse(raw);

      if (exportFormat === 'v1') {
        // V1: bare array, minimal — just profile + battles summary
        const v1Data = usersData.map(u => ({
          id: u.id,
          name: u.name,
          title: u.title,
          level: u.level,
          gaijinId: u.gaijinId,
          rank: u.rank,
          favoriteVehicle: u.favoriteVehicle,
          squadron: u.squadron,
          battles: exportOptions.battleData ? u.battles : [],
        }));
        const blob = new Blob([JSON.stringify(v1Data, null, 2)], { type: 'application/json' });
        _downloadBlob(blob, generateFilename());
        notify(`V1 export complete — ${usersData.length} users, ${totalBattles} battles.`, 'success');
        return;
      }

      // V2: structured with metadata and configurable content
      const now = new Date().toISOString();
      const processedUsers = usersData.map(u => {
        const battles = exportOptions.battleData
          ? (u.battles || []).map(b => {
              const battle = { ...b };
              if (!exportOptions.battleDetails) {
                // Strip heavy detail arrays
                delete battle.kills;
                delete battle.assists_detail;
                delete battle.severeDamage_detail;
                delete battle.criticalDamage_detail;
                delete battle.damage_detail;
                delete battle.captures_detail;
                delete battle.awards_detail;
                delete battle.activityTime_detail;
                delete battle.timePlayed_detail;
                delete battle.skillBonus_detail;
                // Also old-format fields
                delete battle.detailedKills;
                delete battle.detailedAssists;
                delete battle.detailedSevereDamage;
                delete battle.detailedCriticalDamage;
                delete battle.detailedDamage;
                delete battle.detailedAwards;
                delete battle.detailedActivityTime;
                delete battle.detailedTimePlayed;
                delete battle.detailedSkillBonus;
              }
              if (!exportOptions.vehicleInfo) {
                delete battle.vehicles;
              }
              if (!exportOptions.fingerprints) {
                delete battle.fingerprint;
              }
              if (!exportOptions.metadata) {
                delete battle.parsedAt;
                delete battle.version;
              }
              return battle;
            })
          : [];

        const profile = exportOptions.userProfiles
          ? { id: u.id, name: u.name, title: u.title, level: u.level, gaijinId: u.gaijinId, rank: u.rank, favoriteVehicle: u.favoriteVehicle, squadron: u.squadron }
          : { id: u.id, name: u.name };

        return { ...profile, battles };
      });

      const v2Export = {
        metadata: {
          version:      '2.0',
          exportDate:   now,
          exportFormat: 'wt-stats-v2',
          notes:        exportNotes.trim() || null,
          application:  "War Thunder Stats Tracker by Nan's Studios",
          includedData: exportOptions,
          summary: {
            totalUsers:   usersData.length,
            totalBattles,
            storageKB,
          },
        },
        data: { users: processedUsers },
      };

      const blob = new Blob([JSON.stringify(v2Export, null, 2)], { type: 'application/json' });
      _downloadBlob(blob, generateFilename());
      notify(`V2 export complete — ${usersData.length} pilots, ${totalBattles} battles.`, 'success');
    } catch (e) {
      notify(`Export failed: ${e.message}`, 'error');
    }
  }, [exportFormat, exportNotes, exportOptions, users, totalBattles, storageKB]);

  const _downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processImportFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);

        // V2 format
        if (data.metadata?.version === '2.0' && data.data?.users) {
          const { totalUsers, totalBattles: tb } = data.metadata.summary || {};
          sessionStorage.setItem('warThunderUsers', JSON.stringify(data.data.users));
          setImportResult({
            ok: true,
            type: 'V2',
            notes: data.metadata.notes,
            users: totalUsers ?? data.data.users.length,
            battles: tb ?? 0,
            date: data.metadata.exportDate,
          });
          notify(`V2 import: ${data.data.users.length} pilots. Reloading…`, 'success');
          setTimeout(() => window.location.reload(), 1500);
          return;
        }

        // V1 format — bare array
        if (Array.isArray(data) && data.every(u => u.id && u.name)) {
          const battles = data.reduce((s, u) => s + (u.battles?.length || 0), 0);
          sessionStorage.setItem('warThunderUsers', JSON.stringify(data));
          setImportResult({ ok: true, type: 'V1', users: data.length, battles });
          notify(`V1 import: ${data.length} pilots. Reloading…`, 'success');
          setTimeout(() => window.location.reload(), 1500);
          return;
        }

        setImportResult({ ok: false, error: 'Unrecognised file format. Must be V1 or V2 export.' });
        notify('Invalid file format.', 'error');
      } catch (err) {
        setImportResult({ ok: false, error: err.message });
        notify(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = (e) => { processImportFile(e.target.files?.[0]); e.target.value = ''; };
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    processImportFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Storage indicator */}
      <div style={{
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245,158,11,0.08)',
        borderRadius: 10, padding: '16px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HardDrive size={20} style={{ color: '#f59e0b' }} />
          <span style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Session Storage</span>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div className="dm-storage-bar">
            <div className="dm-storage-fill" style={{
              width: `${storagePct}%`,
              background: storagePct > 80 ? '#ef4444' : storagePct > 60 ? '#f59e0b' : '#22c55e',
            }} />
          </div>
        </div>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color: '#f59e0b', flexShrink: 0 }}>
          {storageKB} KB / ~5 MB
        </span>
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'" }}>{users.length} pilots</span>
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'" }}>{totalBattles} battles</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

        {/* ── EXPORT ── */}
        <div>
          {/* Format selection */}
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} /> Export Data
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <FormatCard id="v2" selected={exportFormat === 'v2'} onClick={setExportFormat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileJson size={18} style={{ color: '#f59e0b' }} />
                <span style={{ fontFamily: "'Rajdhani'", fontWeight: 800, fontSize: 14, color: '#f59e0b', textTransform: 'uppercase' }}>V2 Format</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#22c55e', fontFamily: "'Rajdhani'", fontWeight: 700, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' }}>
                  Recommended
                </span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'", lineHeight: 1.6 }}>
                <li>Metadata envelope with export date, notes, summary</li>
                <li>Configurable content (see checkboxes below)</li>
                <li>Self-describing — easy to inspect</li>
                <li>Supports future migration tools</li>
              </ul>
            </FormatCard>

            <FormatCard id="v1" selected={exportFormat === 'v1'} onClick={setExportFormat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileArchive size={18} style={{ color: '#94a3b8' }} />
                <span style={{ fontFamily: "'Rajdhani'", fontWeight: 800, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase' }}>V1 Format</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#94a3b8', fontFamily: "'Rajdhani'", fontWeight: 700, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' }}>
                  Legacy
                </span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'", lineHeight: 1.6 }}>
                <li>Bare JSON array — smallest file size</li>
                <li>No metadata, limited content control</li>
                <li>Best for raw data transfer or debugging</li>
                <li>Always importable regardless of version</li>
              </ul>
            </FormatCard>
          </div>

          {/* Notes input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontFamily: "'Rajdhani'", fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Export Notes (optional)
            </label>
            <input
              type="text"
              className="wt-input"
              value={exportNotes}
              onChange={e => setExportNotes(e.target.value)}
              placeholder="e.g. pre-patch-backup, testing..."
              maxLength={40}
            />
          </div>

          {/* Content options (V2 only) */}
          {exportFormat === 'v2' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: "'Rajdhani'", fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Include in Export
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ExportOption
                  id="userProfiles"
                  label="Pilot Profiles"
                  sub="Name, level, Gaijin ID, rank, squadron, etc."
                  icon={Users}
                  checked={exportOptions.userProfiles}
                  onChange={toggleOption}
                  color="#f59e0b"
                  disabled={true} // Always included
                />
                <ExportOption
                  id="battleData"
                  label="Battle Records"
                  sub="All battle summary data (kills, SL, RP, result…)"
                  icon={Sword}
                  checked={exportOptions.battleData}
                  onChange={toggleOption}
                  color="#ef4444"
                />
                <ExportOption
                  id="battleDetails"
                  label="Detailed Combat Events"
                  sub="Individual kill/damage/capture event arrays — larger file"
                  icon={Target}
                  checked={exportOptions.battleDetails && exportOptions.battleData}
                  onChange={toggleOption}
                  color="#f97316"
                  disabled={!exportOptions.battleData}
                />
                <ExportOption
                  id="vehicleInfo"
                  label="Vehicle Metadata"
                  sub="Vehicle country, type, rank lookup data per battle"
                  icon={Shield}
                  checked={exportOptions.vehicleInfo && exportOptions.battleData}
                  onChange={toggleOption}
                  color="#3b82f6"
                  disabled={!exportOptions.battleData}
                />
                <ExportOption
                  id="fingerprints"
                  label="Dedup Fingerprints"
                  sub="Session hashes to prevent duplicate imports"
                  icon={Lock}
                  checked={exportOptions.fingerprints && exportOptions.battleData}
                  onChange={toggleOption}
                  color="#a855f7"
                  disabled={!exportOptions.battleData}
                />
                <ExportOption
                  id="metadata"
                  label="Parse Metadata"
                  sub="parsedAt timestamp, version string per battle"
                  icon={Clock}
                  checked={exportOptions.metadata && exportOptions.battleData}
                  onChange={toggleOption}
                  color="#22c55e"
                  disabled={!exportOptions.battleData}
                />
              </div>
            </div>
          )}

          {/* Export button */}
          <button
            className="wt-btn wt-btn-primary"
            onClick={handleExport}
            style={{ width: '100%', justifyContent: 'center', height: 46 }}
          >
            <Download size={16} />
            Export to PC — {generateFilename().length > 30 ? generateFilename().slice(0,30)+'…' : generateFilename()}
          </button>
        </div>

        {/* ── IMPORT ── */}
        <div>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={13} /> Restore from Backup
          </div>

          {/* Format comparison table */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 16, overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily: "'Rajdhani'", fontSize: 12, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Format Comparison
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Feature', 'V1 Legacy', 'V2 Standard'].map((h, i) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'center', color: '#64748b', fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Metadata envelope', '✗', '✓'],
                  ['Export notes / date', '✗', '✓'],
                  ['Battle detail events', '✓', 'Optional'],
                  ['Vehicle metadata', 'Basic', '✓ Full'],
                  ['Dedup fingerprints', '✗', 'Optional'],
                  ['Import compatibility', '✓', '✓'],
                  ['File size', 'Smallest', 'Configurable'],
                ].map(([feat, v1, v2], i) => (
                  <tr key={feat} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '7px 12px', color: '#94a3b8', fontFamily: "'Exo 2'" }}>{feat}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'center', color: v1 === '✓' ? '#22c55e' : v1 === '✗' ? '#ef4444' : '#f59e0b', fontFamily: "'Share Tech Mono'" }}>{v1}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'center', color: v2 === '✓' || v2 === '✓ Full' ? '#22c55e' : v2 === '✗' ? '#ef4444' : '#f59e0b', fontFamily: "'Share Tech Mono'" }}>{v2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Drop zone */}
          <div
            className={`dm-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ marginBottom: 12 }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <Upload size={28} style={{ color: '#f59e0b', marginBottom: 10, opacity: dragOver ? 1 : 0.5 }} />
            <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 14, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {dragOver ? 'Drop to Import' : 'Drop JSON here or click to browse'}
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: "'Exo 2'" }}>
              Supports V1 and V2 export files. Accepts .json only.
            </div>
          </div>

          {/* Import result */}
          {importResult && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 12,
              background: importResult.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${importResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              animation: 'wt-fade-in 0.35s ease both',
            }}>
              {importResult.ok ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Check size={14} style={{ color: '#22c55e' }} />
                    <span style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, color: '#22c55e', textTransform: 'uppercase' }}>
                      {importResult.type} Import Successful
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'" }}>
                    {importResult.users} pilots · {importResult.battles} battles
                    {importResult.notes && ` · "${importResult.notes}"`}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', fontFamily: "'Share Tech Mono'", marginTop: 4 }}>
                    Reloading page…
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, color: '#ef4444', textTransform: 'uppercase' }}>Import Failed</span>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'" }}>{importResult.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8 }}>
            <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'Exo 2'", lineHeight: 1.5 }}>
              Importing will <strong style={{ color: '#f59e0b' }}>overwrite all current data</strong> and reload the page. Back up first if needed.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const DataManagementPage = ({
  users, setUsers,
  selectedUserId, setSelectedUserId,
  battleDataInput, setBattleDataInput,
  handleProcessBattleData, loading,
}) => {
  const totalBattles  = users.reduce((s, u) => s + (u.battles?.length || 0), 0);
  const totalVictories = users.reduce((s, u) => s + (u.battles?.filter(b => b.result === 'Victory')?.length || 0), 0);

  const [headerRef, headerVis] = useInView(0.05);

  return (
    <div className="wt-page wt-hex-bg" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <StyleInjector />
      <style>{PAGE_STYLES}</style>

      {/* ── Page Header — tight to navbar ─────────────────────────────────── */}
      <div
        ref={headerRef}
        className="dm-page-header"
        style={{
          opacity: headerVis ? 1 : 0,
          transform: headerVis ? 'none' : 'translateY(-12px)',
          transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Background hex dots */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.04) 1px, transparent 0)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '100%' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))',
                border: '1px solid rgba(59,130,246,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(59,130,246,0.15)',
              }}>
                <Settings size={24} style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }} />
              </div>
              {/* Pulsing ring */}
              <div style={{ position: 'absolute', inset: -4, border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, animation: 'wt-pulse-blue 2.5s ease-in-out infinite' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1
                  className="wt-display"
                  style={{ margin: 0, fontSize: 28, color: '#60a5fa', letterSpacing: '0.06em', lineHeight: 1 }}
                >
                  DATA MANAGEMENT
                </h1>
                <span style={{ fontSize: 10, color: '#475569', fontFamily: "'Share Tech Mono'", letterSpacing: '0.12em', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 4, padding: '2px 8px', textTransform: 'uppercase' }}>
                  v3.0
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#475569', fontFamily: "'Share Tech Mono'", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                PROFILES · BATTLE IMPORT · BACKUP &amp; RESTORE
              </p>
            </div>
          </div>

          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Pilots',    value: users.length,    icon: Users,    color: '#60a5fa' },
              { label: 'Battles',   value: totalBattles,    icon: Sword,    color: '#3b82f6' },
              { label: 'Victories', value: totalVictories,  icon: Check,    color: '#22c55e' },
              { label: 'Defeats',   value: totalBattles - totalVictories, icon: Target, color: '#ef4444' },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div
                key={label}
                className="dm-quick-stat"
                style={{
                  opacity: headerVis ? 1 : 0,
                  transform: headerVis ? 'none' : 'translateY(10px)',
                  transition: `all 0.45s ease ${0.1 + i * 0.07}s`,
                }}
              >
                <Icon size={16} style={{ color }} />
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 20, color, fontWeight: 700, lineHeight: 1 }}>
                  {value}
                </span>
                <span style={{ fontSize: 9, color: '#475569', fontFamily: "'Rajdhani'", fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {label}
                </span>
              </div>
            ))}

            {/* API status indicator */}
            <div className="dm-quick-stat" style={{ borderColor: 'rgba(100,116,139,0.15)', opacity: 0.7 }}>
              <WifiOff size={16} style={{ color: '#475569' }} />
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: '#475569', fontWeight: 700, lineHeight: 1, textAlign: 'center' }}>
                LOCAL
              </span>
              <span style={{ fontSize: 9, color: '#334155', fontFamily: "'Rajdhani'", fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Storage
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Content — full width ──────────────────────────────────────── */}
      <div style={{ padding: '20px 24px' }}>

        {/* Pilot Profiles */}
        <Section
          id="profiles"
          title="Pilot Profiles"
          icon={Users}
          color="#60a5fa"
          badge={users.length}
          sub="Manage pilot identities and profile metadata"
          defaultOpen={true}
        >
          <div style={{ padding: '0 0 4px' }}>
            <UserProfileEditor
              users={users}
              setUsers={setUsers}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
            />
          </div>
        </Section>

        {/* Battle Data Entry */}
        <Section
          id="battle-entry"
          title="Add Battle Data"
          icon={Database}
          color="#3b82f6"
          sub="Paste battle logs, set timestamps per-battle, commit to records"
          defaultOpen={true}
        >
          <BattleDataEntryComponent
            users={users}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            battleDataInput={battleDataInput}
            setBattleDataInput={setBattleDataInput}
            handleProcessBattleData={handleProcessBattleData}
            loading={loading}
          />
        </Section>

        {/* Backup & Restore */}
        <Section
          id="backup"
          title="Backup & Restore"
          icon={Package}
          color="#22c55e"
          sub="Export to PC, import from file — V1 legacy &amp; V2 structured formats"
          defaultOpen={false}
        >
          <BackupRestoreSection users={users} />
        </Section>

      </div>
    </div>
  );
};

export default DataManagementPage;