/**
 * Geographic Matching System
 * 
 * Computes geographic relevance between article location and organization location
 * with strict levels: EXACT_ADMIN1, EXACT_COUNTRY, REGIONAL, GLOBAL, MISMATCH
 */

import {
  GeoMatchLevel,
  GeoMatchResult,
} from './types.js';
import {
  NormalizedGeo,
  areDirectNeighbors,
  areInSameRegion,
  getRegionName,
} from './geoNormalizer.js';

/**
 * Compute geographic match between article and organization
 * 
 * @param orgGeo - Normalized organization location
 * @param targetGeo - Normalized article/crisis location
 * @returns Geographic match result with level, score, and reason
 */
export function computeGeoMatch(
  orgGeo: NormalizedGeo,
  targetGeo: NormalizedGeo
): GeoMatchResult {
  // Handle unknown org location
  if (!orgGeo.country || orgGeo.country === 'Unknown') {
    return {
      level: GeoMatchLevel.GLOBAL,
      score: 0.3,
      reason: 'Location data unavailable; may operate globally',
    };
  }

  // EXACT_ADMIN1: Same country + same admin1 (state/province)
  if (targetGeo.admin1 && orgGeo.admin1) {
    if (
      orgGeo.country === targetGeo.country &&
      orgGeo.admin1.toLowerCase() === targetGeo.admin1.toLowerCase()
    ) {
      return {
        level: GeoMatchLevel.EXACT_ADMIN1,
        score: 1.5,
        reason: `Based in ${orgGeo.admin1}, ${orgGeo.country}`,
      };
    }
  }

  // EXACT_COUNTRY: Same country (but different or missing admin1)
  if (orgGeo.country === targetGeo.country) {
    // If target has admin1 but org doesn't, it's still country match
    // but with slightly lower confidence
    const hasAdmin1Mismatch = targetGeo.admin1 && !orgGeo.admin1;
    
    return {
      level: GeoMatchLevel.EXACT_COUNTRY,
      score: hasAdmin1Mismatch ? 1.2 : 1.3,
      reason: `Based in ${orgGeo.country}`,
    };
  }

  // REGIONAL: Direct neighbor or same region
  
  // Check direct neighbors (share border)
  if (areDirectNeighbors(orgGeo.country, targetGeo.country)) {
    return {
      level: GeoMatchLevel.REGIONAL,
      score: 0.8,
      reason: `Based in ${orgGeo.country} (neighboring country)`,
    };
  }

  // Check same region
  if (areInSameRegion(orgGeo.country, targetGeo.country)) {
    const regionName = getRegionName(targetGeo.country);
    return {
      level: GeoMatchLevel.REGIONAL,
      score: 0.6,
      reason: `Based in ${orgGeo.country} (${regionName || 'same region'})`,
    };
  }

  // Check for "global" indicators in org location
  const globalIndicators = ['global', 'international', 'worldwide'];
  const orgLocationLower = `${orgGeo.country} ${orgGeo.admin1 || ''}`.toLowerCase();
  
  if (globalIndicators.some(indicator => orgLocationLower.includes(indicator))) {
    return {
      level: GeoMatchLevel.GLOBAL,
      score: 0.4,
      reason: 'Global responder organization',
    };
  }

  // MISMATCH: No geographic connection
  return {
    level: GeoMatchLevel.MISMATCH,
    score: 0.0,
    reason: `Based in ${orgGeo.country} (no regional connection)`,
  };
}

/**
 * Check if organization passes geo filter based on strictness level
 * 
 * @param geoMatch - Geographic match result
 * @param strictness - Filter strictness ('strict' or 'balanced')
 * @param targetHasAdmin1 - Whether target location has admin1 data
 * @returns true if org passes filter
 */
export function passesGeoFilter(
  geoMatch: GeoMatchResult,
  strictness: 'strict' | 'balanced',
  targetHasAdmin1: boolean
): boolean {
  const { level } = geoMatch;

  // Always exclude MISMATCH
  if (level === GeoMatchLevel.MISMATCH) {
    return false;
  }

  // Strict mode with admin1 data: require EXACT_ADMIN1 or EXACT_COUNTRY
  if (strictness === 'strict' && targetHasAdmin1) {
    return level === GeoMatchLevel.EXACT_ADMIN1 || level === GeoMatchLevel.EXACT_COUNTRY;
  }

  // Balanced mode or no admin1: allow REGIONAL and GLOBAL
  return true;
}

/**
 * Determine appropriate fallback level when results are insufficient
 * 
 * @param currentLevel - Current filter level
 * @returns Next wider filter level
 */
export function getNextFallbackLevel(
  currentLevel: 'admin1' | 'country' | 'regional' | 'global'
): 'country' | 'regional' | 'global' | null {
  switch (currentLevel) {
    case 'admin1':
      return 'country';
    case 'country':
      return 'regional';
    case 'regional':
      return 'global';
    case 'global':
      return null; // No more fallbacks
  }
}

/**
 * Get minimum acceptable geo levels for a fallback stage
 * 
 * @param fallbackLevel - Current fallback level
 * @returns Array of acceptable GeoMatchLevels
 */
export function getAcceptableGeoLevels(
  fallbackLevel: 'admin1' | 'country' | 'regional' | 'global'
): GeoMatchLevel[] {
  switch (fallbackLevel) {
    case 'admin1':
      return [GeoMatchLevel.EXACT_ADMIN1];
    case 'country':
      return [GeoMatchLevel.EXACT_ADMIN1, GeoMatchLevel.EXACT_COUNTRY];
    case 'regional':
      return [
        GeoMatchLevel.EXACT_ADMIN1,
        GeoMatchLevel.EXACT_COUNTRY,
        GeoMatchLevel.REGIONAL,
      ];
    case 'global':
      return [
        GeoMatchLevel.EXACT_ADMIN1,
        GeoMatchLevel.EXACT_COUNTRY,
        GeoMatchLevel.REGIONAL,
        GeoMatchLevel.GLOBAL,
      ];
  }
}

/**
 * Apply controlled fallback widening to ensure minimum results
 * 
 * @param rankedOrgs - Organizations with geo match results
 * @param minResults - Minimum number of results desired
 * @param maxGlobalResponders - Maximum global responders to include
 * @returns Filtered organizations with fallback applied
 */
export function applyControlledFallback<T extends { geoMatch: GeoMatchResult }>(
  rankedOrgs: T[],
  minResults: number,
  maxGlobalResponders: number = 2
): {
  filtered: T[];
  fallbackLevel: 'admin1' | 'country' | 'regional' | 'global' | 'none';
  message?: string;
} {
  // Start with strictest filter
  let currentLevel: 'admin1' | 'country' | 'regional' | 'global' = 'admin1';
  let filtered: T[] = [];

  // Try progressively wider filters
  while (filtered.length < minResults) {
    const acceptableLevels = getAcceptableGeoLevels(currentLevel);
    filtered = rankedOrgs.filter(org =>
      acceptableLevels.includes(org.geoMatch.level)
    );

    // If we have enough results, stop
    if (filtered.length >= minResults) {
      break;
    }

    // Try next fallback level
    const nextLevel = getNextFallbackLevel(currentLevel);
    if (!nextLevel) {
      // No more fallbacks available
      break;
    }

    currentLevel = nextLevel;
  }

  // Limit global responders if we're at global fallback level
  if (currentLevel === 'global') {
    const globalOrgs = filtered.filter(
      org => org.geoMatch.level === GeoMatchLevel.GLOBAL
    );
    const nonGlobalOrgs = filtered.filter(
      org => org.geoMatch.level !== GeoMatchLevel.GLOBAL
    );

    // Keep all non-global + limited global
    filtered = [
      ...nonGlobalOrgs,
      ...globalOrgs.slice(0, maxGlobalResponders),
    ];
  }

  const fallbackLevel = filtered.length > 0 ? currentLevel : 'none';
  const message =
    fallbackLevel !== 'admin1'
      ? `Applied ${fallbackLevel} fallback to ensure sufficient results`
      : undefined;

  return {
    filtered,
    fallbackLevel,
    message,
  };
}

/**
 * Get human-readable description of geo match level
 */
export function getGeoLevelDescription(level: GeoMatchLevel): string {
  switch (level) {
    case GeoMatchLevel.EXACT_ADMIN1:
      return 'Local organization (state/province match)';
    case GeoMatchLevel.EXACT_COUNTRY:
      return 'National organization (country match)';
    case GeoMatchLevel.REGIONAL:
      return 'Regional organization (neighboring country or same region)';
    case GeoMatchLevel.GLOBAL:
      return 'Global responder organization';
    case GeoMatchLevel.MISMATCH:
      return 'No geographic connection';
  }
}

/**
 * Get badge text for UI display
 */
export function getGeoBadge(level: GeoMatchLevel): string | undefined {
  switch (level) {
    case GeoMatchLevel.EXACT_ADMIN1:
      return 'Local';
    case GeoMatchLevel.EXACT_COUNTRY:
      return 'National';
    case GeoMatchLevel.REGIONAL:
      return 'Regional';
    case GeoMatchLevel.GLOBAL:
      return 'Global Responder';
    case GeoMatchLevel.MISMATCH:
      return undefined; // Should be filtered out
  }
}