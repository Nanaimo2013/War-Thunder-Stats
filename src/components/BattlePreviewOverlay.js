/**
 * BattlePreviewOverlay.js  v4.0
 *
 * Complete overhaul:
 * - Full-screen slide-in panel (no modal box, covers entire viewport)
 * - Hides navbar (body.wt-overlay-open class)
 * - More view tabs: Overview, Combat Events, Awards, Vehicles, Research, Timeline, Raw JSON
 * - More edit tabs: Overview, Combat, Economy, Awards, Research, Meta, Raw JSON
 * - Award medal presets from AWARDS_METADATA (auto-fills SL/RP)
 * - Unsaved changes warning before exit
 * - No quick presets except for awards/medals
 * - Better .json editing with full apply
 * - Stable layout: switching tabs/modes never resizes anything
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ItemTypeIcon from './ItemTypeIcon';
import CountryFlag from './CountryFlag';
import VehicleIcon from './VehicleIcon';
import { AWARDS_METADATA } from '../utils/constants';
import { isEqual } from '../utils/helpers';
import {
  Award, Swords, Plane, Car, ShieldAlert, Zap, Clock, X, Target,
  Plus, Trash2, Save, BarChart3, BookOpen, ClipboardList, Skull,
  CheckCircle2, Coins, Flame, RotateCcw, Sparkles,
  Trophy, Shield, Crosshair, RefreshCcw, Eye, Medal, Loader2,
  TrendingUp, ClipboardCopy, Timer, Activity, Wrench, Star, Cpu,
  Package, Pencil, AlertTriangle, ChevronDown, Check, Info,
  Calendar, ArrowUpRight, Layers, Zap as ZapIcon, BarChart2,
  List, Grid, Search, Hash, MapPin, ChevronRight,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeN  = v  => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const fmt    = n  => (n == null ? '0' : Number(n).toLocaleString());
const fmtK   = n  => { if (!Number.isFinite(n)) return '0'; if (Math.abs(n)>=1e6) return `${(n/1e6).toFixed(1)}M`; if(Math.abs(n)>=1000) return `${(n/1000).toFixed(1)}K`; return String(n); };
const secToTime = s => { if (s==null||isNaN(s)||s<0) return '—'; const m=Math.floor(s/60),ss=Math.floor(s%60); return `${m}:${String(ss).padStart(2,'0')}`; };
const fmtDT  = v  => { const d=v?new Date(v):null; return d&&!isNaN(d)?d.toLocaleString():'Unknown'; };
const fmtD   = v  => { const d=v?new Date(v):null; return d&&!isNaN(d)?d.toLocaleDateString():null; };
const fmtT   = v  => { const d=v?new Date(v):null; return d&&!isNaN(d)?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):null; };

const normalizeBattle = b => {
  if (!b) return null;
  return {
    ...b,
    timestamp:              b.timestamp              || b.parsedAt,
    detailedAwards:         b.detailedAwards         || b.awards_detail          || [],
    detailedKills:          b.detailedKills          || b.kills                  || [],
    detailedDamage:         b.detailedDamage         || b.damage_detail          || [],
    detailedCriticalDamage: b.detailedCriticalDamage || b.criticalDamage_detail  || [],
    detailedSevereDamage:   b.detailedSevereDamage   || b.severeDamage_detail    || [],
    detailedAssists:        b.detailedAssists        || b.assists_detail         || [],
    detailedTimePlayed:     b.detailedTimePlayed      || b.timePlayed_detail      || [],
    detailedActivityTime:   b.detailedActivityTime   || b.activityTime_detail    || [],
  };
};

// ─── Award preset list from AWARDS_METADATA ───────────────────────────────────

const AWARD_PRESETS = Object.entries(AWARDS_METADATA || {}).map(([name, meta]) => ({
  name,
  sl: meta.sl || 0,
  rp: meta.rp || 0,
  category: meta.category || 'combat',
}));

// ─── Inline number editor ─────────────────────────────────────────────────────

const InlineNumber = ({ value, onChange, className = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const ref = useRef(null);

  const start = () => { setDraft(String(value ?? 0)); setEditing(true); setTimeout(() => ref.current?.select(), 20); };
  const commit = () => { const n = Number(draft); if (!isNaN(n)) onChange(n); setEditing(false); };

  if (!editing) return (
    <span onClick={start} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }} title="Click to edit">
      {value ?? 0}
      <Pencil size={9} style={{ opacity: 0.4, color: '#f59e0b' }} />
    </span>
  );
  return (
    <input
      ref={ref} type="number" value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      style={{
        background: '#070a0d', border: '1px solid rgba(245,158,11,0.6)',
        borderRadius: 4, padding: '2px 6px', color: '#fbbf24',
        fontFamily: "'Share Tech Mono'", fontSize: 'inherit',
        width: Math.max(60, String(draft).length * 10 + 20),
        outline: 'none',
      }}
    />
  );
};

// ─── Section label ────────────────────────────────────────────────────────────

const SL = ({ children, className = '' }) => (
  <div className={className} style={{
    fontFamily: "'Rajdhani'", fontWeight: 700,
    fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
    color: '#475569', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 6,
  }}>
    <div style={{ width: 2, height: 12, background: '#f59e0b', borderRadius: 1 }} />
    {children}
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const Empty = ({ icon, msg, small = false }) => (
  <div style={{ textAlign: 'center', padding: small ? '24px 16px' : '56px 24px', color: '#334155' }}>
    {icon && <div style={{ marginBottom: 10, opacity: 0.2 }}>{icon}</div>}
    <p style={{ fontFamily: "'Exo 2'", fontSize: small ? 12 : 14 }}>{msg}</p>
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────

const SC = ({ label, val, sub, color = '#e2e8f0', border = 'rgba(255,255,255,0.06)', bg = 'rgba(0,0,0,0.2)', delay = 0, icon }) => (
  <div style={{
    background: bg, border: `1px solid ${border}`, borderRadius: 10,
    padding: '12px 14px',
    animation: `bpo-card 0.28s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
  }}>
    {icon && <div style={{ marginBottom: 6, color }}>{icon}</div>}
    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', fontFamily: "'Rajdhani'", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Share Tech Mono'", lineHeight: 1 }}>{val}</div>
    {sub && <div style={{ fontSize: 10, color: '#334155', marginTop: 4, fontFamily: "'Exo 2'" }}>{sub}</div>}
  </div>
);

// ─── Field input ──────────────────────────────────────────────────────────────

const Field = ({ label, k, form, initialForm, setF, color = '#e2e8f0', type = 'number', note }) => {
  const changed = !isEqual(form[k], initialForm?.[k]);
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${changed ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: 12 }}>
      <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', fontFamily: "'Rajdhani'", display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={form[k] ?? ''}
        onChange={e => setF(k, type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{
          width: '100%', background: '#050709', border: 'none', borderRadius: 4,
          padding: '7px 10px', color, fontFamily: "'Share Tech Mono'", fontSize: 16,
          fontWeight: 700, outline: 'none', boxSizing: 'border-box',
        }}
      />
      {note && <div style={{ fontSize: 9, color: '#334155', marginTop: 4, fontFamily: "'Exo 2'" }}>{note}</div>}
      {changed && (
        <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 4, fontFamily: "'Rajdhani'", display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowUpRight size={9} /> Was: {fmt(safeN(initialForm?.[k]))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BattlePreviewOverlay = ({
  isOpen, onClose, battle: rawBattle, mode: initMode = 'view',
  onSave, onDelete, context = 'logs',
}) => {
  const battle = useMemo(() => normalizeBattle(rawBattle), [rawBattle]);

  // ── All state (declared unconditionally) ──────────────────────────────────
  const [tab,            setTab]           = useState('overview');
  const [mode,           setMode]          = useState(initMode);
  const [mounted,        setMounted]       = useState(false);
  const [deleteConf,     setDeleteConf]    = useState(false);
  const [cancelConf,     setCancelConf]    = useState(false);
  const [closeConf,      setCloseConf]     = useState(false);
  const [rawCopied,      setRawCopied]     = useState(false);
  const [saveFlash,      setSaveFlash]     = useState(false);
  const [tabKey,         setTabKey]        = useState(0);

  const [form,           setForm]          = useState({});
  const [initForm,       setInitForm]      = useState({});
  const [medals,         setMedals]        = useState([]);
  const [initMedals,     setInitMedals]    = useState([]);
  const [resUnits,       setResUnits]      = useState([]);
  const [initResUnits,   setInitResUnits]  = useState([]);
  const [resProg,        setResProg]       = useState([]);
  const [initResProg,    setInitResProg]   = useState([]);

  // Award preset search
  const [awardSearch, setAwardSearch] = useState('');
  const [awardPresetOpen, setAwardPresetOpen] = useState(false);

  // ── Computed ──────────────────────────────────────────────────────────────

  const mergedEvents = useMemo(() => {
    if (!battle) return [];
    const map = (arr, type, label, color, icon) => (arr||[]).map((ev,i) => ({
      ...ev, __key:`${type}-${i}`, __type:type, __label:label, __color:color, __icon:icon,
      __ts: safeN(ev.timeSec), __time: secToTime(ev.timeSec),
    }));
    return [
      ...map(battle.detailedKills,          'kill',   'Kill',         { text:'#4ade80', border:'rgba(74,222,128,0.2)', bg:'rgba(74,222,128,0.04)', badge:'rgba(74,222,128,0.15) text #4ade80' }, <Skull size={12}/>),
      ...map(battle.detailedAssists,        'assist', 'Assist',       { text:'#fbbf24', border:'rgba(251,191,36,0.2)', bg:'rgba(251,191,36,0.04)' }, <Zap size={12}/>),
      ...map(battle.detailedCriticalDamage, 'crit',   'Critical',     { text:'#f87171', border:'rgba(248,113,113,0.2)', bg:'rgba(248,113,113,0.04)' }, <ShieldAlert size={12}/>),
      ...map(battle.detailedSevereDamage,   'severe', 'Severe Dmg',   { text:'#fb923c', border:'rgba(251,146,60,0.2)', bg:'rgba(251,146,60,0.04)' }, <Flame size={12}/>),
      ...map(battle.detailedDamage,         'damage', 'Damage',       { text:'#60a5fa', border:'rgba(96,165,250,0.2)', bg:'rgba(96,165,250,0.04)' }, <Crosshair size={12}/>),
    ].sort((a,b) => a.__ts - b.__ts);
  }, [battle]);

  const liveDisplay = useMemo(() => {
    if (!battle) return null;
    if (mode !== 'edit') return battle;
    return { ...battle, ...form, detailedAwards: medals, researchedUnits: resUnits, researchingProgress: resProg };
  }, [battle, form, medals, resUnits, resProg, mode]);

  const display = liveDisplay || battle;

  const hasChanges = useMemo(() => {
    if (mode !== 'edit') return false;
    return !isEqual(form, initForm) || !isEqual(medals, initMedals) ||
           !isEqual(resUnits, initResUnits) || !isEqual(resProg, initResProg);
  }, [mode, form, initForm, medals, initMedals, resUnits, initResUnits, resProg, initResProg]);

  const changeCount = useMemo(() => {
    if (!hasChanges) return 0;
    let n = 0;
    Object.keys(form).forEach(k => { if (!isEqual(form[k], initForm[k])) n++; });
    if (!isEqual(medals, initMedals)) n++;
    if (!isEqual(resUnits, initResUnits)) n++;
    if (!isEqual(resProg, initResProg)) n++;
    return n;
  }, [form, initForm, medals, initMedals, resUnits, initResUnits, resProg, initResProg, hasChanges]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!battle) return;
    const f = {
      result:           battle.result           || 'Unknown',
      missionType:      battle.missionType       || '',
      missionName:      battle.missionName       || '',
      killsAircraft:    safeN(battle.killsAircraft),
      killsGround:      safeN(battle.killsGround),
      assists:          safeN(battle.assists),
      damage:           safeN(battle.damage),
      severeDamage:     safeN(battle.severeDamage),
      criticalDamage:   safeN(battle.criticalDamage),
      captures:         safeN(battle.captures),
      activity:         safeN(battle.activity),
      earnedSL:         safeN(battle.earnedSL),
      totalRP:          safeN(battle.totalRP),
      earnedCRP:        safeN(battle.earnedCRP),
      awardsSL:         safeN(battle.awardsSL),
      awardsRP:         safeN(battle.awardsRP),
      rewardSL:         safeN(battle.rewardSL),
      skillBonusRP:     safeN(battle.skillBonusRP),
      autoRepairCost:   safeN(battle.autoRepairCost),
      autoAmmoCrewCost: safeN(battle.autoAmmoCrewCost),
      totalSL:          safeN(battle.totalSL),
      totalCRP:         safeN(battle.totalCRP),
      activityTimeSL:   safeN(battle.activityTimeSL),
      activityTimeRP:   safeN(battle.activityTimeRP),
      timePlayedRP:     safeN(battle.timePlayedRP),
      session:          battle.session           || '',
      timestamp:        battle.timestamp         || '',
      killsGroundSL:    safeN(battle.killsGroundSL),
      killsGroundRP:    safeN(battle.killsGroundRP),
      killsAircraftSL:  safeN(battle.killsAircraftSL),
      killsAircraftRP:  safeN(battle.killsAircraftRP),
      assistsSL:        safeN(battle.assistsSL),
      assistsRP:        safeN(battle.assistsRP),
    };
    setForm(f); setInitForm(JSON.parse(JSON.stringify(f)));
    const m = (battle.detailedAwards||[]).map((a,i) => ({ id:`m${i}${Date.now()}`, award: a.award||'Award', sl: safeN(a.sl), rp: safeN(a.rp), timeSec: a.timeSec ?? null }));
    setMedals(m); setInitMedals(JSON.parse(JSON.stringify(m)));
    const ru = (battle.researchedUnits||[]).map((x,i) => ({ id:`ru${i}`, unit: x.unit||'', rp: safeN(x.rp) }));
    setResUnits(ru); setInitResUnits(JSON.parse(JSON.stringify(ru)));
    const rp = (battle.researchingProgress||[]).map((x,i) => ({ id:`rp${i}`, unit: x.unit||'', item: x.item||'', rp: safeN(x.rp) }));
    setResProg(rp); setInitResProg(JSON.parse(JSON.stringify(rp)));
  }, [battle]);

  useEffect(() => { setMode(initMode); }, [initMode]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true));
      document.body.classList.add('wt-overlay-open');
      document.body.style.overflow = 'hidden';
    } else {
      setMounted(false);
      document.body.classList.remove('wt-overlay-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('wt-overlay-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const setF = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  const switchTab = (t) => { setTab(t); setTabKey(k => k + 1); };

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave({ ...rawBattle, ...form, detailedAwards: medals, awards_detail: medals, researchedUnits: resUnits, researchingProgress: resProg });
    setInitForm(JSON.parse(JSON.stringify(form)));
    setInitMedals(JSON.parse(JSON.stringify(medals)));
    setInitResUnits(JSON.parse(JSON.stringify(resUnits)));
    setInitResProg(JSON.parse(JSON.stringify(resProg)));
    setSaveFlash(true); setTimeout(() => setSaveFlash(false), 2000);
  }, [onSave, rawBattle, form, medals, resUnits, resProg]);

  const handleRevert = useCallback(() => {
    setForm(JSON.parse(JSON.stringify(initForm)));
    setMedals(JSON.parse(JSON.stringify(initMedals)));
    setResUnits(JSON.parse(JSON.stringify(initResUnits)));
    setResProg(JSON.parse(JSON.stringify(initResProg)));
  }, [initForm, initMedals, initResUnits, initResProg]);

  const enterEdit = () => { setMode('edit'); switchTab('edit-overview'); };

  const exitEdit = () => {
    if (hasChanges) { setCancelConf(true); return; }
    setMode('view'); switchTab('overview');
  };

  const requestClose = () => {
    if (mode === 'edit' && hasChanges) { setCloseConf(true); return; }
    onClose();
  };

  // ── Early returns (safe after all hooks) ──────────────────────────────────

  if (!isOpen && !mounted) return null;
  if (!battle) return null;

  // ── Theme ─────────────────────────────────────────────────────────────────

  const res = (display?.result || '').toLowerCase();
  const isW = res.includes('victor'), isD = res.includes('defeat');
  const RT = {
    bar:   isW ? '#22c55e' : isD ? '#ef4444' : '#64748b',
    glow:  isW ? 'rgba(34,197,94,0.2)' : isD ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.1)',
    badge: isW ? '#22c55e' : isD ? '#ef4444' : '#64748b',
  };

  const isEdit = mode === 'edit';
  const totalKills = safeN(display?.killsGround) + safeN(display?.killsAircraft);

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const viewTabs = [
    { id:'overview',  label:'Overview',                        icon:<BarChart3 size={12}/> },
    { id:'events',    label:`Events (${mergedEvents.length})`, icon:<Crosshair size={12}/> },
    { id:'awards',    label:`Awards (${(display?.detailedAwards||[]).length})`, icon:<Award size={12}/> },
    { id:'vehicles',  label:`Vehicles (${(battle?.vehicles||[]).length})`, icon:<Car size={12}/> },
    { id:'research',  label:'Research',                        icon:<Cpu size={12}/> },
    { id:'raw',       label:'Raw JSON',                        icon:<ClipboardList size={12}/> },
  ];

  const editTabs = [
    { id:'edit-overview', label:'Overview',  icon:<Eye size={12}/> },
    { id:'edit-combat',   label:'Combat',    icon:<Swords size={12}/> },
    { id:'edit-economy',  label:'Economy',   icon:<Coins size={12}/> },
    { id:'edit-awards',   label:'Awards',    icon:<Award size={12}/> },
    { id:'edit-research', label:'Research',  icon:<Cpu size={12}/> },
    { id:'edit-meta',     label:'Meta',      icon:<BookOpen size={12}/> },
    { id:'edit-raw',      label:'Raw JSON',  icon:<ClipboardList size={12}/> },
  ];

  const activeTabs = isEdit ? editTabs : viewTabs;

  // ── Tab content renderers ─────────────────────────────────────────────────

  const OverviewTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' }}>
        {/* Economy */}
        <div>
          <SL>Economy</SL>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label:'Earned SL',   val: fmt(safeN(display?.earnedSL)),  sub:`Net: ${fmt(safeN(display?.totalSL))} SL`, color:'#fbbf24', border:'rgba(251,191,36,0.2)', bg:'rgba(251,191,36,0.04)', delay:0 },
              { label:'Total RP',    val: fmt(safeN(display?.totalRP)),    sub:`CRP: ${fmt(safeN(display?.totalCRP))}`, color:'#a855f7', border:'rgba(168,85,247,0.2)', bg:'rgba(168,85,247,0.04)', delay:40 },
              { label:'Awards SL',   val: fmt(safeN(display?.awardsSL)),   sub:`${(display?.detailedAwards||[]).length} award(s)`, color:'#4ade80', border:'rgba(74,222,128,0.2)', bg:'rgba(74,222,128,0.04)', delay:80 },
              { label:'Repair Cost', val: fmt(Math.abs(safeN(display?.autoRepairCost))), sub:`Ammo: ${fmt(Math.abs(safeN(display?.autoAmmoCrewCost)))} SL`, color:'#f87171', border:'rgba(248,113,113,0.2)', bg:'rgba(248,113,113,0.04)', delay:120 },
            ].map(c => <SC key={c.label} {...c} />)}
          </div>
        </div>

        {/* Combat */}
        <div>
          <SL>Combat Performance</SL>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { label:'Ground Kills', val: safeN(display?.killsGround),   icon:<Swords size={16}/>, color:'#f87171', delay:0 },
              { label:'Air Kills',    val: safeN(display?.killsAircraft),  icon:<Plane size={16}/>,  color:'#60a5fa', delay:40 },
              { label:'Assists',      val: safeN(display?.assists),        icon:<Zap size={16}/>,    color:'#fbbf24', delay:80 },
              { label:'Criticals',    val: safeN(display?.criticalDamage), icon:<ShieldAlert size={16}/>, color:'#fb923c', delay:120 },
              { label:'Severe Dmg',   val: safeN(display?.severeDamage),   icon:<Flame size={16}/>,  color:'#ef4444', delay:160 },
            ].map(c => (
              <div key={c.label} style={{
                background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10,
                padding:'14px 12px', textAlign:'center',
                animation:`bpo-card 0.28s cubic-bezier(0.16,1,0.3,1) ${c.delay}ms both`,
              }}>
                <div style={{ color: c.color, marginBottom: 8, display:'flex', justifyContent:'center' }}>{c.icon}</div>
                <div style={{ fontSize:28, fontWeight:800, color:c.color, fontFamily:"'Share Tech Mono'", lineHeight:1 }}>{c.val}</div>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#475569', fontFamily:"'Rajdhani'", marginTop:6 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time played bars */}
        {(display?.detailedTimePlayed||[]).length > 0 && (
          <div>
            <SL>Time Played Per Vehicle</SL>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {display.detailedTimePlayed.map((v,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, animation:`bpo-row 0.3s ease ${i*40}ms both` }}>
                  <div style={{ width:90, fontSize:13, color:'#94a3b8', fontFamily:"'Exo 2'", fontWeight:600, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.vehicle}</div>
                  <div style={{ flex:1, height:24, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden', position:'relative', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ position:'absolute', inset:0, width:`${v.percentage||0}%`, background:'linear-gradient(90deg,#92400e,#f59e0b)', transition:'width 0.7s cubic-bezier(0.34,1.56,0.64,1)' }} />
                    <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:'0 8px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.9)', fontFamily:"'Share Tech Mono'" }}>
                      {secToTime(v.timeSec)} · {v.percentage}%
                    </span>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right', fontSize:12, fontWeight:700, color:'#a855f7', fontFamily:"'Share Tech Mono'", width:70 }}>+{fmt(v.rp)} RP</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ display:'flex', flexDirection:'column', gap:14, overflow:'auto' }}>
        <div style={{ background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'14px 16px' }}>
          <SL>Session Info</SL>
          {[
            { k:'Session',    v: display?.session||'N/A', mono:true },
            { k:'Date',       v: fmtD(display?.timestamp) || '—' },
            { k:'Time',       v: fmtT(display?.timestamp) || '—' },
            { k:'Activity',   v: `${display?.activity||0}%` },
            { k:'Duration',   v: secToTime(display?.totalTimeSec) },
            { k:'Reward SL',  v: `+${fmt(display?.rewardSL)} SL` },
            { k:'Net SL',     v: `${safeN(display?.totalSL)>=0?'+':''}${fmt(display?.totalSL)} SL` },
            { k:'Skill Bonus',v: `+${fmt(display?.skillBonusRP)} RP` },
          ].map(r => (
            <div key={r.k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
              <span style={{ color:'#475569', fontFamily:"'Exo 2'" }}>{r.k}</span>
              <span style={{ color:'#94a3b8', fontFamily: r.mono ? "'Share Tech Mono'" : "'Exo 2'", fontWeight:600 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {(display?.researchedUnits||[]).length > 0 && (
          <div style={{ background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'14px 16px' }}>
            <SL>Research</SL>
            {display.researchedUnits.map((r,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(74,222,128,0.06)', fontSize:12 }}>
                <span style={{ color:'#4ade80', fontFamily:"'Exo 2'" }}>{r.unit}</span>
                <span style={{ color:'#a855f7', fontFamily:"'Share Tech Mono'", fontWeight:700 }}>+{fmt(r.rp)} RP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const EventsTab = () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <SL>{mergedEvents.length} Combat Events</SL>
        <div style={{ display:'flex', gap:16, fontSize:12 }}>
          {[
            { l:'Kills',  c:'#4ade80', n:(battle?.detailedKills||[]).length },
            { l:'Crits',  c:'#f87171', n:(battle?.detailedCriticalDamage||[]).length },
            { l:'Severe', c:'#fb923c', n:(battle?.detailedSevereDamage||[]).length },
            { l:'Damage', c:'#60a5fa', n:(battle?.detailedDamage||[]).length },
          ].map(t => (
            <span key={t.l} style={{ color: t.c, fontFamily:"'Rajdhani'", fontWeight:700 }}>{t.n} {t.l}</span>
          ))}
        </div>
      </div>
      {mergedEvents.length === 0 ? <Empty icon={<Crosshair size={36}/>} msg="No combat events recorded." /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {mergedEvents.map((ev,i) => (
            <div key={ev.__key} style={{
              display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
              background: ev.__color.bg, border:`1px solid ${ev.__color.border}`,
              borderRadius:8, animation:`bpo-row 0.22s ease ${i*20}ms both`,
            }}>
              <div style={{ width:36, textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:9, color:'#334155', fontFamily:"'Rajdhani'" }}>T</div>
                <div style={{ fontSize:13, fontWeight:800, fontFamily:"'Share Tech Mono'", color: ev.__color.text }}>{ev.__time}</div>
              </div>
              <span style={{
                flexShrink:0, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                fontFamily:"'Rajdhani'", letterSpacing:'0.06em', textTransform:'uppercase',
                background: `${ev.__color.text}18`, border:`1px solid ${ev.__color.border}`, color: ev.__color.text,
              }}>
                {ev.__icon} {ev.__label}
              </span>
              <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, minWidth:0 }}>
                <div>
                  <div style={{ fontSize:9, color:'#334155', fontFamily:"'Rajdhani'", letterSpacing:'0.1em', textTransform:'uppercase' }}>Your Vehicle</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.vehicle||'—'}</div>
                  {ev.weapon && <div style={{ fontSize:10, color:'#475569' }}>{ev.weapon}</div>}
                </div>
                <div>
                  <div style={{ fontSize:9, color:'#334155', fontFamily:"'Rajdhani'", letterSpacing:'0.1em', textTransform:'uppercase' }}>Target</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.target||'—'}</div>
                  {ev.missionPoints!=null && <div style={{ fontSize:10, color:'#475569' }}>{ev.missionPoints} pts</div>}
                </div>
              </div>
              <div style={{ flexShrink:0, textAlign:'right' }}>
                {safeN(ev.sl)>0 && <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', fontFamily:"'Share Tech Mono'" }}>+{fmt(ev.sl)} SL</div>}
                {safeN(ev.rp)>0 && <div style={{ fontSize:12, fontWeight:700, color:'#a855f7', fontFamily:"'Share Tech Mono'" }}>+{fmt(ev.rp)} RP</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AwardsViewTab = () => {
    const list = display?.detailedAwards || [];
    const totalSL = list.reduce((s,a) => s+safeN(a.sl), 0);
    const totalRP = list.reduce((s,a) => s+safeN(a.rp), 0);
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <SL>{list.length} Award{list.length!==1?'s':''}</SL>
          {list.length > 0 && (
            <div style={{ display:'flex', gap:16, fontSize:13 }}>
              <span style={{ color:'#fbbf24', fontFamily:"'Share Tech Mono'", fontWeight:700 }}>+{fmt(totalSL)} SL</span>
              {totalRP>0 && <span style={{ color:'#a855f7', fontFamily:"'Share Tech Mono'", fontWeight:700 }}>+{fmt(totalRP)} RP</span>}
            </div>
          )}
        </div>
        {list.length===0 ? <Empty icon={<Medal size={36}/>} msg="No awards earned." /> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
            {list.map((a,i) => (
              <div key={i} style={{
                background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)',
                borderRadius:10, padding:'14px 16px', animation:`bpo-card 0.28s ease ${i*40}ms both`,
                position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' }} />
                <div style={{ display:'flex', alignItems:'start', gap:12, marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Star size={16} style={{ color:'#f59e0b' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Exo 2'", fontSize:14, fontWeight:700, color:'#fef3c7' }}>{a.award}</div>
                    {a.timeSec!=null && <div style={{ fontSize:10, color:'#475569', fontFamily:"'Share Tech Mono'", marginTop:2 }}>{secToTime(a.timeSec)}</div>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  {safeN(a.sl)>0 && <span style={{ fontSize:14, fontWeight:800, color:'#fbbf24', fontFamily:"'Share Tech Mono'" }}>+{fmt(a.sl)} SL</span>}
                  {safeN(a.rp)>0 && <span style={{ fontSize:14, fontWeight:800, color:'#a855f7', fontFamily:"'Share Tech Mono'" }}>+{fmt(a.rp)} RP</span>}
                  {safeN(a.sl)===0 && safeN(a.rp)===0 && <span style={{ fontSize:11, color:'#334155', fontFamily:"'Exo 2'" }}>Honorific</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const VehiclesTab = () => {
    const vlist = battle?.vehicles || [];
    const killed = new Set((battle?.detailedKills||[]).map(k => k.target));
    const dmg    = new Set(battle?.damagedVehicles||[]);
    return (
      <div>
        <SL style={{ marginBottom:16 }}>{vlist.length} Vehicles Used</SL>
        {vlist.length===0 ? <Empty icon={<Car size={36}/>} msg="No vehicles recorded." /> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
            {vlist.map((v,i) => {
              const name = v.displayName||v.name||'Unknown';
              const isKilled = killed.has(name), isDmg = dmg.has(name);
              return (
                <div key={i} style={{
                  background: isKilled?'rgba(74,222,128,0.04)':isDmg?'rgba(248,113,113,0.04)':'rgba(0,0,0,0.2)',
                  border:`1px solid ${isKilled?'rgba(74,222,128,0.2)':isDmg?'rgba(248,113,113,0.15)':'rgba(255,255,255,0.06)'}`,
                  borderRadius:10, padding:'12px 14px',
                  animation:`bpo-card 0.28s ease ${i*30}ms both`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <VehicleIcon vehicleName={name} size="xs" />
                    </div>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                        {v.country && <CountryFlag country={v.country} size="xs" />}
                        <span style={{ fontSize:10, color:'#475569', fontFamily:"'Exo 2'" }}>{v.baseType||v.type||'vehicle'}</span>
                        {v.rank && <span style={{ fontSize:10, color:'rgba(245,158,11,0.6)' }}>Rank {v.rank}</span>}
                      </div>
                    </div>
                    {isKilled && <span style={{ fontSize:9, fontWeight:700, color:'#4ade80', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:4, padding:'2px 6px', flexShrink:0 }}>KILLED</span>}
                    {isDmg && !isKilled && <span style={{ fontSize:9, fontWeight:700, color:'#f87171', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:4, padding:'2px 6px', flexShrink:0 }}>DAMAGED</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const ResearchViewTab = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div>
        <SL>Fully Researched</SL>
        {(display?.researchedUnits||[]).length===0 ? <Empty small msg="No units researched." /> : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {display.researchedUnits.map((r,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:8, animation:`bpo-card 0.28s ease ${i*40}ms both` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}><Package size={14} style={{ color:'#4ade80' }}/><span style={{ fontFamily:"'Exo 2'", fontWeight:700, color:'#86efac', fontSize:13 }}>{r.unit}</span></div>
                <span style={{ fontFamily:"'Share Tech Mono'", fontWeight:700, color:'#a855f7', fontSize:13 }}>+{fmt(r.rp)} RP</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <SL>In Progress</SL>
        {(display?.researchingProgress||[]).length===0 ? <Empty small msg="No progress entries." /> : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {display.researchingProgress.map((r,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, animation:`bpo-card 0.28s ease ${i*40}ms both` }}>
                <div><div style={{ fontSize:13, color:'#94a3b8', fontFamily:"'Exo 2'", fontWeight:600 }}>{r.unit}</div><div style={{ fontSize:11, color:'#475569' }}>{r.item}</div></div>
                <span style={{ fontFamily:"'Share Tech Mono'", fontWeight:700, color:'#a855f7', fontSize:13 }}>+{fmt(r.rp)} RP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const RawTab = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <SL>Raw JSON</SL>
        <button
          onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(rawBattle, null, 2)); setRawCopied(true); setTimeout(() => setRawCopied(false), 2000); } catch {} }}
          style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'5px 12px', borderRadius:6,
            background: rawCopied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
            border:`1px solid ${rawCopied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: rawCopied ? '#4ade80' : '#94a3b8',
            fontFamily:"'Rajdhani'", fontWeight:700, fontSize:11, cursor:'pointer', letterSpacing:'0.06em',
          }}
        >
          {rawCopied ? <Check size={12}/> : <ClipboardCopy size={12}/>} {rawCopied?'Copied!':'Copy JSON'}
        </button>
      </div>
      <pre style={{ flex:1, overflow:'auto', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:20, fontSize:11, color:'#94a3b8', fontFamily:"'Share Tech Mono'", lineHeight:1.6, margin:0 }}>
        <code>{JSON.stringify(rawBattle, null, 2)}</code>
      </pre>
    </div>
  );

  // ── Edit tabs ──────────────────────────────────────────────────────────────

  const EditOverviewTab = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:20 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div>
          <SL>Economy · Click any value to edit inline</SL>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { label:'Earned SL',   key:'earnedSL',   color:'#fbbf24', border:'rgba(251,191,36,0.2)', bg:'rgba(251,191,36,0.04)' },
              { label:'Total RP',    key:'totalRP',     color:'#a855f7', border:'rgba(168,85,247,0.2)', bg:'rgba(168,85,247,0.04)' },
              { label:'Awards SL',   key:'awardsSL',    color:'#4ade80', border:'rgba(74,222,128,0.2)', bg:'rgba(74,222,128,0.04)' },
              { label:'Net SL',      key:'totalSL',     color:'#86efac', border:'rgba(74,222,128,0.15)', bg:'rgba(74,222,128,0.03)' },
              { label:'Reward SL',   key:'rewardSL',    color:'#fde68a', border:'rgba(253,230,138,0.2)', bg:'rgba(253,230,138,0.03)' },
              { label:'Earned CRP',  key:'earnedCRP',   color:'#818cf8', border:'rgba(129,140,248,0.2)', bg:'rgba(129,140,248,0.04)' },
              { label:'Auto Repair', key:'autoRepairCost', color:'#f87171', border:'rgba(248,113,113,0.2)', bg:'rgba(248,113,113,0.04)' },
              { label:'Ammo/Crew',   key:'autoAmmoCrewCost', color:'#fca5a5', border:'rgba(252,165,165,0.15)', bg:'rgba(252,165,165,0.03)' },
            ].map(c => (
              <div key={c.key} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:'12px 14px', cursor:'pointer' }}>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:'#475569', fontFamily:"'Rajdhani'", marginBottom:4 }}>{c.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:c.color, fontFamily:"'Share Tech Mono'", lineHeight:1 }}>
                  <InlineNumber value={safeN(form[c.key])} onChange={v => setF(c.key, v)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SL>Combat Stats · Click to edit</SL>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
            {[
              { label:'Gnd Kills', key:'killsGround',   color:'#f87171', icon:<Swords size={14}/> },
              { label:'Air Kills', key:'killsAircraft', color:'#60a5fa', icon:<Plane size={14}/> },
              { label:'Assists',   key:'assists',        color:'#fbbf24', icon:<Zap size={14}/> },
              { label:'Damage',    key:'damage',          color:'#94a3b8', icon:<Target size={14}/> },
              { label:'Criticals', key:'criticalDamage',  color:'#fb923c', icon:<ShieldAlert size={14}/> },
              { label:'Severe',    key:'severeDamage',    color:'#ef4444', icon:<Flame size={14}/> },
            ].map(c => (
              <div key={c.key} style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 8px', textAlign:'center', cursor:'pointer' }}>
                <div style={{ color:c.color, display:'flex', justifyContent:'center', marginBottom:6 }}>{c.icon}</div>
                <div style={{ fontSize:24, fontWeight:800, color:c.color, fontFamily:"'Share Tech Mono'", lineHeight:1, marginBottom:4 }}>
                  <InlineNumber value={safeN(form[c.key])} onChange={v => setF(c.key, v)} />
                </div>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.08em', color:'#475569', fontFamily:"'Rajdhani'" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live preview sidebar */}
      <div style={{ position:'sticky', top:0, background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, padding:'14px 16px', height:'fit-content' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <Eye size={13} style={{ color:'#f59e0b' }} />
          <span style={{ fontFamily:"'Rajdhani'", fontWeight:700, fontSize:11, color:'#f59e0b', letterSpacing:'0.1em', textTransform:'uppercase' }}>Live Preview</span>
          {hasChanges && <div style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', animation:'bpo-pulse 1.5s ease infinite', marginLeft:'auto' }} />}
        </div>
        {[
          { k:'Result',   v: form.result },
          { k:'Mission',  v: form.missionName||'—' },
          { k:'Kills',    v: `${safeN(form.killsGround)+safeN(form.killsAircraft)} total` },
          { k:'SL',       v: `+${fmt(safeN(form.earnedSL))}` },
          { k:'RP',       v: `+${fmt(safeN(form.totalRP))}` },
          { k:'Activity', v: `${safeN(form.activity)}%` },
        ].map(r => (
          <div key={r.k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(245,158,11,0.06)', fontSize:12 }}>
            <span style={{ color:'#475569', fontFamily:"'Exo 2'" }}>{r.k}</span>
            <span style={{ fontFamily:"'Share Tech Mono'", color:'#e2e8f0', fontWeight:600 }}>{r.v}</span>
          </div>
        ))}

        {hasChanges && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(245,158,11,0.1)' }}>
            <div style={{ fontSize:9, color:'rgba(245,158,11,0.5)', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:"'Rajdhani'", marginBottom:6 }}>Changed Fields</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:120, overflowY:'auto' }}>
              {Object.keys(form).filter(k => !isEqual(form[k], initForm[k])).map(k => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
                  <span style={{ color:'#475569' }}>{k}</span>
                  <span style={{ color:'#fbbf24', fontFamily:"'Share Tech Mono'" }}>{String(form[k]).slice(0,14)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const EditCombatTab = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <SL>Combat Statistics</SL>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
          {[
            { label:'Ground Kills',    k:'killsGround',    color:'#f87171' },
            { label:'Aircraft Kills',  k:'killsAircraft',  color:'#60a5fa' },
            { label:'Assists',         k:'assists',         color:'#fbbf24' },
            { label:'Damage Count',    k:'damage',          color:'#94a3b8' },
            { label:'Critical Damage', k:'criticalDamage',  color:'#fb923c' },
            { label:'Severe Damage',   k:'severeDamage',    color:'#ef4444' },
            { label:'Captures',        k:'captures',        color:'#34d399' },
            { label:'Activity %',      k:'activity',        color:'#6ee7b7' },
          ].map(c => <Field key={c.k} label={c.label} k={c.k} form={form} initialForm={initForm} setF={setF} color={c.color} />)}
        </div>
      </div>
      <div>
        <SL>Kill Rewards</SL>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
          {[
            { label:'Ground Kill SL',  k:'killsGroundSL',   color:'#fbbf24' },
            { label:'Ground Kill RP',  k:'killsGroundRP',   color:'#a855f7' },
            { label:'Air Kill SL',     k:'killsAircraftSL', color:'#fbbf24' },
            { label:'Air Kill RP',     k:'killsAircraftRP', color:'#a855f7' },
            { label:'Assist SL',       k:'assistsSL',        color:'#fbbf24' },
            { label:'Assist RP',       k:'assistsRP',        color:'#a855f7' },
          ].map(c => <Field key={c.k} label={c.label} k={c.k} form={form} initialForm={initForm} setF={setF} color={c.color} />)}
        </div>
      </div>
    </div>
  );

  const EditEconomyTab = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <SL>Rewards</SL>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
          {[
            { label:'Earned SL',      k:'earnedSL',       color:'#fbbf24', note:'Gross before costs' },
            { label:'Total RP',       k:'totalRP',         color:'#a855f7' },
            { label:'Earned CRP',     k:'earnedCRP',       color:'#818cf8' },
            { label:'Awards SL',      k:'awardsSL',        color:'#4ade80' },
            { label:'Awards RP',      k:'awardsRP',        color:'#4ade80' },
            { label:'Reward SL',      k:'rewardSL',        color:'#fde68a', note:'Mission participation' },
            { label:'Skill Bonus RP', k:'skillBonusRP',    color:'#60a5fa' },
            { label:'Time Played RP', k:'timePlayedRP',    color:'#a855f7' },
            { label:'Activity SL',    k:'activityTimeSL',  color:'#fbbf24' },
            { label:'Activity RP',    k:'activityTimeRP',  color:'#a855f7' },
          ].map(c => <Field key={c.k} label={c.label} k={c.k} form={form} initialForm={initForm} setF={setF} color={c.color} note={c.note} />)}
        </div>
      </div>
      <div>
        <SL>Costs &amp; Totals</SL>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
          {[
            { label:'Auto Repair',    k:'autoRepairCost',    color:'#f87171', note:'Negative = cost' },
            { label:'Ammo/Crew',      k:'autoAmmoCrewCost',  color:'#f87171' },
            { label:'Net SL',         k:'totalSL',           color:'#4ade80', note:'After all costs' },
            { label:'Total CRP',      k:'totalCRP',          color:'#818cf8' },
          ].map(c => <Field key={c.k} label={c.label} k={c.k} form={form} initialForm={initForm} setF={setF} color={c.color} note={c.note} />)}
        </div>
      </div>
    </div>
  );

  const filteredPresets = AWARD_PRESETS.filter(p =>
    !awardSearch || p.name.toLowerCase().includes(awardSearch.toLowerCase())
  );

  const EditAwardsTab = () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <SL>{medals.length} Award{medals.length!==1?'s':''}</SL>
        <button
          onClick={() => setMedals(p => [...p, { id:`m${Date.now()}`, award:'New Award', sl:0, rp:0, timeSec:null }])}
          style={{
            display:'flex', alignItems:'center', gap:6, padding:'5px 12px',
            background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)',
            borderRadius:6, color:'#fbbf24', fontFamily:"'Rajdhani'", fontWeight:700,
            fontSize:11, cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase',
          }}
        >
          <Plus size={12}/> Add Award
        </button>
      </div>

      {/* Medal presets from AWARDS_METADATA */}
      <div style={{ marginBottom:16 }}>
        <button
          onClick={() => setAwardPresetOpen(o => !o)}
          style={{
            display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
            background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)',
            borderRadius:8, color:'#f59e0b', fontFamily:"'Rajdhani'", fontWeight:700,
            fontSize:12, cursor:'pointer', width:'100%', justifyContent:'space-between',
            letterSpacing:'0.06em', textTransform:'uppercase',
          }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Medal size={14}/> Medal Presets — Auto-fill SL/RP from known awards
          </div>
          {awardPresetOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
        </button>

        {awardPresetOpen && (
          <div style={{ marginTop:8, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(245,158,11,0.1)', borderRadius:8, padding:'12px 14px', animation:'bpo-card 0.2s ease' }}>
            <div style={{ position:'relative', marginBottom:10 }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#475569', pointerEvents:'none' }} />
              <input
                value={awardSearch} onChange={e => setAwardSearch(e.target.value)}
                placeholder="Search awards…"
                style={{
                  width:'100%', padding:'7px 10px 7px 32px',
                  background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:6, color:'#e2e8f0', fontFamily:"'Exo 2'", fontSize:13,
                  outline:'none', boxSizing:'border-box',
                }}
              />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6, maxHeight:220, overflowY:'auto' }}>
              {filteredPresets.map(p => (
                <button
                  key={p.name}
                  onClick={() => {
                    setMedals(prev => [...prev, { id:`m${Date.now()}`, award:p.name, sl:p.sl, rp:p.rp||0, timeSec:null }]);
                  }}
                  style={{
                    display:'flex', flexDirection:'column', padding:'8px 10px',
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                    borderRadius:6, cursor:'pointer', textAlign:'left',
                    transition:'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <span style={{ fontFamily:"'Exo 2'", fontSize:12, color:'#e2e8f0', fontWeight:600, marginBottom:3 }}>{p.name}</span>
                  <span style={{ fontFamily:"'Share Tech Mono'", fontSize:11, color:'#fbbf24' }}>+{fmt(p.sl)} SL</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Award list */}
      {medals.length===0 ? <Empty icon={<Medal size={36}/>} msg="No awards. Use presets or add manually." /> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
            {medals.map((a, i) => (
              <div key={a.id} style={{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, padding:'14px', animation:`bpo-card 0.28s ease ${i*30}ms both` }}>
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <Star size={14} style={{ color:'#f59e0b', flexShrink:0, marginTop:3 }} />
                  <input
                    value={a.award} placeholder="Award name"
                    onChange={e => { const c=[...medals]; c[i]={...c[i],award:e.target.value}; setMedals(c); }}
                    style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'6px 10px', color:'#fef3c7', fontFamily:"'Exo 2'", fontSize:13, fontWeight:700, outline:'none' }}
                  />
                  <button onClick={() => { const c=[...medals]; c.splice(i,1); setMedals(c); }} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', padding:2 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                  <div>
                    <label style={{ fontSize:9, color:'#475569', fontFamily:"'Rajdhani'", textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:4 }}>Time (s)</label>
                    <input type="number" value={a.timeSec??''} placeholder="—"
                      onChange={e => { const c=[...medals]; c[i]={...c[i],timeSec:e.target.value===''?null:Number(e.target.value)}; setMedals(c); }}
                      style={{ width:'100%', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'5px 8px', color:'#94a3b8', fontFamily:"'Share Tech Mono'", fontSize:12, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:9, color:'rgba(251,191,36,0.6)', fontFamily:"'Rajdhani'", textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:4 }}>SL</label>
                    <input type="number" value={a.sl}
                      onChange={e => { const c=[...medals]; c[i]={...c[i],sl:Number(e.target.value)}; setMedals(c); }}
                      style={{ width:'100%', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:5, padding:'5px 8px', color:'#fbbf24', fontFamily:"'Share Tech Mono'", fontSize:12, fontWeight:700, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:9, color:'rgba(168,85,247,0.6)', fontFamily:"'Rajdhani'", textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:4 }}>RP</label>
                    <input type="number" value={a.rp}
                      onChange={e => { const c=[...medals]; c[i]={...c[i],rp:Number(e.target.value)}; setMedals(c); }}
                      style={{ width:'100%', background:'rgba(168,85,247,0.05)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:5, padding:'5px 8px', color:'#a855f7', fontFamily:"'Share Tech Mono'", fontSize:12, fontWeight:700, outline:'none', boxSizing:'border-box' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.1)', borderRadius:8, display:'flex', gap:16, fontSize:13 }}>
            <span style={{ color:'#475569', fontFamily:"'Exo 2'" }}>Totals:</span>
            <span style={{ color:'#fbbf24', fontFamily:"'Share Tech Mono'", fontWeight:700 }}>{fmt(medals.reduce((s,a) => s+safeN(a.sl), 0))} SL</span>
            <span style={{ color:'#a855f7', fontFamily:"'Share Tech Mono'", fontWeight:700 }}>{fmt(medals.reduce((s,a) => s+safeN(a.rp), 0))} RP</span>
          </div>
        </>
      )}
    </div>
  );

  const EditResearchTab = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <SL>Researched Units</SL>
          <button onClick={() => setResUnits(p => [...p, { id:`ru${Date.now()}`, unit:'', rp:0 }])} style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:5, padding:'3px 10px', color:'#4ade80', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:10, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            <Plus size={10}/> Add
          </button>
        </div>
        {resUnits.map((u,i) => (
          <div key={u.id} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6, padding:'8px 10px', background:'rgba(74,222,128,0.04)', border:'1px solid rgba(74,222,128,0.1)', borderRadius:7 }}>
            <input value={u.unit} placeholder="Unit name" onChange={e => { const c=[...resUnits]; c[i]={...c[i],unit:e.target.value}; setResUnits(c); }}
              style={{ flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'5px 8px', color:'#86efac', fontFamily:"'Exo 2'", fontSize:12, fontWeight:700, outline:'none' }} />
            <input type="number" value={u.rp} onChange={e => { const c=[...resUnits]; c[i]={...c[i],rp:Number(e.target.value)}; setResUnits(c); }}
              style={{ width:80, background:'rgba(168,85,247,0.05)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:5, padding:'5px 8px', color:'#a855f7', fontFamily:"'Share Tech Mono'", fontSize:12, fontWeight:700, outline:'none' }} />
            <button onClick={() => { const c=[...resUnits]; c.splice(i,1); setResUnits(c); }} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer' }}><Trash2 size={13}/></button>
          </div>
        ))}
        {resUnits.length===0 && <Empty small msg="No units. Add one above." />}
      </div>
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <SL>Research Progress</SL>
          <button onClick={() => setResProg(p => [...p, { id:`rp${Date.now()}`, unit:'', item:'', rp:0 }])} style={{ background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:5, padding:'3px 10px', color:'#60a5fa', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:10, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            <Plus size={10}/> Add
          </button>
        </div>
        {resProg.map((r,i) => (
          <div key={r.id} style={{ marginBottom:6, padding:'10px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:7 }}>
            <div style={{ display:'flex', gap:6, marginBottom:6 }}>
              <input value={r.unit} placeholder="Unit" onChange={e => { const c=[...resProg]; c[i]={...c[i],unit:e.target.value}; setResProg(c); }}
                style={{ flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'5px 8px', color:'#93c5fd', fontFamily:"'Exo 2'", fontSize:12, fontWeight:700, outline:'none' }} />
              <input value={r.item} placeholder="Item/module" onChange={e => { const c=[...resProg]; c[i]={...c[i],item:e.target.value}; setResProg(c); }}
                style={{ flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'5px 8px', color:'#94a3b8', fontFamily:"'Exo 2'", fontSize:12, outline:'none' }} />
              <button onClick={() => { const c=[...resProg]; c.splice(i,1); setResProg(c); }} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer' }}><Trash2 size={13}/></button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color:'#475569', fontFamily:"'Rajdhani'", textTransform:'uppercase', letterSpacing:'0.1em' }}>RP:</span>
              <input type="number" value={r.rp} onChange={e => { const c=[...resProg]; c[i]={...c[i],rp:Number(e.target.value)}; setResProg(c); }}
                style={{ width:80, background:'rgba(168,85,247,0.05)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:5, padding:'5px 8px', color:'#a855f7', fontFamily:"'Share Tech Mono'", fontSize:12, fontWeight:700, outline:'none' }} />
            </div>
          </div>
        ))}
        {resProg.length===0 && <Empty small msg="No progress entries." />}
      </div>
    </div>
  );

  const EditMetaTab = () => (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20 }}>
      <div>
        <SL>Mission Info</SL>
        {[
          { label:'Mission Name', k:'missionName', type:'text' },
          { label:'Mission Type', k:'missionType', type:'text' },
          { label:'Session ID',   k:'session',     type:'text' },
        ].map(f => (
          <div key={f.k} style={{ marginBottom:12 }}>
            <label style={{ fontSize:9, color:'#475569', fontFamily:"'Rajdhani'", textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:6 }}>{f.label}</label>
            <input type={f.type} value={form[f.k]||''} onChange={e => setF(f.k, e.target.value)}
              style={{ width:'100%', background:'rgba(0,0,0,0.3)', border:`1px solid ${!isEqual(form[f.k], initForm?.[f.k]) ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius:7, padding:'9px 12px', color:'#e2e8f0', fontFamily:"'Exo 2'", fontSize:14, outline:'none', boxSizing:'border-box' }} />
            {!isEqual(form[f.k], initForm?.[f.k]) && <div style={{ fontSize:10, color:'#f59e0b', marginTop:4, fontFamily:"'Rajdhani'" }}>Modified</div>}
          </div>
        ))}
      </div>

      <div>
        <SL>Result</SL>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
          {['Victory','Defeat','Unknown'].map(r => (
            <button key={r} onClick={() => setF('result', r)}
              style={{
                padding:'10px 8px', borderRadius:8, cursor:'pointer',
                fontFamily:"'Rajdhani'", fontWeight:700, fontSize:14, border:'1px solid',
                borderColor: form.result===r ? (r==='Victory'?'rgba(74,222,128,0.5)':r==='Defeat'?'rgba(248,113,113,0.5)':'rgba(100,116,139,0.5)') : 'rgba(255,255,255,0.08)',
                background: form.result===r ? (r==='Victory'?'rgba(74,222,128,0.12)':r==='Defeat'?'rgba(248,113,113,0.12)':'rgba(100,116,139,0.1)') : 'rgba(0,0,0,0.2)',
                color: form.result===r ? (r==='Victory'?'#4ade80':r==='Defeat'?'#f87171':'#94a3b8') : '#475569',
                transition:'all 0.2s ease',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <SL>Activity</SL>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <input type="range" min="0" max="100" value={safeN(form.activity)} onChange={e => setF('activity', Number(e.target.value))}
            style={{ flex:1, accentColor:'#f59e0b' }} />
          <span style={{ fontSize:18, fontWeight:800, color:'#fbbf24', fontFamily:"'Share Tech Mono'", width:50, textAlign:'right' }}>{safeN(form.activity)}%</span>
        </div>
      </div>

      <div>
        <SL>Battle Timestamp</SL>
        <div style={{ marginBottom:8 }}>
          <label style={{ fontSize:9, color:'#475569', fontFamily:"'Rajdhani'", textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:6 }}>Date &amp; Time</label>
          <input type="datetime-local"
            value={form.timestamp ? new Date(form.timestamp).toISOString().slice(0,16) : ''}
            onChange={e => setF('timestamp', e.target.value ? new Date(e.target.value).toISOString() : '')}
            style={{ width:'100%', background:'rgba(0,0,0,0.3)', border:`1px solid ${!isEqual(form.timestamp, initForm?.timestamp) ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius:7, padding:'9px 12px', color:'#e2e8f0', fontFamily:"'Exo 2'", fontSize:14, outline:'none', boxSizing:'border-box', colorScheme:'dark' }} />
        </div>
        {form.timestamp && (
          <div style={{ padding:'6px 10px', background:'rgba(0,0,0,0.2)', borderRadius:6, fontSize:11, color:'#64748b', fontFamily:"'Share Tech Mono'", marginBottom:10 }}>
            {fmtDT(form.timestamp)}
          </div>
        )}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[
            { l:'Now', fn: () => setF('timestamp', new Date().toISOString()) },
            { l:'Today 18:00', fn: () => { const d=new Date(); d.setHours(18,0,0,0); setF('timestamp', d.toISOString()); } },
            { l:'Today 21:00', fn: () => { const d=new Date(); d.setHours(21,0,0,0); setF('timestamp', d.toISOString()); } },
            { l:'Yesterday', fn: () => { const d=new Date(); d.setDate(d.getDate()-1); d.setHours(20,0,0,0); setF('timestamp', d.toISOString()); } },
          ].map(p => (
            <button key={p.l} onClick={p.fn} style={{ padding:'4px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, color:'#64748b', fontFamily:"'Share Tech Mono'", fontSize:10, cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >{p.l}</button>
          ))}
        </div>
      </div>
    </div>
  );

  const EditRawTab = () => {
    const [localJson, setLocalJson] = useState('');
    const [error,     setError]     = useState(null);
    const [applied,   setApplied]   = useState(false);

    useEffect(() => {
      const data = { ...rawBattle, ...form, detailedAwards: medals, researchedUnits: resUnits, researchingProgress: resProg };
      setLocalJson(JSON.stringify(data, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFormat = () => {
      try { setLocalJson(JSON.stringify(JSON.parse(localJson), null, 2)); setError(null); }
      catch(e) { setError(e.message); }
    };

    const handleApply = () => {
      try {
        const p = JSON.parse(localJson);
        setError(null);
        const f = {
          result: p.result||'Unknown', missionType: p.missionType||'', missionName: p.missionName||'',
          killsAircraft: safeN(p.killsAircraft), killsGround: safeN(p.killsGround),
          assists: safeN(p.assists), damage: safeN(p.damage), severeDamage: safeN(p.severeDamage),
          criticalDamage: safeN(p.criticalDamage), captures: safeN(p.captures), activity: safeN(p.activity),
          earnedSL: safeN(p.earnedSL), totalRP: safeN(p.totalRP), earnedCRP: safeN(p.earnedCRP),
          awardsSL: safeN(p.awardsSL), awardsRP: safeN(p.awardsRP), rewardSL: safeN(p.rewardSL),
          skillBonusRP: safeN(p.skillBonusRP), autoRepairCost: safeN(p.autoRepairCost),
          autoAmmoCrewCost: safeN(p.autoAmmoCrewCost), totalSL: safeN(p.totalSL), totalCRP: safeN(p.totalCRP),
          activityTimeSL: safeN(p.activityTimeSL), activityTimeRP: safeN(p.activityTimeRP),
          timePlayedRP: safeN(p.timePlayedRP), session: p.session||'', timestamp: p.timestamp||'',
        };
        setForm(f);
        setMedals((p.detailedAwards||p.awards_detail||[]).map((a,i) => ({ id:`m${i}${Date.now()}`, award:a.award||'Award', sl:safeN(a.sl), rp:safeN(a.rp), timeSec:a.timeSec??null })));
        setResUnits((p.researchedUnits||[]).map((x,i) => ({ id:`ru${i}`, unit:x.unit||'', rp:safeN(x.rp) })));
        setResProg((p.researchingProgress||[]).map((x,i) => ({ id:`rp${i}`, unit:x.unit||'', item:x.item||'', rp:safeN(x.rp) })));
        setApplied(true); setTimeout(() => setApplied(false), 2000);
      } catch(e) { setError(e.message); }
    };

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <SL>Raw JSON Editor</SL>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleFormat} style={{ padding:'5px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#94a3b8', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Format
            </button>
            <button onClick={handleApply} style={{
              display:'flex', alignItems:'center', gap:6, padding:'5px 14px',
              background: applied ? 'rgba(74,222,128,0.12)' : error ? 'rgba(248,113,113,0.12)' : 'rgba(245,158,11,0.1)',
              border:`1px solid ${applied ? 'rgba(74,222,128,0.35)' : error ? 'rgba(248,113,113,0.35)' : 'rgba(245,158,11,0.3)'}`,
              borderRadius:6, color: applied ? '#4ade80' : error ? '#f87171' : '#fbbf24',
              fontFamily:"'Rajdhani'", fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.08em',
            }}>
              {applied ? <Check size={12}/> : error ? <AlertTriangle size={12}/> : <Save size={12}/>}
              {applied ? 'Applied!' : 'Apply to All Tabs'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding:'10px 14px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:8, fontSize:12, color:'#fca5a5', fontFamily:"'Share Tech Mono'" }}>
            JSON Error: {error}
          </div>
        )}

        <div style={{ flex:1, position:'relative', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden', minHeight:400 }}>
          <textarea
            value={localJson} onChange={e => { setLocalJson(e.target.value); if(error) setError(null); }}
            spellCheck={false}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', border:'none', padding:18, color:'#94a3b8', fontFamily:"'Share Tech Mono'", fontSize:12, lineHeight:1.6, outline:'none', resize:'none', boxSizing:'border-box' }}
          />
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:11, color:'#334155', fontFamily:"'Exo 2'" }}>
          <Info size={12} style={{ color:'#3b82f6' }} />
          Clicking "Apply to All Tabs" will update every other edit tab immediately.
        </div>
      </div>
    );
  };

  // ── Tab router ────────────────────────────────────────────────────────────

  const renderTab = () => {
    switch(tab) {
      case 'overview':     return <OverviewTab />;
      case 'events':       return <EventsTab />;
      case 'awards':       return <AwardsViewTab />;
      case 'vehicles':     return <VehiclesTab />;
      case 'research':     return <ResearchViewTab />;
      case 'raw':          return <RawTab />;
      case 'edit-overview':return <EditOverviewTab />;
      case 'edit-combat':  return <EditCombatTab />;
      case 'edit-economy': return <EditEconomyTab />;
      case 'edit-awards':  return <EditAwardsTab />;
      case 'edit-research':return <EditResearchTab />;
      case 'edit-meta':    return <EditMetaTab />;
      case 'edit-raw':     return <EditRawTab />;
      default:             return <OverviewTab />;
    }
  };

  // ─── Portal render ────────────────────────────────────────────────────────

  const overlay = (
    <div style={{
      position:'fixed', inset:0, zIndex:99999,
      display:'flex', flexDirection:'column',
      background: mounted ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0)',
      backdropFilter:'blur(8px)',
      transition:'background 0.25s ease',
    }}>
      {/* Panel */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        background:'#080b0f',
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        opacity: mounted ? 1 : 0,
        transition:'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
        position:'relative', overflow:'hidden',
        boxShadow: isEdit ? '0 0 0 1px rgba(245,158,11,0.2), 0 0 60px rgba(245,158,11,0.04) inset' : 'none',
      }}>
        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${RT.bar},${RT.bar},transparent)`, zIndex:1, boxShadow:`0 0 20px ${RT.glow}` }} />

        {/* Edit banner */}
        {isEdit && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            padding:'8px 20px',
            background:'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.04))',
            borderBottom:'1px solid rgba(245,158,11,0.15)',
            flexShrink:0,
          }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', animation:'bpo-pulse 1.2s ease infinite' }} />
            <span style={{ fontFamily:"'Rajdhani'", fontWeight:800, fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#fbbf24' }}>
              ⚡ Edit Mode Active
            </span>
            {hasChanges && (
              <span style={{
                padding:'2px 10px', borderRadius:20, background:'#f59e0b', color:'#0d1117',
                fontFamily:"'Rajdhani'", fontWeight:800, fontSize:11,
              }}>
                {changeCount} unsaved change{changeCount!==1?'s':''}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div style={{ flexShrink:0, padding:'16px 24px 0', background:`linear-gradient(135deg, ${RT.glow}, transparent)` }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:12 }}>
            {/* Result badge */}
            <div style={{
              flexShrink:0, width:72, height:72, borderRadius:14,
              background:`${RT.badge}18`, border:`2px solid ${RT.badge}50`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              textAlign:'center', boxShadow:`0 0 24px ${RT.glow}`,
            }}>
              <span style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:`${RT.badge}80`, fontFamily:"'Rajdhani'", marginBottom:2 }}>Result</span>
              <span style={{ fontSize:14, fontWeight:800, color: RT.badge, fontFamily:"'Exo 2'", lineHeight:1.2 }}>{display?.result||'Unknown'}</span>
            </div>

            {/* Mission */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:"'Rajdhani'", fontWeight:700, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color: RT.bar }}>
                  {display?.missionType || 'Battle'}
                </span>
                {display?.session && <span style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:'#334155' }}>· {display.session}</span>}
                {isEdit && hasChanges && (
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#fbbf24', fontFamily:"'Exo 2'" }}>
                    <AlertTriangle size={11}/> Unsaved changes
                  </span>
                )}
              </div>
              <h2 style={{ fontFamily:"'Rajdhani'", fontWeight:800, fontSize:26, color:'#f8fafc', letterSpacing:'-0.01em', margin:'0 0 8px', lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {display?.missionName || 'Unknown Mission'}
              </h2>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'#64748b' }}>
                {display?.timestamp && (
                  <span style={{ display:'flex', alignItems:'center', gap:5, color:'#94a3b8' }}>
                    <Clock size={11} style={{ color:'#475569' }}/> {fmtDT(display.timestamp)}
                  </span>
                )}
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <Activity size={11}/> Activity <strong style={{ color:'#94a3b8', marginLeft:2 }}>{display?.activity||0}%</strong>
                </span>
                {totalKills>0 && <span style={{ display:'flex', alignItems:'center', gap:5, color:'#f87171' }}><Skull size={11}/> <strong>{totalKills} kill{totalKills!==1?'s':''}</strong></span>}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {!isEdit ? (
                <>
                  <button onClick={enterEdit} style={{
                    display:'flex', alignItems:'center', gap:7,
                    padding:'8px 16px', borderRadius:9,
                    background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.35)',
                    color:'#fbbf24', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:13,
                    cursor:'pointer', transition:'all 0.2s ease',
                  }}>
                    <Pencil size={14}/> Edit Battle
                  </button>
                  {onDelete && (
                    <button onClick={() => setDeleteConf(true)} style={{ padding:'8px', borderRadius:8, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Trash2 size={15}/>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={handleSave} style={{
                    display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:9,
                    background: saveFlash ? '#4ade80' : '#22c55e',
                    border: saveFlash ? '1px solid #86efac' : '1px solid rgba(34,197,94,0.5)',
                    color: saveFlash ? '#052e16' : '#fff',
                    fontFamily:"'Rajdhani'", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                  }}>
                    {saveFlash ? <Check size={14}/> : <Save size={14}/>} {saveFlash?'Saved!':'Save'}
                  </button>
                  {hasChanges && (
                    <button onClick={handleRevert} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      <RotateCcw size={13}/> Revert
                    </button>
                  )}
                  <button onClick={exitEdit} style={{ padding:'8px 14px', borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    Done
                  </button>
                </>
              )}
              <button onClick={requestClose} style={{ padding:'8px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
              >
                <X size={17}/>
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', gap:2, overflowX:'auto', borderBottom:`1px solid ${isEdit ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
            {activeTabs.map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => switchTab(t.id)} style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'10px 16px', fontSize:11, fontWeight:600, whiteSpace:'nowrap',
                  borderBottom:`2px solid ${active ? (isEdit?'#f59e0b':'#f59e0b') : 'transparent'}`,
                  marginBottom:-1, cursor:'pointer', background:'transparent', border:'none',
                  fontFamily:"'Rajdhani'", letterSpacing:'0.06em', textTransform:'uppercase',
                  color: active ? (isEdit?'#fbbf24':'#fbbf24') : '#475569',
                  transition:'all 0.18s ease',
                }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.color='#94a3b8'; }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.color='#475569'; }}
                >
                  {t.icon} {t.label}
                  {active && <div style={{ width:4, height:4, borderRadius:'50%', background:'#f59e0b', animation:'bpo-pulse 1.5s ease infinite' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div key={tabKey} style={{
          flex:1, overflowY:'auto', padding:'24px 28px',
          animation:'bpo-tab-in 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {renderTab()}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 24px', gap:16,
          borderTop: isEdit ? '1px solid rgba(245,158,11,0.12)' : '1px solid rgba(255,255,255,0.05)',
          background: isEdit ? 'rgba(245,158,11,0.03)' : 'rgba(0,0,0,0.3)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:11, color:'#334155' }}>
            <span style={{ fontFamily:"'Share Tech Mono'" }}>{rawBattle?.id?.slice(0,14)}…</span>
            {display?.timestamp && <span style={{ fontFamily:"'Exo 2'" }}>{fmtD(display.timestamp)} · {fmtT(display.timestamp)}</span>}
            {isEdit && hasChanges && (
              <span style={{ display:'flex', alignItems:'center', gap:5, color:'#fbbf24', fontFamily:"'Exo 2'", fontWeight:600 }}>
                <AlertTriangle size={11}/> {changeCount} unsaved change{changeCount!==1?'s':''}
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {isEdit ? (
              <>
                <button onClick={handleSave} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'7px 18px', borderRadius:8,
                  background: saveFlash ? '#4ade80' : '#22c55e', border: 'none',
                  color: saveFlash ? '#052e16' : '#fff',
                  fontFamily:"'Rajdhani'", fontWeight:700, fontSize:13, cursor:'pointer',
                }}>
                  {saveFlash ? <Check size={13}/> : <Save size={13}/>} {saveFlash?'Saved!':'Save Changes'}
                </button>
                {hasChanges && <button onClick={handleRevert} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  <RotateCcw size={12}/> Revert
                </button>}
              </>
            ) : onDelete && (
              <button onClick={() => setDeleteConf(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:12, cursor:'pointer' }}>
                <Trash2 size={13}/> Delete
              </button>
            )}
            <button onClick={requestClose} style={{ padding:'7px 18px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:13, cursor:'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm dialogs ── */}
      {deleteConf && <ConfirmDialog
        icon={<Trash2 size={28} style={{ color:'#f87171' }}/>}
        title="Delete Battle?" msg="This action cannot be undone."
        confirmLabel="Delete" confirmColor="#ef4444" confirmBg="rgba(239,68,68,0.15)"
        onCancel={() => setDeleteConf(false)}
        onConfirm={() => { setDeleteConf(false); onDelete && onDelete(rawBattle); }}
      />}
      {cancelConf && <ConfirmDialog
        icon={<AlertTriangle size={28} style={{ color:'#fbbf24' }}/>}
        title="Discard Changes?"
        msg={`You have ${changeCount} unsaved change${changeCount!==1?'s':''}. They will be lost.`}
        confirmLabel="Discard" confirmColor="#f59e0b" confirmBg="rgba(245,158,11,0.12)"
        cancelLabel="Keep Editing"
        onCancel={() => setCancelConf(false)}
        onConfirm={() => { setCancelConf(false); handleRevert(); setMode('view'); switchTab('overview'); }}
      />}
      {closeConf && <ConfirmDialog
        icon={<AlertTriangle size={28} style={{ color:'#fbbf24' }}/>}
        title="Close with Unsaved Changes?"
        msg={`You have ${changeCount} unsaved change${changeCount!==1?'s':''}. They will be lost if you close.`}
        confirmLabel="Close Anyway" confirmColor="#f59e0b" confirmBg="rgba(245,158,11,0.12)"
        cancelLabel="Stay"
        onCancel={() => setCloseConf(false)}
        onConfirm={() => { setCloseConf(false); onClose(); }}
      />}

      {/* Scoped styles */}
      <style>{`
        @keyframes bpo-card { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:none} }
        @keyframes bpo-row  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        @keyframes bpo-tab-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes bpo-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes bpo-modal { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:none} }

        .wt-overlay-open .wt-navbar { display: none !important; }

        /* scrollbars inside overlay */
        [data-wt-overlay] ::-webkit-scrollbar { width: 5px; height: 5px; }
        [data-wt-overlay] ::-webkit-scrollbar-track { background: transparent; }
        [data-wt-overlay] ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.2); border-radius: 99px; }
        [data-wt-overlay] ::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.4); }
      `}</style>
    </div>
  );

  return createPortal(overlay, document.body);
};

// ─── Confirm dialog ────────────────────────────────────────────────────────────

const ConfirmDialog = ({ icon, title, msg, confirmLabel, confirmColor, confirmBg, cancelLabel = 'Cancel', onCancel, onConfirm }) => (
  <div style={{
    position:'fixed', inset:0, zIndex:100000,
    display:'flex', alignItems:'center', justifyContent:'center',
    background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
    animation:'bpo-modal 0.2s ease both',
  }}>
    <div style={{
      background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)',
      borderRadius:14, padding:'32px 28px', maxWidth:380, width:'100%',
      margin:'0 16px', boxShadow:'0 24px 64px rgba(0,0,0,0.7)',
    }}>
      <div style={{ marginBottom:14 }}>{icon}</div>
      <h3 style={{ fontFamily:"'Rajdhani'", fontWeight:800, fontSize:20, color:'#f8fafc', margin:'0 0 8px' }}>{title}</h3>
      <p style={{ fontFamily:"'Exo 2'", fontSize:13, color:'#64748b', margin:'0 0 24px', lineHeight:1.5 }}>{msg}</p>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onCancel} style={{ flex:1, padding:'10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontFamily:"'Rajdhani'", fontWeight:700, fontSize:13, cursor:'pointer' }}>
          {cancelLabel}
        </button>
        <button onClick={onConfirm} style={{ flex:1, padding:'10px', borderRadius:8, background:confirmBg, border:`1px solid ${confirmColor}44`, color:confirmColor, fontFamily:"'Rajdhani'", fontWeight:700, fontSize:13, cursor:'pointer' }}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default BattlePreviewOverlay;