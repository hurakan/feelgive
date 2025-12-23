import crypto from 'crypto';

interface CacheEntry {
  response: string;
  sources: Array<{ title: string; url: string }>;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

/**
 * Response cache service to reduce API calls for common questions
 * Uses in-memory LRU cache with TTL
 */
class ResponseCacheService {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttlMs: number;
  private hits: number;
  private misses: number;

  constructor(maxSize: number = 100, ttlMinutes: number = 60) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate a cache key from message and context
   */
  private generateKey(message: string, context: {
    articleTitle: string;
    cause: string;
    geoName: string;
  }): string {
    // Normalize message (lowercase, trim, remove extra spaces)
    const normalizedMessage = message.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Create a composite key from message and context
    const keyData = `${normalizedMessage}|${context.articleTitle}|${context.cause}|${context.geoName}`;
    
    // Hash the key to keep it consistent length
    return crypto.createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.ttlMs;
  }

  /**
   * Evict oldest entries when cache is full (LRU)
   */
  private evictOldest(): void {
    if (this.cache.size < this.maxSize) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find the oldest entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[Cache] Evicted oldest entry (age: ${Math.round((Date.now() - oldestTime) / 1000)}s)`);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`[Cache] Cleaned ${expiredCount} expired entries`);
    }
  }

  /**
   * Get a cached response if available
   */
  get(message: string, context: {
    articleTitle: string;
    cause: string;
    geoName: string;
  }): { response: string; sources: Array<{ title: string; url: string }> } | null {
    const key = this.generateKey(message, context);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit count and move to end (LRU)
    entry.hits++;
    entry.timestamp = Date.now(); // Refresh timestamp on access
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;

    console.log(`[Cache] HIT - Message: "${message.substring(0, 50)}..." (hits: ${entry.hits})`);
    
    return {
      response: entry.response,
      sources: entry.sources
    };
  }

  /**
   * Store a response in the cache
   */
  set(
    message: string,
    context: {
      articleTitle: string;
      cause: string;
      geoName: string;
    },
    response: string,
    sources: Array<{ title: string; url: string }>
  ): void {
    // Clean expired entries periodically
    if (Math.random() < 0.1) { // 10% chance on each set
      this.cleanExpired();
    }

    // Evict oldest if needed
    this.evictOldest();

    const key = this.generateKey(message, context);
    
    this.cache.set(key, {
      response,
      sources,
      timestamp: Date.now(),
      hits: 0
    });

    console.log(`[Cache] STORED - Message: "${message.substring(0, 50)}..." (total entries: ${this.cache.size})`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log(`[Cache] Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (newestEntry === null || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      totalEntries: this.cache.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Get detailed cache information for debugging
   */
  getDebugInfo(): any {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 16) + '...',
      age: Math.round((Date.now() - entry.timestamp) / 1000),
      hits: entry.hits,
      responseLength: entry.response.length
    }));

    return {
      stats: this.getStats(),
      maxSize: this.maxSize,
      ttlMinutes: this.ttlMs / (60 * 1000),
      entries: entries.sort((a, b) => b.hits - a.hits).slice(0, 10) // Top 10 by hits
    };
  }
}

// Export singleton instance
// Cache up to 100 responses for 60 minutes each
export const responseCacheService = new ResponseCacheService(100, 60);