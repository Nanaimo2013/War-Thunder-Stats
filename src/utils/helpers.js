/**
 * helpers.js
 *
 * Utility functions for the War Thunder stats app.
 *
 * Changes from v1:
 *  ✓  formatDuration(seconds) now the primary time formatter (times stored as int seconds)
 *  ✓  formatTime(seconds) alias for quick "MM:SS" display
 *  ✓  Notification stack avoids re-renders on same text+type within 3 s (unchanged logic, cleaner code)
 *  ✓  useSessionStorage → useStorage, supports both session and local backends
 *  ✓  All formatting functions handle NaN / null / undefined gracefully
 *  ✓  No external dependencies beyond React hooks
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Notification system ───────────────────────────────────────────────────────

const MSG_CONFIG = {
  success: { cls: 'success', icon: '✅', duration: 4000 },
  error:   { cls: 'error',   icon: '❌', duration: 6000 },
  warning: { cls: 'warning', icon: '⚠️', duration: 5000 },
  info:    { cls: 'info',    icon: 'ℹ️', duration: 4000 },
};

let _stack     = [];          // active notifications
const MAX_NOTIFS = 6;
const DEDUP_MS   = 3000;       // suppress identical messages within this window

export const showMessage = (msg, type = 'info', opts = {}) => {
  const cfg      = MSG_CONFIG[type] ?? MSG_CONFIG.info;
  const duration = opts.duration ?? cfg.duration;
  const now      = Date.now();

  // Dedup check
  if (_stack.some(n => n.text === msg && n.type === type && now - n.ts < DEDUP_MS)) return;

  const id = `notif_${now}_${Math.random().toString(36).slice(2, 7)}`;
  _stack.push({ id, text: msg, type, cls: cfg.cls, icon: cfg.icon, duration, ts: now });

  // Evict oldest if over limit
  while (_stack.length > MAX_NOTIFS) {
    _removeFromDOM(_stack.shift().id);
  }

  _renderStack();
};

export const clearMessages = () => {
  _stack.forEach(n => _removeFromDOM(n.id));
  _stack = [];
  const c = _getContainer();
  if (c) c.innerHTML = '';
};

function _getContainer() {
  if (typeof document === 'undefined') return null;
  let c = document.getElementById('wt-notification-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'wt-notification-container';
    c.className = 'wt-notification-container';
    document.body.appendChild(c);
  }
  return c;
}

function _renderStack() {
  const container = _getContainer();
  if (!container) return;
  container.innerHTML = '';
  _stack.forEach((n, idx) => {
    const el = _makeNotifEl(n, idx);
    container.appendChild(el);
  });
}

function _makeNotifEl(n, idx) {
  const el = document.createElement('div');
  el.className = `wt-notification ${n.cls}`;
  el.id = n.id;
  el.style.animationDelay = `${idx * 0.08}s`;

  el.innerHTML = `
    <div class="wt-notif-body">
      <span class="wt-notif-icon">${n.icon}</span>
      <span class="wt-notif-text">${n.text}</span>
    </div>
    <button class="wt-notif-close" onclick="window.__wtCloseNotif('${n.id}')" title="Close">&#x2715;</button>
    <div class="wt-notif-progress ${n.cls}" id="prog_${n.id}"></div>
  `;

  // Animate progress bar
  requestAnimationFrame(() => {
    const bar = el.querySelector(`#prog_${n.id}`);
    if (bar) {
      bar.style.transition = `width ${n.duration}ms linear`;
      bar.style.width = '0%';
    }
  });

  const tid = setTimeout(() => _removeNotif(n.id), n.duration);
  el.dataset.tid = tid;

  requestAnimationFrame(() => el.classList.add('wt-notif-enter'));
  return el;
}

function _removeNotif(id) {
  const idx = _stack.findIndex(n => n.id === id);
  if (idx !== -1) {
    _stack.splice(idx, 1);
    _removeFromDOM(id);
    _renderStack();
  }
}

function _removeFromDOM(id) {
  const el = document.getElementById(id);
  if (!el) return;
  clearTimeout(Number(el.dataset.tid));
  el.classList.add('wt-notif-exit');
  setTimeout(() => el.remove(), 350);
}

// Expose to button onclick handlers
if (typeof window !== 'undefined') {
  window.__wtCloseNotif = (id) => _removeNotif(id);
}

// ─── Storage hook ──────────────────────────────────────────────────────────────

/**
 * React hook that syncs state with localStorage (or sessionStorage).
 *
 * @template T
 * @param {string}  key            Storage key
 * @param {T}       initialValue   Default when key is absent or invalid
 * @param {{
 *   backend?:     'local' | 'session',
 *   validate?:    (v: T) => boolean,
 *   serialize?:   (v: T) => string,
 *   deserialize?: (s: string) => T,
 * }} opts
 * @returns {[T, (v: T | ((prev: T) => T)) => void]}
 */
export function useStorage(key, initialValue, opts = {}) {
  const {
    backend     = 'local',
    validate    = null,
    serialize   = JSON.stringify,
    deserialize = JSON.parse,
  } = opts;

  const storage = backend === 'session'
    ? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
    : (typeof localStorage   !== 'undefined' ? localStorage   : null);

  const [value, setValue] = useState(() => {
    if (!storage) return initialValue;
    try {
      const raw = storage.getItem(key);
      if (raw === null) return initialValue;
      const parsed = deserialize(raw);
      if (validate && !validate(parsed)) return initialValue;
      return parsed;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((nextValue) => {
    setValue(prev => {
      const v = typeof nextValue === 'function' ? nextValue(prev) : nextValue;
      if (validate && !validate(v)) {
        showMessage(`Invalid value for storage key "${key}"`, 'error');
        return prev;
      }
      if (storage) {
        try { storage.setItem(key, serialize(v)); }
        catch (e) { showMessage('Storage quota exceeded — some data may not be saved.', 'warning'); }
      }
      return v;
    });
  }, [key, validate, serialize, storage]);

  return [value, set];
}

/** @deprecated Use useStorage instead */
export const useSessionStorage = (key, initial, opts) =>
  useStorage(key, initial, { ...opts, backend: 'session' });

// ─── Number formatting ────────────────────────────────────────────────────────

/**
 * Format an integer with locale thousands separators.
 * @param {number} num
 * @param {{ decimals?: number, locale?: string }} opts
 */
export function formatNumber(num, opts = {}) {
  const { decimals = 0, locale = 'en-US' } = opts;
  if (num == null || !Number.isFinite(num)) return '0';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number as a compact string (1.2K, 3.4M, etc.)
 * @param {number} num
 */
export function formatCompact(num) {
  if (num == null || !Number.isFinite(num)) return '0';
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

/**
 * Format a Silver Lions / RP value with optional currency label.
 */
export function formatCurrency(amount, currency = 'SL', opts = {}) {
  const { decimals = 0 } = opts;
  if (amount == null || !Number.isFinite(amount)) return `0 ${currency}`;
  return `${formatNumber(amount, { decimals })} ${currency}`;
}

// ─── Time formatting ──────────────────────────────────────────────────────────

/**
 * Format a duration in seconds.
 *
 * @param {number}  totalSeconds
 * @param {{ compact?: boolean, showSeconds?: boolean }} opts
 * @returns {string}
 *
 * Examples:
 *   formatDuration(75)                → '1:15'
 *   formatDuration(3725)              → '1:02:05'
 *   formatDuration(3725, { compact }) → '1h 2m'
 *   formatDuration(45, { compact })   → '45s'
 */
export function formatDuration(totalSeconds, opts = {}) {
  const { compact = false, showSeconds = true } = opts;

  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';

  const h   = Math.floor(totalSeconds / 3600);
  const m   = Math.floor((totalSeconds % 3600) / 60);
  const s   = Math.floor(totalSeconds % 60);

  if (compact) {
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${showSeconds ? `${s}s` : ''}`.trim();
    return `${s}s`;
  }

  if (h > 0) return `${h}:${_pad(m)}:${_pad(s)}`;
  return `${m}:${_pad(s)}`;
}

/**
 * Quick alias for "MM:SS" formatting from seconds.
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  return formatDuration(seconds);
}

function _pad(n) { return String(n).padStart(2, '0'); }

// ─── Percentage formatting ────────────────────────────────────────────────────

/**
 * @param {number} value
 * @param {number} total
 * @param {{ decimals?: number, showSymbol?: boolean }} opts
 */
export function calculatePercentage(value, total, opts = {}) {
  const { decimals = 1, showSymbol = true } = opts;
  if (!total || !Number.isFinite(total) || total === 0) return showSymbol ? '0%' : 0;
  const pct = (value / total) * 100;
  return showSymbol ? `${pct.toFixed(decimals)}%` : parseFloat(pct.toFixed(decimals));
}

// ─── Functional utilities ─────────────────────────────────────────────────────

export function debounce(fn, wait, leading = false) {
  let timer;
  return function (...args) {
    const callNow = leading && !timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!leading) fn.apply(this, args);
    }, wait);
    if (callNow) fn.apply(this, args);
  };
}

export function throttle(fn, limit) {
  let active = false;
  return function (...args) {
    if (!active) {
      fn.apply(this, args);
      active = true;
      setTimeout(() => { active = false; }, limit);
    }
  };
}

// ─── Object utilities ─────────────────────────────────────────────────────────

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]));
}

export function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => isEqual(item, b[i]));
  }
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => kb.includes(k) && isEqual(a[k], b[k]));
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Safely read a nested property with a dot-path string. */
export function getNestedValue(obj, path, defaultValue = undefined) {
  const result = path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
  return result !== undefined ? result : defaultValue;
}

/** Safely set a nested property with a dot-path string (mutates). */
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((acc, k) => {
    if (typeof acc[k] !== 'object' || acc[k] === null) acc[k] = {};
    return acc[k];
  }, obj);
  target[last] = value;
  return obj;
}

// ─── React hook: outside click ────────────────────────────────────────────────

/**
 * Calls handler when a click occurs outside ref element.
 * @param {React.RefObject} ref
 * @param {() => void} handler
 */
export function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

/**
 * Returns a boolean that is true for `delay` ms after the dependency changes.
 * Useful for "just updated" flash animations.
 */
export function useRecentChange(dep, delay = 1500) {
  const [recent, setRecent] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setRecent(true);
    const t = setTimeout(() => setRecent(false), delay);
    return () => clearTimeout(t);
  }, [dep, delay]);
  return recent;
}

const helpers = {
  showMessage, clearMessages,
  useStorage, useSessionStorage,
  formatNumber, formatCompact, formatCurrency,
  formatDuration, formatTime,
  calculatePercentage,
  debounce, throttle,
  deepClone, isEqual, generateId,
  getNestedValue, setNestedValue,
  useOutsideClick, useRecentChange,
};
export default helpers;