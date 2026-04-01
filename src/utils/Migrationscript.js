/**
 * migrationScript.js
 *
 * Converts old War Thunder battle data formats to the current v2.1.0 schema,
 * and repairs common data corruption issues (the reward-string parse bug,
 * missing fields, wrong field names, etc.).
 *
 * RUN THIS ONCE on your existing battle archive to bring everything up to date.
 *
 * ─── What it fixes ───────────────────────────────────────────────────────────
 *
 *  v1 → v2 schema rename (BattledataDate_7_12_2025 style):
 *    timestamp             → parsedAt
 *    detailedKills         → kills       (+ time "MM:SS" → timeSec seconds)
 *    detailedAssists       → assists_detail
 *    detailedSevereDamage  → severeDamage_detail
 *    detailedCriticalDamage→ criticalDamage_detail
 *    detailedDamage        → damage_detail
 *    detailedAwards        → awards_detail
 *    detailedActivityTime  → activityTime_detail
 *    detailedTimePlayed    → timePlayed_detail (+ time "MM:SS" → timeSec)
 *    detailedSkillBonus    → skillBonus_detail
 *
 *  Missing fields → sensible defaults
 *  Missing fingerprint → regenerated from stable fields
 *  Missing session → generated synthetic fallback (won't block dedup)
 *  version field → set to current SCHEMA_VERSION
 *
 *  SL/RP corruption repair:
 *    Values that are astronomically large (>= 10_000_000) in detail arrays
 *    are almost certainly the result of the old parseIntSafe concat bug.
 *    We zero them out and flag the record as repaired.
 *    Section header totals (e.g. assistsSL) are trusted as-is since they
 *    came from clean regex matches.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *  Browser (paste into console or call from a settings page):
 *
 *    import { migrateStore } from './migrationScript.js';
 *    import { battleStore }  from './battleStore.js';
 *
 *    const report = migrateStore(battleStore);
 *    console.log(report);
 *
 *  Node.js (for bulk migration of JSON files):
 *
 *    const { migrateBattleArray } = await import('./migrationScript.js');
 *    const old = JSON.parse(fs.readFileSync('archive.json', 'utf8'));
 *    const { battles, report } = migrateBattleArray(old);
 *    fs.writeFileSync('archive_migrated.json', JSON.stringify(battles, null, 2));
 */

import { SCHEMA_VERSION } from './constants.js';
import { buildFingerprint } from './battleParser.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_VERSION = SCHEMA_VERSION; // '2.1.0'

/** Detect the schema version of a battle object. */
export function detectVersion(battle) {
  if (!battle || typeof battle !== 'object') return 'unknown';
  if (battle.version) return battle.version;
  // Heuristic: v1 battles have detailedKills instead of kills
  if (Array.isArray(battle.detailedKills)) return '1.0.0';
  // v2.0.0 battles were produced by the parser before SCHEMA_VERSION was added
  if (Array.isArray(battle.kills) && !battle.parsedFrom) return '2.0.0';
  return 'unknown';
}

/** Convert "MM:SS" or "H:MM:SS" strings → integer seconds. */
function timeStrToSec(str) {
  if (typeof str === 'number') return str; // already seconds
  if (!str) return 0;
  const parts = String(str).split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/** Return a safe integer, treating astronomically large values as corrupt. */
const MAX_SANE_REWARD = 10_000_000; // 10 M SL/RP per event is impossible
function sanitizeReward(v) {
  const n = typeof v === 'number' ? v : parseInt(String(v || '0').replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n >= MAX_SANE_REWARD) return 0; // mark as corrupt → zero
  return n;
}

/** Remap a single combat event from v1 shape → v2 shape. */
function migrateCombatEvent(ev, kind) {
  if (!ev || typeof ev !== 'object') return null;
  return {
    type:          ev.type || kind || undefined,
    timeSec:       timeStrToSec(ev.time || ev.timeSec || 0),
    vehicle:       ev.vehicle || '',
    weapon:        ev.weapon  || '',
    target:        ev.target  || '',
    missionPoints: sanitizeReward(ev.missionPoints || 0),
    sl:            sanitizeReward(ev.sl || 0),
    rp:            sanitizeReward(ev.rp || 0),
    ...(ev.byAnotherPlayer ? { byAnotherPlayer: true } : {}),
  };
}

function migrateActivityEvent(ev) {
  if (!ev || typeof ev !== 'object') return null;
  return {
    vehicle: ev.vehicle || '',
    sl:      sanitizeReward(ev.sl || 0),
    rp:      sanitizeReward(ev.rp || 0),
  };
}

function migrateTimePlayedEvent(ev) {
  if (!ev || typeof ev !== 'object') return null;
  return {
    vehicle:    ev.vehicle || '',
    percentage: ev.percentage || 0,
    timeSec:    timeStrToSec(ev.time || ev.timeSec || 0),
    rp:         sanitizeReward(ev.rp || 0),
  };
}

function migrateAwardEvent(ev) {
  if (!ev || typeof ev !== 'object') return null;
  return {
    timeSec: timeStrToSec(ev.time || ev.timeSec || 0),
    award:   ev.award || '',
    sl:      sanitizeReward(ev.sl || 0),
    rp:      sanitizeReward(ev.rp || 0),
  };
}

function migrateSkillBonusEvent(ev) {
  if (!ev || typeof ev !== 'object') return null;
  // Old format sometimes has bonusType merged with vehicle name
  return {
    vehicle:   ev.vehicle   || '',
    bonusType: ev.bonusType || ev.type || '',
    rp:        sanitizeReward(ev.rp || 0),
  };
}

// ─── Single Battle Migration ──────────────────────────────────────────────────

/**
 * Migrate / repair a single battle object to the current schema.
 *
 * Safe to call on battles that are already at the current version —
 * the function will still sanitize corrupted reward values.
 *
 * @param {Object} battle  Raw battle object (any schema version)
 * @returns {{ battle: Object, changed: boolean, repairs: string[] }}
 */
export function migrateBattle(battle) {
  if (!battle || typeof battle !== 'object') {
    return { battle: null, changed: false, repairs: ['null input'] };
  }

  const repairs = [];
  const b = { ...battle }; // shallow clone — we mutate below

  const version = detectVersion(b);

  // ── parsedAt / timestamp ──────────────────────────────────────────────────
  if (!b.parsedAt && b.timestamp) {
    b.parsedAt = b.timestamp;
    repairs.push('renamed timestamp → parsedAt');
  } else if (!b.parsedAt) {
    b.parsedAt = new Date().toISOString();
    repairs.push('added missing parsedAt (now)');
  }

  // ── version ───────────────────────────────────────────────────────────────
  if (b.version !== CURRENT_VERSION) {
    repairs.push(`version ${b.version || 'missing'} → ${CURRENT_VERSION}`);
    b.version = CURRENT_VERSION;
  }

  // ── kills (v1: detailedKills) ─────────────────────────────────────────────
  if (Array.isArray(b.detailedKills) && !Array.isArray(b.kills)) {
    b.kills = b.detailedKills
      .map(ev => migrateCombatEvent(ev, ev.type || 'ground'))
      .filter(Boolean);
    delete b.detailedKills;
    repairs.push('renamed detailedKills → kills, converted time → timeSec');
  } else if (!Array.isArray(b.kills)) {
    b.kills = [];
    repairs.push('added missing kills []');
  }

  // ── assists_detail (v1: detailedAssists) ─────────────────────────────────
  if (Array.isArray(b.detailedAssists) && !Array.isArray(b.assists_detail)) {
    b.assists_detail = b.detailedAssists.map(ev => migrateCombatEvent(ev)).filter(Boolean);
    delete b.detailedAssists;
    repairs.push('renamed detailedAssists → assists_detail');
  } else if (!Array.isArray(b.assists_detail)) {
    b.assists_detail = [];
  }

  // ── severeDamage_detail ───────────────────────────────────────────────────
  if (Array.isArray(b.detailedSevereDamage) && !Array.isArray(b.severeDamage_detail)) {
    b.severeDamage_detail = b.detailedSevereDamage.map(ev => migrateCombatEvent(ev)).filter(Boolean);
    delete b.detailedSevereDamage;
    repairs.push('renamed detailedSevereDamage → severeDamage_detail');
  } else if (!Array.isArray(b.severeDamage_detail)) {
    b.severeDamage_detail = [];
  }

  // ── criticalDamage_detail ─────────────────────────────────────────────────
  if (Array.isArray(b.detailedCriticalDamage) && !Array.isArray(b.criticalDamage_detail)) {
    b.criticalDamage_detail = b.detailedCriticalDamage.map(ev => migrateCombatEvent(ev)).filter(Boolean);
    delete b.detailedCriticalDamage;
    repairs.push('renamed detailedCriticalDamage → criticalDamage_detail');
  } else if (!Array.isArray(b.criticalDamage_detail)) {
    b.criticalDamage_detail = [];
  }

  // ── damage_detail ─────────────────────────────────────────────────────────
  if (Array.isArray(b.detailedDamage) && !Array.isArray(b.damage_detail)) {
    b.damage_detail = b.detailedDamage.map(ev => migrateCombatEvent(ev)).filter(Boolean);
    delete b.detailedDamage;
    repairs.push('renamed detailedDamage → damage_detail');
  } else if (!Array.isArray(b.damage_detail)) {
    b.damage_detail = [];
  }

  // ── captures_detail ───────────────────────────────────────────────────────
  if (!Array.isArray(b.captures_detail)) {
    b.captures_detail = [];
    repairs.push('added missing captures_detail []');
  } else {
    // Sanitise existing capture rewards (may be corrupted)
    b.captures_detail = b.captures_detail.map(ev => ({
      ...ev,
      sl: sanitizeReward(ev.sl),
      rp: sanitizeReward(ev.rp),
    }));
  }

  // ── awards_detail ─────────────────────────────────────────────────────────
  if (Array.isArray(b.detailedAwards) && !Array.isArray(b.awards_detail)) {
    b.awards_detail = b.detailedAwards.map(migrateAwardEvent).filter(Boolean);
    delete b.detailedAwards;
    repairs.push('renamed detailedAwards → awards_detail');
  } else if (!Array.isArray(b.awards_detail)) {
    b.awards_detail = [];
  }

  // ── activityTime_detail ───────────────────────────────────────────────────
  if (Array.isArray(b.detailedActivityTime) && !Array.isArray(b.activityTime_detail)) {
    b.activityTime_detail = b.detailedActivityTime.map(migrateActivityEvent).filter(Boolean);
    delete b.detailedActivityTime;
    repairs.push('renamed detailedActivityTime → activityTime_detail');
  } else if (!Array.isArray(b.activityTime_detail)) {
    b.activityTime_detail = [];
  }

  // ── timePlayed_detail ─────────────────────────────────────────────────────
  if (Array.isArray(b.detailedTimePlayed) && !Array.isArray(b.timePlayed_detail)) {
    b.timePlayed_detail = b.detailedTimePlayed.map(migrateTimePlayedEvent).filter(Boolean);
    delete b.detailedTimePlayed;
    repairs.push('renamed detailedTimePlayed → timePlayed_detail, converted time → timeSec');
  } else if (!Array.isArray(b.timePlayed_detail)) {
    b.timePlayed_detail = [];
  }

  // ── skillBonus_detail ─────────────────────────────────────────────────────
  if (Array.isArray(b.detailedSkillBonus) && !Array.isArray(b.skillBonus_detail)) {
    b.skillBonus_detail = b.detailedSkillBonus.map(migrateSkillBonusEvent).filter(Boolean);
    delete b.detailedSkillBonus;
    repairs.push('renamed detailedSkillBonus → skillBonus_detail');
  } else if (!Array.isArray(b.skillBonus_detail)) {
    b.skillBonus_detail = [];
  }

  // ── Ensure top-level arrays ───────────────────────────────────────────────
  if (!Array.isArray(b.researchedUnits))     b.researchedUnits     = [];
  if (!Array.isArray(b.researchingProgress)) b.researchingProgress = [];
  if (!Array.isArray(b.damagedVehicles))     b.damagedVehicles     = [];
  if (!Array.isArray(b.vehicles))            b.vehicles            = [];

  // ── Sanitize detail event rewards (the big parse bug) ────────────────────
  // Any event where sl or rp is >= MAX_SANE_REWARD is certainly corrupted.
  const sanitizeArray = (arr, label) => {
    if (!Array.isArray(arr)) return arr;
    let fixed = 0;
    const out = arr.map(ev => {
      if (!ev) return ev;
      const sl = sanitizeReward(ev.sl);
      const rp = sanitizeReward(ev.rp);
      if (sl !== ev.sl || rp !== ev.rp) fixed++;
      return { ...ev, sl, rp };
    });
    if (fixed > 0) repairs.push(`sanitized ${fixed} corrupted reward(s) in ${label}`);
    return out;
  };

  b.kills                 = sanitizeArray(b.kills,                 'kills');
  b.assists_detail        = sanitizeArray(b.assists_detail,        'assists_detail');
  b.severeDamage_detail   = sanitizeArray(b.severeDamage_detail,   'severeDamage_detail');
  b.criticalDamage_detail = sanitizeArray(b.criticalDamage_detail, 'criticalDamage_detail');
  b.damage_detail         = sanitizeArray(b.damage_detail,         'damage_detail');
  b.captures_detail       = sanitizeArray(b.captures_detail,       'captures_detail');

  // ── Numeric field defaults (for missing v1 fields) ────────────────────────
  const numericDefaults = {
    killsAircraft: 0, killsAircraftSL: 0, killsAircraftRP: 0,
    killsGround:   0, killsGroundSL:   0, killsGroundRP:   0,
    assists:       0, assistsSL:       0, assistsRP:       0,
    severeDamage:  0, severeDamageSL:  0, severeDamageRP:  0,
    criticalDamage:0, criticalDamageSL:0, criticalDamageRP:0,
    damage:        0, damageSL:        0, damageRP:        0,
    captures:      0, capturesSL:      0, capturesRP:      0,
    awardsCount:   0, awardsSL:        0, awardsRP:        0,
    activityTimeSL:0, activityTimeRP:  0,
    timePlayedRP:  0, totalTimeSec:    0,
    skillBonusRP:  0, activity:        0,
    rewardSL:      0, earnedSL:        0, earnedCRP:       0,
    autoRepairCost:0, autoAmmoCrewCost:0,
    totalSL:       0, totalCRP:        0, totalRP:         0,
  };
  for (const [k, def] of Object.entries(numericDefaults)) {
    if (b[k] === undefined || b[k] === null) {
      b[k] = def;
      repairs.push(`added missing field: ${k}`);
    }
  }

  // ── String field defaults ─────────────────────────────────────────────────
  if (!b.result)      b.result      = 'Unknown';
  if (!b.missionType) b.missionType = 'Unknown';
  if (!b.missionName) b.missionName = 'Unknown';
  if (!b.session)     b.session     = '';

  // ── parsedFrom marker (helps battleStore dedup) ───────────────────────────
  if (!b.parsedFrom) b.parsedFrom = 'imported';

  // ── Fingerprint ───────────────────────────────────────────────────────────
  if (!b.fingerprint || b.fingerprint === '') {
    try {
      b.fingerprint = buildFingerprint(b);
      repairs.push('generated missing fingerprint');
    } catch {
      b.fingerprint = `LEGACY_${b.session || b.id || Date.now()}`;
      repairs.push('generated fallback fingerprint (no session available)');
    }
  }

  const changed = repairs.length > 0;
  return { battle: b, changed, repairs };
}

// ─── Batch Migration ──────────────────────────────────────────────────────────

/**
 * Migrate an array of battles.
 *
 * @param {Object[]} battles
 * @returns {{
 *   battles: Object[],
 *   report: {
 *     total:    number,
 *     changed:  number,
 *     unchanged:number,
 *     perBattle: Array<{ id: string, version: string, repairs: string[] }>
 *   }
 * }}
 */
export function migrateBattleArray(battles) {
  if (!Array.isArray(battles)) {
    return { battles: [], report: { total: 0, changed: 0, unchanged: 0, perBattle: [] } };
  }

  const report = { total: battles.length, changed: 0, unchanged: 0, perBattle: [] };
  const migrated = [];

  for (const raw of battles) {
    const { battle, changed, repairs } = migrateBattle(raw);
    if (!battle) {
      report.perBattle.push({ id: raw?.id || '?', version: 'invalid', repairs: ['skipped — null/invalid'] });
      continue;
    }
    migrated.push(battle);
    if (changed) {
      report.changed++;
      report.perBattle.push({ id: battle.id, version: detectVersion(raw), repairs });
    } else {
      report.unchanged++;
    }
  }

  return { battles: migrated, report };
}

// ─── In-Place Store Migration ─────────────────────────────────────────────────

/**
 * Migrate all battles currently in a BattleStore in-place.
 *
 * @param {import('./battleStore.js').BattleStore} store
 * @returns {{
 *   total:    number,
 *   changed:  number,
 *   unchanged:number,
 *   perBattle: Array<{ id: string, version: string, repairs: string[] }>
 * }}
 */
export function migrateStore(store) {
  const battles = store.getAll();
  const { battles: migrated, report } = migrateBattleArray(battles);

  if (report.changed > 0) {
    // Write back the full migrated array, bypassing dedup (these are already stored).
    // We do this by reaching into the private state via the clear+addMany pattern.
    store.clear();
    store.addMany(migrated);
    console.info(`[migration] Done: ${report.changed}/${report.total} battles updated.`);
  } else {
    console.info('[migration] All battles already at current schema — nothing to do.');
  }

  return report;
}

// ─── Validate Individual Battle ───────────────────────────────────────────────

/**
 * Quick sanity check: returns a list of problems found in a battle object.
 * Empty array = looks healthy.
 *
 * @param {Object} battle
 * @returns {string[]}  Problem descriptions
 */
export function validateBattle(battle) {
  const problems = [];
  if (!battle || typeof battle !== 'object') return ['not an object'];
  if (!battle.id)          problems.push('missing id');
  if (!battle.parsedAt)    problems.push('missing parsedAt');
  if (!battle.session)     problems.push('missing session (dedup will be weaker)');
  if (!battle.fingerprint) problems.push('missing fingerprint');
  if (!battle.missionName) problems.push('missing missionName');

  const MAX = MAX_SANE_REWARD;

  // Check for corrupted reward values in detail arrays
  const checkArray = (arr, name) => {
    for (const ev of arr || []) {
      if ((ev.sl || 0) >= MAX) problems.push(`corrupted sl in ${name}: ${ev.sl}`);
      if ((ev.rp || 0) >= MAX) problems.push(`corrupted rp in ${name}: ${ev.rp}`);
    }
  };

  checkArray(battle.kills,                 'kills');
  checkArray(battle.assists_detail,        'assists_detail');
  checkArray(battle.severeDamage_detail,   'severeDamage_detail');
  checkArray(battle.criticalDamage_detail, 'criticalDamage_detail');
  checkArray(battle.damage_detail,         'damage_detail');
  checkArray(battle.captures_detail,       'captures_detail');

  return problems;
}