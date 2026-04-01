/**
 * assetManager.js
 *
 * Thin, focused asset resolver built on top of vehicleRegistry + constants.
 *
 * All the heavy lifting (country / type / rank detection, registry lookup,
 * fallback icon selection) lives in vehicleRegistry.js.  This file is purely
 * about resolving final paths and providing a clean API to UI components.
 */

import { lookupVehicle, getVehicleIconPath } from './vehicleRegistry.js';
import {
  COUNTRY_FLAG_PATHS, ITEM_TYPE_ICONS, BASE_VEHICLE_TYPE_ICONS,
  DEFAULT_FALLBACK_ICONS, COUNTRY_ALIASES,
} from './constants.js';

export const extractVehicleInfo = lookupVehicle;

// ─── Country flag ──────────────────────────────────────────────────────────────

/**
 * Returns the SVG path for a country's flag.
 * Accepts any of the aliases defined in COUNTRY_ALIASES.
 *
 * @param {string} country  e.g. 'germany', 'ussr', 'Great Britain'
 * @returns {string|null}
 */
export function getCountryFlag(country) {
  if (!country) return null;
  const key = String(country).toLowerCase().trim();
  const canonical = COUNTRY_ALIASES[key] || key;
  return COUNTRY_FLAG_PATHS[canonical] || null;
}

// ─── Vehicle icon ──────────────────────────────────────────────────────────────

/**
 * Returns the best icon path for a vehicle.
 *
 * Resolution order:
 *  1. Specific icon path from registry (precise vehicle icon)
 *  2. Fallback base-type icon (e.g. medium tank silhouette)
 *  3. null
 *
 * To handle a missing specific icon gracefully in your UI:
 *   <img src={getVehicleIcon(name)} onError={e => e.target.src = info.fallbackIconPath} />
 *
 * @param {string} vehicleName  Display name as it appears in the log
 * @param {{ country?: string, type?: string, rank?: string }} [overrides]
 *   Pass explicit overrides if you already know metadata (avoids lookup).
 * @returns {{ specificPath: string|null, fallbackPath: string|null, info: Object }}
 */
export function getVehicleIcon(vehicleName, overrides = {}) {
  const info = lookupVehicle(vehicleName);

  // Allow caller to override auto-detected fields (useful for known vehicles)
  const merged = { ...info, ...overrides };

  const specificPath  = getVehicleIconPath(merged);
  const fallbackPath  = merged.fallbackIconPath || DEFAULT_FALLBACK_ICONS[merged.type] || null;

  return { specificPath, fallbackPath, info: merged };
}

// ─── Item type icon ────────────────────────────────────────────────────────────

/**
 * Returns the icon path for a reward/currency type.
 *
 * @param {string} itemType  e.g. 'rp', 'sl', 'eagles', 'crp'
 * @returns {string|null}
 */
export function getItemTypeIcon(itemType) {
  if (!itemType) return null;
  const key = String(itemType).toLowerCase().replace(/\s+/g, '_');
  return ITEM_TYPE_ICONS[key] || null;
}

// ─── Base vehicle type icon ────────────────────────────────────────────────────

/**
 * Returns the generic silhouette icon for a vehicle type + base type.
 *
 * @param {string} vehicleType  VehicleType enum value ('aviation'|'ground'|'naval')
 * @param {string} [baseType]   VehicleBaseType enum value (auto-selects default if omitted)
 * @returns {string|null}
 */
export function getBaseVehicleTypeIcon(vehicleType, baseType) {
  if (!vehicleType) return null;
  const typeMap = BASE_VEHICLE_TYPE_ICONS[vehicleType];
  if (!typeMap) return null;
  if (baseType && typeMap[baseType]) return typeMap[baseType];
  return DEFAULT_FALLBACK_ICONS[vehicleType] || null;
}

// ─── Batch helpers ────────────────────────────────────────────────────────────

/**
 * Given a battle's vehicle list, build a map of displayName → icon paths.
 * This is what UI components should call instead of iterating themselves.
 *
 * @param {Object[]} vehicles  battle.vehicles array
 * @returns {Map<string, { specificPath: string|null, fallbackPath: string|null }>}
 */
export function buildVehicleIconMap(vehicles) {
  const map = new Map();
  for (const v of vehicles || []) {
    const { specificPath, fallbackPath } = getVehicleIcon(v.displayName);
    map.set(v.displayName, { specificPath, fallbackPath });
  }
  return map;
}

/**
 * Given a battle's vehicle list, build a map of country → flag path.
 * Deduped — one entry per unique country.
 *
 * @param {Object[]} vehicles  battle.vehicles array
 * @returns {Map<string, string>}
 */
export function buildCountryFlagMap(vehicles) {
  const map = new Map();
  for (const v of vehicles || []) {
    if (v.country && !map.has(v.country)) {
      map.set(v.country, getCountryFlag(v.country));
    }
  }
  return map;
}

// ─── Asset preloader ──────────────────────────────────────────────────────────

/**
 * Preloads the most commonly used static assets into the browser's cache.
 * Call once on app startup.
 */
export function preloadCommonAssets() {
  if (typeof Image === 'undefined') return; // SSR / non-browser

  const paths = [
    ...Object.values(COUNTRY_FLAG_PATHS),
    ...Object.values(ITEM_TYPE_ICONS),
    ...Object.values(DEFAULT_FALLBACK_ICONS),
    // All base type fallbacks
    ...Object.values(BASE_VEHICLE_TYPE_ICONS).flatMap(m => Object.values(m)),
  ];

  let loaded = 0;
  const unique = [...new Set(paths.filter(Boolean))];
  for (const src of unique) {
    const img = new Image();
    img.onload = () => { loaded++; };
    img.src = src;
  }

  console.log(`[assetManager] Preloading ${unique.length} common assets`);
}

// ─── Debug ────────────────────────────────────────────────────────────────────

export function debugAssets() {
  console.group('[assetManager] Asset debug');
  console.log('Country flags:', COUNTRY_FLAG_PATHS);
  console.log('Item types:',    ITEM_TYPE_ICONS);
  console.log('Base types:',    BASE_VEHICLE_TYPE_ICONS);
  console.log('Fallbacks:',     DEFAULT_FALLBACK_ICONS);
  console.groupEnd();
}

const assetManager = {  
  getCountryFlag,
  getVehicleIcon,
  getItemTypeIcon,
  getBaseVehicleTypeIcon,
  buildVehicleIconMap,
  buildCountryFlagMap,
  preloadCommonAssets,
  debugAssets,
};
export default assetManager;