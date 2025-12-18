/**
 * Web Search Service
 * Provides web search capability to enhance RAG responses
 * Uses Google Custom Search API
 */

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

interface WebSearchResponse {
  results: SearchResult[];
  searchQuery: string;
  totalResults: number;
}

interface SearchConfig {
  enabled: boolean;
  apiKey?: string;
  searchEngineId?: string;
  maxResults: number;
  cacheEnabled: boolean;
}

class WebSearchService {
  private config: SearchConfig;
  private cache: Map<string, { results: SearchResult[]; timestamp: number }>;
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.config = {
      enabled: process.env.WEB_SEARCH_ENABLED === 'true',
      apiKey: process.env.GOOGLE_SEARCH_API_KEY,
      searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
      maxResults: parseInt(process.env.WEB_SEARCH_MAX_RESULTS || '3', 10),
      cacheEnabled: process.env.WEB_SEARCH_CACHE_ENABLED !== 'false',
    };

    this.cache = new Map();

    // Log configuration status
    if (this.config.enabled) {
      if (!this.config.apiKey || !this.config.searchEngineId) {
        console.warn('Web search is enabled but API credentials are missing');
        this.config.enabled = false;
      } else {
        console.log('Web search service initialized successfully');
      }
    }
  }

  /**
   * Check if web search is available
   */
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey && !!this.config.searchEngineId;
  }

  /**
   * Generate a search query based on user question and article context
   */
  generateSearchQuery(userQuestion: string, articleContext: {
    articleTitle: string;
    geoName: string;
    cause: string;
  }): string {
    // Extract key terms from the question
    const question = userQuestion.toLowerCase();
    
    // If question is about specific aspects, focus the search
    if (question.includes('how can') || question.includes('what can')) {
      return `${articleContext.cause} ${articleContext.geoName} humanitarian response`;
    }
    
    if (question.includes('latest') || question.includes('current') || question.includes('update')) {
      return `latest news ${articleContext.geoName} ${articleContext.cause}`;
    }
    
    if (question.includes('impact') || question.includes('affect')) {
      return `${articleContext.cause} impact ${articleContext.geoName}`;
    }
    
    // Default: combine article context with question keywords
    const keywords = userQuestion
      .replace(/[?.,!]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');
    
    return `${articleContext.geoName} ${articleContext.cause} ${keywords}`;
  }

  /**
   * Perform web search
   */
  async search(query: string): Promise<WebSearchResponse> {
    if (!this.isAvailable()) {
      throw new Error('Web search service is not available');
    }

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getCachedResults(query);
      if (cached) {
        console.log(`Web search cache hit for query: ${query}`);
        return {
          results: cached,
          searchQuery: query,
          totalResults: cached.length,
        };
      }
    }

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.append('key', this.config.apiKey!);
      url.searchParams.append('cx', this.config.searchEngineId!);
      url.searchParams.append('q', query);
      url.searchParams.append('num', this.config.maxResults.toString());

      console.log(`Performing web search for: ${query}`);

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Search API rate limit exceeded');
        }
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json() as {
        items?: Array<{
          title: string;
          link: string;
          snippet: string;
          displayLink?: string;
        }>;
        searchInformation?: {
          totalResults: number;
        };
      };

      const results: SearchResult[] = (data.items || []).map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
      }));

      // Cache the results
      if (this.config.cacheEnabled && results.length > 0) {
        this.cacheResults(query, results);
      }

      console.log(`Web search completed: ${results.length} results found`);

      return {
        results,
        searchQuery: query,
        totalResults: data.searchInformation?.totalResults || results.length,
      };
    } catch (error) {
      console.error('Web search failed:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Web search failed');
    }
  }

  /**
   * Get cached search results
   */
  private getCachedResults(query: string): SearchResult[] | null {
    const cached = this.cache.get(query);
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(query);
      return null;
    }

    return cached.results;
  }

  /**
   * Cache search results
   */
  private cacheResults(query: string, results: SearchResult[]): void {
    // Implement simple LRU by removing oldest entry if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(query, {
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * Format search results for inclusion in prompt
   */
  formatResultsForPrompt(response: WebSearchResponse): string {
    if (response.results.length === 0) {
      return '';
    }

    const formattedResults = response.results
      .map((result, index) => {
        return `${index + 1}. ${result.title}
   Source: ${result.displayLink || result.link}
   ${result.snippet}`;
      })
      .join('\n\n');

    return `ADDITIONAL WEB SEARCH RESULTS:
Search Query: "${response.searchQuery}"

${formattedResults}

Note: These are recent web search results that may provide additional context beyond the article.`;
  }

  /**
   * Clear the cache (useful for testing or maintenance)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Web search cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL,
    };
  }
}

// Export singleton instance
export const webSearchService = new WebSearchService();

// Export types
export type { SearchResult, WebSearchResponse };