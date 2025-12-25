import crypto from 'crypto';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
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
 * In-memory cache with TTL support
 * Can be extended to use Redis for distributed caching
 */
export class RecommendationCache {
  private cache: Map<string, CacheEntry<any>>;
  private hits: number = 0;
  private misses: number = 0;
  private maxSize: number = 1000;

  // TTLs in milliseconds
  private ttls = {
    search: 6 * 60 * 60 * 1000,      // 6 hours
    browse: 6 * 60 * 60 * 1000,      // 6 hours
    nonprofit: 24 * 60 * 60 * 1000,  // 24 hours
    recommendation: 1 * 60 * 60 * 1000, // 1 hour
  };

  constructor() {
    this.cache = new Map();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
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
    causes: string[]
  ): string {
    const textHash = this.hashString(articleText.substring(0, 500));
    const geoHash = this.hashObject(geography);
    const causesHash = this.hashArray(causes);
    return `recommendation:${textHash}:${geoHash}:${causesHash}`;
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
        ttl = this.ttls.nonprofit;
      } else if (key.startsWith('recommendation:')) {
        ttl = this.ttls.recommendation;
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

    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttl,
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