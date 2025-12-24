# Currents API Timeout Fix

## Issue
The Currents API was experiencing timeout errors (30 seconds) when fetching news articles.

## Root Cause
The Currents API service (`api.currentsapi.services`) can be slow or unresponsive at times, causing requests to exceed the 30-second timeout threshold.

## Solution Implemented

### 1. Increased Timeout
- **Previous**: 30 seconds
- **New**: 60 seconds
- **Files Modified**: [`backend/src/services/news-aggregator.ts`](backend/src/services/news-aggregator.ts:321)

### 2. Enhanced Error Handling
Added specific timeout error detection:
```typescript
if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
  console.error(`[Currents] Request timeout - API is slow or unresponsive`);
  throw new Error('Currents API timeout - service is slow or unresponsive');
}
```

### 3. Applied to Multiple APIs
Also increased timeout for NewsData API to maintain consistency across all news sources.

## Recommendations

### If Timeouts Continue
If the Currents API continues to timeout even with the 60-second limit:

1. **Disable the API temporarily**:
   - Go to the News API Admin page
   - Toggle off the Currents API
   - The system will continue fetching from other enabled sources

2. **Check API Status**:
   - Visit [Currents API Status](https://currentsapi.services/en)
   - Check if there are known service issues

3. **Reduce Query Complexity**:
   - The system already limits to 3 keywords for Currents
   - Consider reducing to 2 keywords if issues persist

4. **Alternative Sources**:
   - NewsAPI.org
   - NewsData.io
   - Guardian API
   - GNews.io
   - MediaStack

## Monitoring

The system now tracks:
- Last error timestamp
- Error message details
- Timeout vs other error types

Check the News API Admin page to see:
- Last successful fetch time
- Current error status
- Usage statistics

## Cache Benefits

Even if Currents API times out:
- Cached articles remain available
- Other APIs continue to provide fresh content
- Users experience minimal disruption
- Background refresh attempts continue

## Technical Details

### Timeout Configuration
```typescript
const response = await axios.get(url, {
  headers: { 'Authorization': config.apiKey },
  timeout: 60000 // 60 seconds
});
```

### Error Tracking
Errors are stored in the database with timestamps:
```typescript
const timestamp = new Date().toISOString();
config.lastError = `[${timestamp}] ${errorMsg}`;
await config.save();
```

## Testing

To test the timeout handling:
```bash
# Check current API status
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.currentsapi.services/v1/search?keywords=disaster&language=en&page_size=5"

# Monitor backend logs
tail -f backend/logs/app.log
```

## Future Improvements

1. **Retry Logic**: Implement exponential backoff for failed requests
2. **Circuit Breaker**: Temporarily disable APIs after consecutive failures
3. **Health Checks**: Periodic API health monitoring
4. **Fallback Priority**: Automatically prioritize faster APIs