/**
 * Geographic region mapping and neighboring country utilities
 * Used for Tier 2 (Regional) matching in the organization ranking algorithm
 */

// Region definitions based on geographic proximity and shared borders
export const REGION_MAP: Record<string, string[]> = {
  // Africa regions
  north_africa: ['DZ', 'EG', 'LY', 'MA', 'TN', 'SD', 'SS'],
  west_africa: ['BJ', 'BF', 'CV', 'CI', 'GM', 'GH', 'GN', 'GW', 'LR', 'ML', 'MR', 'NE', 'NG', 'SN', 'SL', 'TG'],
  east_africa: ['BI', 'KM', 'DJ', 'ER', 'ET', 'KE', 'MG', 'MW', 'MU', 'MZ', 'RW', 'SC', 'SO', 'TZ', 'UG', 'ZM', 'ZW'],
  central_africa: ['AO', 'CM', 'CF', 'TD', 'CG', 'CD', 'GQ', 'GA', 'ST'],
  southern_africa: ['BW', 'LS', 'NA', 'ZA', 'SZ'],

  // Asia regions
  middle_east: ['BH', 'IQ', 'IR', 'IL', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'TR', 'AE', 'YE'],
  south_asia: ['AF', 'BD', 'BT', 'IN', 'MV', 'NP', 'PK', 'LK'],
  southeast_asia: ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'TL', 'VN'],
  east_asia: ['CN', 'HK', 'JP', 'KP', 'KR', 'MN', 'MO', 'TW'],
  central_asia: ['KZ', 'KG', 'TJ', 'TM', 'UZ'],

  // Europe regions
  western_europe: ['AT', 'BE', 'FR', 'DE', 'LI', 'LU', 'MC', 'NL', 'CH'],
  northern_europe: ['DK', 'EE', 'FI', 'IS', 'IE', 'LV', 'LT', 'NO', 'SE', 'GB'],
  southern_europe: ['AL', 'AD', 'BA', 'HR', 'CY', 'GR', 'IT', 'XK', 'MT', 'ME', 'MK', 'PT', 'SM', 'RS', 'SI', 'ES', 'VA'],
  eastern_europe: ['BY', 'BG', 'CZ', 'HU', 'MD', 'PL', 'RO', 'RU', 'SK', 'UA'],

  // Americas regions
  north_america: ['CA', 'MX', 'US'],
  central_america: ['BZ', 'CR', 'SV', 'GT', 'HN', 'NI', 'PA'],
  caribbean: ['AG', 'BS', 'BB', 'CU', 'DM', 'DO', 'GD', 'HT', 'JM', 'KN', 'LC', 'VC', 'TT'],
  south_america: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],

  // Oceania
  oceania: ['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU'],
};

// Neighboring countries map (countries that share borders)
const NEIGHBORING_COUNTRIES: Record<string, string[]> = {
  // Africa
  'DZ': ['TN', 'LY', 'NE', 'ML', 'MR', 'MA'],
  'EG': ['LY', 'SD', 'IL', 'PS'],
  'LY': ['DZ', 'TN', 'EG', 'SD', 'TD', 'NE'],
  'MA': ['DZ', 'ES'],
  'TN': ['DZ', 'LY'],
  'SD': ['EG', 'LY', 'TD', 'CF', 'SS', 'ET', 'ER'],
  'SS': ['SD', 'ET', 'KE', 'UG', 'CD', 'CF'],
  'ET': ['ER', 'DJ', 'SO', 'KE', 'SS', 'SD'],
  'KE': ['ET', 'SO', 'SS', 'UG', 'TZ'],
  'SO': ['DJ', 'ET', 'KE'],
  'UG': ['SS', 'KE', 'TZ', 'RW', 'CD'],
  'TZ': ['KE', 'UG', 'RW', 'BI', 'CD', 'ZM', 'MW', 'MZ'],
  'NG': ['BJ', 'NE', 'TD', 'CM'],
  'CD': ['CG', 'CF', 'SS', 'UG', 'RW', 'BI', 'TZ', 'ZM', 'AO'],
  'ZA': ['NA', 'BW', 'ZW', 'MZ', 'SZ', 'LS'],

  // Middle East
  'TR': ['GR', 'BG', 'GE', 'AM', 'AZ', 'IR', 'IQ', 'SY'],
  'SY': ['TR', 'IQ', 'JO', 'IL', 'LB'],
  'IQ': ['TR', 'SY', 'JO', 'SA', 'KW', 'IR'],
  'IR': ['TR', 'IQ', 'KW', 'SA', 'OM', 'AE', 'AF', 'PK', 'TM', 'AZ', 'AM'],
  'SA': ['JO', 'IQ', 'KW', 'QA', 'AE', 'OM', 'YE'],
  'YE': ['SA', 'OM'],
  'IL': ['LB', 'SY', 'JO', 'EG', 'PS'],
  'JO': ['SY', 'IQ', 'SA', 'IL', 'PS'],
  'LB': ['SY', 'IL'],

  // South Asia
  'AF': ['IR', 'PK', 'CN', 'TJ', 'UZ', 'TM'],
  'PK': ['AF', 'IR', 'IN', 'CN'],
  'IN': ['PK', 'CN', 'NP', 'BT', 'MM', 'BD'],
  'BD': ['IN', 'MM'],
  'NP': ['CN', 'IN'],
  'BT': ['CN', 'IN'],

  // Southeast Asia
  'MM': ['BD', 'IN', 'CN', 'LA', 'TH'],
  'TH': ['MM', 'LA', 'KH', 'MY'],
  'LA': ['CN', 'MM', 'TH', 'KH', 'VN'],
  'VN': ['CN', 'LA', 'KH'],
  'KH': ['TH', 'LA', 'VN'],
  'MY': ['TH', 'BN', 'ID'],
  'ID': ['MY', 'PG', 'TL'],

  // East Asia
  'CN': ['KP', 'KR', 'MN', 'RU', 'KZ', 'KG', 'TJ', 'AF', 'PK', 'IN', 'NP', 'BT', 'MM', 'LA', 'VN'],
  'KP': ['CN', 'KR', 'RU'],
  'KR': ['KP'],
  'MN': ['CN', 'RU'],

  // Europe
  'FR': ['ES', 'AD', 'BE', 'LU', 'DE', 'CH', 'IT', 'MC'],
  'DE': ['DK', 'PL', 'CZ', 'AT', 'CH', 'FR', 'LU', 'BE', 'NL'],
  'IT': ['FR', 'CH', 'AT', 'SI', 'SM', 'VA'],
  'ES': ['PT', 'FR', 'AD'],
  'PT': ['ES'],
  'PL': ['DE', 'CZ', 'SK', 'UA', 'BY', 'LT', 'RU'],
  'UA': ['PL', 'SK', 'HU', 'RO', 'MD', 'RU', 'BY'],
  'RU': ['NO', 'FI', 'EE', 'LV', 'LT', 'PL', 'BY', 'UA', 'GE', 'AZ', 'KZ', 'CN', 'MN', 'KP'],
  'GR': ['AL', 'MK', 'BG', 'TR'],

  // Americas
  'US': ['CA', 'MX'],
  'CA': ['US'],
  'MX': ['US', 'GT', 'BZ'],
  'GT': ['MX', 'BZ', 'HN', 'SV'],
  'BZ': ['MX', 'GT'],
  'HN': ['GT', 'SV', 'NI'],
  'SV': ['GT', 'HN'],
  'NI': ['HN', 'CR'],
  'CR': ['NI', 'PA'],
  'PA': ['CR', 'CO'],
  'CO': ['PA', 'VE', 'BR', 'PE', 'EC'],
  'VE': ['CO', 'BR', 'GY'],
  'BR': ['VE', 'GY', 'SR', 'GF', 'UY', 'AR', 'PY', 'BO', 'PE', 'CO'],
  'AR': ['CL', 'BO', 'PY', 'BR', 'UY'],
  'CL': ['PE', 'BO', 'AR'],
  'PE': ['EC', 'CO', 'BR', 'BO', 'CL'],
  'BO': ['PE', 'BR', 'PY', 'AR', 'CL'],
  'PY': ['BO', 'BR', 'AR'],
  'UY': ['BR', 'AR'],
  'EC': ['CO', 'PE'],

  // Oceania
  'AU': ['ID', 'TL', 'PG'],
  'PG': ['ID', 'AU'],
  'NZ': [], // Island nation
};

/**
 * Get the region(s) a country belongs to
 * @param countryCode - ISO 2-letter country code
 * @returns Array of region names the country belongs to
 */
export function getRegions(countryCode: string): string[] {
  const upperCode = countryCode.toUpperCase();
  const regions: string[] = [];
  
  for (const [region, countries] of Object.entries(REGION_MAP)) {
    if (countries.includes(upperCode)) {
      regions.push(region);
    }
  }
  
  return regions;
}

/**
 * Get the primary region for a country (first match)
 * @param countryCode - ISO 2-letter country code
 * @returns Region name or null if not found
 */
export function getRegion(countryCode: string): string | null {
  const regions = getRegions(countryCode);
  return regions.length > 0 ? regions[0] : null;
}

/**
 * Check if two countries are in the same region
 * @param country1 - First country code
 * @param country2 - Second country code
 * @returns True if countries share at least one region
 */
export function areInSameRegion(country1: string, country2: string): boolean {
  const regions1 = getRegions(country1);
  const regions2 = getRegions(country2);
  
  return regions1.some(region => regions2.includes(region));
}

/**
 * Get neighboring countries (countries that share a border)
 * @param countryCode - ISO 2-letter country code
 * @returns Array of neighboring country codes
 */
export function getNeighboringCountries(countryCode: string): string[] {
  const upperCode = countryCode.toUpperCase();
  return NEIGHBORING_COUNTRIES[upperCode] || [];
}

/**
 * Check if two countries are neighbors (share a border)
 * @param country1 - First country code
 * @param country2 - Second country code
 * @returns True if countries share a border
 */
export function areNeighboringCountries(country1: string, country2: string): boolean {
  const upperCode1 = country1.toUpperCase();
  const upperCode2 = country2.toUpperCase();
  
  const neighbors = NEIGHBORING_COUNTRIES[upperCode1] || [];
  return neighbors.includes(upperCode2);
}

/**
 * Check if a country is in a specific region
 * @param countryCode - ISO 2-letter country code
 * @param regionName - Region name to check
 * @returns True if country is in the specified region
 */
export function isInRegion(countryCode: string, regionName: string): boolean {
  const upperCode = countryCode.toUpperCase();
  const countries = REGION_MAP[regionName] || [];
  return countries.includes(upperCode);
}

/**
 * Get all countries in a region
 * @param regionName - Region name
 * @returns Array of country codes in the region
 */
export function getCountriesInRegion(regionName: string): string[] {
  return REGION_MAP[regionName] || [];
}