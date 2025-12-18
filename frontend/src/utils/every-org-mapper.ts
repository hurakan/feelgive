/**
 * Every.org Data Mapper
 * 
 * Utilities for mapping Every.org API responses to internal Charity type
 * with intelligent inference of causes, needs, trust scores, and geographic data
 */

import { CauseCategory, IdentifiedNeed } from '@/types';

export interface EveryOrgNonprofit {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  ein?: string;
  locationAddress?: string;
  primaryCategory?: string;
  nteeCode?: string;
  nteeCodeMeaning?: string;
}

/**
 * NTEE Code to Cause Category Mapping
 * NTEE (National Taxonomy of Exempt Entities) codes categorize nonprofits
 * 
 * Major NTEE Categories:
 * A - Arts, Culture & Humanities
 * B - Education
 * C - Environment
 * D - Animal-Related
 * E - Health Care
 * F - Mental Health & Crisis Intervention
 * G - Diseases, Disorders & Medical Disciplines
 * H - Medical Research
 * I - Crime & Legal-Related
 * J - Employment
 * K - Food, Agriculture & Nutrition
 * L - Housing & Shelter
 * M - Public Safety, Disaster Preparedness & Relief
 * N - Recreation & Sports
 * O - Youth Development
 * P - Human Services
 * Q - International, Foreign Affairs & National Security
 * R - Civil Rights, Social Action & Advocacy
 * S - Community Improvement & Capacity Building
 * T - Philanthropy, Voluntarism & Grantmaking Foundations
 * U - Science & Technology
 * V - Social Science
 * W - Public & Societal Benefit
 * X - Religion-Related
 * Y - Mutual & Membership Benefit
 * Z - Unknown
 */
const NTEE_TO_CAUSES: Record<string, CauseCategory[]> = {
  // Disaster Relief & Emergency Services
  'M': ['disaster_relief', 'humanitarian_crisis'],
  'M20': ['disaster_relief'],
  'M23': ['disaster_relief'],
  'M24': ['disaster_relief'],
  'M99': ['disaster_relief'],
  
  // Health & Medical
  'E': ['health_crisis'],
  'F': ['health_crisis'],
  'G': ['health_crisis'],
  'H': ['health_crisis'],
  'E20': ['health_crisis'],
  'E21': ['health_crisis'],
  'E22': ['health_crisis'],
  'E24': ['health_crisis'],
  
  // Environmental & Climate
  'C': ['climate_events'],
  'C20': ['climate_events'],
  'C27': ['climate_events'],
  'C30': ['climate_events'],
  'C34': ['climate_events'],
  'C35': ['climate_events'],
  
  // International & Humanitarian
  'Q': ['humanitarian_crisis'],
  'Q20': ['humanitarian_crisis'],
  'Q30': ['humanitarian_crisis'],
  'Q33': ['humanitarian_crisis'],
  'Q40': ['humanitarian_crisis'],
  'Q70': ['humanitarian_crisis'],
  
  // Human Services & Social Issues
  'P': ['humanitarian_crisis'],
  'K': ['humanitarian_crisis'],
  'L': ['humanitarian_crisis'],
  'I': ['humanitarian_crisis'],
  'J': ['humanitarian_crisis'],
  'P20': ['humanitarian_crisis'],
  'P30': ['humanitarian_crisis'],
  'P40': ['humanitarian_crisis'],
  'P60': ['humanitarian_crisis'],
  'P80': ['humanitarian_crisis'],
  'K20': ['humanitarian_crisis'],
  'K30': ['humanitarian_crisis'],
  'L20': ['humanitarian_crisis'],
  'L21': ['humanitarian_crisis'],
  'L22': ['humanitarian_crisis'],
  'L30': ['humanitarian_crisis'],
  'L40': ['humanitarian_crisis'],
  'L80': ['humanitarian_crisis'],
};

/**
 * Map NTEE code to cause categories
 */
export function mapNteeCodeToCauses(nteeCode?: string): CauseCategory[] {
  if (!nteeCode) return [];
  
  // Try exact match first
  const exactMatch = NTEE_TO_CAUSES[nteeCode];
  if (exactMatch) return exactMatch;
  
  // Try major category (first letter)
  const majorCategory = nteeCode.charAt(0);
  const majorMatch = NTEE_TO_CAUSES[majorCategory];
  if (majorMatch) return majorMatch;
  
  return [];
}

/**
 * Keyword patterns for inferring causes from text
 */
const CAUSE_KEYWORDS: Record<CauseCategory, string[]> = {
  disaster_relief: [
    'disaster', 'emergency', 'relief', 'rescue', 'evacuation',
    'earthquake', 'hurricane', 'tornado', 'flood', 'wildfire',
    'tsunami', 'cyclone', 'typhoon', 'storm', 'natural disaster'
  ],
  climate_events: [
    'climate', 'environmental', 'conservation', 'sustainability',
    'global warming', 'carbon', 'renewable', 'ecosystem',
    'biodiversity', 'pollution', 'deforestation', 'ocean'
  ],
  humanitarian_crisis: [
    'humanitarian', 'refugee', 'displaced', 'conflict', 'war',
    'poverty', 'hunger', 'famine', 'homeless', 'shelter',
    'human rights', 'persecution', 'asylum', 'migration'
  ],
  health_crisis: [
    'health', 'medical', 'hospital', 'clinic', 'disease',
    'epidemic', 'pandemic', 'outbreak', 'healthcare',
    'mental health', 'treatment', 'patient', 'medicine'
  ],
  social_justice: [
    'justice', 'equality', 'rights', 'advocacy', 'discrimination',
    'civil rights', 'social justice', 'equity', 'inclusion',
    'empowerment', 'marginalized', 'underserved'
  ]
};

/**
 * Infer causes from description text using keyword matching
 */
export function inferCausesFromDescription(description: string): CauseCategory[] {
  if (!description) return [];
  
  const lowerDesc = description.toLowerCase();
  const causes: CauseCategory[] = [];
  
  for (const [cause, keywords] of Object.entries(CAUSE_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    ).length;
    
    // If at least 2 keywords match, include this cause
    if (matchCount >= 2) {
      causes.push(cause as CauseCategory);
    }
  }
  
  return causes;
}

/**
 * Keyword patterns for inferring addressed needs from text
 */
const NEED_KEYWORDS: Record<IdentifiedNeed, string[]> = {
  food: ['food', 'nutrition', 'meal', 'hunger', 'feeding', 'nourishment'],
  shelter: ['shelter', 'housing', 'home', 'accommodation', 'refuge', 'lodging'],
  medical: ['medical', 'health', 'healthcare', 'treatment', 'clinic', 'hospital'],
  water: ['water', 'clean water', 'sanitation', 'hygiene', 'drinking water'],
  legal_aid: ['legal', 'law', 'justice', 'advocacy', 'rights', 'counsel'],
  rescue: ['rescue', 'emergency', 'evacuation', 'search and rescue', 'first responder'],
  education: ['education', 'school', 'learning', 'training', 'teaching', 'literacy'],
  mental_health: ['mental health', 'counseling', 'therapy', 'psychological', 'trauma'],
  winterization: ['winter', 'cold', 'heating', 'warm', 'blanket', 'winterization'],
  sanitation: ['sanitation', 'hygiene', 'toilet', 'waste', 'sewage', 'clean']
};

/**
 * Infer addressed needs from description and category
 */
export function inferAddressedNeeds(
  description: string,
  category?: string
): IdentifiedNeed[] {
  const text = `${description} ${category || ''}`.toLowerCase();
  const needs: IdentifiedNeed[] = [];
  
  for (const [need, keywords] of Object.entries(NEED_KEYWORDS)) {
    const hasMatch = keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    if (hasMatch) {
      needs.push(need as IdentifiedNeed);
    }
  }
  
  // Default needs if none detected
  if (needs.length === 0) {
    return ['food', 'shelter', 'medical'];
  }
  
  return needs;
}

/**
 * Extract country from location address
 * Handles various address formats and returns ISO country codes when possible
 */
export function extractCountryFromAddress(locationAddress?: string): string[] {
  if (!locationAddress) return ['USA']; // Default to USA
  
  const address = locationAddress.toLowerCase();
  
  // Common country patterns
  const countryPatterns: Record<string, string[]> = {
    'USA': ['united states', 'usa', 'u.s.a', 'us', 'america'],
    'CAN': ['canada', 'canadian'],
    'GBR': ['united kingdom', 'uk', 'u.k', 'england', 'scotland', 'wales'],
    'AUS': ['australia', 'australian'],
    'IND': ['india', 'indian'],
    'KEN': ['kenya', 'kenyan'],
    'UGA': ['uganda', 'ugandan'],
    'TZA': ['tanzania', 'tanzanian'],
    'ETH': ['ethiopia', 'ethiopian'],
    'SOM': ['somalia', 'somalian'],
    'SDN': ['sudan', 'sudanese'],
    'SSD': ['south sudan'],
    'YEM': ['yemen', 'yemeni'],
    'SYR': ['syria', 'syrian'],
    'IRQ': ['iraq', 'iraqi'],
    'AFG': ['afghanistan', 'afghan'],
    'PAK': ['pakistan', 'pakistani'],
    'BGD': ['bangladesh', 'bangladeshi'],
    'NPL': ['nepal', 'nepalese'],
    'HTI': ['haiti', 'haitian'],
    'VEN': ['venezuela', 'venezuelan'],
    'COL': ['colombia', 'colombian'],
    'BRA': ['brazil', 'brazilian'],
    'MEX': ['mexico', 'mexican'],
    'GTM': ['guatemala', 'guatemalan'],
    'HND': ['honduras', 'honduran'],
    'SLV': ['el salvador', 'salvadoran'],
    'NIC': ['nicaragua', 'nicaraguan'],
  };
  
  // Check for country matches
  for (const [code, patterns] of Object.entries(countryPatterns)) {
    if (patterns.some(pattern => address.includes(pattern))) {
      return [code];
    }
  }
  
  // Check for "Global" or "International" indicators
  if (address.includes('global') || address.includes('international') || 
      address.includes('worldwide') || address.includes('multiple countries')) {
    return ['Global'];
  }
  
  // Default to USA if no match found
  return ['USA'];
}

/**
 * Calculate trust score based on data quality indicators
 * Score range: 70-100
 */
export function calculateTrustScore(nonprofit: EveryOrgNonprofit): number {
  let score = 70; // Base score
  
  // Has verified EIN (+10 points)
  if (nonprofit.ein && nonprofit.ein.length > 0) {
    score += 10;
  }
  
  // Has complete description (+5 points)
  if (nonprofit.description && nonprofit.description.length > 100) {
    score += 5;
  }
  
  // Has logo (+5 points)
  if (nonprofit.logoUrl) {
    score += 5;
  }
  
  // Has website (+5 points)
  if (nonprofit.websiteUrl) {
    score += 5;
  }
  
  // Has location data (+3 points)
  if (nonprofit.locationAddress) {
    score += 3;
  }
  
  // Has NTEE code (+2 points)
  if (nonprofit.nteeCode) {
    score += 2;
  }
  
  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Main mapping function: Convert EveryOrgNonprofit to Charity
 */
export function mapEveryOrgToCharity(nonprofit: EveryOrgNonprofit) {
  // Get causes from multiple sources
  const nteeCauses = mapNteeCodeToCauses(nonprofit.nteeCode);
  const descriptionCauses = inferCausesFromDescription(nonprofit.description);
  const allCauses = [...new Set([...nteeCauses, ...descriptionCauses])];
  
  // Default to humanitarian_crisis if no causes detected
  const causes: CauseCategory[] = allCauses.length > 0 
    ? allCauses 
    : ['humanitarian_crisis'];
  
  // Get addressed needs
  const addressedNeeds = inferAddressedNeeds(
    nonprofit.description,
    nonprofit.primaryCategory
  );
  
  // Get countries
  const countries = extractCountryFromAddress(nonprofit.locationAddress);
  
  // Calculate trust score
  const trustScore = calculateTrustScore(nonprofit);
  
  return {
    id: nonprofit.slug,
    name: nonprofit.name,
    slug: nonprofit.slug,
    description: nonprofit.description,
    logo: nonprofit.logoUrl || '/placeholder.svg',
    causes,
    countries,
    trustScore,
    vettingLevel: 'partner_pg_review' as const,
    isActive: true,
    geographicFlexibility: countries.includes('Global') ? 10 : 8,
    addressedNeeds,
    everyOrgVerified: true,
  };
}