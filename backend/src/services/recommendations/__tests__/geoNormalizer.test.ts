/**
 * Unit Tests for Geographic Normalizer
 * 
 * Tests normalization of country names, US states, regional groupings,
 * and neighbor detection.
 */

import { describe, it, expect } from '@jest/globals';
import {
  normalizeCountryName,
  normalizeAdmin1,
  getStateCode,
  areDirectNeighbors,
  areInSameRegion,
  parseLocationString,
  normalizeArticleGeo,
  normalizeOrgLocation,
} from '../geoNormalizer.js';

describe('geoNormalizer', () => {
  describe('normalizeCountryName', () => {
    it('should normalize common country variations', () => {
      expect(normalizeCountryName('USA')).toBe('United States');
      expect(normalizeCountryName('us')).toBe('United States');
      expect(normalizeCountryName('united states of america')).toBe('United States');
      expect(normalizeCountryName('UK')).toBe('United Kingdom');
      expect(normalizeCountryName('great britain')).toBe('United Kingdom');
    });

    it('should handle title case for unknown countries', () => {
      expect(normalizeCountryName('new zealand')).toBe('New Zealand');
      expect(normalizeCountryName('SOUTH AFRICA')).toBe('South Africa');
    });

    it('should handle special characters', () => {
      expect(normalizeCountryName('türkiye')).toBe('Turkey');
      expect(normalizeCountryName('turkiye')).toBe('Turkey');
    });
  });

  describe('normalizeAdmin1', () => {
    it('should expand US state codes to full names', () => {
      expect(normalizeAdmin1('CA', 'United States')).toBe('California');
      expect(normalizeAdmin1('NY', 'United States')).toBe('New York');
      expect(normalizeAdmin1('TX', 'United States')).toBe('Texas');
    });

    it('should normalize US state full names', () => {
      expect(normalizeAdmin1('california', 'United States')).toBe('California');
      expect(normalizeAdmin1('CALIFORNIA', 'United States')).toBe('California');
      expect(normalizeAdmin1('new york', 'United States')).toBe('New York');
    });

    it('should handle non-US admin1 names', () => {
      expect(normalizeAdmin1('ontario', 'Canada')).toBe('Ontario');
      expect(normalizeAdmin1('BAVARIA', 'Germany')).toBe('Bavaria');
    });

    it('should preserve case for unknown states', () => {
      expect(normalizeAdmin1('Unknown State', 'United States')).toBe('Unknown State');
    });
  });

  describe('getStateCode', () => {
    it('should return state code from full name', () => {
      expect(getStateCode('California')).toBe('CA');
      expect(getStateCode('New York')).toBe('NY');
      expect(getStateCode('Texas')).toBe('TX');
    });

    it('should handle case-insensitive input', () => {
      expect(getStateCode('california')).toBe('CA');
      expect(getStateCode('CALIFORNIA')).toBe('CA');
    });

    it('should return undefined for unknown states', () => {
      expect(getStateCode('Unknown State')).toBeUndefined();
    });
  });

  describe('areDirectNeighbors', () => {
    it('should identify direct neighbors', () => {
      expect(areDirectNeighbors('United States', 'Canada')).toBe(true);
      expect(areDirectNeighbors('United States', 'Mexico')).toBe(true);
      expect(areDirectNeighbors('Turkey', 'Syria')).toBe(true);
      expect(areDirectNeighbors('India', 'Pakistan')).toBe(true);
    });

    it('should return false for non-neighbors', () => {
      expect(areDirectNeighbors('United States', 'China')).toBe(false);
      expect(areDirectNeighbors('United Kingdom', 'Australia')).toBe(false);
    });

    it('should handle country name variations', () => {
      expect(areDirectNeighbors('USA', 'Canada')).toBe(true);
      expect(areDirectNeighbors('us', 'mexico')).toBe(true);
    });
  });

  describe('areInSameRegion', () => {
    it('should identify countries in same region', () => {
      // North America
      expect(areInSameRegion('United States', 'Canada')).toBe(true);
      expect(areInSameRegion('United States', 'Mexico')).toBe(true);
      
      // Middle East
      expect(areInSameRegion('Turkey', 'Syria')).toBe(true);
      expect(areInSameRegion('Iraq', 'Iran')).toBe(true);
      
      // South Asia
      expect(areInSameRegion('India', 'Pakistan')).toBe(true);
      expect(areInSameRegion('India', 'Bangladesh')).toBe(true);
    });

    it('should return false for countries in different regions', () => {
      expect(areInSameRegion('United States', 'China')).toBe(false);
      expect(areInSameRegion('United Kingdom', 'Japan')).toBe(false);
      expect(areInSameRegion('Brazil', 'Nigeria')).toBe(false);
    });

    it('should return true for same country', () => {
      expect(areInSameRegion('United States', 'United States')).toBe(true);
      expect(areInSameRegion('China', 'China')).toBe(true);
    });
  });

  describe('parseLocationString', () => {
    it('should parse full location strings', () => {
      const result = parseLocationString('San Francisco, CA, United States');
      expect(result.city).toBe('San Francisco');
      expect(result.admin1).toBe('California');
      expect(result.country).toBe('United States');
    });

    it('should parse location with country only', () => {
      const result = parseLocationString('United States');
      expect(result.country).toBe('United States');
      expect(result.admin1).toBeUndefined();
      expect(result.city).toBeUndefined();
    });

    it('should parse location with city and country', () => {
      const result = parseLocationString('London, United Kingdom');
      expect(result.admin1).toBe('United Kingdom');
      expect(result.country).toBeUndefined();
      expect(result.city).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const result = parseLocationString('');
      expect(result).toEqual({});
    });

    it('should normalize country names in parsed results', () => {
      const result = parseLocationString('New York, NY, USA');
      expect(result.country).toBe('United States');
      expect(result.admin1).toBe('New York');
    });
  });

  describe('normalizeArticleGeo', () => {
    it('should normalize complete article geo data', () => {
      const result = normalizeArticleGeo({
        country: 'USA',
        admin1: 'CA',
        city: 'Los Angeles',
        lat: 34.05,
        lon: -118.24,
      });

      expect(result.country).toBe('United States');
      expect(result.admin1).toBe('California');
      expect(result.admin1Code).toBe('CA');
      expect(result.city).toBe('Los Angeles');
      expect(result.lat).toBe(34.05);
      expect(result.lon).toBe(-118.24);
      expect(result.regionCode).toBe('north-america');
    });

    it('should handle minimal geo data', () => {
      const result = normalizeArticleGeo({
        country: 'Turkey',
      });

      expect(result.country).toBe('Turkey');
      expect(result.admin1).toBeUndefined();
      expect(result.regionCode).toBe('middle-east');
    });

    it('should infer region code from country', () => {
      expect(normalizeArticleGeo({ country: 'France' }).regionCode).toBe('western-europe');
      expect(normalizeArticleGeo({ country: 'Brazil' }).regionCode).toBe('south-america');
      expect(normalizeArticleGeo({ country: 'Japan' }).regionCode).toBe('east-asia');
    });
  });

  describe('normalizeOrgLocation', () => {
    it('should normalize organization location', () => {
      const result = normalizeOrgLocation({
        country: 'UK',
        admin1: 'England',
        city: 'London',
      });

      expect(result.country).toBe('United Kingdom');
      expect(result.admin1).toBe('England');
      expect(result.city).toBe('London');
      expect(result.regionCode).toBe('western-europe');
    });

    it('should handle missing country', () => {
      const result = normalizeOrgLocation({
        city: 'Unknown City',
      });

      expect(result.country).toBe('Unknown');
      expect(result.city).toBe('Unknown City');
    });

    it('should normalize US state codes', () => {
      const result = normalizeOrgLocation({
        country: 'United States',
        admin1: 'TX',
        city: 'Austin',
      });

      expect(result.admin1).toBe('Texas');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(normalizeCountryName('')).toBe('');
      expect(parseLocationString('')).toEqual({});
    });

    it('should handle whitespace in inputs', () => {
      expect(normalizeCountryName('  United States  ')).toBe('United States');
      expect(normalizeAdmin1('  CA  ', 'United States')).toBe('California');
    });

    it('should handle mixed case inputs', () => {
      expect(normalizeCountryName('uNiTeD sTaTeS')).toBe('United States');
      expect(normalizeAdmin1('cAlIfOrNiA', 'United States')).toBe('California');
    });
  });
});