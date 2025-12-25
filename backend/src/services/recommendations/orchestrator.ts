import { candidateGenerator, ArticleEntities } from './candidateGenerator.js';
import { reranker } from './reranker.js';
import { enricher, EnrichedNonprofit } from './enricher.js';
import { recommendationCache } from './cache.js';
import { TrustVettingSignals } from '../everyorg/client.js';

/**
 * Article context for recommendations
 */
export interface ArticleContext {
  title: string;
  description?: string;
  content?: string;
  url?: string;
  entities: ArticleEntities;
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
  trustProvider?: (org: any) => Promise<TrustVettingSignals>;
  vettingProvider?: (org: any) => Promise<TrustVettingSignals>;
}

/**
 * Debug information
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
 * Recommendation result
 */
export interface RecommendationResult {
  nonprofits: EnrichedNonprofit[];
  debug?: DebugInfo;
}

/**
 * Recommendation Orchestrator
 * Coordinates the full recommendation pipeline
 */
export class RecommendationOrchestrator {
  /**
   * Recommend nonprofits for an article
   */
  async recommendNonprofitsForArticle(
    context: ArticleContext,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult> {
    const startTime = Date.now();
    const { debug = false, topN = 10, useCache = true } = options;

    console.log('🚀 Starting recommendation pipeline...');
    console.log(`  Article: ${context.title}`);
    console.log(`  Debug mode: ${debug}`);

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

    // Build article text
    const articleText = [
      context.title,
      context.description || '',
      context.content || '',
    ].join(' ');

    // Step 1: Generate candidates
    console.log('📋 Step 1: Generating candidates...');
    const candidateResult = await candidateGenerator.generateCandidates({
      articleText,
      entities: context.entities,
      causes: context.causes,
    });

    if (candidateResult.candidates.length === 0) {
      console.log('❌ No candidates found');
      return {
        nonprofits: [],
        debug: debug ? {
          causesUsed: candidateResult.causesUsed,
          searchTermsUsed: candidateResult.searchTermsUsed,
          geoTierCounts: { tier1: 0, tier2: 0, tier3: 0 },
          excludedCounts: { vetting: 0, cause: 0 },
          trustCoverage: 0,
          candidateCount: 0,
          enrichmentCount: 0,
          cacheHit: false,
          cacheStats: recommendationCache.getStats(),
          processingTimeMs: Date.now() - startTime,
        } : undefined,
      };
    }

    // Step 2: Rerank candidates
    console.log('🎯 Step 2: Reranking candidates...');
    const rerankResult = await reranker.rerank({
      candidates: candidateResult.candidates,
      entities: context.entities,
      causes: context.causes,
      articleKeywords: context.keywords,
      trustProvider: options.trustProvider,
      vettingProvider: options.vettingProvider,
    });

    if (rerankResult.ranked.length === 0) {
      console.log('❌ No candidates passed ranking filters');
      return {
        nonprofits: [],
        debug: debug ? {
          causesUsed: candidateResult.causesUsed,
          searchTermsUsed: candidateResult.searchTermsUsed,
          geoTierCounts: rerankResult.geoTierCounts,
          excludedCounts: rerankResult.excludedCounts,
          trustCoverage: rerankResult.trustCoverage,
          candidateCount: candidateResult.candidateCount,
          enrichmentCount: 0,
          cacheHit: false,
          cacheStats: recommendationCache.getStats(),
          processingTimeMs: Date.now() - startTime,
        } : undefined,
      };
    }

    // Step 3: Enrich top N
    console.log('💎 Step 3: Enriching top candidates...');
    const enrichResult = await enricher.enrichTopNonprofits(
      rerankResult.ranked,
      topN
    );

    // Build result
    const result: RecommendationResult = {
      nonprofits: enrichResult.enriched,
      debug: debug ? {
        causesUsed: candidateResult.causesUsed,
        searchTermsUsed: candidateResult.searchTermsUsed,
        geoTierCounts: rerankResult.geoTierCounts,
        excludedCounts: rerankResult.excludedCounts,
        trustCoverage: rerankResult.trustCoverage,
        candidateCount: candidateResult.candidateCount,
        enrichmentCount: enrichResult.enrichmentCount,
        cacheHit: false,
        cacheStats: recommendationCache.getStats(),
        processingTimeMs: Date.now() - startTime,
      } : undefined,
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