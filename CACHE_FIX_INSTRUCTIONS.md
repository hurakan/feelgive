# Cache Fix Instructions

## Issue Fixed

The news feed was showing articles from incorrect locations (e.g., California/Texas articles when Congo was selected) because the keyword search was using OR logic instead of location-specific AND logic.

## What Changed

### Frontend (`frontend/src/utils/backend-news-api.ts`)
**Before:**
```javascript
keywords = ["Congo", "disaster", "emergency", "crisis"]
// This matched articles about "Congo" OR "disaster" OR "emergency" OR "crisis"
// Result: Articles about disasters anywhere in the world
```

**After:**
```javascript
keywords = [
  "Congo disaster",
  "Congo emergency", 
  "Congo crisis",
  "Congo humanitarian",
  "Congo conflict"
]
// This matches articles about "Congo AND disaster" OR "Congo AND emergency", etc.
// Result: Only articles about disasters IN Congo
```

### Backend (`backend/src/services/news-aggregator.ts`)
- Updated comments to clarify that each keyword phrase already contains AND logic
- The OR logic between phrases is correct (we want articles about Congo disasters OR Congo emergencies, etc.)

## How to Apply the Fix

### Step 1: Clear All Caches

The old cached results contain incorrectly filtered articles. You need to clear both client and server caches.

**Option A: Clear via API (Recommended)**
```bash
# Clear server-side cache
curl -X POST http://localhost:3001/api/v1/news/cache/clear

# Clear client-side cache
# Open browser console on the app and run:
localStorage.clear()
```

**Option B: Clear via Browser**
1. Open the FeelGive app
2. Open Developer Tools (F12)
3. Go to Application tab → Storage → Local Storage
4. Right-click and select "Clear"
5. Refresh the page

**Option C: Force Refresh**
1. In the News Feed, click the "Refresh" button
2. This will force fetch fresh data with the new keyword strategy

### Step 2: Test the Fix

1. **Add a location** (e.g., Congo, Democratic Republic of the)
2. **Check the news feed** - you should now see:
   - ✅ Articles specifically about Congo
   - ✅ Articles about crises/disasters IN Congo
   - ❌ NO articles about California, Texas, or other unrelated locations

3. **Try different locations**:
   - City: San Francisco, CA → Should show SF-specific news
   - Country: Ukraine → Should show Ukraine-specific news
   - Region: Middle East → Should show Middle East-specific news

### Step 3: Verify Cache is Working

After clearing and testing:

1. **First load** (cache miss):
   - Should take 2-5 seconds
   - Console will show: `[BackendNewsAPI] Cache miss or force refresh, fetching fresh data`

2. **Second load** (cache hit):
   - Should take 50-100ms
   - Console will show: `[BackendNewsAPI] Serving from client cache (stale: false)`
   - UI will show "Cached" badge

3. **After 15 minutes** (stale cache):
   - Should load instantly from cache
   - Console will show: `[BackendNewsAPI] Serving from client cache (stale: true)`
   - UI will show "Cached (updating...)" badge
   - Background refresh will happen automatically

## Expected Behavior

### Location-Specific Filtering

| Location Type | Example | Expected Keywords |
|--------------|---------|-------------------|
| Country | Congo | "Congo disaster", "Congo emergency", "Congo crisis" |
| City | San Francisco, CA | "San Francisco California disaster", "San Francisco California emergency" |
| Region | Middle East | "Middle East disaster", "Middle East emergency" |

### Cache Behavior

| Time Since Cache | Behavior |
|-----------------|----------|
| < 15 minutes | Instant load from cache, no API call |
| 15 min - 24 hours | Instant load from stale cache + background refresh |
| > 24 hours | Fresh fetch (blocking) |

## Troubleshooting

### Still seeing wrong location articles?

1. **Clear cache completely**:
   ```bash
   # Server cache
   curl -X POST http://localhost:3001/api/v1/news/cache/clear
   
   # Client cache
   # In browser console:
   localStorage.clear()
   ```

2. **Hard refresh the page**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

3. **Check console logs** for keyword queries:
   ```
   [BackendNewsAPI] Should show keywords like "Congo disaster", not just "Congo"
   ```

### Cache not working?

1. **Check metrics**:
   ```bash
   curl http://localhost:3001/api/v1/news/cache/metrics
   ```

2. **Check debug info**:
   ```bash
   curl http://localhost:3001/api/v1/news/cache/debug
   ```

3. **Verify Redis** (if using):
   ```bash
   # Check if Redis is running
   redis-cli ping
   # Should return: PONG
   ```

### No news articles found?

This might happen if:
- The location has no recent crisis news (expected behavior)
- News APIs don't have coverage for that location
- The keywords are too specific

**Solution**: The app will show "No recent news found for this location" - this is correct behavior.

## Testing Checklist

- [ ] Cleared server-side cache
- [ ] Cleared client-side cache (localStorage)
- [ ] Refreshed the page
- [ ] Added Congo as a location
- [ ] Verified articles are about Congo (not California/Texas)
- [ ] Checked cache is working (second load is instant)
- [ ] Verified "Cached" badge appears
- [ ] Waited 15+ minutes and verified stale-while-revalidate works
- [ ] Tested with different location types (city, country, region)

## Summary

The fix ensures that news articles are properly filtered by location using AND logic in the search queries. After clearing the cache, you should only see location-specific news articles in the feed.

**Key Changes:**
- ✅ Location-specific keyword queries ("Congo disaster" instead of "Congo" OR "disaster")
- ✅ Proper AND logic for location filtering
- ✅ Cache system remains fully functional
- ✅ All caching benefits preserved (speed, token savings, etc.)