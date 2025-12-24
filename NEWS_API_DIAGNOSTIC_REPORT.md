# News API Diagnostic Report

Generated: 2025-12-24T01:43:00Z

## Current Status Summary

### ✅ Working APIs
- **Guardian Open Platform**: 17/5000 daily requests (0.34% used)
- **GNews.io**: 17/100 daily requests (17% used)

### ⚠️ APIs with Issues

#### 1. MediaStack - RATE LIMIT EXCEEDED
- **Status**: Enabled but at daily limit
- **Daily Usage**: 16/16 (100% - LIMIT REACHED)
- **Last Successful Fetch**: Dec 23, 2025 19:31:35
- **Issue**: Free tier only allows 16 requests per day
- **Impact**: No new articles can be fetched until daily reset

#### 2. Currents API - TIMEOUT
- **Status**: Enabled but timing out
- **Last Error**: `Currents API timeout - service is slow or unresponsive`
- **Last Error Time**: 2025-12-24T01:40:47Z
- **Last Successful Fetch**: Dec 21, 2025 10:36:09
- **Issue**: API service is slow/unresponsive even with 60s timeout

#### 3. NewsData.io Global - WORKING BUT LIMITED
- **Status**: Enabled and working
- **Daily Usage**: 19/200 (9.5% used)
- **Last Successful Fetch**: Dec 23, 2025 19:39:47
- **Note**: Working correctly but may have been rate-limited earlier

## Root Causes

### MediaStack Issue
The MediaStack free tier has a very restrictive limit:
- **Daily Limit**: 16 requests/day
- **Problem**: With multiple news fetches throughout the day, this limit is quickly exhausted
- **Current Usage Pattern**: ~16-19 fetches per day across all APIs

### Currents API Issue
- Service-side performance problems
- Even with 60-second timeout, requests are not completing
- Possible causes:
  - API server overload
  - Network connectivity issues
  - Service degradation

### NewsData.io Issue
- Actually working fine (19/200 usage)
- May have appeared to fail due to caching or timing

## Solutions

### Immediate Actions

#### 1. Disable MediaStack Temporarily
Since it's at its daily limit and has the most restrictive free tier:

```bash
# Via News API Admin UI
# Toggle off MediaStack until you upgrade to a paid plan
```

Or increase the limit if you have a paid plan.

#### 2. Disable Currents API
Since it's consistently timing out:

```bash
# Via News API Admin UI
# Toggle off Currents API until service improves
```

#### 3. Rely on Working APIs
Current working APIs provide sufficient coverage:
- Guardian: 5000 requests/day
- GNews: 100 requests/day
- NewsData: 200 requests/day

### Long-term Solutions

#### Option 1: Upgrade MediaStack
- **Free**: 16 requests/day
- **Basic ($9.99/mo)**: 10,000 requests/month (~333/day)
- **Professional ($49.99/mo)**: 100,000 requests/month (~3,333/day)

#### Option 2: Replace MediaStack
Consider alternatives:
- **NewsAPI.org**: 100 requests/day (free), 1000/day (paid)
- **Bing News Search API**: 1000 requests/month (free)
- **Contextual Web Search**: 10,000 requests/month (free)

#### Option 3: Optimize Fetch Strategy
Reduce total daily fetches:
- Increase cache duration (currently 15 minutes)
- Fetch less frequently during low-traffic hours
- Implement smarter refresh logic

## Recommended Configuration

### Immediate (Free Tier)
```
Enabled APIs:
✅ Guardian Open Platform (5000/day)
✅ GNews.io (100/day)  
✅ NewsData.io (200/day)
❌ MediaStack (disable - limit reached)
❌ Currents API (disable - timeout issues)
❌ NewsAPI.org (currently disabled)
```

### With Budget ($10-50/month)
```
Enabled APIs:
✅ Guardian Open Platform (5000/day)
✅ NewsAPI.org Basic ($9/mo - 1000/day)
✅ NewsData.io (200/day)
✅ GNews.io (100/day)
✅ MediaStack Basic ($9.99/mo - 333/day)
❌ Currents API (disable until service improves)
```

## Cache Strategy Impact

Current cache settings:
- **Fresh Duration**: 15 minutes
- **Stale Duration**: 1 hour
- **Max Age**: 24 hours

With 3 working APIs and proper caching:
- Fresh data every 15 minutes
- Stale-but-usable data for 1 hour
- Minimal API calls during low activity

## Monitoring Recommendations

1. **Check API Status Daily**
   ```bash
   cd backend && npx tsx check-news-api-status.js
   ```

2. **Monitor Error Logs**
   - Check `lastError` field for each API
   - Track timeout patterns
   - Monitor rate limit usage

3. **Set Up Alerts**
   - Alert when API reaches 80% of daily limit
   - Alert on consecutive failures (3+)
   - Alert on timeout patterns

## Action Items

- [ ] Disable MediaStack in News API Admin
- [ ] Disable Currents API in News API Admin  
- [ ] Verify Guardian, GNews, and NewsData are working
- [ ] Monitor cache hit rates
- [ ] Consider upgrading MediaStack or replacing it
- [ ] Check Currents API status page for service updates

## Testing

After making changes, test the news feed:
```bash
# Test news aggregation
cd backend && npm run test:news

# Check cache performance
# Monitor logs for cache hits vs misses
```

## Expected Behavior After Fix

With Guardian, GNews, and NewsData enabled:
- ✅ Fresh articles every 15 minutes
- ✅ ~300-400 articles available daily
- ✅ Good geographic coverage
- ✅ Diverse news sources
- ✅ Reliable service (no timeouts)
- ✅ Well within rate limits