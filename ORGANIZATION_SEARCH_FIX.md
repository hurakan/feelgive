# Organization Search Fix - Different Articles Showing Same Organizations

## Problem
Different news articles about various crises were showing the same organizations because the search strategy was using hardcoded organization names instead of article-specific search terms.

### Root Cause
In [`frontend/src/utils/search-term-extractor.ts`](frontend/src/utils/search-term-extractor.ts), the `extractSearchTerms()` function had a flawed strategy for international crises:

```typescript
// OLD CODE (PROBLEMATIC)
if (isInternationalCrisis) {
  // Used deterministic selection to pick ONE org name from hardcoded list
  const orgIndex = classification.tier1_crisis_type.charCodeAt(0) % INTERNATIONAL_HUMANITARIAN_ORGS.length;
  const selectedOrg = INTERNATIONAL_HUMANITARIAN_ORGS[orgIndex];
  return selectedOrg; // e.g., "International Rescue Committee"
}
```

This meant:
1. Articles about Ukraine → searched for "International Medical Corps"
2. Articles about Somalia → searched for "International Medical Corps" 
3. Articles about Middle East → searched for "International Medical Corps"
4. **Result**: Same organizations appeared for different crises

### Why This Happened
The hardcoded list approach (`INTERNATIONAL_HUMANITARIAN_ORGS`) was designed to find well-known organizations, but it:
- Ignored the specific crisis location
- Used the same search term for similar crisis types
- Didn't leverage Every.org's location-based search capabilities

## Solution

### Changes Made

#### 1. Updated `extractSearchTerms()` Function
**File**: [`frontend/src/utils/search-term-extractor.ts`](frontend/src/utils/search-term-extractor.ts:29)

**Before**: Searched for hardcoded organization names for international crises
**After**: Uses location-specific search terms for ALL crises

```typescript
// NEW CODE (FIXED)
export function extractSearchTerms(classification: Classification): string {
  const terms: string[] = [];
  
  // 1. Geographic location - most important
  if (classification.geoName) {
    terms.push(classification.geoName);
  }
  
  // 2. Crisis type
  if (classification.tier1_crisis_type && classification.tier1_crisis_type !== 'none') {
    const crisisType = classification.tier1_crisis_type.replace(/_/g, ' ');
    terms.push(crisisType);
  }
  
  // Combine: "Ukraine humanitarian" or "Somalia disaster"
  const searchQuery = terms.slice(0, 2).join(' ');
  return searchQuery;
}
```

#### 2. Updated `getAlternativeSearchTerms()` Function
**File**: [`frontend/src/utils/search-term-extractor.ts`](frontend/src/utils/search-term-extractor.ts:89)

**Before**: Searched for ALL hardcoded org names for international crises
**After**: Uses progressive location-specific searches with varying specificity

```typescript
// NEW STRATEGY
alternatives = [
  "Ukraine humanitarian",      // Broad humanitarian orgs in region
  "Ukraine relief",            // Disaster relief orgs in region
  "Ukraine disaster relief",   // Specific to crisis type
  "Ukraine medical aid",       // Specific to identified needs
  "Ukraine",                   // Regional organizations
  "Ukraine aid",               // General aid organizations
  "disaster",                  // Broader fallback
  "humanitarian crisis"        // Broadest fallback
]
```

## Impact

### Before Fix
- **Ukraine article** → searches "International Medical Corps" → returns IRC, IMC, MSF, etc.
- **Somalia article** → searches "International Medical Corps" → returns IRC, IMC, MSF, etc.
- **Middle East article** → searches "International Medical Corps" → returns IRC, IMC, MSF, etc.
- **Result**: Same 3-5 organizations for all international crises

### After Fix
- **Ukraine article** → searches "Ukraine humanitarian" → returns Ukraine-specific orgs + global orgs working in Ukraine
- **Somalia article** → searches "Somalia humanitarian" → returns Somalia-specific orgs + global orgs working in Somalia
- **Middle East article** → searches "Middle East humanitarian" → returns Middle East-specific orgs + global orgs in that region
- **Result**: Different, location-relevant organizations for each crisis

## Benefits

1. **Location Relevance**: Organizations are now matched to the actual crisis location
2. **Diversity**: Different articles show different organizations based on their specific context
3. **Better Matching**: Leverages Every.org's location-based search to find orgs actually working in the crisis area
4. **Scalability**: Works for any location without maintaining hardcoded lists
5. **User Trust**: Users see organizations that are genuinely relevant to the specific crisis they're reading about

## Testing

To verify the fix works:

1. Open the app and analyze a Ukraine crisis article
2. Note the organizations shown
3. Analyze a Somalia crisis article
4. Verify different organizations are shown
5. Check that organizations are relevant to each specific location

Expected behavior:
- ✅ Different articles show different organizations
- ✅ Organizations are relevant to the crisis location
- ✅ Search terms include the location name (visible in console logs)
- ✅ Fallback searches still work if location-specific search returns few results

## Technical Details

### Search Strategy Flow

1. **Primary Search**: `"{location} {crisis_type}"` (e.g., "Ukraine humanitarian")
2. **Alternative Searches** (if < 10 results):
   - `"{location} humanitarian"`
   - `"{location} relief"`
   - `"{location} {cause}"`
   - `"{location} {need}"`
   - `"{location}"`
   - `"{location} aid"`
   - `"{crisis_type}"` (broader)
   - `"{cause}"` (broadest)

3. **Deduplication**: Combines results from multiple searches, removing duplicates by slug

### Console Logs to Monitor

```
🔍 Extracted search terms: { finalQuery: "Ukraine humanitarian", ... }
[EVERY.ORG] 🔍 Primary search query: "Ukraine humanitarian"
[EVERY.ORG] ✅ Primary search returned 15 organizations
[EVERY.ORG] 🔄 Trying alternative: "Ukraine relief"
```

## Related Files

- [`frontend/src/utils/search-term-extractor.ts`](frontend/src/utils/search-term-extractor.ts) - Main fix
- [`frontend/src/pages/Index.tsx`](frontend/src/pages/Index.tsx:318) - Uses extractSearchTerms()
- [`frontend/src/hooks/use-organizations.tsx`](frontend/src/hooks/use-organizations.tsx) - Fetches from Every.org API

## Notes

- The hardcoded `INTERNATIONAL_HUMANITARIAN_ORGS` list is still in the file but no longer used for search
- Can be removed in a future cleanup if confirmed unnecessary
- The fix maintains backward compatibility with the existing API structure