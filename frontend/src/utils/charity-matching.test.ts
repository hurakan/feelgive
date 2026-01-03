
import { describe, it, expect } from 'vitest';
import { matchCharities } from './charity-matching';
import type { Charity, Classification, RankedCharity } from '@/types';

/**
 * Comprehensive unit tests for the organization ranking algorithm
 * Tests all scenarios from ORGANIZATION_RANKING_DESIGN.md requirements
 */

describe('Organization Ranking Algorithm', () => {
  
  // ============================================================================
  // TEST SCENARIO 1: Crisis in a country where local orgs exist
  // Local orgs must rank above global orgs
  // ============================================================================
  
  describe('Scenario 1: Local orgs rank above global orgs', () => {
    it('should rank Sudan-based org (Tier 1) above global org (Tier 3/4)', () => {
      // Mock charities
      const charities: Charity[] = [
        {
          id: 'global-org-1',
          name: 'Global Relief International',
          slug: 'global-relief-intl',
          description: 'Global humanitarian organization',
          logo: '/logos/global.png',
          causes: ['humanitarian_crisis'],
          countries: ['GLOBAL'],
          trustScore: 95,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 8,
          addressedNeeds: ['food', 'shelter', 'medical'],
        },
        {
          id: 'sudan-org-1',
          name: 'Sudan Relief Network',
          slug: 'sudan-relief',
          description: 'Local Sudan-based relief organization',
          logo: '/logos/sudan.png',
          causes: ['humanitarian_crisis'],
          countries: ['SD'],
          trustScore: 85,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['food', 'shelter'],
        },
      ];

      // Mock classification for Sudan crisis
      const classification: Classification = {
        cause: 'humanitarian_crisis',
        tier1_crisis_type: 'conflict_displacement',
        tier2_root_cause: 'conflict_driven',
        identified_needs: ['food', 'shelter'],
        geo: 'SD',
        geoName: 'Sudan',
        affectedGroups: ['civilians', 'refugees'],
        confidence: 0.95,
        matchedKeywords: ['conflict', 'displacement'],
        relevantExcerpts: ['Crisis in Sudan'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'extreme',
          systemStatus: 'collapsed',
          imminentRisk: true,
          reasoning: 'Ongoing conflict',
        },
      };

      const results = matchCharities(classification, charities);

      // Assertions
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Sudan Relief Network');
      expect(results[0].geographic_tier).toBe(1); // Local
      expect(results[1].name).toBe('Global Relief International');
      expect(results[1].geographic_tier).toBe(3); // Global high flexibility
      
      // Verify explainability
      expect(results[0].proximity_reason).toContain('Sudan');
      expect(results[0].cause_match_reason).toBeTruthy();
    });
  });

  // ============================================================================
  // TEST SCENARIO 2: Crisis with unclear location
  // Fallback to cause + trust when no geographic data
  // ============================================================================
  
  describe('Scenario 2: Crisis with unclear location - fallback to cause + trust', () => {
    it('should rank by cause match and trust score when location is unclear', () => {
      const charities: Charity[] = [
        {
          id: 'org-1',
          name: 'Health Crisis Responders',
          slug: 'health-responders',
          description: 'Health emergency specialists',
          logo: '/logos/health.png',
          causes: ['health_crisis'],
          countries: ['GLOBAL'],
          trustScore: 90,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 7,
          addressedNeeds: ['medical'],
        },
        {
          id: 'org-2',
          name: 'Disaster Relief Corps',
          slug: 'disaster-corps',
          description: 'Disaster response organization',
          logo: '/logos/disaster.png',
          causes: ['disaster_relief'],
          countries: ['GLOBAL'],
          trustScore: 95,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 8,
          addressedNeeds: ['food', 'shelter'],
        },
        {
          id: 'org-3',
          name: 'Medical Emergency Fund',
          slug: 'medical-fund',
          description: 'Medical emergency support',
          logo: '/logos/medical.png',
          causes: ['health_crisis'],
          countries: ['GLOBAL'],
          trustScore: 85,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 6,
          addressedNeeds: ['medical'],
        },
      ];

      // Classification with unclear/generic location
      const classification: Classification = {
        cause: 'health_crisis',
        tier1_crisis_type: 'health_emergency',
        tier2_root_cause: 'natural_phenomenon',
        identified_needs: ['medical'],
        geo: 'UNKNOWN',
        geoName: 'Unknown Location',
        affectedGroups: ['general_population'],
        confidence: 0.7,
        matchedKeywords: ['health', 'emergency'],
        relevantExcerpts: ['Health emergency'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'high',
          systemStatus: 'strained',
          imminentRisk: false,
          reasoning: 'Health system under pressure',
        },
      };

      const results = matchCharities(classification, charities);

      // Should rank by cause match first, then trust score
      expect(results[0].causes).toContain('health_crisis');
      expect(results[0].trustScore).toBeGreaterThanOrEqual(results[1]?.trustScore || 0);
      
      // Health Crisis Responders should rank first (cause match + high trust)
      expect(results[0].name).toBe('Health Crisis Responders');
      expect(results[0].cause_match_level).toBe(1); // Perfect match with need
    });
  });

  // ============================================================================
  // TEST SCENARIO 3: Multiple orgs with same geo relevance
  // Cause breaks ties, then trust
  // ============================================================================
  
  describe('Scenario 3: Multiple orgs in same country - cause and trust break ties', () => {
    it('should sort by cause match level, then trust score', () => {
      const charities: Charity[] = [
        {
          id: 'kenya-org-1',
          name: 'Kenya Disaster Response',
          slug: 'kenya-disaster',
          description: 'Disaster response in Kenya',
          logo: '/logos/kenya1.png',
          causes: ['disaster_relief'],
          countries: ['KE'],
          trustScore: 80,
          vettingLevel: 'partner_only',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['food', 'shelter'],
        },
        {
          id: 'kenya-org-2',
          name: 'Kenya Health Services',
          slug: 'kenya-health',
          description: 'Health services in Kenya',
          logo: '/logos/kenya2.png',
          causes: ['health_crisis'],
          countries: ['KE'],
          trustScore: 90,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['medical'],
        },
        {
          id: 'kenya-org-3',
          name: 'Kenya Humanitarian Aid',
          slug: 'kenya-humanitarian',
          description: 'Humanitarian aid in Kenya',
          logo: '/logos/kenya3.png',
          causes: ['humanitarian_crisis'],
          countries: ['KE'],
          trustScore: 85,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['food', 'shelter', 'medical'],
        },
      ];

      const classification: Classification = {
        cause: 'humanitarian_crisis',
        tier1_crisis_type: 'conflict_displacement',
        tier2_root_cause: 'conflict_driven',
        identified_needs: ['food', 'shelter', 'medical'],
        geo: 'KE',
        geoName: 'Kenya',
        affectedGroups: ['refugees'],
        confidence: 0.9,
        matchedKeywords: ['humanitarian', 'crisis'],
        relevantExcerpts: ['Humanitarian crisis in Kenya'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'high',
          systemStatus: 'overwhelmed',
          imminentRisk: true,
          reasoning: 'Large refugee influx',
        },
      };

      const results = matchCharities(classification, charities);

      // All should have same geographic tier (1 - local)
      expect(results[0].geographic_tier).toBe(1);
      expect(results[1].geographic_tier).toBe(1);
      expect(results[2].geographic_tier).toBe(1);

      // Kenya Humanitarian Aid should rank first (exact cause + needs match)
      expect(results[0].name).toBe('Kenya Humanitarian Aid');
      expect(results[0].cause_match_level).toBe(1); // Perfect match

      // Kenya Health Services should rank second (higher trust than Disaster Response)
      expect(results[1].name).toBe('Kenya Health Services');
    });
  });

  // ============================================================================
  // TEST SCENARIO 4: Neighboring country priority
  // Regional orgs rank above global
  // ============================================================================
  
  describe('Scenario 4: Neighboring country orgs (Tier 2) rank above global (Tier 3/4)', () => {
    it('should rank Kenya org (neighboring Sudan) above global org', () => {
      const charities: Charity[] = [
        {
          id: 'global-org',
          name: 'World Relief Organization',
          slug: 'world-relief',
          description: 'Global relief organization',
          logo: '/logos/world.png',
          causes: ['humanitarian_crisis'],
          countries: ['GLOBAL'],
          trustScore: 95,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 9,
          addressedNeeds: ['food', 'shelter', 'medical'],
        },
        {
          id: 'kenya-org',
          name: 'Kenya Regional Relief',
          slug: 'kenya-regional',
          description: 'Regional relief organization based in Kenya',
          logo: '/logos/kenya.png',
          causes: ['humanitarian_crisis'],
          countries: ['KE'],
          trustScore: 85,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 6,
          addressedNeeds: ['food', 'shelter'],
        },
      ];

      const classification: Classification = {
        cause: 'humanitarian_crisis',
        tier1_crisis_type: 'conflict_displacement',
        tier2_root_cause: 'conflict_driven',
        identified_needs: ['food', 'shelter'],
        geo: 'SD',
        geoName: 'Sudan',
        affectedGroups: ['refugees'],
        confidence: 0.92,
        matchedKeywords: ['conflict', 'refugees'],
        relevantExcerpts: ['Sudan refugee crisis'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'extreme',
          systemStatus: 'collapsed',
          imminentRisk: true,
          reasoning: 'Ongoing conflict',
        },
      };

      const results = matchCharities(classification, charities);

      // Kenya org should rank first (Tier 2 - neighboring)
      expect(results[0].name).toBe('Kenya Regional Relief');
      expect(results[0].geographic_tier).toBe(2); // Neighboring/Regional
      
      // Global org should rank second (Tier 3 - global high flexibility)
      expect(results[1].name).toBe('World Relief Organization');
      expect(results[1].geographic_tier).toBe(3);
      
      // Verify proximity reasoning
      expect(results[0].proximity_reason).toMatch(/neighbor|region/i);
    });
  });

  // ============================================================================
  // TEST SCENARIO 5: Global org flexibility differentiation
  // High flexibility (Tier 3) ranks above low flexibility (Tier 4)
  // ============================================================================
  
  describe('Scenario 5: Global org with high flexibility ranks above low flexibility', () => {
    it('should rank high flexibility global org (Tier 3) above low flexibility (Tier 4)', () => {
      const charities: Charity[] = [
        {
          id: 'global-low',
          name: 'Global Partners Network',
          slug: 'global-partners',
          description: 'Global org with partner-based deployment',
          logo: '/logos/partners.png',
          causes: ['humanitarian_crisis'],
          countries: ['GLOBAL'],
          trustScore: 90,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 5, // Low flexibility
          addressedNeeds: ['food', 'shelter'],
        },
        {
          id: 'global-high',
          name: 'Rapid Response International',
          slug: 'rapid-response',
          description: 'Global org with rapid deployment capability',
          logo: '/logos/rapid.png',
          causes: ['humanitarian_crisis'],
          countries: ['GLOBAL'],
          trustScore: 88,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 9, // High flexibility
          addressedNeeds: ['food', 'shelter', 'medical'],
        },
      ];

      const classification: Classification = {
        cause: 'humanitarian_crisis',
        tier1_crisis_type: 'natural_disaster',
        tier2_root_cause: 'natural_phenomenon',
        identified_needs: ['food', 'shelter'],
        geo: 'NP',
        geoName: 'Nepal',
        affectedGroups: ['affected_population'],
        confidence: 0.88,
        matchedKeywords: ['earthquake', 'disaster'],
        relevantExcerpts: ['Earthquake in Nepal'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'extreme',
          systemStatus: 'overwhelmed',
          imminentRisk: true,
          reasoning: 'Major earthquake',
        },
      };

      const results = matchCharities(classification, charities);

      // High flexibility should rank first (Tier 3)
      expect(results[0].name).toBe('Rapid Response International');
      expect(results[0].geographic_tier).toBe(3);
      expect(results[0].geographicFlexibility).toBeGreaterThanOrEqual(7);
      
      // Low flexibility should rank second (Tier 4)
      expect(results[1].name).toBe('Global Partners Network');
      expect(results[1].geographic_tier).toBe(4);
      expect(results[1].geographicFlexibility).toBeLessThan(7);
      
      // Verify reasoning mentions deployment capability
      expect(results[0].proximity_reason).toMatch(/rapid|deployment/i);
      expect(results[1].proximity_reason).toMatch(/partner/i);
    });
  });

  // ============================================================================
  // TEST SCENARIO 6: Cause match levels
  // Exact match > category match > adjacent
  // ============================================================================
  
  describe('Scenario 6: Cause match levels - exact > category > adjacent', () => {
    it('should rank Level 1 (exact) > Level 2 (category) > Level 3 (adjacent)', () => {
      const charities: Charity[] = [
        {
          id: 'org-adjacent',
          name: 'Social Justice Alliance',
          slug: 'social-justice',
          description: 'Social justice organization',
          logo: '/logos/justice.png',
          causes: ['social_justice'], // Adjacent to humanitarian_crisis
          countries: ['GLOBAL'],
          trustScore: 92,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 8,
          addressedNeeds: ['legal_aid'],
        },
        {
          id: 'org-category',
          name: 'Humanitarian Response Team',
          slug: 'humanitarian-team',
          description: 'Humanitarian response',
          logo: '/logos/humanitarian.png',
          causes: ['humanitarian_crisis'], // Category match only
          countries: ['GLOBAL'],
          trustScore: 90,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 8,
          addressedNeeds: ['shelter'], // Doesn't match specific needs
        },
        {
          id: 'org-exact',
          name: 'Crisis Food & Shelter',
          slug: 'crisis-food-shelter',
          description: 'Food and shelter for crisis situations',
          logo: '/logos/food.png',
          causes: ['humanitarian_crisis'], // Exact cause + needs match
          countries: ['GLOBAL'],
          trustScore: 88,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 8,
          addressedNeeds: ['food', 'shelter'], // Matches specific needs
        },
      ];

      const classification: Classification = {
        cause: 'humanitarian_crisis',
        tier1_crisis_type: 'conflict_displacement',
        tier2_root_cause: 'conflict_driven',
        identified_needs: ['food', 'shelter'],
        geo: 'SY',
        geoName: 'Syria',
        affectedGroups: ['refugees'],
        confidence: 0.93,
        matchedKeywords: ['humanitarian', 'refugees'],
        relevantExcerpts: ['Humanitarian crisis in Syria'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'extreme',
          systemStatus: 'collapsed',
          imminentRisk: true,
          reasoning: 'Ongoing conflict',
        },
      };

      const results = matchCharities(classification, charities);

      // All have same geographic tier (3 - global high flexibility)
      expect(results.every(r => r.geographic_tier === 3)).toBe(true);

      // Level 1 (exact match) should rank first
      expect(results[0].name).toBe('Crisis Food & Shelter');
      expect(results[0].cause_match_level).toBe(1);
      expect(results[0].cause_match_reason).toMatch(/food|shelter/i);

      // Level 2 (category only) should rank second
      expect(results[1].name).toBe('Humanitarian Response Team');
      expect(results[1].cause_match_level).toBe(2);

      // Level 3 (adjacent) should rank third
      expect(results[2].name).toBe('Social Justice Alliance');
      expect(results[2].cause_match_level).toBe(3);
      expect(results[2].cause_match_reason).toMatch(/related/i);
    });
  });

  // ============================================================================
  // TEST SCENARIO 7: Trust score as tie-breaker
  // Within same tier and level, higher trust ranks first
  // ============================================================================
  
  describe('Scenario 7: Trust score breaks ties within same tier and level', () => {
    it('should rank higher trust score first when tier and level are equal', () => {
      const charities: Charity[] = [
        {
          id: 'org-trust-85',
          name: 'Relief Organization A',
          slug: 'relief-a',
          description: 'Relief organization',
          logo: '/logos/a.png',
          causes: ['disaster_relief'],
          countries: ['PH'],
          trustScore: 85,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['food', 'shelter'],
        },
        {
          id: 'org-trust-95',
          name: 'Relief Organization B',
          slug: 'relief-b',
          description: 'Relief organization',
          logo: '/logos/b.png',
          causes: ['disaster_relief'],
          countries: ['PH'],
          trustScore: 95,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['food', 'shelter'],
        },
        {
          id: 'org-trust-90',
          name: 'Relief Organization C',
          slug: 'relief-c',
          description: 'Relief organization',
          logo: '/logos/c.png',
          causes: ['disaster_relief'],
          countries: ['PH'],
          trustScore: 90,
          vettingLevel: 'partner_pg_review',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['food', 'shelter'],
        },
      ];

      const classification: Classification = {
        cause: 'disaster_relief',
        tier1_crisis_type: 'natural_disaster',
        tier2_root_cause: 'natural_phenomenon',
        identified_needs: ['food', 'shelter'],
        geo: 'PH',
        geoName: 'Philippines',
        affectedGroups: ['affected_population'],
        confidence: 0.91,
        matchedKeywords: ['typhoon', 'disaster'],
        relevantExcerpts: ['Typhoon in Philippines'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'high',
          systemStatus: 'overwhelmed',
          imminentRisk: true,
          reasoning: 'Major typhoon',
        },
      };

      const results = matchCharities(classification, charities);

      // All should have same tier and level
      expect(results[0].geographic_tier).toBe(1);
      expect(results[1].geographic_tier).toBe(1);
      expect(results[2].geographic_tier).toBe(1);
      expect(results[0].cause_match_level).toBe(1);
      expect(results[1].cause_match_level).toBe(1);
      expect(results[2].cause_match_level).toBe(1);

      // Should be sorted by trust score (descending)
      expect(results[0].trustScore).toBe(95);
      expect(results[1].trustScore).toBe(90);
      expect(results[2].trustScore).toBe(85);
      
      expect(results[0].name).toBe('Relief Organization B');
      expect(results[1].name).toBe('Relief Organization C');
      expect(results[2].name).toBe('Relief Organization A');
    });
  });

  // ============================================================================
  // TEST SCENARIO 8: Multiple countries per org
  // Use best matching country for tier calculation
  // ============================================================================
  
  describe('Scenario 8: Org operating in multiple countries gets best tier', () => {
    it('should use best matching country when org operates in multiple locations', () => {
      const charities: Charity[] = [
        {
          id: 'multi-country-org',
          name: 'East Africa Relief Network',
          slug: 'east-africa-relief',
          description: 'Operating across East Africa',
          logo: '/logos/east-africa.png',
          causes: ['humanitarian_crisis'],
          countries: ['KE', 'UG', 'TZ', 'ET'], // Multiple countries including Ethiopia
          trustScore: 90,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 7,
          addressedNeeds: ['food', 'shelter', 'medical'],
        },
        {
          id: 'single-country-org',
          name: 'Kenya Only Relief',
          slug: 'kenya-only',
          description: 'Operating only in Kenya',
          logo: '/logos/kenya-only.png',
          causes: ['humanitarian_crisis'],
          countries: ['KE'], // Only Kenya (neighboring)
          trustScore: 92,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 5,
          addressedNeeds: ['food', 'shelter'],
        },
      ];

      const classification: Classification = {
        cause: 'humanitarian_crisis',
        tier1_crisis_type: 'conflict_displacement',
        tier2_root_cause: 'conflict_driven',
        identified_needs: ['food', 'shelter'],
        geo: 'ET',
        geoName: 'Ethiopia',
        affectedGroups: ['refugees'],
        confidence: 0.89,
        matchedKeywords: ['conflict', 'displacement'],
        relevantExcerpts: ['Crisis in Ethiopia'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'high',
          systemStatus: 'strained',
          imminentRisk: true,
          reasoning: 'Regional conflict',
        },
      };

      const results = matchCharities(classification, charities);

      // Multi-country org should get Tier 1 (operates in Ethiopia)
      expect(results[0].name).toBe('East Africa Relief Network');
      expect(results[0].geographic_tier).toBe(1);
      expect(results[0].proximity_reason).toContain('Ethiopia');

      // Single-country org should get Tier 2 (neighboring)
      expect(results[1].name).toBe('Kenya Only Relief');
      expect(results[1].geographic_tier).toBe(2);
    });
  });

  // ============================================================================
  // ADDITIONAL TESTS: Edge cases and explainability
  // ============================================================================
  
  describe('Additional Tests: Edge cases and explainability', () => {
    
    it('should always populate explainability fields', () => {
      const charities: Charity[] = [
        {
          id: 'test-org',
          name: 'Test Organization',
          slug: 'test-org',
          description: 'Test',
          logo: '/logos/test.png',
          causes: ['disaster_relief'],
          countries: ['US'],
          trustScore: 90,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 7,
          addressedNeeds: ['food'],
        },
      ];

      const classification: Classification = {
        cause: 'disaster_relief',
        tier1_crisis_type: 'natural_disaster',
        tier2_root_cause: 'natural_phenomenon',
        identified_needs: ['food'],
        geo: 'US',
        geoName: 'United States',
        affectedGroups: ['affected_population'],
        confidence: 0.9,
        matchedKeywords: ['disaster'],
        relevantExcerpts: ['Disaster'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'moderate',
          systemStatus: 'coping',
          imminentRisk: false,
          reasoning: 'Localized disaster',
        },
      };

      const results = matchCharities(classification, charities);

      expect(results[0].proximity_reason).toBeTruthy();
      expect(results[0].cause_match_reason).toBeTruthy();
      expect(results[0].geographic_tier).toBeGreaterThan(0);
      expect(results[0].cause_match_level).toBeGreaterThan(0);
      expect(results[0].final_rank_score).toBeDefined();
    });

    it('should calculate final_rank_score correctly', () => {
      const charities: Charity[] = [
        {
          id: 'test-org',
          name: 'Test Organization',
          slug: 'test-org',
          description: 'Test',
          logo: '/logos/test.png',
          causes: ['disaster_relief'],
          countries: ['US'],
          trustScore: 85,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 7,
          addressedNeeds: ['food'],
        },
      ];

      const classification: Classification = {
        cause: 'disaster_relief',
        tier1_crisis_type: 'natural_disaster',
        tier2_root_cause: 'natural_phenomenon',
        identified_needs: ['food'],
        geo: 'US',
        geoName: 'United States',
        affectedGroups: ['affected_population'],
        confidence: 0.9,
        matchedKeywords: ['disaster'],
        relevantExcerpts: ['Disaster'],
        hasMatchingCharities: true,
        severityAssessment: {
          level: 'moderate',
          systemStatus: 'coping',
          imminentRisk: false,
          reasoning: 'Localized disaster',
        },
      };

      const results = matchCharities(classification, charities);
      const result = results[0];

      // Formula: (tier * 1000) + (level * 100) + (100 - trustScore)
      const expectedScore = (result.geographic_tier * 1000) + 
                           (result.cause_match_level * 100) + 
                           (100 - result.trustScore);
      
      expect(result.final_rank_score).toBe(expectedScore);
    });

    it('should handle empty charity list', () => {
      const classification: Classification = {
        cause: 'disaster_relief',
        tier1_crisis_type: 'natural_disaster',
        tier2_root_cause: 'natural_phenomenon',
        identified_needs: ['food'],
        geo: 'US',
        geoName: 'United States',
        affectedGroups: ['affected_population'],
        confidence: 0.9,
        matchedKeywords: ['disaster'],
        relevantExcerpts: ['Disaster'],
        hasMatchingCharities: false,
        severityAssessment: {
          level: 'moderate',
          systemStatus: 'coping',
          imminentRisk: false,
          reasoning: 'Localized disaster',
        },
      };

      const results = matchCharities(classification, []);
      expect(results).toHaveLength(0);
    });

    it('should filter out inactive charities', () => {
      const charities: Charity[] = [
        {
          id: 'active-org',
          name: 'Active Organization',
          slug: 'active-org',
          description: 'Active',
          logo: '/logos/active.png',
          causes: ['disaster_relief'],
          countries: ['US'],
          trustScore: 90,
          vettingLevel: 'pg_direct',
          isActive: true,
          geographicFlexibility: 7,
          addressedNeeds: ['food'],
        },
        {
          id: 'inactive-org',
          name: 'Inactive Organization',
          slug: 'inactive-org',
          description: 'Inactive',
          logo: '/logos/inactive.png',
          causes: ['disaster_relief'],
          countries: ['US'],
          trustScore: 95,
          vettingLevel: 'pg_direct',
          isActive: false, // Inactive
          geographicFlexibility: 8,
          addressedNeeds: ['food'],
        },
      ];

      const classification: Classification = {
