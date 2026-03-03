/**
 * Enhanced Recommendation Engine Types
 * 
 * This module defines the core types for the geo-relevant recommendation engine
 * with strict geographic filtering, explainability, and comprehensive testing support.
 */

/**
 * Normalized geographic information from article classification
 */
export interface ArticleGeo {
  /** ISO country code or full country name */
  country: string;
  /** State/province/admin level 1 (e.g., "California", "CA") */
  admin1?: string;
  /** County/district/admin level 2 */
  admin2?: string;
  /** City name */
  city?: string;
  /** Latitude coordinate */
  lat?: number;
  /** Longitude coordinate */
  lon?: number;
  /** Regional code (e.g., "middle-east", "southeast-asia") */
  regionCode?: string;
}

/**
 * Complete article signals for recommendation engine
 */
export interface ArticleSignals {
  /** Unique article identifier */
  articleId: string;
  /** Article headline */
  headline: string;
  /** Article summary/description */
  summary?: string;
  /** Normalized geographic information */
  geo: ArticleGeo;
  /** Cause tags (3-8 tags recommended) */
  causeTags: string[];
  /** Event type (e.g., flood, earthquake, wildfire, conflict) */
  eventType?: string;
  /** Publication timestamp */
  publishedAt: string;
}

/**
 * Organization location information
 */
export interface OrgLocation {
  country?: string;
  admin1?: string;
  city?: string;
  lat?: number;
  lon?: number;
}

/**
 * Trust signals for an organization
 */
export interface OrgTrustSignals {
  verified?: boolean;
  charityNavigatorRating?: number;
  guidestarRating?: string;
  [key: string]: any;
}

/**
 * Enriched organization profile
 */
export interface OrgProfile {
  /** Every.org identifier */
  id: string;
  /** Organization name */
  name: string;
  /** Description */
  description?: string;
  /** Website URL */
  websiteUrl?: string;
  /** Location information */
  location: OrgLocation;
  /** Categories/tags */
  categories?: string[];
  /** Trust signals */
  trustSignals?: OrgTrustSignals;
  /** Raw data from Every.org */
  raw: {
    searchHit?: any;
    nonprofitDetail?: any;
  };
}

/**
 * Geographic match levels for filtering
 */
export enum GeoMatchLevel {
  /** Same country + same admin1 (state/province) */
  EXACT_ADMIN1 = 'EXACT_ADMIN1',
  /** Same country only */
  EXACT_COUNTRY = 'EXACT_COUNTRY',
  /** Same region or neighboring country */
  REGIONAL = 'REGIONAL',
  /** Global responder or no location data */
  GLOBAL = 'GLOBAL',
  /** No geographic match */
  MISMATCH = 'MISMATCH',
}

/**
 * Geographic match result
 */
export interface GeoMatchResult {
  level: GeoMatchLevel;
  score: number; // 0-1.5
  reason: string;
}

/**
 * Score breakdown for an organization
 */
export interface ScoreBreakdown {
  geo: number;
  cause: number;
  trust: number;
  penalties: number;
  final: number;
}

/**
 * Recommendation reason (for explainability)
 */
export interface RecommendationReason {
  type: 'geographic' | 'cause' | 'trust' | 'global';
  text: string;
}

/**
 * Ranked organization with explainability
 */
export interface RankedOrg extends OrgProfile {
  /** Geographic match level */
  geoMatchLevel: GeoMatchLevel;
  /** Score breakdown */
  scoreBreakdown: ScoreBreakdown;
  /** Why recommended (2-3 bullets) */
  why: RecommendationReason[];
  /** Badge for UI (e.g., "Global Responder") */
  badge?: string;
}

/**
 * Geo strictness configuration
 */
export type GeoStrictness = 'strict' | 'balanced';

/**
 * Recommendation configuration
 */
export interface RecommendationConfig {
  /** Geographic strictness level */
  geoStrictness: GeoStrictness;
  /** Minimum results before fallback widening */
  minResultsBeforeFallback: number;
  /** Maximum global responders to include */
  maxGlobalResponders: number;
  /** Score weights */
  weights: {
    geo: number;
    cause: number;
    trust: number;
  };
  /** Cache TTLs in seconds */
  cacheTTL: {
    queryResults: number;
    orgDetails: number;
  };
}

/**
 * Query generation result
 */
export interface QueryGenerationResult {
  queries: string[];
  priorityA: string[]; // Geo-first queries
  priorityB: string[]; // Cause + geo queries
  priorityC: string[]; // Fallback queries
}

/**
 * Candidate generation trace
 */
export interface CandidateTrace {
  query: string;
  idsReturned: string[];
  resultCount: number;
}

/**
 * Filter statistics
 */
export interface FilterStats {
  totalCandidates: number;
  afterGeoFilter: number;
  afterCauseFilter: number;
  afterQualityFilter: number;
  finalCount: number;
  geoLevelCounts: {
    [key in GeoMatchLevel]: number;
  };
}

/**
 * Debug information for recommendation pipeline
 */
export interface RecommendationDebug {
  /** Generated queries */
  queries: QueryGenerationResult;
  /** Candidate traces */
  candidateTraces: CandidateTrace[];
  /** Deduplication count */
  dedupeCount: number;
  /** Filter statistics */
  filterStats: FilterStats;
  /** Top 20 scored orgs with breakdowns */
  topScoredOrgs: Array<{
    name: string;
    geoMatchLevel: GeoMatchLevel;
    scoreBreakdown: ScoreBreakdown;
  }>;
  /** Processing time in ms */
  processingTimeMs: number;
  /** Cache hit information */
  cacheHits: {
    queries: number;
    orgDetails: number;
  };
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  /** Top recommended organizations (5-10) */
  topOrgs: RankedOrg[];
  /** Debug information (if debug mode enabled) */
  debug?: RecommendationDebug;
}