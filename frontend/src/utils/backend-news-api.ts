import { NewsArticle, TrackedLocation } from '@/types';
import { classifyNewsArticle } from './news-classifier';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedNews {
  articles: NewsArticle[];
  timestamp: number;
}

const newsCache = new Map<string, CachedNews>();

/**
 * Fetch news articles from the backend news aggregation system
 * This uses the configured news API sources in the backend
 */
export async function fetchNewsFromBackend(
  location: TrackedLocation,
  limit: number = 5,
  forceRefresh: boolean = false
): Promise<NewsArticle[]> {
  const cacheKey = `${location.type}_${location.value}`;
  const cached = newsCache.get(cacheKey);
  
  // Check cache first (unless forcing refresh)
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.articles.slice(0, limit);
  }

  try {
    // Build search query based on location
    const keywords = buildLocationKeywords(location);
    
    // Fetch from backend
    const response = await fetch(`${API_BASE_URL}/news/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords,
        limit: limit * 2, // Fetch more to account for filtering
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend news fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    
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

    // Cache the results
    newsCache.set(cacheKey, {
      articles,
      timestamp: Date.now(),
    });

    return articles;
  } catch (error) {
    console.error('Error fetching news from backend:', error);
    return [];
  }
}

/**
 * Build search keywords based on location type
 */
function buildLocationKeywords(location: TrackedLocation): string[] {
  const keywords: string[] = [];
  
  // Add crisis-related keywords
  const crisisKeywords = [
    'disaster', 'emergency', 'crisis', 'humanitarian',
    'earthquake', 'flood', 'hurricane', 'wildfire',
    'refugee', 'conflict', 'evacuation'
  ];
  
  // Add location-specific keywords
  if (location.type === 'city') {
    keywords.push(location.value);
    if (location.state) {
      keywords.push(location.state);
    }
  } else if (location.type === 'country') {
    keywords.push(location.value);
  } else if (location.type === 'region') {
    keywords.push(location.value);
  }
  
  // Combine with crisis keywords (limit to avoid overwhelming APIs)
  return [...keywords.slice(0, 2), ...crisisKeywords.slice(0, 3)];
}

/**
 * Clear the news cache
 */
export function clearBackendNewsCache(): void {
  newsCache.clear();
}