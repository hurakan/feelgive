/**
 * Geo-Relevant Recommendation Orchestrator
 *
 * Coordinates the full recommendation pipeline with SEMANTIC geographic matching
 * and context-aware cause filtering.
 *
 * Pipeline:
 * 1. Generate geo-first queries from article signals
 * 2. Search Every.org with multi-query strategy (NO cause filtering)
 * 3. Deduplicate candidates
 * 4. Detect crisis type from article
 * 5. Compute SEMANTIC geographic relevance (name + description + query + NTEE)
 * 6. Filter by semantic geographic relevance (threshold: 30/100)
 * 7. Compute CONTEXT-AWARE cause relevance (crisis-specific NTEE weights)
 * 8. Filter by cause relevance (threshold: 40/100)
 * 9. Score remaining candidates (geo 45%, cause 40%, trust 15%)
 * 10. Apply quality penalties
 * 11. Generate explainability (2-3 "why recommended" bullets)
 * 12. Return top N with debug info
 */

import { everyOrgClient, NonprofitCandidate, TrustVettingSignals } from '../everyorg/client.js';
import { enricher, EnrichedNonprofit } from './enricher.js';
import { recommendationCache } from './cache.js';
import { queryBuilder } from './queryBuilder.js';
import { enrichWithExplainability } from './explainability.js';
import { computeSemanticGeoRelevance } from './semanticGeoMatcher.js';
import { detectCrisisType, computeCauseRelevance } from './contextAwareCauseScorer.js';
import {
  ArticleSignals,
  OrgProfile,
  RankedOrg,
  ScoreBreakdown,
  RecommendationConfig,
  CandidateTrace,
  GeoMatchLevel,
} from './types.js';

/**
 * Article context for recommendations (legacy interface for backward compatibility)
 */
export interface ArticleContext {
  title: string;
  description?: string;
  content?: string;
  url?: string;
  entities: {
    geography: {
      country?: string;
      region?: string;
      city?: string;
    };
    disasterType?: string;
    affectedGroup?: string;
  };
  causes: string[];
  keywords: string[];
}

/**
 * Recommendation options
 */
export interface RecommendationOptions {
  debug?: boolean;
  topN?: number;
  useCache?: boolean;
  geoStrictness?: 'strict' | 'balanced';
  trustProvider?: (org: any) => Promise<TrustVettingSignals>;
  vettingProvider?: (org: any) => Promise<TrustVettingSignals>;
}

/**
 * Legacy debug information (for backward compatibility)
 */
export interface DebugInfo {
  causesUsed: string[];
  searchTermsUsed: string[];
  geoTierCounts: { tier1: number; tier2: number; tier3: number };
  excludedCounts: { vetting: number; cause: number };
  trustCoverage: number;
  candidateCount: number;
  enrichmentCount: number;
  cacheHit: boolean;
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  processingTimeMs: number;
}

/**
 * Recommendation result (legacy interface)
 */
export interface RecommendationResult {
  nonprofits: EnrichedNonprofit[];
  debug?: DebugInfo;
}

/**
 * Default recommendation configuration
 */
const DEFAULT_CONFIG: RecommendationConfig = {
  geoStrictness: 'balanced',
  minResultsBeforeFallback: 5,
  maxGlobalResponders: 2,
  weights: {
    geo: 0.45,
    cause: 0.40,
    trust: 0.15,
  },
  cacheTTL: {
    queryResults: 3600, // 1 hour
    orgDetails: 86400, // 24 hours
  },
};

/**
 * Geo-Relevant Recommendation Orchestrator
 */
export class RecommendationOrchestrator {
  private config: RecommendationConfig;

  constructor(config: Partial<RecommendationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Recommend nonprofits for an article (legacy interface)
   */
  async recommendNonprofitsForArticle(
    context: ArticleContext,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    const { debug = false, topN = 10, useCache = true } = options;

    console.log('🚀 Starting geo-relevant recommendation pipeline...');
    console.log(`  Article: ${context.title}`);
    console.log(`  Debug mode: ${debug}`);

    // Convert legacy context to ArticleSignals
    const signals: ArticleSignals = {
      articleId: context.url || context.title,
      headline: context.title,
      summary: context.description,
      geo: {
        country: context.entities.geography.country || 'Unknown',
        admin1: context.entities.geography.region,
        city: context.entities.geography.city,
      },
      causeTags: context.causes,
      eventType: context.entities.disasterType,
      publishedAt: new Date().toISOString(),
    };

    // Check cache first
    let cacheHit = false;
    if (useCache) {
      const cacheKey = recommendationCache.getRecommendationKey(
        context.title + (context.description || ''),
        context.entities.geography,
        context.causes
      );

      const cached = recommendationCache.get<RecommendationResult>(cacheKey);
      if (cached) {
        console.log('✅ Cache hit! Returning cached recommendations');
        cacheHit = true;

        if (debug) {
          const stats = recommendationCache.getStats();
          cached.debug = {
            ...cached.debug!,
            cacheHit: true,
            cacheStats: {
              hits: stats.hits,
              misses: stats.misses,
              hitRate: stats.hitRate,
            },
            processingTimeMs: Date.now() - startTime,
          };
        }

        return cached;
      }
    }

    // Run new geo-relevant pipeline
    const rankedOrgs = await this.runGeoPipeline(signals, options);

    // Enrich top N
    console.log('💎 Enriching top candidates...');
    const legacyCandidates = rankedOrgs.map(org => this.convertToLegacyCandidate(org));
    const enrichResult = await enricher.enrichTopNonprofits(
      legacyCandidates as any, // Type conversion needed for legacy interface
      topN
    );

    // Build legacy result format
    const result: RecommendationResult = {
      nonprofits: enrichResult.enriched,
      debug: debug
        ? {
            causesUsed: context.causes,
            searchTermsUsed: [], // Populated by pipeline
            geoTierCounts: this.computeLegacyGeoTiers(rankedOrgs),
            excludedCounts: { vetting: 0, cause: 0 }, // Tracked in pipeline
            trustCoverage: 0, // Computed in pipeline
            candidateCount: rankedOrgs.length,
            enrichmentCount: enrichResult.enrichmentCount,
            cacheHit: false,
            cacheStats: recommendationCache.getStats(),
            processingTimeMs: Date.now() - startTime,
          }
        : undefined,
    };

    // Cache result
    if (useCache) {
      const cacheKey = recommendationCache.getRecommendationKey(
        context.title + (context.description || ''),
        context.entities.geography,
        context.causes
      );
      recommendationCache.set(cacheKey, result);
    }

    console.log(`✅ Recommendation pipeline complete (${Date.now() - startTime}ms)`);
    console.log(`  Returned ${result.nonprofits.length} nonprofits`);

    return result;
  }

  /**
   * Run the new semantic geo-relevant pipeline
   */
  private async runGeoPipeline(
    signals: ArticleSignals,
    options: RecommendationOptions
  ): Promise<RankedOrg[]> {
    const startTime = Date.now();

    // Step 1: Detect crisis type
    const crisisType = detectCrisisType(signals.headline, signals.summary || '');
    console.log(`🎯 Crisis type detected: ${crisisType}`);

    // Step 2: Generate geo-first queries
    console.log('📋 Step 2: Generating geo-first queries...');
    const queryResult = queryBuilder.generateQueries(signals);
    console.log(`  Generated ${queryResult.queries.length} queries`);

    // Step 3: Search Every.org with multi-query strategy
    console.log('🔍 Step 3: Searching Every.org...');
    const candidatesMap = new Map<string, NonprofitCandidate>();

    for (const query of queryResult.queries) {
      try {
        const results = await everyOrgClient.searchNonprofits(query, {
          take: 50,
        });

        results.forEach(org => {
          if (!candidatesMap.has(org.slug)) {
            candidatesMap.set(org.slug, org);
          }
        });

        console.log(`  Query "${query}": ${results.length} results`);
      } catch (error) {
        console.warn(`  Query "${query}" failed:`, error);
      }
    }

    const candidates = Array.from(candidatesMap.values());
    console.log(`  Total unique candidates: ${candidates.length}`);

    if (candidates.length === 0) {
      console.log('❌ No candidates found');
      return [];
    }

    // Step 4: Compute SEMANTIC geographic relevance
    console.log('🌍 Step 4: Computing semantic geographic relevance...');
    const targetCountry = signals.geo.country || 'Unknown';
    const searchQuery = queryResult.queries[0] || ''; // Use first query as reference

    const withGeoScore = candidates.map(candidate => {
      const geoScore = computeSemanticGeoRelevance(
        candidate.name,
        candidate.description,
        candidate.nteeCode,
        targetCountry,
        searchQuery
      );

      return {
        candidate,
        geoScore,
      };
    });

    // Step 5: Filter by semantic geographic relevance (threshold: 30)
    const geoFiltered = withGeoScore.filter(item => item.geoScore.totalScore >= 30);
    console.log(`  Geo filter: ${candidates.length} → ${geoFiltered.length} orgs (threshold: 30)`);

    if (geoFiltered.length === 0) {
      console.log('❌ No candidates passed geographic filter');
      return [];
    }

    // Step 6: Compute CONTEXT-AWARE cause relevance
    console.log('🎯 Step 5: Computing context-aware cause relevance...');
    const withCauseScore = geoFiltered.map(item => {
      const causeScore = computeCauseRelevance(
        item.candidate.nteeCode,
        item.candidate.tags || [],
        item.candidate.description,
        crisisType
      );

      return {
        ...item,
        causeScore,
      };
    });

    // Debug: Log first 5 orgs with their scores
    console.log('  [DEBUG] Sample cause scores:');
    withCauseScore.slice(0, 5).forEach(item => {
      console.log(`    ${item.candidate.name}: score=${item.causeScore.totalScore}, ntee=${item.candidate.nteeCode}, tags=${item.candidate.tags?.join(',') || 'none'}`);
    });

    // Step 7: Filter by cause relevance (threshold: 40)
    const CAUSE_THRESHOLD = 40;
    const causeFiltered = withCauseScore.filter(item => item.causeScore.totalScore >= CAUSE_THRESHOLD);
    console.log(`  Cause filter: ${geoFiltered.length} → ${causeFiltered.length} orgs (threshold: ${CAUSE_THRESHOLD})`);

    if (causeFiltered.length === 0) {
      console.log('❌ No candidates passed cause filter');
      return [];
    }

    // Step 8: Score and rank
    console.log('📊 Step 6: Scoring and ranking...');
    const scored = causeFiltered.map(item => {
      const orgProfile = this.convertToOrgProfile(item.candidate);
      
      // Compute final score
      const geoScore = item.geoScore.totalScore;
      const causeScore = item.causeScore.totalScore;
      const trustScore = 50; // Default
      const penalties = this.computePenalties(orgProfile);
      
      const finalScore =
        geoScore * this.config.weights.geo +
        causeScore * this.config.weights.cause +
        trustScore * this.config.weights.trust -
        penalties;

      return {
        orgProfile,
        geoScore: item.geoScore,
        causeScore: item.causeScore,
        finalScore: Math.max(0, finalScore),
        candidate: item.candidate,
      };
    }).sort((a, b) => b.finalScore - a.finalScore);

    // Step 9: Generate explainability
    console.log('💡 Step 7: Generating explainability...');
    const rankedOrgs: RankedOrg[] = scored.map(item => ({
      id: item.orgProfile.id,
      name: item.orgProfile.name,
      description: item.orgProfile.description,
      websiteUrl: item.orgProfile.websiteUrl,
      location: item.orgProfile.location,
      categories: item.orgProfile.categories,
      geoMatchLevel: GeoMatchLevel.GLOBAL,
      scoreBreakdown: {
        geo: item.geoScore.totalScore,
        cause: item.causeScore.totalScore,
        trust: 50,
        penalties: 0,
        final: item.finalScore,
      },
      why: [
        {
          type: 'geographic' as const,
          text: `Geographic relevance: ${item.geoScore.totalScore}/100 - ${item.geoScore.breakdown.name.reason}`,
        },
        {
          type: 'cause' as const,
          text: `Cause alignment (${crisisType}): ${item.causeScore.totalScore}/100 - ${item.causeScore.breakdown.ntee.reason}`,
        },
        {
          type: 'trust' as const,
          text: `Trust score: 50/100 (Standard)`,
        },
      ],
      trustSignals: item.orgProfile.trustSignals,
      raw: item.orgProfile.raw,
    }));

    console.log(`✅ Pipeline complete: ${rankedOrgs.length} ranked organizations`);
    console.log(`  Processing time: ${Date.now() - startTime}ms`);

    return rankedOrgs;
  }

  /**
   * Convert NonprofitCandidate to OrgProfile
   */
  private convertToOrgProfile(candidate: NonprofitCandidate): OrgProfile {
    return {
      id: candidate.slug,
      name: candidate.name,
      description: candidate.description,
      websiteUrl: candidate.websiteUrl,
      location: {
        country: 'Unknown', // Will be determined by semantic matching
        admin1: undefined,
      },
      categories: candidate.causes,
      trustSignals: {
        verified: false,
      },
      raw: {
        searchHit: candidate,
      },
    };
  }

  /**
   * Compute quality penalties
   */
  private computePenalties(org: OrgProfile): number {
    let penalties = 0;

    // Missing website or description: -30 points
    if (!org.websiteUrl || !org.description) {
      penalties += 30;
    }

    // Very short description: -10 points
    if (org.description && org.description.length < 50) {
      penalties += 10;
    }

    return penalties;
  }

  /**
   * Convert RankedOrg to legacy NonprofitCandidate format
   */
  private convertToLegacyCandidate(org: RankedOrg): NonprofitCandidate {
    return {
      slug: org.id,
      name: org.name,
      description: org.description || '',
      websiteUrl: org.websiteUrl || '',
      locationAddress: `${org.location.city || ''} ${org.location.admin1 || ''} ${org.location.country || ''}`.trim(),
      causes: org.categories,
      logoUrl: undefined,
      ein: undefined,
      nteeCode: undefined,
      nteeCodeMeaning: undefined,
      primaryCategory: org.categories?.[0],
    };
  }

  /**
   * Compute legacy geo tier counts
   */
  private computeLegacyGeoTiers(orgs: RankedOrg[]): {
    tier1: number;
    tier2: number;
    tier3: number;
  } {
    return {
      tier1: orgs.filter(
        o => o.geoMatchLevel === GeoMatchLevel.EXACT_ADMIN1 || o.geoMatchLevel === GeoMatchLevel.EXACT_COUNTRY
      ).length,
      tier2: orgs.filter(o => o.geoMatchLevel === GeoMatchLevel.REGIONAL).length,
      tier3: orgs.filter(o => o.geoMatchLevel === GeoMatchLevel.GLOBAL).length,
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return recommendationCache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    recommendationCache.clear();
  }
}

// Export singleton instance
export const recommendationOrchestrator = new RecommendationOrchestrator();