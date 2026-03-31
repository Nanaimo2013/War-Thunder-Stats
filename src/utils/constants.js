/**
 * constants.js
 *
 * Single source of truth for all enums, lookup tables, asset paths,
 * regex patterns, and section aliases for the War Thunder Stats system.
 *
 * @version 2.1.0
 *
 * CHANGELOG v2.1.0:
 *  ✓  Added SCHEMA_VERSION — consumed by parser, migrationScript, battleValidator
 *  ✓  Added GameMode enum (ARCADE, REALISTIC, SIMULATOR)
 *  ✓  Added BattleMode enum (DOMINATION, DESTRUCTION, GROUND_STRIKE, etc.)
 *  ✓  Replaced bare MISSION_MAP_NAMES array with typed MissionMap enum object
 *  ✓  Added MissionMapAliases for normalising raw log map names
 *  ✓  Fixed VehicleType.HELICOPTERS → HELICOPTER (singular, matches registry)
 *  ✓  Added NAVY_KILL to CombatEventKind
 *  ✓  Added per-tier stat weights in SCORE_WEIGHTS
 *  ✓  Extended AWARDS_METADATA with 30+ common medals
 *  ✓  Added STREAK_THRESHOLDS constant for statsCalculator streaks feature
 *  ✓  Added STORAGE_KEYS.SCHEMA_VERSION for migration state tracking
 */

// ─── Schema Version ───────────────────────────────────────────────────────────

/** Bump this when the battle object schema changes. Used by migrationScript. */
export const SCHEMA_VERSION = '2.1.0';

// ─── Core Enums ───────────────────────────────────────────────────────────────

export const BattleResult = /** @type {const} */ ({
  VICTORY: 'Victory',
  DEFEAT:  'Defeat',
  UNKNOWN: 'Unknown',
  DRAW:    'Draw',
});

export const VehicleType = /** @type {const} */ ({
  AVIATION:   'aviation',
  GROUND:     'ground',
  NAVAL:      'naval',
  HELICOPTER: 'helicopter', // FIXED: was 'helicopters' (inconsistent with registry)
});

export const VehicleBaseType = /** @type {const} */ ({
  // Aviation
  FIGHTER:      'fighter',
  BOMBER:       'bomber',
  ASSAULT:      'assault',
  JET_FIGHTER:  'jet_fighter',
  JET_BOMBER:   'jet_bomber',
  UCAV:         'ucav',
  STRIKE_UCAV:  'strike_ucav',
  SCOUT_UCAV:   'scout_ucav',

  // Ground
  LIGHT:      'light',
  MEDIUM:     'medium',
  HEAVY:      'heavy',
  DESTROYER:  'destroyer',
  SPAA:       'aa',
  SPG:        'spg',
  MBT:        'mbt',

  // Naval
  PT_BOAT:       'pt_boat',
  FRIGATE:       'frigate',
  DESTROYER_NAV: 'destroyer_nav',
  CRUISER:       'cruiser',
  BATTLESHIP:    'battleship',
  BARGE:         'barge',
  SUB:           'sub',

  // Helicopters
  ATTACK_HELI:  'attack_heli',
  UTILITY_HELI: 'utility_heli',
});

export const Country = /** @type {const} */ ({
  USA:     'usa',
  GERMANY: 'germany',
  USSR:    'ussr',
  JAPAN:   'japan',
  CHINA:   'china',
  FRANCE:  'france',
  ITALY:   'italy',
  SWEDEN:  'sweden',
  ISRAEL:  'israel',
  BRITAIN: 'britain',
  FINLAND: 'finland',
  REPUBLIC_OF_SOUTH_AFRICA: 'rsa',
  HUNGARY: 'hungary',
});

export const Rank = /** @type {const} */ ({
  I:    'I',
  II:   'II',
  III:  'III',
  IV:   'IV',
  V:    'V',
  VI:   'VI',
  VII:  'VII',
  VIII: 'VIII',
});

// ─── Game Mode Enums ──────────────────────────────────────────────────────────

/**
 * The three core game modes in War Thunder.
 * These cross-cut all vehicle types.
 */
export const GameMode = /** @type {const} */ ({
  ARCADE:    'arcade',
  REALISTIC: 'realistic',
  SIMULATOR: 'simulator',
});

/**
 * In-game battle/mission objective modes.
 * Used to categorise battles and surface win-rate-by-mode stats.
 */
export const BattleMode = /** @type {const} */ ({
  DOMINATION:       'Domination',
  DESTRUCTION:      'Destruction',
  GROUND_STRIKE:    'Ground Strike',
  CONQUEST:         'Conquest',
  BREAK:            'Break',
  NAVAL_DOMINATION: 'Naval Domination',
  NAVAL_CONQUEST:   'Naval Conquest',
  AIR_DOMINATION:   'Air Domination',
  BATTLE:           'Battle',
  SKIRMISH:         'Skirmish',
  ESCORT:           'Escort',
  CUSTOM:           'Custom',
  UNKNOWN:          'Unknown',
});

// ─── Mission Map Enum ─────────────────────────────────────────────────────────

/**
 * All known War Thunder map names as a typed enum.
 * Use MissionMap values when filtering or displaying.
 * Values match what appears in battle log "missionName" fields.
 */
export const MissionMap = /** @type {const} */ ({
  // Europe
  POLAND:                'Poland',
  EASTERN_EUROPE:        'Eastern Europe',
  BERLIN:                'Berlin',
  ADVANCE_TO_THE_RHINE:  'Advance to the Rhine',
  NORMANDY:              'Normandy',
  HURTGEN_FOREST:        'Hürtgen Forest',
  FLANDERS:              'Flanders',
  WALLONIA:              'Wallonia',
  BRESLAU:               'Breslau',
  NORTH_HOLLAND:         'North Holland',
  IBERIAN_CASTLE:        'Iberian Castle',
  ARDENNES:              'Ardennes',
  RUHR:                  'Ruhr',
  RHINE:                 'Rhine',

  // Russia / Eastern Front
  STALINGRAD:            'Stalingrad',
  KUBAN:                 'Kuban',
  CARPATHIANS:           'Carpathians',
  KARELIA:               'Karelia',
  ASH_RIVER:             'Ash River',
  FROZEN_PASS:           'Frozen Pass',
  SEVERSK:               'Seversk-13',
  RED_DESERT:            'Red Desert',

  // Middle East / Africa
  SINAI:                 'Sinai',
  SANDS_OF_SINAI:        'Sands of Sinai',
  EL_ALAMEIN:            'El Alamein',
  MIDDLE_EAST:           'Middle East',
  SUN_CITY:              'Sun City',

  // Asia / Pacific
  VIETNAM:               'Vietnam',
  JUNGLE:                'Jungle',
  PRADESH:               'Pradesh',
  PACIFIC_ISLAND:        'Pacific Island',
  JAPAN:                 'Japan',

  // Americas
  AMERICAN_DESERT:       'American Desert',

  // Other
  ITALY:                 'Italy',
  SWEDEN:                'Sweden',
  ARCTIC:                'Arctic',
  ABANDONED_FACTORY:     'Abandoned Factory',
  TEST_SITE:             'Test Site',     // test/tutorial maps
  TEST_SITE_2271:        'Test Site-2271',
  VOLCANO_VALLEY:        'Volcano Valley',
  UNKNOWN:               'Unknown',
});

/**
 * Normalise raw missionName strings from logs to a canonical MissionMap value.
 * Log names sometimes contain suffixes like "#1", "#2", extra spaces, etc.
 *
 * @param {string} raw  e.g. "Sands of Sinai" or "Domination #2"
 * @returns {string}    canonical MissionMap value, or the cleaned raw string
 */
export function normaliseMissionName(raw) {
  if (!raw) return MissionMap.UNKNOWN;
  const cleaned = String(raw).trim().replace(/\s*#\d+$/, '');
  const found = Object.values(MissionMap).find(
    v => v.toLowerCase() === cleaned.toLowerCase()
  );
  return found || cleaned;
}

/**
 * Normalise raw missionType strings to a canonical BattleMode value.
 *
 * @param {string} raw  e.g. "Domination #1", "Ground Strike ⋣"
 * @returns {string}    canonical BattleMode value
 */
export function normaliseBattleMode(raw) {
  if (!raw) return BattleMode.UNKNOWN;
  const cleaned = String(raw).trim().replace(/\s*#\d+$/, '').replace(/\s+[\u2200-\uFFFF].*$/, '').trim();
  const found = Object.values(BattleMode).find(
    v => v.toLowerCase() === cleaned.toLowerCase()
  );
  return found || cleaned;
}

// ─── Combat Event Kind ────────────────────────────────────────────────────────

export const CombatEventKind = /** @type {const} */ ({
  AIRCRAFT_KILL:   'aircraft',
  GROUND_KILL:     'ground',
  NAVAL_KILL:      'naval',   // ADDED
  AI_KILL:         'ai_kill',
  ASSIST:          'assist',
  SEVERE_DAMAGE:   'severe',
  CRITICAL_DAMAGE: 'critical',
  DAMAGE:          'damage',
  CAPTURE:         'capture',
  SCOUT:           'scout',
  FIRE:            'fire',
});

export const ItemType = /** @type {const} */ ({
  RP:     'rp',
  CRP:    'crp',
  EAGLES: 'eagles',
  SL:     'sl',
  WP:     'wp',
});

// ─── Asset Paths ──────────────────────────────────────────────────────────────

export const ASSET_PATHS = {
  countryFlags:     '/assets/images/wt-country-flags',
  itemTypes:        '/assets/images/wt-items-type',
  vehicleIcons:     '/assets/images/wt-vehicle-icons',
  baseVehicleTypes: '/assets/images/wt-base-vehicle-type',
  ranks:            '/assets/images/wt-ranks',
  ui:               '/assets/images/ui',
};

export const COUNTRY_FLAG_PATHS = Object.fromEntries(
  Object.values(Country).map(c => [c, `${ASSET_PATHS.countryFlags}/country_${c}.svg`])
);

export const BASE_VEHICLE_TYPE_ICONS = {
  [VehicleType.AVIATION]: {
    [VehicleBaseType.FIGHTER]:     `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_fighter.svg`,
    [VehicleBaseType.BOMBER]:      `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_bomber.svg`,
    [VehicleBaseType.ASSAULT]:     `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_assault.svg`,
    [VehicleBaseType.JET_FIGHTER]: `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_jet_fighter.svg`,
    [VehicleBaseType.JET_BOMBER]:  `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_jet_bomber.svg`,
    [VehicleBaseType.UCAV]:        `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_ucav.svg`,
    [VehicleBaseType.STRIKE_UCAV]: `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_strike_ucav.svg`,
    [VehicleBaseType.SCOUT_UCAV]:  `${ASSET_PATHS.baseVehicleTypes}/aviation/icon_scout_ucav.svg`,
  },
  [VehicleType.GROUND]: {
    [VehicleBaseType.LIGHT]:     `${ASSET_PATHS.baseVehicleTypes}/ground-vehicles/icon_tank_light.svg`,
    [VehicleBaseType.MEDIUM]:    `${ASSET_PATHS.baseVehicleTypes}/ground-vehicles/icon_tank_medium.svg`,
    [VehicleBaseType.HEAVY]:     `${ASSET_PATHS.baseVehicleTypes}/ground-vehicles/icon_tank_heavy.svg`,
    [VehicleBaseType.DESTROYER]: `${ASSET_PATHS.baseVehicleTypes}/ground-vehicles/icon_tank_destroyer.svg`,
    [VehicleBaseType.SPAA]:      `${ASSET_PATHS.baseVehicleTypes}/ground-vehicles/icon_tank_aa.svg`,
    [VehicleBaseType.MBT]:       `${ASSET_PATHS.baseVehicleTypes}/ground-vehicles/icon_tank_mbt.svg`,
    [VehicleBaseType.SPG]:       `${ASSET_PATHS.baseVehicleTypes}/ground-vehicles/icon_tank_spg.svg`,
  },
  [VehicleType.NAVAL]: {
    [VehicleBaseType.PT_BOAT]:       `${ASSET_PATHS.baseVehicleTypes}/naval/icon_boat.svg`,
    [VehicleBaseType.FRIGATE]:       `${ASSET_PATHS.baseVehicleTypes}/naval/icon_frigate.svg`,
    [VehicleBaseType.DESTROYER_NAV]: `${ASSET_PATHS.baseVehicleTypes}/naval/icon_destroyer.svg`,
    [VehicleBaseType.CRUISER]:       `${ASSET_PATHS.baseVehicleTypes}/naval/icon_cruiser.svg`,
    [VehicleBaseType.BATTLESHIP]:    `${ASSET_PATHS.baseVehicleTypes}/naval/icon_battleship.svg`,
    [VehicleBaseType.BARGE]:         `${ASSET_PATHS.baseVehicleTypes}/naval/icon_barge.svg`,
    [VehicleBaseType.SUB]:           `${ASSET_PATHS.baseVehicleTypes}/naval/icon_sub.svg`,
  },
  [VehicleType.HELICOPTER]: {
    [VehicleBaseType.ATTACK_HELI]:  `${ASSET_PATHS.baseVehicleTypes}/heli/icon_attack.svg`,
    [VehicleBaseType.UTILITY_HELI]: `${ASSET_PATHS.baseVehicleTypes}/heli/icon_utility.svg`,
  },
};

export const DEFAULT_FALLBACK_ICONS = {
  [VehicleType.AVIATION]:   BASE_VEHICLE_TYPE_ICONS[VehicleType.AVIATION][VehicleBaseType.FIGHTER],
  [VehicleType.GROUND]:     BASE_VEHICLE_TYPE_ICONS[VehicleType.GROUND][VehicleBaseType.MEDIUM],
  [VehicleType.NAVAL]:      BASE_VEHICLE_TYPE_ICONS[VehicleType.NAVAL][VehicleBaseType.PT_BOAT],
  [VehicleType.HELICOPTER]: BASE_VEHICLE_TYPE_ICONS[VehicleType.HELICOPTER][VehicleBaseType.ATTACK_HELI],
};

export const ITEM_TYPE_ICONS = {
  rp:                          `${ASSET_PATHS.itemTypes}/item_type_rp.svg`,
  research_points:             `${ASSET_PATHS.itemTypes}/item_type_rp.svg`,
  crp:                         `${ASSET_PATHS.itemTypes}/item_type_crp.svg`,
  convertible_rp:              `${ASSET_PATHS.itemTypes}/item_type_crp.svg`,
  convertible_research_points: `${ASSET_PATHS.itemTypes}/item_type_crp.svg`,
  eagles:                      `${ASSET_PATHS.itemTypes}/item_type_eagles.svg`,
  golden_eagles:               `${ASSET_PATHS.itemTypes}/item_type_eagles.svg`,
  sl:                          `${ASSET_PATHS.itemTypes}/item_type_warpoints.svg`,
  warpoints:                   `${ASSET_PATHS.itemTypes}/item_type_warpoints.svg`,
  silver_lions:                `${ASSET_PATHS.itemTypes}/item_type_warpoints.svg`,
};

// ─── Parser Section Aliases ───────────────────────────────────────────────────

export const SECTION_ALIASES = {
  aircraftKills:       ['Destruction of aircraft'],
  groundKills:         ['Destruction of ground targets', 'Destruction of ground vehicles'],
  navalKills:          ['Destruction of naval targets', 'Destruction of naval vehicles'],
  assists:             ['Assistance in destroying the enemy'],
  severeDamage:        ['Severe damage to the enemy'],
  criticalDamage:      ['Critical damage to the enemy'],
  damage:              ['Damage to the enemy'],
  captures:            ['Capture of zones'],
  scouts:              ['Scouting of the enemy'],
  awards:              ['Awards'],
  activityTime:        ['Activity Time'],
  timePlayed:          ['Time Played'],
  skillBonus:          ['Skill Bonus'],
  researchedUnit:      ['Researched unit:'],
  researchingProgress: ['Researching progress:'],
  damagedVehicles:     ['Damaged Vehicles'],
  sessionInfo:         ['Session', 'Battle'],
  rewardSection:       ['Rewards', 'Total'],
};

export const SECTION_HEADER_RE = /^(?:Destruction of aircraft|Destruction of ground (?:targets|vehicles)|Destruction of naval (?:targets|vehicles)|Assistance in destroying the enemy|Severe damage to the enemy|Critical damage to the enemy|Damage to the enemy|Capture of zones|Scouting of the enemy|Awards|Activity Time|Time Played|Skill Bonus|Researching progress|Damaged Vehicles|Researched unit|Session|Total)\b/i;

// ─── Regex Patterns ───────────────────────────────────────────────────────────

export const TIME_RE    = /^(?:\d{1,2}:\d{2})(?::\d{2})?$/;
export const PERCENT_RE = /^\d+%$/;
export const DIGIT_RE   = /^\d+$/;

// ─── Country Normalization ────────────────────────────────────────────────────

export const COUNTRY_ALIASES = {
  'usa':            Country.USA,
  'united states':  Country.USA,
  'america':        Country.USA,
  'us':             Country.USA,
  'germany':        Country.GERMANY,
  'deutschland':    Country.GERMANY,
  'ussr':           Country.USSR,
  'soviet union':   Country.USSR,
  'russia':         Country.USSR,
  'japan':          Country.JAPAN,
  'china':          Country.CHINA,
  'prc':            Country.CHINA,
  'france':         Country.FRANCE,
  'italy':          Country.ITALY,
  'sweden':         Country.SWEDEN,
  'israel':         Country.ISRAEL,
  'britain':        Country.BRITAIN,
  'great britain':  Country.BRITAIN,
  'uk':             Country.BRITAIN,
  'united kingdom': Country.BRITAIN,
  'finland':        Country.FINLAND,
  'south africa':   Country.REPUBLIC_OF_SOUTH_AFRICA,
  'rsa':            Country.REPUBLIC_OF_SOUTH_AFRICA,
  'hungary':        Country.HUNGARY,
};

// ─── UI Constants ─────────────────────────────────────────────────────────────

export const UI_COLORS = {
  victory: '#4caf50',
  defeat:  '#f44336',
  draw:    '#ffeb3b',
  sl:      '#d4af37',
  rp:      '#2196f3',
  crp:     '#9c27b0',
  text:    '#ffffff',
  bg:      '#1a1a1a',
  accent:  '#ff9800',
};

// ─── Logic Constants ──────────────────────────────────────────────────────────

export const INVALID_VEHICLE_TOKENS = new Set([
  'unknown', 'n/a', 'na', 'none', 'null', 'shot',
  'by another player', '100%', 'mission points', 'sl', 'rp',
  'total', 'session', 'awards', 'activity',
]);

export const STORAGE_KEYS = {
  BATTLES:           'wt_battles_v2',
  SEEN_FINGERPRINTS: 'wt_seen_fps_v2',
  SEEN_SESSIONS:     'wt_seen_sessions_v1', // NEW: secondary dedup index
  VEHICLE_CACHE:     'wt_vehicle_cache_v1',
  SETTINGS:          'wt_settings_v1',
  THEME:             'wt_theme_preference',
  SCHEMA_VERSION:    'wt_schema_version',   // NEW: tracks last migration run
};

export const DATE_FORMAT_OPTIONS = {
  year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
};

// ─── Awards Metadata ──────────────────────────────────────────────────────────

/**
 * Canonical award names → category + approximate SL value.
 * Extend as more medals are discovered.
 */
export const AWARDS_METADATA = {
  'First Strike':               { category: 'combat',   sl: 500  },
  'Avenger':                    { category: 'combat',   sl: 150  },
  'Tank Rescuer':               { category: 'combat',   sl: 50   },
  'Rank does not matter':       { category: 'combat',   sl: 500  },
  'Thunderer':                  { category: 'ground',   sl: 5000 },
  'Hero of the Sky':            { category: 'skill',    sl: 5000 },
  'Survivor':                   { category: 'survival', sl: 2000 },
  'The Best Squad':             { category: 'teamwork', sl: 1000 },
  'Wingman':                    { category: 'teamwork', sl: 1000 },
  'Safe and Sound: Fighter':    { category: 'survival', sl: 300  },
  'Safe and Sound: Bomber':     { category: 'survival', sl: 300  },
  'Multi strike!':              { category: 'combat',   sl: 100  },
  'Bomber Rescuer':             { category: 'teamwork', sl: 500  },
  'Assists streak!':            { category: 'combat',   sl: 150  },
  'Adamant':                    { category: 'combat',   sl: 300  },
  'Ace':                        { category: 'skill',    sl: 5000 },
  'Ground Forces Ace':          { category: 'skill',    sl: 5000 },
  'Fighter Ace':                { category: 'skill',    sl: 5000 },
  'Headhunter':                 { category: 'combat',   sl: 500  },
  'Bounty Hunter':              { category: 'combat',   sl: 500  },
  'Kill Streak':                { category: 'combat',   sl: 250  },
  'Top Gun':                    { category: 'skill',    sl: 1000 },
  'Master of Defense':          { category: 'capture',  sl: 1000 },
  'Zone Dominator':             { category: 'capture',  sl: 1000 },
  'Battle hero':                { category: 'combat',   sl: 2000 },
  'Ground Pounder':             { category: 'ground',   sl: 500  },
  'Death from Above':           { category: 'aviation', sl: 500  },
  'Anti-Air Gunner':            { category: 'ground',   sl: 300  },
};

// ─── Score Weights ────────────────────────────────────────────────────────────

export const SCORE_WEIGHTS = {
  [GameMode.REALISTIC]: {
    KILL:     300,
    ASSIST:   150,
    CRITICAL:  50,
    AI_KILL:   40,
    DAMAGE:    10,
    CAPTURE:  200,
    SCOUT:     20,
  },
  [GameMode.ARCADE]: {
    KILL:     200,
    ASSIST:   100,
    CRITICAL:  30,
    AI_KILL:   25,
    DAMAGE:     8,
    CAPTURE:  150,
    SCOUT:     15,
  },
  [GameMode.SIMULATOR]: {
    KILL:     500,
    ASSIST:   200,
    CRITICAL:  80,
    AI_KILL:   60,
    DAMAGE:    15,
    CAPTURE:  300,
    SCOUT:     30,
  },
};

// ─── Streak Thresholds ────────────────────────────────────────────────────────

/** Win-streak milestones shown in the UI (for achievement badges, etc.) */
export const STREAK_THRESHOLDS = [3, 5, 10, 15, 20, 25, 50];

// ─── Heuristic Patterns ───────────────────────────────────────────────────────

export const HEURISTIC_PATTERNS = {
  GERMAN_PZ:    /^Pz\.(?:Kpfw\.)?\s*/i,
  US_M_SERIES:  /^M\d+/i,
  USSR_T_SERIES:/^T-\d+/i,
  JAPAN_TYPE:   /^Type\s*\d+/i,
};