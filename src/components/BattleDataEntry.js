/**
 * BattleDataEntry.js  v6.0
 *
 * KEY CHANGES v6.0:
 * ─────────────────
 * PER-BATTLE TIMESTAMPS — The v5 bug where moving the global timestamp
 * slider would override ALL queued battles is FIXED. Now:
 *   • The global TacticalChronometer sets the DEFAULT time for the NEXT batch.
 *   • Once a battle is parsed and added to the queue, it has its OWN
 *     independent timestamp that can be edited inline on the card.
 *   • Changing the global clock never touches existing queue items.
 *
 * Other improvements:
 *   • Full-width layout (no max-width cap on outer container)
 *   • Per-card inline timestamp editor with expand/collapse
 *   • Better queue summary bar with animated counters
 *   • Session dedup displayed clearly
 *   • WTTheme-consistent throughout
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, Upload, Eye, Trash2, ChevronDown, ChevronUp,
  Target, Sword, DollarSign, Zap, Trophy, Clock, Award,
  Users, FileText, Edit, Calendar, AlertCircle, CheckCircle,
  History, ShieldCheck, Info, XCircle, RefreshCw,
  LayoutGrid, Terminal, BarChart3, Database, Save, Globe,
  Activity, ZapOff, ArrowRightLeft, Cpu, Check, X,
  Edit2, Timer, Lock,
} from 'lucide-react';

import { parseBattleLog }     from '../utils/battleParser';
import { notify }             from '../utils/notifications';
import { StyleInjector, WTSpinner, fmt, fmtK } from '../styles/wtTheme';
import VehicleIcon            from './VehicleIcon';
import CountryFlag            from './CountryFlag';
import ItemTypeIcon           from './ItemTypeIcon';
import BattlePreviewOverlay   from './BattlePreviewOverlay';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const T = {
  gold:     '#f59e0b',
  success:  '#22c55e',
  danger:   '#ef4444',
  info:     '#3b82f6',
  purple:   '#a855f7',
  muted:    '#64748b',
  mono:     "'Share Tech Mono', monospace",
  display:  "'Rajdhani', sans-serif",
  border:   'rgba(245,158,11,0.2)',
};

const PLACEHOLDER_LOG = `Victory in the [Domination] Sands of Sinai mission!

Destruction of ground targets    2    5100 SL     322 RP    
    2:05    T26E5    M82 shot    Panther A      200 mission points    1700 + (PA)850 = 2550 SL
    4:22    T26E5    M82 shot    Marder A1      200 mission points    1700 + (PA)850 = 2550 SL

Earned: 13021 SL, 1830 CRP
Activity: 85%
Session: 65cd43d00204bdd
Total: 12251 SL, 1830 CRP, 3477 RP`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateBattleHash = (text) => {
  const clean = text.replace(/\s+/g,'').slice(0,500);
  let h = 0;
  for (let i = 0; i < clean.length; i++) { h = ((h << 5) - h) + clean.charCodeAt(i); h |= 0; }
  return `hash_${Math.abs(h).toString(36)}`;
};

const validateLog = (text) => {
  const t = text.trim();
  if (!t) return { valid: false, reason: 'Empty input' };
  if (!/(Victory|Defeat) in the \[/.test(t)) return { valid: false, reason: 'Missing result header (Victory/Defeat)' };
  if (!/Earned:|Total:/.test(t)) return { valid: false, reason: 'Missing economy summary (SL/RP)' };
  return { valid: true };
};

// ─── TacticalChronometer — DEFAULT timestamp setter ───────────────────────────
// This sets the default time for the NEXT parsed batch.
// It does NOT retroactively change any already-queued battles.

const TacticalChronometer = ({ timestamp, onChange, label = 'Default Battle Timestamp' }) => {
  const d = useMemo(() => new Date(timestamp), [timestamp]);

  const update = (unit, val) => {
    const n = new Date(d);
    if (unit === 'y')   n.setFullYear(val);
    if (unit === 'm')   n.setMonth(val);
    if (unit === 'd')   n.setDate(val);
    if (unit === 'h')   n.setHours(val);
    if (unit === 'min') n.setMinutes(val);
    if (unit === 's')   n.setSeconds(val);
    onChange(n.toISOString());
  };

  const years   = Array.from({ length: 10 }, (_, i) => ({ v: 2024+i, l: 2024+i }));
  const months  = MONTHS.map((m, i) => ({ v: i, l: m.slice(0,3) }));
  const days    = Array.from({ length: 31 }, (_, i) => ({ v: i+1, l: String(i+1).padStart(2,'0') }));
  const hours   = Array.from({ length: 24 }, (_, i) => ({ v: i, l: String(i).padStart(2,'0') }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({ v: i, l: String(i).padStart(2,'00') }));
  const secs    = Array.from({ length: 60 }, (_, i) => ({ v: i, l: String(i).padStart(2,'00') }));

  const Sel = ({ lbl, value, options, unit }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 60 }}>
      <span style={{ fontSize: 9, color: T.muted, fontFamily: T.display, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</span>
      <select
        className="wt-select"
        value={value}
        onChange={e => update(unit, parseInt(e.target.value))}
        style={{ height: 34, padding: '0 8px', fontSize: 13, fontFamily: T.mono }}
      >
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, position: 'relative', overflow: 'hidden' }}>
      {/* Animated amber line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)', animation: 'wt-shimmer 3s linear infinite', backgroundSize: '200% 100%' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Timer size={15} style={{ color: T.gold }} />
          <span style={{ fontFamily: T.display, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: T.gold }}>
            {label}
          </span>
        </div>
        <button
          onClick={() => onChange(new Date().toISOString())}
          title="Sync to now"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <RefreshCw size={12} style={{ color: T.gold }} />
          <span style={{ fontSize: 10, color: T.gold, fontFamily: T.display, fontWeight: 700, textTransform: 'uppercase' }}>Now</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <Sel lbl="Year"  value={d.getFullYear()} options={years}   unit="y" />
        <Sel lbl="Month" value={d.getMonth()}     options={months}  unit="m" />
        <Sel lbl="Day"   value={d.getDate()}      options={days}    unit="d" />
        <Sel lbl="Hour"  value={d.getHours()}     options={hours}   unit="h" />
        <Sel lbl="Min"   value={d.getMinutes()}   options={minutes} unit="min" />
        <Sel lbl="Sec"   value={d.getSeconds()}   options={secs}    unit="s" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(245,158,11,0.05)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.1)' }}>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: '#e2e8f0' }}>
          {d.toLocaleDateString('en-GB')} — {d.toLocaleTimeString([], { hour12: false })}
        </span>
        <span style={{ fontSize: 9, color: T.success, fontFamily: T.mono, letterSpacing: '0.06em' }}>LOCAL TIME</span>
      </div>

      {/* Quick offsets */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {[{l:'-1h',m:-60},{l:'-15m',m:-15},{l:'-5m',m:-5},{l:'+5m',m:5},{l:'+15m',m:15}].map(({l,m}) => (
          <button key={l} onClick={() => { const n=new Date(d); n.setMinutes(n.getMinutes()+m); onChange(n.toISOString()); }}
            style={{ flex:1, height:22, fontSize:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:T.muted, borderRadius:4, cursor:'pointer', fontFamily:T.mono }}>
            {l}
          </button>
        ))}
      </div>

      {/* Clarification note */}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <Info size={12} style={{ color: T.muted, flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 10, color: '#334155', fontFamily: "'Exo 2'", lineHeight: 1.4 }}>
          This sets the timestamp for the <strong style={{ color: T.muted }}>next paste</strong> only. Each battle in the queue keeps its own timestamp and can be changed individually on the card.
        </span>
      </div>
    </div>
  );
};

// ─── Per-card inline timestamp editor ─────────────────────────────────────────
// This is what appears on each BattleIntelCard when you click "Edit Time".
// It only modifies THAT ONE battle's timestamp.

const CardTimestampEditor = ({ timestamp, onSave, onCancel }) => {
  const [ts, setTs] = useState(timestamp || new Date().toISOString());

  return (
    <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, margin: '8px 0', animation: 'wt-fade-in 0.25s ease' }}>
      <TacticalChronometer
        timestamp={ts}
        onChange={setTs}
        label="Edit This Battle's Timestamp"
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button className="wt-btn wt-btn-ghost" onClick={onCancel} style={{ height: 34, fontSize: 12 }}>
          <X size={13} /> Cancel
        </button>
        <button className="wt-btn wt-btn-primary" onClick={() => onSave(ts)} style={{ height: 34, fontSize: 12, background: '#3b82f6' }}>
          <Check size={13} /> Apply to this Battle
        </button>
      </div>
    </div>
  );
};

// ─── Queue summary bar ────────────────────────────────────────────────────────

const QueueSummary = ({ previews }) => {
  const totals = useMemo(() => previews.reduce((acc, p) => {
    if (p.status === 'success' && p.details) {
      acc.sl    += p.details.earnedSL || 0;
      acc.rp    += p.details.totalRP  || 0;
      acc.kills += (p.details.killsGround || 0) + (p.details.killsAircraft || 0);
      acc.count += 1;
    }
    return acc;
  }, { sl: 0, rp: 0, kills: 0, count: 0 }), [previews]);

  if (totals.count === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20, animation: 'wt-fade-in 0.4s ease' }}>
      {[
        { label: 'Battles',  val: totals.count,         icon: <LayoutGrid size={13} style={{ color: '#fff' }} />,         col: '#fff' },
        { label: 'Total SL', val: fmtK(totals.sl),       icon: <ItemTypeIcon type="sl" size="xs" />,                         col: T.gold },
        { label: 'Total RP', val: fmtK(totals.rp),       icon: <ItemTypeIcon type="rp" size="xs" />,                         col: T.purple },
        { label: 'Kills',    val: totals.kills,           icon: <Target size={13} style={{ color: T.danger }} />,            col: T.danger },
      ].map((s, i) => (
        <div key={s.label} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          {s.icon}
          <div>
            <div style={{ fontSize: 9, color: T.muted, fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: s.col, lineHeight: 1.1 }}>{s.val}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── BattleIntelCard — with per-battle timestamp editing ───────────────────────

const BattleIntelCard = ({ preview, index, expanded, onToggle, onDelete, onOpenOverlay, onUpdateTimestamp }) => {
  const [editingTs, setEditingTs] = useState(false);
  const d   = preview.details;
  const isErr = preview.status === 'error';
  const res   = (d?.result || 'unknown').toLowerCase();

  const resColor = res === 'victory' ? T.success : res === 'defeat' ? T.danger : T.muted;

  const vehicleList = d?.vehicles || [];
  const primaryVehicle = vehicleList.find(v => v.country === 'usa' || v.fromRegistry) || vehicleList[0];

  return (
    <div
      className={`wt-card`}
      style={{
        marginBottom: 8,
        animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
        borderLeft: `3px solid ${resColor}`,
        animation: 'wt-fade-in 0.35s ease both',
        overflow: 'hidden',
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>

        {/* Vehicle icon + flag */}
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          {primaryVehicle ? (
            <>
              <VehicleIcon vehicleName={primaryVehicle.displayName} size="lg" />
              <div style={{ position: 'absolute', bottom: -3, right: -3, border: '1px solid #0d1117', borderRadius: 2 }}>
                <CountryFlag country={primaryVehicle.country} size="xs" />
              </div>
            </>
          ) : (
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ZapOff size={18} style={{ opacity: 0.3 }} />
            </div>
          )}
        </div>

        {/* Battle info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            {/* Result badge */}
            <span style={{
              padding: '1px 7px', borderRadius: 4, fontSize: 9,
              fontFamily: T.display, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: `${resColor}18`, border: `1px solid ${resColor}40`, color: resColor,
            }}>
              {isErr ? '⚠ ERROR' : (d?.result || 'UNK').toUpperCase()}
            </span>

            {/* Mission name */}
            <span style={{ fontFamily: T.display, fontWeight: 800, fontSize: 14, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
              {d?.missionName || preview.summary || 'Unknown Battle'}
            </span>

            {/* Mission type chip */}
            {d?.missionType && (
              <span style={{ fontSize: 10, color: '#475569', fontFamily: T.mono, flexShrink: 0 }}>
                [{d.missionType}]
              </span>
            )}
          </div>

          {/* Economy row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ItemTypeIcon type="sl" size="xs" />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.gold }}>{fmtK(d?.earnedSL || 0)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ItemTypeIcon type="rp" size="xs" />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.purple }}>{fmtK(d?.totalRP || 0)}</span>
            </div>
            <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
            {/* Per-battle timestamp display */}
            <button
              onClick={() => setEditingTs(t => !t)}
              title="Edit this battle's timestamp"
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Clock size={11} style={{ color: editingTs ? '#3b82f6' : T.muted }} />
              <span style={{ fontFamily: T.mono, fontSize: 11, color: editingTs ? '#3b82f6' : T.muted }}>
                {d?.battleTimestamp
                  ? new Date(d.battleTimestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: false })
                  : '--/--/-- --:--'
                }
              </span>
              <Edit2 size={10} style={{ color: T.muted, opacity: 0.5 }} />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {!isErr && (
            <button className="wt-btn-icon info" onClick={() => onOpenOverlay(d)} title="Full preview" style={{ width: 30, height: 30 }}>
              <Eye size={14} />
            </button>
          )}
          <button className="wt-btn-icon" onClick={() => onToggle(preview.id)} title="Expand" style={{ width: 30, height: 30 }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button className="wt-btn-icon danger" onClick={() => onDelete(preview.id)} title="Remove" style={{ width: 30, height: 30 }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Per-battle timestamp editor */}
      {editingTs && (
        <div style={{ padding: '0 14px' }}>
          <CardTimestampEditor
            timestamp={d?.battleTimestamp || new Date().toISOString()}
            onSave={(newTs) => {
              onUpdateTimestamp(preview.id, newTs);
              setEditingTs(false);
            }}
            onCancel={() => setEditingTs(false)}
          />
        </div>
      )}

      {/* Expanded detail */}
      {expanded && !isErr && d && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'wt-slide-down 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, paddingTop: 14 }}>

            {/* Combat */}
            <div>
              <div style={{ fontSize: 9, color: T.danger, fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Combat</div>
              {[
                { l: 'Ground Kills',    v: d.killsGround,        c: T.gold },
                { l: 'Air Kills',       v: d.killsAircraft,      c: '#3b82f6' },
                { l: 'Assists',         v: d.assists,            c: T.success },
                { l: 'Severe Dmg',      v: d.severeDamage,       c: '#eab308' },
                { l: 'Critical Dmg',    v: d.criticalDamage,     c: T.danger },
                { l: 'Activity',        v: `${d.activity || 0}%`, c: '#e2e8f0' },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: T.muted, fontFamily: "'Exo 2'" }}>{row.l}</span>
                  <span style={{ fontFamily: T.mono, color: row.c, fontWeight: 700 }}>{row.v}</span>
                </div>
              ))}
            </div>

            {/* Economy */}
            <div>
              <div style={{ fontSize: 9, color: T.gold, fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Economy</div>
              {[
                { l: 'Earned SL',   v: fmt(d.earnedSL   || 0) },
                { l: 'Total SL',    v: fmt(d.totalSL    || 0) },
                { l: 'Total RP',    v: fmt(d.totalRP    || 0) },
                { l: 'CRP',         v: fmt(d.earnedCRP  || 0) },
                { l: 'Repair Cost', v: `−${fmt(Math.abs(d.autoRepairCost || 0))}` },
                { l: 'Ammo/Crew',   v: `−${fmt(Math.abs(d.autoAmmoCrewCost || 0))}` },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: T.muted, fontFamily: "'Exo 2'" }}>{row.l}</span>
                  <span style={{ fontFamily: T.mono, color: '#e2e8f0' }}>{row.v}</span>
                </div>
              ))}
            </div>

            {/* Vehicles */}
            {vehicleList.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: '#3b82f6', fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Vehicles ({vehicleList.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {vehicleList.slice(0, 5).map(v => (
                    <div key={v.displayName} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CountryFlag country={v.country} size="xs" />
                      <span style={{ fontFamily: "'Exo 2'", fontSize: 12, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.displayName}
                      </span>
                      {v.rank && (
                        <span style={{ fontSize: 9, color: T.muted, fontFamily: T.mono, flexShrink: 0 }}>
                          Rk.{v.rank}
                        </span>
                      )}
                    </div>
                  ))}
                  {vehicleList.length > 5 && (
                    <span style={{ fontSize: 10, color: T.muted, fontFamily: T.mono }}>+{vehicleList.length - 5} more</span>
                  )}
                </div>
              </div>
            )}

            {/* System */}
            <div>
              <div style={{ fontSize: 9, color: T.muted, fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>System Info</div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 9, color: T.muted, marginBottom: 2, textTransform: 'uppercase', fontFamily: T.display, letterSpacing: '0.08em' }}>Session Hash</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.session || 'N/A'}</div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 8, marginBottom: 2, textTransform: 'uppercase', fontFamily: T.display, letterSpacing: '0.08em' }}>Fingerprint</div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.fingerprint?.slice(0, 36) || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error detail */}
      {isErr && (
        <div style={{ padding: '8px 14px 12px', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
          <span style={{ fontSize: 12, color: T.danger, fontFamily: "'Exo 2'" }}>
            {preview.summary}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Terminal Log ─────────────────────────────────────────────────────────────

const TerminalLog = ({ logs }) => {
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  if (!logs.length) return null;

  const colorMap = { success: T.success, err: T.danger, warn: T.gold, info: '#3b82f6' };

  return (
    <div style={{ background: '#000', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Terminal size={12} style={{ color: T.muted }} />
        <span style={{ fontSize: 10, color: T.muted, fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Parse Log</span>
      </div>
      <div ref={logRef} style={{ maxHeight: 140, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {logs.slice(-30).map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, flexShrink: 0 }}>{l.time}</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: colorMap[l.type] || '#e2e8f0', lineHeight: 1.4 }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const BattleDataEntryComponent = ({
  users, selectedUserId, setSelectedUserId,
  battleDataInput, setBattleDataInput,
  handleProcessBattleData, loading,
}) => {
  // Queue of parsed previews
  const [queue, setQueue]               = useState([]);
  const [expandedId, setExpandedId]     = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overlayOpen, setOverlayOpen]   = useState(false);
  const [overlayBattle, setOverlayBattle] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  /**
   * GLOBAL DEFAULT TIMESTAMP — only applied when a NEW batch is parsed.
   * This is NOT synced back to existing queue items (that was the v5 bug).
   */
  const [defaultTimestamp, setDefaultTimestamp] = useState(() => new Date().toISOString());

  const addLog = (msg, type = 'info') => {
    setTerminalLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString([], { hour12: false }) }].slice(-80));
  };

  // ── Parse new paste ──
  // IMPORTANT: `defaultTimestamp` is captured at parse time via a ref/closure
  // and stored permanently on each battle. It is NOT in the deps array.
  // Changing the clock slider NEVER re-runs this effect or modifies the queue.
  const defaultTsRef = useRef(defaultTimestamp);
  useEffect(() => { defaultTsRef.current = defaultTimestamp; }, [defaultTimestamp]);

  useEffect(() => {
    if (!battleDataInput.trim() || isProcessing) return;

    setIsProcessing(true);
    addLog('Starting parse...', 'info');

    const capturedTs = defaultTsRef.current; // ← snapshot, never changes after this

    setTimeout(() => {
      try {
        const logs = battleDataInput
          .split(/(?=(?:Defeat|Victory) in the \[.+?\] .+? mission!)/g)
          .filter(l => l.trim());

        addLog(`Found ${logs.length} battle segment(s).`, 'info');

        const results = [];

        logs.forEach((raw, i) => {
          const validation = validateLog(raw);
          if (!validation.valid) {
            addLog(`Segment ${i+1} rejected: ${validation.reason}`, 'err');
            results.push({ id: `err-${Date.now()}-${i}`, status: 'error', summary: validation.reason, details: null, hash: generateBattleHash(raw) });
            return;
          }

          try {
            const parsed = parseBattleLog(raw);
            // Permanently stamp this battle with the captured timestamp.
            // It will only change if the user explicitly edits it on the card.
            parsed.battleTimestamp = capturedTs;
            addLog(`Parsed: ${parsed.result} on ${parsed.missionName}`, 'success');
            results.push({ id: parsed.id, status: 'success', summary: `${parsed.result} — ${parsed.missionName}`, details: parsed, hash: generateBattleHash(raw) });
          } catch (err) {
            addLog(`Parse error on segment ${i+1}: ${err.message}`, 'err');
            results.push({ id: `fail-${i}-${Date.now()}`, status: 'error', summary: `Parse error: ${err.message}`, details: null, hash: generateBattleHash(raw) });
          }
        });

        setQueue(prev => {
          const existingHashes = new Set(prev.map(p => p.hash));
          const fresh = results.filter(r => !existingHashes.has(r.hash));
          if (fresh.length < results.length) addLog(`Suppressed ${results.length - fresh.length} duplicate(s).`, 'warn');
          return [...prev, ...fresh];
        });

        setBattleDataInput('');
      } catch (err) {
        addLog(`Critical error: ${err.message}`, 'err');
        notify(`Parse failed: ${err.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleDataInput, isProcessing]);

  // ── Per-battle timestamp update ──
  // Called from BattleIntelCard when user saves an edited timestamp on ONE card.
  const handleUpdateTimestamp = useCallback((queueId, newTimestamp) => {
    setQueue(prev => prev.map(p =>
      p.id === queueId && p.details
        ? { ...p, details: { ...p.details, battleTimestamp: newTimestamp } }
        : p
    ));
    addLog(`Timestamp updated for ${queue.find(p => p.id === queueId)?.details?.missionName || 'battle'}.`, 'info');
  }, [queue]);

  // ── Commit queue to user's data ──
  const handleCommit = useCallback(() => {
    if (!selectedUserId) { notify('Select a pilot first.', 'error'); return; }
    const valid = queue.filter(p => p.status === 'success').map(p => p.details);
    if (!valid.length) return;
    addLog(`Committing ${valid.length} battles…`, 'info');
    handleProcessBattleData(valid);
    setQueue([]);
    addLog('Committed successfully.', 'success');
    notify(`${valid.length} battle(s) saved.`, 'success');
  }, [queue, selectedUserId, handleProcessBattleData]);

  const successCount = queue.filter(p => p.status === 'success').length;
  const errorCount   = queue.filter(p => p.status === 'error').length;
  const canCommit    = successCount > 0 && !loading && !isProcessing && !!selectedUserId && errorCount === 0;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <StyleInjector />

      {/* ── Top grid: User selector + Timestamp ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* User selector + pilot info */}
        <div>
          <div style={{ fontSize: 10, fontFamily: "'Rajdhani'", fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} /> Select Pilot
          </div>
          <select
            className="wt-select"
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            style={{ height: 46, fontSize: 14 }}
          >
            <option value="">— Choose pilot —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}{u.level ? ` (Lv. ${u.level})` : ''}
              </option>
            ))}
          </select>

          {selectedUserId && (() => {
            const u = users.find(u => u.id === selectedUserId);
            if (!u) return null;
            return (
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'wt-fade-in 0.3s ease' }}>
                {[
                  { l: 'Battles',   v: u.battles?.length || 0, c: T.gold },
                  { l: 'Victories', v: u.battles?.filter(b => b.result === 'Victory').length || 0, c: T.success },
                  { l: 'Level',     v: u.level || '—', c: '#e2e8f0' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 9, color: T.muted, fontFamily: "'Rajdhani'", textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 16, color: s.c, fontWeight: 700, lineHeight: 1 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {!selectedUserId && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6 }}>
              <AlertCircle size={13} style={{ color: T.danger, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: T.danger, fontFamily: "'Exo 2'" }}>Select a pilot to commit battles</span>
            </div>
          )}
        </div>

        {/* Default timestamp */}
        <div>
          <div style={{ fontSize: 10, fontFamily: "'Rajdhani'", fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} /> Default Timestamp for Next Paste
          </div>
          <TacticalChronometer
            timestamp={defaultTimestamp}
            onChange={setDefaultTimestamp}
          />
        </div>
      </div>

      {/* ── Textarea + controls ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontFamily: "'Rajdhani'", fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={12} /> Battle Log Input
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="wt-btn wt-btn-ghost"
              onClick={() => setShowTerminal(s => !s)}
              style={{ height: 28, fontSize: 11 }}
            >
              <Terminal size={12} /> {showTerminal ? 'Hide' : 'Show'} Log
            </button>
            {queue.filter(p => p.status === 'success').length > 0 && (
              <button
                className="wt-btn wt-btn-ghost"
                onClick={() => setShowJsonInspector(s => !s)}
                style={{ height: 28, fontSize: 11 }}
              >
                <Database size={12} /> JSON
              </button>
            )}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            className="wt-textarea"
            value={battleDataInput}
            onChange={e => setBattleDataInput(e.target.value)}
            placeholder={PLACEHOLDER_LOG}
            disabled={isProcessing}
            style={{
              width: '100%', minHeight: 260, resize: 'vertical',
              fontSize: 12, fontFamily: T.mono, padding: 16, lineHeight: 1.7,
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`,
              boxSizing: 'border-box',
            }}
          />
          {isProcessing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 8, zIndex: 10 }}>
              <WTSpinner size={32} />
              <span style={{ fontFamily: T.display, fontWeight: 800, color: T.gold, letterSpacing: '4px', fontSize: 14, textTransform: 'uppercase' }}>Scanning…</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 10, color: '#334155', fontFamily: T.mono }}>
            Paste one or more battle logs. Separate multiple battles — they'll be split automatically.
          </span>
          {battleDataInput.length > 0 && !isProcessing && (
            <button
              className="wt-btn wt-btn-ghost"
              onClick={() => setBattleDataInput('')}
              style={{ height: 26, fontSize: 11, color: T.muted }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Terminal log */}
      {showTerminal && <TerminalLog logs={terminalLogs} />}

      {/* JSON inspector */}
      {showJsonInspector && (
        <div style={{ background: '#000', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20, overflow: 'hidden', animation: 'wt-fade-in 0.25s ease' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#3b82f6', fontFamily: T.mono }}>[JSON_BUFFER]</span>
            <button onClick={() => setShowJsonInspector(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 12 }}>CLOSE</button>
          </div>
          <pre style={{ margin: 0, padding: '12px 16px', fontSize: 11, color: '#94a3b8', maxHeight: 280, overflowY: 'auto', fontFamily: T.mono, lineHeight: 1.5 }}>
            {JSON.stringify(queue.filter(p => p.status === 'success').map(p => p.details), null, 2)}
          </pre>
        </div>
      )}

      {/* ── Queue ── */}
      {queue.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 20, borderTop: '1px dashed rgba(255,255,255,0.08)', animation: 'wt-fade-in 0.4s ease' }}>
          <QueueSummary previews={queue} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart3 size={18} style={{ color: T.gold }} />
              <h3 style={{ margin: 0, fontFamily: T.display, fontSize: 18, color: '#e2e8f0', fontWeight: 800 }}>
                Pending Queue ({queue.length})
              </h3>
            </div>
            <button
              className="wt-btn wt-btn-ghost"
              onClick={() => { setQueue([]); addLog('Queue cleared.', 'warn'); }}
              style={{ height: 32, fontSize: 12, color: T.danger }}
            >
              <Trash2 size={13} /> Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
            {queue.map((p, i) => (
              <BattleIntelCard
                key={p.id}
                preview={p}
                index={i}
                expanded={expandedId === p.id}
                onToggle={id => setExpandedId(c => c === id ? null : id)}
                onDelete={id => setQueue(prev => prev.filter(x => x.id !== id))}
                onOpenOverlay={battle => { setOverlayBattle(battle); setOverlayOpen(true); }}
                onUpdateTimestamp={handleUpdateTimestamp}
              />
            ))}
          </div>

          {/* Commit bar */}
          <div style={{
            position: 'sticky', bottom: 16,
            padding: '18px 20px',
            background: 'rgba(13,17,23,0.97)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${canCommit ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 16, flexWrap: 'wrap',
            boxShadow: canCommit ? '0 0 24px rgba(245,158,11,0.1)' : 'none',
            transition: 'all 0.3s ease',
            zIndex: 40,
          }}>
            {/* Status counts */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: T.mono, fontSize: 22, color: '#fff', fontWeight: 800 }}>{successCount}</div>
                <div style={{ fontSize: 9, color: T.success, fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ready</div>
              </div>
              {errorCount > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 22, color: T.danger, fontWeight: 800 }}>{errorCount}</div>
                  <div style={{ fontSize: 9, color: T.danger, fontFamily: T.display, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Failed</div>
                </div>
              )}
              {!selectedUserId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.danger, fontSize: 11, fontFamily: T.mono }}>
                  <AlertCircle size={14} /> Select pilot first
                </div>
              )}
              {errorCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#eab308', fontSize: 11, fontFamily: "'Exo 2'" }}>
                  <AlertCircle size={14} /> Remove failed entries to commit
                </div>
              )}
            </div>

            <button
              className={`wt-btn ${canCommit ? 'wt-btn-primary' : 'wt-btn-ghost'}`}
              disabled={!canCommit}
              onClick={handleCommit}
              style={{ height: 52, padding: '0 36px', fontSize: 15, fontFamily: T.display, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', minWidth: 220 }}
            >
              {loading || isProcessing ? (
                <><WTSpinner size={18} /> Processing…</>
              ) : (
                <><Save size={18} /> Commit {successCount} Battle{successCount !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      <BattlePreviewOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        battle={overlayBattle}
        context="preview"
        onRemoveFromPreview={overlayBattle ? () => {
          setQueue(p => p.filter(x => x.details?.id !== overlayBattle.id));
          setOverlayOpen(false);
        } : undefined}
      />
    </div>
  );
};

export default BattleDataEntryComponent;