import { Reranker, NonprofitRanked } from '../reranker';
import { NonprofitCandidate } from '../../everyorg/client';

describe('Reranker', () => {
  let reranker: Reranker;

  beforeEach(() => {
    reranker = new Reranker();
  });

  // Mock candidates
  const createMockCandidate = (
    slug: string,
    location: string,
    description: string,
    causes: string[] = []
  ): NonprofitCandidate => ({
    slug,
    name: `${slug} Organization`,
    description,
    locationAddress: location,
    websiteUrl: `https://${slug}.org`,
    causes,
    ein: '12-3456789',
  });

  describe('Geographic Tier Ordering', () => {
    it('should rank Tier 1 (direct match) higher than Tier 2 and Tier 3', async () => {
      const candidates = [
        createMockCandidate('global-org', 'New York, USA', 'Global disaster relief', ['disaster-relief']),
        createMockCandidate('turkey-org', 'Istanbul, Turkey', 'Turkey disaster relief', ['disaster-relief']),
        createMockCandidate('greece-org', 'Athens, Greece', 'Regional disaster relief', ['disaster-relief']),
      ];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
          disasterType: 'earthquake',
        },
        causes: ['disaster-relief'],
        articleKeywords: ['earthquake', 'Turkey'],
      });

      expect(result.ranked.length).toBe(3);
      
      // Turkey org should be first (Tier 1)
      expect(result.ranked[0].slug).toBe('turkey-org');
      expect(result.ranked[0].geoTier).toBe('tier1');
      
      // Greece org should be second (Tier 2 - regional neighbor)
      expect(result.ranked[1].slug).toBe('greece-org');
      expect(result.ranked[1].geoTier).toBe('tier2');
      
      // Global org should be third (Tier 3)
      expect(result.ranked[2].slug).toBe('global-org');
      expect(result.ranked[2].geoTier).toBe('tier3');
    });

    it('should correctly count geo tiers', async () => {
      const candidates = [
        createMockCandidate('local-1', 'California, USA', 'Wildfire relief', ['disaster-relief']),
        createMockCandidate('local-2', 'Los Angeles, California', 'Emergency response', ['disaster-relief']),
        createMockCandidate('global-1', 'New York, USA', 'Global disaster relief', ['disaster-relief']),
      ];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'USA', region: 'California' },
          disasterType: 'wildfire',
        },
        causes: ['disaster-relief'],
        articleKeywords: ['wildfire', 'California'],
      });

      expect(result.geoTierCounts.tier1).toBe(2); // Both California orgs
      expect(result.geoTierCounts.tier3).toBe(1); // New York org
    });
  });

  describe('Cause Alignment', () => {
    it('should rank orgs with disaster relief causes higher', async () => {
      const candidates = [
        createMockCandidate('education-org', 'Turkey', 'Education programs', ['education']),
        createMockCandidate('disaster-org', 'Turkey', 'Disaster relief and emergency response', ['disaster-relief']),
      ];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
          disasterType: 'earthquake',
        },
        causes: ['disaster-relief'],
        articleKeywords: ['earthquake'],
      });

      // Disaster org should rank higher due to cause alignment
      expect(result.ranked[0].slug).toBe('disaster-org');
      expect(result.ranked[0].score.cause).toBeGreaterThan(result.ranked[1].score.cause);
    });

    it('should exclude orgs with no cause match when pool is large enough', async () => {
      const candidates = [
        ...Array(6).fill(null).map((_, i) => 
          createMockCandidate(`disaster-${i}`, 'Turkey', 'Disaster relief', ['disaster-relief'])
        ),
        createMockCandidate('unrelated', 'Turkey', 'Art museum', ['arts']),
      ];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
          disasterType: 'earthquake',
        },
        causes: ['disaster-relief'],
        articleKeywords: ['earthquake'],
      });

      // Unrelated org should be excluded
      expect(result.excludedCounts.cause).toBe(1);
      expect(result.ranked.find(r => r.slug === 'unrelated')).toBeUndefined();
    });
  });

  describe('Trust Score Tiebreaker', () => {
    it('should use trust score only when geo and cause are similar', async () => {
      const candidates = [
        createMockCandidate('org-a', 'Turkey', 'Disaster relief', ['disaster-relief']),
        createMockCandidate('org-b', 'Turkey', 'Disaster relief', ['disaster-relief']),
      ];

      const trustProvider = async (org: NonprofitCandidate) => ({
        trustScore: org.slug === 'org-a' ? 95 : 85,
        vettedStatus: 'verified' as const,
        source: 'test',
      });

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
          disasterType: 'earthquake',
        },
        causes: ['disaster-relief'],
        articleKeywords: ['earthquake'],
        trustProvider,
      });

      // org-a should rank higher due to trust score
      expect(result.ranked[0].slug).toBe('org-a');
      expect(result.ranked[0].score.trust).toBe(95);
      expect(result.ranked[1].score.trust).toBe(85);
    });

    it('should report trust coverage correctly', async () => {
      const candidates = [
        createMockCandidate('org-1', 'Turkey', 'Disaster relief', ['disaster-relief']),
        createMockCandidate('org-2', 'Turkey', 'Disaster relief', ['disaster-relief']),
      ];

      const trustProvider = async (org: NonprofitCandidate) => ({
        trustScore: 90,
        vettedStatus: 'verified' as const,
        source: 'test',
      });

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
        },
        causes: ['disaster-relief'],
        articleKeywords: [],
        trustProvider,
      });

      expect(result.trustCoverage).toBe(100); // Both have trust scores
    });
  });

  describe('Vetting Gate', () => {
    it('should exclude orgs with unverified vetting status', async () => {
      const candidates = [
        createMockCandidate('verified-org', 'Turkey', 'Disaster relief', ['disaster-relief']),
        createMockCandidate('unverified-org', 'Turkey', 'Disaster relief', ['disaster-relief']),
      ];

      const vettingProvider = async (org: NonprofitCandidate) => ({
        vettedStatus: org.slug === 'verified-org' ? 'verified' as const : 'unverified' as const,
        source: 'test',
      });

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
        },
        causes: ['disaster-relief'],
        articleKeywords: [],
        vettingProvider,
      });

      expect(result.excludedCounts.vetting).toBe(1);
      expect(result.ranked.find(r => r.slug === 'unverified-org')).toBeUndefined();
    });

    it('should apply fallback gating rules when vetting is unknown', async () => {
      const candidates = [
        createMockCandidate('good-org', 'Turkey', 'Disaster relief with full description', ['disaster-relief']),
        { ...createMockCandidate('bad-org', 'Turkey', '', ['disaster-relief']), websiteUrl: undefined },
      ];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
        },
        causes: ['disaster-relief'],
        articleKeywords: [],
      });

      // bad-org should be excluded due to missing description and website
      expect(result.excludedCounts.vetting).toBe(1);
      expect(result.ranked.find(r => r.slug === 'bad-org')).toBeUndefined();
    });

    it('should exclude legal-name-only organizations', async () => {
      const candidates = [
        createMockCandidate('good-org', 'Turkey', 'Disaster relief', ['disaster-relief']),
        { 
          ...createMockCandidate('legal-org', 'Turkey', 'Disaster relief', ['disaster-relief']),
          name: 'JOHN DOE FOUNDATION INC'
        },
      ];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
        },
        causes: ['disaster-relief'],
        articleKeywords: [],
      });

      // Legal-name-only org should be excluded
      expect(result.ranked.find(r => r.slug === 'legal-org')).toBeUndefined();
    });
  });

  describe('Quality Signals', () => {
    it('should score orgs with complete profiles higher', async () => {
      const completeOrg = createMockCandidate('complete', 'Turkey', 'Full description of disaster relief work', ['disaster-relief']);
      completeOrg.logoUrl = 'https://logo.png';
      completeOrg.ein = '12-3456789';
      completeOrg.nteeCode = 'M20';

      const incompleteOrg = createMockCandidate('incomplete', 'Turkey', 'Brief', ['disaster-relief']);
      incompleteOrg.websiteUrl = undefined;
      incompleteOrg.logoUrl = undefined;

      const candidates = [incompleteOrg, completeOrg];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
        },
        causes: ['disaster-relief'],
        articleKeywords: [],
      });

      const complete = result.ranked.find(r => r.slug === 'complete')!;
      const incomplete = result.ranked.find(r => r.slug === 'incomplete');

      if (incomplete) {
        expect(complete.score.quality).toBeGreaterThan(incomplete.score.quality);
      }
    });
  });

  describe('Reasons Generation', () => {
    it('should generate clear reasons for ranking', async () => {
      const candidates = [
        createMockCandidate('turkey-org', 'Istanbul, Turkey', 'Disaster relief', ['disaster-relief']),
      ];

      const result = await reranker.rerank({
        candidates,
        entities: {
          geography: { country: 'Turkey' },
          disasterType: 'earthquake',
        },
        causes: ['disaster-relief'],
        articleKeywords: ['earthquake'],
      });

      const org = result.ranked[0];
      expect(org.reasons.length).toBeGreaterThan(0);
      expect(org.reasons.some(r => r.includes('Turkey'))).toBe(true);
      expect(org.reasons.some(r => r.includes('disaster relief'))).toBe(true);
    });
  });
});