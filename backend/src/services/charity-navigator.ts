import axios, { AxiosError } from 'axios';
import { circuitBreakerManager } from '../utils/circuit-breaker.js';
import { EINNormalizer } from '../utils/ein-normalizer.js';

/**
 * Charity Navigator API Service
 * Provides charity ratings and accountability scores
 * API Documentation: https://www.charitynavigator.org/index.cfm?bay=content.view&cpid=1397
 * 
 * Note: Requires free API registration for APP_ID and APP_KEY
 */

export interface CharityNavigatorRating {
  score: number; // 0-100
  rating: number; // 0-4 stars
  ratingImage?: string;
}

export interface CharityNavigatorCategory {
  categoryName: string;
  categoryID: string;
}

export interface CharityNavigatorCause {
  causeName: string;
  causeID: string;
}

export interface CharityNavigatorAddress {
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface CharityNavigatorIRSClassification {
  nteeType: string;
  nteeSuffix: string;
  nteeClassification: string;
}

export interface CharityNavigatorOrganization {
  ein: string;
  charityName: string;
  charityNavigatorURL?: string;
  mission?: string;
  websiteURL?: string;
  tagLine?: string;
  charityNavigatorRating?: number;
  currentRating?: CharityNavigatorRating;
  category?: CharityNavigatorCategory;
  cause?: CharityNavigatorCause;
  mailingAddress?: CharityNavigatorAddress;
  irsClassification?: CharityNavigatorIRSClassification;
}

export class CharityNavigatorService {
  private appId: string;
  private appKey: string;
  private baseURL = 'https://api.charitynavigator.org/v2';
  private requestDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;
  private circuitBreaker = circuitBreakerManager.getBreaker('CharityNavigator', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
  });

  constructor() {
    this.appId = process.env.CHARITY_NAVIGATOR_APP_ID || '';
    this.appKey = process.env.CHARITY_NAVIGATOR_APP_KEY || '';
  }

  /**
   * Check if API credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.appId && this.appKey);
  }

  /**
   * Rate limiting helper
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve =>
        setTimeout(resolve, this.requestDelay - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Get organization by EIN
   */
  async getByEIN(ein: string): Promise<CharityNavigatorOrganization | null> {
    if (!this.isConfigured()) {
      console.log('[CharityNavigator] API not configured, skipping');
      return null;
    }

    const normalizedEIN = EINNormalizer.normalize(ein);
    if (!normalizedEIN) {
      throw new Error(`Invalid EIN format: ${ein}`);
    }

    await this.rateLimit();

    return await this.circuitBreaker.execute(async () => {
      try {
        console.log(`[CharityNavigator] Fetching organization: ${normalizedEIN}`);

        const response = await axios.get<CharityNavigatorOrganization[]>(
          `${this.baseURL}/Organizations`,
          {
            params: {
              app_id: this.appId,
              app_key: this.appKey,
              ein: normalizedEIN,
            },
            timeout: 10000,
            headers: {
              'User-Agent': 'FeelGive-Nonprofit-Enrichment/1.0',
            },
          }
        );

        if (!response.data || response.data.length === 0) {
          console.log(`[CharityNavigator] Organization not found: ${normalizedEIN}`);
          return null;
        }

        const org = response.data[0];
        console.log(`[CharityNavigator] Successfully fetched: ${org.charityName}`);
        return org;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;

          if (axiosError.response?.status === 404) {
            console.log(`[CharityNavigator] Organization not found: ${normalizedEIN}`);
            return null;
          }

          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            console.error(`[CharityNavigator] Authentication failed - check API credentials`);
            throw new Error('Charity Navigator authentication failed');
          }

          if (axiosError.response?.status === 429) {
            console.error(`[CharityNavigator] Rate limit exceeded`);
            throw new Error('Charity Navigator API rate limit exceeded');
          }

          console.error(
            `[CharityNavigator] API error for EIN ${normalizedEIN}:`,
            axiosError.response?.status,
            axiosError.message
          );
          throw new Error(`Charity Navigator API error: ${axiosError.message}`);
        }

        throw error;
      }
    });
  }

  /**
   * Search organizations by name
   */
  async searchByName(name: string, limit: number = 10): Promise<CharityNavigatorOrganization[]> {
    if (!this.isConfigured()) {
      console.log('[CharityNavigator] API not configured, skipping');
      return [];
    }

    if (!name || name.trim().length === 0) {
      return [];
    }

    await this.rateLimit();

    return await this.circuitBreaker.execute(async () => {
      try {
        console.log(`[CharityNavigator] Searching for: "${name}"`);

        const response = await axios.get<CharityNavigatorOrganization[]>(
          `${this.baseURL}/Organizations`,
          {
            params: {
              app_id: this.appId,
              app_key: this.appKey,
              search: name.trim(),
              pageSize: limit,
            },
            timeout: 10000,
            headers: {
              'User-Agent': 'FeelGive-Nonprofit-Enrichment/1.0',
            },
          }
        );

        const results = response.data || [];
        console.log(`[CharityNavigator] Found ${results.length} results for "${name}"`);

        return results;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;

          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            console.error(`[CharityNavigator] Authentication failed`);
            throw new Error('Charity Navigator authentication failed');
          }

          if (axiosError.response?.status === 429) {
            console.error(`[CharityNavigator] Rate limit exceeded`);
            throw new Error('Charity Navigator API rate limit exceeded');
          }

          console.error(
            `[CharityNavigator] Search error for "${name}":`,
            axiosError.response?.status,
            axiosError.message
          );
          throw new Error(`Charity Navigator search error: ${axiosError.message}`);
        }

        throw error;
      }
    });
  }

  /**
   * Get organizations by category
   */
  async getByCategory(categoryId: string, limit: number = 10): Promise<CharityNavigatorOrganization[]> {
    if (!this.isConfigured()) {
      console.log('[CharityNavigator] API not configured, skipping');
      return [];
    }

    await this.rateLimit();

    return await this.circuitBreaker.execute(async () => {
      try {
        console.log(`[CharityNavigator] Fetching category: ${categoryId}`);

        const response = await axios.get<CharityNavigatorOrganization[]>(
          `${this.baseURL}/Organizations`,
          {
            params: {
              app_id: this.appId,
              app_key: this.appKey,
              categoryID: categoryId,
              pageSize: limit,
            },
            timeout: 10000,
          }
        );

        return response.data || [];
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(`[CharityNavigator] Category fetch error:`, error.message);
        }
        throw error;
      }
    });
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isConfigured() && this.circuitBreaker.isAvailable();
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      configured: this.isConfigured(),
      circuitBreaker: this.circuitBreaker.getStats(),
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Batch lookup multiple organizations
   */
  async batchLookup(eins: string[]): Promise<Map<string, CharityNavigatorOrganization | null>> {
    if (!this.isConfigured()) {
      console.log('[CharityNavigator] API not configured, returning empty results');
      return new Map();
    }

    const results = new Map<string, CharityNavigatorOrganization | null>();

    for (const ein of eins) {
      try {
        const data = await this.getByEIN(ein);
        results.set(ein, data);
      } catch (error: any) {
        console.error(`[CharityNavigator] Batch lookup failed for ${ein}:`, error.message);
        results.set(ein, null);
      }
    }

    return results;
  }
}

// Export singleton instance
export const charityNavigatorService = new CharityNavigatorService();