/**
 * StatsPage.jsx  ─  War Thunder Stats Dashboard
 *
 * Military tactical HUD aesthetic. Every animation, every icon, every chart.
 * Amber/steel/blood-red color language. Scanlines, glow effects, hex grids.
 * Lazy-loaded chart sections. Animated counters. Full per-vehicle breakdown.
 */

import React, {
  useState, useMemo, useEffect, useRef, useCallback,
  Suspense, lazy, memo
} from 'react';
import {
  BarChart2, Map, TrendingUp, Target, Award, Clock,
  DollarSign, Zap, Users, Calendar, Shield, Crosshair,
  ChevronRight, ChevronUp, ChevronDown, Flame, Star,
  Activity, AlertTriangle, CheckCircle, XCircle,
  Plane, Truck, Anchor, Sword, Trophy, Radio,
  BarChart, PieChart as PieIcon, TrendingDown, Eye,
  Flag
} from 'lucide-react';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ComposedChart, Scatter, ScatterChart,
  FunnelChart, Funnel, LabelList, ReferenceLine,
} from 'recharts';
import { calculateStats } from '../utils/statsCalculator';
import { lookupVehicle as extractVehicleInfo } from '../utils/vehicleRegistry';
import CountryFlag from './CountryFlag';
import ItemTypeIcon from './ItemTypeIcon';
import VehicleIcon from './VehicleIcon';

// ─── STYLE INJECTION ─────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap');

  :root {
    --wt-bg-void:       #070a0d;
    --wt-bg-deep:       #0d1117;
    --wt-bg-panel:      #111820;
    --wt-bg-raised:     #161e28;
    --wt-bg-card:       #1a2233;
    --wt-bg-hover:      #1f2a3d;
    --wt-amber:         #f59e0b;
    --wt-amber-dim:     #b45309;
    --wt-amber-glow:    rgba(245,158,11,0.18);
    --wt-amber-bright:  #fbbf24;
    --wt-red:           #ef4444;
    --wt-red-dim:       #991b1b;
    --wt-red-glow:      rgba(239,68,68,0.15);
    --wt-green:         #22c55e;
    --wt-green-dim:     #166534;
    --wt-green-glow:    rgba(34,197,94,0.15);
    --wt-blue:          #3b82f6;
    --wt-blue-dim:      #1d4ed8;
    --wt-blue-glow:     rgba(59,130,246,0.15);
    --wt-purple:        #a855f7;
    --wt-purple-dim:    #7e22ce;
    --wt-steel:         #94a3b8;
    --wt-steel-dim:     #475569;
    --wt-border:        rgba(59,130,246,0.15);
    --wt-border-bright: rgba(59,130,246,0.4);
    --wt-text-primary:  #e2e8f0;
    --wt-text-muted:    #64748b;
    --wt-text-dim:      #94a3b8;
    --wt-font-display:  'Rajdhani', 'Exo 2', sans-serif;
    --wt-font-mono:     'Share Tech Mono', 'JetBrains Mono', monospace;
    --wt-font-body:     'Exo 2', sans-serif;
    --wt-radius:        6px;
    --wt-radius-lg:     10px;
    --wt-transition:    0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Keyframes ──────────────────────────────────────────────────────── */

  @keyframes wt-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes wt-slide-left {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes wt-slide-right {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes wt-scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes wt-pulse-amber {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
    50%       { box-shadow: 0 0 16px 4px rgba(245,158,11,0.22); }
  }
  @keyframes wt-pulse-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
    50%       { box-shadow: 0 0 16px 4px rgba(239,68,68,0.22); }
  }
  @keyframes wt-pulse-green {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    50%       { box-shadow: 0 0 16px 4px rgba(34,197,94,0.22); }
  }
  @keyframes wt-scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(200%); }
  }
  @keyframes wt-counter-up {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes wt-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes wt-border-march {
    0%   { background-position: 0 0, 100% 0, 100% 100%, 0 100%; }
    100% { background-position: 200% 0, 100% 200%, -100% 100%, 0 -100%; }
  }
  @keyframes wt-glow-amber {
    0%, 100% { text-shadow: 0 0 6px rgba(245,158,11,0.4); }
    50%       { text-shadow: 0 0 18px rgba(245,158,11,0.9), 0 0 35px rgba(245,158,11,0.4); }
  }
  @keyframes wt-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes wt-rotation {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes wt-bounce-soft {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }
  @keyframes wt-number-roll {
    0%   { transform: translateY(100%); opacity: 0; }
    100% { transform: translateY(0%);   opacity: 1; }
  }
  @keyframes wt-bar-grow {
    from { transform: scaleX(0); transform-origin: left; }
    to   { transform: scaleX(1); transform-origin: left; }
  }
  @keyframes wt-radar-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes wt-victory-flash {
    0%   { background-color: rgba(34,197,94,0); }
    25%  { background-color: rgba(34,197,94,0.15); }
    100% { background-color: rgba(34,197,94,0); }
  }

  /* ── Base Component Styles ──────────────────────────────────────────── */

  .wt-page {
    font-family: var(--wt-font-body);
    background: var(--wt-bg-deep);
    color: var(--wt-text-primary);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }
  .wt-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(59,130,246,0.008) 2px,
        rgba(59,130,246,0.008) 4px
      );
    pointer-events: none;
    z-index: 0;
  }
  .wt-page > * { position: relative; z-index: 1; }

  .wt-hex-bg {
    background-image: radial-gradient(circle at 1px 1px, rgba(59,130,246,0.05) 1px, transparent 0);
    background-size: 28px 28px;
  }

  .wt-panel {
    background: var(--wt-bg-panel);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius-lg);
    transition: border-color var(--wt-transition), box-shadow var(--wt-transition);
  }
  .wt-panel:hover {
    border-color: var(--wt-border-bright);
    box-shadow: 0 0 20px rgba(59,130,246,0.06);
  }

  .wt-card {
    background: var(--wt-bg-card);
    border: 1px solid rgba(59,130,246,0.12);
    border-radius: var(--wt-radius);
    transition: all var(--wt-transition);
  }
  .wt-card:hover {
    border-color: rgba(59,130,246,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 16px rgba(59,130,246,0.08);
  }

  .wt-animate-in {
    animation: wt-fade-in 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  .wt-animate-in-left {
    animation: wt-slide-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  .wt-animate-scale {
    animation: wt-scale-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .wt-stagger-1 { animation-delay: 0.05s; }
  .wt-stagger-2 { animation-delay: 0.10s; }
  .wt-stagger-3 { animation-delay: 0.15s; }
  .wt-stagger-4 { animation-delay: 0.20s; }
  .wt-stagger-5 { animation-delay: 0.25s; }
  .wt-stagger-6 { animation-delay: 0.30s; }
  .wt-stagger-7 { animation-delay: 0.35s; }
  .wt-stagger-8 { animation-delay: 0.40s; }

  .wt-display { font-family: var(--wt-font-display); font-weight: 700; letter-spacing: 0.02em; }
  .wt-mono    { font-family: var(--wt-font-mono); }
  .wt-glow-amber { animation: wt-glow-amber 2.5s ease-in-out infinite; }

  .wt-number {
    font-family: var(--wt-font-mono);
    font-weight: 400;
    animation: wt-counter-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .wt-shimmer {
    background: linear-gradient(90deg,
      transparent 0%, rgba(59,130,246,0.15) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: wt-shimmer 2s linear infinite;
  }

  /* ── Tab System ─────────────────────────────────────────────────────── */
  .wt-tab-bar {
    display: flex;
    gap: 4px;
    background: var(--wt-bg-void);
    border: 1px solid var(--wt-border);
    border-radius: 8px;
    padding: 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .wt-tab-bar::-webkit-scrollbar { display: none; }

  .wt-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 5px;
    font-family: var(--wt-font-display);
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--wt-transition);
    white-space: nowrap;
    color: var(--wt-text-muted);
    background: transparent;
  }
  .wt-tab:hover {
    color: #60a5fa;
    background: rgba(59,130,246,0.07);
    border-color: rgba(59,130,246,0.2);
  }
  .wt-tab.active {
    color: #fff;
    font-weight: 700;
    border-color: rgba(59,130,246,0.4);
    background: rgba(59,130,246,0.15);
    box-shadow: 0 2px 8px rgba(59,130,246,0.2);
  }

  /* ── KPI Cards ──────────────────────────────────────────────────────── */
  .wt-kpi {
    position: relative;
    overflow: hidden;
    border-radius: var(--wt-radius-lg);
    padding: 18px 20px;
    transition: all var(--wt-transition);
    cursor: default;
  }
  .wt-kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0.6;
  }
  .wt-kpi::after {
    content: '';
    position: absolute;
    bottom: -30px; right: -30px;
    width: 90px; height: 90px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.05;
    transition: transform var(--wt-transition);
  }
  .wt-kpi:hover::after { transform: scale(1.4); }
  .wt-kpi:hover { transform: translateY(-3px); }

  /* ── Progress bars ──────────────────────────────────────────────────── */
  .wt-progress-track {
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
  }
  .wt-progress-fill {
    height: 100%;
    border-radius: 3px;
    animation: wt-bar-grow 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: 0.2s;
  }

  /* ── Vehicle rows ───────────────────────────────────────────────────── */
  .wt-vehicle-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--wt-radius);
    border: 1px solid rgba(59,130,246,0.08);
    background: var(--wt-bg-raised);
    transition: all var(--wt-transition);
  }
  .wt-vehicle-row:hover {
    border-color: rgba(59,130,246,0.3);
    background: var(--wt-bg-hover);
    transform: translateX(4px);
    box-shadow: 4px 0 12px rgba(59,130,246,0.1);
  }

  /* ── Section headers ────────────────────────────────────────────────── */
  .wt-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--wt-font-display);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .wt-section-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 60px; height: 2px;
    border-radius: 1px;
  }

  /* ── Scrollbar ──────────────────────────────────────────────────────── */
  .wt-page *::-webkit-scrollbar { width: 6px; height: 6px; }
  .wt-page *::-webkit-scrollbar-track { background: var(--wt-bg-void); }
  .wt-page *::-webkit-scrollbar-thumb {
    background: rgba(59,130,246,0.35);
    border-radius: 3px;
  }
  .wt-page *::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.6); }

  /* ── Tooltip override ───────────────────────────────────────────────── */
  .wt-chart-tooltip {
    background: #0d1117 !important;
    border: 1px solid rgba(59,130,246,0.3) !important;
    border-radius: 6px !important;
    font-family: var(--wt-font-mono) !important;
    font-size: 12px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 12px rgba(59,130,246,0.08) !important;
    color: #e2e8f0 !important;
  }

  /* ── Award badge ────────────────────────────────────────────────────── */
  .wt-award-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 4px;
    font-family: var(--wt-font-display);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    border: 1px solid rgba(245,158,11,0.3);
    background: rgba(245,158,11,0.08);
    color: var(--wt-amber);
    transition: all var(--wt-transition);
  }
  .wt-award-badge:hover {
    background: rgba(245,158,11,0.18);
    border-color: var(--wt-amber);
    box-shadow: 0 0 10px rgba(245,158,11,0.15);
  }

  /* ── Divider ────────────────────────────────────────────────────────── */
  .wt-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--wt-border-bright), transparent);
    margin: 20px 0;
  }

  /* ── Stat pair ──────────────────────────────────────────────────────── */
  .wt-stat-pair {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 13px;
  }
  .wt-stat-pair:last-child { border-bottom: none; }

  /* ── Rank badge ─────────────────────────────────────────────────────── */
  .wt-rank-badge {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px;
    font-family: var(--wt-font-display);
    font-weight: 700;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* ── Lazy section wrapper ───────────────────────────────────────────── */
  .wt-lazy-section {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .wt-lazy-section.wt-visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── User selector ──────────────────────────────────────────────────── */
  .wt-select {
    appearance: none;
    background: var(--wt-bg-card);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius);
    color: var(--wt-text-primary);
    font-family: var(--wt-font-body);
    font-size: 14px;
    padding: 10px 40px 10px 14px;
    cursor: pointer;
    width: 100%;
    transition: all var(--wt-transition);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }
  .wt-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12), 0 0 12px rgba(59,130,246,0.08);
  }
  .wt-select option {
    background: #1a2233;
    color: #e2e8f0;
  }

  /* ── Recharts override ──────────────────────────────────────────────── */
  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line {
    stroke: rgba(59,130,246,0.07) !important;
  }
  .recharts-text { fill: #64748b !important; font-family: var(--wt-font-mono) !important; font-size: 11px !important; }
  .recharts-legend-item-text { fill: #94a3b8 !important; font-size: 12px !important; }

  /* ── Recent battle list ─────────────────────────────────────────────── */
  .wt-battle-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--wt-radius);
    border-left: 3px solid transparent;
    background: var(--wt-bg-raised);
    transition: all var(--wt-transition);
    font-size: 13px;
  }
  .wt-battle-item:hover { background: var(--wt-bg-hover); }
  .wt-battle-item.victory { border-left-color: var(--wt-green); }
  .wt-battle-item.defeat  { border-left-color: var(--wt-red); }
  .wt-battle-item.unknown { border-left-color: var(--wt-steel-dim); }

  /* ── Hero stat ring ─────────────────────────────────────────────────── */
  @keyframes wt-ring-fill {
    from { stroke-dashoffset: 283; }
    to   { stroke-dashoffset: var(--target-dash); }
  }
  .wt-ring-path {
    animation: wt-ring-fill 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
  }
`;

// ─── STYLE INJECTOR ────────────────────────────────────────────────────────

function StyleInjector() {
  useEffect(() => {
    const id = 'wt-stats-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
    return () => { /* keep styles across hot-reloads */ };
  }, []);
  return null;
}

// ─── HOOKS ────────────────────────────────────────────────────────────────

/** Intersection-observer based lazy visibility for sections */
function useInView(threshold = 0.1) {
  const ref  = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/** Animated integer counter */
function useCounter(target, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    if (!target || isNaN(target)) return;
    const from = 0;
    const to   = parseFloat(target);

    const tick = (ts) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * ease;
      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); start.current = null; };
  }, [target, duration, decimals]);

  return value;
}

/** Animated decimal counter (for ratios, percentages) */
function useCounterFloat(target, decimals = 2, duration = 1000) {
  return useCounter(target, duration, decimals);
}

// ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────

const fmt = (n, d = 0) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '0';

const fmtK = (n) => {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const fmtTime = (sec) => {
  if (!sec || !Number.isFinite(sec)) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2,'0')}s`;
};

const fmtPct = (n, d = 1) =>
  Number.isFinite(n) ? `${n.toFixed(d)}%` : '0%';

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border: '1px solid rgba(59,130,246,0.3)',
  borderRadius: '6px',
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  color: '#e2e8f0',
};

// ─── CHART COLOR PALETTES ─────────────────────────────────────────────────

const AMBER_SHADES   = ['#f59e0b','#d97706','#b45309','#92400e','#78350f'];
const BATTLE_COLORS  = ['#22c55e','#ef4444','#64748b'];
const COMBAT_PALETTE = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7'];
const ECONOMY_PALETTE= ['#22c55e','#3b82f6','#a855f7','#f59e0b','#06b6d4','#10b981','#f97316','#ef4444'];

// ─── VEHICLE TYPE CONFIG ──────────────────────────────────────────────────

const VEHICLE_TYPE_CONFIG = {
  aviation: {
    icon: Plane,
    color: '#3b82f6',
    label: 'Aircraft',
    glow: 'rgba(59,130,246,0.35)',
  },
  ground: {
    icon: Truck,
    color: '#f97316',
    label: 'Ground',
    glow: 'rgba(249,115,22,0.35)',
  },
  naval: {
    icon: Anchor,
    color: '#06b6d4',
    label: 'Naval',
    glow: 'rgba(6,182,212,0.35)',
  },
  helicopter: {
    icon: Plane,
    color: '#8b5cf6',
    label: 'Helicopter',
    glow: 'rgba(139,92,246,0.35)',
  },
  default: {
    icon: Shield,
    color: '#94a3b8',
    label: 'Unknown',
    glow: 'rgba(148,163,184,0.25)',
  },
};

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────

/** Glowing ring SVG for win rate hero display */
const WinRateRing = memo(({ winRate }) => {
  const circumference = 283;
  const dashOffset = circumference * (1 - Math.min(winRate, 100) / 100);
  const color = winRate >= 55 ? '#22c55e' : winRate >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 20, fontWeight: 700, color }}>
          {winRate.toFixed(1)}%
        </span>
        <span style={{ fontSize: 9, color: '#64748b', letterSpacing: '0.1em', marginTop: 1 }}>WIN RATE</span>
      </div>
    </div>
  );
});

/** Animated KPI card with glow */
const KpiCard = memo(({ label, value, icon: Icon, color, subtext, delay = 0, unit = '', compact = false }) => {
  const [ref, vis] = useInView(0.1);

  const colorMap = {
    amber:  { bg: 'from-amber-900/40 to-amber-950/60',  border: 'rgba(245,158,11,0.35)',  text: '#f59e0b', glow: 'rgba(245,158,11,0.12)' },
    red:    { bg: 'from-red-900/40 to-red-950/60',      border: 'rgba(239,68,68,0.35)',   text: '#ef4444', glow: 'rgba(239,68,68,0.12)' },
    green:  { bg: 'from-green-900/40 to-green-950/60',  border: 'rgba(34,197,94,0.35)',   text: '#22c55e', glow: 'rgba(34,197,94,0.12)' },
    blue:   { bg: 'from-blue-900/40 to-blue-950/60',    border: 'rgba(59,130,246,0.35)',  text: '#3b82f6', glow: 'rgba(59,130,246,0.12)' },
    purple: { bg: 'from-purple-900/40 to-purple-950/60',border: 'rgba(168,85,247,0.35)', text: '#a855f7', glow: 'rgba(168,85,247,0.12)' },
    steel:  { bg: 'from-slate-800/60 to-slate-900/60',  border: 'rgba(148,163,184,0.2)',  text: '#94a3b8', glow: 'rgba(148,163,184,0.06)' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      ref={ref}
      className="wt-kpi"
      style={{
        color: c.text,
        background: `linear-gradient(135deg, ${c.glow}, transparent)`,
        border: `1px solid ${c.border}`,
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
        boxShadow: vis ? `0 4px 20px rgba(0,0,0,0.3), inset 0 0 20px ${c.glow}` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: compact ? 4 : 8 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Rajdhani'", fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {Icon && <Icon size={compact ? 16 : 18} style={{ color: c.text, opacity: 0.7 }} />}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: compact ? 22 : 28, fontWeight: 700, color: c.text, lineHeight: 1 }}>
        {value}{unit}
      </div>
      {subtext && (
        <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontFamily: "'Exo 2'" }}>
          {subtext}
        </div>
      )}
    </div>
  );
});

/** Thin labeled stat row */
const StatRow = memo(({ label, value, highlight, bar, barMax, color }) => (
  <div className="wt-stat-pair">
    <span style={{ color: '#64748b', fontSize: 12, fontFamily: "'Exo 2'" }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {bar && barMax > 0 && (
        <div className="wt-progress-track" style={{ width: 60 }}>
          <div className="wt-progress-fill" style={{ width: `${Math.min((value/barMax)*100,100)}%`, background: color || '#3b82f6' }} />
        </div>
      )}
      <span className="wt-mono" style={{ fontSize: 13, color: highlight || '#e2e8f0', fontWeight: 700 }}>
        {typeof value === 'number' ? fmt(value) : value}
      </span>
    </div>
  </div>
));

/** Section header component */
const SectionHeader = memo(({ icon: Icon, label, color = '#60a5fa', size = 'md', sub }) => {
  const sizes = { sm: 16, md: 22, lg: 26 };
  const fontSizes = { sm: 14, md: 18, lg: 24 };
  return (
    <div className="wt-section-header" style={{ '--sh-color': color, color, fontSize: fontSizes[size] }}>
      <div style={{ width: 3, height: fontSizes[size] * 1.4, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}` }} />
      {Icon && <Icon size={sizes[size]} style={{ color }} />}
      <span className="wt-display" style={{ color: '#e2e8f0', fontSize: fontSizes[size] }}>{label}</span>
      {sub && <span style={{ fontSize: 12, color: '#475569', fontWeight: 400, marginLeft: 4, fontFamily: "'Exo 2'" }}>— {sub}</span>}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}44, transparent)`, marginLeft: 8 }} />
    </div>
  );
});

/** Chart container with lazy loading */
const ChartCard = memo(({ title, subtitle, icon: Icon, children, color = '#60a5fa', style: extStyle, delay = 0 }) => {
  const [ref, vis] = useInView(0.05);
  return (
    <div
      ref={ref}
      className="wt-panel"
      style={{
        padding: '18px 20px',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
        ...extStyle,
      }}
    >
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid rgba(59,130,246,0.08)', paddingBottom: 12 }}>
          {Icon && <Icon size={16} style={{ color }} />}
          <span style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 14, letterSpacing: '0.07em', textTransform: 'uppercase', color }}>
            {title}
          </span>
          {subtitle && <span style={{ fontSize: 11, color: '#475569', marginLeft: 4 }}>{subtitle}</span>}
        </div>
      )}
      {vis ? children : (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 24, height: 24, border: '2px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'wt-rotation 0.8s linear infinite' }} />
        </div>
      )}
    </div>
  );
});

/** Vehicle leaderboard row with rank medal */
const VehicleLeaderRow = memo(({ rank, vehicle, primary, primaryLabel, secondary, secondaryLabel, country, delay = 0 }) => {
  const [ref, vis] = useInView(0.05);
  const medals = { 1: '#f59e0b', 2: '#94a3b8', 3: '#cd7c2f' };
  const col = medals[rank] || '#475569';

  return (
    <div
      ref={ref}
      className="wt-vehicle-row"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateX(0)' : 'translateX(-16px)',
        transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
      }}
    >
      <div className="wt-rank-badge" style={{ background: rank <= 3 ? `${col}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${col}55`, color: col }}>
        {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: 14, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {vehicle}
        </div>
        {country && (
          <div style={{ fontSize: 11, color: '#475569', fontFamily: "'Share Tech Mono'" }}>{country.toUpperCase()}</div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 16, fontWeight: 700, color: '#60a5fa' }}>
          {typeof primary === 'number' ? fmt(primary) : primary}
        </div>
        <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.05em' }}>{primaryLabel}</div>
      </div>
      {secondary !== undefined && (
        <div style={{ textAlign: 'right', minWidth: 60 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color: '#64748b' }}>
            {typeof secondary === 'number' ? fmt(secondary) : secondary}
          </div>
          <div style={{ fontSize: 10, color: '#475569' }}>{secondaryLabel}</div>
        </div>
      )}
    </div>
  );
});

/** Result pill badge */
const ResultBadge = memo(({ result }) => {
  const cfg = {
    Victory: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', icon: CheckCircle },
    Defeat:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  icon: XCircle },
    Unknown: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', icon: AlertTriangle },
  };
  const c = cfg[result] || cfg.Unknown;
  const Icon = c.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: 11, fontFamily: "'Rajdhani'", fontWeight: 700, letterSpacing: '0.06em' }}>
      <Icon size={11} /> {result.toUpperCase()}
    </span>
  );
});

/** Custom tooltip for recharts */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      {label && <div style={{ color: '#60a5fa', marginBottom: 6, fontSize: 11, letterSpacing: '0.06em' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: '#94a3b8' }}>{p.name}:</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/** Empty state */
const EmptyState = ({ message = 'No data available' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', color: '#475569' }}>
    <Shield size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
    <p style={{ fontFamily: "'Rajdhani'", fontSize: 16, letterSpacing: '0.05em' }}>{message}</p>
  </div>
);

/** Divider */
const Divider = () => <div className="wt-divider" />;

/** Vehicle podium card with animation */
const VehiclePodiumCard = memo(({ vehicle, index }) => {
  const [ref, vis] = useInView(0.05);
  const TypeIcon = VEHICLE_TYPE_CONFIG[vehicle.type]?.icon || Shield;
  const podiumColors = ['#60a5fa', '#94a3b8', '#34d399'];
  const gc = podiumColors[index];
  const emojis = ['🥇','🥈','🥉'];

  return (
    <div
      ref={ref}
      style={{
        background: `linear-gradient(135deg, ${gc}15, transparent)`,
        border: `2px solid ${gc}55`,
        borderRadius: 12,
        padding: '20px 18px',
        position: 'relative',
        overflow: 'hidden',
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'scale(0.9)',
        transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s`,
        textAlign: 'center',
      }}
    >
      <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 20 }}>
        {emojis[index]}
      </div>
      <TypeIcon size={32} style={{ color: gc, marginBottom: 8 }} />
      <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
        {vehicle.displayName}
      </div>
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Exo 2'" }}>
        {vehicle.country} · {vehicle.type}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Kills',    value: fmt(vehicle.kills||0),            color: '#ef4444' },
          { label: 'Battles',  value: fmt(vehicle.battles||0),          color: gc },
          { label: 'SL',       value: fmtK(vehicle.earnedSL||0),        color: '#4ade80' },
          { label: 'Time',     value: fmtTime(vehicle.timeSec||0),      color: '#3b82f6' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '6px 4px' }}>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 14, color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────

const OverviewTab = memo(({ stats, battles, enhancedStats }) => {
  const totalKills = (stats.totalKillsAircraft || 0) + (stats.totalKillsGround || 0);
  const winRate = stats.winRate || 0;
  const kdr = enhancedStats.kdr || 0;

  // Battle result pie data
  const pieData = [
    { name: 'Victory', value: stats.wins || 0 },
    { name: 'Defeat',  value: stats.defeats || 0 },
    { name: 'Unknown', value: (stats.results?.Unknown) || 0 },
  ].filter(d => d.value > 0);

  // Rolling 20-battle win rate trend
  const trendData = useMemo(() => {
    if (!battles || battles.length < 5) return [];
    const window = 10;
    const result = [];
    for (let i = window - 1; i < battles.length; i++) {
      const slice = battles.slice(i - window + 1, i + 1);
      const wins  = slice.filter(b => b.result === 'Victory').length;
      const kills = slice.reduce((s, b) => s + (b.killsAircraft || 0) + (b.killsGround || 0), 0);
      const sl    = slice.reduce((s, b) => s + (b.earnedSL || b.totalSL || 0), 0);
      result.push({
        battle: i + 1,
        winRate: (wins / window) * 100,
        avgKills: kills / window,
        avgSL: sl / window,
      });
    }
    return result;
  }, [battles]);

  // Mission type distribution
  const missionTypePie = useMemo(() =>
    Object.entries(stats.missionTypes || {})
      .sort(([,a],[,b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value })),
  [stats]);

  // Hourly activity
  const hourlyData = useMemo(() => {
    const h = {};
    (battles || []).forEach(b => {
      if (!b.parsedAt && !b.timestamp) return;
      const hour = new Date(b.parsedAt || b.timestamp).getHours();
      if (!h[hour]) h[hour] = { hour, battles: 0, wins: 0 };
      h[hour].battles++;
      if (b.result === 'Victory') h[hour].wins++;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      battles: h[i]?.battles || 0,
      winRate: h[i] ? (h[i].wins / h[i].battles) * 100 : 0,
    }));
  }, [battles]);

  const [heroRef, heroVis] = useInView(0.05);

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div
        ref={heroRef}
        style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #111820 50%, #0d1117 100%)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          opacity: heroVis ? 1 : 0,
          transform: heroVis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Background cross-hair pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.03) 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        {/* Glowing accent line top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent 0%, #3b82f6 30%, #60a5fa 50%, #3b82f6 70%, transparent 100%)', boxShadow: '0 0 12px rgba(59,130,246,0.5)' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', position: 'relative' }}>
          <WinRateRing winRate={winRate} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: '0.15em', color: '#60a5fa', textTransform: 'uppercase', marginBottom: 4 }}>Combat Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 16, marginTop: 8 }}>
              {[
                { label: 'BATTLES',   value: fmt(stats.totalBattles || 0),   color: '#60a5fa' },
                { label: 'KILLS',     value: fmt(totalKills),                 color: '#ef4444' },
                { label: 'K/D',       value: (kdr).toFixed(2),                color: '#3b82f6' },
                { label: 'AVG ACT',   value: `${(stats.averageActivity||0).toFixed(0)}%`, color: '#22c55e' },
                { label: 'VICTORIES', value: fmt(stats.wins || 0),            color: '#22c55e' },
                { label: 'DEFEATS',   value: fmt(stats.defeats || 0),         color: '#ef4444' },
              ].map(({ label, value, color }, i) => (
                <div key={label} style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'none' : 'translateY(10px)', transition: `all 0.4s ease ${0.1 + i*0.06}s` }}>
                  <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.12em', fontFamily: "'Rajdhani'", fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 22, color, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
            {[
              { label: 'Total SL Earned',   value: fmtK(stats.totalEarnedSL || 0),  color: '#4ade80', icon: DollarSign },
              { label: 'Total RP Earned',   value: fmtK(stats.overallTotalRP || stats.totalRP || 0), color: '#a855f7', icon: Zap },
              { label: 'Total Assists',     value: fmt(stats.totalAssists || 0),     color: '#22c55e', icon: Users },
              { label: 'Total Captures',    value: fmt(stats.totalCaptures || 0),    color: '#3b82f6', icon: Flag || Map },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={13} style={{ color }} />
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'" }}>{label}</span>
                </div>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 14, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Win Rate"          value={fmtPct(winRate)}              icon={Trophy}      color="green"  delay={0.00} />
        <KpiCard label="K/D Ratio"         value={(kdr).toFixed(2)}             icon={Crosshair}   color="blue"   delay={0.05} />
        <KpiCard label="Total Kills"       value={fmt(totalKills)}              icon={Target}      color="red"    delay={0.10} />
        <KpiCard label="Air Kills"         value={fmt(stats.totalKillsAircraft||0)} icon={Plane}   color="blue"   delay={0.15} />
        <KpiCard label="Ground Kills"      value={fmt(stats.totalKillsGround||0)}   icon={Truck}   color="amber"  delay={0.20} />
        <KpiCard label="Avg SL / Battle"   value={fmtK(stats.averageEarnedSL||0)} icon={DollarSign} color="amber" delay={0.25} />
        <KpiCard label="Avg RP / Battle"   value={fmtK(stats.averageTotalRP||0)}   icon={Zap}      color="purple" delay={0.30} />
        <KpiCard label="Avg Activity"      value={`${(stats.averageActivity||0).toFixed(1)}%`} icon={Activity} color="green" delay={0.35} />
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Battle Results" icon={PieIcon} delay={0.1}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value" paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                {pieData.map((_, i) => <Cell key={i} fill={BATTLE_COLORS[i]} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mission Types" icon={Map} delay={0.15}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={missionTypePie} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={3}
                label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                {missionTypePie.map((_, i) => <Cell key={i} fill={COMBAT_PALETTE[i % COMBAT_PALETTE.length]} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Win Rate Trend ── */}
      {trendData.length >= 3 && (
        <ChartCard title="Rolling Win Rate Trend" subtitle="10-battle window" icon={TrendingUp} delay={0.2} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="killGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="battle" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={50} stroke="rgba(59,130,246,0.3)" strokeDasharray="4 4" label={{ value: '50%', fill: '#60a5fa', fontSize: 10 }} />
              <Area type="monotone" dataKey="winRate" stroke="#22c55e" fill="url(#winGrad)" strokeWidth={2} name="Win Rate %" dot={false} />
              <Area type="monotone" dataKey="avgKills" stroke="#ef4444" fill="url(#killGrad)" strokeWidth={2} name="Avg Kills" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Hourly Activity Heatmap-ish ── */}
      <ChartCard title="Battle Activity by Hour" icon={Clock} delay={0.25} style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={180}>
          <ReBarChart data={hourlyData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
            <XAxis dataKey="hour" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
            <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="battles" fill="#3b82f6" radius={[3,3,0,0]} name="Battles" opacity={0.85} />
          </ReBarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Recent Battles ── */}
      {battles && battles.length > 0 && (
        <ChartCard title="Recent Battles" icon={Activity} delay={0.3}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {battles.slice(-15).reverse().map((b, i) => (
              <div
                key={b.id || i}
                className={`wt-battle-item ${(b.result||'unknown').toLowerCase()}`}
                style={{ animationDelay: `${i*0.03}s` }}
              >
                <div>
                  <span style={{ fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: 13, color: '#e2e8f0', marginRight: 8 }}>
                    {b.missionName || 'Unknown Map'}
                  </span>
                  <ResultBadge result={b.result || 'Unknown'} />
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#475569', fontFamily: "'Exo 2'" }}>
                    [{b.missionType || '?'}]
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 12, color: '#ef4444' }}>
                    ✈ {(b.killsAircraft||0)+(b.killsGround||0)}K
                  </span>
                  <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 12, color: '#4ade80' }}>
                    {fmtK(b.earnedSL || b.totalSL || 0)} SL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
});

// ─── COMBAT TAB ───────────────────────────────────────────────────────────

const CombatTab = memo(({ stats, battles }) => {
  const totalKills = (stats.totalKillsAircraft||0) + (stats.totalKillsGround||0);
  const kdr = stats.kdr || (totalKills / Math.max((stats.totalDamagedVehicles||1), 1));

  const combatBarData = [
    { name: 'Air Kills',    value: stats.totalKillsAircraft||0,    fill: '#3b82f6' },
    { name: 'Ground Kills', value: stats.totalKillsGround||0,      fill: '#f97316' },
    { name: 'Assists',      value: stats.totalAssists||0,          fill: '#22c55e' },
    { name: 'Severe Dmg',   value: stats.totalSevereDamage||0,     fill: '#eab308' },
    { name: 'Crit Dmg',     value: stats.totalCriticalDamage||0,   fill: '#ef4444' },
    { name: 'Damage',       value: stats.totalDamage||0,           fill: '#a855f7' },
    { name: 'Captures',     value: stats.totalCaptures||0,         fill: '#06b6d4' },
  ];

  // Kill type donut
  const killPie = [
    { name: 'Aircraft', value: stats.totalKillsAircraft||0 },
    { name: 'Ground',   value: stats.totalKillsGround||0 },
  ];

  // Per-battle rolling combat stats
  const rollingCombat = useMemo(() => {
    if (!battles || battles.length < 3) return [];
    return battles.map((b, i) => ({
      battle: i + 1,
      kills: (b.killsAircraft||0) + (b.killsGround||0),
      assists: b.assists || 0,
      damage: (b.severeDamage||0) + (b.criticalDamage||0) + (b.damage||0),
    }));
  }, [battles]);

  // Damage breakdown pie
  const damagePie = [
    { name: 'Severe',   value: stats.totalSevereDamage||0 },
    { name: 'Critical', value: stats.totalCriticalDamage||0 },
    { name: 'Normal',   value: stats.totalDamage||0 },
  ].filter(d => d.value > 0);

  return (
    <div>
      <SectionHeader icon={Target} label="Combat Statistics" color="#ef4444" />

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total Kills"      value={fmt(totalKills)}                         icon={Target}  color="red"    delay={0}    />
        <KpiCard label="Air Kills"        value={fmt(stats.totalKillsAircraft||0)}        icon={Plane}   color="blue"   delay={0.05} />
        <KpiCard label="Ground Kills"     value={fmt(stats.totalKillsGround||0)}          icon={Truck}   color="amber"  delay={0.10} />
        <KpiCard label="K/D Ratio"        value={kdr.toFixed(2)}                          icon={Crosshair} color="blue" delay={0.15} />
        <KpiCard label="Assists"          value={fmt(stats.totalAssists||0)}              icon={Users}   color="green"  delay={0.20} />
        <KpiCard label="Damage Events"    value={fmt((stats.totalSevereDamage||0)+(stats.totalCriticalDamage||0)+(stats.totalDamage||0))} icon={Zap} color="purple" delay={0.25} />
        <KpiCard label="Captures"         value={fmt(stats.totalCaptures||0)}             icon={Map}     color="steel"  delay={0.30} />
        <KpiCard label="Avg Kills/Battle" value={((totalKills)/Math.max(stats.totalBattles||1,1)).toFixed(2)} icon={TrendingUp} color="red" delay={0.35} />
      </div>

      {/* ── Detailed stats + bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Combat Overview" icon={Sword} delay={0.1}>
          <div>
            {[
              { label: 'Aircraft Kills',   value: stats.totalKillsAircraft||0,   max: totalKills, color: '#3b82f6' },
              { label: 'Ground Kills',     value: stats.totalKillsGround||0,     max: totalKills, color: '#f97316' },
              { label: 'Assists',          value: stats.totalAssists||0,          max: totalKills, color: '#22c55e' },
              { label: 'Severe Damage',    value: stats.totalSevereDamage||0,    max: Math.max(stats.totalSevereDamage||0,stats.totalCriticalDamage||0,stats.totalDamage||0), color: '#eab308' },
              { label: 'Critical Damage',  value: stats.totalCriticalDamage||0,  max: Math.max(stats.totalSevereDamage||0,stats.totalCriticalDamage||0,stats.totalDamage||0), color: '#ef4444' },
              { label: 'Normal Damage',    value: stats.totalDamage||0,          max: Math.max(stats.totalSevereDamage||0,stats.totalCriticalDamage||0,stats.totalDamage||0), color: '#a855f7' },
              { label: 'Captures',         value: stats.totalCaptures||0,        max: Math.max(stats.totalCaptures||1), color: '#06b6d4' },
            ].map(row => (
              <StatRow key={row.label} {...row} bar barMax={row.max} highlight={row.color} />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Kill Distribution" icon={PieIcon} delay={0.15}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={killPie} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                <Cell fill="#3b82f6" stroke="none" />
                <Cell fill="#f97316" stroke="none" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Full combat bar chart ── */}
      <ChartCard title="Combat Metrics Breakdown" icon={BarChart2} delay={0.2} style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={260}>
          <ReBarChart data={combatBarData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
            <XAxis dataKey="name" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            {combatBarData.map((entry, i) => (
              <Bar key={i} dataKey="value" fill={entry.fill} radius={[4,4,0,0]} />
            ))}
          </ReBarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Damage breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Damage Type Breakdown" icon={Flame} delay={0.25}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={damagePie} cx="50%" cy="50%" outerRadius={85} dataKey="value" paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {damagePie.map((_, i) => <Cell key={i} fill={['#eab308','#ef4444','#a855f7'][i]} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SL Earned by Combat Type" icon={DollarSign} delay={0.3}>
          <ResponsiveContainer width="100%" height={220}>
            <ReBarChart
              data={[
                { name: 'Air Kills', value: stats.totalKillsAircraftSL||0 },
                { name: 'Gnd Kills', value: stats.totalKillsGroundSL||0 },
                { name: 'Assists',   value: stats.totalAssistsSL||0 },
                { name: 'Sev Dmg',  value: stats.totalSevereDamageSL||0 },
                { name: 'Crit Dmg', value: stats.totalCriticalDamageSL||0 },
                { name: 'Damage',   value: stats.totalDamageSL||0 },
                { name: 'Captures', value: stats.totalCapturesSL||0 },
              ]}
              margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
              <Bar dataKey="value" radius={[3,3,0,0]} name="SL">
                {[0,1,2,3,4,5,6].map(i => <Cell key={i} fill={COMBAT_PALETTE[i]} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Per-battle line chart ── */}
      {rollingCombat.length > 3 && (
        <ChartCard title="Kill / Damage per Battle" subtitle="chronological" icon={TrendingUp} delay={0.35}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rollingCombat} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="battle" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="kills"   stroke="#ef4444" strokeWidth={2} dot={false} name="Kills" />
              <Line type="monotone" dataKey="assists" stroke="#22c55e" strokeWidth={2} dot={false} name="Assists" />
              <Line type="monotone" dataKey="damage"  stroke="#a855f7" strokeWidth={1.5} dot={false} name="Damage Events" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
});

// ─── ECONOMY TAB ──────────────────────────────────────────────────────────

const EconomyTab = memo(({ stats, battles }) => {
  const grossSL    = stats.overallTotalSL || stats.totalSL || 0;
  const totalCosts = Math.abs(stats.totalAutoRepairCost||0) + Math.abs(stats.totalAutoAmmoCrewCost||0);
  const netSL      = grossSL - totalCosts;

  const slBreakdown = [
    { name: 'Earned SL',         value: stats.totalEarnedSL||0 },
    { name: 'Awards SL',         value: stats.totalAwardsSL||0 },
    { name: 'Activity SL',       value: stats.totalActivityTimeSL||0 },
    { name: 'Mission Reward',    value: stats.totalRewardSL||0 },
  ].filter(d => d.value > 0);

  const rpBreakdown = [
    { name: 'Activity RP',       value: stats.totalActivityTimeRP||0 },
    { name: 'Time Played RP',    value: stats.totalTimePlayedRP||0 },
    { name: 'Skill Bonus RP',    value: stats.totalSkillBonusRP||0 },
    { name: 'Awards RP',         value: stats.totalAwardsRP||0 },
    { name: 'Air Kill RP',       value: stats.totalKillsAircraftRP||0 },
    { name: 'Ground Kill RP',    value: stats.totalKillsGroundRP||0 },
  ].filter(d => d.value > 0);

  // Per-battle SL trend
  const slTrend = useMemo(() => {
    if (!battles) return [];
    return battles.map((b, i) => ({
      battle: i + 1,
      earned: b.earnedSL || 0,
      total: b.totalSL || 0,
      crp: b.earnedCRP || 0,
    }));
  }, [battles]);

  // Cumulative SL growth
  const slCumulative = useMemo(() => {
    if (!battles) return [];
    let cumSL = 0, cumRP = 0;
    return battles.map((b, i) => {
      cumSL += b.earnedSL || 0;
      cumRP += b.totalRP || 0;
      return { battle: i + 1, cumSL, cumRP };
    });
  }, [battles]);

  return (
    <div>
      <SectionHeader icon={DollarSign} label="Economy Statistics" color="#4ade80" />

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total SL Earned"    value={fmtK(stats.totalEarnedSL||0)}  icon={DollarSign}  color="amber"  delay={0}    />
        <KpiCard label="Total RP Earned"    value={fmtK(stats.overallTotalRP||stats.totalRP||0)} icon={Zap} color="purple" delay={0.05} />
        <KpiCard label="Avg SL / Battle"    value={fmtK(stats.averageEarnedSL||0)} icon={TrendingUp} color="green"  delay={0.10} />
        <KpiCard label="Avg RP / Battle"    value={fmtK(stats.averageTotalRP||0)}  icon={TrendingUp} color="blue"   delay={0.15} />
        <KpiCard label="Total Awards SL"    value={fmtK(stats.totalAwardsSL||0)}   icon={Award}      color="amber"  delay={0.20} />
        <KpiCard label="Convertible RP"     value={fmtK(stats.totalEarnedCRP||0)}  icon={Zap}        color="purple" delay={0.25} />
        <KpiCard label="Repair Costs"       value={fmtK(Math.abs(stats.totalAutoRepairCost||0))} icon={AlertTriangle} color="red" delay={0.30} />
        <KpiCard label="Net SL"             value={fmtK(netSL)}                   icon={DollarSign}  color={netSL >= 0 ? 'green' : 'red'} delay={0.35} />
      </div>

      {/* ── SL & RP breakdown pies ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="SL Sources" icon={DollarSign} color="#4ade80" delay={0.1}>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={slBreakdown} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={4}
                label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                {slBreakdown.map((_, i) => <Cell key={i} fill={ECONOMY_PALETTE[i % ECONOMY_PALETTE.length]} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} formatter={v => [fmtK(v), '']} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="RP Sources" icon={Zap} color="#a855f7" delay={0.15}>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={rpBreakdown} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={4}
                label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                {rpBreakdown.map((_, i) => <Cell key={i} fill={['#a855f7','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#3b0764'][i % 6]} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} formatter={v => [fmtK(v), '']} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Full economy bar ── */}
      <ChartCard title="Full Economy Breakdown" icon={BarChart2} delay={0.2} style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={260}>
          <ReBarChart
            data={[
              { name: 'Earned SL',   sl: stats.totalEarnedSL||0 },
              { name: 'Awards SL',   sl: stats.totalAwardsSL||0 },
              { name: 'Activity SL', sl: stats.totalActivityTimeSL||0 },
              { name: 'Reward SL',   sl: stats.totalRewardSL||0 },
              { name: 'Repair Cost', sl: -Math.abs(stats.totalAutoRepairCost||0) },
              { name: 'Ammo Cost',   sl: -Math.abs(stats.totalAutoAmmoCrewCost||0) },
            ]}
            margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
            <XAxis dataKey="name" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="sl" radius={[3,3,0,0]} name="SL">
              {[0,1,2,3,4,5].map(i => <Cell key={i} fill={i < 4 ? '#4ade80' : '#ef4444'} opacity={i < 4 ? 0.85 : 0.7} />)}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Per-battle trend ── */}
      {slTrend.length > 3 && (
        <ChartCard title="SL per Battle" subtitle="chronological" icon={TrendingUp} delay={0.25} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={slTrend} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="slGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="battle" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
              <Legend />
              <Area type="monotone" dataKey="earned" stroke="#4ade80" fill="url(#slGrad)" strokeWidth={2} name="Earned SL" dot={false} />
              <Line type="monotone" dataKey="crp" stroke="#a855f7" strokeWidth={1.5} name="CRP" dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Cumulative growth ── */}
      {slCumulative.length > 3 && (
        <ChartCard title="Cumulative SL & RP Growth" icon={TrendingUp} delay={0.3}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={slCumulative} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumSLGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#4ade80" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cumRPGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="battle" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
              <Legend />
              <Area type="monotone" dataKey="cumSL" stroke="#4ade80" fill="url(#cumSLGrad)" strokeWidth={2} name="Cumulative SL" dot={false} />
              <Area type="monotone" dataKey="cumRP" stroke="#a855f7" fill="url(#cumRPGrad)" strokeWidth={2} name="Cumulative RP" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
});

// ─── RESEARCH TAB ─────────────────────────────────────────────────────────

const ResearchTab = memo(({ stats, battles }) => {
  const totalResearchRP = (stats.totalResearchedRP||0) + (stats.totalResearchingProgressRP||0);

  const rpSourceData = [
    { name: 'Activity Time', value: stats.totalActivityTimeRP||0,  fill: '#3b82f6' },
    { name: 'Time Played',   value: stats.totalTimePlayedRP||0,    fill: '#22c55e' },
    { name: 'Skill Bonus',   value: stats.totalSkillBonusRP||0,    fill: '#a855f7' },
    { name: 'Awards',        value: stats.totalAwardsRP||0,        fill: '#f59e0b' },
    { name: 'Air Kills',     value: stats.totalKillsAircraftRP||0, fill: '#ef4444' },
    { name: 'Ground Kills',  value: stats.totalKillsGroundRP||0,   fill: '#f97316' },
    { name: 'Assists',       value: stats.totalAssistsRP||0,       fill: '#06b6d4' },
    { name: 'Captures',      value: stats.totalCapturesRP||0,      fill: '#10b981' },
  ].filter(d => d.value > 0);

  // RP per battle trend
  const rpTrend = useMemo(() => {
    if (!battles) return [];
    return battles.map((b, i) => ({
      battle: i + 1,
      totalRP:    b.totalRP || 0,
      activityRP: b.activityTimeRP || 0,
      skillRP:    b.skillBonusRP || 0,
    }));
  }, [battles]);

  // Researched units leaderboard
  const researchedUnits = useMemo(() => {
    const unitMap = {};
    (battles || []).forEach(b => {
      (b.researchedUnits || []).forEach(u => {
        if (u.unit) unitMap[u.unit] = (unitMap[u.unit] || 0) + (u.rp || 0);
      });
      (b.researchingProgress || []).forEach(p => {
        if (p.unit) unitMap[p.unit] = (unitMap[p.unit] || 0) + (p.rp || 0);
      });
    });
    return Object.entries(unitMap).sort(([,a],[,b]) => b-a).slice(0,10).map(([unit,rp]) => ({ unit, rp }));
  }, [battles]);

  return (
    <div>
      <SectionHeader icon={Zap} label="Research Statistics" color="#a855f7" />

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total RP Earned"    value={fmtK(stats.overallTotalRP||stats.totalRP||0)} icon={Zap}         color="purple" delay={0}    />
        <KpiCard label="Skill Bonus RP"     value={fmtK(stats.totalSkillBonusRP||0)}             icon={Star}        color="amber"  delay={0.05} />
        <KpiCard label="Activity Time RP"   value={fmtK(stats.totalActivityTimeRP||0)}           icon={Clock}       color="blue"   delay={0.10} />
        <KpiCard label="Time Played RP"     value={fmtK(stats.totalTimePlayedRP||0)}             icon={Activity}    color="green"  delay={0.15} />
        <KpiCard label="Researched RP"      value={fmtK(stats.totalResearchedRP||0)}             icon={Zap}         color="purple" delay={0.20} />
        <KpiCard label="Progress RP"        value={fmtK(stats.totalResearchingProgressRP||0)}    icon={TrendingUp}  color="blue"   delay={0.25} />
        <KpiCard label="Avg RP / Battle"    value={fmtK(stats.averageTotalRP||0)}                icon={BarChart2}   color="purple" delay={0.30} />
        <KpiCard label="Convertible RP"     value={fmtK(stats.totalEarnedCRP||0)}               icon={Zap}         color="steel"  delay={0.35} />
      </div>

      {/* ── RP Sources Pie + Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="RP Source Distribution" icon={PieIcon} color="#a855f7" delay={0.1}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={rpSourceData} cx="50%" cy="50%" outerRadius={88} innerRadius={40} dataKey="value" paddingAngle={3}
                label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                {rpSourceData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} formatter={v => [fmtK(v), '']} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="RP Breakdown by Source" icon={BarChart2} color="#a855f7" delay={0.15}>
          <ResponsiveContainer width="100%" height={240}>
            <ReBarChart data={rpSourceData} layout="vertical" margin={{ top: 5, right: 16, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.07)" />
              <XAxis type="number" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
              <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} width={70} />
              <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
              <Bar dataKey="value" radius={[0,3,3,0]} name="RP">
                {rpSourceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── RP Trend ── */}
      {rpTrend.length > 3 && (
        <ChartCard title="RP per Battle Trend" icon={TrendingUp} delay={0.2} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={rpTrend} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.08)" />
              <XAxis dataKey="battle" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
              <Legend />
              <Area type="monotone" dataKey="totalRP" stroke="#a855f7" fill="url(#rpGrad)" strokeWidth={2} name="Total RP" dot={false} />
              <Line type="monotone" dataKey="activityRP" stroke="#3b82f6" strokeWidth={1.5} name="Activity RP" dot={false} />
              <Line type="monotone" dataKey="skillRP"    stroke="#fbbf24" strokeWidth={1.5} name="Skill Bonus" dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Researched unit leaderboard ── */}
      {researchedUnits.length > 0 && (
        <ChartCard title="Most Researched Units" icon={Trophy} color="#a855f7" delay={0.25}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {researchedUnits.map((u, i) => (
              <VehicleLeaderRow key={u.unit} rank={i+1} vehicle={u.unit} primary={u.rp} primaryLabel="RP" delay={i*0.04} />
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
});

// ─── VEHICLES TAB ─────────────────────────────────────────────────────────

const VehiclesTab = memo(({ stats, battles }) => {
  const [sortBy, setSortBy] = useState('kills');
  const [filterType, setFilterType] = useState('all');

  const vehicleStatsArr = useMemo(() => {
    const vs = stats.vehicleStats || {};
    return Object.values(vs)
      .filter(v => {
        if (filterType === 'all') return true;
        return v.type === filterType;
      })
      .sort((a, b) => {
        if (sortBy === 'kills')   return (b.kills||0) - (a.kills||0);
        if (sortBy === 'battles') return (b.battles||0) - (a.battles||0);
        if (sortBy === 'time')    return (b.timeSec||0) - (a.timeSec||0);
        if (sortBy === 'sl')      return (b.earnedSL||0) - (a.earnedSL||0);
        if (sortBy === 'rp')      return (b.earnedRP||0) - (a.earnedRP||0);
        if (sortBy === 'damage')  return ((b.severeDamage||0)+(b.criticalDamage||0)+(b.damage||0)) - ((a.severeDamage||0)+(a.criticalDamage||0)+(a.damage||0));
        return 0;
      });
  }, [stats.vehicleStats, sortBy, filterType]);

  const topVehicles = vehicleStatsArr.slice(0, 3);

  const typeColors = { aviation: '#3b82f6', ground: '#f97316', naval: '#06b6d4' };
  const typeIcons  = { aviation: Plane,  ground: Truck,  naval: Anchor };

  return (
    <div>
      <SectionHeader icon={Shield} label="Vehicle Statistics" color="#3b82f6" />

      {/* ── Top vehicle podium ── */}
      {topVehicles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {topVehicles.map((v, i) => (
            <VehiclePodiumCard key={v.displayName} vehicle={v} index={i} />
          ))}
        </div>
      )}

      {/* ── Leaderboard tabs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Top Vehicles by Kills" icon={Target} color="#ef4444" delay={0.1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(stats.topVehiclesByKills||[]).slice(0,5).map((v, i) => (
              <VehicleLeaderRow key={v.vehicle} rank={i+1} vehicle={v.vehicle} primary={v.kills} primaryLabel="KILLS" country={v.country} delay={i*0.04} />
            ))}
            {!(stats.topVehiclesByKills||[]).length && <EmptyState message="No kill data" />}
          </div>
        </ChartCard>

        <ChartCard title="Top Vehicles by Damage" icon={Flame} color="#f97316" delay={0.15}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(stats.topVehiclesByDamage||[]).slice(0,5).map((v, i) => (
              <VehicleLeaderRow key={v.vehicle} rank={i+1} vehicle={v.vehicle} primary={v.damageEvents} primaryLabel="DMG EVENTS" country={v.country} delay={i*0.04} />
            ))}
            {!(stats.topVehiclesByDamage||[]).length && <EmptyState message="No damage data" />}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Top Vehicles by Time Played" icon={Clock} color="#3b82f6" delay={0.2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(stats.topVehiclesByTimePlayed||[]).slice(0,5).map((v, i) => (
              <VehicleLeaderRow key={v.vehicle} rank={i+1} vehicle={v.vehicle} primary={v.timeFormatted||fmtTime(v.timeSec)} primaryLabel="TIME" country={v.country} delay={i*0.04} />
            ))}
            {!(stats.topVehiclesByTimePlayed||[]).length && <EmptyState message="No time data" />}
          </div>
        </ChartCard>

        <ChartCard title="Top Vehicles by SL Earned" icon={DollarSign} color="#4ade80" delay={0.25}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(stats.topVehiclesBySL||[]).slice(0,5).map((v, i) => (
              <VehicleLeaderRow key={v.vehicle} rank={i+1} vehicle={v.vehicle} primary={fmtK(v.earnedSL)} primaryLabel="SL EARNED" country={v.country} delay={i*0.04} />
            ))}
            {!(stats.topVehiclesBySL||[]).length && <EmptyState message="No SL data" />}
          </div>
        </ChartCard>
      </div>

      {/* ── Full vehicle table ── */}
      <ChartCard title="All Vehicles" subtitle={`${vehicleStatsArr.length} vehicles`} icon={Shield} delay={0.3}>
        {/* Sort/filter controls */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#475569', alignSelf: 'center', marginRight: 4, fontFamily: "'Rajdhani'", letterSpacing: '0.07em', textTransform: 'uppercase' }}>Sort:</div>
          {[
            { id: 'kills',   label: 'Kills' },
            { id: 'battles', label: 'Battles' },
            { id: 'time',    label: 'Time' },
            { id: 'sl',      label: 'SL' },
            { id: 'rp',      label: 'RP' },
            { id: 'damage',  label: 'Damage' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setSortBy(id)} style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: "'Rajdhani'", fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              background: sortBy === id ? '#3b82f6' : 'rgba(255,255,255,0.04)',
              color: sortBy === id ? '#fff' : '#64748b',
              border: `1px solid ${sortBy === id ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.2s ease',
            }}>
              {label}
            </button>
          ))}
          <div style={{ marginLeft: 12, fontSize: 11, color: '#475569', alignSelf: 'center', fontFamily: "'Rajdhani'", letterSpacing: '0.07em', textTransform: 'uppercase' }}>Type:</div>
          {['all','aviation','ground','naval'].map(type => (
            <button key={type} onClick={() => setFilterType(type)} style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: "'Rajdhani'", fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              background: filterType === type ? typeColors[type] || '#3b82f6' : 'rgba(255,255,255,0.04)',
              color: filterType === type ? '#fff' : '#64748b',
              border: `1px solid ${filterType === type ? (typeColors[type] || '#3b82f6') : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.2s ease',
            }}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {vehicleStatsArr.slice(0, 50).map((v, i) => {
            const TypeIcon = typeIcons[v.type] || Shield;
            const color = typeColors[v.type] || '#94a3b8';
            return (
              <div
                key={v.displayName}
                className="wt-vehicle-row"
                style={{ animationDelay: `${i * 0.02}s` }}
              >
                <div className="wt-rank-badge" style={{ background: `${color}15`, border: `1px solid ${color}44`, color }}>
                  <TypeIcon size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: 14, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.displayName}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', fontFamily: "'Share Tech Mono'" }}>
                    {(v.country||'?').toUpperCase()} · RANK {v.rank||'?'}
                  </div>
                </div>
                {[
                  { label: 'BTL', value: v.battles||0,         color: '#60a5fa' },
                  { label: 'KIL', value: v.kills||0,           color: '#ef4444' },
                  { label: 'AST', value: v.assists||0,         color: '#22c55e' },
                  { label: 'SL',  value: fmtK(v.earnedSL||0), color: '#4ade80' },
                  { label: 'RP',  value: fmtK(v.earnedRP||0), color: '#a855f7' },
                  { label: 'TIME',value: fmtTime(v.timeSec||0),color: '#3b82f6' },
                ].map(({ label, value, color: c }) => (
                  <div key={label} style={{ textAlign: 'right', minWidth: 44 }}>
                    <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color: c, fontWeight: 700 }}>{typeof value === 'number' ? fmt(value) : value}</div>
                    <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                ))}
              </div>
            );
          })}
          {vehicleStatsArr.length === 0 && <EmptyState message="No vehicle data yet" />}
        </div>
      </ChartCard>
    </div>
  );
});

// ─── MAPS & MODES TAB ────────────────────────────────────────────────────

const MapsModeTab = memo(({ stats, battles, enhancedStats }) => {
  const mapData = useMemo(() =>
    Object.entries(enhancedStats.mapStats || {})
      .map(([name, d]) => ({
        name: name.length > 22 ? name.slice(0,22) + '…' : name,
        fullName: name,
        battles:  d.battles,
        winRate:  (d.wins / Math.max(d.battles,1)) * 100,
        avgKills: d.kills / Math.max(d.battles,1),
        avgSL:    d.earnedSL / Math.max(d.battles,1),
        avgRP:    d.earnedRP / Math.max(d.battles,1),
      }))
      .sort((a, b) => b.battles - a.battles)
      .slice(0, 12),
  [enhancedStats]);

  const modeData = useMemo(() =>
    Object.entries(enhancedStats.modeStats || {})
      .map(([name, d]) => ({
        name,
        battles:  d.battles,
        winRate:  (d.wins / Math.max(d.battles,1)) * 100,
        avgKills: d.kills / Math.max(d.battles,1),
        avgSL:    d.earnedSL / Math.max(d.battles,1),
      }))
      .sort((a, b) => b.battles - a.battles),
  [enhancedStats]);

  const missionTypePie = useMemo(() =>
    Object.entries(stats.missionTypes || {}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value),
  [stats.missionTypes]);

  const missionNameTop = useMemo(() =>
    Object.entries(stats.missionNames || {}).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0,20)+'…' : name, value })).sort((a,b) => b.value-a.value).slice(0, 10),
  [stats.missionNames]);

  return (
    <div>
      <SectionHeader icon={Map} label="Maps & Game Modes" color="#06b6d4" />

      {/* ── Mode KPIs ── */}
      {modeData.map((m, i) => (
        <KpiCard key={m.name} label={m.name} value={fmt(m.battles)} icon={Map} color="steel" delay={i*0.05} compact />
      ))}

      <div style={{ marginBottom: 16 }} />

      {/* ── Mission type pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Game Mode Distribution" icon={PieIcon} color="#06b6d4" delay={0.1}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={missionTypePie} cx="50%" cy="50%" outerRadius={88} innerRadius={40} dataKey="value" paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {missionTypePie.map((_, i) => <Cell key={i} fill={COMBAT_PALETTE[i % COMBAT_PALETTE.length]} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Maps Played" icon={Map} color="#06b6d4" delay={0.15}>
          <ResponsiveContainer width="100%" height={240}>
            <ReBarChart data={missionNameTop} layout="vertical" margin={{ top: 5, right: 16, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
              <XAxis type="number" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
              <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} width={88} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0,3,3,0]} name="Battles">
              </Bar>  
            </ReBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Map win rates ── */}
      {mapData.length > 0 && (
        <ChartCard title="Map Win Rates" subtitle="top maps" icon={Trophy} delay={0.2} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={mapData} margin={{ top: 5, right: 16, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9, angle: -35, textAnchor: 'end' }} />
              <YAxis yAxisId="left" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="battles" fill="#06b6d4" opacity={0.7} radius={[3,3,0,0]} name="Battles" />
              <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#22c55e" strokeWidth={2} name="Win Rate %" dot={{ fill: '#22c55e', r: 3 }} />
              <ReferenceLine yAxisId="right" y={50} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Map SL comparison ── */}
      {mapData.length > 0 && (
        <ChartCard title="Avg SL & Kills by Map" icon={DollarSign} delay={0.25}>
          <ResponsiveContainer width="100%" height={260}>
            <ReBarChart data={mapData.slice(0,8)} margin={{ top: 5, right: 16, left: 0, bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9, angle: -35, textAnchor: 'end' }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} formatter={v => typeof v === 'number' ? (v > 1000 ? fmtK(v) : v.toFixed(2)) : v} />
              <Legend />
              <Bar dataKey="avgSL"    fill="#4ade80" radius={[3,3,0,0]} name="Avg SL" opacity={0.85} />
              <Bar dataKey="avgKills" fill="#ef4444" radius={[3,3,0,0]} name="Avg Kills" opacity={0.85} />
            </ReBarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
});

// ─── PERFORMANCE TAB ──────────────────────────────────────────────────────

const PerformanceTab = memo(({ stats, battles, enhancedStats }) => {
  const totalKills = (stats.totalKillsAircraft||0) + (stats.totalKillsGround||0);
  const winRate    = stats.winRate || 0;
  const kdr        = enhancedStats.kdr || 0;
  const n          = stats.totalBattles || 1;

  // Radar data — all normalised 0–100
  const radarData = [
    { subject: 'Win Rate',   value: Math.min(winRate, 100) },
    { subject: 'Avg Kills',  value: Math.min(((totalKills/n)/5)*100, 100) },
    { subject: 'Activity',   value: Math.min(stats.averageActivity||0, 100) },
    { subject: 'Avg SL',     value: Math.min(((stats.averageEarnedSL||0)/20000)*100, 100) },
    { subject: 'Avg RP',     value: Math.min(((stats.averageTotalRP||0)/5000)*100, 100) },
    { subject: 'K/D',        value: Math.min(kdr*50, 100) },
  ];

  // Rolling 20-battle performance composite
  const performanceTrend = useMemo(() => {
    if (!battles || battles.length < 5) return [];
    const W = 10;
    return battles.slice(W - 1).map((_, idx) => {
      const i     = idx + W - 1;
      const slice = battles.slice(i - W + 1, i + 1);
      const wins  = slice.filter(b => b.result === 'Victory').length;
      const kills = slice.reduce((s, b) => s + (b.killsAircraft||0) + (b.killsGround||0), 0);
      const sl    = slice.reduce((s, b) => s + (b.earnedSL||0), 0);
      const rp    = slice.reduce((s, b) => s + (b.totalRP||0), 0);
      const act   = slice.reduce((s, b) => s + (b.activity||0), 0);
      return {
        battle:  i + 1,
        winRate: (wins / W) * 100,
        avgKills:(kills / W),
        avgSL:   sl / W,
        avgRP:   rp / W,
        avgAct:  act / W,
      };
    });
  }, [battles]);

  // SL/RP per win vs loss
  const winLossSL = useMemo(() => {
    if (!battles) return [];
    const vSL = battles.filter(b => b.result === 'Victory').map(b => b.earnedSL||0);
    const dSL = battles.filter(b => b.result === 'Defeat').map(b => b.earnedSL||0);
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    return [
      { name: 'Victory Avg SL', sl: avg(vSL), fill: '#22c55e' },
      { name: 'Defeat Avg SL',  sl: avg(dSL), fill: '#ef4444' },
    ];
  }, [battles]);

  return (
    <div>
      <SectionHeader icon={TrendingUp} label="Performance Analysis" color="#a855f7" />

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Win Rate"            value={fmtPct(winRate)}                                                icon={Trophy}    color="green"  delay={0}    />
        <KpiCard label="K/D Ratio"           value={kdr.toFixed(2)}                                               icon={Crosshair} color="blue"   delay={0.05} />
        <KpiCard label="Avg Kills/Battle"    value={((totalKills)/n).toFixed(2)}                                  icon={Target}    color="red"    delay={0.10} />
        <KpiCard label="Avg Activity"        value={`${(stats.averageActivity||0).toFixed(1)}%`}                  icon={Activity}  color="green"  delay={0.15} />
        <KpiCard label="Avg SL/Battle"       value={fmtK(stats.averageEarnedSL||0)}                              icon={DollarSign}color="amber"  delay={0.20} />
        <KpiCard label="Avg RP/Battle"       value={fmtK(stats.averageTotalRP||0)}                               icon={Zap}       color="purple" delay={0.25} />
        <KpiCard label="Streak Best"         value={enhancedStats.longestWinStreak||0}                            icon={Flame}     color="amber"  delay={0.30} />
        <KpiCard label="Recent Win Rate"     value={fmtPct(enhancedStats.recentWinRate||winRate)}                icon={TrendingUp}color={enhancedStats.recentWinRate > winRate ? 'green' : 'red'} delay={0.35} />
      </div>

      {/* ── Radar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Performance Radar" subtitle="normalised to 100" icon={Radio} delay={0.1}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
              <PolarGrid stroke="rgba(59,130,246,0.15)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontFamily: "'Share Tech Mono'", fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill: '#475569', fontSize: 9 }} />
              <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.22} strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} />
              <Tooltip content={<CustomTooltip />} formatter={v => `${v.toFixed(1)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SL: Victory vs Defeat" icon={DollarSign} delay={0.15}>
          <ResponsiveContainer width="100%" height={260}>
            <ReBarChart data={winLossSL} margin={{ top: 20, right: 16, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
              <Bar dataKey="sl" radius={[4,4,0,0]} name="Avg SL">
                {winLossSL.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Rolling performance trend ── */}
      {performanceTrend.length > 3 && (
        <ChartCard title="Rolling Performance Trend" subtitle="10-battle window" icon={TrendingUp} delay={0.2} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={performanceTrend} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="perfWRGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="battle" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <YAxis yAxisId="pct" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} domain={[0,100]} />
              <YAxis yAxisId="num" orientation="right" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine yAxisId="pct" y={50} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <Area yAxisId="pct" type="monotone" dataKey="winRate"  stroke="#22c55e" fill="url(#perfWRGrad)" strokeWidth={2} name="Win Rate %" dot={false} />
              <Line yAxisId="num" type="monotone" dataKey="avgKills" stroke="#ef4444" strokeWidth={2} name="Avg Kills" dot={false} />
              <Line yAxisId="pct" type="monotone" dataKey="avgAct"   stroke="#fbbf24" strokeWidth={1.5} name="Avg Activity %" dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Activity scatter ── */}
      {performanceTrend.length > 3 && (
        <ChartCard title="Activity vs Win Rate Correlation" icon={Eye} delay={0.25} style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
              <XAxis dataKey="avgAct" name="Activity %" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} label={{ value: 'Activity %', fill: '#475569', fontSize: 10, position: 'bottom' }} />
              <YAxis dataKey="winRate" name="Win Rate %" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} label={{ value: 'Win Rate %', fill: '#475569', fontSize: 10, angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(59,130,246,0.3)' }} />
              <Scatter data={performanceTrend} fill="#3b82f6" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
});

/** Award podium card with animation */
const AwardPodiumCard = memo(({ award, index, totalBattles }) => {
  const [ref, vis] = useInView(0.05);
  const podColors = ['#60a5fa','#94a3b8','#34d399'];
  const emojis = ['🥇','🥈','🥉'];
  const gc = podColors[index];

  return (
    <div ref={ref} style={{
      background: `linear-gradient(135deg, ${gc}18, #0d1117 80%)`,
      border: `2px solid ${gc}55`, borderRadius: 14, padding: '24px 18px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
      opacity: vis ? 1 : 0, transform: vis ? 'scale(1)' : 'scale(0.88)',
      transition: `all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${index*0.1}s`,
      boxShadow: vis ? `0 12px 32px rgba(0,0,0,0.4), 0 0 24px ${gc}22` : 'none',
    }}>
      <div style={{ fontSize: 40, marginBottom: 10, lineHeight: 1 }}>{emojis[index]}</div>
      <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.2 }}>
        {award.award}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 30, color: gc, fontWeight: 700, lineHeight: 1, textShadow: `0 0 12px ${gc}66` }}>
        ×{award.count}
      </div>
      <div style={{ fontSize: 10, color: '#475569', marginTop: 6, letterSpacing: '0.1em', fontFamily: "'Rajdhani'", fontWeight: 600 }}>TIMES AWARDED</div>
      <div style={{ fontSize: 11, color: gc, marginTop: 4, fontFamily: "'Share Tech Mono'" }}>
        {((award.count / Math.max(totalBattles||1, 1)) * 100).toFixed(1)}% of battles
      </div>
    </div>
  );
});

/** Award board item with animation */
const AwardBoardItem = memo(({ award, index, color }) => {
  const [ref, vis] = useInView(0.02);
  return (
    <div ref={ref} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 13px', borderRadius: 6,
      background: `${color}0e`, border: `1px solid ${color}35`,
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateX(-10px)',
      transition: `all 0.38s ease ${Math.min(index,24)*0.025}s`,
      cursor: 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Star size={12} style={{ color: color, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Exo 2'", fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{award.award}</span>
      </div>
      <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 16, color: color, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>×{award.count}</span>
    </div>
  );
});

// ─── AWARDS TAB ───────────────────────────────────────────────────────────

const AwardsTab = memo(({ stats, battles }) => {
  const awards = stats.topAwards || [];

  const awardColors = [
    '#f59e0b','#fbbf24','#d97706',
    '#22c55e','#3b82f6','#a855f7',
    '#ef4444','#f97316','#06b6d4','#10b981',
  ];

  const awardPie = awards.slice(0, 8).map((a, i) => ({ name: a.award, value: a.count, fill: awardColors[i] }));

  // Awards per-battle rate
  const awardRateData = awards.slice(0, 8).map(a => ({
    award:    a.award.length > 18 ? a.award.slice(0,18)+'…' : a.award,
    perBattle: parseFloat((a.count / Math.max(stats.totalBattles || 1, 1)).toFixed(3)),
    total:    a.count,
  }));

  // Cumulative awards earned over battles
  const awardsOverTime = useMemo(() => {
    if (!battles) return [];
    let running = 0, unique = new Set();
    return battles.map((b, i) => {
      (b.awards_detail || []).forEach(a => { if (a.award) { running++; unique.add(a.award); } });
      return { battle: i + 1, total: running, unique: unique.size };
    });
  }, [battles]);

  // SL breakdown per award
  const awardSLData = useMemo(() => {
    const slMap = {};
    (battles || []).forEach(b => {
      (b.awards_detail || []).forEach(a => {
        if (!a.award) return;
        if (!slMap[a.award]) slMap[a.award] = { count: 0, totalSL: 0 };
        slMap[a.award].count++;
        slMap[a.award].totalSL += a.sl || 0;
      });
    });
    return Object.entries(slMap)
      .sort(([,a],[,b]) => b.totalSL - a.totalSL)
      .slice(0, 8)
      .map(([name, d]) => ({
        name: name.length > 16 ? name.slice(0,16)+'…' : name,
        totalSL: d.totalSL,
        avgSL: Math.round(d.totalSL / Math.max(d.count, 1)),
        count: d.count,
      }));
  }, [battles]);

  return (
    <div>
      <SectionHeader icon={Award} label="Awards & Decorations" color="#fbbf24" />

      {awards.length === 0 ? (
        <EmptyState message="No award data yet" />
      ) : (
        <>
          {/* ── Award KPIs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 24 }}>
            <KpiCard label="Total Awards"     value={fmt(stats.totalAwardsCount||0)}   icon={Award}      color="blue"   delay={0}    />
            <KpiCard label="Award Types"      value={fmt(awards.length)}               icon={Star}       color="blue"   delay={0.05} />
            <KpiCard label="Awards SL"        value={fmtK(stats.totalAwardsSL||0)}    icon={DollarSign} color="green"  delay={0.10} />
            <KpiCard label="Awards RP"        value={fmtK(stats.totalAwardsRP||0)}    icon={Zap}        color="purple" delay={0.15} />
            <KpiCard label="Per Battle"       value={((stats.totalAwardsCount||0)/Math.max(stats.totalBattles||1,1)).toFixed(2)} icon={TrendingUp} color="blue" delay={0.20} />
            <KpiCard label="Top Award"        value={(awards[0]?.award||'—').slice(0,12)} icon={Trophy}  color="blue"   delay={0.25} />
          </div>

          {/* ── Podium ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {awards.slice(0,3).map((a, i) => (
              <AwardPodiumCard key={a.award} award={a} index={i} totalBattles={stats.totalBattles} />
            ))}
          </div>

          {/* ── Pie + Frequency bar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <ChartCard title="Award Distribution" icon={PieIcon} delay={0.1}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={awardPie} cx="50%" cy="50%" outerRadius={88} innerRadius={38} dataKey="value" paddingAngle={4}
                    label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                    {awardPie.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Award Frequency" icon={BarChart2} delay={0.15}>
              <ResponsiveContainer width="100%" height={240}>
                <ReBarChart data={awards.slice(0,8).map(a => ({ ...a, award: a.award.length>16 ? a.award.slice(0,16)+'…':a.award }))} layout="vertical" margin={{ top: 5, right: 16, left: 110, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
                  <XAxis type="number" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
                  <YAxis dataKey="award" type="category" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} width={118} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0,4,4,0]} name="Count">
                    {awards.slice(0,8).map((_, i) => <Cell key={i} fill={awardColors[i]} />)}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ── Per-battle rate ── */}
          <ChartCard title="Award Rate per Battle" subtitle="frequency per game" icon={TrendingUp} delay={0.2} style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <ReBarChart data={awardRateData} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
                <XAxis dataKey="award" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9, angle: -30, textAnchor: 'end' }} />
                <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} formatter={v => v.toFixed(3)} />
                <Bar dataKey="perBattle" name="Awards/Battle" radius={[4,4,0,0]}>
                  {awardRateData.map((_, i) => <Cell key={i} fill={awardColors[i % awardColors.length]} />)}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Cumulative over battles ── */}
          {awardsOverTime.length > 3 && (
            <ChartCard title="Awards Accumulated Over Battles" icon={TrendingUp} delay={0.25} style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={awardsOverTime} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="awardGrad"  x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#60a5fa" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
                  <XAxis dataKey="battle" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
                  <YAxis stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="total"  stroke="#60a5fa" fill="url(#awardGrad)"  strokeWidth={2} name="Total Awards"       dot={false} />
                  <Area type="monotone" dataKey="unique" stroke="#3b82f6" fill="url(#uniqueGrad)" strokeWidth={2} name="Unique Award Types"  dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* ── SL from awards ── */}
          {awardSLData.length > 0 && (
            <ChartCard title="SL Earned per Award Type" icon={DollarSign} delay={0.3} style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={awardSLData} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.07)" />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9, angle: -30, textAnchor: 'end' }} />
                  <YAxis yAxisId="sl" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
                  <YAxis yAxisId="avg" orientation="right" stroke="#475569" tick={{ fontFamily: "'Share Tech Mono'", fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
                  <Legend />
                  <Bar  yAxisId="sl"  dataKey="totalSL" fill="#f59e0b" opacity={0.8} radius={[3,3,0,0]} name="Total SL" />
                  <Line yAxisId="avg" type="monotone" dataKey="avgSL" stroke="#fbbf24" strokeWidth={2} name="Avg SL/Award" dot={{ fill:'#fbbf24', r:3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* ── Full board ── */}
          <ChartCard title="Complete Decoration Board" subtitle={`${awards.length} unique decorations`} icon={Trophy} delay={0.35}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {awards.map((a, i) => (
                <AwardBoardItem key={a.award} award={a} index={i} color={awardColors[i % awardColors.length]} />
              ))}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
});

// ─── PROFILE CARD ─────────────────────────────────────────────────────────

const ProfileCard = memo(({ user, stats, enhancedStats }) => {
  const [ref, vis] = useInView(0.05);
  const totalKills = (stats.totalKillsAircraft||0) + (stats.totalKillsGround||0);

  return (
    <div
      ref={ref}
      style={{
        background: 'linear-gradient(135deg, #111820 0%, #0d1117 100%)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 12,
        padding: '24px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateY(16px)',
        transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Decorative amber slash */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, #f59e0b, #b45309)', borderRadius: '12px 0 0 12px', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ paddingLeft: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 10, letterSpacing: '0.18em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4 }}>
              ▸ PILOT PROFILE
            </div>
            <h3 style={{ fontFamily: "'Rajdhani'", fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: 0, lineHeight: 1 }}>
              {user.name}
            </h3>
            {user.title && (
              <div style={{ fontSize: 13, color: '#64748b', fontFamily: "'Exo 2'", marginTop: 4 }}>
                {user.title}
              </div>
            )}
          </div>
          <WinRateRing winRate={stats.winRate || 0} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {/* Info block */}
          <div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 10, letterSpacing: '0.12em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 8 }}>Profile</div>
            {[
              { label: 'Level',      value: user.level || 'N/A' },
              { label: 'Rank',       value: user.rank  || 'N/A' },
              { label: 'Gaijin ID',  value: user.gaijinId || 'N/A' },
              { label: 'Squadron',   value: user.squadron || 'N/A' },
              { label: 'Fav Vehicle',value: user.favoriteVehicle || 'N/A' },
            ].map(({ label, value }) => (
              <StatRow key={label} label={label} value={value} />
            ))}
          </div>

          {/* Combat quick */}
          <div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 10, letterSpacing: '0.12em', color: '#ef4444', textTransform: 'uppercase', marginBottom: 8 }}>Combat</div>
            {[
              { label: 'Total Battles', value: fmt(stats.totalBattles||0),  highlight: '#f59e0b' },
              { label: 'Victories',     value: fmt(stats.wins||0),          highlight: '#22c55e' },
              { label: 'Defeats',       value: fmt(stats.defeats||0),       highlight: '#ef4444' },
              { label: 'Total Kills',   value: fmt(totalKills),             highlight: '#ef4444' },
              { label: 'Total Assists', value: fmt(stats.totalAssists||0),  highlight: '#22c55e' },
            ].map(r => <StatRow key={r.label} {...r} />)}
          </div>

          {/* Economy quick */}
          <div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 10, letterSpacing: '0.12em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 8 }}>Economy</div>
            {[
              { label: 'Total SL',      value: fmtK(stats.totalEarnedSL||0),           highlight: '#f59e0b' },
              { label: 'Total RP',      value: fmtK(stats.overallTotalRP||stats.totalRP||0), highlight: '#a855f7' },
              { label: 'Avg SL/Battle', value: fmtK(stats.averageEarnedSL||0),         highlight: '#f59e0b' },
              { label: 'Avg RP/Battle', value: fmtK(stats.averageTotalRP||0),           highlight: '#a855f7' },
              { label: 'Avg Activity',  value: `${(stats.averageActivity||0).toFixed(1)}%`, highlight: '#22c55e' },
            ].map(r => <StatRow key={r.label} {...r} />)}
          </div>

          {/* Recent perf */}
          {enhancedStats.recentStats && stats.totalBattles >= 10 && (
            <div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 10, letterSpacing: '0.12em', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 8 }}>Recent (10 battles)</div>
              {[
                { label: 'Win Rate',    value: fmtPct((enhancedStats.recentStats.wins/10)*100), highlight: '#22c55e' },
                { label: 'Avg Kills',   value: (((enhancedStats.recentStats.totalKillsAircraft||0)+(enhancedStats.recentStats.totalKillsGround||0))/10).toFixed(2), highlight: '#ef4444' },
                { label: 'Avg SL',      value: fmtK((enhancedStats.recentStats.totalEarnedSL||0)/10), highlight: '#f59e0b' },
                { label: 'Avg RP',      value: fmtK((enhancedStats.recentStats.overallTotalRP||enhancedStats.recentStats.totalRP||0)/10), highlight: '#a855f7' },
                { label: 'Trend',       value: enhancedStats.winRateTrend >= 0 ? `▲ +${(enhancedStats.winRateTrend*100).toFixed(1)}%` : `▼ ${(enhancedStats.winRateTrend*100).toFixed(1)}%`, highlight: enhancedStats.winRateTrend >= 0 ? '#22c55e' : '#ef4444' },
              ].map(r => <StatRow key={r.label} {...r} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── TAB BUTTON ───────────────────────────────────────────────────────────

const TabButton = memo(({ id, label, icon: Icon, activeTab, onClick, color }) => {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`wt-tab ${isActive ? 'active' : ''}`}
      style={isActive ? { background: color || '#f59e0b', color: '#0d1117', borderColor: 'transparent' } : {}}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
});

// ─── MAIN STATS PAGE ──────────────────────────────────────────────────────

const StatsPage = ({ users, selectedUserId, setSelectedUserId, stats: rawStats, battles }) => {
  const [statsTab, setStatsTab] = useState('overview');
  const currentUser = users?.find(u => u.id === selectedUserId);
  const hasBattles  = battles && battles.length > 0;

  // ── Compute enhanced stats ──────────────────────────────────────────
  const enhancedStats = useMemo(() => {
    const safe = rawStats || {};
    if (!hasBattles) return safe;

    const recent   = battles.slice(-10);
    const recentSt = calculateStats(recent);
    const recentWR = (recentSt.wins / Math.max(recent.length,1));

    // Win rate trend (recent vs overall)
    const overallWR  = (safe.wins||0) / Math.max(safe.totalBattles||1, 1);
    const winRateTrend = recent.length >= 5 ? recentWR - overallWR : 0;

    const totalDamagedVehicles = battles.reduce((t, b) => t + (b.damagedVehicles?.length || 0), 0);
    const totalKills = (safe.totalKillsAircraft||0) + (safe.totalKillsGround||0);
    const kdr = totalKills / Math.max(totalDamagedVehicles, 1);

    const avgSLPerBattle = (safe.overallTotalSL||safe.totalSL||0) / Math.max(safe.totalBattles||1, 1);
    const avgRPPerBattle = (safe.overallTotalRP||safe.totalRP||0) / Math.max(safe.totalBattles||1, 1);

    // Map & mode stats
    const mapStats  = {};
    const modeStats = {};

    battles.forEach(b => {
      const map  = b.missionName || 'Unknown';
      const mode = b.missionType || 'Unknown';

      if (!mapStats[map])  mapStats[map]  = { battles:0, wins:0, kills:0, earnedSL:0, earnedRP:0 };
      if (!modeStats[mode]) modeStats[mode] = { battles:0, wins:0, kills:0, earnedSL:0, earnedRP:0 };

      mapStats[map].battles++;
      modeStats[mode].battles++;
      if (b.result === 'Victory') { mapStats[map].wins++; modeStats[mode].wins++; }
      const kills = (b.killsAircraft||0)+(b.killsGround||0);
      mapStats[map].kills  += kills;  modeStats[mode].kills  += kills;
      mapStats[map].earnedSL  += b.earnedSL||0;  modeStats[mode].earnedSL  += b.earnedSL||0;
      mapStats[map].earnedRP  += b.totalRP||0;   modeStats[mode].earnedRP  += b.totalRP||0;
    });

    // Win streak
    let longestWinStreak = 0, curStreak = 0;
    for (const b of battles) {
      if (b.result === 'Victory') { curStreak++; longestWinStreak = Math.max(longestWinStreak, curStreak); }
      else curStreak = 0;
    }

    const recentWinRate = recentWR * 100;

    return {
      ...safe,
      winRateTrend,
      kdr,
      avgSLPerBattle,
      avgRPPerBattle,
      totalDamagedVehicles,
      mapStats,
      modeStats,
      recentStats: recentSt,
      recentWinRate,
      longestWinStreak,
    };
  }, [rawStats, battles, hasBattles]);

  const safeStats = rawStats || {};

  // ── Tab definitions ─────────────────────────────────────────────────
  const TABS = [
    { id: 'overview',     label: 'Overview',     icon: BarChart2,    color: '#f59e0b' },
    { id: 'combat',       label: 'Combat',       icon: Target,       color: '#ef4444' },
    { id: 'economy',      label: 'Economy',      icon: DollarSign,   color: '#f59e0b' },
    { id: 'research',     label: 'Research',     icon: Zap,          color: '#a855f7' },
    { id: 'vehicles',     label: 'Vehicles',     icon: Shield,       color: '#3b82f6' },
    { id: 'maps',         label: 'Maps & Modes', icon: Map,          color: '#06b6d4' },
    { id: 'performance',  label: 'Performance',  icon: TrendingUp,   color: '#a855f7' },
    { id: 'awards',       label: 'Awards',       icon: Award,        color: '#f59e0b' },
  ];

  // ── Render tab content ───────────────────────────────────────────────
  const renderTab = () => {
    const sharedProps = { stats: enhancedStats, battles, enhancedStats };
    switch (statsTab) {
      case 'overview':    return <OverviewTab    {...sharedProps} />;
      case 'combat':      return <CombatTab      {...sharedProps} />;
      case 'economy':     return <EconomyTab     {...sharedProps} />;
      case 'research':    return <ResearchTab    {...sharedProps} />;
      case 'vehicles':    return <VehiclesTab    {...sharedProps} />;
      case 'maps':        return <MapsModeTab    {...sharedProps} />;
      case 'performance': return <PerformanceTab {...sharedProps} />;
      case 'awards':      return <AwardsTab      {...sharedProps} />;
      default:            return <OverviewTab    {...sharedProps} />;
    }
  };

  return (
    <div className="wt-page wt-hex-bg" style={{ padding: '0 0 60px 0' }}>
      <StyleInjector />

      {/* ── Page header ── */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(245,158,11,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.12)',
        padding: '28px 32px 20px',
        marginBottom: 0,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <BarChart2 size={32} style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }} />
              <div style={{ position: 'absolute', inset: -4, background: 'rgba(245,158,11,0.08)', borderRadius: '50%', animation: 'wt-pulse-amber 2.5s ease-in-out infinite' }} />
            </div>
            <div>
              <h1 className="wt-glow-amber" style={{ fontFamily: "'Rajdhani'", fontSize: 28, fontWeight: 700, color: '#f59e0b', margin: 0, lineHeight: 1, letterSpacing: '0.04em' }}>
                WAR THUNDER STATS
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#475569', fontFamily: "'Share Tech Mono'", letterSpacing: '0.08em' }}>
                TACTICAL COMBAT ANALYSIS SYSTEM
              </p>
            </div>
          </div>

          {/* User selector */}
          <div style={{ maxWidth: 400 }}>
            <label style={{ display: 'block', fontFamily: "'Rajdhani'", fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              ▸ SELECT PILOT
            </label>
            <select
              className="wt-select"
              value={selectedUserId || ''}
              onChange={e => setSelectedUserId(e.target.value)}
            >
              <option value="">— Select pilot profile —</option>
              {(users || []).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        {/* ── No user selected ── */}
        {!selectedUserId && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', color: '#475569',
            border: '1px dashed rgba(245,158,11,0.2)', borderRadius: 12,
          }}>
            <Users size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontFamily: "'Rajdhani'", fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', margin: 0 }}>NO PILOT SELECTED</p>
            <p style={{ fontSize: 13, color: '#334155', marginTop: 8, fontFamily: "'Exo 2'" }}>Choose a pilot from the selector above to view their stats.</p>
          </div>
        )}

        {/* ── User selected, no battles ── */}
        {selectedUserId && !hasBattles && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', color: '#475569',
            border: '1px dashed rgba(245,158,11,0.15)', borderRadius: 12,
          }}>
            <AlertTriangle size={48} style={{ marginBottom: 16, color: '#f59e0b', opacity: 0.4 }} />
            <p style={{ fontFamily: "'Rajdhani'", fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', margin: 0, color: '#f59e0b' }}>NO BATTLE DATA</p>
            <p style={{ fontSize: 13, color: '#334155', marginTop: 8, fontFamily: "'Exo 2'" }}>
              {currentUser?.name} has no battle logs yet. Import battle data from the Data Management page.
            </p>
          </div>
        )}

        {/* ── Main dashboard ── */}
        {selectedUserId && hasBattles && (
          <>
            {/* Profile card */}
            {currentUser && (
              <ProfileCard user={currentUser} stats={enhancedStats} enhancedStats={enhancedStats} />
            )}

            {/* Tab bar */}
            <div className="wt-tab-bar" style={{ marginBottom: 24 }}>
              {TABS.map(tab => (
                <TabButton key={tab.id} {...tab} activeTab={statsTab} onClick={setStatsTab} />
              ))}
            </div>

            {/* Tab content with transition */}
            <div key={statsTab} className="wt-animate-in" style={{ animationDuration: '0.35s' }}>
              {renderTab()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsPage;