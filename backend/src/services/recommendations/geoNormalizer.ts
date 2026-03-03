/**
 * Geographic Normalization Utilities
 *
 * Handles normalization of country names, US state codes, and regional mappings
 * to ensure consistent geographic matching across the recommendation engine.
 */

import { ArticleGeo, OrgLocation } from './types.js';

/**
 * Normalized geographic data
 */
export interface NormalizedGeo {
  country: string;
  countryCode?: string;
  admin1?: string;
  admin1Code?: string;
  admin2?: string;
  city?: string;
  regionCode?: string;
  lat?: number;
  lon?: number;
}

/**
 * US State code to full name mapping
 */
const US_STATE_MAP: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
  'PR': 'Puerto Rico', 'VI': 'Virgin Islands', 'GU': 'Guam', 'AS': 'American Samoa',
};

/**
 * Reverse mapping: full state name to code
 */
const US_STATE_REVERSE_MAP: Record<string, string> = Object.entries(US_STATE_MAP)
  .reduce((acc, [code, name]) => {
    acc[name.toLowerCase()] = code;
    return acc;
  }, {} as Record<string, string>);

/**
 * Country name variations to ISO-like standard
 */
const COUNTRY_NORMALIZATION: Record<string, string> = {
  // Common variations
  'usa': 'United States',
  'us': 'United States',
  'united states of america': 'United States',
  'america': 'United States',
  'uk': 'United Kingdom',
  'great britain': 'United Kingdom',
  'england': 'United Kingdom',
  'uae': 'United Arab Emirates',
  
  // Middle East
  'türkiye': 'Turkey',
  'turkiye': 'Turkey',
  
  // Asia
  'burma': 'Myanmar',
  'siam': 'Thailand',
  
  // Europe
  'holland': 'Netherlands',
  
  // Africa
  'ivory coast': 'Côte d\'Ivoire',
  
  // Add more as needed
};

/**
 * Regional groupings for neighboring country detection
 */
const REGIONAL_GROUPS: Record<string, string[]> = {
  'north-america': ['United States', 'Canada', 'Mexico'],
  'central-america': ['Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama'],
  'caribbean': ['Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Puerto Rico', 'Trinidad and Tobago'],
  'south-america': ['Colombia', 'Venezuela', 'Brazil', 'Peru', 'Chile', 'Argentina', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname'],
  
  'western-europe': ['United Kingdom', 'Ireland', 'France', 'Germany', 'Netherlands', 'Belgium', 'Luxembourg', 'Switzerland', 'Austria'],
  'southern-europe': ['Spain', 'Portugal', 'Italy', 'Greece', 'Malta', 'Cyprus'],
  'eastern-europe': ['Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Ukraine', 'Belarus', 'Moldova'],
  'northern-europe': ['Norway', 'Sweden', 'Finland', 'Denmark', 'Iceland', 'Estonia', 'Latvia', 'Lithuania'],
  'balkans': ['Albania', 'Bosnia and Herzegovina', 'Croatia', 'Kosovo', 'Montenegro', 'North Macedonia', 'Serbia', 'Slovenia'],
  
  'middle-east': ['Turkey', 'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Iraq', 'Iran', 'Saudi Arabia', 'Yemen', 'Oman', 'UAE', 'Qatar', 'Bahrain', 'Kuwait'],
  'north-africa': ['Morocco', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Sudan'],
  'west-africa': ['Nigeria', 'Ghana', 'Senegal', 'Mali', 'Burkina Faso', 'Niger', 'Ivory Coast', 'Guinea', 'Benin', 'Togo', 'Sierra Leone', 'Liberia'],
  'east-africa': ['Ethiopia', 'Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Burundi', 'Somalia', 'Eritrea', 'Djibouti'],
  'southern-africa': ['South Africa', 'Zimbabwe', 'Zambia', 'Mozambique', 'Botswana', 'Namibia', 'Angola', 'Malawi', 'Lesotho', 'Eswatini'],
  
  'south-asia': ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'Afghanistan'],
  'southeast-asia': ['Thailand', 'Vietnam', 'Myanmar', 'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Cambodia', 'Laos', 'Brunei', 'Timor-Leste'],
  'east-asia': ['China', 'Japan', 'South Korea', 'North Korea', 'Mongolia', 'Taiwan'],
  'central-asia': ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'],
  
  'oceania': ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Vanuatu', 'Samoa', 'Tonga'],
};

/**
 * Direct neighbor mappings (countries that share borders)
 */
const DIRECT_NEIGHBORS: Record<string, string[]> = {
  'United States': ['Canada', 'Mexico'],
  'Canada': ['United States'],
  'Mexico': ['United States', 'Guatemala', 'Belize'],
  
  'Turkey': ['Greece', 'Bulgaria', 'Georgia', 'Armenia', 'Iran', 'Iraq', 'Syria'],
  'Syria': ['Turkey', 'Iraq', 'Jordan', 'Israel', 'Lebanon'],
  'Iraq': ['Turkey', 'Syria', 'Jordan', 'Saudi Arabia', 'Kuwait', 'Iran'],
  'Iran': ['Turkey', 'Iraq', 'Afghanistan', 'Pakistan', 'Turkmenistan', 'Azerbaijan', 'Armenia'],
  
  'India': ['Pakistan', 'China', 'Nepal', 'Bhutan', 'Bangladesh', 'Myanmar'],
  'Bangladesh': ['India', 'Myanmar'],
  'Pakistan': ['India', 'China', 'Afghanistan', 'Iran'],
  
  'France': ['Spain', 'Belgium', 'Luxembourg', 'Germany', 'Switzerland', 'Italy', 'Monaco', 'Andorra'],
  'Germany': ['Denmark', 'Poland', 'Czech Republic', 'Austria', 'Switzerland', 'France', 'Luxembourg', 'Belgium', 'Netherlands'],
  
  // Add more as needed
};

/**
 * Normalize article geographic data
 */
export function normalizeArticleGeo(geo: ArticleGeo): NormalizedGeo {
  const normalized: NormalizedGeo = {
    country: normalizeCountryName(geo.country),
    admin1: geo.admin1 ? normalizeAdmin1(geo.admin1, geo.country) : undefined,
    admin2: geo.admin2,
    city: geo.city,
    regionCode: geo.regionCode || inferRegionCode(geo.country),
    lat: geo.lat,
    lon: geo.lon,
  };

  // Add codes if applicable
  if (normalized.country === 'United States' && normalized.admin1) {
    normalized.admin1Code = getStateCode(normalized.admin1);
  }

  return normalized;
}

/**
 * Normalize organization location data
 */
export function normalizeOrgLocation(location: OrgLocation): NormalizedGeo {
  const country = location.country ? normalizeCountryName(location.country) : 'Unknown';
  
  return {
    country,
    admin1: location.admin1 ? normalizeAdmin1(location.admin1, country) : undefined,
    city: location.city,
    regionCode: inferRegionCode(country),
    lat: location.lat,
    lon: location.lon,
  };
}

/**
 * Normalize country name to standard form
 */
export function normalizeCountryName(country: string): string {
  const lower = country.toLowerCase().trim();
  
  // Check normalization map
  if (COUNTRY_NORMALIZATION[lower]) {
    return COUNTRY_NORMALIZATION[lower];
  }
  
  // Return title case
  return country
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize admin1 (state/province) name
 */
export function normalizeAdmin1(admin1: string, country: string): string {
  const normalizedCountry = normalizeCountryName(country);
  
  // Handle US states
  if (normalizedCountry === 'United States') {
    const upper = admin1.toUpperCase().trim();
    
    // If it's a 2-letter code, expand it
    if (upper.length === 2 && US_STATE_MAP[upper]) {
      return US_STATE_MAP[upper];
    }
    
    // If it's a full name, normalize case
    const lower = admin1.toLowerCase().trim();
    if (US_STATE_REVERSE_MAP[lower]) {
      return US_STATE_MAP[US_STATE_REVERSE_MAP[lower]];
    }
  }
  
  // Return title case for other countries
  return admin1
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get US state code from full name
 */
export function getStateCode(stateName: string): string | undefined {
  const lower = stateName.toLowerCase().trim();
  return US_STATE_REVERSE_MAP[lower];
}

/**
 * Infer region code from country
 */
export function inferRegionCode(country: string): string | undefined {
  const normalized = normalizeCountryName(country);
  
  for (const [regionCode, countries] of Object.entries(REGIONAL_GROUPS)) {
    if (countries.includes(normalized)) {
      return regionCode;
    }
  }
  
  return undefined;
}

/**
 * Check if two countries are direct neighbors (share a border)
 */
export function areDirectNeighbors(country1: string, country2: string): boolean {
  const norm1 = normalizeCountryName(country1);
  const norm2 = normalizeCountryName(country2);
  
  const neighbors = DIRECT_NEIGHBORS[norm1] || [];
  return neighbors.includes(norm2);
}

/**
 * Check if two countries are in the same region
 */
export function areInSameRegion(country1: string, country2: string): boolean {
  const norm1 = normalizeCountryName(country1);
  const norm2 = normalizeCountryName(country2);
  
  if (norm1 === norm2) return true;
  
  for (const countries of Object.values(REGIONAL_GROUPS)) {
    if (countries.includes(norm1) && countries.includes(norm2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get region name for a country
 */
export function getRegionName(country: string): string | undefined {
  const normalized = normalizeCountryName(country);
  
  for (const [regionCode, countries] of Object.entries(REGIONAL_GROUPS)) {
    if (countries.includes(normalized)) {
      return regionCode.split('-').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' ');
    }
  }
  
  return undefined;
}

/**
 * Parse location string (e.g., "San Francisco, CA, United States")
 */
export function parseLocationString(locationStr: string): Partial<OrgLocation> {
  if (!locationStr) return {};
  
  const parts = locationStr.split(',').map(p => p.trim());
  
  if (parts.length === 0) return {};
  
  // Last part is usually country
  const country = parts.length > 0 ? parts[parts.length - 1] : undefined;
  
  // Second to last might be state/admin1
  const admin1 = parts.length > 1 ? parts[parts.length - 2] : undefined;
  
  // First part might be city
  const city = parts.length > 2 ? parts[0] : undefined;
  
  return {
    country: country ? normalizeCountryName(country) : undefined,
    admin1: admin1 && country ? normalizeAdmin1(admin1, country) : undefined,
    city,
  };
}