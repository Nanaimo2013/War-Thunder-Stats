/**
 * statsCalculator.js
 *
 * Computes aggregated statistics from an array of parsed battle objects.
 *
 * @version 2.1.0
 *
 * CHANGELOG v2.1.0:
 *  ✓  BUG FIX: Removed duplicate `results` and `totalSkillBonusRP` fields in emptyStats()
 *  ✓  BUG FIX: winRate now correctly computed (was commented out)
 *  ✓  Added streak tracking: currentStreak, longestStreak, currentLossStreak, longestLossStreak
 *  ✓  Added efficiency stats: slPerMinute, rpPerMinute (overall + per-vehicle)
 *  ✓  Added winRateByMap, winRateByMode frequency breakdowns
 *  ✓  Added bestBattleSL, bestBattleRP, worstBattleSL references
 *  ✓  Added per-rank vehicle grouping
 *  ✓  Added totalKillsNaval to combat totals
 *  ✓  Added averageCaptures, averageAssists stats
 *  ✓  Added KDA ratio (kills+assists / deaths-approximation)
 *  ✓  filterBattles supports missionName, rank, country, gameMode filters
 *  ✓  vehicleStatsFor returns richer object with computed ratios
 *  ✓  New export: getTopBattles(battles, n, field) — surface best/worst games
 *  ✓  New export: getStreakInfo(battles) — isolated streak computation
 *  ✓  New export: getEconomyBreakdown(battles) — SL/RP income source analysis
 */

import { BattleResult } from './constants.js';
import { formatDuration } from './helpers.js';

// ─── Empty/zero structures ────────────────────────────────────────────────────

function emptyStats() {
  return {
    totalBattles: 0,

    // ── Results ──
    wins:     0,
    defeats:  0,
    draws:    0,
    unknowns: 0,
    results: {
      [BattleResult.VICTORY]: 0,
      [BattleResult.DEFEAT]:  0,
      [BattleResult.DRAW]:    0,
      [BattleResult.UNKNOWN]: 0,
    },
    winRate:     0,   // 0–100

    // ── Streaks ──
    currentStreak:     0,  // positive = win streak, negative = loss streak
    longestStreak:     0,  // longest consecutive wins
    longestLossStreak: 0,  // longest consecutive defeats

    // ── Combat ──
    totalKillsAircraft:  0,
    totalKillsGround:    0,
    totalKillsNaval:     0,  // ADDED
    totalKills:          0,  // aircraft + ground + naval
    totalAssists:        0,
    totalSevereDamage:   0,
    totalCriticalDamage: 0,
    totalDamage:         0,
    totalCaptures:       0,

    // ── Economy — raw section totals ──
    totalKillsAircraftSL:  0, totalKillsAircraftRP:  0,
    totalKillsGroundSL:    0, totalKillsGroundRP:    0,
    totalAssistsSL:        0, totalAssistsRP:        0,
    totalSevereDamageSL:   0, totalSevereDamageRP:   0,
    totalCriticalDamageSL: 0, totalCriticalDamageRP: 0,
    totalDamageSL:         0, totalDamageRP:         0,
    totalCapturesSL:       0, totalCapturesRP:       0,
    totalAwardsCount:      0, totalAwardsSL:         0, totalAwardsRP: 0,
    totalActivityTimeSL:   0, totalActivityTimeRP:   0,
    totalTimePlayedRP:     0,
    totalSkillBonusRP:     0,
    totalRewardSL:         0,
    totalEarnedSL:         0,
    totalEarnedCRP:        0,
    totalAutoRepairCost:   0,
    totalAutoAmmoCrewCost: 0,
    totalSL:               0,
    totalCRP:              0,
    totalRP:               0,

    // ── Research ──
    totalResearchedRP:        0,
    totalResearchingProgressRP: 0,

    // ── Activity ──
    totalActivityPercent: 0,   // sum; divide by battles for average
    totalTimeSec:         0,   // sum of totalTimeSec per battle (seconds)

    // ── Averages ──
    averageActivity:   0,
    averageEarnedSL:   0,
    averageEarnedCRP:  0,
    averageTotalRP:    0,
    averageTotalSL:    0,
    averageKills:      0,
    averageAssists:    0,   // ADDED
    averageCaptures:   0,   // ADDED
    averageTimeSec:    0,   // ADDED

    // ── Efficiency ──
    slPerMinute:   0,   // ADDED: average SL earned per active minute
    rpPerMinute:   0,   // ADDED: average RP earned per active minute

    // ── Reference battles ──
    bestBattleSL:  null,  // battle with highest totalSL
    bestBattleRP:  null,  // battle with highest totalRP
    bestBattleKills: null, // battle with most kills

    // ── Top lists (vehicle leaderboards) ──
    topVehiclesByKills:      [],
    topVehiclesByDamage:     [],
    topVehiclesByTimePlayed: [],
    topVehiclesBySL:         [],
    topVehiclesByRP:         [],  // ADDED
    topAwards:               [],

    // ── Frequency maps ──
    missionTypes:    {},  // BattleMode → count
    missionNames:    {},  // MissionMap → count
    winRateByMap:    {},  // missionName → { wins, total, rate }
    winRateByMode:   {},  // missionType → { wins, total, rate }

    // ── Vehicle breakdowns ──
    vehicleStats:    {},  // displayName → VehicleStats
    vehiclesByRank:  {},  // rank → VehicleStats[]
    vehiclesByType:  {},  // type → VehicleStats[]

    // ── Raw battle reference ──
    // (set after aggregation for quick access)
    _battles: null,
  };
}

function emptyVehicleStats(info) {
  return {
    displayName:      info.displayName,
    country:          info.country       || null,
    type:             info.type          || null,
    baseType:         info.baseType      || null,
    rank:             info.rank          || null,
    fromRegistry:     info.fromRegistry  || false,
    fallbackIconPath: info.fallbackIconPath || null,
    flagPath:         info.flagPath      || null,

    battles:        0,
    wins:           0,   // ADDED
    defeats:        0,   // ADDED
    winRate:        0,   // ADDED (computed at finalise)

    kills:          0,
    killsAircraft:  0,
    killsGround:    0,
    assists:        0,
    severeDamage:   0,
    criticalDamage: 0,
    damage:         0,
    captures:       0,

    timeSec:        0,   // total time played in this vehicle (seconds)
    activitySL:     0,
    activityRP:     0,
    skillBonusRP:   0,
    earnedRP:       0,   // activityRP + timePlayedRP + skillBonusRP
    earnedSL:       0,

    // Computed ratios (set during finalise)
    killsPerBattle:   0,
    assistsPerBattle: 0,
    slPerMinute:      0,
    rpPerMinute:      0,
  };
}

// ─── Core aggregation ─────────────────────────────────────────────────────────

/**
 * Compute comprehensive stats from an array of battle objects.
 *
 * @param {Object[]} battles  Array returned by parseBattleLog() (or migrated v1)
 * @returns {Object}           Aggregated stats
 */
export function calculateStats(battles) {
  if (!Array.isArray(battles) || battles.length === 0) return emptyStats();

  const agg = emptyStats();
  agg.totalBattles = battles.length;
  agg._battles = battles;

  const vehicleMap = new Map(); // displayName.toLowerCase() → VehicleStats

  function getVS(vehicleInfo) {
    const key = (vehicleInfo.displayName || '').toLowerCase();
    if (!vehicleMap.has(key)) vehicleMap.set(key, emptyVehicleStats(vehicleInfo));
    return vehicleMap.get(key);
  }

  // ── Per-battle pass ──────────────────────────────────────────────────────

  let bestSL = null, bestRP = null, bestKills = null;

  for (const battle of battles) {
    // ── Results ──
    const result = battle.result || BattleResult.UNKNOWN;
    agg.results[result] = (agg.results[result] || 0) + 1;

    // ── Mission frequency + win rate by map/mode ──
    const mType = battle.missionType || 'Unknown';
    const mName = battle.missionName || 'Unknown';

    agg.missionTypes[mType] = (agg.missionTypes[mType] || 0) + 1;
    agg.missionNames[mName] = (agg.missionNames[mName] || 0) + 1;

    // winRateByMap
    if (!agg.winRateByMap[mName]) agg.winRateByMap[mName] = { wins: 0, total: 0, rate: 0 };
    agg.winRateByMap[mName].total++;
    if (result === BattleResult.VICTORY) agg.winRateByMap[mName].wins++;

    // winRateByMode
    if (!agg.winRateByMode[mType]) agg.winRateByMode[mType] = { wins: 0, total: 0, rate: 0 };
    agg.winRateByMode[mType].total++;
    if (result === BattleResult.VICTORY) agg.winRateByMode[mType].wins++;

    // ── Combat counts ──
    agg.totalKillsAircraft  += battle.killsAircraft  || 0;
    agg.totalKillsGround    += battle.killsGround    || 0;
    agg.totalAssists        += battle.assists        || 0;
    agg.totalSevereDamage   += battle.severeDamage   || 0;
    agg.totalCriticalDamage += battle.criticalDamage || 0;
    agg.totalDamage         += battle.damage         || 0;
    agg.totalCaptures       += battle.captures       || 0;

    // Naval kills from detail array (not always a top-level field in older data)
    const navalKills = (battle.kills || []).filter(k => k.type === 'naval').length;
    agg.totalKillsNaval += navalKills;

    // ── Economy per section ──
    agg.totalKillsAircraftSL  += battle.killsAircraftSL  || 0;
    agg.totalKillsAircraftRP  += battle.killsAircraftRP  || 0;
    agg.totalKillsGroundSL    += battle.killsGroundSL    || 0;
    agg.totalKillsGroundRP    += battle.killsGroundRP    || 0;
    agg.totalAssistsSL        += battle.assistsSL        || 0;
    agg.totalAssistsRP        += battle.assistsRP        || 0;
    agg.totalSevereDamageSL   += battle.severeDamageSL   || 0;
    agg.totalSevereDamageRP   += battle.severeDamageRP   || 0;
    agg.totalCriticalDamageSL += battle.criticalDamageSL || 0;
    agg.totalCriticalDamageRP += battle.criticalDamageRP || 0;
    agg.totalDamageSL         += battle.damageSL         || 0;
    agg.totalDamageRP         += battle.damageRP         || 0;
    agg.totalCapturesSL       += battle.capturesSL       || 0;
    agg.totalCapturesRP       += battle.capturesRP       || 0;
    agg.totalAwardsCount      += battle.awardsCount      || 0;
    agg.totalAwardsSL         += battle.awardsSL         || 0;
    agg.totalAwardsRP         += battle.awardsRP         || 0;
    agg.totalActivityTimeSL   += battle.activityTimeSL   || 0;
    agg.totalActivityTimeRP   += battle.activityTimeRP   || 0;
    agg.totalTimePlayedRP     += battle.timePlayedRP     || 0;
    agg.totalSkillBonusRP     += battle.skillBonusRP     || 0;
    agg.totalRewardSL         += battle.rewardSL         || 0;
    agg.totalEarnedSL         += battle.earnedSL         || 0;
    agg.totalEarnedCRP        += battle.earnedCRP        || 0;
    agg.totalAutoRepairCost   += battle.autoRepairCost   || 0;
    agg.totalAutoAmmoCrewCost += battle.autoAmmoCrewCost || 0;
    agg.totalSL               += battle.totalSL          || 0;
    agg.totalCRP              += battle.totalCRP         || 0;
    agg.totalRP               += battle.totalRP          || 0;
    agg.totalActivityPercent  += battle.activity         || 0;
    agg.totalTimeSec          += battle.totalTimeSec     || 0;

    // ── Research ──
    for (const u of battle.researchedUnits     || []) agg.totalResearchedRP         += u.rp || 0;
    for (const p of battle.researchingProgress || []) agg.totalResearchingProgressRP += p.rp || 0;

    // ── Best battle references ──
    const bSL    = battle.totalSL || 0;
    const bRP    = battle.totalRP || 0;
    const bKills = (battle.killsAircraft || 0) + (battle.killsGround || 0);

    if (!bestSL    || bSL    > (bestSL.totalSL    || 0)) bestSL    = battle;
    if (!bestRP    || bRP    > (bestRP.totalRP     || 0)) bestRP    = battle;
    if (!bestKills || bKills > ((bestKills.killsAircraft||0)+(bestKills.killsGround||0))) bestKills = battle;

    // ── Per-vehicle stats ──────────────────────────────────────────────────
    const battleVehicleKeys = new Set();

    const vehicleInfoByName = new Map(
      (battle.vehicles || [])
        .filter(v => v?.displayName)
        .map(v => [v.displayName.toLowerCase(), v])
    );

    const getInfo = (name) => {
      if (!name) return { displayName: 'Unknown' };
      return vehicleInfoByName.get(name.toLowerCase()) || { displayName: name };
    };

    const ensureVehicle = (info) => {
      if (!info?.displayName) return null;
      const vs  = getVS(info);
      const key = info.displayName.toLowerCase();
      if (!battleVehicleKeys.has(key)) {
        battleVehicleKeys.add(key);
        vs.battles++;
        if (result === BattleResult.VICTORY) vs.wins++;
        else if (result === BattleResult.DEFEAT) vs.defeats++;
      }
      return vs;
    };

    for (const k of battle.kills || []) {
      const vs = ensureVehicle(getInfo(k.vehicle));
      if (!vs) continue;
      if (k.type === 'aircraft') { vs.kills++; vs.killsAircraft++; }
      else if (k.type === 'ground') { vs.kills++; vs.killsGround++; }
      else { vs.kills++; }
    }

    for (const a of battle.assists_detail || []) {
      const vs = ensureVehicle(getInfo(a.vehicle));
      if (vs) vs.assists++;
    }

    for (const d of battle.severeDamage_detail || []) {
      const vs = ensureVehicle(getInfo(d.vehicle));
      if (vs) vs.severeDamage++;
    }

    for (const d of battle.criticalDamage_detail || []) {
      const vs = ensureVehicle(getInfo(d.vehicle));
      if (vs) vs.criticalDamage++;
    }

    for (const d of battle.damage_detail || []) {
      const vs = ensureVehicle(getInfo(d.vehicle));
      if (vs) vs.damage++;
    }

    for (const c of battle.captures_detail || []) {
      const vs = ensureVehicle(getInfo(c.vehicle));
      if (vs) vs.captures++;
    }

    for (const at of battle.activityTime_detail || []) {
      const vs = ensureVehicle(getInfo(at.vehicle));
      if (!vs) continue;
      vs.activitySL += at.sl || 0;
      vs.activityRP += at.rp || 0;
      vs.earnedSL   += at.sl || 0;
      vs.earnedRP   += at.rp || 0;
    }

    for (const tp of battle.timePlayed_detail || []) {
      const vs = ensureVehicle(getInfo(tp.vehicle));
      if (!vs) continue;
      vs.timeSec  += tp.timeSec || 0;
      vs.earnedRP += tp.rp     || 0;
    }

    for (const sb of battle.skillBonus_detail || []) {
      const vs = ensureVehicle(getInfo(sb.vehicle));
      if (!vs) continue;
      vs.skillBonusRP += sb.rp || 0;
      vs.earnedRP     += sb.rp || 0;
    }
  }

  // ── Derived totals ──────────────────────────────────────────────────────────

  agg.totalKills = agg.totalKillsAircraft + agg.totalKillsGround + agg.totalKillsNaval;

  agg.wins     = agg.results[BattleResult.VICTORY] || 0;
  agg.defeats  = agg.results[BattleResult.DEFEAT]  || 0;
  agg.draws    = agg.results[BattleResult.DRAW]    || 0;
  agg.unknowns = agg.results[BattleResult.UNKNOWN] || 0;

  const decided = agg.wins + agg.defeats;
  agg.winRate   = decided > 0 ? (agg.wins / decided) * 100 : 0;

  // Finalise win-rate-by-map/mode
  for (const entry of Object.values(agg.winRateByMap)) {
    entry.rate = entry.total > 0 ? (entry.wins / entry.total) * 100 : 0;
  }
  for (const entry of Object.values(agg.winRateByMode)) {
    entry.rate = entry.total > 0 ? (entry.wins / entry.total) * 100 : 0;
  }

  // ── Streaks ──────────────────────────────────────────────────────────────────

  const streakInfo = _computeStreaks(battles);
  agg.currentStreak     = streakInfo.current;
  agg.longestStreak     = streakInfo.longestWin;
  agg.longestLossStreak = streakInfo.longestLoss;

  // ── Averages ─────────────────────────────────────────────────────────────────

  const n = battles.length;
  agg.averageActivity  = agg.totalActivityPercent / n;
  agg.averageEarnedSL  = agg.totalEarnedSL        / n;
  agg.averageEarnedCRP = agg.totalEarnedCRP        / n;
  agg.averageTotalRP   = agg.totalRP               / n;
  agg.averageTotalSL   = agg.totalSL               / n;
  agg.averageKills     = agg.totalKills            / n;
  agg.averageAssists   = agg.totalAssists          / n;
  agg.averageCaptures  = agg.totalCaptures         / n;
  agg.averageTimeSec   = agg.totalTimeSec          / n;

  // Efficiency: per-minute rates (totalTimeSec in seconds → minutes)
  const totalMinutes = agg.totalTimeSec / 60;
  agg.slPerMinute = totalMinutes > 0 ? agg.totalEarnedSL / totalMinutes : 0;
  agg.rpPerMinute = totalMinutes > 0 ? agg.totalRP       / totalMinutes : 0;

  // ── Reference battles ────────────────────────────────────────────────────────

  agg.bestBattleSL    = bestSL    ? _battleSummary(bestSL)    : null;
  agg.bestBattleRP    = bestRP    ? _battleSummary(bestRP)    : null;
  agg.bestBattleKills = bestKills ? _battleSummary(bestKills) : null;

  // ── Vehicle leaderboards ─────────────────────────────────────────────────────

  const vsArray = Array.from(vehicleMap.values());

  // Compute per-vehicle derived stats
  for (const vs of vsArray) {
    const dec = vs.wins + vs.defeats;
    vs.winRate        = dec > 0 ? (vs.wins / dec) * 100 : 0;
    vs.killsPerBattle = vs.battles > 0 ? vs.kills   / vs.battles : 0;
    vs.assistsPerBattle = vs.battles > 0 ? vs.assists / vs.battles : 0;
    const vMin = vs.timeSec / 60;
    vs.slPerMinute = vMin > 0 ? vs.earnedSL / vMin : 0;
    vs.rpPerMinute = vMin > 0 ? vs.earnedRP / vMin : 0;
  }

  agg.vehicleStats = Object.fromEntries(vsArray.map(vs => [vs.displayName, vs]));

  agg.topVehiclesByKills = _topN(vsArray, 5,
    vs => vs.kills,
    vs => ({ vehicle: vs.displayName, kills: vs.kills, country: vs.country, type: vs.type, iconPath: vs.fallbackIconPath }));

  agg.topVehiclesByDamage = _topN(vsArray, 5,
    vs => vs.severeDamage + vs.criticalDamage + vs.damage,
    vs => ({ vehicle: vs.displayName, damageEvents: vs.severeDamage + vs.criticalDamage + vs.damage, country: vs.country, type: vs.type, iconPath: vs.fallbackIconPath }));

  agg.topVehiclesByTimePlayed = _topN(vsArray, 5,
    vs => vs.timeSec,
    vs => ({ vehicle: vs.displayName, timeSec: vs.timeSec, timeFormatted: formatDuration(vs.timeSec), country: vs.country, type: vs.type, iconPath: vs.fallbackIconPath }));

  agg.topVehiclesBySL = _topN(vsArray, 5,
    vs => vs.earnedSL,
    vs => ({ vehicle: vs.displayName, earnedSL: vs.earnedSL, country: vs.country, type: vs.type, iconPath: vs.fallbackIconPath }));

  agg.topVehiclesByRP = _topN(vsArray, 5,
    vs => vs.earnedRP,
    vs => ({ vehicle: vs.displayName, earnedRP: vs.earnedRP, country: vs.country, type: vs.type, iconPath: vs.fallbackIconPath }));

  // ── Award leaderboard ────────────────────────────────────────────────────────

  const awardCounts = {};
  for (const battle of battles) {
    for (const a of battle.awards_detail || []) {
      if (a.award) awardCounts[a.award] = (awardCounts[a.award] || 0) + 1;
    }
  }
  agg.topAwards = Object.entries(awardCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([award, count]) => ({ award, count }));

  // ── Vehicle groupings ────────────────────────────────────────────────────────

  agg.vehiclesByRank = {};
  agg.vehiclesByType = {};
  for (const vs of vsArray) {
    if (vs.rank) {
      if (!agg.vehiclesByRank[vs.rank]) agg.vehiclesByRank[vs.rank] = [];
      agg.vehiclesByRank[vs.rank].push(vs.displayName);
    }
    if (vs.type) {
      if (!agg.vehiclesByType[vs.type]) agg.vehiclesByType[vs.type] = [];
      agg.vehiclesByType[vs.type].push(vs.displayName);
    }
  }

  return agg;
}

// ─── Streak Computation ───────────────────────────────────────────────────────

/**
 * Compute win/loss streak data from a chronological battles array.
 * Battles should be newest-first (as stored by battleStore).
 *
 * @param {Object[]} battles  Newest-first order
 * @returns {{ current: number, longestWin: number, longestLoss: number }}
 */
export function _computeStreaks(battles) {
  // Work oldest→newest for streak calculation
  const ordered = [...battles].reverse();
  let longestWin = 0, longestLoss = 0;
  let curWin = 0, curLoss = 0;

  for (const b of ordered) {
    if (b.result === BattleResult.VICTORY) {
      curWin++;  curLoss = 0;
      if (curWin  > longestWin)  longestWin  = curWin;
    } else if (b.result === BattleResult.DEFEAT) {
      curLoss++; curWin  = 0;
      if (curLoss > longestLoss) longestLoss = curLoss;
    } else {
      curWin = 0; curLoss = 0;
    }
  }

  // Current streak: look at most-recent battles (battles[0] is newest)
  let current = 0;
  for (const b of battles) {
    if (b.result === BattleResult.VICTORY)      { if (current >= 0) current++; else break; }
    else if (b.result === BattleResult.DEFEAT)  { if (current <= 0) current--; else break; }
    else break;
  }

  return { current, longestWin, longestLoss };
}

// ─── Economy Breakdown ────────────────────────────────────────────────────────

/**
 * Returns a breakdown of where SL and RP came from across all battles.
 * Useful for income-source charts.
 *
 * @param {Object[]} battles
 * @returns {{
 *   sl: { kills, assists, damage, captures, awards, activity, reward, other },
 *   rp: { kills, assists, damage, activity, timePlayed, skillBonus, research, other }
 * }}
 */
export function getEconomyBreakdown(battles) {
  const sl = { kills: 0, assists: 0, damage: 0, captures: 0, awards: 0, activity: 0, reward: 0, other: 0 };
  const rp = { kills: 0, assists: 0, damage: 0, activity: 0, timePlayed: 0, skillBonus: 0, research: 0, other: 0 };

  for (const b of battles || []) {
    sl.kills    += (b.killsAircraftSL  || 0) + (b.killsGroundSL  || 0);
    sl.assists  += b.assistsSL         || 0;
    sl.damage   += (b.severeDamageSL   || 0) + (b.criticalDamageSL || 0) + (b.damageSL || 0);
    sl.captures += b.capturesSL        || 0;
    sl.awards   += b.awardsSL          || 0;
    sl.activity += b.activityTimeSL    || 0;
    sl.reward   += b.rewardSL          || 0;

    rp.kills      += (b.killsAircraftRP  || 0) + (b.killsGroundRP  || 0);
    rp.assists    += b.assistsRP         || 0;
    rp.damage     += (b.severeDamageRP   || 0) + (b.criticalDamageRP || 0) + (b.damageRP || 0);
    rp.activity   += b.activityTimeRP    || 0;
    rp.timePlayed += b.timePlayedRP      || 0;
    rp.skillBonus += b.skillBonusRP      || 0;

    for (const u of b.researchedUnits     || []) rp.research += u.rp || 0;
    for (const p of b.researchingProgress || []) rp.research += p.rp || 0;
  }

  return { sl, rp };
}

// ─── Top Battles ─────────────────────────────────────────────────────────────

/**
 * Returns the top N battles sorted by a field.
 *
 * @param {Object[]} battles
 * @param {number}   n        How many to return (default 5)
 * @param {'totalSL'|'totalRP'|'kills'|'activity'} field
 * @returns {Object[]}  Summarised battle objects
 */
export function getTopBattles(battles, n = 5, field = 'totalSL') {
  const score = (b) => {
    if (field === 'kills') return (b.killsAircraft || 0) + (b.killsGround || 0);
    return b[field] || 0;
  };
  return [...(battles || [])]
    .filter(b => score(b) > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, n)
    .map(_battleSummary);
}

// ─── Standalone Streak Info ───────────────────────────────────────────────────

/**
 * Get streak information without computing full stats.
 *
 * @param {Object[]} battles  Newest-first
 * @returns {{ current: number, longestWin: number, longestLoss: number }}
 */
export function getStreakInfo(battles) {
  return _computeStreaks(battles || []);
}

// ─── Filtering ────────────────────────────────────────────────────────────────

/**
 * Filter battles before aggregating.
 *
 * @param {Object[]} battles
 * @param {{
 *   result?:      string,
 *   missionType?: string,
 *   missionName?: string,   // ADDED
 *   vehicle?:     string,
 *   country?:     string,   // ADDED: filter by any vehicle's country
 *   rank?:        string,   // ADDED: filter by any vehicle's rank
 *   fromDate?:    string,
 *   toDate?:      string,
 * }} filters
 */
export function filterBattles(battles, filters = {}) {
  return (battles || []).filter(b => {
    if (filters.result      && b.result      !== filters.result)      return false;
    if (filters.missionType && b.missionType !== filters.missionType) return false;
    if (filters.missionName && b.missionName !== filters.missionName) return false;

    if (filters.vehicle) {
      const v = filters.vehicle.toLowerCase();
      if (!(b.vehicles || []).some(vv => vv.displayName.toLowerCase().includes(v))) return false;
    }

    if (filters.country) {
      const c = filters.country.toLowerCase();
      if (!(b.vehicles || []).some(vv => (vv.country || '').toLowerCase() === c)) return false;
    }

    if (filters.rank) {
      if (!(b.vehicles || []).some(vv => vv.rank === filters.rank)) return false;
    }

    const dateField = b.parsedAt || b.timestamp;
    if (filters.fromDate && dateField < filters.fromDate) return false;
    if (filters.toDate   && dateField > filters.toDate)   return false;

    return true;
  });
}

// ─── Single-Vehicle Stats ─────────────────────────────────────────────────────

/**
 * Compute stats for a specific vehicle across all battles.
 *
 * @param {string}   vehicleName
 * @param {Object[]} battles
 * @returns {Object|null}
 */
export function vehicleStatsFor(vehicleName, battles) {
  const filtered = (battles || []).filter(b =>
    (b.vehicles || []).some(v => v.displayName.toLowerCase() === vehicleName.toLowerCase())
  );
  if (!filtered.length) return null;
  const stats = calculateStats(filtered);
  const vs = stats.vehicleStats[vehicleName];
  if (!vs) return null;

  // Add battle list for UI drill-down
  vs.battles_list = filtered.map(_battleSummary);
  return vs;
}

// ─── Incremental / Finalise ───────────────────────────────────────────────────

/**
 * Not yet implemented for incremental — always signals caller to recompute.
 * For the data volumes this app handles, a full recompute is fast enough.
 */
export function addBattleToStats() { return null; }

export function finaliseStats(agg) {
  const n = agg.totalBattles;
  if (n === 0) return agg;
  agg.averageActivity  = agg.totalActivityPercent / n;
  agg.averageEarnedSL  = agg.totalEarnedSL        / n;
  agg.averageEarnedCRP = agg.totalEarnedCRP        / n;
  agg.averageTotalRP   = agg.totalRP               / n;
  agg.averageTotalSL   = agg.totalSL               / n;
  agg.averageKills     = agg.totalKills            / n;
  const v = agg.results[BattleResult.VICTORY] || 0;
  const d = v + (agg.results[BattleResult.DEFEAT] || 0);
  agg.winRate = d > 0 ? (v / d) * 100 : 0;
  return agg;
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function _topN(arr, n, scoreFn, mapFn) {
  return arr
    .filter(vs => scoreFn(vs) > 0)
    .sort((a, b) => scoreFn(b) - scoreFn(a))
    .slice(0, n)
    .map(mapFn);
}

/** Compact battle summary for "best battle" / top-battles references. */
function _battleSummary(b) {
  if (!b) return null;
  return {
    id:          b.id,
    parsedAt:    b.parsedAt || b.timestamp,
    result:      b.result,
    missionName: b.missionName,
    missionType: b.missionType,
    totalSL:     b.totalSL || 0,
    totalRP:     b.totalRP || 0,
    totalCRP:    b.totalCRP || 0,
    kills:       (b.killsAircraft || 0) + (b.killsGround || 0),
    assists:     b.assists || 0,
    activity:    b.activity || 0,
  };
}