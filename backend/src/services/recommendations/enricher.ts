import { everyOrgClient, NonprofitEnriched } from '../everyorg/client.js';
import { NonprofitRanked } from './reranker.js';

/**
 * Enriched result with full details
 */
export interface EnrichedNonprofit extends NonprofitRanked {
  enriched: boolean;
  enrichmentError?: string;
  isDisbursable?: boolean;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  categories?: string[];
  profileUrl: string;
}

/**
 * Enrichment result
 */
export interface EnrichmentResult {
  enriched: EnrichedNonprofit[];
  enrichmentCount: number;
  failedCount: number;
}

/**
 * Enricher Service
 * Fetches detailed nonprofit information for top candidates
 */
export class Enricher {
  private concurrencyLimit: number = 5;
  private topN: number = 20;

  /**
   * Enrich top N nonprofits with detailed information
   */
  async enrichTopNonprofits(
    ranked: NonprofitRanked[],
    topN: number = this.topN
  ): Promise<EnrichmentResult> {
    console.log(`🔍 Enriching top ${topN} nonprofits...`);

    const toEnrich = ranked.slice(0, topN);
    const enriched: EnrichedNonprofit[] = [];
    let enrichmentCount = 0;
    let failedCount = 0;

    // Process in batches to respect concurrency limit
    for (let i = 0; i < toEnrich.length; i += this.concurrencyLimit) {
      const batch = toEnrich.slice(i, i + this.concurrencyLimit);
      
      const results = await Promise.allSettled(
        batch.map(org => this.enrichSingleNonprofit(org))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          enriched.push(result.value);
          if (result.value.enriched) {
            enrichmentCount++;
          } else {
            failedCount++;
          }
        } else {
          failedCount++;
          console.error('Enrichment failed:', result.reason);
        }
      }
    }

    console.log(`✅ Enrichment complete: ${enrichmentCount} succeeded, ${failedCount} failed`);

    return {
      enriched,
      enrichmentCount,
      failedCount,
    };
  }

  /**
   * Enrich a single nonprofit
   */
  private async enrichSingleNonprofit(
    org: NonprofitRanked
  ): Promise<EnrichedNonprofit> {
    try {
      const details = await everyOrgClient.getNonprofitDetails(org.slug);

      if (!details) {
        // Enrichment failed, return base data
        return {
          ...org,
          enriched: false,
          enrichmentError: 'Failed to fetch details',
          profileUrl: `https://www.every.org/${org.slug}`,
        };
      }

      // Merge enriched data
      return {
        ...org,
        ...details,
        enriched: true,
        isDisbursable: details.isDisbursable,
        location: details.location,
        categories: details.categories,
        profileUrl: details.profileUrl,
      };
    } catch (error) {
      console.error(`Error enriching ${org.slug}:`, error);
      
      return {
        ...org,
        enriched: false,
        enrichmentError: error instanceof Error ? error.message : 'Unknown error',
        profileUrl: `https://www.every.org/${org.slug}`,
      };
    }
  }
}

// Export singleton instance
export const enricher = new Enricher();