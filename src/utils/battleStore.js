/**
 * battleStore.js
 *
 * Persistent storage for parsed battle objects.
 *
 * @version 2.1.0
 *
 * CHANGELOG v2.1.0:
 *  ✓  DUPLICATE BUG FIX: Added secondary session-based dedup index (STORAGE_KEYS.SEEN_SESSIONS).
 *     Previously, a battle imported as pre-parsed JSON didn't always land in the fingerprint
 *     index — allowing the same text re-pasted to slip through. Now both fingerprint AND
 *     session ID are checked on every add().
 *  ✓  _rebuildIndices(): call after loading if index counts don't match battle counts,
 *     ensuring a self-healing store even after corrupt/partial writes.
 *  ✓  add() now persists session index alongside fingerprint index.
 *  ✓  hasSession(sessionId) public method for quick UI-side checks.
 *  ✓  importJSON() handles both v1 (bare array) and v2 ({ battles }) formats.
 *  ✓  importJSON() now accepts a single battle object as well as arrays.
 *  ✓  getBySession(sessionId) added for direct lookup.
 *  ✓  Exposed addResult typedef for TypeScript / JSDoc consumers.
 */

import { STORAGE_KEYS } from './constants.js';

// ─── Storage Backends ─────────────────────────────────────────────────────────

class StorageBackend {
  constructor(storage) { this._s = storage; }

  get(key) {
    try {
      const raw = this._s.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  set(key, value) {
    try {
      this._s.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[battleStore] Storage quota exceeded for "${key}":`, e.message);
      return false;
    }
  }

  remove(key) {
    try { this._s.removeItem(key); return true; }
    catch { return false; }
  }

  sizeOf(key) {
    try {
      const raw = this._s.getItem(key);
      return raw ? raw.length * 2 : 0;
    } catch { return 0; }
  }
}

class MemoryBackend {
  constructor() { this._map = new Map(); }
  get(key)       { const v = this._map.get(key); return v !== undefined ? JSON.parse(JSON.stringify(v)) : null; }
  set(key, value){ this._map.set(key, JSON.parse(JSON.stringify(value))); return true; }
  remove(key)    { this._map.delete(key); return true; }
  sizeOf()       { return 0; }
}

function makeBackend(prefer = 'local') {
  if (prefer === 'session' && typeof sessionStorage !== 'undefined') {
    return new StorageBackend(sessionStorage);
  }
  if (prefer === 'local' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('__wt_test__', '1');
      localStorage.removeItem('__wt_test__');
      return new StorageBackend(localStorage);
    } catch { /* private browsing / blocked */ }
  }
  console.warn('[battleStore] Persistent storage unavailable — using in-memory store.');
  return new MemoryBackend();
}

// ─── BattleStore ─────────────────────────────────────────────────────────────

/**
 * @typedef {{ ok: true, id: string } | { ok: false, reason: 'duplicate'|'quota'|'invalid' }} AddResult
 */

class BattleStore {
  /**
   * @param {{ backend?: 'local'|'session'|'memory', maxBattles?: number }} opts
   */
  constructor(opts = {}) {
    this._backend    = makeBackend(opts.backend || 'local');
    this._maxBattles = opts.maxBattles || 2000;

    this._battles  = null;     // Battle[]  newest-first
    this._seenFps  = null;     // Set<string>  fingerprints
    this._seenSess = null;     // Set<string>  session IDs  ← NEW
  }

  // ── Private loaders ───────────────────────────────────────────────────────

  _loadBattles() {
    if (this._battles !== null) return;
    this._battles = this._backend.get(STORAGE_KEYS.BATTLES) || [];
  }

  _loadFps() {
    if (this._seenFps !== null) return;
    const arr = this._backend.get(STORAGE_KEYS.SEEN_FINGERPRINTS) || [];
    this._seenFps = new Set(arr);
  }

  _loadSessions() {
    if (this._seenSess !== null) return;
    const arr = this._backend.get(STORAGE_KEYS.SEEN_SESSIONS) || [];
    this._seenSess = new Set(arr);
  }

  /**
   * Self-healing: rebuild both indices from the actual stored battles if they
   * look out of sync (e.g. after a partial write or cross-device import).
   * Called lazily on first add() if the counts don't match.
   */
  _rebuildIndices() {
    this._loadBattles();
    this._seenFps  = new Set();
    this._seenSess = new Set();

    for (const b of this._battles) {
      if (b.fingerprint) this._seenFps.add(b.fingerprint);
      if (b.session)     this._seenSess.add(b.session);
    }

    this._backend.set(STORAGE_KEYS.SEEN_FINGERPRINTS, Array.from(this._seenFps));
    this._backend.set(STORAGE_KEYS.SEEN_SESSIONS,     Array.from(this._seenSess));
  }

  _indicesSynced() {
    // Heuristic: if stored battles > stored fps (e.g. old battles had no fp), rebuild.
    this._loadBattles();
    this._loadFps();
    this._loadSessions();
    // If fp count or session count is much smaller than battle count, something is off.
    const battleCount = this._battles.length;
    if (battleCount > 0 && (this._seenFps.size < battleCount * 0.5 || this._seenSess.size < battleCount * 0.5)) {
      return false;
    }
    return true;
  }

  _save() {
    const ok = this._backend.set(STORAGE_KEYS.BATTLES, this._battles);
    this._backend.set(STORAGE_KEYS.SEEN_FINGERPRINTS, Array.from(this._seenFps));
    this._backend.set(STORAGE_KEYS.SEEN_SESSIONS,     Array.from(this._seenSess));
    return ok;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Add a parsed battle to the store.
   *
   * Duplicate detection (v2.1.0) uses TWO independent checks:
   *  1. Fingerprint (content hash of stable fields) — matches across import modes
   *  2. Session ID — matches even when fingerprint is missing (old v1 battles)
   *
   * @param {Object} battle
   * @returns {AddResult}
   */
  add(battle) {
    if (!battle || typeof battle !== 'object' || !battle.id) {
      return { ok: false, reason: 'invalid' };
    }

    this._loadBattles();
    this._loadFps();
    this._loadSessions();

    // Rebuild indices if they look stale (self-healing)
    if (!this._indicesSynced()) {
      console.info('[battleStore] Indices out of sync — rebuilding from battles…');
      this._rebuildIndices();
    }

    // ── Check 1: Fingerprint ──────────────────────────────────────────────
    const fp = battle.fingerprint;
    if (fp && this._seenFps.has(fp)) {
      return { ok: false, reason: 'duplicate' };
    }

    // ── Check 2: Session ID ───────────────────────────────────────────────
    // This catches cases where the same battle was imported as JSON (pre-parsed,
    // same session ID) before this exact text was pasted, even if the fingerprint
    // was never stored in the index.
    const sess = battle.session;
    if (sess && sess.trim() && this._seenSess.has(sess)) {
      return { ok: false, reason: 'duplicate' };
    }

    // ── Insert ────────────────────────────────────────────────────────────
    this._battles.unshift(battle);
    if (fp)   this._seenFps.add(fp);
    if (sess) this._seenSess.add(sess);

    // Enforce max
    if (this._battles.length > this._maxBattles) {
      const removed = this._battles.splice(this._maxBattles);
      for (const b of removed) {
        if (b.fingerprint) this._seenFps.delete(b.fingerprint);
        if (b.session)     this._seenSess.delete(b.session);
      }
    }

    const saved = this._save();
    if (!saved) {
      // Roll back in-memory on quota failure
      this._battles.shift();
      if (fp)   this._seenFps.delete(fp);
      if (sess) this._seenSess.delete(sess);
      return { ok: false, reason: 'quota' };
    }

    return { ok: true, id: battle.id };
  }

  /**
   * Add multiple battles, returning a summary.
   * @param {Object[]} battleArray
   * @returns {{ added: number, duplicates: number, errors: number }}
   */
  addMany(battleArray) {
    const summary = { added: 0, duplicates: 0, errors: 0 };
    for (const b of battleArray || []) {
      const r = this.add(b);
      if (r.ok)                          summary.added++;
      else if (r.reason === 'duplicate') summary.duplicates++;
      else                               summary.errors++;
    }
    return summary;
  }

  /**
   * Return all stored battles (newest first).
   * @param {{ page?: number, pageSize?: number }} opts
   */
  getAll(opts = {}) {
    this._loadBattles();
    const { page = 0, pageSize = Infinity } = opts;
    if (!Number.isFinite(pageSize)) return [...this._battles];
    const start = page * pageSize;
    return this._battles.slice(start, start + pageSize);
  }

  count() {
    this._loadBattles();
    return this._battles.length;
  }

  getById(id) {
    this._loadBattles();
    return this._battles.find(b => b.id === id) || null;
  }

  /**
   * Look up a battle by its War Thunder session ID.
   * @param {string} sessionId
   * @returns {Object|null}
   */
  getBySession(sessionId) {
    this._loadBattles();
    return this._battles.find(b => b.session === sessionId) || null;
  }

  /**
   * Quick check: is a battle with this session ID already stored?
   * @param {string} sessionId
   * @returns {boolean}
   */
  hasSession(sessionId) {
    this._loadSessions();
    return this._seenSess.has(sessionId);
  }

  /**
   * Quick check: is a battle with this fingerprint already stored?
   * @param {string} fingerprint
   * @returns {boolean}
   */
  isDuplicate(fingerprint) {
    this._loadFps();
    return this._seenFps.has(fingerprint);
  }

  remove(id) {
    this._loadBattles();
    this._loadFps();
    this._loadSessions();
    const idx = this._battles.findIndex(b => b.id === id);
    if (idx === -1) return false;
    const [removed] = this._battles.splice(idx, 1);
    if (removed.fingerprint) this._seenFps.delete(removed.fingerprint);
    if (removed.session)     this._seenSess.delete(removed.session);
    this._save();
    return true;
  }

  clear() {
    this._battles  = [];
    this._seenFps  = new Set();
    this._seenSess = new Set();
    this._backend.remove(STORAGE_KEYS.BATTLES);
    this._backend.remove(STORAGE_KEYS.SEEN_FINGERPRINTS);
    this._backend.remove(STORAGE_KEYS.SEEN_SESSIONS);
  }

  /**
   * Force a full index rebuild from stored battles.
   * Call this after a bulk import that bypassed add() (e.g. raw localStorage write).
   */
  rebuildIndices() {
    this._rebuildIndices();
  }

  exportJSON() {
    this._loadBattles();
    return JSON.stringify({
      version:    2,
      exportedAt: new Date().toISOString(),
      battles:    this._battles,
    }, null, 2);
  }

  /**
   * Import battles from JSON string or parsed object.
   * Accepts:
   *  - v2 export: { version: 2, battles: [...] }
   *  - v1 export: bare array [...]
   *  - Single battle object: { id, ... }
   *
   * @param {string|Object} input
   * @returns {{ added: number, duplicates: number, errors: number, parseError?: string }}
   */
  importJSON(input) {
    let parsed;
    if (typeof input === 'string') {
      try { parsed = JSON.parse(input); }
      catch (e) { return { added: 0, duplicates: 0, errors: 0, parseError: e.message }; }
    } else {
      parsed = input;
    }

    // Single battle object
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.id) {
      return this.addMany([parsed]);
    }

    // Array or { battles: [...] }
    const battles = Array.isArray(parsed)
      ? parsed
      : (parsed?.battles || []);

    return this.addMany(battles);
  }

  filter(filters = {}) {
    this._loadBattles();
    return this._battles.filter(b => {
      if (filters.result      && b.result      !== filters.result)      return false;
      if (filters.missionType && b.missionType !== filters.missionType) return false;
      if (filters.vehicle) {
        const v = filters.vehicle.toLowerCase();
        if (!(b.vehicles || []).some(vv => vv.displayName?.toLowerCase().includes(v))) return false;
      }
      const dateField = b.parsedAt || b.timestamp;
      if (filters.fromDate && dateField < filters.fromDate) return false;
      if (filters.toDate   && dateField > filters.toDate)   return false;
      return true;
    });
  }

  storageSizeKB() {
    return Math.round(this._backend.sizeOf(STORAGE_KEYS.BATTLES) / 1024);
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const battleStore = new BattleStore({ backend: 'local', maxBattles: 2000 });
export { BattleStore };