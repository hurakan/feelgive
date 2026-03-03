/**
 * Relevance Threshold Filter
 * 
 * Part of FeelGive's secret sauce - ensures only high-quality, relevant
 * organizations are recommended by applying minimum thresholds.
 */

import { GeoMatchLevel } from './types.js';
import { CauseRelevanceScore } from './causeScorer.js';

/**
 * Scored candidate with all relevance metrics
 */
export interface ScoredCandidate {
  orgId: string;
  orgName: string;
  geoMatchLevel: GeoMatchLevel;
  geoScore: number;
  causeRelevance: CauseRelevanceScore;
  trustScore: number;
  compositeScore: number;
  [key: string]: any; // Allow additional properties
}

/**
 * Relevance thresholds configuration
 */
export interface RelevanceThresholds {
  /** Minimum geographic score (0-150, normalized from match level) */
  minGeoScore: number;
  
  /** Minimum cause relevance score (0-100) */
  minCauseScore: number;
  
  /** Minimum trust score (0-100) */
  minTrustScore: number;
  
  /** Minimum composite score (0-100) */
  minCompositeScore: number;
  
  /** Allowed geographic match levels */
  allowedGeoLevels: GeoMatchLevel[];
}

/**
 * Default thresholds (balanced mode)
 */
export const DEFAULT_THRESHOLDS: RelevanceThresholds = {
  minGeoScore: 50,  // REGIONAL or better
  minCauseScore: 40, // At least keyword match
  minTrustScore: 50, // Basic verification
  minCompositeScore: 60, // Overall quality
  allowedGeoLevels: [
    GeoMatchLevel.EXACT_ADMIN1,
    GeoMatchLevel.EXACT_COUNTRY,
    GeoMatchLevel.REGIONAL,
    GeoMatchLevel.GLOBAL,
  ],
};

/**
 * Strict thresholds (high precision)
 */
export const STRICT_THRESHOLDS: RelevanceThresholds = {
  minGeoScore: 100, // EXACT_COUNTRY or better
  minCauseScore: 60, // Semantic match or better
  minTrustScore: 70, // High trust
  minCompositeScore: 75, // High overall quality
  allowedGeoLevels: [
    GeoMatchLevel.EXACT_ADMIN1,
    GeoMatchLevel.EXACT_COUNTRY,
    GeoMatchLevel.REGIONAL,
  ],
};

/**
 * Lenient thresholds (high recall)
 */
export const LENIENT_THRESHOLDS: RelevanceThresholds = {
  minGeoScore: 0,   // Any geographic match
  minCauseScore: 20, // Any keyword presence
  minTrustScore: 30, // Minimal verification
  minCompositeScore: 40, // Lower overall quality
  allowedGeoLevels: [
    GeoMatchLevel.EXACT_ADMIN1,
    GeoMatchLevel.EXACT_COUNTRY,
    GeoMatchLevel.REGIONAL,
    GeoMatchLevel.GLOBAL,
  ],
};

/**
 * Filter statistics
 */
export interface FilterStats {
  inputCount: number;
  outputCount: number;
  filteredByGeo: number;
  filteredByCause: number;
  filteredByTrust: number;
  filteredByComposite: number;
}

/**
 * Filter result
 */
export interface FilterResult {
  filtered: ScoredCandidate[];
  stats: FilterStats;
  thresholdsUsed: RelevanceThresholds;
}

/**
 * Relevance Filter
 */
export class RelevanceFilter {
  /**
   * Filter candidates by relevance thresholds
   */
  filterByRelevance(
    candidates: ScoredCandidate[],
    thresholds: RelevanceThresholds = DEFAULT_THRESHOLDS
  ): FilterResult {
    const stats: FilterStats = {
      inputCount: candidates.length,
      outputCount: 0,
      filteredByGeo: 0,
      filteredByCause: 0,
      filteredByTrust: 0,
      filteredByComposite: 0,
    };

    const filtered = candidates.filter(candidate => {
      // Check geographic match level
      if (!thresholds.allowedGeoLevels.includes(candidate.geoMatchLevel)) {
        stats.filteredByGeo++;
        return false;
      }

      // Check geographic score
      if (candidate.geoScore < thresholds.minGeoScore) {
        stats.filteredByGeo++;
        return false;
      }

      // Check cause relevance score
      if (candidate.causeRelevance.score < thresholds.minCauseScore) {
        stats.filteredByCause++;
        return false;
      }

      // Check trust score
      if (candidate.trustScore < thresholds.minTrustScore) {
        stats.filteredByTrust++;
        return false;
      }

      // Check composite score
      if (candidate.compositeScore < thresholds.minCompositeScore) {
        stats.filteredByComposite++;
        return false;
      }

      return true;
    });

    stats.outputCount = filtered.length;

    return {
      filtered,
      stats,
      thresholdsUsed: thresholds,
    };
  }

  /**
   * Get threshold preset by name
   */
  getThresholdPreset(preset: 'strict' | 'balanced' | 'lenient'): RelevanceThresholds {
    switch (preset) {
      case 'strict':
        return STRICT_THRESHOLDS;
      case 'lenient':
        return LENIENT_THRESHOLDS;
      case 'balanced':
      default:
        return DEFAULT_THRESHOLDS;
    }
  }

  /**
   * Adjust thresholds based on result count
   * If too few results, progressively relax thresholds
   */
  adaptiveFilter(
    candidates: ScoredCandidate[],
    minResults: number = 5,
    initialThresholds: RelevanceThresholds = DEFAULT_THRESHOLDS
  ): FilterResult {
    // Try with initial thresholds
    let result = this.filterByRelevance(candidates, initialThresholds);

    // If we have enough results, return
    if (result.filtered.length >= minResults) {
      return result;
    }

    // Try lenient thresholds
    console.log(`⚠️ Only ${result.filtered.length} results with balanced thresholds, trying lenient...`);
    result = this.filterByRelevance(candidates, LENIENT_THRESHOLDS);

    // If still not enough, return all candidates sorted by score
    if (result.filtered.length < minResults) {
      console.log(`⚠️ Only ${result.filtered.length} results with lenient thresholds, returning all candidates`);
      return {
        filtered: candidates.sort((a, b) => b.compositeScore - a.compositeScore),
        stats: {
          inputCount: candidates.length,
          outputCount: candidates.length,
          filteredByGeo: 0,
          filteredByCause: 0,
          filteredByTrust: 0,
          filteredByComposite: 0,
        },
        thresholdsUsed: LENIENT_THRESHOLDS,
      };
    }

    return result;
  }
}

// Export singleton instance
export const relevanceFilter = new RelevanceFilter();