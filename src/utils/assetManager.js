// War Thunder Asset Manager
// Centralized asset loading and mapping for vehicle icons, country flags, and item types

// Vehicle name normalization function
const normalizeVehicleName = (vehicleName) => {
  if (!vehicleName) return '';
  return vehicleName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
    .replace(/[()-]/g, '');
};

// Country name normalization
const normalizeCountryName = (countryName) => {
  if (!countryName) return '';
  const countryMap = {
    'usa': 'usa',
    'united states': 'usa',
    'germany': 'germany',
    'deutschland': 'germany',
    'ussr': 'ussr',
    'soviet union': 'ussr',
    'russia': 'ussr',
    'japan': 'japan',
    'china': 'china',
    'france': 'france',
    'italy': 'italy',
    'sweden': 'sweden',
    'israel': 'israel'
  };
  
  const normalized = countryName.toLowerCase().trim();
  return countryMap[normalized] || normalized;
};

// Vehicle icon mapping (will be populated dynamically)
const vehicleIconMap = {
  aviation: {
    germany: {
      I: {},
      II: {},
      III: {},
      IV: {},
      V: {},
      VI: {},
      VII: {},
      VIII: {}
    },
    usa: {
      I: {},
      II: {},
      III: {},
      IV: {},
      V: {},
      VI: {},
      VII: {},
      VIII: {}
    }
  },
  ground_vehicles: {
    germany: {
      I: {},
      II: {},
      III: {},
      IV: {},
      V: {},
      VI: {},
      VII: {},
      VIII: {}
    },
    usa: {
      I: {},
      II: {},
      III: {},
      IV: {},
      V: {},
      VI: {},
      VII: {},
      VIII: {}
    }
  }
};

// Country flag mapping
const countryFlagMap = {
  'usa': '/assets/images/wt-country-flags/country_usa.svg',
  'germany': '/assets/images/wt-country-flags/country_germany.svg',
  'ussr': '/assets/images/wt-country-flags/country_ussr.svg',
  'japan': '/assets/images/wt-country-flags/country_japan.svg',
  'china': '/assets/images/wt-country-flags/country_china.svg',
  'france': '/assets/images/wt-country-flags/country_france.svg',
  'italy': '/assets/images/wt-country-flags/country_italy.svg',
  'sweden': '/assets/images/wt-country-flags/country_sweden.svg',
  'israel': '/assets/images/wt-country-flags/country_israel.svg'
};

// Item type icon mapping
const itemTypeMap = {
  // Research Points
  'rp': '/assets/images/wt-items-type/item_type_rp.svg',
  'research_points': '/assets/images/wt-items-type/item_type_rp.svg',
  // Convertible Research Points
  'crp': '/assets/images/wt-items-type/item_type_crp.svg',
  'convertible_research_points': '/assets/images/wt-items-type/item_type_crp.svg',
  'convertible_rp': '/assets/images/wt-items-type/item_type_crp.svg',
  // Golden Eagles
  'eagles': '/assets/images/wt-items-type/item_type_eagles.svg',
  'golden_eagles': '/assets/images/wt-items-type/item_type_eagles.svg',
  // Silver Lions (Warpoints)
  'warpoints': '/assets/images/wt-items-type/item_type_warpoints.svg',
  'silver_lions': '/assets/images/wt-items-type/item_type_warpoints.svg',
  'sl': '/assets/images/wt-items-type/item_type_warpoints.svg'
};

// Base vehicle type icons (fallbacks)
const baseVehicleTypeMap = {
  aviation: {
    'fighter': '/assets/images/wt-base-vehicle-type/aviation/icon_fighter.svg',
    'bomber': '/assets/images/wt-base-vehicle-type/aviation/icon_bomber.svg',
    'assault': '/assets/images/wt-base-vehicle-type/aviation/icon_assault.svg',
    'jet': '/assets/images/wt-base-vehicle-type/aviation/icon_jet.svg',
    'ucav': '/assets/images/wt-base-vehicle-type/aviation/icon_ucav.svg'
  },
  ground_vehicles: {
    'light': '/assets/images/wt-base-vehicle-type/ground-vehicles/icon_tank_light.svg',
    'medium': '/assets/images/wt-base-vehicle-type/ground-vehicles/icon_tank_medium.svg',
    'heavy': '/assets/images/wt-base-vehicle-type/ground-vehicles/icon_tank_heavy.svg',
    'destroyer': '/assets/images/wt-base-vehicle-type/ground-vehicles/icon_tank_destroyer.svg',
    'aa': '/assets/images/wt-base-vehicle-type/ground-vehicles/icon_tank_aa.svg'
  }
};

// Vehicle type detection
const detectVehicleType = (vehicleName) => {
  const name = vehicleName.toLowerCase();
  
  // Aviation detection
  if (name.includes('bf') || name.includes('me') || name.includes('he') || 
      name.includes('fw') || name.includes('ju') || name.includes('do') ||
      name.includes('f-') || name.includes('p-') || name.includes('a-') ||
      name.includes('b-') || name.includes('c-') || name.includes('f4u') ||
      name.includes('spitfire') || name.includes('hurricane') ||
      name.includes('mig') || name.includes('yak') || name.includes('la') ||
      name.includes('il') || name.includes('tu') || name.includes('su') ||
      name.includes('zero') || name.includes('ki') || name.includes('a6m') ||
      name.includes('j2m') || name.includes('n1k') || name.includes('g4m') ||
      name.includes('b5n') || name.includes('d3a') || name.includes('d4y')) {
    return 'aviation';
  }
  
  // Ground vehicle detection
  if (name.includes('pzkpfw') || name.includes('tiger') || name.includes('panther') ||
      name.includes('panzer') || name.includes('stug') || name.includes('jagd') ||
      name.includes('m4') || name.includes('m3') || name.includes('m26') ||
      name.includes('m60') || name.includes('m1') || name.includes('m48') ||
      name.includes('t-') || name.includes('kv') || name.includes('is') ||
      name.includes('su') || name.includes('bt') || name.includes('as') ||
      name.includes('type') || name.includes('chi') || name.includes('ho') ||
      name.includes('ka') || name.includes('ha') || name.includes('ro') ||
      name.includes('amx') || name.includes('leclerc') || name.includes('char') ||
      name.includes('somua') || name.includes('b1') || name.includes('arl') ||
      name.includes('carro') || name.includes('p40') || name.includes('m13') ||
      name.includes('m14') || name.includes('m15') || name.includes('centauro') ||
      name.includes('strv') || name.includes('ikv') || name.includes('pbil') ||
      name.includes('marder') || name.includes('leopard') || name.includes('m48')) {
    return 'ground_vehicles';
  }
  
  return 'aviation'; // Default fallback
};

// Rank detection from vehicle name or battle data
const detectRank = (vehicleName, battleData = null) => {
  const name = vehicleName.toLowerCase();
  
  // Try to detect from vehicle name patterns
  if (name.includes('i') || name.includes('1')) return 'I';
  if (name.includes('ii') || name.includes('2')) return 'II';
  if (name.includes('iii') || name.includes('3')) return 'III';
  if (name.includes('iv') || name.includes('4')) return 'IV';
  if (name.includes('v') || name.includes('5')) return 'V';
  if (name.includes('vi') || name.includes('6')) return 'VI';
  if (name.includes('vii') || name.includes('7')) return 'VII';
  if (name.includes('viii') || name.includes('8')) return 'VIII';
  
  // Try to detect from battle data context
  if (battleData) {
    // Add logic to detect rank from battle data
    // This could be based on vehicle performance, rewards, etc.
  }
  
  return 'I'; // Default fallback
};

// Country detection from vehicle name
const detectCountry = (vehicleName) => {
  const name = vehicleName.toLowerCase();
  
  // German vehicles
  if (name.includes('bf') || name.includes('me') || name.includes('he') || 
      name.includes('fw') || name.includes('ju') || name.includes('do') ||
      name.includes('pzkpfw') || name.includes('tiger') || name.includes('panther') ||
      name.includes('panzer') || name.includes('stug') || name.includes('jagd')) {
    return 'germany';
  }
  
  // US vehicles
  if (name.includes('f-') || name.includes('p-') || name.includes('a-') ||
      name.includes('b-') || name.includes('c-') || name.includes('f4u') ||
      name.includes('m4') || name.includes('m3') || name.includes('m26') ||
      name.includes('m60') || name.includes('m1') || name.includes('m48')) {
    return 'usa';
  }
  
  // Soviet vehicles
  if (name.includes('mig') || name.includes('yak') || name.includes('la') ||
      name.includes('il') || name.includes('tu') || name.includes('su') ||
      name.includes('t-') || name.includes('kv') || name.includes('is') ||
      name.includes('bt') || name.includes('as')) {
    return 'ussr';
  }
  
  // Japanese vehicles
  if (name.includes('zero') || name.includes('ki') || name.includes('a6m') ||
      name.includes('j2m') || name.includes('n1k') || name.includes('g4m') ||
      name.includes('b5n') || name.includes('d3a') || name.includes('d4y') ||
      name.includes('type') || name.includes('chi') || name.includes('ho') ||
      name.includes('ka') || name.includes('ha') || name.includes('ro')) {
    return 'japan';
  }
  
  // Chinese vehicles
  if (name.includes('j-') || name.includes('q-') || name.includes('h-')) {
    return 'china';
  }
  
  // French vehicles
  if (name.includes('amx') || name.includes('leclerc') || name.includes('char') ||
      name.includes('somua') || name.includes('b1') || name.includes('arl')) {
    return 'france';
  }
  
  // Italian vehicles
  if (name.includes('carro') || name.includes('p40') || name.includes('m13') ||
      name.includes('m14') || name.includes('m15') || name.includes('centauro')) {
    return 'italy';
  }
  
  // Swedish vehicles
  if (name.includes('strv') || name.includes('ikv') || name.includes('pbil')) {
    return 'sweden';
  }
  
  // Israeli vehicles
  if (name.includes('marder') || name.includes('leopard') || name.includes('m48')) {
    return 'israel';
  }
  
  return 'usa'; // Default fallback
};

// Get vehicle icon with fallback
export const getVehicleIcon = (vehicleName, country = null, rank = null, type = null) => {
  if (!vehicleName) {
    console.warn('Vehicle name is required for icon lookup');
    return null;
  }
  
  // Auto-detect if not provided
  const detectedCountry = country || detectCountry(vehicleName);
  const detectedRank = rank || detectRank(vehicleName);
  const detectedType = type || detectVehicleType(vehicleName);
  
  const normalizedName = normalizeVehicleName(vehicleName);
  const normalizedCountry = normalizeCountryName(detectedCountry);
  
  // Try to find specific vehicle icon
  const iconPath = vehicleIconMap[detectedType]?.[normalizedCountry]?.[detectedRank]?.[normalizedName];
  
  if (iconPath) {
    return `/assets/images/wt-vehicle-icons/${detectedType}/countries/${normalizedCountry}/ranks/${detectedRank}/${iconPath}`;
  }
  
  // Fallback to base vehicle type icon
  console.warn(`Missing vehicle icon: ${vehicleName} (${normalizedCountry}, rank ${detectedRank}, type ${detectedType})`);
  
  // Determine base vehicle type for fallback
  let baseType = 'fighter'; // Default for aviation
  if (detectedType === 'ground_vehicles') {
    baseType = 'medium'; // Default for ground vehicles
  }
  
  return baseVehicleTypeMap[detectedType]?.[baseType] || null;
};

// Get country flag
export const getCountryFlag = (country) => {
  if (!country) return null;
  
  const normalizedCountry = normalizeCountryName(country);
  const flagPath = countryFlagMap[normalizedCountry];
  
  if (!flagPath) {
    console.warn(`Missing country flag: ${country}`);
    return null;
  }
  
  return flagPath;
};

// Get item type icon
export const getItemTypeIcon = (itemType) => {
  if (!itemType) return null;
  
  const normalizedType = itemType.toLowerCase().replace(/\s+/g, '_');
  const iconPath = itemTypeMap[normalizedType];
  
  if (!iconPath) {
    console.warn(`Missing item type icon: ${itemType}`);
    return null;
  }
  
  return iconPath;
};

// Get base vehicle type icon
export const getBaseVehicleTypeIcon = (vehicleType, baseType = null) => {
  if (!vehicleType) return null;
  
  if (!baseType) {
    // Auto-detect base type
    baseType = vehicleType === 'aviation' ? 'fighter' : 'medium';
  }
  
  const iconPath = baseVehicleTypeMap[vehicleType]?.[baseType];
  
  if (!iconPath) {
    console.warn(`Missing base vehicle type icon: ${vehicleType}/${baseType}`);
    return null;
  }
  
  return iconPath;
};

// Vehicle information extractor
export const extractVehicleInfo = (vehicleName) => {
  return {
    name: vehicleName,
    country: detectCountry(vehicleName),
    rank: detectRank(vehicleName),
    type: detectVehicleType(vehicleName),
    normalizedName: normalizeVehicleName(vehicleName)
  };
};

// Debug function to list all available assets
export const debugAssets = () => {
  console.log('=== War Thunder Asset Debug ===');
  console.log('Country Flags:', Object.keys(countryFlagMap));
  console.log('Item Types:', Object.keys(itemTypeMap));
  console.log('Base Vehicle Types:', Object.keys(baseVehicleTypeMap));
  console.log('Vehicle Icon Map Structure:', vehicleIconMap);
};

// Asset preloader for commonly used icons
export const preloadCommonAssets = () => {
  const commonAssets = [
    ...Object.values(countryFlagMap),
    ...Object.values(itemTypeMap),
    ...Object.values(baseVehicleTypeMap.aviation),
    ...Object.values(baseVehicleTypeMap.ground_vehicles)
  ];
  
  commonAssets.forEach(assetPath => {
    if (assetPath) {
      const img = new Image();
      img.src = assetPath;
    }
  });
  
  console.log(`Preloaded ${commonAssets.length} common assets`);
};

// Export all utility functions
export default {
  getVehicleIcon,
  getCountryFlag,
  getItemTypeIcon,
  getBaseVehicleTypeIcon,
  extractVehicleInfo,
  normalizeVehicleName,
  normalizeCountryName,
  detectVehicleType,
  detectCountry,
  detectRank,
  debugAssets,
  preloadCommonAssets
};
