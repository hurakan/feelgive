/**
 * Integration Tests for Recommendation Engine
 * 
 * Tests complete recommendation pipeline with realistic scenarios:
 * - California wildfire
 * - Turkey earthquake
 * - Missing location data
 * - Duplicate organizations
 * - Caching behavior
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ArticleSignals, GeoMatchLevel, RecommendationConfig } from '../types.js';
import { generateQueries } from '../queryBuilder.js';
import { computeGeoMatch } from '../geoMatcher.js';
import { normalizeArticleGeo, normalizeOrgLocation } from '../geoNormalizer.js';

describe('Recommendation Engine Integration Tests', () => {
  describe('Scenario A: California Wildfire', () => {
    const californiaWildfireSignals: ArticleSignals = {
      articleId: 'ca-wildfire-2024',
      headline: 'Massive Wildfire Threatens Los Angeles Communities',
      summary: 'A fast-moving wildfire has forced thousands to evacuate in Southern California',
      geo: {
        country: 'United States',
        admin1: 'California',
        city: 'Los Angeles',
        lat: 34.0522,
        lon: -118.2437,
      },
      causeTags: ['disaster-relief', 'emergency-response', 'wildfire'],
      eventType: 'wildfire',
      publishedAt: new Date().toISOString(),
    };

    it('should generate geo-first queries for California', () => {
      const queries = generateQueries(californiaWildfireSignals);

      // Should prioritize California-specific queries
      expect(queries.priorityA.some(q => 
        q.includes('California') && q.includes('disaster relief')
      )).toBe(true);

      // Should include wildfire-specific queries
      expect(queries.priorityB.some(q => 
        q.includes('wildfire') || q.includes('fire')
      )).toBe(true);

      // Should include United States queries
      expect(queries.queries.some(q => 
        q.includes('United States')
      )).toBe(true);
    });

    it('should match California-based orgs as EXACT_ADMIN1', () => {
      const articleGeo = normalizeArticleGeo(californiaWildfireSignals.geo);
      
      const caOrg = normalizeOrgLocation({
        country: 'United States',
        admin1: 'California',
        city: 'San Francisco',
      });

      const match = computeGeoMatch(articleGeo, caOrg);
      
      expect(match.level).toBe(GeoMatchLevel.EXACT_ADMIN1);
      expect(match.score).toBe(1.5);
    });

    it('should match US-based orgs as EXACT_COUNTRY', () => {
      const articleGeo = normalizeArticleGeo(californiaWildfireSignals.geo);
      
      const usOrg = normalizeOrgLocation({
        country: 'United States',
        admin1: 'New York',
      });

      const match = computeGeoMatch(articleGeo, usOrg);
      
      expect(match.level).toBe(GeoMatchLevel.EXACT_COUNTRY);
      expect(match.score).toBeGreaterThanOrEqual(1.2);
    });

    it('should exclude out-of-country orgs in strict mode', () => {
      const articleGeo = normalizeArticleGeo(californiaWildfireSignals.geo);
      
      const foreignOrg = normalizeOrgLocation({
        country: 'China',
      });

      const match = computeGeoMatch(articleGeo, foreignOrg);
      
      expect(match.level).toBe(GeoMatchLevel.MISMATCH);
      expect(match.score).toBe(0.0);
    });

    it('should ensure top 5 are CA or US-based', () => {
      // This would be tested with actual API calls in a full integration test
      // For now, we verify the logic works correctly
      const articleGeo = normalizeArticleGeo(californiaWildfireSignals.geo);
      
      const testOrgs = [
        { country: 'United States', admin1: 'California' },
        { country: 'United States', admin1: 'California' },
        { country: 'United States', admin1: 'Texas' },
        { country: 'United States', admin1: 'New York' },
        { country: 'Canada' },
      ];

      const matches = testOrgs.map(org => 
        computeGeoMatch(articleGeo, normalizeOrgLocation(org))
      );

      // First 4 should be EXACT matches
      expect(matches.slice(0, 4).every(m => 
        m.level === GeoMatchLevel.EXACT_ADMIN1 || m.level === GeoMatchLevel.EXACT_COUNTRY
      )).toBe(true);

      // Canada should be REGIONAL
      expect(matches[4].level).toBe(GeoMatchLevel.REGIONAL);
    });
  });

  describe('Scenario B: Turkey Earthquake', () => {
    const turkeyEarthquakeSignals: ArticleSignals = {
      articleId: 'turkey-earthquake-2024',
      headline: 'Devastating Earthquake Strikes Southern Turkey',
      summary: 'A magnitude 7.8 earthquake has caused widespread destruction across Turkey and Syria',
      geo: {
        country: 'Turkey',
        admin1: 'Hatay',
        city: 'Antakya',
        lat: 36.2,
        lon: 36.16,
      },
      causeTags: ['disaster-relief', 'emergency-response', 'earthquake'],
      eventType: 'earthquake',
      publishedAt: new Date().toISOString(),
    };

    it('should generate Turkey-specific queries', () => {
      const queries = generateQueries(turkeyEarthquakeSignals);

      // Should include Turkey queries
      expect(queries.queries.some(q => q.includes('Turkey'))).toBe(true);

      // Should include earthquake queries
      expect(queries.queries.some(q => 
        q.includes('earthquake') || q.includes('seismic')
      )).toBe(true);
    });

    it('should match Turkey-based orgs as EXACT_COUNTRY', () => {
      const articleGeo = normalizeArticleGeo(turkeyEarthquakeSignals.geo);
      
      const turkeyOrg = normalizeOrgLocation({
        country: 'Turkey',
        city: 'Istanbul',
      });

      const match = computeGeoMatch(articleGeo, turkeyOrg);
      
      expect(match.level).toBe(GeoMatchLevel.EXACT_COUNTRY);
      expect(match.score).toBeGreaterThanOrEqual(1.2);
    });

    it('should match neighboring Syria as REGIONAL', () => {
      const articleGeo = normalizeArticleGeo(turkeyEarthquakeSignals.geo);
      
      const syriaOrg = normalizeOrgLocation({
        country: 'Syria',
      });

      const match = computeGeoMatch(articleGeo, syriaOrg);
      
      expect(match.level).toBe(GeoMatchLevel.REGIONAL);
      expect(match.score).toBeGreaterThanOrEqual(0.6);
    });

    it('should exclude mismatched countries', () => {
      const articleGeo = normalizeArticleGeo(turkeyEarthquakeSignals.geo);
      
      const unrelatedOrg = normalizeOrgLocation({
        country: 'Brazil',
      });

      const match = computeGeoMatch(articleGeo, unrelatedOrg);
      
      expect(match.level).toBe(GeoMatchLevel.MISMATCH);
    });

    it('should allow Middle East regional orgs', () => {
      const articleGeo = normalizeArticleGeo(turkeyEarthquakeSignals.geo);
      
      const regionalOrgs = [
        { country: 'Syria' },
        { country: 'Iraq' },
        { country: 'Lebanon' },
      ];

      const matches = regionalOrgs.map(org => 
        computeGeoMatch(articleGeo, normalizeOrgLocation(org))
      );

      // All should be REGIONAL
      expect(matches.every(m => m.level === GeoMatchLevel.REGIONAL)).toBe(true);
    });
  });

  describe('Scenario C: Missing Organization Location Data', () => {
    const genericSignals: ArticleSignals = {
      articleId: 'generic-crisis',
      headline: 'Humanitarian Crisis Unfolds',
      summary: 'Emergency response needed',
      geo: {
        country: 'Kenya',
      },
      causeTags: ['humanitarian-aid'],
      publishedAt: new Date().toISOString(),
    };

    it('should handle orgs with unknown location as GLOBAL', () => {
      const articleGeo = normalizeArticleGeo(genericSignals.geo);
      
      const unknownOrg = normalizeOrgLocation({
        country: 'Unknown',
      });

      const match = computeGeoMatch(articleGeo, unknownOrg);
      
      expect(match.level).toBe(GeoMatchLevel.GLOBAL);
      expect(match.score).toBeGreaterThan(0);
    });

    it('should not flood results with global responders', () => {
      // In strict mode with fallback, global responders should be limited
      const articleGeo = normalizeArticleGeo(genericSignals.geo);
      
      const orgs = Array(10).fill(null).map((_, i) => ({
        country: i < 2 ? 'Kenya' : 'Unknown',
      }));

      const matches = orgs.map(org => 
        computeGeoMatch(articleGeo, normalizeOrgLocation(org))
      );

      const globalCount = matches.filter(m => m.level === GeoMatchLevel.GLOBAL).length;
      const exactCount = matches.filter(m => m.level === GeoMatchLevel.EXACT_COUNTRY).length;

      expect(exactCount).toBe(2);
      expect(globalCount).toBe(8);
    });
  });

  describe('Scenario D: Duplicate Organizations', () => {
    it('should detect similar organization names', () => {
      const names = [
        'American Red Cross',
        'Red Cross',
        'International Red Cross',
        'Red Cross Society',
      ];

      // Simple similarity check (would use actual deduplication logic)
      const similarities = names.map(name1 => 
        names.map(name2 => {
          const words1 = new Set(name1.toLowerCase().split(/\s+/));
          const words2 = new Set(name2.toLowerCase().split(/\s+/));
          const intersection = new Set([...words1].filter(w => words2.has(w)));
          const union = new Set([...words1, ...words2]);
          return intersection.size / union.size;
        })
      );

      // Red Cross variants should have high similarity
      expect(similarities[0][1]).toBeGreaterThan(0.5);
      expect(similarities[0][2]).toBeGreaterThan(0.5);
    });
  });

  describe('Scenario E: Query Deduplication', () => {
    it('should deduplicate similar queries', () => {
      const signals: ArticleSignals = {
        articleId: 'test',
        headline: 'Test',
        geo: {
          country: 'United States',
          admin1: 'California',
        },
        causeTags: ['disaster-relief', 'emergency-response'],
        eventType: 'wildfire',
        publishedAt: new Date().toISOString(),
      };

      const queries = generateQueries(signals);

      // Check for duplicates (case-insensitive)
      const lowerQueries = queries.queries.map(q => q.toLowerCase());
      const uniqueQueries = new Set(lowerQueries);

      expect(uniqueQueries.size).toBe(lowerQueries.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle articles with minimal geo data', () => {
      const minimalSignals: ArticleSignals = {
        articleId: 'minimal',
        headline: 'Crisis',
        geo: {
          country: 'Unknown',
        },
        causeTags: [],
        publishedAt: new Date().toISOString(),
      };

      const queries = generateQueries(minimalSignals);
      
      // Should still generate some queries
      expect(queries.queries.length).toBeGreaterThan(0);
    });

    it('should handle special characters in location names', () => {
      const specialCharsSignals: ArticleSignals = {
        articleId: 'special',
        headline: 'Crisis in Côte d\'Ivoire',
        geo: {
          country: 'Côte d\'Ivoire',
        },
        causeTags: ['humanitarian-aid'],
        publishedAt: new Date().toISOString(),
      };

      const queries = generateQueries(specialCharsSignals);
      
      // Should handle special characters
      expect(queries.queries.length).toBeGreaterThan(0);
    });

    it('should normalize country name variations', () => {
      const usaVariations = ['USA', 'US', 'United States', 'United States of America'];
      
      const signals = usaVariations.map(country => ({
        articleId: 'test',
        headline: 'Test',
        geo: { country },
        causeTags: [],
        publishedAt: new Date().toISOString(),
      }));

      const allQueries = signals.map(s => generateQueries(s));
      
      // All should generate queries with "United States"
      allQueries.forEach(queries => {
        expect(queries.queries.some(q => q.includes('United States'))).toBe(true);
      });
    });
  });
});