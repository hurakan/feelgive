/**
 * Unit Tests for Geographic Matcher
 * 
 * Tests the 5-level geographic matching system, strictness filtering,
 * and controlled fallback mechanisms.
 */

import { describe, it, expect } from '@jest/globals';
import {
  computeGeoMatch,
  passesGeoFilter,
  applyControlledFallback,
  getGeoLevelDescription,
  getGeoBadge,
} from '../geoMatcher.js';
import { GeoMatchLevel } from '../types.js';
import { normalizeArticleGeo, normalizeOrgLocation } from '../geoNormalizer.js';

describe('geoMatcher', () => {
  describe('computeGeoMatch', () => {
    it('should return EXACT_ADMIN1 for same country and admin1', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
        admin1: 'California',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'United States',
        admin1: 'California',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.EXACT_ADMIN1);
      expect(result.score).toBeGreaterThanOrEqual(1.3);
      expect(result.score).toBeLessThanOrEqual(1.5);
    });

    it('should return EXACT_COUNTRY for same country, different admin1', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
        admin1: 'California',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'United States',
        admin1: 'New York',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.EXACT_COUNTRY);
      expect(result.score).toBeGreaterThanOrEqual(1.2);
      expect(result.score).toBeLessThanOrEqual(1.3);
    });

    it('should return REGIONAL for neighboring countries', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'Canada',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.REGIONAL);
      expect(result.score).toBeGreaterThanOrEqual(0.6);
      expect(result.score).toBeLessThanOrEqual(0.8);
    });

    it('should return REGIONAL for same region', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'Turkey',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'Syria',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.REGIONAL);
    });

    it('should return GLOBAL for unknown org location', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'Unknown',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.GLOBAL);
      expect(result.score).toBeGreaterThanOrEqual(0.3);
      expect(result.score).toBeLessThanOrEqual(0.4);
    });

    it('should return MISMATCH for unrelated countries', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'China',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.MISMATCH);
      expect(result.score).toBe(0.0);
    });

    it('should handle city-level matching', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
        admin1: 'California',
        city: 'San Francisco',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'United States',
        admin1: 'California',
        city: 'San Francisco',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.EXACT_ADMIN1);
      expect(result.score).toBe(1.5); // Maximum score for city match
    });
  });

  describe('passesGeoFilter', () => {
    it('should pass EXACT_ADMIN1 in strict mode', () => {
      const match = {
        level: GeoMatchLevel.EXACT_ADMIN1,
        score: 1.5,
        reason: 'Same admin1',
      };

      expect(passesGeoFilter(match, 'strict', true)).toBe(true);
    });

    it('should pass EXACT_COUNTRY in strict mode', () => {
      const match = {
        level: GeoMatchLevel.EXACT_COUNTRY,
        score: 1.2,
        reason: 'Same country',
      };

      expect(passesGeoFilter(match, 'strict', true)).toBe(true);
    });

    it('should reject REGIONAL in strict mode with admin1', () => {
      const match = {
        level: GeoMatchLevel.REGIONAL,
        score: 0.7,
        reason: 'Regional',
      };

      expect(passesGeoFilter(match, 'strict', true)).toBe(false);
    });

    it('should pass REGIONAL in strict mode without admin1', () => {
      const match = {
        level: GeoMatchLevel.REGIONAL,
        score: 0.7,
        reason: 'Regional',
      };

      expect(passesGeoFilter(match, 'strict', false)).toBe(true);
    });

    it('should pass REGIONAL in balanced mode', () => {
      const match = {
        level: GeoMatchLevel.REGIONAL,
        score: 0.7,
        reason: 'Regional',
      };

      expect(passesGeoFilter(match, 'balanced', true)).toBe(true);
    });

    it('should pass GLOBAL in balanced mode', () => {
      const match = {
        level: GeoMatchLevel.GLOBAL,
        score: 0.4,
        reason: 'Global',
      };

      expect(passesGeoFilter(match, 'balanced', true)).toBe(true);
    });

    it('should reject MISMATCH in all modes', () => {
      const match = {
        level: GeoMatchLevel.MISMATCH,
        score: 0.0,
        reason: 'Mismatch',
      };

      expect(passesGeoFilter(match, 'strict', true)).toBe(false);
      expect(passesGeoFilter(match, 'balanced', true)).toBe(false);
    });
  });

  describe('applyControlledFallback', () => {
    const createMockOrg = (level: GeoMatchLevel, id: string) => ({
      id,
      name: `Org ${id}`,
      geoMatch: {
        level,
        score: level === GeoMatchLevel.EXACT_ADMIN1 ? 1.5 :
               level === GeoMatchLevel.EXACT_COUNTRY ? 1.2 :
               level === GeoMatchLevel.REGIONAL ? 0.7 :
               level === GeoMatchLevel.GLOBAL ? 0.4 : 0.0,
        reason: `Test ${level}`,
      },
    });

    it('should not apply fallback when enough results exist', () => {
      const orgs = [
        createMockOrg(GeoMatchLevel.EXACT_ADMIN1, '1'),
        createMockOrg(GeoMatchLevel.EXACT_ADMIN1, '2'),
        createMockOrg(GeoMatchLevel.EXACT_COUNTRY, '3'),
        createMockOrg(GeoMatchLevel.EXACT_COUNTRY, '4'),
        createMockOrg(GeoMatchLevel.EXACT_COUNTRY, '5'),
      ];

      const result = applyControlledFallback(orgs, 5, 2);
      expect(result.filtered).toHaveLength(5);
      expect(result.fallbackLevel).toBe('country');
      expect(result.message).toContain('country');
    });

    it('should widen to REGIONAL when not enough EXACT matches', () => {
      const orgs = [
        createMockOrg(GeoMatchLevel.EXACT_ADMIN1, '1'),
        createMockOrg(GeoMatchLevel.EXACT_COUNTRY, '2'),
        createMockOrg(GeoMatchLevel.REGIONAL, '3'),
        createMockOrg(GeoMatchLevel.REGIONAL, '4'),
      ];

      const result = applyControlledFallback(orgs, 5, 2);
      expect(result.filtered.length).toBeGreaterThanOrEqual(4);
      expect(result.fallbackLevel).toBe('regional');
      expect(result.message).toContain('regional');
    });

    it('should limit global responders', () => {
      const orgs = [
        createMockOrg(GeoMatchLevel.EXACT_COUNTRY, '1'),
        createMockOrg(GeoMatchLevel.GLOBAL, '2'),
        createMockOrg(GeoMatchLevel.GLOBAL, '3'),
        createMockOrg(GeoMatchLevel.GLOBAL, '4'),
        createMockOrg(GeoMatchLevel.GLOBAL, '5'),
      ];

      const result = applyControlledFallback(orgs, 5, 2);
      const globalCount = result.filtered.filter(
        o => o.geoMatch.level === GeoMatchLevel.GLOBAL
      ).length;
      expect(globalCount).toBeLessThanOrEqual(2);
    });

    it('should provide fallback message when widening', () => {
      const orgs = [
        createMockOrg(GeoMatchLevel.EXACT_ADMIN1, '1'),
        createMockOrg(GeoMatchLevel.REGIONAL, '2'),
        createMockOrg(GeoMatchLevel.REGIONAL, '3'),
      ];

      const result = applyControlledFallback(orgs, 5, 2);
      expect(result.fallbackLevel).toBe('regional');
      expect(result.message).toBeDefined();
      expect(result.message).toContain('regional');
    });
  });

  describe('getGeoLevelDescription', () => {
    it('should return correct descriptions for each level', () => {
      expect(getGeoLevelDescription(GeoMatchLevel.EXACT_ADMIN1)).toContain('state');
      expect(getGeoLevelDescription(GeoMatchLevel.EXACT_COUNTRY)).toContain('country');
      expect(getGeoLevelDescription(GeoMatchLevel.REGIONAL)).toContain('region');
      expect(getGeoLevelDescription(GeoMatchLevel.GLOBAL)).toContain('global');
      expect(getGeoLevelDescription(GeoMatchLevel.MISMATCH)).toContain('match');
    });
  });

  describe('getGeoBadge', () => {
    it('should return correct badges for each level', () => {
      expect(getGeoBadge(GeoMatchLevel.EXACT_ADMIN1)).toBe('Local');
      expect(getGeoBadge(GeoMatchLevel.EXACT_COUNTRY)).toBe('National');
      expect(getGeoBadge(GeoMatchLevel.REGIONAL)).toBe('Regional');
      expect(getGeoBadge(GeoMatchLevel.GLOBAL)).toBe('Global Responder');
      expect(getGeoBadge(GeoMatchLevel.MISMATCH)).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing admin1 in article geo', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'United States',
        admin1: 'California',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.EXACT_COUNTRY);
    });

    it('should handle missing admin1 in org location', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
        admin1: 'California',
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'United States',
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.EXACT_COUNTRY);
    });

    it('should handle coordinates-based matching', () => {
      const articleGeo = normalizeArticleGeo({
        country: 'United States',
        admin1: 'California',
        lat: 37.7749,
        lon: -122.4194,
      });
      
      const orgLocation = normalizeOrgLocation({
        country: 'United States',
        admin1: 'California',
        lat: 37.7750,
        lon: -122.4195,
      });

      const result = computeGeoMatch(articleGeo, orgLocation);
      expect(result.level).toBe(GeoMatchLevel.EXACT_ADMIN1);
      expect(result.score).toBe(1.5); // Close proximity bonus
    });
  });
});