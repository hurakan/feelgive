import { Classification } from '@/types';

/**
 * Extracts meaningful search terms from a classification result
 * to query the Every.org API for relevant organizations
 */
export function extractSearchTerms(classification: Classification): string {
  const terms: string[] = [];
  
  // 1. Primary crisis type - most important
  if (classification.tier1_crisis_type && classification.tier1_crisis_type !== 'none') {
    const crisisType = classification.tier1_crisis_type.replace(/_/g, ' ');
    terms.push(crisisType);
  }
  
  // 2. Root cause - adds context
  if (classification.tier2_root_cause && classification.tier2_root_cause !== 'unknown') {
    const rootCause = classification.tier2_root_cause.replace(/_/g, ' ');
    // Only add if it's not redundant with crisis type
    if (!terms.some(t => t.includes(rootCause))) {
      terms.push(rootCause);
    }
  }
  
  // 3. Primary identified need - what people need most
  if (classification.identified_needs && classification.identified_needs.length > 0) {
    const primaryNeed = classification.identified_needs[0].replace(/_/g, ' ');
    terms.push(primaryNeed);
  }
  
  // 4. Geographic location - where help is needed
  if (classification.geoName) {
    terms.push(classification.geoName);
  }
  
  // 5. Cause category as fallback
  if (terms.length === 0 && classification.cause) {
    terms.push(classification.cause.replace(/_/g, ' '));
  }
  
  // Combine terms into a search query
  // Prioritize the most specific terms (crisis type + location + need)
  const searchQuery = terms.slice(0, 3).join(' ');
  
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
 * Creates alternative search queries if the primary search returns no results
 */
export function getAlternativeSearchTerms(classification: Classification): string[] {
  const alternatives: string[] = [];
  
  // Alternative 1: Just crisis type + location
  if (classification.tier1_crisis_type !== 'none' && classification.geoName) {
    const crisisType = classification.tier1_crisis_type.replace(/_/g, ' ');
    alternatives.push(`${crisisType} ${classification.geoName}`);
  }
  
  // Alternative 2: Just cause category + location
  if (classification.cause && classification.geoName) {
    const cause = classification.cause.replace(/_/g, ' ');
    alternatives.push(`${cause} ${classification.geoName}`);
  }
  
  // Alternative 3: Just location (for regional organizations)
  if (classification.geoName) {
    alternatives.push(classification.geoName);
  }
  
  // Alternative 4: Just cause category (broadest)
  if (classification.cause) {
    alternatives.push(classification.cause.replace(/_/g, ' '));
  }
  
  return alternatives;
}