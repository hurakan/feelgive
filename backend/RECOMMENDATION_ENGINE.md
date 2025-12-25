# Nonprofit Recommendation Engine

A robust, policy-aligned recommendation system for matching crisis/news articles with relevant nonprofit organizations.

## Overview

The recommendation engine solves the problem of irrelevant Every.org search results by implementing a sophisticated multi-stage pipeline:

1. **Candidate Generation** - Broad search using browse + search strategies
2. **Local Reranking** - Policy-aligned scoring (Geo → Cause → Trust)
3. **Enrichment** - Detailed nonprofit information fetching
4. **Caching** - Performance optimization with TTL-based caching

## Architecture

```
Article Context
      ↓
Candidate Generator (browse + search)
      ↓
Reranker (policy-aligned scoring)
      ↓
Enricher (detailed info)
      ↓
Final Recommendations
```

## Ranking Policy (MUST FOLLOW)

The system enforces this strict priority order:

### 1. Geographic Proximity (PRIMARY)
Organizations are ranked by geographic relevance:
- **Tier 1**: Direct match (operates in impacted area)
- **Tier 2**: Regional responders (neighboring countries/regions)
- **Tier 3**: Global responders (no geographic match)

**Tier 1 always outranks Tier 2, which always outranks Tier 3.**

### 2. Cause Alignment (SECONDARY)
Within the same geographic tier, organizations are ranked by cause relevance:
- Must specialize in disaster relief or closely related expertise
- Organizations with no cause match are excluded (if pool is large enough)

### 3. Trust Score (TIEBREAKER)
When geo + cause are similar, trust score breaks ties:
- Target average: ~90% across top results
- Uses transparency, financial health, and impact effectiveness signals
- **Only applied when geo and cause are comparable**

### 4. Vetting Quality (HARD GATE)
Organizations must pass vetting requirements:
- Partner-reviewed/vetted organizations preferred
- Fallback rules when vetting status unknown:
  - Require description AND website
  - Exclude legal-name-only patterns
  - Require minimum metadata quality

## Components

### 1. EveryOrg Client (`everyorg/client.ts`)

Enhanced API client with:
- Retry logic with exponential backoff
- Proper error handling (4xx vs 5xx)
- URL encoding for search terms
- Timeout handling (10s default)

**API Methods:**
```typescript
searchNonprofits(term, { causes?, take? })
browseCause(cause, { take?, page? })
getNonprofitDetails(identifier)
```

### 2. Candidate Generator (`recommendations/candidateGenerator.ts`)

Generates a pool of up to 200 candidates using:
- **Browse strategy**: Top 3 causes from Every.org
- **Search strategy**: Up to 5 search terms derived from:
  - Disaster type (earthquake, wildfire, flood, etc.)
  - Geography (country, region, city)
  - Affected groups (refugees, children, etc.)
  - Generic terms (disaster relief, emergency response)

### 3. Reranker (`recommendations/reranker.ts`)

Implements policy-aligned ranking with:

**Scoring Weights:**
- Geographic: 40% (PRIMARY)
- Cause: 35% (SECONDARY)
- Trust: 15% (TIEBREAKER)
- Quality: 10% (SUPPORTING)

**Features:**
- Pluggable trust/vetting providers
- Diversity rule (max 2 orgs per category)
- Detailed reasoning for each recommendation
- Exclusion tracking (vetting, cause mismatch)

### 4. Enricher (`recommendations/enricher.ts`)

Fetches detailed information for top N candidates:
- Parallel fetching with concurrency limit (5)
- Graceful degradation on failures
- Merges enriched data with base candidate info

### 5. Cache (`recommendations/cache.ts`)

In-memory cache with TTL support:
- **Search/Browse**: 6 hours
- **Nonprofit Details**: 24 hours
- **Recommendations**: 1 hour
- Automatic cleanup of expired entries
- LRU-like eviction when max size reached

### 6. Orchestrator (`recommendations/orchestrator.ts`)

Coordinates the full pipeline:
- Cache-first strategy
- Debug mode support
- Performance tracking
- Error handling with partial results

## API Usage

### POST /api/v1/recommendations

Get nonprofit recommendations for an article.

**Request:**
```json
{
  "title": "Massive Earthquake Strikes Turkey",
  "description": "A devastating 7.8 magnitude earthquake...",
  "entities": {
    "geography": {
      "country": "Turkey",
      "region": "Southern Turkey"
    },
    "disasterType": "earthquake",
    "affectedGroup": "families"
  },
  "causes": ["disaster-relief", "humanitarian-aid"],
  "keywords": ["earthquake", "Turkey", "emergency"],
  "debug": true,
  "topN": 10
}
```

**Response:**
```json
{
  "success": true,
  "nonprofits": [
    {
      "slug": "turkish-red-crescent",
      "name": "Turkish Red Crescent",
      "description": "...",
      "locationAddress": "Ankara, Turkey",
      "websiteUrl": "https://...",
      "profileUrl": "https://www.every.org/turkish-red-crescent",
      "geoTier": "tier1",
      "score": {
        "total": 92.5,
        "geo": 100,
        "cause": 85,
        "trust": 95,
        "quality": 90
      },
      "reasons": [
        "Operates directly in impacted area (Turkey)",
        "Strong disaster relief specialization",
        "Trust score: 95% (charity_navigator)",
        "Partner-reviewed organization"
      ],
      "trustVetting": {
        "trustScore": 95,
        "vettedStatus": "verified",
        "source": "charity_navigator"
      }
    }
  ],
  "debug": {
    "causesUsed": ["disaster-relief", "humanitarian-aid"],
    "searchTermsUsed": ["earthquake", "Turkey", "disaster relief"],
    "geoTierCounts": { "tier1": 5, "tier2": 3, "tier3": 2 },
    "excludedCounts": { "vetting": 2, "cause": 5 },
    "trustCoverage": 80.0,
    "candidateCount": 150,
    "enrichmentCount": 10,
    "cacheHit": false,
    "cacheStats": { "hits": 5, "misses": 3, "hitRate": 62.5 },
    "processingTimeMs": 1250
  }
}
```

### GET /api/v1/recommendations/cache/stats

Get cache statistics.

### POST /api/v1/recommendations/cache/clear

Clear the recommendation cache.

## Trust & Vetting Providers

The system supports pluggable trust and vetting providers:

```typescript
const trustProvider = async (org: NonprofitCandidate) => ({
  trustScore: 92, // 0-100
  vettedStatus: 'verified',
  source: 'charity_navigator'
});

const result = await recommendationOrchestrator.recommendNonprofitsForArticle(
  context,
  { trustProvider, vettingProvider }
);
```

### Default Behavior (No Providers)

When trust/vetting signals are unavailable:
- `trustScore`: `undefined` (tie-breaker skipped)
- `vettedStatus`: `'unknown'` (fallback gating rules applied)
- Debug logs clearly indicate missing signals

### Future Integration

To wire trust/vetting to external providers:

1. **Charity Navigator API**
   ```typescript
   const trustProvider = async (org) => {
     const rating = await charityNavigator.getRating(org.ein);
     return {
       trustScore: rating.score,
       vettedStatus: rating.verified ? 'verified' : 'unverified',
       source: 'charity_navigator'
     };
   };
   ```

2. **Candid/GuideStar**
   ```typescript
   const vettingProvider = async (org) => {
     const profile = await candid.getProfile(org.ein);
     return {
       vettedStatus: profile.sealOfTransparency ? 'verified' : 'unknown',
       source: 'candid'
     };
   };
   ```

3. **Internal Partner List**
   ```typescript
   const vettingProvider = async (org) => {
     const isPartner = await db.partners.exists({ slug: org.slug });
     return {
       vettedStatus: isPartner ? 'verified' : 'unknown',
       source: 'internal'
     };
   };
   ```

## Testing

### Unit Tests

```bash
cd backend
npm test -- recommendations
```

Tests cover:
- Geographic tier ordering (Tier1 > Tier2 > Tier3)
- Cause alignment filtering
- Trust score tiebreaker
- Vetting gate behavior
- Quality scoring
- Diversity rules

### Integration Tests

```bash
cd backend
tsx test-recommendation-engine.ts
```

Tests real-world scenarios:
- Turkey earthquake
- California wildfire
- Bangladesh flood

### Debug Mode

Enable debug mode to see detailed pipeline information:

```typescript
const result = await recommendationOrchestrator.recommendNonprofitsForArticle(
  context,
  { debug: true }
);

console.log(result.debug);
// Shows: search terms, geo tiers, exclusions, trust coverage, timing, etc.
```

## Performance

- **Candidate Generation**: ~500-1000ms (with caching: ~50ms)
- **Reranking**: ~50-100ms
- **Enrichment**: ~200-500ms (parallel fetching)
- **Total**: ~750-1600ms (first request), ~300-650ms (cached)

### Optimization Tips

1. **Enable caching** (default: enabled)
2. **Reduce topN** if you don't need many results
3. **Use Redis** for distributed caching (future enhancement)
4. **Batch requests** when processing multiple articles

## Conflict Resolution

### Every.org API Limitations

The Every.org API has known limitations:
- Search is optimized for typeahead/name lookup (not semantic)
- May not provide trust scores or vetting status
- Geographic data may be incomplete

### Our Solution

1. **Two-stage approach**: Broad candidate generation + local reranking
2. **Pluggable providers**: External trust/vetting signals via interfaces
3. **Transparent fallbacks**: Clear logging when signals unavailable
4. **Quality gates**: Fallback rules for unknown vetting status

### What We DON'T Do

- ❌ Fabricate trust scores when unavailable
- ❌ Claim organizations are vetted without evidence
- ❌ Hide uncertainty from users
- ❌ Trust Every.org ranking alone

### What We DO

- ✅ Apply geo + cause ranking regardless of trust availability
- ✅ Surface "unknown" status in debug mode
- ✅ Provide clear reasoning for each recommendation
- ✅ Document how to add trust/vetting providers

## How Ranking Works

### Example: Turkey Earthquake

**Input:**
- Geography: Turkey
- Disaster: Earthquake
- Causes: disaster-relief

**Pipeline:**

1. **Candidate Generation** (150 candidates)
   - Browse: disaster-relief (50)
   - Search: "earthquake" (50)
   - Search: "Turkey" (50)

2. **Reranking**
   - Tier 1 (Turkey-based): 40 candidates
   - Tier 2 (Regional): 30 candidates
   - Tier 3 (Global): 80 candidates
   - Excluded (no cause match): 20 candidates

3. **Scoring** (Tier 1 example)
   - Turkish Red Crescent:
     - Geo: 100 (Tier 1)
     - Cause: 90 (strong disaster relief)
     - Trust: 95 (if available)
     - Quality: 95 (complete profile)
     - **Total: 95.5**

4. **Final Ranking**
   - All Tier 1 orgs ranked by cause + trust
   - Then Tier 2 orgs
   - Then Tier 3 orgs

## Troubleshooting

### No Recommendations Returned

**Possible causes:**
1. No candidates found (check search terms)
2. All candidates excluded (vetting or cause mismatch)
3. API errors (check logs)

**Solutions:**
- Enable debug mode to see exclusion counts
- Check Every.org API key is valid
- Verify geography/cause data is correct

### Irrelevant Results

**Possible causes:**
1. Geographic data incomplete
2. Cause alignment too loose
3. Quality threshold too low

**Solutions:**
- Improve entity extraction (geography, disaster type)
- Add more specific causes
- Adjust scoring weights in reranker

### Slow Performance

**Possible causes:**
1. Cache disabled or not hitting
2. Too many candidates generated
3. Network latency to Every.org API

**Solutions:**
- Verify caching is enabled
- Reduce search terms or browse causes
- Consider Redis for distributed caching

## Future Enhancements

1. **Redis Integration**: Distributed caching for multi-instance deployments
2. **ML Ranking**: Learn from user interactions to improve ranking
3. **Real-time Trust Scores**: Integration with Charity Navigator, Candid, etc.
4. **Geographic Expansion**: More regional neighbor mappings
5. **Cause Taxonomy**: Richer cause classification system
6. **A/B Testing**: Compare ranking strategies

## Contributing

When modifying the recommendation engine:

1. **Maintain ranking policy**: Geo → Cause → Trust priority
2. **Add tests**: Cover new scenarios and edge cases
3. **Update docs**: Keep this README current
4. **Enable debug mode**: Verify changes with real data
5. **Check performance**: Ensure changes don't degrade speed

## License

MIT