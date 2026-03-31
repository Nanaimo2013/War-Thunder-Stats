/**
 * BattleLogsPage.js
 *
 * v3.0 — Full redesign.
 * - WTTheme styling consistent with StatsPage
 * - Load-more pattern (20 at a time, auto-load on scroll)
 * - Dual dates: battleTimestamp (when it happened) + parsedAt (when uploaded)
 * - Working filters: result, search, mission type, date range, sort
 * - Card layout with full-width use of the page
 * - Icons for SL/RP/CRP from assetManager
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  FileText, Trash2, Edit2, Eye, ArrowUp, ArrowDown,
  Calendar, Hash, Map, Swords, Plane, Search, X,
  ChevronDown, Filter, Clock, CheckCircle, XCircle,
  AlertTriangle, Target, Shield, Activity, TrendingUp,
  BarChart2, Users, RefreshCw,
} from 'lucide-react';
import { notify } from '../utils/notifications';
import { StyleInjector, ResultBadge, SectionHeader, EmptyState, fmt, fmtK } from '../styles/wtTheme';
import { usePagination, WTLoadMoreTrigger, WTLoadMoreButton, LazySection, WTSkeletonList } from '../utils/loading';
import ItemTypeIcon from './ItemTypeIcon';
import BattlePreviewOverlay from './BattlePreviewOverlay';

const PAGE_SIZE = 20;

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the "battle happened" date from a battle object.
 * Prefers battleTimestamp, falls back to timestamp (legacy), then parsedAt.
 */
function getBattleDate(battle) {
  const raw = battle.battleTimestamp || battle.timestamp || null;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getUploadDate(battle) {
  const raw = battle.parsedAt || null;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function fmtDate(d, opts = {}) {
  if (!d) return 'Unknown';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', ...opts });
}

function fmtDateTime(d) {
  if (!d) return null;
  return {
    date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
    relative: relativeTime(d),
  };
}

function relativeTime(d) {
  const diff = Date.now() - d.getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 1)    return 'just now';
  if (min < 60)   return `${min}m ago`;
  if (hr  < 24)   return `${hr}h ago`;
  if (day < 7)    return `${day}d ago`;
  if (day < 365)  return `${Math.floor(day/7)}w ago`;
  return `${Math.floor(day/365)}y ago`;
}

// ─── Battle card ──────────────────────────────────────────────────────────────

const BattleCard = React.memo(({ battle, index, onView, onEdit, onDelete }) => {
  const battleDate = getBattleDate(battle);
  const uploadDate = getUploadDate(battle);
  const bdFmt = fmtDateTime(battleDate);
  const udFmt = fmtDateTime(uploadDate);

  const resultCls = battle.result === 'Victory' ? 'victory' : battle.result === 'Defeat' ? 'defeat' : 'unknown';
  const totalKills = (battle.killsAircraft || 0) + (battle.killsGround || 0);

  return (
    <LazySection>
      <div
        className={`wt-battle-card ${resultCls}`}
        style={{ animation: `wt-fade-in 0.3s ease ${Math.min(index,10) * 0.03}s both` }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
          {/* ── Left: result + mission ── */}
          <div style={{ flex: '1 1 220px', padding: '14px 16px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ResultBadge result={battle.result || 'Unknown'} />
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: '#475569' }}>
                #{index + 1}
              </span>
            </div>

            <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 16, color: '#e2e8f0', marginBottom: 3, lineHeight: 1.2 }}>
              {battle.missionName || 'Unknown Mission'}
            </div>

            {battle.missionType && (
              <div style={{ fontSize: 11, color: '#475569', fontFamily: "'Share Tech Mono'", marginBottom: 8 }}>
                [{battle.missionType}]
              </div>
            )}

            {/* Battle date */}
            {bdFmt ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Calendar size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ color: '#e2e8f0', fontFamily: "'Exo 2'", fontWeight: 600 }}>
                    {bdFmt.date}
                  </span>
                  <span style={{ color: '#64748b' }}>{bdFmt.time}</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', paddingLeft: 17, fontFamily: "'Share Tech Mono'" }}>
                  {bdFmt.relative}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                <Calendar size={11} />
                <span style={{ fontFamily: "'Exo 2'" }}>Date not set</span>
              </div>
            )}

            {/* Upload date (smaller) */}
            {udFmt && (
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#334155' }}>
                <Clock size={10} />
                <span style={{ fontFamily: "'Exo 2'" }}>Logged {udFmt.relative}</span>
              </div>
            )}
          </div>

          {/* ── Middle: combat stats ── */}
          <div style={{ flex: '1 1 180px', padding: '14px 16px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
              Combat
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: <Target size={12} style={{ color: '#ef4444' }} />, label: 'Ground', val: battle.killsGround || 0, color: '#ef4444' },
                { icon: <Plane size={12} style={{ color: '#3b82f6' }} />, label: 'Air',    val: battle.killsAircraft || 0, color: '#3b82f6' },
                { icon: <Shield size={12} style={{ color: '#22c55e' }} />, label: 'Assists', val: battle.assists || 0, color: '#22c55e' },
              ].map(({ icon, label, val, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {icon}
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'", flex: 1 }}>{label}</span>
                  <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 14, color, fontWeight: 700 }}>{val}</span>
                </div>
              ))}

              {/* Kills bar */}
              {totalKills > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 3, height: 5, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                    {battle.killsGround > 0 && (
                      <div style={{ flex: battle.killsGround, background: '#ef4444', borderRadius: 3, transition: 'flex 0.4s ease' }} />
                    )}
                    {battle.killsAircraft > 0 && (
                      <div style={{ flex: battle.killsAircraft, background: '#3b82f6', borderRadius: 3, transition: 'flex 0.4s ease' }} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: economy ── */}
          <div style={{ flex: '1 1 180px', padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
              Economy
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { type: 'warpoints', val: battle.earnedSL || 0, color: '#f59e0b', label: 'SL' },
                { type: 'rp',        val: battle.totalRP  || 0, color: '#a855f7', label: 'RP' },
                { type: 'crp',       val: battle.earnedCRP|| 0, color: '#7c3aed', label: 'CRP' },
              ].filter(r => r.val > 0 || r.label === 'SL').map(({ type, val, color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ItemTypeIcon type={type} size="xs" />
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'", flex: 1 }}>{label}</span>
                  <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color, fontWeight: 700 }}>
                    {fmtK(val)}
                  </span>
                </div>
              ))}

              {(battle.activity > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Activity size={12} style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'", flex: 1 }}>Activity</span>
                  <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color: '#22c55e', fontWeight: 700 }}>
                    {battle.activity}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Action bar ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 4,
          background: 'rgba(0,0,0,0.1)',
        }}>
          <button className="wt-btn-icon info" onClick={() => onView(battle)} title="View details">
            <Eye size={15} />
          </button>
          <button className="wt-btn-icon" onClick={() => onEdit(battle)} title="Edit">
            <Edit2 size={15} />
          </button>
          <button className="wt-btn-icon danger" onClick={() => onDelete()} title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </LazySection>
  );
});

// ─── Filters panel ────────────────────────────────────────────────────────────

const FiltersPanel = React.memo(({ filters, onChange, missionTypes, onReset }) => {
  return (
    <div className="wt-filter-bar">
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 200px' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input
          className="wt-input"
          value={filters.search}
          onChange={e => onChange('search', e.target.value)}
          placeholder="Search mission name..."
          style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: 13 }}
        />
        {filters.search && (
          <button
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}
            onClick={() => onChange('search', '')}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Result filter */}
      <div style={{ display: 'flex', gap: 4 }}>
        {['All', 'Victory', 'Defeat', 'Unknown'].map(r => (
          <button
            key={r}
            className={`wt-filter-pill ${filters.result === r ? (r === 'Victory' ? 'active victory' : r === 'Defeat' ? 'active defeat' : 'active') : ''}`}
            onClick={() => onChange('result', r)}
          >
            {r === 'Victory' ? '✓' : r === 'Defeat' ? '✗' : r === 'Unknown' ? '?' : '▤'} {r}
          </button>
        ))}
      </div>

      {/* Mission type */}
      {missionTypes.length > 0 && (
        <select
          className="wt-select"
          value={filters.missionType}
          onChange={e => onChange('missionType', e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto', minWidth: 160, paddingTop: 7, paddingBottom: 7 }}
        >
          <option value="">All Mission Types</option>
          {missionTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}

      {/* Date range */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: '0 0 auto' }}>
        <input
          type="date"
          className="wt-input"
          value={filters.dateFrom}
          onChange={e => onChange('dateFrom', e.target.value)}
          style={{ width: 140, paddingTop: 7, paddingBottom: 7 }}
          title="Battle date from"
        />
        <span style={{ color: '#475569', fontSize: 11 }}>→</span>
        <input
          type="date"
          className="wt-input"
          value={filters.dateTo}
          onChange={e => onChange('dateTo', e.target.value)}
          style={{ width: 140, paddingTop: 7, paddingBottom: 7 }}
          title="Battle date to"
        />
      </div>

      {/* Reset */}
      <button className="wt-btn-icon" onClick={onReset} title="Reset filters">
        <RefreshCw size={14} />
      </button>
    </div>
  );
});

// ─── Sort bar ─────────────────────────────────────────────────────────────────

const SortBar = React.memo(({ sortColumn, sortDir, onSort }) => {
  const options = [
    { id: 'battleDate', label: 'Battle Date', icon: Calendar },
    { id: 'result',     label: 'Result',      icon: CheckCircle },
    { id: 'kills',      label: 'Kills',       icon: Target },
    { id: 'sl',         label: 'SL',          icon: null },
    { id: 'rp',         label: 'RP',          icon: null },
    { id: 'activity',   label: 'Activity',    icon: Activity },
    { id: 'parsedAt',   label: 'Upload Date', icon: Clock },
  ];

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 11, color: '#475569', fontFamily: "'Rajdhani'", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>
        Sort:
      </span>
      {options.map(({ id, label, icon: Icon }) => {
        const active = sortColumn === id;
        return (
          <button
            key={id}
            onClick={() => onSort(id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 4,
              fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: 11,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: 'pointer',
              background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: active ? '#f59e0b' : '#64748b',
              transition: 'all 0.18s ease',
            }}
          >
            {Icon && <Icon size={10} />}
            {label}
            {active && (sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
          </button>
        );
      })}
    </div>
  );
});

// ─── Delete confirm modal ─────────────────────────────────────────────────────

const DeleteConfirm = ({ onConfirm, onCancel }) => (
  <div className="wt-modal-overlay">
    <div className="wt-modal" style={{ maxWidth: 420, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
      <h3 className="wt-display" style={{ fontSize: 20, color: '#e2e8f0', marginBottom: 8 }}>Delete Battle Log?</h3>
      <p style={{ fontSize: 13, color: '#64748b', fontFamily: "'Exo 2'", marginBottom: 24, lineHeight: 1.5 }}>
        This action cannot be undone. The battle log will be permanently removed.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="wt-btn wt-btn-danger" onClick={onConfirm} style={{ minWidth: 100 }}>Delete</button>
        <button className="wt-btn wt-btn-ghost" onClick={onCancel} style={{ minWidth: 100 }}>Cancel</button>
      </div>
    </div>
  </div>
);

// ─── Stats bar ────────────────────────────────────────────────────────────────

const StatsBar = React.memo(({ battles }) => {
  const wins   = battles.filter(b => b.result === 'Victory').length;
  const losses = battles.filter(b => b.result === 'Defeat').length;
  const wr     = battles.length > 0 ? (wins / battles.length * 100).toFixed(1) : '0';
  const totalSL = battles.reduce((s, b) => s + (b.earnedSL || 0), 0);
  const totalRP = battles.reduce((s, b) => s + (b.totalRP || 0), 0);
  const totalKills = battles.reduce((s, b) => s + (b.killsGround || 0) + (b.killsAircraft || 0), 0);

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 12,
      padding: '12px 18px',
      background: 'rgba(245,158,11,0.03)',
      border: '1px solid rgba(245,158,11,0.08)',
      borderRadius: 8,
      marginBottom: 16,
    }}>
      {[
        { label: 'Showing', val: battles.length, color: '#f59e0b' },
        { label: 'Win Rate', val: `${wr}%`, color: wins > losses ? '#22c55e' : '#ef4444' },
        { label: 'Total Kills', val: fmtK(totalKills), color: '#ef4444' },
        { label: 'Total SL', val: fmtK(totalSL), color: '#f59e0b' },
        { label: 'Total RP', val: fmtK(totalRP), color: '#a855f7' },
      ].map(({ label, val, color }) => (
        <div key={label} style={{ display: 'flex', flex: '0 1 auto', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#475569', fontFamily: "'Rajdhani'", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 15, color, fontWeight: 700 }}>{val}</span>
        </div>
      ))}
    </div>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────

const INITIAL_FILTERS = {
  search: '',
  result: 'All',
  missionType: '',
  dateFrom: '',
  dateTo: '',
};

const BattleLogsPage = ({ users, setUsers, selectedUserId, setSelectedUserId }) => {
  const [sortColumn, setSortColumn] = useState('battleDate');
  const [sortDir,    setSortDir]    = useState('desc');
  const [filters,    setFilters]    = useState(INITIAL_FILTERS);
  const [confirmIdx, setConfirmIdx] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayBattle, setOverlayBattle] = useState(null);
  const [overlayMode, setOverlayMode] = useState('view');
  const [overlayIndex, setOverlayIndex] = useState(null);

  const currentUser = users.find(u => u.id === selectedUserId);
  const battles = currentUser?.battles || [];

  // Unique mission types for filter dropdown
  const missionTypes = useMemo(() =>
    [...new Set(battles.map(b => b.missionType).filter(Boolean))].sort(),
  [battles]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...battles];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(b =>
        (b.missionName || '').toLowerCase().includes(q) ||
        (b.missionType || '').toLowerCase().includes(q) ||
        (b.session || '').toLowerCase().includes(q)
      );
    }

    // Result
    if (filters.result !== 'All') {
      list = list.filter(b => (b.result || 'Unknown') === filters.result);
    }

    // Mission type
    if (filters.missionType) {
      list = list.filter(b => b.missionType === filters.missionType);
    }

    // Date range (battle date)
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      list = list.filter(b => {
        const d = getBattleDate(b);
        return d && d >= from;
      });
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter(b => {
        const d = getBattleDate(b);
        return d && d <= to;
      });
    }

    // Sort
    list.sort((a, b) => {
      let va, vb;
      switch (sortColumn) {
        case 'battleDate':
          va = (getBattleDate(a) || new Date(0)).getTime();
          vb = (getBattleDate(b) || new Date(0)).getTime();
          break;
        case 'parsedAt':
          va = new Date(a.parsedAt || 0).getTime();
          vb = new Date(b.parsedAt || 0).getTime();
          break;
        case 'result': {
          const ord = { Victory: 2, Defeat: 1, Unknown: 0 };
          va = ord[a.result] ?? 0;
          vb = ord[b.result] ?? 0;
          break;
        }
        case 'kills':
          va = (a.killsGround || 0) + (a.killsAircraft || 0);
          vb = (b.killsGround || 0) + (b.killsAircraft || 0);
          break;
        case 'sl':       va = a.earnedSL || 0;  vb = b.earnedSL || 0;  break;
        case 'rp':       va = a.totalRP  || 0;  vb = b.totalRP  || 0;  break;
        case 'activity': va = a.activity || 0;  vb = b.activity || 0;  break;
        default:         return 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [battles, filters, sortColumn, sortDir]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const { visible, hasMore, loadMore, total } = usePagination(filtered, PAGE_SIZE);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSort = useCallback((col) => {
    setSortColumn(prev => {
      if (prev === col) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('desc');
      return col;
    });
  }, []);

  const handleDelete = useCallback((globalIndex) => {
    setConfirmIdx(globalIndex);
  }, []);

  const confirmDelete = useCallback(() => {
    if (confirmIdx === null) return;
    setUsers(prev => prev.map(u => {
      if (u.id !== selectedUserId) return u;
      const nb = [...u.battles];
      nb.splice(confirmIdx, 1);
      return { ...u, battles: nb };
    }));
    notify('Battle log deleted.', 'success');
    setConfirmIdx(null);
  }, [confirmIdx, selectedUserId, setUsers]);

  const handleView = useCallback((battle) => {
    const idx = battles.indexOf(battle);
    setOverlayMode('view');
    setOverlayIndex(idx >= 0 ? idx : null);
    setOverlayBattle(battle);
    setOverlayOpen(true);
  }, [battles]);

  const handleEdit = useCallback((battle) => {
    const idx = battles.indexOf(battle);
    setOverlayMode('edit');
    setOverlayIndex(idx >= 0 ? idx : null);
    setOverlayBattle(battle);
    setOverlayOpen(true);
  }, [battles]);

  const handleOverlaySave = useCallback((updated) => {
    if (overlayIndex == null) return;
    setUsers(prev => prev.map(u => {
      if (u.id !== selectedUserId) return u;
      const nb = [...u.battles];
      nb[overlayIndex] = { ...nb[overlayIndex], ...updated };
      return { ...u, battles: nb };
    }));
    notify('Battle updated.', 'success');
    setOverlayOpen(false);
  }, [overlayIndex, selectedUserId, setUsers]);

  const activeFilterCount = [
    filters.search,
    filters.result !== 'All' ? filters.result : '',
    filters.missionType,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <div className="wt-page wt-hex-bg" style={{ padding: '0 0 60px' }}>
      <StyleInjector />

      {/* Page header */}
      <div className="wt-page-header">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <FileText size={28} style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }} />
            </div>
            <div>
              <h1 className="wt-display wt-glow-amber" style={{ margin: 0, fontSize: 26, color: '#f59e0b', letterSpacing: '0.04em' }}>
                BATTLE LOGS
              </h1>
              <p style={{ margin: 0, fontSize: 11, color: '#475569', fontFamily: "'Share Tech Mono'", letterSpacing: '0.08em' }}>
                COMBAT HISTORY ARCHIVE
              </p>
            </div>
            {battles.length > 0 && (
              <div style={{ marginLeft: 'auto', fontFamily: "'Share Tech Mono'", fontSize: 13, color: '#475569' }}>
                {battles.length} <span style={{ color: '#f59e0b' }}>total</span>
              </div>
            )}
          </div>

          {/* Pilot selector */}
          <div style={{ maxWidth: 380 }}>
            <label style={{ display: 'block', fontFamily: "'Rajdhani'", fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              ▸ SELECT PILOT
            </label>
            <select
              className="wt-select"
              value={selectedUserId || ''}
              onChange={e => setSelectedUserId(e.target.value)}
            >
              <option value="">— Select pilot —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px' }}>
        {/* No user selected */}
        {!selectedUserId && (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed rgba(245,158,11,0.2)', borderRadius: 12 }}>
            <Users size={48} style={{ marginBottom: 16, opacity: 0.3, color: '#f59e0b' }} />
            <p className="wt-display" style={{ fontSize: 20, color: '#475569', margin: '0 0 8px' }}>NO PILOT SELECTED</p>
            <p style={{ fontSize: 13, color: '#334155', fontFamily: "'Exo 2'" }}>Choose a pilot above to view their battle history.</p>
          </div>
        )}

        {/* User selected, no battles */}
        {selectedUserId && battles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed rgba(245,158,11,0.15)', borderRadius: 12 }}>
            <FileText size={48} style={{ marginBottom: 16, opacity: 0.3, color: '#f59e0b' }} />
            <p className="wt-display" style={{ fontSize: 20, color: '#f59e0b', margin: '0 0 8px' }}>NO BATTLE DATA</p>
            <p style={{ fontSize: 13, color: '#334155', fontFamily: "'Exo 2'" }}>
              {currentUser?.name} has no battle logs. Go to Data Management to add some.
            </p>
          </div>
        )}

        {/* Battles exist */}
        {selectedUserId && battles.length > 0 && (
          <>
            {/* Stats bar */}
            <StatsBar battles={filtered} />

            {/* Filters */}
            <FiltersPanel
              filters={filters}
              onChange={handleFilterChange}
              missionTypes={missionTypes}
              onReset={() => setFilters(INITIAL_FILTERS)}
            />

            {/* Sort bar */}
            <SortBar sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />

            {/* Results count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 12, color: '#475569' }}>
                {filtered.length === battles.length
                  ? `${battles.length} battles`
                  : `${filtered.length} of ${battles.length} battles`}
              </span>
              {activeFilterCount > 0 && (
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#f59e0b', fontFamily: "'Share Tech Mono'",
                }}>
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                </span>
              )}
              {filtered.length === 0 && battles.length > 0 && (
                <span style={{ color: '#ef4444', fontSize: 12, fontFamily: "'Exo 2'" }}>
                  No results — try adjusting filters
                </span>
              )}
            </div>

            {/* Battle cards */}
            {visible.length === 0 ? (
              <EmptyState
                message="No battles match your filters"
                sub="Try clearing some filters above"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visible.map((battle, i) => {
                  // Find the actual index in original battles array for deletion/editing
                  const origIdx = battles.indexOf(battle);
                  return (
                    <BattleCard
                      key={battle.id || `${battle.session}_${i}`}
                      battle={battle}
                      index={filtered.indexOf(battle)}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={() => handleDelete(origIdx)}
                    />
                  );
                })}
              </div>
            )}

            {/* Load more */}
            <WTLoadMoreButton
              onLoadMore={loadMore}
              hasMore={hasMore}
              loading={false}
              visibleCount={visible.length}
              totalCount={filtered.length}
            />
          </>
        )}
      </div>

      {/* Delete confirm */}
      {confirmIdx !== null && (
        <DeleteConfirm
          onConfirm={confirmDelete}
          onCancel={() => setConfirmIdx(null)}
        />
      )}

      {/* Battle overlay */}
      {overlayOpen && overlayBattle && (
        <BattlePreviewOverlay
          isOpen={overlayOpen}
          battle={overlayBattle}
          onClose={() => setOverlayOpen(false)}
          mode={overlayMode}
          onSave={handleOverlaySave}
        />
      )}
    </div>
  );
};

export default BattleLogsPage;