/**
 * battleParser.js
 *
 * Transforms raw War Thunder battle log text into a structured JSON battle object.
 *
 * @version 2.1.0
 *
 * CHANGELOG v2.1.0:
 *  ✓  CRITICAL FIX: extractRewardValue() — reward strings like "1715 + (PA)859 = 2574 SL"
 *     were being parsed by stripping all non-digits → "171585920574" (garbage).
 *     Now correctly extracts the FINAL value after the last "=" sign.
 *  ✓  Fix applied to: parseCombatLine (sl/rp), parseCaptureLine (sl/rp),
 *     parseActivityTimeLine, parseTimePlayedLine.
 *  ✓  parseActivityTimeLine: rewritten with smarter regex to handle expanded
 *     reward strings in per-vehicle activity sections.
 *  ✓  parseTimePlayedLine: same fix.
 *  ✓  Added SCHEMA_VERSION export for migration tooling.
 *  ✓  parseBattleLog now attaches a parsedFrom: 'text' marker for dedup safety.
 */

import {
  SECTION_ALIASES,
  SECTION_HEADER_RE,
  INVALID_VEHICLE_TOKENS,
  TIME_RE,
  PERCENT_RE,
  DIGIT_RE,
  BattleResult,
  SCHEMA_VERSION,
} from './constants.js';
import { lookupVehicle } from './vehicleRegistry.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const DEBUG_MODE = false;
const BLANK_RE = /^\s*$/;

const STRIP_PREFIXES = [
  /^shot\s+/i,
  /^\(by another player\)\s*/i,
  /^by another player\s*/i,
  /^-\s*/,
  /^:+\s*/,
  /^with\s+/i,
];

// ─── Low-Level Text Utilities ─────────────────────────────────────────────────

function normalizeText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/[ \u00A0]+$/gm, '');
}

function collapse(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function isBlank(line) {
  return !line || BLANK_RE.test(line);
}

function parseIntSafe(v, fallback = 0) {
  if (typeof v === 'number') return Math.floor(v);
  const cleaned = String(v || '').replace(/[^\d.-]/g, '');
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseFloatSafe(v, fallback = 0) {
  if (typeof v === 'number') return v;
  const cleaned = String(v || '').replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function timeToSeconds(str) {
  if (!str) return 0;
  const parts = String(str).trim().split(':').map(val => parseInt(val, 10));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function splitColumns(line) {
  if (!line) return [];
  return String(line)
    .trim()
    .split(/\s{2,}/)
    .map(s => s.trim())
    .filter(Boolean);
}

function isSectionHeader(line) {
  return SECTION_HEADER_RE.test(String(line || '').trim());
}

function matchFirst(text, re) {
  if (!text) return null;
  return String(text).match(re);
}

// ─── CRITICAL FIX: Reward Value Extractor ─────────────────────────────────────

/**
 * Extracts the FINAL total value from a War Thunder reward column string.
 *
 * War Thunder logs include the full breakdown in detail lines:
 *   "2574 SL"                                               → 2574
 *   "1715 + (PA)859 = 2574 SL"                             → 2574
 *   "52 + (PA)104 + (Booster)8 + (Talismans)52 = 216 RP"  → 216
 *   "870 + (PA)435 = 1305 SL"                              → 1305
 *
 * The old approach (parseIntSafe on the full string) stripped ALL non-digits,
 * concatenating every number in the expression and producing values like
 * 17158592574 instead of 2574.  This function fixes that.
 *
 * @param {string} colStr  Raw column string from the log
 * @returns {number}       The final/total value
 */
function extractRewardValue(colStr) {
  if (!colStr) return 0;
  const s = String(colStr).trim();

  // Pattern 1: value after the last "=" sign, optionally followed by currency label
  // Handles: "1715 + (PA)859 = 2574 SL"  →  2574
  const eqMatch = s.match(/=\s*([\d,\s]+)\s*(?:SL|RP|CRP)?\s*$/i);
  if (eqMatch) return parseIntSafe(eqMatch[1]);

  // Pattern 2: simple "NNN [SL|RP|CRP]" with no breakdown
  // Handles: "2574 SL"  →  2574
  const simpleMatch = s.match(/^([\d,]+)\s*(?:SL|RP|CRP)?/i);
  if (simpleMatch) return parseIntSafe(simpleMatch[1]);

  // Final fallback: grab the last standalone integer in the string
  const allNums = s.match(/\d+/g);
  if (allNums) return parseInt(allNums[allNums.length - 1], 10) || 0;

  return 0;
}

// ─── Vehicle & Weapon Normalization ───────────────────────────────────────────

function cleanVehicleName(raw) {
  let name = collapse(raw);
  for (const re of STRIP_PREFIXES) name = name.replace(re, '');
  return name.trim();
}

function isValidVehicleName(name) {
  const clean = cleanVehicleName(name);
  if (!clean || clean.length < 2) return false;
  const lower = clean.toLowerCase();
  if (INVALID_VEHICLE_TOKENS.has(lower)) return false;
  if (TIME_RE.test(clean)) return false;
  if (PERCENT_RE.test(clean)) return false;
  if (DIGIT_RE.test(clean)) return false;
  const forbiddenKeywords = [/mission points/i, /\bSL\b/i, /\bRP\b/i, /activity/i];
  if (forbiddenKeywords.some(re => re.test(clean))) return false;
  return true;
}

function cleanWeapon(raw) {
  if (!raw) return '';
  return collapse(raw).replace(/^shot\s*/i, 'shot ').trim();
}

function cleanTarget(raw) {
  if (!raw) return '';
  return collapse(raw)
    .replace(/^shot\s+/i, '')
    .replace(/^by another player\s*$/i, '')
    .trim();
}

// ─── Section Management ───────────────────────────────────────────────────────

function findSection(lines, aliases, startFrom = 0) {
  const targets = Array.isArray(aliases) ? aliases : [aliases];
  for (let i = Math.max(0, startFrom); i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (targets.some(alias => currentLine.includes(alias))) {
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        if (isSectionHeader(lines[j])) { end = j; break; }
      }
      return { headingIndex: i, headingLine: lines[i], bodyLines: lines.slice(i + 1, end) };
    }
  }
  return { headingIndex: -1, headingLine: '', bodyLines: [] };
}

// ─── Section Header Parsing ───────────────────────────────────────────────────

function parseSectionHeader(line) {
  const L = collapse(line);
  const result = { count: 0, sl: 0, rp: 0, totalTime: 0 };
  let m;

  const standardPattern = /^(.+?)\s+(\d+)\s+(\d+)\s+SL\s+(\d+)\s+RP/i;
  m = L.match(standardPattern);
  if (m) {
    result.count = parseIntSafe(m[2]);
    result.sl    = parseIntSafe(m[3]);
    result.rp    = parseIntSafe(m[4]);
    return result;
  }

  if (L.includes('Awards')) {
    m = L.match(/Awards\s+(\d+)\s+(\d+)\s+SL(?:\s+(\d+)\s+RP)?/i);
    if (m) return { count: parseIntSafe(m[1]), sl: parseIntSafe(m[2]), rp: m[3] ? parseIntSafe(m[3]) : 0 };
  }

  if (L.includes('Activity Time')) {
    m = L.match(/Activity Time\s+(\d+)\s+SL\s+(\d+)\s+RP/i);
    if (m) return { count: 0, sl: parseIntSafe(m[1]), rp: parseIntSafe(m[2]) };
  }

  if (L.includes('Time Played')) {
    m = L.match(/Time Played\s+(\d+:\d+)\s+(\d+)\s+RP/i);
    if (m) return { count: 0, sl: 0, rp: parseIntSafe(m[2]), totalTime: timeToSeconds(m[1]) };
  }

  if (L.includes('Skill Bonus')) {
    m = L.match(/Skill Bonus\s+(\d+)\s+RP/i);
    if (m) return { count: 0, sl: 0, rp: parseIntSafe(m[1]) };
  }

  return result;
}

// ─── Detail Line Parsers ──────────────────────────────────────────────────────

/**
 * Parses individual combat event lines (kills, damage, assists, captures).
 *
 * FIXED v2.1.0: sl and rp now extracted via extractRewardValue() instead of
 * parseIntSafe() to handle the "X + (PA)Y = Z SL" expanded reward format.
 */
function parseCombatLine(line, kind) {
  const cols = splitColumns(line);
  if (cols.length < 2) return null;

  const time = cols[0];
  if (!TIME_RE.test(time)) return null;
  const timeSec = timeToSeconds(time);

  // ── Capture lines ──────────────────────────────────────────────────────────
  if (kind === 'capture') {
    const pctIdx = cols.findIndex(c => PERCENT_RE.test(c));
    const mptIdx = cols.findIndex(c => /mission points/i.test(c));
    if (pctIdx === -1 || mptIdx === -1) return null;

    const vehicle = cleanVehicleName(cols[1]);
    if (!isValidVehicleName(vehicle)) return null;

    return {
      timeSec,
      vehicle,
      capturePercent: parseIntSafe(cols[pctIdx]),
      missionPoints:  parseIntSafe(cols[mptIdx]),
      sl: extractRewardValue(cols[mptIdx + 1] || '0'), // FIXED
      rp: extractRewardValue(cols[mptIdx + 2] || '0'), // FIXED
    };
  }

  // ── Standard combat events (kills, assists, damage) ────────────────────────
  const mptIdx = cols.findIndex(c => /mission points/i.test(c));
  const bypIdx = cols.findIndex(c => /by another player/i.test(c));

  if (mptIdx !== -1) {
    const vehicle = cleanVehicleName(cols[1] || '');
    if (!isValidVehicleName(vehicle)) return null;

    const payload = cols.slice(2, mptIdx);
    const tail    = cols.slice(mptIdx);

    let weapon = '';
    let target = '';

    if (payload.length >= 2) {
      weapon = cleanWeapon(payload.slice(0, -1).join(' '));
      target = cleanTarget(payload[payload.length - 1]);
    } else if (payload.length === 1) {
      weapon = cleanWeapon(payload[0]);
    }

    return {
      timeSec,
      vehicle,
      weapon,
      target: cleanTarget(target),
      missionPoints: parseIntSafe(tail[0] || '0'),
      sl: extractRewardValue(tail[1] || '0'), // FIXED
      rp: extractRewardValue(tail[2] || '0'), // FIXED
    };
  }

  if (bypIdx !== -1) {
    const vehicle = cleanVehicleName(cols[1] || '');
    if (!isValidVehicleName(vehicle)) return null;
    return {
      timeSec,
      vehicle,
      weapon:          cleanWeapon(cols[2] || ''),
      target:          cleanTarget(cols[3] || ''),
      byAnotherPlayer: true,
      sl: 0,
      rp: 0,
    };
  }

  return null;
}

/**
 * Parses Award lines.
 * Example: "10:35    Adamant    300 + (PA)150 = 450 SL"
 */
function parseAwardLine(line) {
  const L = collapse(line);
  // Lazy-match award name, then grab the LAST number before "SL" (after "=")
  // Works for both "300 SL" and "300 + (PA)150 = 450 SL" formats.
  const m = L.match(/^(\d+:\d+)\s+(.+?)\s+(?:=\s*)?(\d[\d,]*)\s+SL(?:\s+(?:=\s*)?(\d[\d,]*)\s+RP)?$/i);
  if (!m) return null;

  // If the award name captured part of the breakdown, trim from last separator
  let awardName = m[2].replace(/\s+[\d,]+\s*\+[^=]+$/, '').trim(); // strip inline breakdown
  awardName = awardName.replace(/\s*=\s*$/, '').trim();

  return {
    timeSec: timeToSeconds(m[1]),
    award:   awardName,
    sl:      parseIntSafe(m[3]),
    rp:      m[4] ? parseIntSafe(m[4]) : 0,
  };
}

/**
 * Parses vehicle-specific Activity Time lines.
 *
 * FIXED v2.1.0: Previous regex failed on expanded reward strings like
 * "ADATS    1100 + (PA)1100 = 2200 SL    71 + (PA)71 + (Booster)8 = 150 RP"
 *
 * Now uses extractRewardValue() on each segment instead of a rigid regex.
 */
function parseActivityTimeLine(line) {
  if (/^Time Played/i.test(line.trim())) return null;
  const cols = splitColumns(line);
  if (cols.length < 2) return null;

  // First column is always the vehicle name
  const vehicle = cleanVehicleName(cols[0]);
  if (!isValidVehicleName(vehicle)) return null;

  // Find the SL column (contains "SL") and RP column (contains "RP")
  let sl = 0, rp = 0;
  for (const col of cols.slice(1)) {
    if (/SL/i.test(col))  sl = extractRewardValue(col); // FIXED
    if (/\bRP\b/i.test(col)) rp = extractRewardValue(col); // FIXED
  }

  if (sl === 0 && rp === 0) return null; // probably a header or junk line

  return { vehicle, sl, rp };
}

/**
 * Parses vehicle-specific Time Played lines.
 *
 * FIXED v2.1.0: Same expanded-reward-string fix as parseActivityTimeLine.
 * Example: "ADATS    58%    4:44    585 + (PA)585 + (Booster)59 = 1229 RP"
 */
function parseTimePlayedLine(line) {
  const cols = splitColumns(line);
  if (cols.length < 3) return null;

  const vehicle = cleanVehicleName(cols[0]);
  if (!isValidVehicleName(vehicle)) return null;

  // Find percentage column
  const pctCol = cols.find(c => PERCENT_RE.test(c));
  if (!pctCol) return null;
  const percentage = parseIntSafe(pctCol);

  // Find time column (MM:SS)
  const timeCol = cols.find(c => /^\d+:\d{2}$/.test(c.trim()));
  const timeSec = timeCol ? timeToSeconds(timeCol) : 0;

  // Find RP column and extract FINAL value using extractRewardValue
  let rp = 0;
  for (const col of cols) {
    if (/\bRP\b/i.test(col)) { rp = extractRewardValue(col); break; } // FIXED
  }

  return { vehicle, percentage, timeSec, rp };
}

/**
 * Parses Skill Bonus lines.
 */
function parseSkillBonusLine(line) {
  const cols = splitColumns(line);
  if (cols.length < 3) return null;
  const vehicle = cleanVehicleName(cols[0]);
  if (!isValidVehicleName(vehicle)) return null;
  const bonusType = collapse(cols[1]);
  const rp = parseIntSafe(cols[cols.length - 1]);
  return { vehicle, bonusType, rp };
}

/**
 * Parses RP research progress lines.
 */
function parseResearchProgressLine(line) {
  const L = collapse(line);
  const m = L.match(/^(.+?)\s*-\s*(.+?):\s*(\d+)\s+RP$/i);
  if (!m) return null;
  return {
    unit: cleanVehicleName(m[1]),
    item: cleanTarget(m[2]),
    rp:   parseIntSafe(m[3]),
  };
}

/**
 * Parses fully researched unit lines.
 */
function parseResearchedUnitLine(line) {
  const L = collapse(line);
  const m = L.match(/^(.+?):\s*(\d+)\s+RP$/i);
  if (!m) return null;
  return {
    unit: cleanVehicleName(m[1]),
    rp:   parseIntSafe(m[2]),
  };
}

// ─── High-Level Extraction ────────────────────────────────────────────────────

function parseMissionHeader(text, battle) {
  const m = text.match(/(Defeat|Victory) in the \[(.+?)\]\s+(.+?)\s+mission!/i);
  if (m) {
    battle.result      = m[1];
    battle.missionType = m[2];
    battle.missionName = m[3];
  }
}

function parseMiscFields(text, battle) {
  let m;

  m = matchFirst(text, /Earned:\s+(\d[\d,]*)\s+SL,\s+(\d[\d,]*)\s+CRP/i);
  if (m) { battle.earnedSL = parseIntSafe(m[1]); battle.earnedCRP = parseIntSafe(m[2]); }

  m = matchFirst(text, /Activity:\s+(\d+)%/i);
  if (m) battle.activity = parseIntSafe(m[1]);

  m = matchFirst(text, /Damaged Vehicles:\s+(.+)/i);
  if (m) {
    battle.damagedVehicles = m[1].split(',').map(v => cleanVehicleName(v)).filter(Boolean);
  }

  m = matchFirst(text, /Automatic repair of all vehicles:\s+(-?\d[\d,]*)\s+SL/i);
  if (m) battle.autoRepairCost = parseIntSafe(m[1]);

  m = matchFirst(text, /Automatic purchasing of ammo and "Crew Replenishment":\s+(-?\d[\d,]*)\s+SL/i);
  if (m) battle.autoAmmoCrewCost = parseIntSafe(m[1]);

  m = matchFirst(text, /Session:\s+(.+)/i);
  if (m) battle.session = m[1].trim();

  m = matchFirst(text, /Total:\s+(\d[\d,]*)\s+SL,\s+(\d[\d,]*)\s+CRP,\s+(\d[\d,]*)\s+RP/i);
  if (m) {
    battle.totalSL  = parseIntSafe(m[1]);
    battle.totalCRP = parseIntSafe(m[2]);
    battle.totalRP  = parseIntSafe(m[3]);
  }

  m = matchFirst(text, /Reward for participating in the mission\s+(\d[\d,]*)\s+SL/i) ||
      matchFirst(text, /Reward for winning\s+(\d[\d,]*)\s+SL/i);
  if (m) battle.rewardSL = parseIntSafe(m[1]);
}

function parseSections(text, battle) {
  const lines = text.split('\n');

  const S = {
    aircraftKills:       findSection(lines, SECTION_ALIASES.aircraftKills),
    groundKills:         findSection(lines, SECTION_ALIASES.groundKills),
    assists:             findSection(lines, SECTION_ALIASES.assists),
    severeDamage:        findSection(lines, SECTION_ALIASES.severeDamage),
    criticalDamage:      findSection(lines, SECTION_ALIASES.criticalDamage),
    damage:              findSection(lines, SECTION_ALIASES.damage),
    captures:            findSection(lines, SECTION_ALIASES.captures),
    awards:              findSection(lines, SECTION_ALIASES.awards),
    activityTime:        findSection(lines, SECTION_ALIASES.activityTime),
    timePlayed:          findSection(lines, SECTION_ALIASES.timePlayed),
    skillBonus:          findSection(lines, SECTION_ALIASES.skillBonus),
    researchedUnit:      findSection(lines, SECTION_ALIASES.researchedUnit),
    researchingProgress: findSection(lines, SECTION_ALIASES.researchingProgress),
  };

  // Map section headers to summary fields
  const mapHeader = (section, fields) => {
    if (section.headingIndex === -1) return;
    const h = parseSectionHeader(section.headingLine);
    if (fields.count) battle[fields.count] = h.count;
    if (fields.sl)    battle[fields.sl]    = h.sl;
    if (fields.rp)    battle[fields.rp]    = h.rp;
    if (fields.time && h.totalTime) battle[fields.time] = h.totalTime;
  };

  mapHeader(S.aircraftKills,  { count: 'killsAircraft',   sl: 'killsAircraftSL',   rp: 'killsAircraftRP' });
  mapHeader(S.groundKills,    { count: 'killsGround',     sl: 'killsGroundSL',     rp: 'killsGroundRP' });
  mapHeader(S.assists,        { count: 'assists',         sl: 'assistsSL',         rp: 'assistsRP' });
  mapHeader(S.severeDamage,   { count: 'severeDamage',    sl: 'severeDamageSL',    rp: 'severeDamageRP' });
  mapHeader(S.criticalDamage, { count: 'criticalDamage',  sl: 'criticalDamageSL',  rp: 'criticalDamageRP' });
  mapHeader(S.damage,         { count: 'damage',          sl: 'damageSL',          rp: 'damageRP' });
  mapHeader(S.captures,       { count: 'captures',        sl: 'capturesSL',        rp: 'capturesRP' });
  mapHeader(S.awards,         { count: 'awardsCount',     sl: 'awardsSL',          rp: 'awardsRP' });
  mapHeader(S.activityTime,   { sl: 'activityTimeSL',     rp: 'activityTimeRP' });
  mapHeader(S.timePlayed,     { rp: 'timePlayedRP',       time: 'totalTimeSec' });
  mapHeader(S.skillBonus,     { rp: 'skillBonusRP' });

  const processLines = (section, kind, parser, targetArray) => {
    for (const line of section.bodyLines) {
      if (isBlank(line)) continue;
      const parsed = (kind === 'capture') ? parser(line, kind) :
                     (kind === 'aircraft' || kind === 'ground' || kind === 'assist' ||
                      kind === 'severe'   || kind === 'critical' || kind === 'damage')
                       ? parser(line, kind)
                       : parser(line);
      if (parsed) {
        if (kind === 'aircraft' || kind === 'ground') {
          targetArray.push({ type: kind, ...parsed });
        } else {
          targetArray.push(parsed);
        }
      }
    }
  };

  processLines(S.aircraftKills,  'aircraft', parseCombatLine, battle.kills);
  processLines(S.groundKills,    'ground',   parseCombatLine, battle.kills);
  processLines(S.assists,        'assist',   parseCombatLine, battle.assists_detail);
  processLines(S.severeDamage,   'severe',   parseCombatLine, battle.severeDamage_detail);
  processLines(S.criticalDamage, 'critical', parseCombatLine, battle.criticalDamage_detail);
  processLines(S.damage,         'damage',   parseCombatLine, battle.damage_detail);
  processLines(S.captures,       'capture',  parseCombatLine, battle.captures_detail);

  processLines(S.awards,        null, parseAwardLine,          battle.awards_detail);
  processLines(S.activityTime,  null, parseActivityTimeLine,   battle.activityTime_detail);
  processLines(S.timePlayed,    null, parseTimePlayedLine,     battle.timePlayed_detail);
  processLines(S.skillBonus,    null, parseSkillBonusLine,     battle.skillBonus_detail);

  processLines(S.researchedUnit,      null, parseResearchedUnitLine,    battle.researchedUnits);
  processLines(S.researchingProgress, null, parseResearchProgressLine,  battle.researchingProgress);
}

// ─── Fallback Resilience ──────────────────────────────────────────────────────

function applyHeaderFallbacks(text, battle) {
  const ensure = (field, regex) => {
    if (battle[field] === 0) {
      const match = text.match(regex);
      if (match) battle[field] = parseIntSafe(match[1]);
    }
  };
  ensure('killsAircraft',  /Destruction of aircraft\s+(\d+)\b/i);
  ensure('killsGround',    /Destruction of ground (?:targets|vehicles)\s+(\d+)\b/i);
  ensure('assists',        /Assistance in destroying the enemy\s+(\d+)\b/i);
  ensure('severeDamage',   /Severe damage to the enemy\s+(\d+)\b/i);
  ensure('criticalDamage', /Critical damage to the enemy\s+(\d+)\b/i);
  ensure('damage',         /Damage to the enemy\s+(\d+)\b/i);
}

// ─── Vehicle Resolution ───────────────────────────────────────────────────────

function extractUniqueVehicles(battle) {
  const seenVehicles = new Map();

  const consider = (rawName) => {
    const clean = cleanVehicleName(rawName);
    if (!isValidVehicleName(clean)) return;
    const key = clean.toLowerCase().replace(/\s+/g, ' ');
    if (!seenVehicles.has(key)) seenVehicles.set(key, lookupVehicle(clean));
  };

  const scanEventArray = (arr, primaryField = 'vehicle') => {
    if (!Array.isArray(arr)) return;
    arr.forEach(item => {
      if (item?.[primaryField]) consider(item[primaryField]);
      if (item?.target)         consider(item.target);
      if (item?.unit)           consider(item.unit);
    });
  };

  scanEventArray(battle.kills);
  scanEventArray(battle.assists_detail);
  scanEventArray(battle.severeDamage_detail);
  scanEventArray(battle.criticalDamage_detail);
  scanEventArray(battle.damage_detail);
  scanEventArray(battle.captures_detail);
  scanEventArray(battle.activityTime_detail);
  scanEventArray(battle.timePlayed_detail);
  scanEventArray(battle.skillBonus_detail);
  scanEventArray(battle.researchedUnits, 'unit');
  scanEventArray(battle.researchingProgress, 'unit');

  if (battle.damagedVehicles) battle.damagedVehicles.forEach(v => consider(v));

  return Array.from(seenVehicles.values())
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// ─── Fingerprinting ───────────────────────────────────────────────────────────

/**
 * Builds a collision-resistant fingerprint from stable battle fields.
 * Used by battleStore to detect duplicates when the same log is imported
 * in different forms (JSON file vs pasted text).
 */
export function buildFingerprint(battle) {
  const salt = 'WT_STATS_v2';
  return [
    salt,
    battle.session,
    battle.missionName,
    battle.missionType,
    battle.result,
    battle.totalSL,
    battle.totalRP,
    battle.earnedSL,
    battle.killsAircraft,
    battle.killsGround,
    battle.assists,
    battle.activity,
  ].join('|');
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto?.randomUUID) return crypto.randomUUID();
  return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point. Parses raw WT log text into a structured battle object.
 *
 * @param {string} logText
 * @returns {Object} Structured battle data
 */
export function parseBattleLog(logText) {
  const text = normalizeText(logText);
  if (isBlank(text)) throw new Error('Parser: received empty log text.');

  const battle = {
    id:         createId(),
    parsedAt:   new Date().toISOString(),
    parsedFrom: 'text', // distinguishes from JSON imports — used by battleStore
    version:    SCHEMA_VERSION,

    result:      BattleResult.UNKNOWN,
    missionType: 'Unknown',
    missionName: 'Unknown',
    session:     '',

    killsAircraft: 0, killsAircraftSL: 0,  killsAircraftRP: 0,
    killsGround:   0, killsGroundSL:   0,  killsGroundRP:   0,
    assists:       0, assistsSL:       0,  assistsRP:       0,
    severeDamage:  0, severeDamageSL:  0,  severeDamageRP:  0,
    criticalDamage:0, criticalDamageSL:0,  criticalDamageRP: 0,
    damage:        0, damageSL:        0,  damageRP:         0,
    captures:      0, capturesSL:      0,  capturesRP:       0,
    awardsCount:   0, awardsSL:        0,  awardsRP:         0,

    activityTimeSL: 0, activityTimeRP: 0,
    timePlayedRP:   0, totalTimeSec:   0,
    skillBonusRP:   0,
    activity:       0,

    rewardSL:         0,
    earnedSL:         0,
    earnedCRP:        0,
    autoRepairCost:   0,
    autoAmmoCrewCost: 0,
    totalSL:          0,
    totalCRP:         0,
    totalRP:          0,

    researchedUnits:     [],
    researchingProgress: [],
    damagedVehicles:     [],

    kills:                 [],
    assists_detail:        [],
    severeDamage_detail:   [],
    criticalDamage_detail: [],
    damage_detail:         [],
    captures_detail:       [],
    awards_detail:         [],
    activityTime_detail:   [],
    timePlayed_detail:     [],
    skillBonus_detail:     [],

    vehicles:    [],
    fingerprint: '',
  };

  try {
    parseMissionHeader(text, battle);
    parseSections(text, battle);
    parseMiscFields(text, battle);
    applyHeaderFallbacks(text, battle);
    battle.vehicles    = extractUniqueVehicles(battle);
    battle.fingerprint = buildFingerprint(battle);

    if (DEBUG_MODE) console.log(`[Parser] Processed: ${battle.id} — ${battle.missionName}`);
  } catch (err) {
    console.error('[Parser] Fatal error:', err);
    throw err;
  }

  return battle;
}

export { lookupVehicle } from './vehicleRegistry.js';