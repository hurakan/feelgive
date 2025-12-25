import axios, { AxiosError } from 'axios';

/**
 * Core nonprofit data from Every.org API
 */
export interface NonprofitCandidate {
  slug: string;
  name: string;
  description: string;
  ein?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  locationAddress?: string;
  primaryCategory?: string;
  nteeCode?: string;
  nteeCodeMeaning?: string;
  tags?: string[];
  causes?: string[];
}

/**
 * Enriched nonprofit data with additional details
 */
export interface NonprofitEnriched extends NonprofitCandidate {
  isDisbursable?: boolean;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  categories?: string[];
  profileUrl: string;
}

/**
 * Trust and vetting signals (pluggable interface)
 */
export interface TrustVettingSignals {
  trustScore?: number; // 0-100 if available
  vettedStatus?: 'verified' | 'unverified' | 'unknown';
  source?: string; // e.g., 'every.org', 'charity_navigator', 'internal'
}

/**
 * Search options for Every.org API
 */
export interface SearchOptions {
  causes?: string[];
  take?: number;
  page?: number;
}

/**
 * Browse options for cause-based browsing
 */
export interface BrowseOptions {
  take?: number;
  page?: number;
}

/**
 * Every.org API client with retry logic and error handling
 */
export class EveryOrgClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms
  private timeout: number = 10000; // 10 seconds

  constructor() {
    this.apiKey = process.env.EVERY_ORG_API_PUBLIC_KEY || '';
    this.baseUrl = 'https://partners.every.org/v0.2';

    if (!this.apiKey) {
      console.warn('⚠️ EVERY_ORG_API_PUBLIC_KEY is not set');
    }
  }

  /**
   * Search nonprofits by term with optional cause filtering
   */
  async searchNonprofits(
    searchTerm: string,
    options: SearchOptions = {}
  ): Promise<NonprofitCandidate[]> {
    const { causes, take = 50 } = options;
    
    try {
      // Encode search term for URL
      const encodedTerm = encodeURIComponent(searchTerm.trim());
      const url = `${this.baseUrl}/search/${encodedTerm}`;

      const params: any = {
        apiKey: this.apiKey,
        take,
      };

      // Add causes if provided
      if (causes && causes.length > 0) {
        params.causes = causes.join(',');
      }

      const response = await this.retryRequest(() =>
        axios.get(url, { params, timeout: this.timeout })
      );

      return this.transformNonprofits(response.data?.nonprofits || []);
    } catch (error) {
      console.error(`Error searching nonprofits for "${searchTerm}":`, error);
      return []; // Return empty array on error to allow partial results
    }
  }

  /**
   * Browse nonprofits by cause
   */
  async browseCause(
    cause: string,
    options: BrowseOptions = {}
  ): Promise<NonprofitCandidate[]> {
    const { take = 50, page = 1 } = options;

    try {
      const url = `${this.baseUrl}/browse/${encodeURIComponent(cause)}`;
      
      const params = {
        apiKey: this.apiKey,
        take,
        page,
      };

      const response = await this.retryRequest(() =>
        axios.get(url, { params, timeout: this.timeout })
      );

      return this.transformNonprofits(response.data?.nonprofits || []);
    } catch (error) {
      console.error(`Error browsing cause "${cause}":`, error);
      return [];
    }
  }

  /**
   * Get detailed nonprofit information by slug or EIN
   */
  async getNonprofitDetails(
    identifier: string
  ): Promise<NonprofitEnriched | null> {
    try {
      const url = `${this.baseUrl}/nonprofit/${encodeURIComponent(identifier)}`;
      
      const params = {
        apiKey: this.apiKey,
      };

      const response = await this.retryRequest(() =>
        axios.get(url, { params, timeout: this.timeout })
      );

      const data = response.data?.nonprofit;
      if (!data) return null;

      return this.transformEnrichedNonprofit(data);
    } catch (error) {
      console.error(`Error fetching nonprofit details for "${identifier}":`, error);
      return null;
    }
  }

  /**
   * Transform API response to NonprofitCandidate
   */
  private transformNonprofits(nonprofits: any[]): NonprofitCandidate[] {
    return nonprofits.map(org => ({
      slug: org.slug || '',
      name: org.name || '',
      description: org.description || '',
      ein: org.ein,
      logoUrl: org.logoUrl,
      coverImageUrl: org.coverImageUrl,
      websiteUrl: org.websiteUrl,
      locationAddress: org.locationAddress,
      primaryCategory: org.primaryCategory,
      nteeCode: org.nteeCode,
      nteeCodeMeaning: org.nteeCodeMeaning,
      tags: org.tags || [],
      causes: org.causes || [],
    }));
  }

  /**
   * Transform API response to NonprofitEnriched
   */
  private transformEnrichedNonprofit(data: any): NonprofitEnriched {
    const base = this.transformNonprofits([data])[0];
    
    return {
      ...base,
      isDisbursable: data.isDisbursable,
      location: this.parseLocation(data.locationAddress),
      categories: data.categories || [],
      profileUrl: `https://www.every.org/${base.slug}`,
    };
  }

  /**
   * Parse location from address string
   */
  private parseLocation(address?: string): { city?: string; state?: string; country?: string } {
    if (!address) return {};

    const parts = address.split(',').map(p => p.trim());
    
    // Simple heuristic: last part is usually country, second-to-last is state
    return {
      country: parts.length > 0 ? parts[parts.length - 1] : undefined,
      state: parts.length > 1 ? parts[parts.length - 2] : undefined,
      city: parts.length > 2 ? parts[0] : undefined,
    };
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Don't retry on 4xx errors (except 429)
      if (axiosError.response?.status && 
          axiosError.response.status >= 400 && 
          axiosError.response.status < 500 &&
          axiosError.response.status !== 429) {
        throw error;
      }

      // Retry on 5xx or 429 or network errors
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying request (attempt ${attempt + 1}/${this.maxRetries}) after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }
}

// Export singleton instance
export const everyOrgClient = new EveryOrgClient();