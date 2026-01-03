import axios from 'axios';
import NewsArticle, { INewsArticle } from '../models/NewsArticle.js';
import NewsAPIConfig, { INewsAPIConfig } from '../models/NewsAPIConfig.js';
import { newsFeedCache } from './news-feed-cache.js';
import { classifyNewsArticle, getCrisisType, isCrisisArticle } from './classifier.js';

interface NewsAPIResponse {
  articles: any[];
  totalResults?: number;
}

interface FetchOptions {
  keywords?: string[];
  countries?: string[];
  limit?: number;
  forceRefresh?: boolean;
  region?: string;
  locale?: string;
  category?: string;
  sort?: string;
  page?: number;
}

/**
 * Multi-source news aggregator service
 * Fetches news from multiple APIs with rate limiting and usage tracking
 */
export class NewsAggregatorService {
  private readonly CRISIS_KEYWORDS = [
    'earthquake', 'flood', 'hurricane', 'wildfire', 'tsunami', 'drought',
    'refugee', 'conflict', 'war', 'disaster', 'emergency', 'crisis',
    'humanitarian', 'evacuation', 'casualties', 'displaced'
  ];

  /**
   * Fetch news from all enabled sources with caching
   */
  async fetchFromAllSources(options: FetchOptions = {}): Promise<{
    articles: INewsArticle[];
    fromCache: boolean;
    isStale: boolean;
    dataSource: string;
  }> {
    const {
      region = 'global',
      locale = 'en',
      category = 'all',
      sort = 'publishedAt',
      page = 1,
      forceRefresh = false,
    } = options;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = await newsFeedCache.get({
        region,
        locale,
        category,
        sort,
        page,
        keywords: options.keywords,
      });

      if (cached.data) {
        console.log(`[NewsAggregator] Serving from cache (stale: ${cached.isStale}, source: ${cached.dataSource})`);
        
        // If stale and should refresh, trigger background refresh
        if (cached.isStale && cached.shouldRefresh) {
          console.log('[NewsAggregator] Triggering background refresh for stale cache');
          newsFeedCache.trackRefreshStarted();
          
          // Background refresh (non-blocking)
          this.fetchFreshAndCache(options).catch(error => {
            console.error('[NewsAggregator] Background refresh failed:', error);
            newsFeedCache.trackRefreshFailed();
          });
        }

        return {
          articles: cached.data,
          fromCache: true,
          isStale: cached.isStale,
          dataSource: cached.dataSource || 'cache',
        };
      }
    }

    // Cache miss or force refresh - fetch fresh data
    console.log('[NewsAggregator] Cache miss or force refresh, fetching fresh data');
    const articles = await this.fetchFreshAndCache(options);

    return {
      articles,
      fromCache: false,
      isStale: false,
      dataSource: 'fresh',
    };
  }

  /**
   * Fetch fresh data and update cache
   */
  private async fetchFreshAndCache(options: FetchOptions): Promise<INewsArticle[]> {
    const configs = await NewsAPIConfig.find({ isEnabled: true }).sort({ priority: -1 });
    
    if (configs.length === 0) {
      throw new Error('No enabled news API sources found');
    }

    const allArticles: INewsArticle[] = [];
    const errors: string[] = [];
    let totalLLMCalls = 0;
    let estimatedTokens = 0;

    for (const config of configs) {
      try {
        // Check rate limits
        if (!this.canFetch(config)) {
          console.log(`Rate limit reached for ${config.provider}, skipping...`);
          continue;
        }

        const articles = await this.fetchFromSource(config, options);
        allArticles.push(...articles);

        // Track LLM usage (if any classification/processing happens)
        // For now, we estimate based on articles fetched
        totalLLMCalls += 1; // One call per source
        estimatedTokens += articles.length * 100; // Rough estimate

        // Update usage stats and clear any previous errors on success
        await this.updateUsageStats(config);
        
        // Clear lastError on successful fetch
        if (config.lastError) {
          config.lastError = undefined;
          await config.save();
        }
      } catch (error: any) {
        const errorMsg = `Error fetching from ${config.provider}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        
        // Update last error with timestamp
        const timestamp = new Date().toISOString();
        config.lastError = `[${timestamp}] ${errorMsg}`;
        await config.save();
      }
    }

    // Remove duplicates by URL and title (more aggressive deduplication)
    const uniqueArticles = this.deduplicateArticles(allArticles);

    // Cache the results
    const {
      region = 'global',
      locale = 'en',
      category = 'all',
      sort = 'publishedAt',
      page = 1,
    } = options;

    await newsFeedCache.set(
      {
        region,
        locale,
        category,
        sort,
        page,
        keywords: options.keywords,
      },
      uniqueArticles.map(a => a.toObject ? a.toObject() : a),
      {
        llmCalls: totalLLMCalls,
        estimatedTokens,
      }
    );

    newsFeedCache.trackRefreshSuccess();
    console.log(`[NewsAggregator] Cached ${uniqueArticles.length} articles (LLM calls: ${totalLLMCalls}, tokens: ${estimatedTokens})`);

    return uniqueArticles;
  }

  /**
   * Fetch news from a specific source
   */
  private async fetchFromSource(
    config: INewsAPIConfig,
    options: FetchOptions
  ): Promise<INewsArticle[]> {
    const keywords = options.keywords || config.keywords || this.CRISIS_KEYWORDS;
    const countries = options.countries || config.countries || [];
    const limit = options.limit || 20;

    let articles: any[] = [];

    switch (config.provider) {
      case 'newsapi':
        articles = await this.fetchFromNewsAPI(config, keywords, countries, limit);
        break;
      case 'newsdata':
        articles = await this.fetchFromNewsData(config, keywords, countries, limit);
        break;
      case 'currents':
        articles = await this.fetchFromCurrents(config, keywords, limit);
        break;
      case 'guardian':
        articles = await this.fetchFromGuardian(config, keywords, limit);
        break;
      case 'mediastack':
        articles = await this.fetchFromMediaStack(config, keywords, countries, limit);
        break;
      case 'gnews':
        articles = await this.fetchFromGNews(config, keywords, limit);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    // Convert to our NewsArticle model
    const newsArticles = articles.map(article => this.normalizeArticle(article, config.provider));

    // Save to database (only URLs + metadata)
    const savedArticles: INewsArticle[] = [];
    for (const article of newsArticles) {
      try {
        const existing = await NewsArticle.findOne({ url: article.url });
        if (!existing) {
          const saved = await NewsArticle.create(article);
          savedArticles.push(saved);
        } else {
          savedArticles.push(existing);
        }
      } catch (error) {
        console.error('Error saving article:', error);
      }
    }

    return savedArticles;
  }

  /**
   * NewsAPI.org integration
   */
  private async fetchFromNewsAPI(
    config: INewsAPIConfig,
    keywords: string[],
    countries: string[],
    limit: number
  ): Promise<any[]> {
    // Use OR between different keyword phrases, but each phrase already contains AND logic
    // e.g., "Nigeria disaster" OR "Nigeria emergency" OR "Nigeria crisis"
    const query = keywords.join(' OR ');
    console.log(`[NewsAPI] Fetching with query: "${query}"`);
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${limit}&sortBy=publishedAt&language=en`;
    
    const response = await axios.get(url, {
      headers: { 'X-Api-Key': config.apiKey }
    });

    console.log(`[NewsAPI] Success: ${response.data.articles?.length || 0} articles`);
    return response.data.articles || [];
  }

  /**
   * NewsData.io integration
   */
  private async fetchFromNewsData(
    config: INewsAPIConfig,
    keywords: string[],
    countries: string[],
    limit: number
  ): Promise<any[]> {
    try {
      // NewsData.io requires specific format: keywords separated by space, not comma
      // Also, 'size' parameter max is 10 on free tier
      const query = keywords.slice(0, 5).join(' '); // Limit keywords to avoid 422
      const countryParam = countries.length > 0 ? `&country=${countries.join(',')}` : '';
      const actualLimit = Math.min(limit, 10); // Free tier max is 10
      const url = `https://newsdata.io/api/1/news?apikey=${config.apiKey}&q=${encodeURIComponent(query)}${countryParam}&language=en&size=${actualLimit}`;
      
      console.log(`[NewsData] Fetching with query: "${query}", limit: ${actualLimit}`);
      const response = await axios.get(url, {
        timeout: 60000 // Increased to 60 second timeout
      });
      console.log(`[NewsData] Success: ${response.data.results?.length || 0} articles`);
      return response.data.results || [];
    } catch (error: any) {
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error(`[NewsData] Request timeout - API is slow or unresponsive`);
        throw new Error('NewsData API timeout - service is slow or unresponsive');
      }
      
      // Handle 422 errors specifically - usually means invalid parameters
      if (error.response?.status === 422) {
        console.error(`[NewsData] Invalid request (422) - check query parameters. Query: "${keywords.slice(0, 5).join(' ')}"`);
        throw new Error('NewsData API invalid request (422) - query parameters may be malformed');
      }
      
      console.error(`[NewsData] Error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Currents API integration with keyword-based search
   * Uses search endpoint with location-specific keywords for accurate filtering
   */
  private async fetchFromCurrents(
    config: INewsAPIConfig,
    keywords: string[],
    limit: number
  ): Promise<any[]> {
    const actualLimit = Math.min(limit, 10);
    
    // Use all keywords combined with OR logic to get comprehensive results
    // This ensures we get location-specific results for all crisis terms
    const query = keywords.length > 0 ? keywords.join(' OR ') : 'disaster';
    console.log(`[Currents] Fetching with search query: "${query}"`);
    
    try {
      const response = await axios.get('https://api.currentsapi.services/v1/search', {
        params: {
          keywords: query,
          language: 'en',
          page_size: actualLimit
        },
        headers: { 'Authorization': config.apiKey },
        timeout: 60000 // 60 seconds for search
      });

      console.log(`[Currents] Success: ${response.data.news?.length || 0} articles for query "${query}"`);
      return response.data.news || [];
    } catch (error: any) {
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error(`[Currents] Request timeout for query "${query}"`);
        throw new Error('Currents API timeout - service is slow or unresponsive');
      }
      
      // Handle 500 errors
      if (error.response?.status === 500) {
        console.error(`[Currents] Server error (500) - API is experiencing issues`);
        throw new Error('Currents API server error (500) - service temporarily unavailable');
      }
      
      console.error(`[Currents] Error details:`, {
        query,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Guardian Open Platform integration
   */
  private async fetchFromGuardian(
    config: INewsAPIConfig,
    keywords: string[],
    limit: number
  ): Promise<any[]> {
    // Use OR between different keyword phrases (e.g., "Nigeria disaster" OR "Nigeria emergency")
    const query = keywords.join(' OR ');
    console.log(`[Guardian] Fetching with query: "${query}"`);
    
    const url = `https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&page-size=${limit}&show-fields=all&api-key=${config.apiKey}`;
    
    const response = await axios.get(url);
    console.log(`[Guardian] Success: ${response.data.response?.results?.length || 0} articles`);
    return response.data.response?.results || [];
  }

  /**
   * MediaStack integration
   */
  private async fetchFromMediaStack(
    config: INewsAPIConfig,
    keywords: string[],
    countries: string[],
    limit: number
  ): Promise<any[]> {
    const query = keywords.join(',');
    const countryParam = countries.length > 0 ? `&countries=${countries.join(',')}` : '';
    console.log(`[MediaStack] Fetching with keywords: "${query}"`);
    
    const url = `http://api.mediastack.com/v1/news?access_key=${config.apiKey}&keywords=${encodeURIComponent(query)}${countryParam}&languages=en&limit=${limit}`;
    
    const response = await axios.get(url);
    console.log(`[MediaStack] Success: ${response.data.data?.length || 0} articles`);
    return response.data.data || [];
  }

  /**
   * GNews.io integration
   */
  private async fetchFromGNews(
    config: INewsAPIConfig,
    keywords: string[],
    limit: number
  ): Promise<any[]> {
    // Use OR between different keyword phrases (e.g., "Nigeria disaster" OR "Nigeria emergency")
    const query = keywords.join(' OR ');
    console.log(`[GNews] Fetching with query: "${query}"`);
    
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=${limit}&apikey=${config.apiKey}`;
    
    const response = await axios.get(url);
    console.log(`[GNews] Success: ${response.data.articles?.length || 0} articles`);
    return response.data.articles || [];
  }

  /**
   * Normalize article from different sources to our format
   * Includes automatic crisis classification
   */
  private normalizeArticle(article: any, provider: string): Partial<INewsArticle> {
    let normalized: Partial<INewsArticle> = {
      apiSource: provider as any,
      fetchedAt: new Date(),
      classificationStatus: 'pending',
      keywords: [],
    };

    switch (provider) {
      case 'newsapi':
        normalized = {
          ...normalized,
          title: article.title,
          description: article.description || '',
          url: article.url,
          imageUrl: article.urlToImage,
          source: article.source?.name || 'Unknown',
          publishedAt: new Date(article.publishedAt),
          author: article.author,
          content: article.content,
        };
        break;

      case 'newsdata':
        normalized = {
          ...normalized,
          title: article.title,
          description: article.description || '',
          url: article.link,
          imageUrl: article.image_url,
          source: article.source_id || 'Unknown',
          publishedAt: new Date(article.pubDate),
          country: article.country?.[0],
          category: article.category?.[0],
          keywords: article.keywords || [],
        };
        break;

      case 'currents':
        normalized = {
          ...normalized,
          title: article.title,
          description: article.description || '',
          url: article.url,
          imageUrl: article.image,
          source: article.author || 'Unknown',
          publishedAt: new Date(article.published),
          language: article.language,
        };
        break;

      case 'guardian':
        normalized = {
          ...normalized,
          title: article.webTitle,
          description: article.fields?.trailText || article.fields?.standfirst || '',
          url: article.webUrl,
          imageUrl: article.fields?.thumbnail,
          source: 'The Guardian',
          publishedAt: new Date(article.webPublicationDate),
          content: article.fields?.bodyText,
          category: article.sectionName,
        };
        break;

      case 'mediastack':
        normalized = {
          ...normalized,
          title: article.title,
          description: article.description || '',
          url: article.url,
          imageUrl: article.image,
          source: article.source || 'Unknown',
          publishedAt: new Date(article.published_at),
          author: article.author,
          country: article.country,
          category: article.category,
        };
        break;

      case 'gnews':
        normalized = {
          ...normalized,
          title: article.title,
          description: article.description || '',
          url: article.url,
          imageUrl: article.image,
          source: article.source?.name || 'Unknown',
          publishedAt: new Date(article.publishedAt),
          content: article.content,
        };
        break;
    }

    // Classify the article for crisis detection
    const title = normalized.title || '';
    const description = normalized.description || '';
    const classification = classifyNewsArticle(title, description);
    
    if (classification) {
      // Article is classified as a crisis
      normalized.classificationStatus = 'classified';
      normalized.disasterType = this.mapCrisisTypeToDisasterType(classification.type);
      console.log(`[Classifier] Classified as ${classification.label} (confidence: ${classification.confidence.toFixed(2)}): ${title.substring(0, 60)}...`);
    } else {
      // Not a crisis article
      normalized.classificationStatus = 'irrelevant';
      console.log(`[Classifier] Not a crisis: ${title.substring(0, 60)}...`);
    }

    return normalized;
  }

  /**
   * Map crisis type to disaster type enum
   */
  private mapCrisisTypeToDisasterType(crisisType: string): string | undefined {
    const mapping: Record<string, string> = {
      'natural_disaster': 'other',
      'health_emergency': 'health_crisis',
      'conflict_displacement': 'conflict',
      'climate_disaster': 'other',
      'human_rights_violation': 'other'
    };
    return mapping[crisisType];
  }

  /**
   * Check if we can fetch from this source (rate limit check)
   */
  private canFetch(config: INewsAPIConfig): boolean {
    const now = new Date();
    
    // Reset daily counter if needed
    const lastResetDate = new Date(config.rateLimit.lastResetDate);
    if (now.getDate() !== lastResetDate.getDate()) {
      config.rateLimit.currentDayUsage = 0;
      config.rateLimit.lastResetDate = now;
    }

    // Reset hourly counter if needed
    if (config.rateLimit.requestsPerHour) {
      const lastResetHour = new Date(config.rateLimit.lastResetHour);
      if (now.getHours() !== lastResetHour.getHours()) {
        config.rateLimit.currentHourUsage = 0;
        config.rateLimit.lastResetHour = now;
      }

      // Check hourly limit
      if (config.rateLimit.currentHourUsage >= config.rateLimit.requestsPerHour) {
        return false;
      }
    }

    // Check daily limit
    return config.rateLimit.currentDayUsage < config.rateLimit.requestsPerDay;
  }

  /**
   * Update usage statistics after successful fetch
   */
  private async updateUsageStats(config: INewsAPIConfig): Promise<void> {
    config.rateLimit.currentDayUsage += 1;
    config.rateLimit.currentHourUsage += 1;
    config.lastFetchedAt = new Date();
    config.lastSuccessfulFetch = new Date();
    config.totalArticlesFetched += 1;
    await config.save();
  }

  /**
   * Remove duplicate articles by URL and title
   * Uses both URL and normalized title to catch duplicates from different sources
   */
  private deduplicateArticles(articles: INewsArticle[]): INewsArticle[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    
    return articles.filter(article => {
      // Normalize title for comparison (lowercase, remove extra spaces)
      const normalizedTitle = article.title
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      
      // Check if we've seen this URL or a very similar title
      if (seenUrls.has(article.url)) {
        console.log(`[Dedup] Skipping duplicate URL: ${article.title}`);
        return false;
      }
      
      if (seenTitles.has(normalizedTitle)) {
        console.log(`[Dedup] Skipping duplicate title: ${article.title}`);
        return false;
      }
      
      // Add to seen sets
      seenUrls.add(article.url);
      seenTitles.add(normalizedTitle);
      return true;
    });
  }

  /**
   * Get usage statistics for all sources
   */
  async getUsageStats(): Promise<any[]> {
    const configs = await NewsAPIConfig.find();
    
    return configs.map(config => ({
      provider: config.provider,
      name: config.name,
      isEnabled: config.isEnabled,
      dailyLimit: config.rateLimit.requestsPerDay,
      dailyUsage: config.rateLimit.currentDayUsage,
      dailyRemaining: config.rateLimit.requestsPerDay - config.rateLimit.currentDayUsage,
      hourlyLimit: config.rateLimit.requestsPerHour,
      hourlyUsage: config.rateLimit.currentHourUsage,
      hourlyRemaining: config.rateLimit.requestsPerHour 
        ? config.rateLimit.requestsPerHour - config.rateLimit.currentHourUsage 
        : null,
      totalArticlesFetched: config.totalArticlesFetched,
      lastFetchedAt: config.lastFetchedAt,
      lastSuccessfulFetch: config.lastSuccessfulFetch,
      lastError: config.lastError,
    }));
  }
}

export const newsAggregator = new NewsAggregatorService();