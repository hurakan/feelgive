# News API Filtering Fix

## Problem
The news API was not applying location-specific filters correctly. When filtering by "Nigeria", it was showing unrelated articles like:
- "Rare footage from trial of Chinese general who defied Tiananmen crackdown order leaked online"
- "Princess Beatrice snubs disgraced Andrew"

## Root Cause
The backend [`news-aggregator.ts`](backend/src/services/news-aggregator.ts) was not properly using the location-specific keywords passed from the frontend:

1. **Currents API**: Was using the generic `latest-news` endpoint with "world" category instead of the `search` endpoint with location-specific keywords
2. **Other APIs**: Were receiving keywords but not logging them, making debugging difficult

## Solution

### 1. Fixed Currents API Implementation
**File**: [`backend/src/services/news-aggregator.ts`](backend/src/services/news-aggregator.ts:310)

**Before**:
```typescript
// Used latest-news with generic "world" category
const response = await axios.get('https://api.currentsapi.services/v1/latest-news', {
  params: {
    language: 'en',
    category: 'world',
    page_size: actualLimit
  }
});
```

**After**:
```typescript
// Now uses search endpoint with location-specific keywords
const query = keywords[0] || 'disaster'; // e.g., "Nigeria disaster"
const response = await axios.get('https://api.currentsapi.services/v1/search', {
  params: {
    keywords: query,
    language: 'en',
    page_size: actualLimit
  }
});
```

### 2. Added Logging to All API Providers
Added console logging to track what queries are being sent to each API:
- NewsAPI
- Guardian
- MediaStack
- GNews
- Currents

This helps verify that location-specific keywords are being used correctly.

## How It Works

### Frontend Flow
1. User tracks a location (e.g., "Nigeria")
2. Frontend builds location-specific keywords in [`backend-news-api.ts`](frontend/src/utils/backend-news-api.ts:120):
   ```typescript
   keywords = [
     "Nigeria disaster",
     "Nigeria emergency", 
     "Nigeria crisis",
     "Nigeria humanitarian",
     "Nigeria conflict"
   ]
   ```

### Backend Flow
3. Backend receives keywords in [`news.ts`](backend/src/routes/news.ts:261) route
4. [`news-aggregator.ts`](backend/src/services/news-aggregator.ts:186) passes keywords to each API provider
5. Each provider now uses these keywords in their API calls:
   - **NewsAPI**: `q=Nigeria disaster OR Nigeria emergency OR Nigeria crisis`
   - **Currents**: `keywords=Nigeria disaster`
   - **Guardian**: `q=Nigeria disaster OR Nigeria emergency`
   - **GNews**: `q=Nigeria disaster OR Nigeria emergency`

## Testing

### Test Script
Created [`backend/test-news-filtering.js`](backend/test-news-filtering.js) to verify filtering:

```bash
cd backend
node test-news-filtering.js
```

This will:
1. Fetch Nigeria-specific news and verify articles mention "Nigeria"
2. Fetch Ukraine-specific news and verify articles mention "Ukraine"
3. Display API usage statistics

### Manual Testing
1. Start the backend server
2. In the frontend, add "Nigeria" as a tracked location
3. Check the news feed - should only show Nigeria-related articles
4. Check browser console and backend logs for query details

## Expected Behavior

### Before Fix
- Articles from any location (China, UK, etc.)
- Generic world news not related to tracked location

### After Fix
- Articles specifically about the tracked location
- Crisis/humanitarian news from that location
- Proper filtering by location keywords

## Cache Considerations

The news feed uses caching, so after deploying this fix:

1. **Clear backend cache** (if needed):
   ```bash
   curl -X POST http://localhost:3001/api/v1/news/cache/clear
   ```

2. **Force refresh in frontend**:
   - Click the "Refresh" button in the news feed
   - Or pass `forceRefresh: true` in the API call

## Monitoring

Check the logs to verify filtering is working:

```bash
# Backend logs should show:
[Currents] Fetching with search query: "Nigeria disaster"
[NewsAPI] Fetching with query: "Nigeria disaster OR Nigeria emergency OR Nigeria crisis"
[Guardian] Fetching with query: "Nigeria disaster OR Nigeria emergency"
```

## Related Files

- [`backend/src/services/news-aggregator.ts`](backend/src/services/news-aggregator.ts) - Main fix
- [`frontend/src/utils/backend-news-api.ts`](frontend/src/utils/backend-news-api.ts) - Keyword building
- [`backend/src/routes/news.ts`](backend/src/routes/news.ts) - API endpoint
- [`backend/test-news-filtering.js`](backend/test-news-filtering.js) - Test script

## Notes

- The fix maintains backward compatibility with existing cache entries
- All API providers now use location-specific keywords consistently
- Logging helps debug any future filtering issues
- The search approach is more accurate than category-based filtering