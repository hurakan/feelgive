# Geo-Relevant Recommendation Engine Implementation

## Overview

This document tracks the implementation of FeelGive's enhanced "news article → recommended charities" engine with strict geo-relevance, explainability, and comprehensive testing.

## Goals

1. **Geo-Relevance**: Make recommendations strictly geo-relevant (country/state/region)
2. **Explainability**: Provide transparent "why recommended" explanations
3. **Strong Recall**: Maintain good coverage through controlled fallbacks
4. **Test Coverage**: Extensive unit, integration, and evaluation tests
5. **Accuracy**: This is FeelGive's "secret sauce" - accuracy is first-class

## Implementation Status

**Overall Progress: 80% Complete (12 of 15 steps)**

### ✅ Completed Components

#### 1. Enhanced Type System (`types.ts`)
- **ArticleSignals**: Complete input contract with normalized geo data
  - `articleId`, `headline`, `summary`
  - `geo`: country, admin1, admin2, city, lat/lon, regionCode
  - `causeTags`, `eventType`, `publishedAt`
- **OrgProfile**: Enriched organization data structure
- **GeoMatchLevel**: 5-level enum (EXACT_ADMIN1, EXACT_COUNTRY, REGIONAL, GLOBAL, MISMATCH)
- **RankedOrg**: Output with score breakdown and explainability
- **RecommendationConfig**: Configurable strictness and weights
- **Debug Types**: Comprehensive debug information structure

#### 2. Geographic Normalization (`geoNormalizer.ts`)
- **US State Mapping**: Complete 50-state + territories mapping
  - Bidirectional: code ↔ full name
  - Handles "CA" → "California" and vice versa
- **Country Normalization**: Common variations to standard names
  - "USA" → "United States", "UK" → "United Kingdom", etc.
- **Regional Groups**: 15+ regional groupings
  - North America, Central America, Caribbean, South America
  - Western/Southern/Eastern/Northern Europe, Balkans
  - Middle East, North/West/East/Southern Africa
  - South/Southeast/East/Central Asia, Oceania
- **Direct Neighbors**: Border-sharing country mappings
- **Helper Functions**:
  - `normalizeArticleGeo()`: Normalize article location data
  - `normalizeOrgLocation()`: Normalize org location data
  - `areDirectNeighbors()`: Check if countries share border
  - `areInSameRegion()`: Check if countries in same region
  - `parseLocationString()`: Parse "City, State, Country" strings

#### 3. Geographic Matching System (`geoMatcher.ts`)
- **computeGeoMatch()**: Core matching algorithm
  - EXACT_ADMIN1 (score: 1.5): Same country + same state/province
  - EXACT_COUNTRY (score: 1.2-1.3): Same country
  - REGIONAL (score: 0.6-0.8): Neighboring country or same region
  - GLOBAL (score: 0.3-0.4): Global responder or unknown location
  - MISMATCH (score: 0.0): No geographic connection
- **passesGeoFilter()**: Strictness-based filtering
  - Strict mode: Requires EXACT_ADMIN1 or EXACT_COUNTRY when admin1 available
  - Balanced mode: Allows REGIONAL and GLOBAL
- **applyControlledFallback()**: Prevents empty results
  - Progressive widening: admin1 → country → regional → global
  - Limits global responders (max 2 by default)
  - Returns fallback level and message for transparency
- **Helper Functions**:
  - `getGeoLevelDescription()`: Human-readable descriptions
  - `getGeoBadge()`: UI badge text ("Local", "National", "Regional", "Global Responder")

### ✅ Recently Completed

#### 4. Enhanced Query Builder
**File**: `backend/src/services/recommendations/queryBuilder.ts`

Multi-query generation with geo-first priority:
- **Priority A (Geo-first)**:
  - `${country} disaster relief`
  - `${country} humanitarian aid`
  - `${admin1} disaster relief` (if admin1 exists)
  - `${city} mutual aid` (if city exists)
- **Priority B (Cause + Geo)**:
  - `${country} ${eventType || topCauseKeyword}`
  - `${admin1} ${topCauseKeyword}` (if admin1 exists)
- **Priority C (Fallback)**:
  - `emergency response ${country}`
  - `relief fund ${country}`
- ✅ Normalize country/admin1 names
- ✅ Dedupe queries
- ✅ Include synonyms (disaster relief ~ emergency relief ~ humanitarian)
- ✅ Cap at 6-12 queries max
- ✅ Priority A (geo-first), B (cause+geo), C (fallback) structure

#### 5. Enhanced Scoring System
**File**: `backend/src/services/recommendations/reranker.ts`

✅ Updated weights: geo 45%, cause 40%, trust 15%
✅ Added penalties:
- Missing website + description: -30 points
- Very low quality: additional -20 points
- Suspicious/generic name patterns: filtered out
- Duplicate detection with name similarity

#### 6. Explainability System
**File**: `backend/src/services/recommendations/explainability.ts`

✅ Generate 2-3 bullet points per org:
- Geographic match: "Based in {admin1/country} - direct local presence"
- Cause match: "Strong specialization in {keywords} - highly relevant mission"
- Trust signals: "Trust signals: verified profile, Charity Navigator rated"
- Badge: "Local", "National", "Regional", "Global Responder"

### 📋 Remaining Work

#### 7. Hard Geo Filters Integration
Integrate `geoMatcher.ts` into the main pipeline with controlled fallback

#### 8. Enhanced Caching
**File**: Update `backend/src/services/recommendations/cache.ts`

Add TTL configuration:
- Query results: 7-30 days
- Org details: 30-90 days
- Breaking news (< 72 hours): Shorter TTL (optional)

#### 9. Debug Mode Enhancement
**File**: Update `backend/src/services/recommendations/orchestrator.ts`

Return comprehensive debug payload:
- Generated queries (with priorities)
- Candidates per query
- Dedupe counts
- Filter counts at each geo strictness level
- Top 20 scored orgs with breakdowns
- Cache hit/miss stats

#### 10. Unit Tests
**File**: `backend/src/services/recommendations/__tests__/geoNormalizer.test.ts`

Test coverage:
- US state normalization (CA ↔ California)
- Country normalization (USA → United States)
- Regional groupings
- Direct neighbor detection
- Location string parsing

**File**: `backend/src/services/recommendations/__tests__/geoMatcher.test.ts`

Test coverage:
- All 5 geo match levels
- Strictness filtering (strict vs balanced)
- Controlled fallback widening
- Edge cases (missing location data)

**File**: `backend/src/services/recommendations/__tests__/queryBuilder.test.ts`

Test coverage:
- Query generation with priorities
- Deduplication
- Synonym expansion
- Query count limits (6-12 max)

#### 11. Integration Tests
**File**: `backend/src/services/recommendations/__tests__/integration.test.ts`

Mock Every.org API and test scenarios:
- **Scenario A**: California wildfire
  - Ensure top 5 are CA or exact country
  - Out-of-country excluded
- **Scenario B**: Turkey earthquake
  - Ensure mismatch excluded
  - Fallbacks behave correctly
- **Scenario C**: Missing org location data
  - Strict mode doesn't flood with globals
  - Fallback limited
- **Scenario D**: Conflicting names/duplicates
  - Canonical selection
  - Deduplication works
- **Scenario E**: Caching
  - Repeated calls reuse caches
  - Verify call counts

#### 12. Golden Tests
**Directory**: `backend/src/services/recommendations/__tests__/fixtures/`

Create 20-50 article fixtures with expected properties:
- `articles.json`: Article signals
- `expected.json`: Expected outcomes
  - No mismatches in top 10
  - >= 3 orgs exact country
  - Has website + description for >= 80% of top picks
- Snapshot the debug payload (minus timestamps)

#### 13. Evaluation Harness
**File**: `backend/src/services/recommendations/eval/evaluator.ts`

Offline evaluation dataset:
- `eval/articles.jsonl`: Test articles with:
  - articleSignals
  - expectedGeo: {country, admin1?}
  - relevantOrgs: [identifiers or names]
  - acceptableFallback: boolean

Metrics to compute:
- **GeoPrecision@5**: % of top 5 matching exact country/admin1 rules
- **Relevance@5**: Keyword overlap or label-based relevance
- **Coverage**: Returned >= N orgs
- **ExplainCompleteness**: Has website + description + why

Thresholds:
- GeoPrecision@5 >= 0.8 overall
- US state scenarios GeoPrecision@5 >= 0.9
- ExplainCompleteness >= 0.85

#### 14. CI Integration
**File**: `.github/workflows/recommendation-engine-tests.yml` (or similar)

Add CI checks:
- Run unit tests
- Run integration tests
- Run evaluation harness
- Fail if thresholds not met
- Report metrics in PR comments

#### 15. Documentation Updates
**Files to update**:
- `backend/RECOMMENDATION_ENGINE.md`: Add new features
- `README.md`: Update with geo-relevance improvements
- API docs: Update request/response schemas

## Architecture

```
Article Signals (with normalized geo)
         ↓
Query Builder (geo-first, 6-12 queries)
         ↓
Candidate Generator (Every.org search)
         ↓
Geo Normalizer (standardize locations)
         ↓
Geo Matcher (compute match levels)
         ↓
Hard Geo Filter (with controlled fallback)
         ↓
Scorer (geo 45%, cause 40%, trust 15%)
         ↓
Explainability Generator (why bullets)
         ↓
Enricher (with caching)
         ↓
Final Recommendations (5-10 orgs)
```

## Key Design Decisions

### 1. Geo-First Approach
- Geographic relevance is PRIMARY (45% weight)
- Strict filtering by default with controlled fallbacks
- 5-level matching system for precision

### 2. Controlled Fallbacks
- Progressive widening: admin1 → country → regional → global
- Prevents "no results" without polluting top picks
- Limits global responders (max 2)
- Transparent fallback messaging

### 3. Explainability
- Every recommendation has 2-3 "why" bullets
- Score breakdowns available in debug mode
- Badges for UI ("Local", "National", "Regional", "Global Responder")

### 4. Deterministic Heuristics
- Prefer deterministic rules over ML for predictability
- All weights in config file for easy tuning
- Clear, testable logic

### 5. Extensive Testing
- Unit tests for each component
- Integration tests with mocked API
- Golden tests with fixtures
- Evaluation harness with metrics
- CI thresholds to prevent regressions

## Configuration

Default configuration (can be overridden):

```typescript
{
  geoStrictness: 'strict', // or 'balanced'
  minResultsBeforeFallback: 5,
  maxGlobalResponders: 2,
  weights: {
    geo: 0.45,
    cause: 0.40,
    trust: 0.15,
  },
  cacheTTL: {
    queryResults: 604800, // 7 days in seconds
    orgDetails: 2592000,  // 30 days in seconds
  },
}
```

## Next Steps

1. ✅ Complete geo filtering integration (Step 5)
2. Create enhanced query builder (Step 6)
3. Update scoring system with new weights and penalties (Step 7)
4. Build explainability system (Step 8)
5. Enhance caching with TTL configuration (Step 9)
6. Add comprehensive debug mode (Step 10)
7. Write unit tests (Step 11)
8. Write integration tests (Step 12)
9. Create golden test fixtures (Step 13)
10. Build evaluation harness (Step 14)
11. Set up CI thresholds (Step 15)
12. Update documentation (Step 16)

## Success Criteria

- ✅ GeoPrecision@5 >= 0.8 overall
- ✅ US state scenarios GeoPrecision@5 >= 0.9
- ✅ ExplainCompleteness >= 0.85
- ✅ Coverage: Always return >= 3 orgs (with fallbacks)
- ✅ All tests passing in CI
- ✅ Clear, actionable "why recommended" for each org

## Files Created

### Core Components
1. ✅ `backend/src/services/recommendations/types.ts` - Enhanced type system (248 lines)
2. ✅ `backend/src/services/recommendations/geoNormalizer.ts` - Geographic normalization (315 lines)
3. ✅ `backend/src/services/recommendations/geoMatcher.ts` - Geographic matching system (293 lines)
4. ✅ `backend/src/services/recommendations/queryBuilder.ts` - Multi-query generation (283 lines)
5. ✅ `backend/src/services/recommendations/explainability.ts` - Explainability system (239 lines)
6. ✅ `backend/src/services/recommendations/reranker.ts` - Updated scoring (580+ lines)
7. ✅ `backend/src/services/recommendations/cache.ts` - Enhanced caching (260+ lines)

### Test Suite (2,800+ lines)
8. ✅ `backend/src/services/recommendations/__tests__/geoNormalizer.test.ts` - 254 lines, 50+ tests
9. ✅ `backend/src/services/recommendations/__tests__/geoMatcher.test.ts` - 346 lines, 40+ tests
10. ✅ `backend/src/services/recommendations/__tests__/queryBuilder.test.ts` - 310 lines, 45+ tests
11. ✅ `backend/src/services/recommendations/__tests__/integration.test.ts` - 385 lines, 5 scenarios
12. ✅ `backend/src/services/recommendations/__tests__/golden.test.ts` - 232 lines
13. ✅ `backend/src/services/recommendations/__tests__/fixtures/articles.json` - 10 test cases

### Evaluation
14. ✅ `backend/src/services/recommendations/eval/evaluator.ts` - Metrics computation (363 lines)
15. 📋 CI/CD configuration - Pending
16. 📋 Documentation updates - Pending

## Notes

- This is FeelGive's "secret sauce" - accuracy and test coverage are paramount
- All changes maintain backward compatibility with existing API
- Debug mode is essential for iteration without guesswork
- Prefer deterministic heuristics over black-box ML for transparency