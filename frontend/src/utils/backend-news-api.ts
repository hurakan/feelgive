import { NewsArticle, TrackedLocation } from '@/types';
import { classifyNewsArticle } from './news-classifier';
import { newsFeedClientCache } from './news-feed-client-cache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

/**
 * Fetch news articles from the backend news aggregation system
 * This uses the configured news API sources in the backend
 */
export async function fetchNewsFromBackend(
  location: TrackedLocation,
  limit: number = 5,
  forceRefresh: boolean = false
): Promise<NewsArticle[]> {
  // Check client-side cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = newsFeedClientCache.get(location.id);
    
    if (cached.articles) {
      console.log(`[BackendNewsAPI] Serving from client cache (stale: ${cached.isStale})`);
      
      // If stale, trigger background refresh
      if (cached.isStale && cached.shouldRefresh) {
        console.log('[BackendNewsAPI] Triggering background refresh for stale cache');
        fetchFreshAndCache(location, limit).catch(error => {
          console.error('[BackendNewsAPI] Background refresh failed:', error);
        });
      }
      
      return cached.articles.slice(0, limit);
    }
  }

  // Cache miss or force refresh - fetch fresh data
  console.log('[BackendNewsAPI] Cache miss or force refresh, fetching fresh data');
  return await fetchFreshAndCache(location, limit, forceRefresh);
}

/**
 * Fetch fresh data from backend and update cache
 */
async function fetchFreshAndCache(
  location: TrackedLocation,
  limit: number,
  forceRefresh: boolean = false
): Promise<NewsArticle[]> {
  try {
    // Build search query based on location
    const keywords = buildLocationKeywords(location);
    
    // Determine region from location
    const region = location.type === 'country' ? location.value :
                   location.type === 'region' ? location.value : 'global';
    
    // Fetch from backend with cache parameters
    const response = await fetch(`${API_BASE_URL}/news/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords,
        limit: limit * 2, // Fetch more to account for filtering
        region,
        locale: 'en',
        category: 'crisis',
        forceRefresh,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend news fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`[BackendNewsAPI] Received from backend: ${data.count} articles (fromCache: ${data.fromCache}, isStale: ${data.isStale}, source: ${data.dataSource})`);
    
    // Convert backend articles to frontend format
    const articles: NewsArticle[] = (data.articles || []).map((article: any) => {
      const eventTag = classifyNewsArticle(article.title, article.description || '');
      
      return {
        id: article.id || `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        imageUrl: article.imageUrl,
        source: article.source,
        publishedAt: article.publishedAt,
        locationId: location.id,
        locationName: location.displayName,
        eventTag,
      };
    }).slice(0, limit);

    // Cache the results in client-side cache
    newsFeedClientCache.set(location.id, articles);

    return articles;
  } catch (error) {
    console.error('[BackendNewsAPI] Error fetching news from backend:', error);
    
    // Try to serve from stale cache as fallback
    const cached = newsFeedClientCache.get(location.id);
    if (cached.articles) {
      console.log('[BackendNewsAPI] Serving stale cache as fallback after error');
      return cached.articles.slice(0, limit);
    }
    
    return [];
  }
}

/**
 * Build search keywords based on location type
 * Creates location-specific crisis queries using AND logic
 */
function buildLocationKeywords(location: TrackedLocation): string[] {
  const keywords: string[] = [];
  
  // Build location-specific crisis queries
  // Format: "Location AND (crisis OR disaster OR emergency)"
  let locationName = '';
  
  if (location.type === 'city') {
    locationName = location.value;
    if (location.state) {
      locationName = `${location.value} ${location.state}`;
    }
  } else if (location.type === 'country') {
    locationName = location.value;
  } else if (location.type === 'region') {
    locationName = location.value;
  }
  
  // Create combined queries that require BOTH location AND crisis terms
  // This ensures we only get news about crises IN that location
  if (locationName) {
    keywords.push(`${locationName} disaster`);
    keywords.push(`${locationName} emergency`);
    keywords.push(`${locationName} crisis`);
    keywords.push(`${locationName} humanitarian`);
    keywords.push(`${locationName} conflict`);
  }
  
  return keywords;
}

/**
 * Clear the news cache
 */
export function clearBackendNewsCache(): void {
  newsFeedClientCache.clear();
}

/**
 * Get cache metrics
 */
export function getNewsCacheMetrics() {
  return newsFeedClientCache.getMetrics();
}

/**
 * Get cache debug info
 */
export function getNewsCacheDebugInfo() {
  return newsFeedClientCache.getDebugInfo();
}