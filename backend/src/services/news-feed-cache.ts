import Redis from 'ioredis';
import crypto from 'crypto';

/**
 * Cache entry structure for news feed
 */
interface NewsFeedCacheEntry {
  articles: any[];
  timestamp: number;
  isStale?: boolean;
  dataSource?: 'cache' | 'cache_fallback' | 'fresh';
  tokenUsage?: {
    llmCalls: number;
    estimatedTokens: number;
  };
}

/**
 * Cache key parameters
 */
interface CacheKeyParams {
  region: string;
  locale?: string;
  category?: string;
  sort?: string;
  page?: number;
  keywords?: string[];
}

/**
 * Cache metrics for observability
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  staleServed: number;
  refreshStarted: number;
  refreshSuccess: number;
  refreshFailed: number;
  tokensSaved: number;
  llmCallsPrevented: number;
}

/**
 * Multi-layer news feed cache service
 * - Primary: Redis (if available)
 * - Fallback: In-memory LRU cache
 * - TTL: 15 minutes default
 * - Stale-while-revalidate: up to 24 hours
 */
export class NewsFeedCacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, NewsFeedCacheEntry>;
  private maxMemoryCacheSize: number = 100;
  private metrics: CacheMetrics;
  private throttleMap: Map<string, number>;
  
  // Cache configuration
  private readonly TTL_SECONDS = 15 * 60; // 15 minutes
  private readonly STALE_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours
  private readonly THROTTLE_WINDOW_MS = 60 * 1000; // 60 seconds
  private readonly CACHE_VERSION = 'v1';

  constructor() {
    this.memoryCache = new Map();
    this.throttleMap = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      staleServed: 0,
      refreshStarted: 0,
      refreshSuccess: 0,
      refreshFailed: 0,
      tokensSaved: 0,
      llmCallsPrevented: 0,
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection (optional)
   */
  private initializeRedis(): void {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              console.warn('[NewsFeedCache] Redis connection failed, using in-memory cache');
              return null;
            }
            return Math.min(times * 100, 2000);
          },
        });

        this.redis.on('connect', () => {
          console.log('✅ [NewsFeedCache] Redis connected');
        });

        this.redis.on('error', (err) => {
          console.warn('[NewsFeedCache] Redis error, falling back to memory cache:', err.message);
        });
      } else {
        console.log('[NewsFeedCache] No REDIS_URL configured, using in-memory cache');
      }
    } catch (error) {
      console.warn('[NewsFeedCache] Redis initialization failed, using in-memory cache:', error);
      this.redis = null;
    }
  }

  /**
   * Generate cache key from parameters
   * Format: newsfeed:v1:{region}:{locale}:{category}:{sort}:{page}
   */
  generateCacheKey(params: CacheKeyParams): string {
    const {
      region,
      locale = 'en',
      category = 'all',
      sort = 'publishedAt',
      page = 1,
      keywords = [],
    } = params;

    // Normalize keywords to avoid cache misses on order differences
    const normalizedKeywords = keywords.sort().join(',');
    
    // Create deterministic key
    const keyParts = [
      'newsfeed',
      this.CACHE_VERSION,
      region.toLowerCase(),
      locale.toLowerCase(),
      category.toLowerCase(),
      sort.toLowerCase(),
      page.toString(),
      normalizedKeywords ? crypto.createHash('md5').update(normalizedKeywords).digest('hex').substring(0, 8) : 'none',
    ];

    return keyParts.join(':');
  }

  /**
   * Check if cache key was recently fetched (throttle check)
   */
  private isThrottled(cacheKey: string): boolean {
    const lastFetch = this.throttleMap.get(cacheKey);
    if (!lastFetch) return false;

    const timeSinceLastFetch = Date.now() - lastFetch;
    return timeSinceLastFetch < this.THROTTLE_WINDOW_MS;
  }

  /**
   * Update throttle timestamp
   */
  private updateThrottle(cacheKey: string): void {
    this.throttleMap.set(cacheKey, Date.now());
    
    // Clean old throttle entries periodically
    if (this.throttleMap.size > 200) {
      const now = Date.now();
      for (const [key, timestamp] of this.throttleMap.entries()) {
        if (now - timestamp > this.THROTTLE_WINDOW_MS * 2) {
          this.throttleMap.delete(key);
        }
      }
    }
  }

  /**
   * Get cached news feed
   * Returns: { data, isStale, shouldRefresh }
   */
  async get(params: CacheKeyParams): Promise<{
    data: any[] | null;
    isStale: boolean;
    shouldRefresh: boolean;
    dataSource: 'cache' | 'cache_fallback' | null;
  }> {
    const cacheKey = this.generateCacheKey(params);
    
    // Check throttle first
    if (this.isThrottled(cacheKey)) {
      console.log(`[NewsFeedCache] Throttled: ${cacheKey}`);
      // Still try to serve from cache even if throttled
    }

    let entry: NewsFeedCacheEntry | null = null;
    let source: 'redis' | 'memory' | null = null;

    // Try Redis first
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          entry = JSON.parse(cached);
          source = 'redis';
        }
      } catch (error) {
        console.warn('[NewsFeedCache] Redis get error:', error);
      }
    }

    // Fallback to memory cache
    if (!entry) {
      entry = this.memoryCache.get(cacheKey) || null;
      if (entry) {
        source = 'memory';
      }
    }

    if (!entry) {
      this.metrics.misses++;
      console.log(`[NewsFeedCache] MISS: ${cacheKey}`);
      return { data: null, isStale: false, shouldRefresh: true, dataSource: null };
    }

    const age = Date.now() - entry.timestamp;
    const ageSeconds = Math.floor(age / 1000);
    const isStale = ageSeconds > this.TTL_SECONDS;
    const isExpired = ageSeconds > this.STALE_MAX_AGE_SECONDS;

    if (isExpired) {
      // Hard expired - must fetch fresh
      this.metrics.misses++;
      console.log(`[NewsFeedCache] EXPIRED (${ageSeconds}s): ${cacheKey}`);
      return { data: null, isStale: false, shouldRefresh: true, dataSource: null };
    }

    if (isStale) {
      // Stale but within 24h - serve and refresh in background
      this.metrics.staleServed++;
      console.log(`[NewsFeedCache] STALE_SERVED (${ageSeconds}s): ${cacheKey} from ${source}`);
      
      // Track token savings
      if (entry.tokenUsage) {
        this.metrics.tokensSaved += entry.tokenUsage.estimatedTokens;
        this.metrics.llmCallsPrevented += entry.tokenUsage.llmCalls;
      }
      
      return {
        data: entry.articles,
        isStale: true,
        shouldRefresh: !this.isThrottled(cacheKey), // Only refresh if not throttled
        dataSource: source === 'redis' ? 'cache' : 'cache_fallback',
      };
    }

    // Fresh cache hit
    this.metrics.hits++;
    console.log(`[NewsFeedCache] HIT (${ageSeconds}s): ${cacheKey} from ${source}`);
    
    // Track token savings
    if (entry.tokenUsage) {
      this.metrics.tokensSaved += entry.tokenUsage.estimatedTokens;
      this.metrics.llmCallsPrevented += entry.tokenUsage.llmCalls;
    }

    return {
      data: entry.articles,
      isStale: false,
      shouldRefresh: false,
      dataSource: source === 'redis' ? 'cache' : 'cache_fallback',
    };
  }

  /**
   * Set cached news feed
   */
  async set(
    params: CacheKeyParams,
    articles: any[],
    tokenUsage?: { llmCalls: number; estimatedTokens: number }
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(params);
    const entry: NewsFeedCacheEntry = {
      articles,
      timestamp: Date.now(),
      dataSource: 'fresh',
      tokenUsage,
    };

    // Update throttle
    this.updateThrottle(cacheKey);

    // Store in Redis
    if (this.redis) {
      try {
        await this.redis.setex(
          cacheKey,
          this.STALE_MAX_AGE_SECONDS, // Store for max stale age
          JSON.stringify(entry)
        );
        console.log(`[NewsFeedCache] STORED in Redis: ${cacheKey} (${articles.length} articles)`);
      } catch (error) {
        console.warn('[NewsFeedCache] Redis set error:', error);
      }
    }

    // Also store in memory cache
    this.evictOldestMemoryEntry();
    this.memoryCache.set(cacheKey, entry);
    console.log(`[NewsFeedCache] STORED in memory: ${cacheKey} (${articles.length} articles)`);
  }

  /**
   * Evict oldest memory cache entry if at capacity (LRU)
   */
  private evictOldestMemoryEntry(): void {
    if (this.memoryCache.size < this.maxMemoryCacheSize) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      console.log(`[NewsFeedCache] Evicted oldest memory entry: ${oldestKey}`);
    }
  }

  /**
   * Invalidate cache for specific parameters
   */
  async invalidate(params: CacheKeyParams): Promise<void> {
    const cacheKey = this.generateCacheKey(params);

    if (this.redis) {
      try {
        await this.redis.del(cacheKey);
      } catch (error) {
        console.warn('[NewsFeedCache] Redis delete error:', error);
      }
    }

    this.memoryCache.delete(cacheKey);
    this.throttleMap.delete(cacheKey);
    console.log(`[NewsFeedCache] INVALIDATED: ${cacheKey}`);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`newsfeed:${this.CACHE_VERSION}:*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('[NewsFeedCache] Redis clear error:', error);
      }
    }

    this.memoryCache.clear();
    this.throttleMap.clear();
    console.log('[NewsFeedCache] CLEARED all cache');
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & {
    hitRate: number;
    memoryCacheSize: number;
    redisConnected: boolean;
  } {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryCacheSize: this.memoryCache.size,
      redisConnected: this.redis?.status === 'ready',
    };
  }

  /**
   * Track refresh metrics
   */
  trackRefreshStarted(): void {
    this.metrics.refreshStarted++;
  }

  trackRefreshSuccess(): void {
    this.metrics.refreshSuccess++;
  }

  trackRefreshFailed(): void {
    this.metrics.refreshFailed++;
  }

  /**
   * Get debug information
   */
  getDebugInfo(): any {
    const memoryEntries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((Date.now() - entry.timestamp) / 1000),
      articles: entry.articles.length,
      isStale: (Date.now() - entry.timestamp) / 1000 > this.TTL_SECONDS,
    }));

    return {
      metrics: this.getMetrics(),
      config: {
        ttlSeconds: this.TTL_SECONDS,
        staleMaxAgeSeconds: this.STALE_MAX_AGE_SECONDS,
        throttleWindowMs: this.THROTTLE_WINDOW_MS,
        maxMemoryCacheSize: this.maxMemoryCacheSize,
      },
      memoryCache: memoryEntries.slice(0, 10), // Top 10
      throttleMapSize: this.throttleMap.size,
    };
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const newsFeedCache = new NewsFeedCacheService();