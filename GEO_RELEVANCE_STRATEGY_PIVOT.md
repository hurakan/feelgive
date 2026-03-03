# Geographic Relevance Strategy Pivot

## Critical Realization

**You're 100% correct**: Every.org's location data represents **where the org is registered/headquartered**, NOT **where they provide services**.

### The Problem

For "Nigeria humanitarian" crisis:
- **Crisis location**: Nigeria, West Africa
- **Orgs returned**: All US-based (MA, TX, GA, UT, MN, CT, MI)
- **Why**: These US orgs work on Nigeria-related causes
- **Every.org location**: Shows US headquarters, not service areas

**Example**:
- Org: "Nigerian International Humanitarian Foundation"
- Location: Lynn, MA (headquarters)
- Service Area: Nigeria (not in Every.org data)

### Why Geographic Filtering Won't Work

```
Article: "Nigeria church attack"
  ↓
Search: "Nigeria humanitarian"
  ↓
Results: 10 US-based orgs working in Nigeria
  ↓
Geographic filter: USA ≠ Nigeria → MISMATCH
  ↓
All orgs filtered out ❌
  ↓
No recommendations
```

**The fundamental issue**: We're comparing headquarters location (USA) with crisis location (Nigeria), which will always mismatch for international aid orgs.

---

## Why This Explains the Thailand Bug

**Original Bug**: Nigeria article recommended "Thailand Humanitarian Academic Initiative"

**Root Cause Analysis**:
1. All orgs (including Thailand org) → `country: 'Unknown'` (field name bug)
2. All orgs → `GeoMatchLevel.GLOBAL` (score: 0.3)
3. Geographic filter has nothing to filter
4. Cause filter reduces 120 → 1 org
5. That 1 org could be Thailand org (random)

**But even if we fix the field name**:
1. Thailand org → `location: "BANGKOK, TH"` or similar
2. Parse as Thailand → MISMATCH for Nigeria
3. Nigeria orgs (US-based) → USA → MISMATCH for Nigeria
4. **Both filtered out equally** - no preference for Nigeria-relevant orgs!

---

## The Real Solution: Semantic Geographic Matching

### Concept

Instead of matching **headquarters location**, match **service area** or **operational focus** using:
1. **Organization name** (e.g., "Nigerian International..." → Nigeria)
2. **Description text** (e.g., "works in Nigeria", "serves West Africa")
3. **NTEE codes** (e.g., Q33 = International Development)
4. **Search query matching** (org appeared in "Nigeria humanitarian" search)

### Why This Works

**For Nigeria Crisis**:
- Org: "Nigerian International Humanitarian Foundation"
- Name contains: "Nigerian" → Nigeria
- Description: "focused on providing human services"
- Search query: "Nigeria humanitarian" → matched
- **Semantic relevance**: HIGH ✅

**For Thailand Org**:
- Org: "Thailand Humanitarian Academic Initiative"
- Name contains: "Thailand" → Thailand
- Description: "focused on Thailand education"
- Search query: "Nigeria humanitarian" → shouldn't match
- **Semantic relevance**: LOW ❌

---

## Recommended Approach: Multi-Signal Geographic Relevance

### Signal 1: Organization Name Analysis (40 points)

Extract geographic entities from org name:

```typescript
function extractGeoFromName(orgName: string, targetCountry: string): number {
  const nameLower = orgName.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Exact country match in name
  if (nameLower.includes(targetLower)) {
    return 40;  // "Nigerian International..." for Nigeria
  }
  
  // Demonym match (Nigerian → Nigeria, Thai → Thailand)
  const demonyms = getDemonyms(targetCountry);
  if (demonyms.some(d => nameLower.includes(d))) {
    return 40;  // "Nigerian Foundation" for Nigeria
  }
  
  // Regional match (West Africa, Southeast Asia)
  const regions = getRegions(targetCountry);
  if (regions.some(r => nameLower.includes(r.toLowerCase()))) {
    return 20;  // "West Africa Relief" for Nigeria
  }
  
  return 0;
}
```

### Signal 2: Description Text Analysis (30 points)

Search for geographic mentions in description:

```typescript
function extractGeoFromDescription(description: string, targetCountry: string): number {
  const descLower = description.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Explicit service area mention
  const servicePatterns = [
    `works in ${targetLower}`,
    `serves ${targetLower}`,
    `operates in ${targetLower}`,
    `based in ${targetLower}`,  // Note: could be headquarters
    `${targetLower} communities`,
  ];
  
  if (servicePatterns.some(p => descLower.includes(p))) {
    return 30;
  }
  
  // Country mention anywhere
  if (descLower.includes(targetLower)) {
    return 15;
  }
  
  return 0;
}
```

### Signal 3: Search Query Matching (20 points)

Org appeared in geo-specific search:

```typescript
function getSearchQueryScore(query: string, targetCountry: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Query contained target country
  if (queryLower.includes(targetLower)) {
    return 20;  // Org matched "Nigeria humanitarian" query
  }
  
  return 0;
}
```

### Signal 4: NTEE Code Relevance (10 points)

International development orgs are more likely to work globally:

```typescript
function getNTEEGeoScore(nteeCode: string): number {
  // Q33 = International Development
  if (nteeCode?.startsWith('Q3')) {
    return 10;  // International focus
  }
  
  // P20 = Human Services (could be local or international)
  if (nteeCode?.startsWith('P')) {
    return 5;
  }
  
  return 0;
}
```

### Combined Score (0-100)

```typescript
function computeSemanticGeoRelevance(
  org: NonprofitCandidate,
  targetCountry: string,
  searchQuery: string
): number {
  const nameScore = extractGeoFromName(org.name, targetCountry);
  const descScore = extractGeoFromDescription(org.description, targetCountry);
  const queryScore = getSearchQueryScore(searchQuery, targetCountry);
  const nteeScore = getNTEEGeoScore(org.nteeCode);
  
  return nameScore + descScore + queryScore + nteeScore;
}
```

---

## Example Scoring

### Nigeria Crisis Article

**Org 1: "Nigerian International Humanitarian Foundation"**
- Name: "Nigerian" → 40 points ✅
- Description: "focused on providing human services" → 0 points
- Query: "Nigeria humanitarian" → 20 points ✅
- NTEE: P20 (Human Services) → 5 points
- **Total: 65/100** ✅ HIGH RELEVANCE

**Org 2: "Thailand Humanitarian Academic Initiative"**
- Name: "Thailand" → 0 points (wrong country) ❌
- Description: "focused on Thailand education" → 0 points ❌
- Query: "Nigeria humanitarian" → 0 points (shouldn't match) ❌
- NTEE: E (Education) → 0 points
- **Total: 0/100** ❌ NO RELEVANCE

**Org 3: "International Rescue Committee"** (global org)
- Name: "International" → 0 points (no specific country)
- Description: "works in 40+ countries including Nigeria" → 30 points ✅
- Query: "Nigeria humanitarian" → 20 points ✅
- NTEE: Q33 (International Development) → 10 points ✅
- **Total: 60/100** ✅ MEDIUM-HIGH RELEVANCE

---

## Implementation Strategy

### Phase 1: Semantic Geographic Matching (Immediate)

Replace physical location matching with semantic matching:

```typescript
// OLD APPROACH (doesn't work)
const orgGeo = extractOrgGeo(candidate);  // USA
const geoMatch = computeGeoMatch(orgGeo, targetGeo);  // MISMATCH

// NEW APPROACH (works)
const semanticGeoScore = computeSemanticGeoRelevance(
  candidate,
  targetCountry,
  searchQuery
);
```

**Benefits**:
- ✅ Works for international aid orgs (US-based serving Nigeria)
- ✅ Filters out irrelevant orgs (Thailand org for Nigeria crisis)
- ✅ No API calls needed (uses Search API data)
- ✅ Fast (text analysis only)

### Phase 2: Enhanced with LLM (Optional)

Use Gemini to extract service areas from descriptions:

```typescript
const prompt = `
Extract the geographic service areas from this nonprofit description:
"${org.description}"

Return as JSON: { "countries": ["Nigeria", "Ghana"], "regions": ["West Africa"] }
`;

const serviceAreas = await gemini.extractServiceAreas(prompt);
const match = serviceAreas.countries.includes(targetCountry);
```

**Benefits**:
- ✅ More accurate than regex
- ✅ Handles complex descriptions
- ❌ Slower (LLM call per org)
- ❌ Costs money

### Phase 3: Crowdsourced Service Area Data (Future)

Build a database of org service areas:

```typescript
// User-contributed or scraped data
const serviceAreaDB = {
  'nigerian-international-humanitarian-foundation': {
    countries: ['Nigeria'],
    regions: ['West Africa'],
  },
  'international-rescue-committee': {
    countries: ['Nigeria', 'Syria', 'Afghanistan', /* 40+ more */],
    regions: ['Global'],
  },
};
```

---

## Revised Pipeline Architecture

### Old Pipeline (Doesn't Work)
```
1. Search Every.org → 120 candidates
2. Extract headquarters location → USA, Thailand, etc.
3. Compare with crisis location → MISMATCH for all
4. Filter by geography → All filtered out ❌
5. No recommendations
```

### New Pipeline (Works)
```
1. Search Every.org → 120 candidates
2. Compute semantic geo relevance → 0-100 score per org
3. Filter by semantic geo score → Keep orgs with score > 30
4. Compute cause relevance → 0-100 score per org
5. Filter by cause score → Keep orgs with score > 40
6. Rank by combined score → geo 45% + cause 40% + trust 15%
7. Return top N
```

---

## Addressing the Thailand Bug

### Root Cause (Revised Understanding)

The Thailand bug happened because:
1. ❌ We weren't parsing location field (field name bug)
2. ❌ All orgs classified as GLOBAL (no geographic signal)
3. ❌ Cause filtering alone insufficient (Thailand org might have "humanitarian" tag)
4. ❌ Random org selected from remaining candidates

### The Fix

With semantic geographic matching:
1. ✅ Nigeria orgs: Name contains "Nigeria" → 40+ points
2. ✅ Thailand org: Name contains "Thailand" → 0 points for Nigeria crisis
3. ✅ Semantic geo filter: Thailand org filtered out
4. ✅ Only Nigeria-relevant orgs remain

---

## Comparison: Physical vs Semantic Matching

| Aspect | Physical Location | Semantic Matching |
|--------|-------------------|-------------------|
| **Data Source** | Every.org `location` field | Org name + description + query |
| **Represents** | Headquarters address | Service area / operational focus |
| **For US-based Nigeria org** | USA (MISMATCH) ❌ | Nigeria (MATCH) ✅ |
| **For Thailand org** | Thailand (MISMATCH) ✅ | Thailand (MISMATCH) ✅ |
| **For global org (IRC)** | USA (MISMATCH) ❌ | Multiple countries (MATCH) ✅ |
| **Accuracy** | Low (wrong signal) | High (right signal) |
| **API calls needed** | 0 | 0 |
| **Speed** | Fast | Fast |

---

## Recommendations

### Immediate Action (Today)

1. **Remove physical location matching** - It's measuring the wrong thing
2. **Implement semantic geographic matching** - Use name + description + query
3. **Set threshold at 30/100** - Orgs must score 30+ to be considered relevant
4. **Test with Nigeria query** - Verify Thailand org filtered out

### Short Term (This Week)

1. **Build demonym dictionary** - Nigerian → Nigeria, Thai → Thailand, etc.
2. **Add regional matching** - West Africa → Nigeria, Southeast Asia → Thailand
3. **Enhance description parsing** - Better regex patterns for service areas
4. **Add NTEE code weighting** - Q33 (International Dev) gets bonus points

### Long Term (Future)

1. **LLM-based service area extraction** - More accurate than regex
2. **Crowdsource service area data** - Build database of org service areas
3. **User feedback loop** - "Was this org relevant?" → improve scoring
4. **A/B testing** - Compare semantic vs physical matching accuracy

---

## Expected Impact

### Before (Physical Location Matching)
```
Nigeria crisis → Search "Nigeria humanitarian"
  ↓
10 US-based orgs working in Nigeria
  ↓
Geographic filter: USA ≠ Nigeria → All filtered out
  ↓
Fallback to GLOBAL orgs
  ↓
Thailand org passes (also GLOBAL)
  ↓
Nigeria → Thailand bug ❌
```

### After (Semantic Matching)
```
Nigeria crisis → Search "Nigeria humanitarian"
  ↓
10 US-based orgs working in Nigeria
  ↓
Semantic geo score:
  - Nigerian Foundation: 65/100 ✅
  - Nigeria Gives: 60/100 ✅
  - Thailand org: 0/100 ❌
  ↓
Filter: Keep score > 30
  ↓
8 Nigeria-relevant orgs remain
  ↓
Rank by cause + trust
  ↓
Top 5 recommendations ✅
```

---

## Conclusion

**You're absolutely right** - Every.org's location data won't help us because it shows headquarters, not service areas.

**The solution**: Semantic geographic matching using org name, description, and search query context. This measures **operational focus** rather than **physical location**, which is what we actually care about.

**Next step**: Implement semantic matching and test with Nigeria query to verify Thailand bug is fixed.

Ready to proceed with implementation?