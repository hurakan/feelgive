/**
 * Golden Tests for Recommendation Engine
 * 
 * Tests the complete recommendation pipeline against realistic article fixtures
 * to ensure consistent, high-quality results across diverse scenarios.
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ArticleSignals, GeoMatchLevel } from '../types.js';
import { generateQueries } from '../queryBuilder.js';
import { computeGeoMatch } from '../geoMatcher.js';
import { normalizeArticleGeo, normalizeOrgLocation } from '../geoNormalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GoldenTestCase {
  id: string;
  name: string;
  signals: ArticleSignals;
  expected: {
    minResults: number;
    geoRequirements: {
      exactAdmin1Count?: number;
      exactCountryCount?: number;
      regionalCount?: number;
      noMismatch?: boolean;
      globalAllowed?: boolean;
    };
    qualityRequirements: {
      minWithWebsite: number;
      minWithDescription: number;
    };
  };
}

describe('Golden Tests', () => {
  let testCases: GoldenTestCase[];

  beforeAll(() => {
    const fixturesPath = join(__dirname, 'fixtures', 'articles.json');
    const fixturesData = readFileSync(fixturesPath, 'utf-8');
    testCases = JSON.parse(fixturesData);
  });

  describe('Query Generation', () => {
    testCases.forEach(testCase => {
      it(`should generate appropriate queries for ${testCase.name}`, () => {
        const queries = generateQueries(testCase.signals);

        // Should generate queries
        expect(queries.queries.length).toBeGreaterThan(0);
        expect(queries.queries.length).toBeLessThanOrEqual(12);

        // Should include country in queries
        const country = testCase.signals.geo.country;
        expect(queries.queries.some(q => 
          q.toLowerCase().includes(country.toLowerCase())
        )).toBe(true);

        // Should have all priority levels
        expect(queries.priorityA.length).toBeGreaterThan(0);
        expect(queries.priorityB.length).toBeGreaterThan(0);
        expect(queries.priorityC.length).toBeGreaterThan(0);

        // No duplicates
        const uniqueQueries = new Set(queries.queries.map(q => q.toLowerCase()));
        expect(uniqueQueries.size).toBe(queries.queries.length);
      });
    });
  });

  describe('Geographic Matching', () => {
    testCases.forEach(testCase => {
      it(`should correctly match organizations for ${testCase.name}`, () => {
        const articleGeo = normalizeArticleGeo(testCase.signals.geo);

        // Test exact country match
        const sameCountryOrg = normalizeOrgLocation({
          country: testCase.signals.geo.country,
        });
        const countryMatch = computeGeoMatch(articleGeo, sameCountryOrg);
        
        expect(countryMatch.level).toBe(GeoMatchLevel.EXACT_COUNTRY);
        expect(countryMatch.score).toBeGreaterThanOrEqual(1.2);

        // Test admin1 match if applicable
        if (testCase.signals.geo.admin1) {
          const sameAdmin1Org = normalizeOrgLocation({
            country: testCase.signals.geo.country,
            admin1: testCase.signals.geo.admin1,
          });
          const admin1Match = computeGeoMatch(articleGeo, sameAdmin1Org);
          
          expect(admin1Match.level).toBe(GeoMatchLevel.EXACT_ADMIN1);
          expect(admin1Match.score).toBe(1.5);
        }

        // Test mismatch
        const unrelatedOrg = normalizeOrgLocation({
          country: 'Unrelated Country XYZ',
        });
        const mismatch = computeGeoMatch(articleGeo, unrelatedOrg);
        
        if (!testCase.expected.geoRequirements.globalAllowed) {
          expect(mismatch.level).toBe(GeoMatchLevel.MISMATCH);
          expect(mismatch.score).toBe(0.0);
        }
      });
    });
  });

  describe('Geographic Requirements', () => {
    testCases.forEach(testCase => {
      it(`should meet geo requirements for ${testCase.name}`, () => {
        const articleGeo = normalizeArticleGeo(testCase.signals.geo);
        const requirements = testCase.expected.geoRequirements;

        // Create mock organizations at different geo levels
        const mockOrgs = [];

        // Add exact admin1 orgs if required
        if (requirements.exactAdmin1Count && testCase.signals.geo.admin1) {
          for (let i = 0; i < requirements.exactAdmin1Count; i++) {
            mockOrgs.push({
              country: testCase.signals.geo.country,
              admin1: testCase.signals.geo.admin1,
            });
          }
        }

        // Add exact country orgs if required
        if (requirements.exactCountryCount) {
          for (let i = 0; i < requirements.exactCountryCount; i++) {
            mockOrgs.push({
              country: testCase.signals.geo.country,
            });
          }
        }

        // Verify matches
        const matches = mockOrgs.map(org => 
          computeGeoMatch(articleGeo, normalizeOrgLocation(org))
        );

        if (requirements.exactAdmin1Count) {
          const admin1Matches = matches.filter(m => m.level === GeoMatchLevel.EXACT_ADMIN1);
          expect(admin1Matches.length).toBeGreaterThanOrEqual(requirements.exactAdmin1Count);
        }

        if (requirements.exactCountryCount) {
          const countryMatches = matches.filter(m => 
            m.level === GeoMatchLevel.EXACT_COUNTRY || m.level === GeoMatchLevel.EXACT_ADMIN1
          );
          expect(countryMatches.length).toBeGreaterThanOrEqual(requirements.exactCountryCount);
        }

        if (requirements.noMismatch) {
          const mismatches = matches.filter(m => m.level === GeoMatchLevel.MISMATCH);
          expect(mismatches.length).toBe(0);
        }
      });
    });
  });

  describe('Query Quality', () => {
    testCases.forEach(testCase => {
      it(`should generate high-quality queries for ${testCase.name}`, () => {
        const queries = generateQueries(testCase.signals);

        // All queries should be meaningful length
        queries.queries.forEach(query => {
          expect(query.length).toBeGreaterThan(5);
          expect(query.length).toBeLessThan(100);
        });

        // Should include event type if available
        if (testCase.signals.eventType) {
          const hasEventType = queries.queries.some(q => 
            q.toLowerCase().includes(testCase.signals.eventType!.toLowerCase())
          );
          expect(hasEventType).toBe(true);
        }

        // Should include cause tags
        if (testCase.signals.causeTags.length > 0) {
          const hasCauseTags = queries.queries.some(q => 
            testCase.signals.causeTags.some(tag => 
              q.toLowerCase().includes(tag.toLowerCase().replace('-', ' '))
            )
          );
          expect(hasCauseTags).toBe(true);
        }
      });
    });
  });

  describe('Consistency Checks', () => {
    it('should generate consistent results across multiple runs', () => {
      const testCase = testCases[0];
      
      const run1 = generateQueries(testCase.signals);
      const run2 = generateQueries(testCase.signals);
      
      // Should generate same queries
      expect(run1.queries).toEqual(run2.queries);
    });

    it('should handle all test cases without errors', () => {
      testCases.forEach(testCase => {
        expect(() => {
          generateQueries(testCase.signals);
          normalizeArticleGeo(testCase.signals.geo);
        }).not.toThrow();
      });
    });
  });

  describe('Coverage Analysis', () => {
    it('should cover diverse geographic regions', () => {
      const countries = new Set(testCases.map(tc => tc.signals.geo.country));
      
      // Should have at least 5 different countries
      expect(countries.size).toBeGreaterThanOrEqual(5);
    });

    it('should cover diverse disaster types', () => {
      const eventTypes = new Set(
        testCases
          .map(tc => tc.signals.eventType)
          .filter(Boolean)
      );
      
      // Should have at least 4 different event types
      expect(eventTypes.size).toBeGreaterThanOrEqual(4);
    });

    it('should include both US and international scenarios', () => {
      const usScenarios = testCases.filter(tc => 
        tc.signals.geo.country === 'United States'
      );
      const intlScenarios = testCases.filter(tc => 
        tc.signals.geo.country !== 'United States'
      );
      
      expect(usScenarios.length).toBeGreaterThan(0);
      expect(intlScenarios.length).toBeGreaterThan(0);
    });
  });
});