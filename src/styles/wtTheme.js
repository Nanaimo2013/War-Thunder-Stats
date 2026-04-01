/**
 * wtTheme.js  v3.0
 *
 * New design system: deep navy + electric blue primary + amber secondary.
 * Glassmorphism cards, Inter body font, Rajdhani display font.
 *
 * Usage:
 *   import { StyleInjector, THEME } from '../styles/wtTheme';
 *   // In your component: <StyleInjector />
 */

import React, { useEffect, useRef, useState } from 'react';

// ─── CSS Variables & Global Styles ────────────────────────────────────────────

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

  :root {
    /* ── Backgrounds ─── */
    --wt-bg-void:        #04080f;
    --wt-bg-deep:        #070c18;
    --wt-bg-panel:       #0a1020;
    --wt-bg-raised:      #0d1528;
    --wt-bg-card:        #101a30;
    --wt-bg-hover:       #141f38;

    /* ── Blue primary ─── */
    --wt-blue:           #3b82f6;
    --wt-blue-bright:    #60a5fa;
    --wt-blue-dim:       #1e40af;
    --wt-blue-glow:      rgba(59,130,246,0.2);

    /* ── Amber accent (War Thunder) ─── */
    --wt-amber:          #f59e0b;
    --wt-amber-bright:   #fbbf24;
    --wt-amber-dim:      #92400e;
    --wt-amber-glow:     rgba(245,158,11,0.15);

    /* ── Semantic ─── */
    --wt-red:            #f43f5e;
    --wt-red-dim:        #881337;
    --wt-red-glow:       rgba(244,63,94,0.15);
    --wt-green:          #22c55e;
    --wt-green-dim:      #14532d;
    --wt-green-glow:     rgba(34,197,94,0.15);
    --wt-purple:         #a78bfa;
    --wt-purple-dim:     #4c1d95;
    --wt-cyan:           #22d3ee;

    /* ── Neutral ─── */
    --wt-steel:          #94a3b8;
    --wt-steel-dim:      #475569;

    /* ── Borders ─── */
    --wt-border:         rgba(59,130,246,0.12);
    --wt-border-mid:     rgba(59,130,246,0.22);
    --wt-border-bright:  rgba(59,130,246,0.45);
    --wt-border-amber:   rgba(245,158,11,0.25);

    /* ── Text ─── */
    --wt-text-primary:   #e2e8f0;
    --wt-text-muted:     #64748b;
    --wt-text-dim:       #94a3b8;

    /* ── Typography ─── */
    --wt-font-display:   'Rajdhani', sans-serif;
    --wt-font-body:      'Inter', sans-serif;
    --wt-font-mono:      'Courier New', monospace;

    /* ── Shape ─── */
    --wt-radius:         8px;
    --wt-radius-lg:      12px;
    --wt-radius-xl:      16px;
    --wt-transition:     0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Keyframes ──────────────────────────────────── */

  @keyframes wt-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes wt-slide-left {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes wt-slide-right {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes wt-scale-in {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes wt-pulse-blue {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
    50%       { box-shadow: 0 0 20px 4px rgba(59,130,246,0.25); }
  }
  @keyframes wt-pulse-amber {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
    50%       { box-shadow: 0 0 16px 4px rgba(245,158,11,0.2); }
  }
  @keyframes wt-pulse-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0); }
    50%       { box-shadow: 0 0 16px 4px rgba(244,63,94,0.22); }
  }
  @keyframes wt-pulse-green {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    50%       { box-shadow: 0 0 16px 4px rgba(34,197,94,0.22); }
  }
  @keyframes wt-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes wt-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes wt-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes wt-bar-grow {
    from { transform: scaleX(0); transform-origin: left; }
    to   { transform: scaleX(1); transform-origin: left; }
  }
  @keyframes wt-slide-down {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes wt-notif-enter {
    from { opacity: 0; transform: translateX(110%) scale(0.92); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes wt-notif-exit {
    from { opacity: 1; transform: translateX(0); max-height: 80px; margin-bottom: 10px; }
    to   { opacity: 0; transform: translateX(110%); max-height: 0; margin-bottom: 0; }
  }
  @keyframes wt-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes wt-skeleton {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes wt-gradient-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* ── Base ───────────────────────────────────────── */

  *, *::before, *::after { box-sizing: border-box; }

  body {
    font-family: var(--wt-font-body);
    background: var(--wt-bg-void);
    color: var(--wt-text-primary);
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .wt-page {
    font-family: var(--wt-font-body);
    background: var(--wt-bg-void);
    color: var(--wt-text-primary);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* Subtle dot-grid background */
  .wt-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(59,130,246,0.06) 1px, transparent 0);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }
  .wt-page > * { position: relative; z-index: 1; }

  /* ── Panels & Cards ──────────────────────────────── */

  .wt-panel {
    background: var(--wt-bg-panel);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius-lg);
    transition: border-color var(--wt-transition), box-shadow var(--wt-transition);
  }
  .wt-panel:hover {
    border-color: var(--wt-border-mid);
    box-shadow: 0 0 24px rgba(59,130,246,0.07);
  }

  .wt-card {
    background: linear-gradient(145deg, var(--wt-bg-card) 0%, var(--wt-bg-raised) 100%);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius-lg);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all var(--wt-transition);
    position: relative;
    overflow: hidden;
  }
  .wt-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .wt-card:hover {
    border-color: var(--wt-border-mid);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(59,130,246,0.08);
  }

  .wt-glass {
    background: rgba(13,21,40,0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: var(--wt-radius-lg);
  }

  /* ── Animations ──────────────────────────────────── */

  .wt-animate-in       { animation: wt-fade-in 0.4s cubic-bezier(0.4,0,0.2,1) both; }
  .wt-animate-in-left  { animation: wt-slide-left 0.38s cubic-bezier(0.4,0,0.2,1) both; }
  .wt-animate-in-right { animation: wt-slide-right 0.38s cubic-bezier(0.4,0,0.2,1) both; }
  .wt-animate-scale    { animation: wt-scale-in 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }

  .wt-stagger-1 { animation-delay: 0.04s; }
  .wt-stagger-2 { animation-delay: 0.08s; }
  .wt-stagger-3 { animation-delay: 0.12s; }
  .wt-stagger-4 { animation-delay: 0.16s; }
  .wt-stagger-5 { animation-delay: 0.20s; }
  .wt-stagger-6 { animation-delay: 0.24s; }

  /* ── Typography ──────────────────────────────────── */

  .wt-display  { font-family: var(--wt-font-display); font-weight: 700; letter-spacing: 0.03em; }
  .wt-mono     { font-family: var(--wt-font-mono); }
  .wt-gradient-text {
    background: linear-gradient(135deg, var(--wt-blue-bright), var(--wt-amber));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Form elements ───────────────────────────────── */

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
    border-color: var(--wt-blue);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  .wt-select option { background: #101a30; color: #e2e8f0; }

  .wt-input {
    background: var(--wt-bg-card);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius);
    color: var(--wt-text-primary);
    font-family: var(--wt-font-body);
    font-size: 14px;
    padding: 10px 14px;
    width: 100%;
    transition: all var(--wt-transition);
    box-sizing: border-box;
  }
  .wt-input:focus {
    outline: none;
    border-color: var(--wt-blue);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  .wt-input::placeholder { color: var(--wt-text-muted); }

  .wt-textarea {
    background: var(--wt-bg-card);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius);
    color: var(--wt-text-primary);
    font-family: var(--wt-font-mono);
    font-size: 12px;
    padding: 12px 14px;
    width: 100%;
    resize: vertical;
    transition: all var(--wt-transition);
    line-height: 1.6;
    box-sizing: border-box;
  }
  .wt-textarea:focus {
    outline: none;
    border-color: var(--wt-blue);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }

  /* ── Buttons ─────────────────────────────────────── */

  .wt-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: var(--wt-radius);
    font-family: var(--wt-font-body);
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.01em;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--wt-transition);
    white-space: nowrap;
    line-height: 1;
  }
  .wt-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; pointer-events: none; }

  .wt-btn-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #ffffff;
    box-shadow: 0 2px 12px rgba(59,130,246,0.35);
  }
  .wt-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(59,130,246,0.45);
  }

  .wt-btn-amber {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #0a0f1e;
    font-weight: 700;
    box-shadow: 0 2px 12px rgba(245,158,11,0.3);
  }
  .wt-btn-amber:hover:not(:disabled) {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(245,158,11,0.4);
  }

  .wt-btn-ghost {
    background: transparent;
    color: var(--wt-text-dim);
    border-color: var(--wt-border);
  }
  .wt-btn-ghost:hover:not(:disabled) {
    background: rgba(59,130,246,0.08);
    border-color: var(--wt-border-mid);
    color: var(--wt-blue-bright);
  }

  .wt-btn-danger {
    background: rgba(244,63,94,0.1);
    color: #f43f5e;
    border-color: rgba(244,63,94,0.28);
  }
  .wt-btn-danger:hover:not(:disabled) {
    background: rgba(244,63,94,0.2);
    border-color: #f43f5e;
    transform: translateY(-1px);
  }

  .wt-btn-success {
    background: rgba(34,197,94,0.1);
    color: #22c55e;
    border-color: rgba(34,197,94,0.28);
  }
  .wt-btn-success:hover:not(:disabled) {
    background: rgba(34,197,94,0.2);
    border-color: #22c55e;
    transform: translateY(-1px);
  }

  .wt-btn-icon {
    padding: 7px;
    border-radius: var(--wt-radius);
    background: transparent;
    border: 1px solid transparent;
    color: var(--wt-text-muted);
    cursor: pointer;
    transition: all var(--wt-transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .wt-btn-icon:hover         { color: var(--wt-blue-bright); background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.2); }
  .wt-btn-icon.amber:hover   { color: var(--wt-amber);        background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.25); }
  .wt-btn-icon.danger:hover  { color: #f43f5e;                background: rgba(244,63,94,0.08); border-color: rgba(244,63,94,0.25); }
  .wt-btn-icon.success:hover { color: #22c55e;                background: rgba(34,197,94,0.08);  border-color: rgba(34,197,94,0.25); }

  /* ── Tab system ──────────────────────────────────── */

  .wt-tab-bar {
    display: flex;
    gap: 2px;
    background: var(--wt-bg-panel);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius-lg);
    padding: 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .wt-tab-bar::-webkit-scrollbar { display: none; }

  .wt-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--wt-radius);
    font-family: var(--wt-font-body);
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--wt-transition);
    white-space: nowrap;
    color: var(--wt-text-muted);
    background: transparent;
  }
  .wt-tab:hover { color: var(--wt-blue-bright); background: rgba(59,130,246,0.07); border-color: rgba(59,130,246,0.15); }
  .wt-tab.active { color: #fff; background: linear-gradient(135deg,#3b82f6,#2563eb); border-color: transparent; box-shadow: 0 2px 12px rgba(59,130,246,0.35); font-weight: 600; }

  /* ── KPI Cards ───────────────────────────────────── */

  .wt-kpi {
    position: relative;
    overflow: hidden;
    border-radius: var(--wt-radius-lg);
    padding: 20px;
    transition: all var(--wt-transition);
    cursor: default;
    background: linear-gradient(145deg, var(--wt-bg-card), var(--wt-bg-raised));
    border: 1px solid var(--wt-border);
  }
  .wt-kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0.7;
  }
  .wt-kpi::after {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.04;
    transition: transform 0.4s ease;
  }
  .wt-kpi:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 20px rgba(59,130,246,0.06); border-color: var(--wt-border-mid); }
  .wt-kpi:hover::after { transform: scale(1.5); }

  /* ── Progress bars ───────────────────────────────── */

  .wt-progress-track {
    height: 5px;
    background: rgba(255,255,255,0.05);
    border-radius: 3px;
    overflow: hidden;
  }
  .wt-progress-fill {
    height: 100%;
    border-radius: 3px;
    animation: wt-bar-grow 0.9s cubic-bezier(0.34,1.56,0.64,1) both;
    animation-delay: 0.15s;
  }

  /* ── Section headers ─────────────────────────────── */

  .wt-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--wt-font-display);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .wt-section-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 48px; height: 2px;
    border-radius: 1px;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
  }

  /* ── Vehicle rows ────────────────────────────────── */

  .wt-vehicle-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--wt-radius);
    border: 1px solid var(--wt-border);
    background: var(--wt-bg-raised);
    transition: all var(--wt-transition);
  }
  .wt-vehicle-row:hover {
    border-color: var(--wt-border-mid);
    background: var(--wt-bg-hover);
    transform: translateX(4px);
    box-shadow: 4px 0 12px rgba(59,130,246,0.1);
  }

  /* ── Stat pair ───────────────────────────────────── */

  .wt-stat-pair {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 13px;
  }
  .wt-stat-pair:last-child { border-bottom: none; }

  /* ── Divider ─────────────────────────────────────── */

  .wt-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent);
    margin: 20px 0;
  }

  /* ── Rank badge ──────────────────────────────────── */

  .wt-rank-badge {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 6px;
    font-family: var(--wt-font-display);
    font-weight: 700;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* ── Collapsible ─────────────────────────────────── */

  .wt-collapse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 18px;
    cursor: pointer;
    border-radius: var(--wt-radius);
    transition: all var(--wt-transition);
    user-select: none;
  }
  .wt-collapse-header:hover { background: rgba(59,130,246,0.04); }

  /* ── Battle card ─────────────────────────────────── */

  .wt-battle-card {
    background: linear-gradient(145deg, var(--wt-bg-card), var(--wt-bg-raised));
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius-lg);
    transition: all var(--wt-transition);
    overflow: hidden;
    position: relative;
  }
  .wt-battle-card:hover {
    border-color: var(--wt-border-mid);
    box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 14px rgba(59,130,246,0.06);
    transform: translateY(-2px);
  }
  .wt-battle-card.victory { border-left: 3px solid #22c55e; }
  .wt-battle-card.defeat  { border-left: 3px solid #f43f5e; }
  .wt-battle-card.draw    { border-left: 3px solid #f59e0b; }
  .wt-battle-card.unknown { border-left: 3px solid #334155; }

  /* ── Data table ──────────────────────────────────── */

  .wt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    font-family: var(--wt-font-body);
  }
  .wt-table th {
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--wt-blue-bright);
    padding: 11px 14px;
    border-bottom: 1px solid var(--wt-border);
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
    background: var(--wt-bg-panel);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .wt-table th:hover { color: #fff; background: rgba(59,130,246,0.06); }
  .wt-table td {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.035);
    color: var(--wt-text-primary);
    vertical-align: middle;
  }
  .wt-table tr:hover td { background: rgba(59,130,246,0.03); }
  .wt-table tr:last-child td { border-bottom: none; }

  /* ── Chart tooltip ───────────────────────────────── */

  .wt-chart-tooltip {
    background: rgba(10,16,32,0.96) !important;
    border: 1px solid rgba(59,130,246,0.3) !important;
    border-radius: 8px !important;
    font-family: var(--wt-font-body) !important;
    font-size: 12px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 14px rgba(59,130,246,0.1) !important;
    color: #e2e8f0 !important;
    backdrop-filter: blur(12px) !important;
  }

  /* ── Utility ─────────────────────────────────────── */

  .wt-text-blue    { color: var(--wt-blue-bright); }
  .wt-text-amber   { color: var(--wt-amber); }
  .wt-text-red     { color: var(--wt-red); }
  .wt-text-green   { color: var(--wt-green); }
  .wt-text-purple  { color: var(--wt-purple); }
  .wt-text-muted   { color: var(--wt-text-muted); }
  .wt-text-dim     { color: var(--wt-text-dim); }
  .wt-text-primary { color: var(--wt-text-primary); }
  .wt-text-cyan    { color: var(--wt-cyan); }

  @media (max-width: 768px) {
    .wt-page-header { padding: 18px 16px 14px; }
    .wt-filter-bar  { padding: 10px 12px; gap: 6px; }
  }
`;

// ─── Style Injector ───────────────────────────────────────────────────────────

export function StyleInjector() {
  useEffect(() => {
    const id = 'wt-global-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
  }, []);
  return null;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Intersection-observer lazy visibility */
export function useInView(threshold = 0.1) {
  const ref = useRef(null);
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
export function useCounter(target, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const startTs = useRef(null);

  useEffect(() => {
    if (target == null || isNaN(target)) return;
    const to = parseFloat(target);
    const tick = (ts) => {
      if (!startTs.current) startTs.current = ts;
      const elapsed = ts - startTs.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = to * ease;
      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); startTs.current = null; };
  }, [target, duration, decimals]);

  return value;
}

// ─── Shared micro-components ──────────────────────────────────────────────────

export function WTSpinner({ size = 22, color = 'var(--wt-blue)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(59,130,246,0.18)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'wt-spin 0.65s linear infinite',
      flexShrink: 0,
    }} />
  );
}

export function WTSkeleton({ width = '100%', height = 18, className = '' }) {
  return (
    <div
      className={`wt-skeleton ${className}`}
      style={{ width, height, borderRadius: 4 }}
    />
  );
}

export function ResultBadge({ result }) {
  const map = {
    Victory: { cls: 'victory', label: 'Victory' },
    Defeat:  { cls: 'defeat',  label: 'Defeat' },
    Draw:    { cls: 'draw',    label: 'Draw' },
  };
  const info = map[result] || { cls: 'unknown', label: result || 'Unknown' };
  return <span className={`wt-badge wt-badge-${info.cls}`}>{info.label}</span>;
}

export function SectionHeader({ icon: Icon, label, color = '#60a5fa', size = 'md', sub }) {
  const fontSizes = { sm: 13, md: 17, lg: 22 };
  const iconSizes = { sm: 15, md: 20, lg: 24 };
  return (
    <div className="wt-section-header" style={{ color, fontSize: fontSizes[size] }}>
      <div style={{ width: 3, height: fontSizes[size] * 1.4, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}60` }} />
      {Icon && <Icon size={iconSizes[size]} style={{ color }} />}
      <span style={{ color: '#e2e8f0', fontSize: fontSizes[size], fontFamily: "'Rajdhani'", fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: '#475569', fontWeight: 400, marginLeft: 4, fontFamily: "'Inter'" }}>{sub}</span>}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}33, transparent)`, marginLeft: 8 }} />
    </div>
  );
}

export function WTDivider() {
  return <div className="wt-divider" />;
}

export function EmptyState({ message = 'No data available', icon: Icon, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', color: '#475569', gap: 8 }}>
      <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.07)', borderRadius: '50%', marginBottom: 4 }}>
        {Icon ? <Icon size={26} style={{ color: '#1e3a5f' }} /> : <span style={{ fontSize: 22, opacity: 0.4 }}>🛡️</span>}
      </div>
      <p style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 15, letterSpacing: '0.04em', margin: 0 }}>{message}</p>
      {sub && <p style={{ fontSize: 12, margin: 0, color: '#334155', fontFamily: "'Inter'" }}>{sub}</p>}
    </div>
  );
}

// ─── Theme constants ─────────────────────────────────────────────────────────

export const THEME = {
  colors: {
    blue:   { text: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)',   glow: 'rgba(59,130,246,0.15)' },
    amber:  { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.3)',   glow: 'rgba(245,158,11,0.12)' },
    red:    { text: '#fb7185', bg: 'rgba(244,63,94,0.1)',    border: 'rgba(244,63,94,0.3)',    glow: 'rgba(244,63,94,0.12)' },
    green:  { text: '#4ade80', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)',    glow: 'rgba(34,197,94,0.12)' },
    purple: { text: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.3)',  glow: 'rgba(167,139,250,0.12)' },
    cyan:   { text: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.3)',   glow: 'rgba(34,211,238,0.12)' },
    steel:  { text: '#94a3b8', bg: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.18)', glow: 'rgba(148,163,184,0.06)' },
  },
  TOOLTIP_STYLE: {
    backgroundColor: 'rgba(10,16,32,0.96)',
    border: '1px solid rgba(59,130,246,0.28)',
    borderRadius: '8px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    color: '#e2e8f0',
    backdropFilter: 'blur(12px)',
  },
};

export const fmt = (n, d = 0) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '0';

export const fmtK = (n) => {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

export const fmtTime = (sec) => {
  if (!sec || !Number.isFinite(sec)) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2,'0')}s`;
};

export const fmtPct = (n, d = 1) =>
  Number.isFinite(n) ? `${n.toFixed(d)}%` : '0%';

const wtTheme = { StyleInjector, THEME, fmt, fmtK, fmtTime, fmtPct, useInView, useCounter };
export default wtTheme;