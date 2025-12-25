import { Classification } from '@/types';

/**
 * Well-known international humanitarian organizations to prioritize
 * Using more specific search terms to avoid false matches
 */
const INTERNATIONAL_HUMANITARIAN_ORGS = [
  'International Rescue Committee',
  'Doctors Without Borders/Médecins Sans Frontières (MSF)',
  'UNICEF',
  'World Food Programme',
  'International Red Cross',
  'CARE International',
  'Oxfam International',
  'Save the Children',
  'Mercy Corps',
  'International Medical Corps'
];

/**
 * Extracts meaningful search terms from a classification result
 * to query the Every.org API for relevant organizations
 *
 * Strategy:
 * 1. Try specific international org names first
 * 2. Use geographic + crisis type combinations
 * 3. Prioritize international/humanitarian keywords
 */
export function extractSearchTerms(classification: Classification): string {
  // Build location-specific search terms for ALL crises (domestic and international)
  // This ensures we get organizations relevant to the specific crisis location
  const terms: string[] = [];
  
  // 1. Geographic location - most important for relevance
  if (classification.geoName) {
    terms.push(classification.geoName);
  }
  
  // 2. Crisis type - what kind of emergency
  if (classification.tier1_crisis_type && classification.tier1_crisis_type !== 'none') {
    const crisisType = classification.tier1_crisis_type.replace(/_/g, ' ');
    terms.push(crisisType);
  }
  
  // 3. Primary need - what help is needed
  if (classification.identified_needs && classification.identified_needs.length > 0) {
    const primaryNeed = classification.identified_needs[0].replace(/_/g, ' ');
    terms.push(primaryNeed);
  }
  
  // 4. Cause category as fallback
  if (terms.length === 0 && classification.cause) {
    terms.push(classification.cause.replace(/_/g, ' '));
  }
  
  // Combine terms - prioritize location + crisis type for specificity
  // This creates queries like "Ukraine humanitarian" or "Somalia disaster relief"
  const searchQuery = terms.slice(0, 2).join(' ');
  
  console.log('🔍 Extracted search terms:', {
    allTerms: terms,
    finalQuery: searchQuery,
    classification: {
      crisisType: classification.tier1_crisis_type,
      rootCause: classification.tier2_root_cause,
      needs: classification.identified_needs,
      location: classification.geoName
    }
  });
  
  return searchQuery;
}

/**
 * Creates multiple search queries to fetch diverse relevant organizations
 * Returns an array of search terms to try in sequence
 *
 * Strategy: Use location-specific searches with varying specificity levels
 * to find organizations that are actually relevant to the crisis location
 */
export function getAlternativeSearchTerms(classification: Classification): string[] {
  const alternatives: string[] = [];
  
  // Alternative 1: Location + "humanitarian" (broad humanitarian orgs in region)
  if (classification.geoName) {
    alternatives.push(`${classification.geoName} humanitarian`);
  }
  
  // Alternative 2: Location + "relief" (disaster relief orgs in region)
  if (classification.geoName) {
    alternatives.push(`${classification.geoName} relief`);
  }
  
  // Alternative 3: Location + cause category
  if (classification.cause && classification.geoName) {
    const cause = classification.cause.replace(/_/g, ' ');
    alternatives.push(`${classification.geoName} ${cause}`);
  }
  
  // Alternative 4: Location + primary need (most specific)
  if (classification.identified_needs?.length > 0 && classification.geoName) {
    const need = classification.identified_needs[0].replace(/_/g, ' ');
    alternatives.push(`${classification.geoName} ${need}`);
  }
  
  // Alternative 5: Just location (for regional organizations)
  if (classification.geoName) {
    alternatives.push(classification.geoName);
  }
  
  // Alternative 6: Location + "aid" (general aid organizations)
  if (classification.geoName) {
    alternatives.push(`${classification.geoName} aid`);
  }
  
  // Alternative 7: Just crisis type (broader search if location-specific fails)
  if (classification.tier1_crisis_type && classification.tier1_crisis_type !== 'none') {
    const crisisType = classification.tier1_crisis_type.replace(/_/g, ' ');
    alternatives.push(crisisType);
  }
  
  // Alternative 8: Just cause category (broadest fallback)
  if (classification.cause) {
    alternatives.push(classification.cause.replace(/_/g, ' '));
  }
  
  console.log('🔍 Alternative search terms:', alternatives);
  
  return alternatives;
}

/**
 * Get all search queries to try (primary + alternatives)
 * This allows fetching from multiple searches to get diverse results
 */
export function getAllSearchQueries(classification: Classification): string[] {
  const primary = extractSearchTerms(classification);
  const alternatives = getAlternativeSearchTerms(classification);
  
  // Return primary first, then alternatives
  return [primary, ...alternatives].filter((term, index, self) =>
    // Remove duplicates
    self.indexOf(term) === index
  );
}