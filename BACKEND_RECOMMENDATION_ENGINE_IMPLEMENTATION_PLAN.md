
# Backend Recommendation Engine Implementation Plan

## Executive Summary

This document provides a detailed implementation plan for a robust nonprofit recommendation engine that addresses the limitations of relying solely on Every.org's search API. The system implements a two-stage approach: **candidate generation** followed by **local reranking** with proper geographic proximity, cause alignment, and trust scoring.

---

## Problem Statement

### Current Issues

1. **Every.org search is optimized for typeahead/name lookup** - not semantic crisis matching
2. **Search results are often irrelevant** for crisis/news articles
3. **No geographic proximity ranking** - global orgs mixed with local responders
4. **No cause alignment filtering** - unrelated organizations appear in results
5. **Trust/vetting signals unclear** - Every.org may not provide these fields
6. **No caching** - repeated API calls for same queries
7. **No transparency** - users can't see why orgs are recommended

### Solution Approach

Implement a **two-stage recommendation pipeline**:

```
Article Context → Candidate Generation → Local Reranking → Enrichment → Cached Results
```

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Recommendation Orchestrator                  │
│                  (recommendNonprofitsForArticle)                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──→ 1. Candidate Generator
             │    ├─ Browse by cause (Every.org /browse)
             │    ├─ Search by terms (Every.org /search)
             │    └─ Deduplicate (up to 200 candidates)
             │
             ├──→ 2. Local Reranker
             │    ├─ Vetting gate (hard filter)
             │    ├─ Geographic proximity (PRIMARY)
             │    ├─ Cause alignment (SECONDARY)
             │    ├─ Trust score (TIEBREAKER)
             │    └─ Quality signals (supporting)
             │
             ├──→ 3. Enricher
             │    └─ Fetch details for top N (parallel)
             │
             └──→ 4. Cache Layer
                  ├─ Search results (6-24h TTL)
                  ├─ Browse results (6-24h TTL)
                  └─ Nonprofit details (24h TTL)
```

---

## Ranking Policy (MUST FOLLOW)

### Priority Order

1. **Geographic Proximity (PRIMARY)**
   - Tier 1: Direct operations in impacted area (country/region/city match)
   - Tier 2: Regional neighbor / same region
   - Tier 3: Global responders with high flexibility
   - Tier 4: Global responders with lower flexibility
   - **Tier dominates ordering**: Tier 1 > Tier 2 > Tier 3 > Tier 4

2. **Cause Alignment (SECONDARY)**
   - Must specialize in disaster relief or closely related expertise
   - Level 1: Perfect match (disaster type + specific needs)
   - Level 2: Category match (disaster relief general)
   - Level 3: Related/adjacent expertise
   - **No match = exclude** (or heavy penalty if <5 results)

3. **Trust Score (TIEBREAKER)**
   - Only applied when geo + cause are similar
   - Target average: ~90% across top results
   - **If unavailable**: Skip tiebreaker, log "unknown"

4. **Vetting Quality (HARD GATE)**
   - Only recommend partner-reviewed/vetted organizations
   - **If unavailable**: Apply fallback gating rules (see below)

### Fallback Gating Rules (When Vetting Unavailable)

```typescript
// If Every.org doesn't provide vetting status
if (vettedStatus === 'unknown') {
  // Apply quality-based gating
  const passes = 
    org.isDisbursable === true &&
    org.description?.length > 50 &&
    org.websiteUrl &&
    !isLegalNameOnly(org.name);
  
  if (!passes) {
    exclude(org);
    log('Excluded due to quality gate: ' + org.name);
  }
}
```

---

## Implementation Plan

### Phase 1: Every.org Client Module

**File**: `backend/src/services/everyorg/client.ts`

```typescript
export interface EveryOrgClient {
  // Search for nonprofits by name/keyword
  searchNonprofits(
    searchTerm: string,
    options?: {
      causes?: string[];
      take?: number;
    }
  ): Promise<NonprofitCandidate[]>;

  // Browse nonprofits by cause
  browseCause(
    cause: string,
    options?: {
      take?: number;
      page?: number;
    }
  ): Promise<NonprofitCandidate[]>;

  // Get detailed nonprofit information
  getNonprofitDetails(
    identifier: string // slug or EIN
  ): Promise<NonprofitEnriched>;
}
```

**Key Features**:
- Retry logic with exponential backoff (429/5xx errors)
- Timeout handling (10s default)
- URL/path encoding for search terms
- Partial result handling (don't fail entire request)
- API key from `process.env.EVERYORG_API_KEY`

**Error Handling**:
```typescript
try {
  const response = await axios.get(url, { timeout: 10000 });
  return response.data;
} catch (error) {
  if (error.response?.status === 429) {
    // Retry with backoff
    await sleep(retryDelay);
    return retry();
  }
  if (error.response?.status >= 500) {
    // Log and return partial results
    logger.error('Every.org 5xx error', { url, error });
    return [];
  }
  throw error;
}
```

### Phase 2: Data Models

**File**: `backend/src/services/everyorg/models.ts`

```typescript
// From search/browse endpoints
export interface NonprofitCandidate {
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  ein?: string;
  locationAddress?: string;
  primaryCategory?: string;
  nteeCode?: string;
  isDisbursable?: boolean;
  // Metadata
  source: 'search' | 'browse';
  searchTerm?: string;
  cause?: string;
}

// From nonprofit details endpoint
export interface NonprofitEnriched extends NonprofitCandidate {
  coverImageUrl?: string;
  nteeCodeMeaning?: string;
  categories?: string[];
  // Additional fields from details API
}

// After local reranking
export interface NonprofitRanked extends NonprofitEnriched {
  score: {
    total: number;
    geo: number;
    cause: number;
    trust: number;
    quality: number;
  };
  geoTier: 1 | 2 | 3 | 4 | 5; // 5 = no match
  causeLevel: 1 | 2 | 3 | 4; // 4 = no match
  reasons: string[];
  scoreBreakdown: {
    geoReason: string;
    causeReason: string;
    trustReason?: string;
    qualityReason?: string;
  };
}

// Trust/vetting signals (pluggable)
export interface TrustVettingSignals {
  trustScore?: number; // 0-100
  vettedStatus: 'true' | 'false' | 'unknown';
  source: 'everyorg' | 'charity_navigator' | 'candid' | 'internal' | 'none';
}
```

### Phase 3: Candidate Generator

**File**: `backend/src/services/recommendations/candidateGenerator.ts`

```typescript
export interface CandidateGeneratorInput {
  articleText: string; // title + description
  entities: {
    geography: string; // normalized country/region/city
    disasterType: string; // earthquake, flood, etc.
    affectedGroups: string[]; // refugees, children, etc.
  };
  causes: string[]; // Every.org causes (can be empty)
}

export async function generateCandidates(
  input: CandidateGeneratorInput,
  client: EveryOrgClient
): Promise<NonprofitCandidate[]> {
  const candidates: NonprofitCandidate[] = [];
  
  // 1. Browse by cause (if causes exist)
  if (input.causes.length > 0) {
    for (const cause of input.causes.slice(0, 3)) {
      const results = await client.browseCause(cause, { take: 50 });
      candidates.push(...results);
    }
  }
  
  // 2. Build search terms
  const searchTerms = buildSearchTerms(input);
  
  // 3. Search for each term
  for (const term of searchTerms.slice(0, 5)) {
    const results = input.causes.length > 0
      ? await client.searchNonprofits(term, { causes: input.causes, take: 50 })
      : await client.searchNonprofits(term, { take: 50 });
    candidates.push(...results);
  }
  
  // 4. Deduplicate by slug/EIN
  const deduped = deduplicateCandidates(candidates);
  
  // 5. Keep up to 200 candidates
  return deduped.slice(0, 200);
}

function buildSearchTerms(input: CandidateGeneratorInput): string[] {
  return [
    input.entities.disasterType, // "earthquake"
    input.entities.geography, // "Turkey"
    `${input.entities.disasterType} ${input.entities.geography}`, // "earthquake Turkey"
    ...input.entities.affectedGroups.slice(0, 2), // "refugees", "children"
  ].filter(Boolean);
}
```

### Phase 4: Local Reranker

**File**: `backend/src/services/recommendations/reranker.ts`

```typescript
export interface RerankerInput {
  candidates: NonprofitCandidate[];
  entities: {
    geography: string;
    disasterType: string;
    affectedGroups: string[];
  };
  causes: string[];
  articleKeywords: string[];
  trustProvider?: TrustProvider;
  vettingProvider?: VettingProvider;
}

export async function rerankCandidates(
  input: RerankerInput
): Promise<NonprofitRanked[]> {
  const ranked: NonprofitRanked[] = [];
  
  for (const candidate of input.candidates) {
    // A) Vetting gate (hard filter)
    const vetting = await getVettingStatus(candidate, input.vettingProvider);
    if (vetting.vettedStatus === 'false') {
      continue; // Exclude
    }
    if (vetting.vettedStatus === 'unknown') {
      // Apply fallback gating
      if (!passesQualityGate(candidate)) {
        continue; // Exclude
      }
    }
    
    // B) Geographic proximity (PRIMARY)
    const geoResult = calculateGeoTier(candidate, input.entities.geography);
    if (geoResult.tier === 5) {
      continue; // No geo match - exclude
    }
    
    // C) Cause alignment (SECONDARY)
    const causeResult = calculateCauseLevel(candidate, input);
    if (causeResult.level === 4) {
      // No cause match - exclude unless we have <5 results
      if (ranked.length >= 5) {
        continue;
      }
    }
    
    // D) Trust score (TIEBREAKER)
    const trust = await getTrustScore(candidate, input.trustProvider);
    
    // E) Quality signals
    const quality = calculateQualityScore(candidate);
    
    // F) Calculate total score
    const score = {
      geo: geoTierToScore(geoResult.tier),
      cause: causeLevelToScore(causeResult.level),
      trust: trust.trustScore || 0,
      quality: quality,
      total: 0, // Calculated below
    };
    
    // Weighted scoring (geo dominates)
    score.total = 
      (score.geo * 1000) + // Geo is primary
      (score.cause * 100) + // Cause is secondary
      (score.trust * 1) + // Trust is tiebreaker
      (score.quality * 0.1); // Quality is supporting
    
    ranked.push({
      ...candidate,
      score,
      geoTier: geoResult.tier,
      causeLevel: causeResult.level,
      reasons: buildReasons(geoResult, causeResult, trust, quality),
      scoreBreakdown: {
        geoReason: geoResult.reason,
        causeReason: causeResult.reason,
        trustReason: trust.reason,
        qualityReason: quality.reason,
      },
    });
  }
  
  // Sort by total score (descending)
  ranked.sort((a, b) => b.score.total - a.score.total);
  
  return ranked;
}
```

**Geographic Tier Calculation**:

```typescript
function calculateGeoTier(
  candidate: NonprofitCandidate,
  impactedGeography: string
): { tier: 1 | 2 | 3 | 4 | 5; reason: string } {
  const orgLocation = extractLocation(candidate);
  
  // Tier 1: Direct match
  if (orgLocation.country === impactedGeography) {
    return { tier: 1, reason: `Operates directly in ${impactedGeography}` };
  }
  
  // Tier 2: Regional neighbor
  if (areNeighboringCountries(orgLocation.country, impactedGeography)) {
    return { tier: 2, reason: `Operates in neighboring country` };
  }
  if (areInSameRegion(orgLocation.country, impactedGeography)) {
    return { tier: 2, reason: `Operates in same region` };
  }
  
  // Tier 3: Global with high flexibility
  if (orgLocation.isGlobal && hasHighFlexibility(candidate)) {
    return { tier: 3, reason: `Global responder with rapid deployment` };
  }
  
  // Tier 4: Global with lower flexibility
  if (orgLocation.isGlobal) {
    return { tier: 4, reason: `Global organization with partner network` };
  }
  
  // Tier 5: No match
  return { tier: 5, reason: `Does not operate in this region` };
}
```

**Cause Alignment Calculation**:

```typescript
function calculateCauseLevel(
  candidate: NonprofitCandidate,
  input: RerankerInput
): { level: 1 | 2 | 3 | 4; reason: string } {
  const orgCauses = extractCauses(candidate);
  const disasterRelated = ['disaster relief', 'emergency response', 'humanitarian aid'];
  
  // Level 1: Perfect match (disaster type + specific needs)
  if (matchesDisasterType(orgCauses, input.entities.disasterType) &&
      matchesAffectedGroups(orgCauses, input.entities.affectedGroups)) {
    return { level: 1, reason: `Specializes in ${input.entities.disasterType} relief` };
  }
  
  // Level 2: Category match (disaster relief general)
  if (orgCauses.some(c => disasterRelated.includes(c.toLowerCase()))) {
    return { level: 2, reason: `Specializes in disaster relief` };
  }
  
  // Level 3: Related/adjacent
  const adjacentCauses = ['humanitarian crisis', 'refugee support', 'food aid'];
  if (orgCauses.some(c => adjacentCauses.includes(c.toLowerCase()))) {
    return { level: 3, reason: `Related humanitarian expertise` };
  }
  
  // Level 4: No match
  return { level: 4, reason: `Does not match crisis type` };
}
```

### Phase 5: Enricher

**File**: `backend/src/services/recommendations/enricher.ts`

```typescript
export async function enrichTopCandidates(
  ranked: NonprofitRanked[],
  client: EveryOrgClient,
  options: { topN?: number; concurrency?: number } = {}
): Promise<NonprofitRanked[]> {
  const topN = options.topN || 20;
  const concurrency = options.concurrency || 5;
  
  const toEnrich = ranked.slice(0, topN);
  
  // Fetch details in parallel with concurrency limit
  const enriched = await pMap(
    toEnrich,
    async (candidate) => {
      try {
        const details = await client.getNonprofitDetails(candidate.slug);
        return { ...candidate, ...details };
      } catch (error) {
        logger.warn('Failed to enrich', { slug: candidate.slug, error });
        return candidate; // Keep base data
      }
    },
    { concurrency }
  );
  
  return enriched;
}
```

### Phase 6: Caching Layer

**File**: `backend/src/services/recommendations/cache.ts`

```typescript
export interface CacheConfig {
  type: 'memory' | 'redis';
  ttl: {
    search: number; // 6-24 hours
    browse: number; // 6-24 hours
    nonprofit: number; // 24 hours
  };
}

export class RecommendationCache {
  private cache: Map<string, CacheEntry> | RedisClient;
  
  async get<T>(key: string): Promise<T | null> {
    // Check cache
    const entry = await this.cache.get(key);
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() > entry.expiresAt) {
      await this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      expiresAt: Date.now() + ttl * 1000,
    };
    await this.cache.set(key, entry);
  }
  
  // Cache key generators
  searchKey(term: string, causes: string[], take: number): string {
    const causesHash = hashArray(causes);
    return `everyorg:search:${term}:${causesHash}:${take}`;
  }
  
  browseKey(cause: string, page: number, take: number): string {
    return `everyorg:browse:${cause}:${page}:${take}`;
  }
  
  nonprofitKey(slugOrEin: string): string {
    return `everyorg:nonprofit:${slugOrEin}`;
  }
}
```

### Phase 7: Orchestrator

**File**: `backend/src/services/recommendations/orchestrator.ts`

```typescript
export interface RecommendationRequest {
  articleContext: {
    title: string;
    description: string;
    fullText?: string;
  };
  debug?: boolean;
}

export interface RecommendationResponse {
  nonprofits: Array<{
    name: string;
    slug: string;
    ein?: string;
    description: string;
    websiteUrl?: string;
    location?: string;
    score: number;
    reasons: string[];
    profileUrl: string;
  }>;
  debug?: DebugInfo;
}

export async function recommendNonprofitsForArticle(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const startTime = Date.now();
  
  // 1. Extract entities from article
  const entities = await extractEntities(request.articleContext);
  
  // 2. Generate candidates
  const candidates = await generateCandidates({
    articleText: `${request.articleContext.title} ${request.articleContext.description}`,
    entities,
    causes: entities.causes,
  }, everyOrgClient);
  
  // 3. Rerank candidates
  const ranked = await rerankCandidates({
    candidates,
    entities,
    causes: entities.causes,
    articleKeywords: entities.keywords,
    trustProvider,
    vettingProvider,
  });
  
  // 4. Enrich top N
  const enriched = await enrichTopCandidates(ranked, everyOrgClient, { topN: 20 });
  
  // 5. Format response
  const nonprofits = enriched.slice(0, 10).map(org => ({
    name: org.name,
    slug: org.slug,
    ein: org.ein,
    description: org.description || 'No description available',
    websiteUrl: org.websiteUrl,
    location: org.locationAddress,
    score: org.score.total,
    reasons: org.reasons,
    profileUrl: `https://www.every.org/${org.slug}`,
  }));
  
  // 6. Build debug info (if requested)
  const debug = request.debug ? buildDebugInfo({
    entities,
    candidates,
    ranked,
    enriched,
    duration: Date.now() - startTime,
  }) : undefined;
  
  return { nonprofits, debug };
}
```

### Phase 8: Debug Mode

**File**: `backend/src/services/recommendations/debug.ts`

```typescript
export interface DebugInfo {
  // Input analysis
  entities: {
    geography: string;
    disasterType: string;
    affectedGroups: string[];
    causes: string[];
    keywords: string[];
  };
  
  // Candidate generation
  candidateGeneration: {
    searchTermsUsed: string[];
    causesUsed: string[];
    totalCandidates: number;
    sources: {
      browse: number;
      search: number;
    };
  };
  
  // Reranking
  reranking: {
    geoTierCounts: Record<1 | 2 | 3 | 4 | 5, number>;
    causeLevelCounts: Record<1 | 2 | 3 | 4, number>;
    excludedCounts: {
      vetting: number;
      cause: number;
      geo: number;
    };
    trustCoverage: {
      available: number;
      unavailable: number;
      averageScore?: number;
    };
  };
  
  // Top results
  topResults: Array<{
    rank: number;
    name: string;
    geoTier: number;
    causeLevel: number;
    trustScore?: number;
    vettedStatus: string;
    totalScore: number;
    reasons: string[];
  }>;
  
  // Performance
  performance: {
    totalDuration: number;
    candidateGeneration: number;
    reranking: number;
    enrichment: number;
  };
}
```

---

## API Endpoints

### GET /api/v1/recommendations

**Query Parameters**:
- `title` (required): Article title
- `description` (required): Article description
- `fullText` (optional): Full article text
- `debug` (optional): Enable debug mode

**Response**:
```json
{
  "nonprofits": [
    {
      "name": "International Rescue Committee",
      "slug": "international-rescue-committee",
      "ein": "13-5660870",
      "description": "Responds to humanitarian crises...",
      "websiteUrl": "https://www.rescue.org",
      "location": "New York, NY",
      "score": 1523.5,
      "reasons": [
        "Geo Tier 1: Operates directly in Turkey",
        "Cause Level 1: Specializes in earthquake relief",
        "Trust score: 95%",
        "Quality: Complete profile with website"
      ],
      "profileUrl": "https://www.every.org/international-rescue-committee"
    }
  ],
  "debug": {
    // Only included if debug=true
  }
}
```

---

## Testing Strategy

### Unit Tests

**File**: `backend/src/services/recommendations/__tests__/reranker.test.ts`

```typescript
describe('Geographic Tier Ordering', () => {
  it('should rank Tier 1 above Tier 2', () => {
    const tier1Org = createMockOrg({ location: 'Turkey' });
    const tier2Org = createMockOrg({ location: 'Greece' }); // Neighbor
    
    const ranked = rerankCandidates({
      candidates: [tier2Org, tier1Org],
      entities: { geography: 'Turkey', ... },
      ...
    });
    
    expect(ranked[0].slug).toBe(tier1Org.slug);
    expect(ranked[0].geoTier).toBe(1);
    expect(ranked[1].geoTier).toBe(2);
  });
});

describe('Cause Alignment Filter', () => {
  it('should exclude orgs with no cause match', () => {
    const disasterOrg = createMockOrg({ causes: ['disaster relief'] });
    const animalOrg = createMockOrg({ causes: ['animal welfare'] });
    
    const ranked = rerankCandidates({
      candidates: [disasterOrg, animalOrg],
      entities: { disasterType: 'earthquake', ... },
      ...
    });
    
    expect(ranked).toHaveLength(1);
    expect(ranked[0].slug).toBe(disasterOrg.slug);
  });
});

describe('Trust Tiebreaker', () => {
  it('should use trust only when geo+cause are similar', () => {
    const highTrustOrg = createMockOrg({ 
      location: 'Turkey',
      causes: ['disaster relief'],
      trustScore: 95
    });
    const lowTrustOrg = createMockOrg({ 
      location: 'Turkey',
      causes: ['disaster relief'],
      trustScore: 75
    });
    
    const ranked = rerankCandidates({
      candidates: [lowTrustOrg, highTrustOrg],
      entities: { geography: 'Turkey', ... },
      trustProvider: mockTrustProvider,
      ...
    });
    
    expect(ranked[0].slug).toBe(highTrustOrg.slug);
  });
});

describe('Vetting Gate', () => {
  it('should exclude orgs with vettedStatus=false', () => {
    const vettedOrg = createMockOrg({ vetted: true });
    const unvettedOrg = createMockOrg({ vetted: false });
    
    const ranked = rerankCandidates({
      candidates: [vettedOrg, unvettedOrg],
      vettingProvider: mockVettingProvider,
      ...
    });
    
    expect(ranked).toHaveLength(1);
    expect(ranked[0].slug).toBe(vettedOrg.slug);
  });
  
  it('should apply fallback rules when vetting unknown', () => {
    const qualityOrg = createMockOrg({ 
      vetted: 'unknown',
      description: 'Long description...',
      websiteUrl: 'https://example.org'
    });
    const lowQualityOrg = createMockOrg({ 
      vetted: 'unknown',
      description: '',
      websiteUrl: null
    });
    
    const ranked = rerankCandidates({
      candidates: [qualityOrg, lowQualityOrg],
      vettingProvider: mockVettingProvider,
      ...
    });
    
    expect(ranked).toHaveLength(1);
    expect(ranked[0].slug).toBe(qualityOrg.slug);
  });
});
```

### Integration Tests (Mocked)

**File**: `backend/src/services/recommendations/__tests__/integration.test.ts`

```typescript
describe('End-to-End Recommendation Flow', () => {
  it('should recommend relevant orgs for Turkey earthquake', async () => {
    const request = {
      articleContext: {
        title: 'Devastating earthquake strikes Turkey',
        description: 'A 7.8 magnitude earthquake has caused widespread destruction...',
      },
      debug: true,
    };
    
    const response = await recommendNonprofitsForArticle(request);
    
    expect(response.nonprofits).toHaveLength(10);
    expect(response.nonprofits[0].reasons).toContain('Operates directly in Turkey');
    expect(response.debug.reranking.geoTierCounts[1]).toBeGreaterThan(0);
  });
  
  it('should handle ambiguous org names correctly', async () => {
    const request = {
      articleContext: {
        title: 'California wildfire emergency',
        description: 'Wildfires rage across California...',
      },
    };
    
    const response = await recommendNonprofitsForArticle(request);
    
    // Should not include "legal-name-only" orgs without description
    response.nonprofits.forEach(org => {
      expect(org.description).not.toBe('No description available');
      expect(org.websiteUrl).toBeDefined();
    });
  });
});
```

### Test Scenarios

1. **Earthquake in Turkey**
   - Expected: Turkish orgs first, regional second, global third
   - Cause: Disaster relief orgs only

2. **Wildfire in California**
   - Expected: California/US orgs first, North American second
   - Cause: Disaster relief + environmental orgs

3. **Flood in Bangladesh**
   - Expected: Bangladesh orgs first, South Asian second
   - Cause: Disaster relief + humanitarian aid

4. **Ambiguous org name**
   - Expected: Penalized unless has description + website

---

## Dev Harness

### CLI Tool

**File**: `backend/scripts/recommend.ts`

```bash
# Run recommendation for test article
npm run recommend -- \
  --title "Earthquake strikes Turkey" \
  --desc "A devastating 7.8 magnitude earthquake..." \
  --debug

# Output:
# ✓ Generated 147 candidates
# ✓ Ranked 23 organizations
# ✓ Enriched top 10
# 
# Top 10 Recommendations:
# 1. International Rescue Committee (score: 1523.5)
#    - Geo Tier 1: Operates directly in Turkey
#    - Cause Level 1: Specializes in earthquake relief
#    - Trust: 95%
# 
# 2. Turkish Red Crescent (score: 1498.2)
#    - Geo Tier 1: Operates directly in Turkey
#    - Cause Level 2: Specializes in disaster relief
#    - Trust: 92%
```

### API Endpoint

```bash
curl "http://localhost:3000/api/v1/recommendations?\
title=Earthquake%20strikes%20Turkey&\
description=A%20devastating%20earthquake...&\
debug=true"
```

---

## Conflict Resolution & Fallbacks

### Trust Score Unavailable

**Problem**: Every.org may not provide trust scores

**Solution**:
```typescript
interface TrustProvider {
  getTrustScore(org: NonprofitCandidate): Promise<TrustScore | null>;
}

// Default implementation
class EveryOrgTrustProvider implements TrustProvider {
  async getTrustScore(org: NonprofitCandidate): Promise<TrustScore | null> {
    // Check if Every.org provides trust score
    if (org.trustScore !== undefined) {
