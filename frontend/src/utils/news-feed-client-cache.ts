/**
 * Client-side news feed cache using localStorage
 * Provides fast initial load and background revalidation
 */

interface CachedNewsFeed {
  articles: any[];
  timestamp: number;
  locationId: string;
  isStale?: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  staleServed: number;
}

class NewsFeedClientCache {
  private readonly CACHE_PREFIX = 'newsfeed_cache_';
  private readonly TTL_MS = 15 * 60 * 1000; // 15 minutes
  private readonly STALE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    staleServed: 0,
  };

  /**
   * Generate cache key for a location
   */
  private getCacheKey(locationId: string): string {
    return `${this.CACHE_PREFIX}${locationId}`;
  }

  /**
   * Get cached news feed for a location
   */
  get(locationId: string): {
    articles: any[] | null;
    isStale: boolean;
    shouldRefresh: boolean;
  } {
    try {
      const key = this.getCacheKey(locationId);
      const cached = localStorage.getItem(key);

      if (!cached) {
        this.metrics.misses++;
        return { articles: null, isStale: false, shouldRefresh: true };
      }

      const entry: CachedNewsFeed = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      // Hard expired (older than 24 hours)
      if (age > this.STALE_MAX_AGE_MS) {
        this.metrics.misses++;
        localStorage.removeItem(key);
        return { articles: null, isStale: false, shouldRefresh: true };
      }

      // Stale but within 24 hours
      if (age > this.TTL_MS) {
        this.metrics.staleServed++;
        console.log(`[ClientCache] Serving stale cache for ${locationId} (age: ${Math.floor(age / 1000)}s)`);
        return {
          articles: entry.articles,
          isStale: true,
          shouldRefresh: true,
        };
      }

      // Fresh cache hit
      this.metrics.hits++;
      console.log(`[ClientCache] Cache hit for ${locationId} (age: ${Math.floor(age / 1000)}s)`);
      return {
        articles: entry.articles,
        isStale: false,
        shouldRefresh: false,
      };
    } catch (error) {
      console.error('[ClientCache] Error reading cache:', error);
      this.metrics.misses++;
      return { articles: null, isStale: false, shouldRefresh: true };
    }
  }

  /**
   * Set cached news feed for a location
   */
  set(locationId: string, articles: any[]): void {
    try {
      const key = this.getCacheKey(locationId);
      const entry: CachedNewsFeed = {
        articles,
        timestamp: Date.now(),
        locationId,
      };

      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`[ClientCache] Cached ${articles.length} articles for ${locationId}`);
    } catch (error) {
      console.error('[ClientCache] Error writing cache:', error);
      // If localStorage is full, try to clear old entries
      this.cleanOldEntries();
    }
  }

  /**
   * Invalidate cache for a specific location
   */
  invalidate(locationId: string): void {
    try {
      const key = this.getCacheKey(locationId);
      localStorage.removeItem(key);
      console.log(`[ClientCache] Invalidated cache for ${locationId}`);
    } catch (error) {
      console.error('[ClientCache] Error invalidating cache:', error);
    }
  }

  /**
   * Clear all news feed cache
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      let cleared = 0;

      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
          cleared++;
        }
      }

      console.log(`[ClientCache] Cleared ${cleared} cache entries`);
      this.metrics = { hits: 0, misses: 0, staleServed: 0 };
    } catch (error) {
      console.error('[ClientCache] Error clearing cache:', error);
    }
  }

  /**
   * Clean old/expired entries to free up space
   */
  private cleanOldEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      let cleaned = 0;

      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry: CachedNewsFeed = JSON.parse(cached);
              const age = now - entry.timestamp;

              // Remove entries older than 24 hours
              if (age > this.STALE_MAX_AGE_MS) {
                localStorage.removeItem(key);
                cleaned++;
              }
            }
          } catch {
            // Invalid entry, remove it
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      }

      console.log(`[ClientCache] Cleaned ${cleaned} old entries`);
    } catch (error) {
      console.error('[ClientCache] Error cleaning old entries:', error);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get all cached locations
   */
  getCachedLocations(): string[] {
    try {
      const keys = Object.keys(localStorage);
      const locations: string[] = [];

      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const locationId = key.replace(this.CACHE_PREFIX, '');
          locations.push(locationId);
        }
      }

      return locations;
    } catch (error) {
      console.error('[ClientCache] Error getting cached locations:', error);
      return [];
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo(): any {
    try {
      const keys = Object.keys(localStorage);
      const entries: any[] = [];

      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry: CachedNewsFeed = JSON.parse(cached);
              const age = Date.now() - entry.timestamp;
              entries.push({
                locationId: entry.locationId,
                articles: entry.articles.length,
                age: Math.floor(age / 1000),
                isStale: age > this.TTL_MS,
                isExpired: age > this.STALE_MAX_AGE_MS,
              });
            }
          } catch {
            // Skip invalid entries
          }
        }
      }

      return {
        metrics: this.getMetrics(),
        entries: entries.sort((a, b) => a.age - b.age),
        totalSize: new Blob([JSON.stringify(entries)]).size,
      };
    } catch (error) {
      console.error('[ClientCache] Error getting debug info:', error);
      return { metrics: this.getMetrics(), entries: [], totalSize: 0 };
    }
  }
}

// Export singleton instance
export const newsFeedClientCache = new NewsFeedClientCache();