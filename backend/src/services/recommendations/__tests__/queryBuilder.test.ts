/**
 * Unit Tests for Query Builder
 * 
 * Tests multi-query generation with geo-first priority, synonym expansion,
 * and deduplication.
 */

import { describe, it, expect } from '@jest/globals';
import { QueryBuilder, generateQueries } from '../queryBuilder.js';
import { ArticleSignals } from '../types.js';

describe('QueryBuilder', () => {
  const createArticleSignals = (overrides: Partial<ArticleSignals> = {}): ArticleSignals => ({
    articleId: 'test-123',
    headline: 'Test Article',
    summary: 'Test summary',
    geo: {
      country: 'United States',
      admin1: 'California',
      city: 'Los Angeles',
    },
    causeTags: ['disaster-relief', 'emergency-response'],
    eventType: 'wildfire',
    publishedAt: new Date().toISOString(),
    ...overrides,
  });

  describe('generateQueries', () => {
    it('should generate geo-first queries (Priority A)', () => {
      const signals = createArticleSignals();
      const result = generateQueries(signals);

      expect(result.queries.length).toBeGreaterThan(0);
      expect(result.queries.length).toBeLessThanOrEqual(12);
      
      // Should include country-level disaster relief
      expect(result.priorityA.some(q => 
        q.includes('United States') && q.includes('disaster relief')
      )).toBe(true);
      
      // Should include admin1-level queries
      expect(result.priorityA.some(q => 
        q.includes('California')
      )).toBe(true);
    });

    it('should generate cause + geo queries (Priority B)', () => {
      const signals = createArticleSignals();
      const result = generateQueries(signals);

      // Should include event type + country
      expect(result.priorityB.some(q => 
        q.includes('wildfire') && q.includes('United States')
      )).toBe(true);
      
      // Should include cause keyword + country
      expect(result.priorityB.some(q => 
        q.includes('disaster-relief') || q.includes('emergency-response')
      )).toBe(true);
    });

    it('should generate fallback queries (Priority C)', () => {
      const signals = createArticleSignals();
      const result = generateQueries(signals);

      // Should include generic relief terms
      expect(result.priorityC.some(q => 
        q.includes('relief') || q.includes('emergency') || q.includes('humanitarian')
      )).toBe(true);
    });

    it('should handle missing admin1', () => {
      const signals = createArticleSignals({
        geo: {
          country: 'Turkey',
        },
      });
      
      const result = generateQueries(signals);
      
      // Should still generate country-level queries
      expect(result.queries.some(q => q.includes('Turkey'))).toBe(true);
      
      // Should not have admin1-specific queries
      expect(result.queries.every(q => !q.includes('undefined'))).toBe(true);
    });

    it('should handle missing event type', () => {
      const signals = createArticleSignals({
        eventType: undefined,
      });
      
      const result = generateQueries(signals);
      
      // Should still generate queries
      expect(result.queries.length).toBeGreaterThan(0);
      
      // Should use cause tags instead
      expect(result.queries.some(q => 
        q.includes('disaster-relief') || q.includes('emergency-response')
      )).toBe(true);
    });

    it('should deduplicate queries', () => {
      const signals = createArticleSignals();
      const result = generateQueries(signals);

      // Check for duplicates
      const uniqueQueries = new Set(result.queries.map(q => q.toLowerCase()));
      expect(uniqueQueries.size).toBe(result.queries.length);
    });

    it('should respect max query limit', () => {
      const signals = createArticleSignals({
        causeTags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      });
      
      const result = generateQueries(signals);
      
      expect(result.queries.length).toBeLessThanOrEqual(12);
    });

    it('should expand event type synonyms', () => {
      const signals = createArticleSignals({
        eventType: 'earthquake',
      });
      
      const result = generateQueries(signals);
      
      // Should include earthquake or its synonyms
      const hasEarthquakeVariant = result.queries.some(q => 
        q.includes('earthquake') || q.includes('seismic') || q.includes('tremor')
      );
      expect(hasEarthquakeVariant).toBe(true);
    });

    it('should handle city-level queries', () => {
      const signals = createArticleSignals({
        geo: {
          country: 'United States',
          admin1: 'California',
          city: 'San Francisco',
        },
      });
      
      const result = generateQueries(signals);
      
      // Should include city in some queries
      expect(result.queries.some(q => q.includes('San Francisco'))).toBe(true);
    });

    it('should normalize country names in queries', () => {
      const signals = createArticleSignals({
        geo: {
          country: 'USA',
        },
      });
      
      const result = generateQueries(signals);
      
      // Should normalize to "United States"
      expect(result.queries.some(q => q.includes('United States'))).toBe(true);
    });

    it('should normalize admin1 codes in queries', () => {
      const signals = createArticleSignals({
        geo: {
          country: 'United States',
          admin1: 'CA',
        },
      });
      
      const result = generateQueries(signals);
      
      // Should expand CA to California
      expect(result.queries.some(q => q.includes('California'))).toBe(true);
    });
  });

  describe('QueryBuilder configuration', () => {
    it('should respect custom max queries', () => {
      const builder = new QueryBuilder({ maxQueries: 6 });
      const signals = createArticleSignals();
      
      const result = builder.generateQueries(signals);
      
      expect(result.queries.length).toBeLessThanOrEqual(6);
    });

    it('should respect synonym configuration', () => {
      const builderWithSynonyms = new QueryBuilder({ useSynonyms: true });
      const builderWithoutSynonyms = new QueryBuilder({ useSynonyms: false });
      
      const signals = createArticleSignals({
        eventType: 'hurricane',
      });
      
      const resultWith = builderWithSynonyms.generateQueries(signals);
      const resultWithout = builderWithoutSynonyms.generateQueries(signals);
      
      // With synonyms should have more variety
      const withVariants = resultWith.queries.filter(q => 
        q.includes('hurricane') || q.includes('cyclone') || q.includes('typhoon')
      );
      
      const withoutVariants = resultWithout.queries.filter(q => 
        q.includes('hurricane')
      );
      
      expect(withVariants.length).toBeGreaterThanOrEqual(withoutVariants.length);
    });

    it('should respect minimum query length', () => {
      const builder = new QueryBuilder({ minQueryLength: 10 });
      const signals = createArticleSignals();
      
      const result = builder.generateQueries(signals);
      
      // All queries should be at least 10 characters
      expect(result.queries.every(q => q.length >= 10)).toBe(true);
    });

    it('should allow configuration updates', () => {
      const builder = new QueryBuilder({ maxQueries: 6 });
      
      builder.updateConfig({ maxQueries: 10 });
      
      const config = builder.getConfig();
      expect(config.maxQueries).toBe(10);
    });
  });

  describe('Query priority structure', () => {
    it('should prioritize geo-first queries', () => {
      const signals = createArticleSignals();
      const result = generateQueries(signals);

      // Priority A should be first in the combined list
      const firstQueries = result.queries.slice(0, result.priorityA.length);
      expect(firstQueries).toEqual(result.priorityA.slice(0, firstQueries.length));
    });

    it('should include all priority levels', () => {
      const signals = createArticleSignals();
      const result = generateQueries(signals);

      expect(result.priorityA.length).toBeGreaterThan(0);
      expect(result.priorityB.length).toBeGreaterThan(0);
      expect(result.priorityC.length).toBeGreaterThan(0);
    });

    it('should distribute queries across priorities', () => {
      const signals = createArticleSignals();
      const result = generateQueries(signals);

      const totalPriority = result.priorityA.length + result.priorityB.length + result.priorityC.length;
      
      // Should have reasonable distribution
      expect(result.priorityA.length).toBeGreaterThan(0);
      expect(result.priorityB.length).toBeGreaterThan(0);
      expect(result.priorityC.length).toBeGreaterThan(0);
      
      // Total should not exceed max queries significantly
      expect(totalPriority).toBeLessThanOrEqual(20);
    });
  });

  describe('Edge cases', () => {
    it('should handle minimal article signals', () => {
      const signals: ArticleSignals = {
        articleId: 'test',
        headline: 'Test',
        geo: {
          country: 'Unknown',
        },
        causeTags: [],
        publishedAt: new Date().toISOString(),
      };
      
      const result = generateQueries(signals);
      
      // Should still generate some queries
      expect(result.queries.length).toBeGreaterThan(0);
    });

    it('should handle empty cause tags', () => {
      const signals = createArticleSignals({
        causeTags: [],
      });
      
      const result = generateQueries(signals);
      
      // Should still generate geo-based queries
      expect(result.queries.length).toBeGreaterThan(0);
      expect(result.queries.some(q => q.includes('United States'))).toBe(true);
    });

    it('should handle special characters in location names', () => {
      const signals = createArticleSignals({
        geo: {
          country: 'Côte d\'Ivoire',
        },
      });
      
      const result = generateQueries(signals);
      
      // Should handle special characters
      expect(result.queries.length).toBeGreaterThan(0);
    });

    it('should filter out very short queries', () => {
      const builder = new QueryBuilder({ minQueryLength: 5 });
      const signals = createArticleSignals();
      
      const result = builder.generateQueries(signals);
      
      // No query should be shorter than min length
      expect(result.queries.every(q => q.length >= 5)).toBe(true);
    });
  });
});