# Response Cache System

## Overview

The response cache system reduces API calls to the Gemini API by caching responses for common questions. This helps avoid quota exhaustion and improves response times for frequently asked questions.

## Features

- **LRU (Least Recently Used) Cache**: Automatically evicts oldest entries when cache is full
- **TTL (Time To Live)**: Cached responses expire after 60 minutes by default
- **Smart Key Generation**: Uses message content + article context to generate cache keys
- **Hit/Miss Tracking**: Monitors cache effectiveness with statistics
- **Automatic Cleanup**: Periodically removes expired entries
- **Web Search Bypass**: Only caches non-web-search queries for consistency

## Configuration

Default settings (can be modified in `backend/src/services/response-cache.ts`):
- **Max Size**: 100 entries
- **TTL**: 60 minutes
- **Cache Strategy**: LRU with automatic expiration

## How It Works

### 1. Cache Key Generation

The cache generates a unique key based on:
- Normalized user message (lowercase, trimmed, extra spaces removed)
- Article title
- Crisis cause
- Geographic location

This ensures that the same question about the same article gets cached, while different articles or contexts get separate cache entries.

### 2. Cache Flow

```
User Question → Check Cache → Cache Hit? 
                                ↓ Yes: Return cached response
                                ↓ No: Call Gemini API → Cache response → Return
```

### 3. When Caching Occurs

**Cached:**
- Regular questions without web search enabled
- Questions about the same article/context

**NOT Cached:**
- Questions with web search enabled (to ensure fresh data)
- First-time questions (cache miss)

## API Endpoints

### Get Cache Statistics
```bash
GET /api/v1/chat/cache/stats
```

Response:
```json
{
  "stats": {
    "totalEntries": 45,
    "totalHits": 120,
    "totalMisses": 80,
    "hitRate": 60.0,
    "oldestEntry": 1703123456789,
    "newestEntry": 1703127890123
  }
}
```

### Get Debug Information (Development Only)
```bash
GET /api/v1/chat/cache/debug
```

Response:
```json
{
  "stats": { ... },
  "maxSize": 100,
  "ttlMinutes": 60,
  "entries": [
    {
      "key": "a1b2c3d4e5f6...",
      "age": 1234,
      "hits": 5,
      "responseLength": 450
    }
  ]
}
```

### Clear Cache (Development Only)
```bash
POST /api/v1/chat/cache/clear
```

## Benefits

### 1. Reduced API Costs
- Avoids duplicate API calls for the same questions
- Helps stay within free tier limits (20 requests/day for Gemini 2.5 Flash)

### 2. Faster Response Times
- Cached responses return instantly
- No network latency to Gemini API

### 3. Better User Experience
- Consistent responses for common questions
- No "Service Temporarily Busy" errors for cached queries

### 4. Quota Management
- Significantly reduces quota consumption
- Allows more unique questions within quota limits

## Cache Effectiveness

### Expected Hit Rates

- **Low traffic**: 20-40% hit rate (many unique questions)
- **Medium traffic**: 40-60% hit rate (some repeated questions)
- **High traffic**: 60-80% hit rate (many common questions)

### Common Cached Questions

Examples of questions that benefit from caching:
- "What are the most urgent needs?"
- "How can I help?"
- "Tell me more about this crisis"
- "What charities are helping?"
- "How will my donation be used?"

## Monitoring

### Check Cache Performance

```bash
# Get current statistics
curl http://localhost:3001/api/v1/chat/cache/stats

# Get detailed debug info (development)
curl http://localhost:3001/api/v1/chat/cache/debug
```

### Console Logs

The cache service logs important events:
```
[Cache] HIT - Message: "What are the most urgent needs..." (hits: 3)
[Cache] STORED - Message: "How can I help..." (total entries: 45)
[Cache] Evicted oldest entry (age: 3600s)
[Cache] Cleaned 5 expired entries
```

## Best Practices

### 1. Monitor Hit Rate
- Check cache stats regularly
- Aim for >40% hit rate in production
- Low hit rate may indicate need for larger cache size

### 2. Adjust TTL Based on Content
- Current: 60 minutes (good for crisis news)
- Consider shorter TTL for rapidly changing situations
- Consider longer TTL for historical content

### 3. Cache Size Tuning
- Current: 100 entries
- Increase if you have high traffic and good hit rates
- Decrease if memory is a concern

### 4. Clear Cache When Needed
```bash
# Clear cache after major updates
curl -X POST http://localhost:3001/api/v1/chat/cache/clear
```

## Troubleshooting

### Cache Not Working?

1. **Check if web search is enabled**: Cache is bypassed for web search queries
2. **Verify message normalization**: Slight variations in wording create different cache keys
3. **Check TTL**: Entries expire after 60 minutes
4. **Review logs**: Look for cache HIT/MISS messages

### Low Hit Rate?

1. **Users asking unique questions**: Normal for diverse queries
2. **Cache size too small**: Increase max size
3. **TTL too short**: Entries expiring too quickly
4. **Message variations**: Similar questions with different wording

### Memory Concerns?

1. **Reduce max size**: Lower from 100 to 50 entries
2. **Reduce TTL**: Shorter expiration time
3. **Monitor entry sizes**: Check debug endpoint for large responses

## Future Enhancements

Potential improvements:
- [ ] Persistent cache (Redis/database)
- [ ] Semantic similarity matching (cache similar questions)
- [ ] Per-article cache limits
- [ ] Cache warming for common questions
- [ ] Cache metrics dashboard
- [ ] Configurable cache settings via environment variables

## Technical Details

### Cache Implementation

- **Storage**: In-memory Map
- **Eviction**: LRU (Least Recently Used)
- **Key Generation**: SHA-256 hash of normalized message + context
- **Expiration**: Timestamp-based TTL check
- **Cleanup**: Probabilistic (10% chance on each set operation)

### Performance

- **Get Operation**: O(1) - constant time lookup
- **Set Operation**: O(1) - constant time insertion
- **Eviction**: O(n) - linear scan to find oldest (only when cache is full)
- **Cleanup**: O(n) - linear scan for expired entries (periodic)

## Example Usage

```typescript
// In gemini.ts service
const cached = responseCacheService.get(message, {
  articleTitle: context.articleTitle,
  cause: context.classification.cause,
  geoName: context.classification.geoName
});

if (cached) {
  return {
    message: cached.response,
    sources: cached.sources
  };
}

// ... call Gemini API ...

// Cache the response
responseCacheService.set(
  message,
  { articleTitle, cause, geoName },
  text,
  sources
);
```

## Conclusion

The response cache system is a critical component for managing API quota limits while maintaining good user experience. By caching common questions, the system can serve many more users within the free tier limits of the Gemini API.

Monitor cache statistics regularly and adjust configuration based on your traffic patterns and quota constraints.