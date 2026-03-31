/**
 * wtTheme.js
 *
 * Single source of truth for all War Thunder Stats UI styles, CSS variables,
 * animations, and shared micro-components. Import StyleInjector into any page.
 *
 * Usage:
 *   import { StyleInjector, THEME } from '../styles/wtTheme';
 *   // In your component: <StyleInjector />
 */

import React, { useEffect, useRef, useState } from 'react';

// ─── CSS Variables & Global Styles ────────────────────────────────────────────

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap');

  :root {
    --wt-bg-void:        #070a0d;
    --wt-bg-deep:        #0d1117;
    --wt-bg-panel:       #111820;
    --wt-bg-raised:      #161e28;
    --wt-bg-card:        #1a2233;
    --wt-bg-hover:       #1f2a3d;
    --wt-amber:          #f59e0b;
    --wt-amber-dim:      #b45309;
    --wt-amber-glow:     rgba(245,158,11,0.18);
    --wt-amber-bright:   #fbbf24;
    --wt-red:            #ef4444;
    --wt-red-dim:        #991b1b;
    --wt-red-glow:       rgba(239,68,68,0.15);
    --wt-green:          #22c55e;
    --wt-green-dim:      #166534;
    --wt-green-glow:     rgba(34,197,94,0.15);
    --wt-blue:           #3b82f6;
    --wt-blue-dim:       #1d4ed8;
    --wt-blue-glow:      rgba(59,130,246,0.15);
    --wt-purple:         #a855f7;
    --wt-purple-dim:     #7e22ce;
    --wt-steel:          #94a3b8;
    --wt-steel-dim:      #475569;
    --wt-border:         rgba(245,158,11,0.15);
    --wt-border-bright:  rgba(245,158,11,0.4);
    --wt-text-primary:   #e2e8f0;
    --wt-text-muted:     #64748b;
    --wt-text-dim:       #94a3b8;
    --wt-font-display:   'Rajdhani', 'Exo 2', sans-serif;
    --wt-font-mono:      'Share Tech Mono', 'JetBrains Mono', monospace;
    --wt-font-body:      'Exo 2', sans-serif;
    --wt-radius:         6px;
    --wt-radius-lg:      10px;
    --wt-transition:     0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Keyframes ──────────────────────────────────── */

  @keyframes wt-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes wt-slide-left {
    from { opacity: 0; transform: translateX(-20px); }
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
  @keyframes wt-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
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
  @keyframes wt-bar-grow {
    from { transform: scaleX(0); transform-origin: left; }
    to   { transform: scaleX(1); transform-origin: left; }
  }
  @keyframes wt-counter-up {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes wt-slide-down {
    from { opacity: 0; max-height: 0; transform: translateY(-8px); }
    to   { opacity: 1; max-height: 2000px; transform: translateY(0); }
  }
  @keyframes wt-notif-enter {
    from { opacity: 0; transform: translateX(100%) scale(0.9); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes wt-notif-exit {
    from { opacity: 1; transform: translateX(0); max-height: 80px; }
    to   { opacity: 0; transform: translateX(110%); max-height: 0; }
  }
  @keyframes wt-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes wt-skeleton {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }

  /* ── Base Page ───────────────────────────────────── */

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
        rgba(245,158,11,0.012) 2px,
        rgba(245,158,11,0.012) 4px
      );
    pointer-events: none;
    z-index: 0;
  }
  .wt-page > * { position: relative; z-index: 1; }

  .wt-hex-bg {
    background-image: radial-gradient(circle at 1px 1px, rgba(245,158,11,0.06) 1px, transparent 0);
    background-size: 28px 28px;
  }

  /* ── Panel & Card ────────────────────────────────── */

  .wt-panel {
    background: var(--wt-bg-panel);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius-lg);
    transition: border-color var(--wt-transition), box-shadow var(--wt-transition);
  }
  .wt-panel:hover {
    border-color: var(--wt-border-bright);
    box-shadow: 0 0 20px rgba(245,158,11,0.06);
  }

  .wt-card {
    background: var(--wt-bg-card);
    border: 1px solid rgba(245,158,11,0.12);
    border-radius: var(--wt-radius);
    transition: all var(--wt-transition);
  }
  .wt-card:hover {
    border-color: rgba(245,158,11,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 16px rgba(245,158,11,0.08);
  }

  /* ── Animations ──────────────────────────────────── */

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

  /* ── Typography ──────────────────────────────────── */

  .wt-display { font-family: var(--wt-font-display); font-weight: 700; letter-spacing: 0.02em; }
  .wt-mono    { font-family: var(--wt-font-mono); }
  .wt-glow-amber { animation: wt-glow-amber 2.5s ease-in-out infinite; }

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
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }
  .wt-select:focus {
    outline: none;
    border-color: var(--wt-amber);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.12), 0 0 12px rgba(245,158,11,0.08);
  }
  .wt-select option {
    background: #1a2233;
    color: #e2e8f0;
  }

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
    border-color: var(--wt-amber);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
  }
  .wt-input::placeholder {
    color: var(--wt-text-muted);
  }

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
    border-color: var(--wt-amber);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
  }

  /* ── Buttons ─────────────────────────────────────── */

  .wt-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: var(--wt-radius);
    font-family: var(--wt-font-display);
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--wt-transition);
    white-space: nowrap;
  }
  .wt-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
  }

  .wt-btn-primary {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #0d1117;
    border-color: transparent;
    box-shadow: 0 2px 12px rgba(245,158,11,0.3);
  }
  .wt-btn-primary:hover:not(:disabled) {
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
    background: rgba(245,158,11,0.07);
    border-color: var(--wt-border-bright);
    color: var(--wt-amber);
  }

  .wt-btn-danger {
    background: rgba(239,68,68,0.12);
    color: #ef4444;
    border-color: rgba(239,68,68,0.3);
  }
  .wt-btn-danger:hover:not(:disabled) {
    background: rgba(239,68,68,0.22);
    border-color: #ef4444;
    transform: translateY(-1px);
  }

  .wt-btn-success {
    background: rgba(34,197,94,0.12);
    color: #22c55e;
    border-color: rgba(34,197,94,0.3);
  }
  .wt-btn-success:hover:not(:disabled) {
    background: rgba(34,197,94,0.22);
    border-color: #22c55e;
    transform: translateY(-1px);
  }

  .wt-btn-icon {
    padding: 7px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--wt-text-muted);
    cursor: pointer;
    transition: all var(--wt-transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .wt-btn-icon:hover { color: var(--wt-amber); background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); }
  .wt-btn-icon.danger:hover  { color: #ef4444; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
  .wt-btn-icon.success:hover { color: #22c55e; background: rgba(34,197,94,0.1);  border-color: rgba(34,197,94,0.3); }
  .wt-btn-icon.info:hover    { color: #3b82f6; background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); }

  /* ── Tab system ──────────────────────────────────── */

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
  .wt-tab:hover { color: var(--wt-amber); background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.2); }
  .wt-tab.active { color: #0d1117; font-weight: 700; border-color: transparent; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }

  /* ── KPI Cards ───────────────────────────────────── */

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

  /* ── Progress bars ───────────────────────────────── */

  .wt-progress-track {
    height: 5px;
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

  /* ── Section headers ─────────────────────────────── */

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
    background: currentColor;
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

  /* ── Vehicle rows ────────────────────────────────── */

  .wt-vehicle-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--wt-radius);
    border: 1px solid rgba(245,158,11,0.08);
    background: var(--wt-bg-raised);
    transition: all var(--wt-transition);
  }
  .wt-vehicle-row:hover {
    border-color: rgba(245,158,11,0.3);
    background: var(--wt-bg-hover);
    transform: translateX(4px);
    box-shadow: 4px 0 12px rgba(245,158,11,0.1);
  }

  /* ── Divider ─────────────────────────────────────── */

  .wt-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--wt-border-bright), transparent);
    margin: 20px 0;
  }

  /* ── Rank badge ──────────────────────────────────── */

  .wt-rank-badge {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px;
    font-family: var(--wt-font-display);
    font-weight: 700;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* ── Result badges ───────────────────────────────── */

  .wt-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 4px;
    font-family: var(--wt-font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .wt-badge-victory { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.35);  color: #22c55e; }
  .wt-badge-defeat  { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.35);  color: #ef4444; }
  .wt-badge-unknown { background: rgba(100,116,139,0.1); border: 1px solid rgba(100,116,139,0.2); color: #64748b; }

  /* ── Notifications ───────────────────────────────── */

  .wt-notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 380px;
    width: 100%;
    pointer-events: none;
  }

  .wt-notification {
    pointer-events: all;
    background: var(--wt-bg-panel);
    border-radius: 8px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
    animation: wt-notif-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    position: relative;
  }
  .wt-notification.wt-notif-exit {
    animation: wt-notif-exit 0.3s ease forwards;
  }
  .wt-notification.success { border-left: 3px solid #22c55e; }
  .wt-notification.error   { border-left: 3px solid #ef4444; }
  .wt-notification.warning { border-left: 3px solid #f59e0b; }
  .wt-notification.info    { border-left: 3px solid #3b82f6; }

  .wt-notif-body {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px 10px 14px;
  }
  .wt-notif-icon {
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .wt-notif-text {
    font-family: var(--wt-font-body);
    font-size: 13px;
    color: var(--wt-text-primary);
    flex: 1;
    line-height: 1.45;
  }
  .wt-notif-close {
    background: none;
    border: none;
    color: var(--wt-text-muted);
    cursor: pointer;
    padding: 2px 6px;
    font-size: 14px;
    flex-shrink: 0;
    transition: color 0.15s;
    line-height: 1;
  }
  .wt-notif-close:hover { color: var(--wt-text-primary); }

  .wt-notif-progress {
    height: 2px;
    width: 100%;
    transition: width linear;
  }
  .wt-notif-progress.success { background: #22c55e; }
  .wt-notif-progress.error   { background: #ef4444; }
  .wt-notif-progress.warning { background: #f59e0b; }
  .wt-notif-progress.info    { background: #3b82f6; }

  /* ── Loading / Skeleton ──────────────────────────── */

  .wt-spinner {
    width: 22px; height: 22px;
    border: 2px solid rgba(245,158,11,0.2);
    border-top-color: var(--wt-amber);
    border-radius: 50%;
    animation: wt-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .wt-skeleton {
    background: linear-gradient(90deg,
      var(--wt-bg-raised) 25%,
      var(--wt-bg-hover)  50%,
      var(--wt-bg-raised) 75%
    );
    background-size: 200% 100%;
    animation: wt-skeleton 1.4s ease infinite;
    border-radius: var(--wt-radius);
  }

  .wt-lazy-section {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .wt-lazy-section.wt-visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Scrollbar ───────────────────────────────────── */

  .wt-page *::-webkit-scrollbar { width: 5px; height: 5px; }
  .wt-page *::-webkit-scrollbar-track { background: var(--wt-bg-void); }
  .wt-page *::-webkit-scrollbar-thumb {
    background: var(--wt-amber-dim);
    border-radius: 3px;
  }
  .wt-page *::-webkit-scrollbar-thumb:hover { background: var(--wt-amber); }

  /* ── Recharts override ───────────────────────────── */

  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line {
    stroke: rgba(245,158,11,0.08) !important;
  }
  .recharts-text { fill: #64748b !important; font-family: var(--wt-font-mono) !important; font-size: 11px !important; }
  .recharts-legend-item-text { fill: #94a3b8 !important; font-size: 12px !important; }

  /* ── Filter bar ──────────────────────────────────── */

  .wt-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 14px 18px;
    background: var(--wt-bg-raised);
    border: 1px solid var(--wt-border);
    border-radius: var(--wt-radius-lg);
    margin-bottom: 16px;
  }

  .wt-filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 20px;
    font-family: var(--wt-font-display);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent;
    color: var(--wt-text-muted);
    transition: all var(--wt-transition);
    white-space: nowrap;
  }
  .wt-filter-pill:hover {
    border-color: rgba(245,158,11,0.3);
    color: var(--wt-amber);
    background: rgba(245,158,11,0.06);
  }
  .wt-filter-pill.active {
    background: rgba(245,158,11,0.12);
    border-color: var(--wt-amber);
    color: var(--wt-amber);
  }
  .wt-filter-pill.victory.active { background: rgba(34,197,94,0.1); border-color: #22c55e; color: #22c55e; }
  .wt-filter-pill.defeat.active  { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }

  /* ── Navbar ──────────────────────────────────────── */

  .wt-navbar {
    background: linear-gradient(180deg, #090d11 0%, #0d1117 100%);
    border-bottom: 1px solid rgba(245,158,11,0.2);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  }

  .wt-nav-item {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 6px;
    font-family: var(--wt-font-display);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--wt-transition);
    color: var(--wt-text-muted);
    background: transparent;
    white-space: nowrap;
    text-decoration: none;
  }
  .wt-nav-item:hover {
    color: var(--wt-amber);
    background: rgba(245,158,11,0.07);
    border-color: rgba(245,158,11,0.2);
  }
  .wt-nav-item.active {
    color: #0d1117;
    background: var(--wt-amber);
    border-color: var(--wt-amber);
    box-shadow: 0 2px 12px rgba(245,158,11,0.3);
  }

  /* ── Modal ───────────────────────────────────────── */

  .wt-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(7,10,13,0.85);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: wt-fade-in 0.2s ease both;
  }

  .wt-modal {
    background: var(--wt-bg-panel);
    border: 1px solid var(--wt-border-bright);
    border-radius: 12px;
    padding: 28px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.1);
    animation: wt-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    position: relative;
  }
  .wt-modal::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--wt-amber), transparent);
    border-radius: 12px 12px 0 0;
  }

  /* ── Page header ─────────────────────────────────── */

  .wt-page-header {
    background: linear-gradient(180deg, rgba(245,158,11,0.07) 0%, transparent 100%);
    border-bottom: 1px solid rgba(245,158,11,0.12);
    padding: 28px 32px 20px;
  }

  /* ── Collapsible section ─────────────────────────── */

  .wt-collapse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    cursor: pointer;
    border-radius: var(--wt-radius);
    transition: all var(--wt-transition);
    user-select: none;
  }
  .wt-collapse-header:hover {
    background: rgba(245,158,11,0.05);
  }

  /* ── Battle card ─────────────────────────────────── */

  .wt-battle-card {
    background: var(--wt-bg-raised);
    border: 1px solid rgba(245,158,11,0.08);
    border-radius: var(--wt-radius-lg);
    transition: all var(--wt-transition);
    overflow: hidden;
    position: relative;
  }
  .wt-battle-card:hover {
    border-color: rgba(245,158,11,0.25);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 12px rgba(245,158,11,0.05);
    transform: translateY(-1px);
  }
  .wt-battle-card.victory { border-left: 3px solid #22c55e; }
  .wt-battle-card.defeat  { border-left: 3px solid #ef4444; }
  .wt-battle-card.unknown { border-left: 3px solid #475569; }

  /* ── Data table ──────────────────────────────────── */

  .wt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .wt-table th {
    font-family: var(--wt-font-display);
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--wt-amber);
    padding: 12px 14px;
    border-bottom: 1px solid var(--wt-border);
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
    background: var(--wt-bg-void);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .wt-table th:hover { color: var(--wt-amber-bright); background: rgba(245,158,11,0.05); }
  .wt-table td {
    padding: 11px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: var(--wt-text-primary);
    vertical-align: middle;
  }
  .wt-table tr:hover td { background: rgba(245,158,11,0.03); }
  .wt-table tr:last-child td { border-bottom: none; }

  /* ── Chart tooltip ───────────────────────────────── */

  .wt-chart-tooltip {
    background: #0d1117 !important;
    border: 1px solid rgba(245,158,11,0.35) !important;
    border-radius: 6px !important;
    font-family: var(--wt-font-mono) !important;
    font-size: 12px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 12px rgba(245,158,11,0.1) !important;
    color: #e2e8f0 !important;
  }

  /* ── Utility ─────────────────────────────────────── */

  .wt-text-amber   { color: var(--wt-amber); }
  .wt-text-red     { color: var(--wt-red); }
  .wt-text-green   { color: var(--wt-green); }
  .wt-text-blue    { color: var(--wt-blue); }
  .wt-text-purple  { color: var(--wt-purple); }
  .wt-text-muted   { color: var(--wt-text-muted); }
  .wt-text-dim     { color: var(--wt-text-dim); }
  .wt-text-primary { color: var(--wt-text-primary); }
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
    if (!target || isNaN(target)) return;
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

export function WTSpinner({ size = 22, color = 'var(--wt-amber)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(245,158,11,0.2)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'wt-spin 0.7s linear infinite',
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
  const cls = result === 'Victory' ? 'victory' : result === 'Defeat' ? 'defeat' : 'unknown';
  const icon = result === 'Victory' ? '✓' : result === 'Defeat' ? '✗' : '?';
  return (
    <span className={`wt-badge wt-badge-${cls}`}>
      {icon} {(result || 'Unknown').toUpperCase()}
    </span>
  );
}

export function SectionHeader({ icon: Icon, label, color = '#f59e0b', size = 'md', sub }) {
  const fontSizes = { sm: 14, md: 18, lg: 24 };
  const iconSizes = { sm: 16, md: 22, lg: 26 };
  return (
    <div className="wt-section-header" style={{ color, fontSize: fontSizes[size] }}>
      <div style={{ width: 3, height: fontSizes[size] * 1.4, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}` }} />
      {Icon && <Icon size={iconSizes[size]} style={{ color }} />}
      <span className="wt-display" style={{ color: '#e2e8f0', fontSize: fontSizes[size] }}>{label}</span>
      {sub && <span style={{ fontSize: 12, color: '#475569', fontWeight: 400, marginLeft: 4, fontFamily: "'Exo 2'" }}>— {sub}</span>}
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}44, transparent)`, marginLeft: 8 }} />
    </div>
  );
}

export function WTDivider() {
  return <div className="wt-divider" />;
}

export function EmptyState({ message = 'No data available', icon: Icon, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', color: '#475569' }}>
      {Icon
        ? <Icon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
        : <div style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.3, fontSize: 32 }}>🛡️</div>
      }
      <p style={{ fontFamily: "'Rajdhani'", fontSize: 16, letterSpacing: '0.05em', margin: '0 0 6px' }}>{message}</p>
      {sub && <p style={{ fontSize: 12, margin: 0, fontFamily: "'Exo 2'" }}>{sub}</p>}
    </div>
  );
}

// ─── Theme constants ─────────────────────────────────────────────────────────

export const THEME = {
  colors: {
    amber:  { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  glow: 'rgba(245,158,11,0.12)' },
    red:    { text: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   glow: 'rgba(239,68,68,0.12)' },
    green:  { text: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   glow: 'rgba(34,197,94,0.12)' },
    blue:   { text: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  glow: 'rgba(59,130,246,0.12)' },
    purple: { text: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', glow: 'rgba(168,85,247,0.12)' },
    steel:  { text: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)',  glow: 'rgba(148,163,184,0.06)' },
  },
  TOOLTIP_STYLE: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(245,158,11,0.35)',
    borderRadius: '6px',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    color: '#e2e8f0',
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

export default { StyleInjector, THEME, fmt, fmtK, fmtTime, fmtPct, useInView, useCounter };