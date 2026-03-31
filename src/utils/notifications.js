/**
 * notifications.js
 *
 * Standalone notification / toast system for War Thunder Stats.
 * Uses DOM injection to avoid React re-render costs.
 *
 * Usage:
 *   import { notify, clearNotifications } from '../utils/notifications';
 *   notify('Battle added!', 'success');
 *   notify('Error parsing log', 'error');
 *   notify('Warning: duplicate', 'warning', { duration: 6000 });
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const MSG_CONFIG = {
  success: { icon: '✅', color: '#22c55e', duration: 4000 },
  error:   { icon: '❌', color: '#ef4444', duration: 6000 },
  warning: { icon: '⚠️', color: '#f59e0b', duration: 5000 },
  info:    { icon: 'ℹ️', color: '#3b82f6', duration: 4000 },
};

const MAX_NOTIFS = 6;
const DEDUP_MS   = 3000;

// ─── Internal state ───────────────────────────────────────────────────────────

let _stack   = [];
let _mounted = false;

function _ensureContainer() {
  if (typeof document === 'undefined') return null;

  // Ensure styles exist
  if (!document.getElementById('wt-notif-styles')) {
    const style = document.createElement('style');
    style.id = 'wt-notif-styles';
    style.textContent = `
      .wt-notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 380px;
        width: calc(100% - 40px);
        pointer-events: none;
      }
      @keyframes wt-n-in  { from { opacity:0; transform:translateX(40px) scale(0.92); } to { opacity:1; transform:none; } }
      @keyframes wt-n-out { from { opacity:1; transform:none; max-height:80px; margin-bottom:0; } to { opacity:0; transform:translateX(50px); max-height:0; margin-bottom:-8px; } }
      .wt-notif {
        pointer-events: all;
        background: #111820;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3);
        animation: wt-n-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
        position: relative;
        border: 1px solid rgba(255,255,255,0.06);
        max-height: 80px;
        transition: max-height 0.3s ease;
      }
      .wt-notif.wt-n-exit {
        animation: wt-n-out 0.28s ease forwards;
      }
      .wt-notif-inner {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 11px 12px 9px 12px;
      }
      .wt-notif-left {
        width: 3px;
        position: absolute;
        left: 0; top: 0; bottom: 0;
        border-radius: 8px 0 0 8px;
      }
      .wt-notif-body { padding-left: 5px; flex: 1; }
      .wt-notif-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
      .wt-notif-text {
        font-family: 'Exo 2', system-ui, sans-serif;
        font-size: 13px;
        color: #e2e8f0;
        line-height: 1.45;
        word-break: break-word;
      }
      .wt-notif-close {
        background: none; border: none;
        color: #475569; cursor: pointer;
        padding: 0 4px; font-size: 15px;
        flex-shrink: 0; line-height: 1;
        margin-top: -1px;
        transition: color 0.15s;
      }
      .wt-notif-close:hover { color: #94a3b8; }
      .wt-notif-progress {
        height: 2px;
        width: 100%;
        border-radius: 0 0 0 0;
        transition: width linear;
      }
    `;
    document.head.appendChild(style);
  }

  let c = document.getElementById('wt-notification-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'wt-notification-container';
    c.className = 'wt-notification-container';
    document.body.appendChild(c);
    _mounted = true;
  }
  return c;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Show a toast notification.
 *
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {{ duration?: number }} opts
 */
export function notify(message, type = 'info', opts = {}) {
  const cfg      = MSG_CONFIG[type] ?? MSG_CONFIG.info;
  const duration = opts.duration ?? cfg.duration;
  const now      = Date.now();

  // Dedup check
  if (_stack.some(n => n.text === message && n.type === type && now - n.ts < DEDUP_MS)) return;

  const id = `wt_n_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const entry = { id, text: message, type, color: cfg.color, icon: cfg.icon, duration, ts: now };
  _stack.push(entry);

  // Trim oldest
  while (_stack.length > MAX_NOTIFS) {
    _dismissById(_stack[0].id, true);
    _stack.shift();
  }

  _renderNotif(entry);
}

/** Alias so existing code using showMessage still works */
export function showMessage(message, type = 'info', opts = {}) {
  notify(message, type, opts);
}

export function clearNotifications() {
  [..._stack].forEach(n => _dismissById(n.id, true));
  _stack = [];
  const c = document.getElementById('wt-notification-container');
  if (c) c.innerHTML = '';
}

// ─── Internal ────────────────────────────────────────────────────────────────

function _renderNotif(entry) {
  const container = _ensureContainer();
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'wt-notif';
  el.id = entry.id;
  el.innerHTML = `
    <div class="wt-notif-left" style="background:${entry.color};box-shadow:0 0 6px ${entry.color}66;"></div>
    <div class="wt-notif-inner">
      <span class="wt-notif-icon">${entry.icon}</span>
      <div class="wt-notif-body">
        <div class="wt-notif-text">${entry.text}</div>
      </div>
      <button class="wt-notif-close" title="Dismiss">&#x2715;</button>
    </div>
    <div class="wt-notif-progress" id="prog_${entry.id}" style="background:${entry.color};"></div>
  `;

  // Close button
  const closeBtn = el.querySelector('.wt-notif-close');
  if (closeBtn) closeBtn.addEventListener('click', () => _dismissById(entry.id));

  container.appendChild(el);

  // Animate progress bar shrink
  const bar = el.querySelector(`#prog_${entry.id}`);
  if (bar) {
    requestAnimationFrame(() => {
      bar.style.transition = `width ${entry.duration}ms linear`;
      bar.style.width = '0%';
    });
  }

  const tid = setTimeout(() => _dismissById(entry.id), entry.duration);
  el.dataset.tid = String(tid);
}

function _dismissById(id, immediate = false) {
  const el = document.getElementById(id);
  if (!el) return;
  clearTimeout(Number(el.dataset.tid));
  if (immediate) {
    el.remove();
    _stack = _stack.filter(n => n.id !== id);
    return;
  }
  el.classList.add('wt-n-exit');
  setTimeout(() => {
    el.remove();
    _stack = _stack.filter(n => n.id !== id);
  }, 300);
}

// Expose for inline onclick usage
if (typeof window !== 'undefined') {
  window.__wtDismissNotif = _dismissById;
}

export default { notify, showMessage, clearNotifications };