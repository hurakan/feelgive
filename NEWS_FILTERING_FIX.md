# News Filtering Fix - Multiple Locations Showing Same Articles

## Problem
The UI was displaying articles for Ukraine (twice) but not displaying articles for other filters like Middle East, Africa, Argentina, and Somalia. All locations were receiving the same Ukraine articles.

## Root Cause
The issue was in the **Currents API integration** in [`backend/src/services/news-aggregator.ts`](backend/src/services/news-aggregator.ts:326).

The `fetchFromCurrents()` method was only using the **first keyword** from the keywords array:

```typescript
// BEFORE (Line 326)
const query = keywords[0] || 'disaster';
```

This meant:
1. When fetching news for Ukraine, keywords would be: `["Ukraine disaster", "Ukraine emergency", "Ukraine crisis"]`
2. Only `"Ukraine disaster"` was used in the query
3. When fetching for other locations (Middle East, Africa, etc.), the same pattern occurred
4. Due to caching or request ordering, all locations ended up getting Ukraine's results

## Solution
Changed the Currents API to use **all keywords with OR logic**:

```typescript
// AFTER (Line 326)
const query = keywords.length > 0 ? keywords.join(' OR ') : 'disaster';
```

Now each location gets a comprehensive query:
- Ukraine: `"Ukraine disaster" OR "Ukraine emergency" OR "Ukraine crisis"`
- Middle East: `"Middle East disaster" OR "Middle East emergency" OR "Middle East crisis"`
- Africa: `"Africa disaster" OR "Africa emergency" OR "Africa crisis"`
- etc.

## Cache Key Generation
The cache system was working correctly. Each location has a unique cache key because:
1. Keywords are included in the cache key hash (line 141 in `news-feed-cache.ts`)
2. Different keywords = different hash = different cache entry
3. The problem was that the API wasn't using all the keywords properly

## Files Modified
- [`backend/src/services/news-aggregator.ts`](backend/src/services/news-aggregator.ts:326) - Fixed Currents API keyword usage

## Testing
Created test script: [`backend/test-news-filtering-fix.js`](backend/test-news-filtering-fix.js)

To test the fix:
```bash
# 1. Start the backend (if not already running)
cd backend && npm run dev

# 2. In another terminal, run the test
node backend/test-news-filtering-fix.js
```

The test will:
- Fetch news for 5 different locations
- Check for duplicate articles across locations
- Verify each location gets unique, relevant articles

## Expected Behavior After Fix
- Each tracked location should display its own unique articles
- Ukraine articles should only appear in the Ukraine section
- Middle East articles should only appear in the Middle East section
- No duplicate articles across different location sections
- Cache keys remain unique per location

## Additional Notes
- The fix applies to the Currents API provider
- Other providers (NewsAPI, Guardian, GNews, etc.) were already using proper OR logic
- The cache system with stale-while-revalidate is working as designed
- No changes needed to frontend code - the issue was purely backend