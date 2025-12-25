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
export function extractCountryFromAddress(
  locationAddress?: string,
  name?: string,
  description?: string
): string[] {
  // If no location data at all, default to Global for maximum flexibility
  if (!locationAddress && !name && !description) {
    return ['Global'];
  }
  
  // Combine all text sources for analysis
  const textToAnalyze = `${locationAddress || ''} ${name || ''} ${description || ''}`.toLowerCase();
  
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
  
  // Check for country matches in combined text
  for (const [code, patterns] of Object.entries(countryPatterns)) {
    if (patterns.some(pattern => textToAnalyze.includes(pattern))) {
      return [code];
    }
  }
  
  // Check for "Global" or "International" indicators
  if (textToAnalyze.includes('global') || textToAnalyze.includes('international') ||
      textToAnalyze.includes('worldwide') || textToAnalyze.includes('multiple countries') ||
      textToAnalyze.includes('world') || textToAnalyze.includes('nations')) {
    return ['Global'];
  }
  
  // If we have location data but no match, default to USA
  // If we have NO location data, default to Global for flexibility
  return locationAddress ? ['USA'] : ['Global'];
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
 * Filter out organizations that are clearly not relevant to humanitarian crises
 * Returns true if the organization should be EXCLUDED
 */
export function isIrrelevantOrganization(nonprofit: EveryOrgNonprofit, searchTerm?: string): boolean {
  const textToCheck = `${nonprofit.name} ${nonprofit.description} ${nonprofit.primaryCategory || ''} ${nonprofit.nteeCodeMeaning || ''}`.toLowerCase();
  
  // If we have a search term, filter out organizations that are clearly different entities
  // despite having similar acronyms or partial name matches
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const nameLower = nonprofit.name.toLowerCase();
    
    // Check for acronym confusion (e.g., "IRC" in search but org is "Irc Africa Inc" not "International Rescue Committee")
    // If the search term is long (>20 chars) and the org name is short (<20 chars) with similar acronym, it's likely wrong
    if (searchLower.length > 20 && nameLower.length < 20) {
      // Extract potential acronym from search term
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      const searchAcronym = searchWords.map(w => w[0]).join('');
      
      // Check if org name contains the acronym but isn't the full organization
      if (searchAcronym.length >= 3 && nameLower.includes(searchAcronym)) {
        // This is likely an acronym match but different organization
        console.log(`🚫 Filtering out potential acronym confusion: ${nonprofit.name} (searched for: ${searchTerm})`);
        return true;
      }
    }
    
    // Filter out organizations with "Inc", "Corp", "LLC" suffixes that don't match the search intent
    // e.g., searching for "International Rescue Committee" shouldn't return "IRC Africa Inc"
    const corporateSuffixes = [' inc', ' corp', ' llc', ' ltd', ' co'];
    const hasCorporateSuffix = corporateSuffixes.some(suffix => nameLower.endsWith(suffix));
    
    if (hasCorporateSuffix && !searchLower.includes('inc') && !searchLower.includes('corp') && !searchLower.includes('llc')) {
      // Check if this is a partial acronym match (e.g., "IRC" in "Irc Africa Inc")
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      if (searchWords.length >= 3) { // Multi-word search like "International Rescue Committee"
        const searchAcronym = searchWords.map(w => w[0]).join('');
        const nameWords = nameLower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);
        
        // If org name starts with the acronym but has different words, filter it out
        if (nameWords.length > 0 && nameWords[0] === searchAcronym) {
          console.log(`🚫 Filtering out corporate entity with acronym match: ${nonprofit.name} (searched for: ${searchTerm})`);
          return true;
        }
      }
    }
  }
  
  // Exclude animal-related organizations (NTEE code D)
  if (nonprofit.nteeCode?.startsWith('D')) {
    console.log(`🚫 Filtering out animal org: ${nonprofit.name} (NTEE: ${nonprofit.nteeCode})`);
    return true;
  }
  
  // Exclude organizations with animal-related keywords in name/description
  const animalKeywords = [
    'dog', 'dogs', 'cat', 'cats', 'pet', 'pets', 'animal', 'animals',
    'veterinary', 'vet tech', 'wildlife', 'zoo', 'aquarium',
    'horse', 'horses', 'livestock', 'bird', 'birds'
  ];
  
  const hasAnimalKeyword = animalKeywords.some(keyword => textToCheck.includes(keyword));
  if (hasAnimalKeyword) {
    // Double-check: allow if it's clearly humanitarian despite animal keywords
    const humanitarianKeywords = ['human', 'people', 'children', 'refugee', 'humanitarian', 'crisis', 'disaster'];
    const hasHumanitarianKeyword = humanitarianKeywords.some(keyword => textToCheck.includes(keyword));
    
    if (!hasHumanitarianKeyword) {
      console.log(`🚫 Filtering out animal-related org: ${nonprofit.name}`);
      return true;
    }
  }
  
  // Exclude arts, culture, sports organizations (NTEE codes A, N)
  if (nonprofit.nteeCode?.startsWith('A') || nonprofit.nteeCode?.startsWith('N')) {
    console.log(`🚫 Filtering out arts/sports org: ${nonprofit.name} (NTEE: ${nonprofit.nteeCode})`);
    return true;
  }
  
  // Exclude domestic healthcare providers that aren't crisis-focused
  // These are typically hospitals, clinics, and healthcare systems (NTEE E20-E24)
  const domesticHealthcareKeywords = [
    'hospital', 'clinic', 'medical center', 'health system', 'healthcare system',
    'health center', 'medical group', 'physician', 'surgery center',
    'urgent care', 'primary care', 'family medicine', 'pediatric clinic'
  ];
  
  const hasDomesticHealthcareKeyword = domesticHealthcareKeywords.some(keyword =>
    textToCheck.includes(keyword)
  );
  
  if (hasDomesticHealthcareKeyword) {
    // Allow if it's clearly humanitarian/crisis-focused despite healthcare keywords
    const crisisHealthcareKeywords = [
      'disaster', 'emergency response', 'humanitarian', 'crisis', 'refugee',
      'international', 'global health', 'epidemic', 'pandemic', 'outbreak',
      'conflict', 'war', 'displaced', 'relief', 'aid'
    ];
    const hasCrisisKeyword = crisisHealthcareKeywords.some(keyword =>
      textToCheck.includes(keyword)
    );
    
    if (!hasCrisisKeyword) {
      console.log(`🚫 Filtering out domestic healthcare provider: ${nonprofit.name}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Main mapping function: Convert EveryOrgNonprofit to Charity
 * Handles missing data gracefully with fallbacks
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
  
  // Get countries - pass name and description for better inference
  const countries = extractCountryFromAddress(
    nonprofit.locationAddress,
    nonprofit.name,
    nonprofit.description
  );
  
  // Calculate trust score
  const trustScore = calculateTrustScore(nonprofit);
  
  // Handle missing description gracefully
  const description = nonprofit.description && nonprofit.description.trim().length > 0
    ? nonprofit.description
    : 'Information about this organization is being updated. Please visit their website for more details.';
  
  // Detect if this is a donor-advised fund or pass-through entity
  const isDonorAdvisedFund = /\b(tr|trust|uw|fbo|fund)\b/i.test(nonprofit.name.toLowerCase());
  
  return {
    id: nonprofit.slug,
    name: nonprofit.name,
    slug: nonprofit.slug,
    description,
    logo: nonprofit.logoUrl || '/placeholder.svg',
    causes,
    countries,
    trustScore,
    vettingLevel: 'partner_pg_review' as const,
    isActive: true,
    geographicFlexibility: countries.includes('Global') ? 10 : 8,
    addressedNeeds,
    everyOrgVerified: true,
    websiteUrl: nonprofit.websiteUrl,
    ein: nonprofit.ein,
    nteeCode: nonprofit.nteeCode,
    locationAddress: nonprofit.locationAddress,
    dataSource: 'Every.org',
    lastUpdated: new Date().toISOString(),
    // Add metadata for transparency
    profile: isDonorAdvisedFund ? {
      fullLegalName: nonprofit.name,
      registrationNumber: nonprofit.ein || 'Not available',
      yearFounded: 0,
      headquarters: nonprofit.locationAddress || 'Not specified',
      website: nonprofit.websiteUrl || '',
      missionStatement: 'This entry may represent a donor-advised fund or pass-through entity benefiting another organization. Please verify the beneficiary organization before donating.',
      programAreas: [],
      regionsServed: countries,
      recentHighlights: [],
      impactMetrics: [],
      partnerships: [],
    } : undefined,
  };
}

/**
 * Calculate data completeness score for an organization
 * Returns a score from 0-100 indicating how complete the data is
 */
export function calculateDataCompleteness(nonprofit: EveryOrgNonprofit): {
  has_description: boolean;
  has_website: boolean;
  has_location: boolean;
  has_ein: boolean;
  completeness_score: number;
} {
  const has_description = Boolean(nonprofit.description && nonprofit.description.trim().length > 50);
  const has_website = Boolean(nonprofit.websiteUrl);
  const has_location = Boolean(nonprofit.locationAddress);
  const has_ein = Boolean(nonprofit.ein);
  
  // Calculate weighted score
  let score = 0;
  if (has_description) score += 40; // Description is most important
  if (has_website) score += 30; // Website is very important
  if (has_location) score += 15; // Location is helpful
  if (has_ein) score += 15; // EIN adds credibility
  
  return {
    has_description,
    has_website,
    has_location,
    has_ein,
    completeness_score: score,
  };
}