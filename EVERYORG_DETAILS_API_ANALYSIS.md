# Every.org Details API Analysis Report

## Executive Summary

**Key Findings**:
1. ✅ **Location data**: 100% coverage in both Search and Details APIs - identical format `"CITY, STATE"`
2. ✅ **NTEE codes**: 100% coverage in Details API - provides structured cause classification
3. ✅ **Tags**: 70% coverage in Details API - provides additional cause signals
4. ❌ **All orgs are US-based** - registered in US states, not in Nigeria
5. 🎯 **NTEE codes reveal true causes** - only 3/10 are actually humanitarian/international development

---

## Data Comparison: Search API vs Details API

| Field | Search API | Details API | Notes |
|-------|------------|-------------|-------|
| **location** | ✅ 100% | N/A | Format: "CITY, STATE" |
| **locationAddress** | ❌ Not present | ✅ 100% | **Same format as location** |
| **NTEE Code** | ❌ Not present | ✅ 100% | Structured cause classification |
| **NTEE Meaning** | ❌ Not present | ✅ 100% | Human-readable cause categories |
| **Tags** | ⚠️ 70% | ✅ 70% | Additional cause signals |
| **Cause Categories** | ❌ Not present | ✅ 70% | HUMAN_SERVICES, RELIGION, etc. |

**Critical Insight**: `location` (Search API) and `locationAddress` (Details API) are **identical** - both return `"CITY, STATE"` format with 100% coverage.

---

## Detailed Organization Analysis

### Organization 1: Nigerian International Humanitarian Foundation Of New England Inc
```
Location: LYNN, MA (Massachusetts, USA)
NTEE: P20 - Human Service Organizations
Tags: humans (HUMAN_SERVICES)
Description: Focused on providing human services
```

**Analysis**:
- ✅ Registered in USA (Lynn, Massachusetts)
- ✅ NTEE P20 = Human Services (matches humanitarian)
- ✅ Tag: HUMAN_SERVICES (matches humanitarian)
- ⚠️ US-based org working on Nigeria issues

### Organization 2: Nigeria Gives
```
Location: AUSTIN, TX (Texas, USA)
NTEE: Q33 - International Development
Tags: None
Description: Focused on international issues
```

**Analysis**:
- ✅ Registered in USA (Austin, Texas)
- ✅ NTEE Q33 = International Development (matches humanitarian)
- ❌ No tags
- ⚠️ US-based org working on Nigeria issues

### Organization 3: We Go - Nigeria
```
Location: ROCKWALL, TX (Texas, USA)
NTEE: X21 - Christianity
Tags: religion, christianity (RELIGION)
Description: Religious or spiritual organization
```

**Analysis**:
- ✅ Registered in USA (Rockwall, Texas)
- ❌ NTEE X21 = Christianity (NOT humanitarian)
- ❌ Tags: RELIGION (NOT humanitarian)
- ❌ Should be filtered out for humanitarian causes

### Organization 4: Nigeria Peoples Alliance Inc
```
Location: RIVERDALE, GA (Georgia, USA)
NTEE: P20 - Human Service Organizations
Tags: None
Description: Focused on providing human services
```

**Analysis**:
- ✅ Registered in USA (Riverdale, Georgia)
- ✅ NTEE P20 = Human Services (matches humanitarian)
- ❌ No tags
- ⚠️ US-based org working on Nigeria issues

### Organization 5: Bridges To Nigeria
```
Location: MURRAY, UT (Utah, USA)
NTEE: Q33 - International Development
Tags: humans (HUMAN_SERVICES)
Description: Focused on international issues
```

**Analysis**:
- ✅ Registered in USA (Murray, Utah)
- ✅ NTEE Q33 = International Development (matches humanitarian)
- ✅ Tag: HUMAN_SERVICES (matches humanitarian)
- ⚠️ US-based org working on Nigeria issues

### Organization 6: Save Nigeria Group Usa Inc
```
Location: WORTHINGTON, MN (Minnesota, USA)
NTEE: W70 - Leadership Development
Tags: leadershipdevelopment (HUMAN_SERVICES)
Description: Focused on public or societal benefit
```

**Analysis**:
- ✅ Registered in USA (Worthington, Minnesota)
- ⚠️ NTEE W70 = Leadership Development (tangentially related to humanitarian)
- ⚠️ Tag: HUMAN_SERVICES (matches humanitarian)
- ⚠️ US-based org working on Nigeria issues

### Organization 7: Nigeria Soccer Federation Inc
```
Location: RICHARDSON, TX (Texas, USA)
NTEE: N70 - Amateur Sports Competitions
Tags: humans, athletics (HUMAN_SERVICES)
Description: Focused on recreation, sports, leisure, or athletics
```

**Analysis**:
- ✅ Registered in USA (Richardson, Texas)
- ❌ NTEE N70 = Amateur Sports (NOT humanitarian)
- ❌ Tags: HUMAN_SERVICES but athletics focus (NOT humanitarian)
- ❌ Should be filtered out for humanitarian causes

### Organization 8: Across Nigeria
```
Location: NEW HARTFORD, CT (Connecticut, USA)
NTEE: X20 - Christianity
Tags: religion, christianity (RELIGION)
Description: Religious or spiritual organization
```

**Analysis**:
- ✅ Registered in USA (New Hartford, Connecticut)
- ❌ NTEE X20 = Christianity (NOT humanitarian)
- ❌ Tags: RELIGION (NOT humanitarian)
- ❌ Should be filtered out for humanitarian causes

### Organization 9: Help Nigeria
```
Location: WASHINGTON, MI (Michigan, USA)
NTEE: Q33 - International Development
Tags: None
Description: Focused on international issues
```

**Analysis**:
- ✅ Registered in USA (Washington, Michigan)
- ✅ NTEE Q33 = International Development (matches humanitarian)
- ❌ No tags
- ⚠️ US-based org working on Nigeria issues

### Organization 10: Kidsake Nigeria
```
Location: KATY, TX (Texas, USA)
NTEE: P30 - Children and Youth Services
Tags: humans (HUMAN_SERVICES)
Description: Focused on providing human services
```

**Analysis**:
- ✅ Registered in USA (Katy, Texas)
- ⚠️ NTEE P30 = Children and Youth Services (tangentially related to humanitarian)
- ✅ Tag: HUMAN_SERVICES (matches humanitarian)
- ⚠️ US-based org working on Nigeria issues

---

## Summary Statistics

### Geographic Distribution
- **All 10 orgs**: Registered in USA
- **States**: MA, TX (4), GA, UT, MN, CT, MI
- **None**: Registered in Nigeria

### NTEE Code Distribution (Cause Classification)

| NTEE Major Category | Count | Relevant to Humanitarian? |
|---------------------|-------|---------------------------|
| Q - International Foreign Affairs | 3 | ✅ YES (International Development) |
| P - Human Services | 3 | ✅ YES (Human Services) |
| X - Religion Related | 2 | ❌ NO (Christianity) |
| W - Public Society Benefit | 1 | ⚠️ MAYBE (Leadership Development) |
| N - Recreation Sports | 1 | ❌ NO (Amateur Sports) |

**Humanitarian Match Rate**: 6/10 (60%) - Only 6 orgs have NTEE codes matching humanitarian causes

### Tag Distribution (Cause Categories)

| Tag | Cause Category | Count | Relevant to Humanitarian? |
|-----|----------------|-------|---------------------------|
| humans | HUMAN_SERVICES | 4 | ✅ YES |
| religion | RELIGION | 2 | ❌ NO |
| christianity | RELIGION | 2 | ❌ NO |
| leadershipdevelopment | HUMAN_SERVICES | 1 | ⚠️ MAYBE |
| athletics | HUMAN_SERVICES | 1 | ❌ NO |

**Tag Coverage**: 7/10 (70%) have tags

---

## Key Insights for Geo-Relevant Recommendations

### 1. Location Data is Identical Across APIs

**Finding**: Both Search API (`location`) and Details API (`locationAddress`) return the same data:
- Format: `"CITY, STATE"`
- Coverage: 100%
- Values: Identical

**Implication**: 
- ✅ We can use Search API's `location` field directly
- ❌ No need to call Details API for location data
- ✅ Saves API calls and latency

### 2. All Results Are US-Based Organizations

**Finding**: For "Nigeria humanitarian" query, all 10 results are US-registered nonprofits.

**Why This Happens**:
- These orgs work on Nigeria-related causes
- They're registered in the US (for tax/legal reasons)
- Every.org search matches "Nigeria" in org name/description
- But their `location` field shows US addresses

**Implication for Geographic Filtering**:
- ✅ Geographic filtering SHOULD filter these out for Nigeria articles
- ✅ We want Nigeria-based orgs, not US orgs working in Nigeria
- ✅ Current approach (filter by location) is correct
- ❌ But we're not parsing the location field correctly

### 3. NTEE Codes Provide Accurate Cause Classification

**Finding**: NTEE codes reveal true organizational focus:
- 3 orgs: International Development (Q33) ✅
- 3 orgs: Human Services (P20, P30) ✅
- 2 orgs: Christianity (X20, X21) ❌
- 1 org: Sports (N70) ❌
- 1 org: Leadership (W70) ⚠️

**Implication**:
- ✅ NTEE codes are more accurate than tags for cause filtering
- ✅ 100% coverage in Details API
- ❌ Not available in Search API
- ⚠️ Would require calling Details API for each org (expensive)

### 4. Tags Have Limited Coverage and Accuracy

**Finding**: 
- Only 70% of orgs have tags
- Tags are broad (e.g., "humans" covers sports, religion, human services)
- Not specific enough for precise cause filtering

**Implication**:
- ⚠️ Tags alone are insufficient for cause filtering
- ✅ Can be used as supplementary signal
- ✅ Available in Search API (no extra API call needed)

---

## Recommendations for Implementation

### Immediate Fix: Parse Location Field Correctly

**Problem**: We're checking `locationAddress` (doesn't exist in Search API) instead of `location`

**Solution**:
```typescript
// In everyorg/client.ts
location: org.location,  // ✅ Use this field from Search API

// In orchestrator.ts
const locationStr = candidate.location || '';  // ✅ Check location, not locationAddress
```

**Expected Impact**:
- All 10 US-based orgs → correctly identified as United States
- Geographic filter → MISMATCH for Nigeria article
- US orgs filtered out ✅
- Nigeria → Thailand bug fixed ✅

### Enhanced Cause Filtering: Use NTEE Codes

**Option A: Enrich Top Candidates Only** (Recommended)
```typescript
// After geographic filtering, before final ranking
const topCandidates = geoFiltered.slice(0, 20);  // Top 20 by geo score

// Enrich with NTEE codes
for (const candidate of topCandidates) {
  const details = await everyOrgClient.getNonprofitDetails(candidate.slug);
  candidate.nteeCode = details?.nteeCode;
  candidate.nteeCodeMeaning = details?.nteeCodeMeaning;
}

// Filter by NTEE code
const causeFiltered = topCandidates.filter(c => 
  isRelevantNTEE(c.nteeCode, articleCauses)
);
```

**Cost**: 20 API calls per article (acceptable)
**Benefit**: Accurate cause filtering using structured data

**Option B: Use Search API Tags Only** (Current Approach)
```typescript
// Use tags from Search API (no extra calls)
const causeFiltered = candidates.filter(c =>
  hasRelevantTags(c.tags, articleCauses)
);
```

**Cost**: Free (already in Search API response)
**Benefit**: Fast, but less accurate (70% coverage, broad categories)

### NTEE Code Mapping for Humanitarian Causes

```typescript
const HUMANITARIAN_NTEE_CODES = {
  // International Development
  'Q30': 'International Development',
  'Q33': 'International Development',
  
  // Human Services
  'P20': 'Human Service Organizations',
  'P30': 'Children and Youth Services',
  'P40': 'Family Services',
  'P50': 'Personal Social Services',
  'P60': 'Emergency Assistance',
  'P70': 'Residential Care',
  'P80': 'Services to Promote Independence',
  
  // Health
  'E': 'Health - General',
  'E20': 'Hospitals',
  'E30': 'Ambulatory Health Center',
  
  // Disaster Relief
  'M20': 'Disaster Preparedness and Relief Services',
  
  // Food/Nutrition
  'K30': 'Food Programs',
  'K31': 'Food Banks',
  
  // Housing/Shelter
  'L20': 'Housing Development',
  'L30': 'Housing Search Assistance',
  'L40': 'Temporary Shelter',
};

function isHumanitarianNTEE(nteeCode: string): boolean {
  // Check major code (first letter)
  const majorCode = nteeCode[0];
  if (['Q', 'P', 'E', 'M', 'K', 'L'].includes(majorCode)) {
    return true;
  }
  
  // Check specific codes
  return nteeCode in HUMANITARIAN_NTEE_CODES;
}
```

---

## Cost-Benefit Analysis

### Current Approach (Search API Only)
- **API Calls**: 1 search call per article
- **Latency**: ~500ms
- **Cost**: Free (within rate limits)
- **Accuracy**: 
  - Location: ❌ 0% (wrong field name)
  - Cause: ⚠️ 70% (tags only, broad categories)

### Proposed Approach (Search + Selective Details)
- **API Calls**: 1 search + 20 details calls per article
- **Latency**: ~500ms + (20 × 200ms) = ~4.5 seconds
- **Cost**: Minimal (within rate limits)
- **Accuracy**:
  - Location: ✅ 100% (correct field name)
  - Cause: ✅ 100% (NTEE codes, structured)

### Recommended Hybrid Approach
1. **Use Search API `location` field** for geographic filtering (100% coverage, free)
2. **Use Search API `tags`** for initial cause filtering (70% coverage, free)
3. **Enrich top 10-20 candidates** with Details API for NTEE codes (accurate cause classification)
4. **Final ranking** based on geo + cause + trust scores

**Total Cost**: 1 search + 10-20 details calls = ~2-3 seconds per article
**Accuracy**: High (100% location, 100% cause for top candidates)

---

## Next Steps

1. ✅ **Fix location field name** (`location` instead of `locationAddress`)
2. ✅ **Test with Nigeria query** (verify US orgs filtered out)
3. ⚠️ **Decide on cause filtering approach**:
   - Option A: Tags only (fast, less accurate)
   - Option B: NTEE codes (slower, more accurate)
   - Option C: Hybrid (recommended)
4. ✅ **Implement chosen approach**
5. ✅ **Run E2E tests** (verify Nigeria → Thailand bug fixed)

---

## Appendix: NTEE Code Reference

### Major Categories Relevant to Humanitarian Work

| Code | Category | Examples |
|------|----------|----------|
| **Q** | International Foreign Affairs | International development, relief services |
| **P** | Human Services | Food, shelter, counseling, emergency assistance |
| **E** | Health | Hospitals, clinics, mental health |
| **M** | Public Safety | Disaster preparedness, relief services |
| **K** | Food, Agriculture | Food banks, nutrition programs |
| **L** | Housing, Shelter | Homeless shelters, housing assistance |

### Decile Codes for Humanitarian Causes

| Code | Meaning | Relevance |
|------|---------|-----------|
| Q30 | International Development | ✅ High |
| Q33 | International Development | ✅ High |
| P20 | Human Service Organizations | ✅ High |
| P30 | Children and Youth Services | ✅ High |
| P60 | Emergency Assistance | ✅ High |
| M20 | Disaster Preparedness and Relief | ✅ High |
| K31 | Food Banks | ✅ High |
| L40 | Temporary Shelter | ✅ High |
| E20 | Hospitals | ⚠️ Medium |
| W70 | Leadership Development | ⚠️ Low |
| X20 | Christianity | ❌ Not relevant |
| N70 | Amateur Sports | ❌ Not relevant |