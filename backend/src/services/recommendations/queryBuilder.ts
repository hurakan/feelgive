/**
 * Enhanced Query Builder
 * 
 * Generates multi-query search terms with geo-first priority for the recommendation engine.
 * Prioritizes geographic relevance while maintaining cause-based matching.
 */

import { ArticleSignals, QueryGenerationResult } from './types.js';
import { normalizeCountryName, normalizeAdmin1 } from './geoNormalizer.js';

/**
 * Query builder configuration
 */
export interface QueryBuilderConfig {
  /** Maximum total queries to generate */
  maxQueries: number;
  /** Include synonym expansion */
  useSynonyms: boolean;
  /** Minimum query length in characters */
  minQueryLength: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: QueryBuilderConfig = {
  maxQueries: 12,
  useSynonyms: true,
  minQueryLength: 3,
};

/**
 * Disaster/event type synonyms for query expansion
 */
const EVENT_SYNONYMS: Record<string, string[]> = {
  'earthquake': ['earthquake', 'seismic', 'tremor'],
  'flood': ['flood', 'flooding', 'deluge'],
  'wildfire': ['wildfire', 'fire', 'bushfire'],
  'hurricane': ['hurricane', 'cyclone', 'typhoon', 'storm'],
  'tornado': ['tornado', 'twister'],
  'drought': ['drought', 'water crisis'],
  'famine': ['famine', 'hunger', 'food crisis'],
  'conflict': ['conflict', 'war', 'crisis'],
  'refugee': ['refugee', 'displaced', 'asylum'],
  'disaster': ['disaster', 'emergency', 'crisis'],
};

/**
 * Generic relief terms for fallback queries
 */
const RELIEF_TERMS = [
  'disaster relief',
  'emergency response',
  'humanitarian aid',
  'relief fund',
  'emergency relief',
  'crisis response',
];

/**
 * Enhanced Query Builder
 * Generates geo-first queries with controlled fallbacks
 */
export class QueryBuilder {
  private config: QueryBuilderConfig;

  constructor(config: Partial<QueryBuilderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate queries from article signals
   */
  generateQueries(signals: ArticleSignals): QueryGenerationResult {
    const priorityA: string[] = []; // Geo-first queries
    const priorityB: string[] = []; // Cause + geo queries
    const priorityC: string[] = []; // Fallback queries

    // Normalize geographic data
    const country = normalizeCountryName(signals.geo.country);
    const admin1 = signals.geo.admin1 
      ? normalizeAdmin1(signals.geo.admin1, signals.geo.country)
      : undefined;
    const city = signals.geo.city;

    // Extract top cause keywords
    const topCauseKeywords = this.extractTopCauseKeywords(signals.causeTags);
    const eventType = signals.eventType;

    // Priority A: Geo-first queries (highest priority)
    this.buildGeoFirstQueries(country, admin1, city, priorityA);

    // Priority B: Cause + geo queries
    this.buildCauseGeoQueries(
      country,
      admin1,
      city,
      eventType,
      topCauseKeywords,
      priorityB
    );

    // Priority C: Fallback queries
    this.buildFallbackQueries(country, admin1, eventType, priorityC);

    // Deduplicate and limit
    const allQueries = [
      ...this.deduplicateQueries(priorityA),
      ...this.deduplicateQueries(priorityB),
      ...this.deduplicateQueries(priorityC),
    ];

    const limitedQueries = allQueries.slice(0, this.config.maxQueries);

    return {
      queries: limitedQueries,
      priorityA: priorityA.slice(0, Math.ceil(this.config.maxQueries * 0.4)),
      priorityB: priorityB.slice(0, Math.ceil(this.config.maxQueries * 0.4)),
      priorityC: priorityC.slice(0, Math.ceil(this.config.maxQueries * 0.2)),
    };
  }

  /**
   * Build geo-first queries (Priority A)
   */
  private buildGeoFirstQueries(
    country: string,
    admin1: string | undefined,
    city: string | undefined,
    queries: string[]
  ): void {
    // Country-level queries - use simpler terms that match Every.org's database
    queries.push(`${country} humanitarian`);
    queries.push(`${country} relief`);
    queries.push(`${country} aid`);

    // Admin1 (state/province) level if available
    if (admin1) {
      queries.push(`${admin1} humanitarian`);
      queries.push(`${admin1} relief`);
      queries.push(`${admin1} aid`);
    }

    // City level if available
    if (city) {
      queries.push(`${city} humanitarian`);
      queries.push(`${city} relief`);
    }
  }

  /**
   * Build cause + geo queries (Priority B)
   */
  private buildCauseGeoQueries(
    country: string,
    admin1: string | undefined,
    city: string | undefined,
    eventType: string | undefined,
    causeKeywords: string[],
    queries: string[]
  ): void {
    // Event type + country
    if (eventType) {
      const eventVariants = this.getEventVariants(eventType);
      
      for (const variant of eventVariants.slice(0, 2)) {
        queries.push(`${country} ${variant}`);
        queries.push(`${variant} ${country}`);
        
        if (admin1) {
          queries.push(`${admin1} ${variant}`);
        }
      }
    }

    // Top cause keyword + country
    if (causeKeywords.length > 0) {
      const topKeyword = causeKeywords[0];
      queries.push(`${country} ${topKeyword}`);
      
      if (admin1) {
        queries.push(`${admin1} ${topKeyword}`);
      }
    }

    // Cause keyword + event type (if both available)
    if (eventType && causeKeywords.length > 0) {
      const topKeyword = causeKeywords[0];
      queries.push(`${topKeyword} ${eventType} ${country}`);
    }
  }

  /**
   * Build fallback queries (Priority C)
   */
  private buildFallbackQueries(
    country: string,
    admin1: string | undefined,
    eventType: string | undefined,
    queries: string[]
  ): void {
    // Simpler fallback terms that match Every.org's database
    queries.push(`${country} disaster`);
    queries.push(`${country} emergency`);
    queries.push(`${country} crisis`);

    // Event type + simple terms (if event type available)
    if (eventType) {
      queries.push(`${eventType} relief`);
      queries.push(`${eventType} aid`);
    }

    // Admin1 + simple terms (if admin1 available)
    if (admin1) {
      queries.push(`${admin1} disaster`);
    }
  }

  /**
   * Extract top cause keywords from tags
   */
  private extractTopCauseKeywords(causeTags: string[]): string[] {
    if (!causeTags || causeTags.length === 0) {
      return [];
    }

    // Filter out very generic tags and sort by specificity
    const filtered = causeTags
      .filter(tag => tag.length > 3 && !['other', 'general'].includes(tag.toLowerCase()))
      .slice(0, 3);

    return filtered;
  }

  /**
   * Get event type variants (synonyms)
   */
  private getEventVariants(eventType: string): string[] {
    const normalized = eventType.toLowerCase().trim();
    
    // Check if we have synonyms
    for (const [key, synonyms] of Object.entries(EVENT_SYNONYMS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return this.config.useSynonyms ? synonyms : [eventType];
      }
    }

    // Return original if no synonyms found
    return [eventType];
  }

  /**
   * Deduplicate queries (case-insensitive)
   */
  private deduplicateQueries(queries: string[]): string[] {
    const seen = new Set<string>();
    const deduped: string[] = [];

    for (const query of queries) {
      const normalized = query.toLowerCase().trim();
      
      // Skip if too short
      if (normalized.length < this.config.minQueryLength) {
        continue;
      }

      // Skip if already seen
      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      deduped.push(query);
    }

    return deduped;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QueryBuilderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): QueryBuilderConfig {
    return { ...this.config };
  }
}

/**
 * Singleton instance with default configuration
 */
export const queryBuilder = new QueryBuilder();

/**
 * Helper function to generate queries from article signals
 */
export function generateQueries(signals: ArticleSignals): QueryGenerationResult {
  return queryBuilder.generateQueries(signals);
}