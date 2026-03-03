/**
 * Semantic Geographic Matcher
 * 
 * Matches organizations by operational focus (not headquarters location)
 * using name, description, search query, and NTEE code signals
 */

import { getDemonyms, getRegions } from './demonyms.js';

export interface SemanticGeoScore {
  totalScore: number;
  breakdown: {
    name: { score: number; reason: string };
    description: { score: number; reason: string };
    query: { score: number; reason: string };
    ntee: { score: number; reason: string };
  };
}

/**
 * Compute semantic geographic relevance score (0-100)
 */
export function computeSemanticGeoRelevance(
  orgName: string,
  orgDescription: string,
  orgNteeCode: string | undefined,
  targetCountry: string,
  searchQuery: string
): SemanticGeoScore {
  const nameResult = extractGeoFromName(orgName, targetCountry);
  const descResult = extractGeoFromDescription(orgDescription, targetCountry);
  const queryResult = getSearchQueryScore(searchQuery, targetCountry);
  const nteeResult = getNTEEGeoScore(orgNteeCode);
  
  return {
    totalScore: nameResult.score + descResult.score + queryResult.score + nteeResult.score,
    breakdown: {
      name: nameResult,
      description: descResult,
      query: queryResult,
      ntee: nteeResult,
    },
  };
}

/**
 * Extract geographic score from organization name (0-40 points)
 */
function extractGeoFromName(
  orgName: string,
  targetCountry: string
): { score: number; reason: string } {
  const nameLower = orgName.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Exact country match in name
  if (nameLower.includes(targetLower)) {
    return { score: 40, reason: `Name contains "${targetCountry}"` };
  }
  
  // Demonym match (e.g., "Nigerian" for Nigeria)
  const demonyms = getDemonyms(targetCountry);
  for (const demonym of demonyms) {
    if (nameLower.includes(demonym.toLowerCase())) {
      return { score: 40, reason: `Name contains demonym "${demonym}"` };
    }
  }
  
  // Regional match (e.g., "West Africa" for Nigeria)
  const regions = getRegions(targetCountry);
  for (const region of regions) {
    if (nameLower.includes(region.toLowerCase())) {
      return { score: 20, reason: `Name contains region "${region}"` };
    }
  }
  
  return { score: 0, reason: 'No geographic match in name' };
}

/**
 * Extract geographic score from description (0-30 points)
 */
function extractGeoFromDescription(
  description: string,
  targetCountry: string
): { score: number; reason: string } {
  const descLower = description.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Service area patterns (high confidence)
  const servicePatterns = [
    `works in ${targetLower}`,
    `serves ${targetLower}`,
    `operates in ${targetLower}`,
    `based in ${targetLower}`,
    `${targetLower} communities`,
    `focused on ${targetLower}`,
    `serving ${targetLower}`,
  ];
  
  for (const pattern of servicePatterns) {
    if (descLower.includes(pattern)) {
      return { score: 30, reason: `Description mentions "${pattern}"` };
    }
  }
  
  // Country mention anywhere (medium confidence)
  if (descLower.includes(targetLower)) {
    return { score: 15, reason: `Description mentions "${targetCountry}"` };
  }
  
  // Demonym mention
  const demonyms = getDemonyms(targetCountry);
  for (const demonym of demonyms) {
    if (descLower.includes(demonym.toLowerCase())) {
      return { score: 15, reason: `Description mentions demonym "${demonym}"` };
    }
  }
  
  // Regional mention (lower confidence)
  const regions = getRegions(targetCountry);
  for (const region of regions) {
    if (descLower.includes(region.toLowerCase())) {
      return { score: 10, reason: `Description mentions region "${region}"` };
    }
  }
  
  return { score: 0, reason: 'No geographic match in description' };
}

/**
 * Get search query score (0-20 points)
 */
function getSearchQueryScore(
  query: string,
  targetCountry: string
): { score: number; reason: string } {
  const queryLower = query.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Query contained target country
  if (queryLower.includes(targetLower)) {
    return { score: 20, reason: `Matched query "${query}"` };
  }
  
  // Query contained demonym
  const demonyms = getDemonyms(targetCountry);
  for (const demonym of demonyms) {
    if (queryLower.includes(demonym.toLowerCase())) {
      return { score: 20, reason: `Query contains demonym "${demonym}"` };
    }
  }
  
  // Query contained region
  const regions = getRegions(targetCountry);
  for (const region of regions) {
    if (queryLower.includes(region.toLowerCase())) {
      return { score: 10, reason: `Query contains region "${region}"` };
    }
  }
  
  return { score: 0, reason: 'Query did not contain target country' };
}

/**
 * Get NTEE code geographic score (0-10 points)
 * International development orgs get bonus points
 */
function getNTEEGeoScore(
  nteeCode: string | undefined
): { score: number; reason: string } {
  if (!nteeCode) {
    return { score: 0, reason: 'No NTEE code' };
  }
  
  // Q3x = International Development, Relief Services
  if (nteeCode.startsWith('Q3')) {
    return { score: 10, reason: 'International Development (Q3x)' };
  }
  
  // Q = International, Foreign Affairs (general)
  if (nteeCode.startsWith('Q')) {
    return { score: 5, reason: 'International focus (Q)' };
  }
  
  // P = Human Services (could be international)
  if (nteeCode.startsWith('P')) {
    return { score: 5, reason: 'Human Services (P)' };
  }
  
  return { score: 0, reason: `NTEE ${nteeCode} not internationally focused` };
}