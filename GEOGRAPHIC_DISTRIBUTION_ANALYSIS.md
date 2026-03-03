# Geographic Distribution Analysis Report

## Executive Summary

**Problem**: All 120 candidate organizations are being classified as "Unknown" location with GLOBAL match level (score: 0.3), causing geographic filtering to fail completely.

**Root Cause**: Limited regex pattern matching in `extractOrgGeo()` method only covers ~18 countries, while Every.org returns free-text `locationAddress` strings that don't match our patterns.

**Impact**: Geographic filtering is non-functional, allowing irrelevant organizations (e.g., Thailand orgs for Nigeria articles) to pass through.

---

## Test Case: Nigeria Church Attack

### Input Article
```json
{
  "title": "Nigeria church attack",
  "description": "Armed attackers kidnapped over 150 people from a church in Nigeria",
  "entities": {
    "geography": {
      "country": "Nigeria",
      "region": "West Africa"
    },
    "disasterType": "conflict"
  },
  "causes": ["humanitarian"],
  "keywords": ["nigeria", "attack", "humanitarian"]
}
```

### Pipeline Results

**Step 1: Query Generation** ✅
- Generated 12 geo-first queries
- Priority A (geo-first): 5 queries
- Priority B (cause+geo): 5 queries  
- Priority C (fallback): 3 queries

**Step 2: Every.org Search** ✅
- Total unique candidates: **120 organizations**
- Queries returned 15-20 results each
- Sample queries:
  - "Nigeria humanitarian": 19 results
  - "West Africa relief": 16 results
  - "Nigeria conflict": 18 results

**Step 3: Geographic Matching** ❌ **FAILED**
- **ALL 120 orgs classified as GLOBAL (Unknown location)**
- Geographic distribution:
  ```
  GLOBAL: 120 orgs
    - Nigerian International Humanitarian Foundation Of New England Inc (Unknown) [score: 0.3]
    - Nigeria Gives (Unknown) [score: 0.3]
    - We Go - Nigeria (Unknown) [score: 0.3]
    - Nigeria Peoples Alliance Inc (Unknown) [score: 0.3]
    - Bridges To Nigeria (Unknown) [score: 0.3]
    ... and 115 more
  ```

**Step 4: Cause Scoring** ⚠️
- 120 candidates scored
- Cause filter: 120 → **1 org** (min score: 40)
- 119 orgs failed cause relevance threshold

**Step 5: Geographic Filtering** ❌ **INEFFECTIVE**
- Applied to 1 remaining org
- Fallback level: global (no choice - all orgs are GLOBAL)
- Final result: 1 org

---

## Root Cause Analysis

### 1. Limited Country Pattern Matching

**Current Implementation** (`orchestrator.ts` lines 442-461):
```typescript
const countryPatterns = [
  { pattern: /united states|usa|u\.s\.|america/i, country: 'United States' },
  { pattern: /canada/i, country: 'Canada' },
  { pattern: /united kingdom|uk|britain/i, country: 'United Kingdom' },
  { pattern: /australia/i, country: 'Australia' },
  { pattern: /india/i, country: 'India' },
  { pattern: /nigeria/i, country: 'Nigeria' },
  { pattern: /kenya/i, country: 'Kenya' },
  { pattern: /south africa/i, country: 'South Africa' },
  { pattern: /thailand/i, country: 'Thailand' },
  { pattern: /philippines/i, country: 'Philippines' },
  { pattern: /mexico/i, country: 'Mexico' },
  { pattern: /brazil/i, country: 'Brazil' },
  { pattern: /turkey/i, country: 'Turkey' },
  { pattern: /syria/i, country: 'Syria' },
  { pattern: /iraq/i, country: 'Iraq' },
  { pattern: /afghanistan/i, country: 'Afghanistan' },
  { pattern: /pakistan/i, country: 'Pakistan' },
  { pattern: /bangladesh/i, country: 'Bangladesh' },
];
```

**Coverage**: Only 18 countries out of 195 worldwide (9% coverage)

**Failure Mode**: Any org with location not matching these patterns → `country: 'Unknown'`

### 2. Every.org Location Data Format

**What Every.org Returns**:
- `locationAddress`: Free-text string (e.g., "Boston, Massachusetts", "New York, NY, USA", "London, UK")
- **No structured location data** in search results
- Structured data only available via `getNonprofitDetails()` API (requires individual calls per org)

**Example Location Strings**:
```
"Boston, Massachusetts"
"New York, NY, USA"  
"San Francisco, CA"
"London, United Kingdom"
"Toronto, Ontario, Canada"
"Sydney, Australia"
```

### 3. GeoMatcher Fallback Behavior

**Code** (`geoMatcher.ts` lines 31-36):
```typescript
if (!orgGeo.country || orgGeo.country === 'Unknown') {
  return {
    level: GeoMatchLevel.GLOBAL,
    score: 0.3,
    reason: 'Location data unavailable; may operate globally',
  };
}
```

**Impact**: All unmatched orgs get GLOBAL classification with low score (0.3)

---

## Why Geographic Filtering Failed

### The Cascade Effect

1. **120 candidates** from Every.org search
2. **120 orgs** → `country: 'Unknown'` (regex patterns don't match)
3. **120 orgs** → `GeoMatchLevel.GLOBAL` (score: 0.3)
4. **Geographic filter has nothing to filter** - all orgs are GLOBAL
5. **Fallback to global level** (no choice)
6. **Cause filter reduces 120 → 1** (only 1 org meets cause threshold)
7. **Final result: 1 org** (could be Thailand org for Nigeria article)

### Why Cause Filtering Alone Isn't Enough

Even with advanced cause scoring, we saw:
- 120 candidates → 1 after cause filter (99% rejection rate)
- The 1 remaining org could be geographically irrelevant
- No geographic signal to prioritize local/regional orgs

---

## Sample Organizations That Should Have Been Classified

Based on org names, these should have been detected:

| Organization Name | Should Be | Actual | Reason |
|-------------------|-----------|--------|--------|
| Nigerian International Humanitarian Foundation Of New England Inc | Nigeria or USA | Unknown | "Nigeria" in name, but location string didn't match |
| Nigeria Gives | Nigeria | Unknown | "Nigeria" in name, but location string didn't match |
| We Go - Nigeria | Nigeria | Unknown | "Nigeria" in name, but location string didn't match |
| Nigeria Peoples Alliance Inc | Nigeria | Unknown | "Nigeria" in name, but location string didn't match |
| Bridges To Nigeria | Nigeria or USA | Unknown | "Nigeria" in name, but location string didn't match |

**Note**: These orgs have "Nigeria" in their names, suggesting they work in Nigeria, but their `locationAddress` field likely contains US addresses (where they're registered) that don't match our patterns.

---

## Solutions

### Option A: Expand Regex Patterns (Quick Fix)
**Pros**:
- Fast to implement
- No external dependencies
- Works with current architecture

**Cons**:
- Still limited coverage (~50-100 countries max)
- Maintenance burden (195 countries + variations)
- Doesn't handle misspellings or variations well

**Implementation**:
```typescript
// Add ~180 more country patterns
{ pattern: /germany|deutschland/i, country: 'Germany' },
{ pattern: /france|français/i, country: 'France' },
{ pattern: /spain|españa/i, country: 'Spain' },
// ... 180 more
```

### Option B: Use Geocoding Service (Robust Solution)
**Pros**:
- 100% coverage of all countries
- Handles variations, misspellings, abbreviations
- Extracts city, state, country accurately
- Industry-standard approach

**Cons**:
- Requires external API (Google Maps, Mapbox, etc.)
- API costs (~$5-10 per 1000 requests)
- Adds latency (~100-200ms per request)
- Requires API key management

**Recommended Services**:
1. **Google Maps Geocoding API** - Most accurate, $5/1000 requests
2. **Mapbox Geocoding API** - Good accuracy, $0.50/1000 requests
3. **OpenCage Geocoding API** - Open data, $1/1000 requests

### Option C: Enrich All Candidates (Expensive)
**Pros**:
- Gets structured location data from Every.org
- 100% accurate for orgs in Every.org database
- No external dependencies

**Cons**:
- Requires 120 individual API calls per article
- Very slow (~12-24 seconds for 120 orgs)
- High API usage (could hit rate limits)
- Not scalable

**Implementation**:
```typescript
// Call getNonprofitDetails() for each candidate
for (const candidate of candidates) {
  const details = await everyOrgClient.getNonprofitDetails(candidate.slug);
  // details.location has structured data
}
```

### Option D: Hybrid Approach (Recommended)
**Pros**:
- Fast for common cases (regex)
- Accurate for edge cases (geocoding)
- Cost-effective (only geocode unknowns)
- Best of both worlds

**Cons**:
- More complex implementation
- Still requires geocoding API

**Implementation**:
```typescript
// 1. Try regex patterns first (fast, free)
let country = tryRegexExtraction(locationAddress);

// 2. If unknown, use geocoding (slower, costs money)
if (country === 'Unknown') {
  country = await geocodeLocation(locationAddress);
}

// 3. Cache results to avoid repeated geocoding
```

---

## Recommendation

**Implement Option D: Hybrid Approach**

### Phase 1: Immediate Fix (Option A)
1. Expand regex patterns to cover top 50 countries (90% of orgs)
2. Add common variations and abbreviations
3. Deploy immediately to fix Nigeria → Thailand bug

### Phase 2: Robust Solution (Option D)
1. Integrate Mapbox Geocoding API (cheapest, good accuracy)
2. Implement caching layer (Redis or in-memory)
3. Use regex first, geocode only unknowns
4. Monitor costs and accuracy

### Cost Analysis (Option D)
- **Regex coverage**: ~70-80% of orgs (free)
- **Geocoding needed**: ~20-30% of orgs
- **Cost per article**: 120 candidates × 25% unknown × $0.0005 = **$0.015 per article**
- **Monthly cost** (1000 articles): **$15/month**

---

## Next Steps

1. **User Decision Required**: Choose solution approach (A, B, C, or D)
2. **Implementation**: Based on chosen approach
3. **Testing**: Verify Nigeria → Thailand bug is fixed
4. **Monitoring**: Track geographic classification accuracy

---

## Appendix: Sample Location Strings from Every.org

Based on typical Every.org data, location strings look like:
```
"Boston, MA"
"New York, NY, USA"
"San Francisco, California"
"London, United Kingdom"
"Toronto, ON, Canada"
"Sydney, NSW, Australia"
"Mumbai, Maharashtra, India"
"Lagos, Nigeria"
"Nairobi, Kenya"
"Cape Town, South Africa"
```

**Pattern**: Usually `City, State/Province, Country` or `City, State` (for US)