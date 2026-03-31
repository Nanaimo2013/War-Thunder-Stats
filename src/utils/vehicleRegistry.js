/**
 * vehicleRegistry.js
 *
 * Central vehicle database for War Thunder.
 * Provides accurate country / type / baseType / rank metadata for every
 * vehicle we know about, avoiding unreliable runtime string-guessing.
 *
 * HOW IT WORKS
 * ────────────
 * 1. `lookupVehicle(name)` checks the REGISTRY first (O(1) map lookup).
 * 2. If the vehicle isn't in the registry, `detectVehicleInfo(name)` runs
 *    a best-effort heuristic and caches the result for the session.
 * 3. Results are memoized so repeated lookups are instant.
 *
 * ADDING VEHICLES
 * ───────────────
 * Add an entry to REGISTRY below.  Key = exact display name from the log
 * (case-sensitive match after normalisation).
 * Value = { country, type, baseType, rank }
 * All values come from the Country / VehicleType / VehicleBaseType / Rank enums.
 *
 * ICON PATH CONVENTION
 * ────────────────────
 * /assets/images/wt-vehicle-icons/{type}/countries/{country}/ranks/{rank}/{iconFile}
 * where iconFile is derived from the vehicle's normalised name.
 * Override per-vehicle with an explicit `iconFile` property.
 */

import {
  Country, VehicleType, VehicleBaseType, Rank,
  ASSET_PATHS, BASE_VEHICLE_TYPE_ICONS, DEFAULT_FALLBACK_ICONS,
} from './constants.js';

// ─── Registry ────────────────────────────────────────────────────────────────
// Format:  'Display Name' : { country, type, baseType, rank [, iconFile] }
//
// Keys are matched after lower-casing + collapsing whitespace so minor
// capitalisation differences in logs don't break anything.
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRY = {

  // ── ── Israel – Aviation ──────────────────────────────────────────────────
  'Kfir C.7':             { country: Country.ISRAEL, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VII },

  // ── ── Sweden – Aviation ──────────────────────────────────────────────────
  'JAS39A':               { country: Country.SWEDEN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VIII },

  // ── ── France – Aviation ──────────────────────────────────────────────────
  'Mirage 2000-5F':       { country: Country.FRANCE, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VIII },
  'Mirage IIIC':          { country: Country.FRANCE, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },

  // ── ── Israel – Ground ──────────────────────────────────────────────────
  'Merkava Mk.4 LIC':     { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'Merkava Mk.4M':        { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Merkava Mk.2B':        { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Merkava Mk.1':         { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Sho\'t Kal Dalet':              { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Sho\'t Kal Dalet':     { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Magach 6':             { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M-51':                 { country: Country.ISRAEL, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },

  // ── ── Italy – Ground ──────────────────────────────────────────────────
  'Otomatic':             { country: Country.ITALY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'Ariete AMV':           { country: Country.ITALY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'Ariete':               { country: Country.ITALY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Centauro':             { country: Country.ITALY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Aubl/74':              { country: Country.ITALY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'Breda 501':            { country: Country.ITALY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'L3/33 CC':             { country: Country.ITALY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },

  // ── ── China – Ground ──────────────────────────────────────────────────
  'PGZ09':                { country: Country.CHINA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VI },
  'VT-4A1':               { country: Country.CHINA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'ZTZ99A':               { country: Country.CHINA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'ZTZ96A':               { country: Country.CHINA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Type 69':              { country: Country.CHINA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'Type 59':              { country: Country.CHINA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M48A1 (China)':        { country: Country.CHINA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },

  // ── ── Japan – Ground ──────────────────────────────────────────────────
  'Type 81 (C)':          { country: Country.JAPAN, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'Type 87':              { country: Country.JAPAN, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VI },
  'Type 16 (FPS)':        { country: Country.JAPAN, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Type 74':              { country: Country.JAPAN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Type 61':              { country: Country.JAPAN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'Ho-Ri Production':     { country: Country.JAPAN, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'Chi-Ri II':            { country: Country.JAPAN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },

  // ── ── Britain – Ground ──────────────────────────────────────────────────
  'Stormer HVM':          { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'Rooikat 105':          { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Warrior':              { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Challenger 3 (TD)':    { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'Challenger 2 TES':     { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Challenger 2 (2F)':    { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Vickers Mk.7':         { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Vickers Mk.1':         { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'Tortoise':             { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'Black Prince':         { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'Avre Churchhill':      { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.III },
  'Sherman Firefly':      { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'Valentine IX':         { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'Matilda III':          { country: Country.BRITAIN, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.II },
  // ── Germany – Aviation ───────────────────────────────────────────────────
  'MiG-29G':           { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VIII },
  'MiG-21MF':          { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },
  'Bf 109 B-1':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.I },
  'Bf 109 E-1':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II },
  'Bf 109 E-3':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II },
  'Bf 109 E-7':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II },
  'Bf 109 F-1':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II },
  'Bf 109 F-4':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Bf 109 G-2':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Bf 109 G-6':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Bf 109 G-10':  { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'Bf 109 G-14':  { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'Bf 109 K-4':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'Fw 190 A-1':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II },
  'Fw 190 A-4':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Fw 190 A-5':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Fw 190 A-8':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'Fw 190 D-9':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'Fw 190 D-12':  { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'Me 262 A-1a':  { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'Me 410 A-1':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER, rank: Rank.III },
  'He 111 H-6':   { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER, rank: Rank.III },
  'Ju 87 B-2':    { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.II },
  'Ju 87 D-3':    { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.III },
  'Ju 88 A-1':    { country: Country.GERMANY, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER, rank: Rank.II },

  // ── Germany – Ground ─────────────────────────────────────────────────────
  'BMP-1 (Germany)':               { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.V },
  'Befehlswagen IV':               { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'Bergepanther':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'Bfw. Jagdpanther':              { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'Class 3 (P)':                   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Coelian':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.IV },
  'DF105':                         { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'Dicker Max':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'E-100':                         { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.V },
  'Elefant':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'Ersatz M10':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'Ferdinand':                     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'FlaRakRad':         { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'FlaRakPz 1':        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'Flakpanzer I':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.I },
  'Gepard':                        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VI },
  'Hetzer':                        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'JaPz.K A2':                     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.VI },
  'Jagdpanzer IV/70(A)':           { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'Jagdpanzer IV/70(V)':           { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'KPz-70':                        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Kanonenjagdpanzer':             { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'Kugelblitz':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.IV },
  'Leopard 1A5':                   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Leopard 2 (PzBtl 123)':         { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Leopard 2 PL':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Leopard 2K':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Leopard A1A1 (L/44)':           { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'M48A2 C':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M48A2 G A2':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'Marder III':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.II },
  'Marder III H':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.II },
  'Nashorn':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'Ostwind II':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.IV },
  'Ozelot':                        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VI },
  'Panther F':                     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'Panther II':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'Panzerbefehlswagen VI (P)':     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'Panzerbeobachtungswagen IV':    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'Puma':              { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Begleitpanzer 57':  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Leopard 2A7V':      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'Maus':              { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.V },
  'Puma VJTF':                     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Pz.35(t)':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.38(t) A':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.38(t) F':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.38(t) n.A.':                 { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'Pz.I C':                        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.II C':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.II C (DAK)':                 { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.II F':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.II J':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Pz.III B':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.I },
  'Pz.III E':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.I },
  'Pz.III F':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.I },
  'Pz.III J1':                     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'Pz.III L':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'Pz.III N':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'Pz.IV C':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.I },
  'Pz.IV F1':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'Pz.IV J':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'Radkampfwagen 90':              { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Raketenjagdpanzer 2':           { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.V },
  'Raketenjagdpanzer 2 (HOT)':     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.VI },
  'Ru 251':                        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'SK-105A2':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Sd.Kfz. 10/4':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.I },
  'Sd.Kfz. 221 (s.Pz.B.41)':       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Sd.Kfz. 222':                   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Sd.Kfz. 234/1':                 { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'Sd.Kfz. 234/2 Puma':            { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'Sd.Kfz. 234/3':                 { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'Sd.Kfz. 234/4':                 { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'Sd.Kfz. 6/2':                   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.II },
  'Sd.Kfz.251/22':                 { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.II },
  'Sd.Kfz.251/9':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.II },
  'StuG III F':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'StuG IV':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'StuH 42 G':                     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.II },
  'Sturer Emil':                   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'T-72M1 (Germany)':              { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'TAM':                           { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'TAM 2C':                        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VII },
  'TAM 2IP':                       { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Tiger II (10.5 cm KwK)':        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.V },
  'Tiger II (H) Sla.16': { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'Pz.II':        { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.I   },
  'Pz.III J':     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.II  },
  'Pz.III M':     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.II  },
  'Pz.IV E':      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.II  },
  'Pz.IV F2':     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'Pz.IV G':      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'Pz.IV H':      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'Panther A':    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.IV  },
  'Panther D':    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'Panther G':    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.IV  },
  'Tiger H1':     { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.III },
  'Tiger E':      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.III },
  'Tiger II (H)': { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.IV  },
  'Tiger II (P)': { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.IV  },
  'Jagdpanzer IV':{ country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.III },
  'Jagdpanther':  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.IV  },
  'Jagdtiger':    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.IV  },
  'StuG III A':   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.II  },
  'StuG III G':   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.III },
  'Leopard 1':    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'Leopard A1A1': { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'Leopard 2A4':  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VII },
  'Leopard 2A5':  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VII },
  'Leopard 2A6':  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VIII},
  'Turm III':                      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'VK 30.02 (M)':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'VK 45.01 (P)':                  { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.III },
  'VT1-2':                         { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.VI },
  'Wiesel 1A2':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Wiesel 1A4':                    { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.V },
  'Wirbelwind':   { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA,     rank: Rank.III },
  'Ostwind':      { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA,     rank: Rank.III },
  'leKPz M41':                          { country: Country.GERMANY, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },

  // ── USSR – Aviation ───────────────────────────────────────────────────────
  'Su-39':             { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.VII },
  'Yak-3P':            { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'I-15':         { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.I   },
  'I-16 type 5':  { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.I   },
  'I-16 type 18': { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'LaGG-3-11':    { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'La-5':         { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'La-5FN':       { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'La-7':         { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'La-9':         { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'Yak-1':        { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'Yak-3':        { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Yak-9':        { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Yak-9P':       { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'MiG-3-15':     { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'MiG-9':        { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'MiG-15':       { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'MiG-15bis':    { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'MiG-17':       { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'MiG-19PT':     { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },
  'MiG-21F-13':   { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },
  'MiG-21bis':    { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VII },
  'Su-25':        { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.VII },
  'IL-2 (1941)':  { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.II  },
  'IL-2M type 3': { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.III },
  'Pe-2-31':      { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER, rank: Rank.II   },
  'Tu-2S':        { country: Country.USSR, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER, rank: Rank.IV   },

  // ── USSR – Ground ─────────────────────────────────────────────────────────
  'ZSU-23-4':          { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.V },
  'BMP-2M':            { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VII },
  '2S38':              { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VII },
  'T-80BVM':           { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'T-72B3':            { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'T-64B':             { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'T-34-85 (D-5T)':    { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'BT-5':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.I   },
  'BT-7':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.I   },
  'T-26':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.I   },
  'T-34 (1940)':  { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.II  },
  'T-34 (1941)':  { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.II  },
  'T-34 (1942)':  { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'T-34-57':      { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'T-34-85':      { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.IV  },
  'T-44':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.IV  },
  'T-54 (1947)':  { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.V   },
  'T-55A':        { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'T-62':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'T-64A':        { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'T-72A':        { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VII },
  'T-80B':        { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VII },
  'T-80U':        { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VIII},
  'KV-1 (L-11)':  { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.II  },
  'KV-1 (ZiS-5)': { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.III },
  'KV-2 (1940)':  { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.III },
  'IS-1':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.IV  },
  'IS-2':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.IV  },
  'IS-3':         { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.V   },
  'SU-85':        { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.III },
  'SU-100':       { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.IV  },
  'SU-122':       { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.III },
  'ZSU-57-2':     { country: Country.USSR, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA,     rank: Rank.V   },

  // ── USA – Aviation ────────────────────────────────────────────────────────
  'F-14B':             { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VIII },
  'F-4E Phantom II':   { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VII },
  'F-4C Phantom II':   { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },
  'F-86F-25 Sabre':    { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'F4U-4B Corsair':    { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'P-47D-28 Thunderbolt': { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'P-51D-5 Mustang':   { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'P-36A':        { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.I   },
  'P-39N-0':      { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'P-39Q-5':      { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'P-40E-1':      { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'P-47D-25':     { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'P-47D-28':     { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'P-51D-5':      { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'P-51D-20NA':   { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'P-63A-5':      { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'F4U-1A':       { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'F4U-4':        { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'F-80A-5':      { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'F-86A-5':      { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'F-86F-25':     { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'F-100D':       { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },
  'F-4C':         { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VII },
  'F-16A':        { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VIII },
  'A-10A':        { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.VIII },
  'B-17E':        { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER, rank: Rank.III },
  'B-29A-BN':     { country: Country.USA, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER, rank: Rank.V   },

  // ── USA – Ground ──────────────────────────────────────────────────────────
  '120mm M103':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.V },
  'ADATS':             { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'CCVL':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'Cobra King':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'IPM1':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'LAV-AD':            { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VI },
  'LVT(A)(1)':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'LVT-4/40':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'M1 KVT':                        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'M10 TFP':                       { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.II },
  'M13 MGMC':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.I },
  'M15A1 CGMC':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.II },
  'M16 MGMC':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.I },
  'M163 VADS':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.V },
  'M18 Black Cat':                 { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.III },
  'M18 Hellcat':                   { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.III },
  'M19A1':                         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.III },
  'M1A1 Click-Bait':               { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'M1A1 FEP':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'M1A2 Abrams':                   { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'M1A2 SEP':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'M2 Medium':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.I },
  'M22 Locust':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'M24 (TL)':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'M24 Chaffee':                   { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'M247 York':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VI },
  'M26 Pershing':                  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'M26 T99':                       { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'M26E1':                         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'M2A2':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'M2A4':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'M2A4 (1st Arm.Div.)':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'M3 Lee':                        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.I },
  'M36 GMC':                       { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'M3A1 (USMC)':                   { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'M3A1 Stuart':                   { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'M4 Sherman':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'M4/T26':                        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'M41A1 Walker Bulldog':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'M42 Duster':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.III },
  'M46 Patton':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M46 Tiger':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M47 Patton':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M48A1 Patton':                  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M4A1 (76) W Sherman':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'M4A1 Sherman':                  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'M4A2 (76) W Sherman':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'M4A2 Sherman':                  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.III },
  'M4A3 (105) Sherman':            { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'M4A3 (76) W Sherman':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'M4A3E2 (76) W Jumbo':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'M4A3E2 Jumbo':                  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'M4A4':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'M50 Ontos':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'M551 Sheridan':                 { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'M551(76)':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'M56 Scorpion':                  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'M5A1 (5th Arm.Div.)':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'M5A1 Stuart':                   { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.II },
  'M60 AMBT':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'M60 Patton':                    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'M60A1 RISE (P)':                { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'M60A2 Starship':                { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'M60A3 TTS':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'M6A1':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.III },
  'M7 Medium':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'M8 Greyhound':                  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.I },
  'M8 Scott':                      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.I },
  'M8A1':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.I },
  'MBT-70':                        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'T114':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.V },
  'T14':                           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.II },
  'T1E1':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.III },
  'T26E1-1 Super Pershing':        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'T28':                           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'T32':                           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'T32E1':                         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'T34':               { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'T30':               { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'T29':               { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'T26E5':             { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.IV },
  'M1A2 SEP V2':       { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'M1A1 HC':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'M1A1 AIM':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'M1128 MGS':         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.VII },
  'HSTV-L':            { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VII },
  'M3A3 Bradley':      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VII },
  'M3 Bradley':        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'M3 Stuart':    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.I   },
  'M5A1':         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.II  },
  'M4':           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.II  },
  'M4A1':         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.II  },
  'M4A2':         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'M4A3 (75) W':  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.III },
  'M4A3E2':       { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.III },
  'M4A3E8':       { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.IV  },
  'M26':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.IV  },
  'M46':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.V   },
  'M47':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.V   },
  'M48A1':        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.V   },
  'M60':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'M60A1 (AOS)':  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'M1 Abrams':    { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VII },
  'M1A1 Abrams':  { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VIII},
  'M36':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.III },
  'M10 GMC':      { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.III },
  'M36B2':        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER,rank: Rank.IV  },
  'M42':          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA,     rank: Rank.V   },

  'T54E1':                         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'T77E1':                         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.II },
  'T92':                           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'T95':                           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'VFM5':                          { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'XM-1 (Chrysler)':               { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'XM-1 (GM)':                     { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'XM1069':                        { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'XM8':                           { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VI },
  'XM803':                         { country: Country.USA, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  // ── Japan – Aviation ──────────────────────────────────────────────────────
  'F-15J':             { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VIII },
  'F-4EJ Kai':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VII },
  'F-1':               { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },
  'A6M5 Zero':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'A5M4':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.I   },
  'A6M2':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'A6M3':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'A6M5':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'A6M5 Ko':      { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'Ki-27 otsu':   { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.I   },
  'Ki-43-I':      { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'Ki-43-III Ko': { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Ki-61-I Ko':   { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Ki-84 Ko':     { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'J2M2':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'J2M3':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'N1K2-J':       { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'B5N2':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER,  rank: Rank.II  },
  'D3A1':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.ASSAULT, rank: Rank.II  },
  'D4Y2':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER,  rank: Rank.III },
  'G4M1':         { country: Country.JAPAN, type: VehicleType.AVIATION, baseType: VehicleBaseType.BOMBER,  rank: Rank.II  },

  // ── Britain – Aviation ────────────────────────────────────────────────────
  'Gripen C':          { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VIII },
  'Sea Harrier FRS.1': { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VII },
  'Lightning F.6':     { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },
  'Meteor F Mk.8 G.41K': { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'Spitfire F Mk.24':  { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV },
  'Spitfire Mk.Vb':    { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Spitfire Mk Ia':   { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'Spitfire Mk IIa':  { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'Spitfire Mk Vc':   { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Spitfire Mk IX':   { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Spitfire Mk XIV':  { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'Spitfire F Mk 22': { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'Hurricane Mk I':   { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.I   },
  'Hurricane Mk IIb': { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.II  },
  'Typhoon Mk Ib':    { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.III },
  'Tempest Mk V':     { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.FIGHTER, rank: Rank.IV  },
  'Meteor F Mk 3':    { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'Meteor F Mk 8':    { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.V },
  'Hunter FGA.9':     { country: Country.BRITAIN, type: VehicleType.AVIATION, baseType: VehicleBaseType.JET_FIGHTER, rank: Rank.VI },

  // ── France – Ground ───────────────────────────────────────────────────────
  'E.B.R. (1963)':                      { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.IV },
  'ItO 90M':           { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.SPAA, rank: Rank.VII },
  'Leclerc AZUR':      { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'Leclerc SXXI':      { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'AMX-40':            { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VI },
  'ARL-44':            { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY, rank: Rank.III },
  'AMX-13':       { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.V   },
  'AMX-30':       { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'AMX-30B2':     { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'Leclerc':      { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VIII},
  'B1 bis':       { country: Country.FRANCE, type: VehicleType.GROUND, baseType: VehicleBaseType.HEAVY,    rank: Rank.II  },

  // ── Sweden – Ground ───────────────────────────────────────────────────────
  'Bkan 1C':                            { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.IV },
  'CV 90120':          { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VII },
  'Strv 122B+':        { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VIII },
  'Strv 122B PLSS':    { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Strv 121':          { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.VII },
  'Strf 9040C':        { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT, rank: Rank.VII },
  'Strv 101':          { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.V },
  'Strv 81':           { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.IV },
  'Pvkv II':           { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.DESTROYER, rank: Rank.III },
  'Strv m/42 EH':      { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM, rank: Rank.II },
  'Strv 103-0':   { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'Strv 103A':    { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VI  },
  'Strv 103C':    { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VII },
  'Strv 122':     { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.MEDIUM,   rank: Rank.VIII},
  'Ikv 91':       { country: Country.SWEDEN, type: VehicleType.GROUND, baseType: VehicleBaseType.LIGHT,    rank: Rank.V   },
};

// ─── Internal normalisation ───────────────────────────────────────────────────

/** Normalise a display name to a registry key */
function toKey(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Build the normalized registry map (keyed by toKey(displayName)) */
const _registryMap = new Map(
  Object.entries(REGISTRY).map(([k, v]) => [toKey(k), { displayName: k, ...v }])
);

// ─── Heuristic fallback ───────────────────────────────────────────────────────
// Only runs when a vehicle isn't in the registry.
// These patterns are intentionally conservative — wrong guesses are worse
// than defaulting to a generic icon.

/** @param {string} name */
function detectTypeHeuristic(name) {
  const n = name.toLowerCase();
  // Ground first — less ambiguous prefixes
  if (/\b(pz|panzer|tiger|panther|stug|jagd|t-\d|kv-\d|is-\d|su-\d|m4\b|m48|m60|m1\b|leclerc|leopard|strv|centurion|chieftain|challenger|abrams|merkava|type \d\d|chi-|ha-|ho-|ro-)\b/.test(n)) {
    return VehicleType.GROUND;
  }
  // Aviation patterns
  if (/\b(bf \d|fw \d|me \d|he \d|ju \d|do \d|p-\d|f-\d|f\d[a-z]|a-\d|b-\d|il-\d|mig-\d|yak-\d|la-\d|su-\d\d|ki-\d|a6m|j2m|n1k|spitfire|hurricane|typhoon|tempest|meteor|hunter|harrier)\b/.test(n)) {
    return VehicleType.AVIATION;
  }
  return VehicleType.AVIATION; // safe default
}

/** @param {string} name @param {string} type */
function detectBaseTypeHeuristic(name, type) {
  const n = name.toLowerCase();
  if (type === VehicleType.GROUND) {
    if (/\b(tiger|is-\d|kv-\d|matilda|churchill|maus|e-100)\b/.test(n)) return VehicleBaseType.HEAVY;
    if (/\b(jagd|stug|td|su-\d{2,}|m10|m36|m18|hellcat|achilles|wolverine|elefant|ferdinand|hetzer)\b/.test(n)) return VehicleBaseType.DESTROYER;
    if (/\b(wirbelwind|ostwind|gepard|zsu|m42|r3|flak|aa|spaa)\b/.test(n)) return VehicleBaseType.SPAA;
    if (/\b(stuart|m3\b|m5|bren|daimler|aml|bt-\d|t-\d0\b|t-26|t-60|t-70|amx-13|ikv|pbil|m22|m24)\b/.test(n)) return VehicleBaseType.LIGHT;
    return VehicleBaseType.MEDIUM;
  }
  // Aviation
  if (/\b(b-\d|he 111|ju 88|pe-\d|tu-\d|g4m|b5n|lancaster|halifax|b-17|b-24|b-29|am-1)\b/.test(n)) return VehicleBaseType.BOMBER;
  if (/\b(il-\d|ju 87|d3a|d4y|a-10|su-25|a-36|typhoon|im\d)\b/.test(n)) return VehicleBaseType.ASSAULT;
  if (/\b(mig-\d\d|f-\d|meteor|hunter|harrier|mirage|f-86|f-80|me 262|yak-\d\d|la-\d\d|ki-200)\b/.test(n)) return VehicleBaseType.JET_FIGHTER;
  return VehicleBaseType.FIGHTER;
}

/** @param {string} name */
function detectCountryHeuristic(name) {
  const n = name.toLowerCase();
  if (/\b(bf|me|fw|he|ju|do|pz|panzer|tiger|panther|stug|jagd|leopard|gepard)\b/.test(n)) return Country.GERMANY;
  if (/\b(mig|yak|la-|il-|su-\d|pe-|tu-|t-\d|kv|is-\d|bt-|zsu|strela)\b/.test(n)) return Country.USSR;
  if (/\b(p-\d|f-\d|b-\d|a-\d|m4\b|m48|m60|m1\b|abrams|f4u|f-86|f-80|a-10)\b/.test(n)) return Country.USA;
  if (/\b(a6m|ki-|j2m|n1k|d3a|d4y|g4m|b5n|type \d\d chi|type \d\d ho|type \d\d ha)\b/.test(n)) return Country.JAPAN;
  if (/\b(spitfire|hurricane|typhoon|tempest|meteor|hunter|harrier|challenger|chieftain|centurion)\b/.test(n)) return Country.BRITAIN;
  if (/\b(amx|leclerc|char b|somua|b1 bis|arl)\b/.test(n)) return Country.FRANCE;
  if (/\b(strv|ikv|pbil|cv 90|gripen)\b/.test(n)) return Country.SWEDEN;
  if (/\b(carro|p40|m13|m14|m15|centauro|ariete)\b/.test(n)) return Country.ITALY;
  return Country.USA; // last resort
}

/** @param {string} name */
function detectRankHeuristic(_name) {
  // Without knowing the actual BR we can't reliably detect rank from name alone.
  // Return null and let the caller decide whether to show 'unknown'.
  return null;
}

// ─── Session-level cache for heuristic results ────────────────────────────────

const _heuristicCache = new Map();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up a vehicle by its display name (as it appears in a battle log).
 * Returns a VehicleInfo object. Never throws.
 *
 * @param {string} rawName
 * @returns {{
 *   displayName: string,
 *   country: string,
 *   type: string,
 *   baseType: string,
 *   rank: string|null,
 *   fromRegistry: boolean,
 *   iconPath: string,
 *   flagPath: string,
 * }}
 */
export function lookupVehicle(rawName) {
  const key = toKey(rawName);
  if (!key) return _unknownVehicle(rawName);

  // 1. Registry hit
  const entry = _registryMap.get(key);
  if (entry) return _buildInfo(rawName, entry, true);

  // 2. Heuristic cache hit
  if (_heuristicCache.has(key)) return _heuristicCache.get(key);

  // 3. Heuristic detection
  const type      = detectTypeHeuristic(key);
  const baseType  = detectBaseTypeHeuristic(key, type);
  const country   = detectCountryHeuristic(key);
  const rank      = detectRankHeuristic(key);
  const result    = _buildInfo(rawName, { type, baseType, country, rank }, false);

  _heuristicCache.set(key, result);
  return result;
}

/**
 * Returns a display-safe icon path for the vehicle.
 * Tries the specific vehicle icon first, falls back to base type icon.
 */
export function getVehicleIconPath(info) {
  if (!info) return null;
  const { type, country, rank, displayName } = info;
  if (!type || !country) return DEFAULT_FALLBACK_ICONS[type] || null;

  const slug = toKey(displayName).replace(/[\s.()]/g, '_').replace(/[^a-z0-9_-]/g, '');
  const specific = rank
    ? `${ASSET_PATHS.vehicleIcons}/${type}/countries/${country}/ranks/${rank}/${slug}.svg`
    : null;

  // We return the specific path — callers can handle 404 and fall back to info.fallbackIconPath
  return specific || info.fallbackIconPath;
}

/** Returns all vehicles in the registry as an array (useful for autocomplete / debugging) */
export function getAllRegistryVehicles() {
  return Array.from(_registryMap.values());
}

/** Register a new vehicle at runtime (e.g. learned from a log) */
export function registerVehicle(displayName, meta) {
  const key = toKey(displayName);
  _registryMap.set(key, { displayName, ...meta });
  _heuristicCache.delete(key); // prefer registry entry going forward
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _buildInfo(rawName, entry, fromRegistry) {
  const { country, type, baseType, rank } = entry;
  const fallbackIconPath = BASE_VEHICLE_TYPE_ICONS[type]?.[baseType]
    || DEFAULT_FALLBACK_ICONS[type]
    || null;

  return {
    displayName:     rawName,
    country:         country  || Country.USA,
    type:            type     || VehicleType.AVIATION,
    baseType:        baseType || VehicleBaseType.FIGHTER,
    rank:            rank     || null,
    fromRegistry,
    fallbackIconPath,
    flagPath:        `${ASSET_PATHS.countryFlags}/country_${country}.svg`,
  };
}

function _unknownVehicle(rawName) {
  return {
    displayName:     rawName || 'Unknown',
    country:         null,
    type:            null,
    baseType:        null,
    rank:            null,
    fromRegistry:    false,
    fallbackIconPath:null,
    flagPath:        null,
  };
}