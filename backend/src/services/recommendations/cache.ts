import crypto from 'crypto';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Cache TTL configuration (in seconds)
 */
export interface CacheTTLConfig {
  queryResults: number;    // 7-30 days
  orgDetails: number;      // 30-90 days
  breakingNews: number;    // Shorter TTL for recent news (< 72 hours)
}

/**
 * Default TTL configuration
 */
const DEFAULT_TTL_CONFIG: CacheTTLConfig = {
  queryResults: 7 * 24 * 60 * 60,      // 7 days
  orgDetails: 30 * 24 * 60 * 60,       // 30 days
  breakingNews: 6 * 60 * 60,           // 6 hours
};

/**
 * In-memory cache with TTL support
 * Can be extended to use Redis for distributed caching
 */
export class RecommendationCache {
  private cache: Map<string, CacheEntry<any>>;
  private hits: number = 0;
  private misses: number = 0;
  private maxSize: number = 1000;

  // TTLs in milliseconds
  private ttlConfig: CacheTTLConfig;
  private ttls = {
    search: 6 * 60 * 60 * 1000,      // 6 hours
    browse: 6 * 60 * 60 * 1000,      // 6 hours
    nonprofit: 24 * 60 * 60 * 1000,  // 24 hours
    recommendation: 1 * 60 * 60 * 1000, // 1 hour
    queryResults: 7 * 24 * 60 * 60 * 1000,  // 7 days
    orgDetails: 30 * 24 * 60 * 60 * 1000,   // 30 days
    breakingNews: 6 * 60 * 60 * 1000,       // 6 hours
  };

  constructor(ttlConfig?: Partial<CacheTTLConfig>) {
    this.cache = new Map();
    this.ttlConfig = { ...DEFAULT_TTL_CONFIG, ...ttlConfig };
    
    // Update TTLs from config (convert seconds to milliseconds)
    this.ttls.queryResults = this.ttlConfig.queryResults * 1000;
    this.ttls.orgDetails = this.ttlConfig.orgDetails * 1000;
    this.ttls.breakingNews = this.ttlConfig.breakingNews * 1000;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Update TTL configuration
   */
  updateTTLConfig(config: Partial<CacheTTLConfig>): void {
    this.ttlConfig = { ...this.ttlConfig, ...config };
    this.ttls.queryResults = this.ttlConfig.queryResults * 1000;
    this.ttls.orgDetails = this.ttlConfig.orgDetails * 1000;
    this.ttls.breakingNews = this.ttlConfig.breakingNews * 1000;
  }

  /**
   * Get current TTL configuration
   */
  getTTLConfig(): CacheTTLConfig {
    return { ...this.ttlConfig };
  }

  /**
   * Generate cache key for search
   */
  getSearchKey(searchTerm: string, causes?: string[], take?: number): string {
    const causesHash = causes ? this.hashArray(causes) : 'none';
    return `search:${searchTerm}:${causesHash}:${take || 50}`;
  }

  /**
   * Generate cache key for browse
   */
  getBrowseKey(cause: string, page?: number, take?: number): string {
    return `browse:${cause}:${page || 1}:${take || 50}`;
  }

  /**
   * Generate cache key for nonprofit details
   */
  getNonprofitKey(identifier: string): string {
    return `nonprofit:${identifier}`;
  }

  /**
   * Generate cache key for recommendation
   */
  getRecommendationKey(
    articleText: string,
    geography: any,
    causes: string[],
    publishedAt?: string
  ): string {
    const textHash = this.hashString(articleText.substring(0, 500));
    const geoHash = this.hashObject(geography);
    const causesHash = this.hashArray(causes);
    
    // Add timestamp indicator for breaking news detection
    const isBreakingNews = publishedAt ? this.isBreakingNews(publishedAt) : false;
    const prefix = isBreakingNews ? 'breaking' : 'recommendation';
    
    return `${prefix}:${textHash}:${geoHash}:${causesHash}`;
  }

  /**
   * Check if article is breaking news (< 72 hours old)
   */
  private isBreakingNews(publishedAt: string): boolean {
    const publishedTime = new Date(publishedAt).getTime();
    const now = Date.now();
    const hoursSincePublished = (now - publishedTime) / (1000 * 60 * 60);
    return hoursSincePublished < 72;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    // Determine TTL based on key prefix
    let ttl = ttlMs;
    if (!ttl) {
      if (key.startsWith('search:')) {
        ttl = this.ttls.search;
      } else if (key.startsWith('browse:')) {
        ttl = this.ttls.browse;
      } else if (key.startsWith('nonprofit:')) {
        ttl = this.ttls.orgDetails; // Use configurable org details TTL
      } else if (key.startsWith('recommendation:')) {
        ttl = this.ttls.queryResults; // Use configurable query results TTL
      } else if (key.startsWith('breaking:')) {
        ttl = this.ttls.breakingNews; // Shorter TTL for breaking news
      } else {
        ttl = this.ttls.search; // default
      }
    }

    // Enforce max size (LRU-like behavior)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      data: value,
      expiresAt: now + ttl,
      createdAt: now,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cache cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Hash a string
   */
  private hashString(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
  }

  /**
   * Hash an array
   */
  private hashArray(arr: string[]): string {
    return this.hashString(arr.sort().join(','));
  }

  /**
   * Hash an object
   */
  private hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj));
  }
}

// Export singleton instance
export const recommendationCache = new RecommendationCache();