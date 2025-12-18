import { NewsArticle, TrackedLocation } from '@/types';
import { classifyNewsArticle } from './news-classifier';

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'demo'; // Will need to set this
const NEWS_API_BASE = 'https://newsapi.org/v2';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedNews {
  articles: NewsArticle[];
  timestamp: number;
  page: number;
}

const newsCache = new Map<string, CachedNews>();
const pageTrackers = new Map<string, number>(); // Track current page for each location

export async function fetchNewsForLocation(
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
    // Get current page for this location (increment on refresh)
    let currentPage = pageTrackers.get(cacheKey) || 1;
    if (forceRefresh) {
      currentPage += 1;
      pageTrackers.set(cacheKey, currentPage);
    }

    let articles: NewsArticle[] = [];

    if (location.type === 'postal_code' && location.coordinates) {
      // For postal codes, search by coordinates (not directly supported by NewsAPI)
      // Fallback to searching by nearby city/region
      articles = await fetchNewsByQuery(location.displayName, location, limit, currentPage);
    } else if (location.type === 'country') {
      // Fetch news FROM and ABOUT the country
      const fromCountry = await fetchNewsByCountry(location.value, location, Math.ceil(limit / 2), currentPage);
      const aboutCountry = await fetchNewsByQuery(location.value, location, Math.ceil(limit / 2), currentPage);
      articles = [...fromCountry, ...aboutCountry];
    } else if (location.type === 'region') {
      // Fetch news ABOUT the region
      articles = await fetchNewsByQuery(location.value, location, limit, currentPage);
    }

    // Remove duplicates by URL
    const uniqueArticles = Array.from(
      new Map(articles.map(a => [a.url, a])).values()
    ).slice(0, limit);

    // Cache the results
    newsCache.set(cacheKey, {
      articles: uniqueArticles,
      timestamp: Date.now(),
      page: currentPage
    });

    return uniqueArticles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

async function fetchNewsByCountry(
  country: string,
  location: TrackedLocation,
  limit: number,
  page: number = 1
): Promise<NewsArticle[]> {
  try {
    // Map country names to ISO codes (simplified - would need full mapping)
    const countryCode = getCountryCode(country);
    
    if (!countryCode) {
      return fetchNewsByQuery(country, location, limit, page);
    }

    const response = await fetch(
      `${NEWS_API_BASE}/top-headlines?country=${countryCode}&pageSize=${limit}&page=${page}&apiKey=${NEWS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('NewsAPI request failed');
    }

    const data = await response.json();

    if (data.status !== 'ok' || !data.articles) {
      return [];
    }

    return data.articles.map((article: any) => {
      const eventTag = classifyNewsArticle(article.title, article.description || '');
      
      return {
        id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
        locationId: location.id,
        locationName: location.displayName,
        eventTag
      };
    });
  } catch (error) {
    console.error('Error fetching country news:', error);
    return [];
  }
}

async function fetchNewsByQuery(
  query: string,
  location: TrackedLocation,
  limit: number,
  page: number = 1
): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${NEWS_API_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&page=${page}&apiKey=${NEWS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('NewsAPI request failed');
    }

    const data = await response.json();

    if (data.status !== 'ok' || !data.articles) {
      return [];
    }

    return data.articles.map((article: any) => {
      const eventTag = classifyNewsArticle(article.title, article.description || '');
      
      return {
        id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
        locationId: location.id,
        locationName: location.displayName,
        eventTag
      };
    });
  } catch (error) {
    console.error('Error fetching query news:', error);
    return [];
  }
}

function getCountryCode(country: string): string | null {
  // Simplified country code mapping (would need full ISO 3166-1 alpha-2 mapping)
  const codes: { [key: string]: string } = {
    'united states': 'us',
    'canada': 'ca',
    'mexico': 'mx',
    'united kingdom': 'gb',
    'france': 'fr',
    'germany': 'de',
    'italy': 'it',
    'spain': 'es',
    'brazil': 'br',
    'argentina': 'ar',
    'australia': 'au',
    'india': 'in',
    'china': 'cn',
    'japan': 'jp'
  };

  return codes[country.toLowerCase()] || null;
}

export function clearNewsCache(): void {
  newsCache.clear();
  // Don't clear page trackers - we want to continue pagination
}

export function resetNewsPagination(): void {
  pageTrackers.clear();
}