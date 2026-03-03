import axios, { AxiosError } from 'axios';
import { circuitBreakerManager } from '../utils/circuit-breaker.js';
import { EINNormalizer } from '../utils/ein-normalizer.js';

/**
 * ProPublica Nonprofit Explorer API Service
 * Provides access to IRS Form 990 data with circuit breaker protection
 * API Documentation: https://projects.propublica.org/nonprofits/api
 */

export interface ProPublicaOrganization {
  ein: string;
  name: string;
  careofname?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  exemption_number?: string;
  subsection_code?: string;
  affiliation_code?: string;
  classification_codes?: string;
  ruling_date?: string;
  deductibility_code?: string;
  foundation_code?: string;
  activity_codes?: string;
  organization_code?: string;
  exempt_organization_status_code?: string;
  tax_period?: string;
  asset_code?: string;
  income_code?: string;
  filing_requirement_code?: string;
  pf_filing_requirement_code?: string;
  accounting_period?: string;
  asset_amount?: number;
  income_amount?: number;
  revenue_amount?: number;
  ntee_code?: string;
  sort_name?: string;
  created_at?: string;
  updated_at?: string;
  data_source?: string;
  have_extracts?: boolean;
  have_pdfs?: boolean;
  latest_object_id?: string;
}

export interface ProPublicaFiling {
  tax_prd: number;
  tax_prd_yr: number;
  formtype: number;
  pdf_url?: string;
  updated?: string;
  totrevenue?: number;
  totfuncexpns?: number;
  totassetsend?: number;
  totliabend?: number;
  totnetassetend?: number;
}

export interface ProPublicaResponse {
  organization: ProPublicaOrganization;
  filings_with_data?: ProPublicaFiling[];
  filings_without_data?: any[];
}

export interface ProPublicaSearchResult {
  total_results: number;
  organizations: ProPublicaOrganization[];
}

export class ProPublicaService {
  private baseURL = 'https://projects.propublica.org/nonprofits/api/v2';
  private requestDelay = 1000; // 1 second between requests (conservative)
  private lastRequestTime = 0;
  private circuitBreaker = circuitBreakerManager.getBreaker('ProPublica', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
  });

  /**
   * Rate limiting helper
   * Ensures we don't exceed recommended request rate
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
   * Returns organization data and latest filings
   */
  async getByEIN(ein: string): Promise<ProPublicaResponse | null> {
    const normalizedEIN = EINNormalizer.normalize(ein);
    if (!normalizedEIN) {
      throw new Error(`Invalid EIN format: ${ein}`);
    }

    await this.rateLimit();

    return await this.circuitBreaker.execute(async () => {
      try {
        console.log(`[ProPublica] Fetching organization: ${normalizedEIN}`);

        const response = await axios.get<ProPublicaResponse>(
          `${this.baseURL}/organizations/${normalizedEIN}.json`,
          {
            timeout: 10000,
            headers: {
              'User-Agent': 'FeelGive-Nonprofit-Enrichment/1.0',
            },
          }
        );

        console.log(`[ProPublica] Successfully fetched: ${response.data.organization.name}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;

          if (axiosError.response?.status === 404) {
            console.log(`[ProPublica] Organization not found: ${normalizedEIN}`);
            return null;
          }

          if (axiosError.response?.status === 429) {
            console.error(`[ProPublica] Rate limit exceeded`);
            throw new Error('ProPublica API rate limit exceeded');
          }

          console.error(
            `[ProPublica] API error for EIN ${normalizedEIN}:`,
            axiosError.response?.status,
            axiosError.message
          );
          throw new Error(`ProPublica API error: ${axiosError.message}`);
        }

        throw error;
      }
    });
  }

  /**
   * Search organizations by name
   * Returns array of matching organizations
   */
  async searchByName(name: string, limit: number = 10): Promise<ProPublicaOrganization[]> {
    if (!name || name.trim().length === 0) {
      return [];
    }

    await this.rateLimit();

    return await this.circuitBreaker.execute(async () => {
      try {
        console.log(`[ProPublica] Searching for: "${name}"`);

        const response = await axios.get<ProPublicaSearchResult>(
          `${this.baseURL}/search.json`,
          {
            params: {
              q: name.trim(),
            },
            timeout: 10000,
            headers: {
              'User-Agent': 'FeelGive-Nonprofit-Enrichment/1.0',
            },
          }
        );

        const results = response.data.organizations || [];
        console.log(`[ProPublica] Found ${results.length} results for "${name}"`);

        return results.slice(0, limit);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;

          if (axiosError.response?.status === 429) {
            console.error(`[ProPublica] Rate limit exceeded`);
            throw new Error('ProPublica API rate limit exceeded');
          }

          console.error(
            `[ProPublica] Search error for "${name}":`,
            axiosError.response?.status,
            axiosError.message
          );
          throw new Error(`ProPublica search error: ${axiosError.message}`);
        }

        throw error;
      }
    });
  }

  /**
   * Get latest filing for an organization
   * Returns the most recent Form 990 data
   */
  async getLatestFiling(ein: string): Promise<ProPublicaFiling | null> {
    const data = await this.getByEIN(ein);

    if (!data || !data.filings_with_data || data.filings_with_data.length === 0) {
      return null;
    }

    // Filings are already sorted by most recent first
    return data.filings_with_data[0];
  }

  /**
   * Get all filings for an organization
   * Returns array of all available Form 990 filings
   */
  async getAllFilings(ein: string): Promise<ProPublicaFiling[]> {
    const data = await this.getByEIN(ein);

    if (!data || !data.filings_with_data) {
      return [];
    }

    return data.filings_with_data;
  }

  /**
   * Check if service is available
   * Returns true if circuit breaker allows requests
   */
  isAvailable(): boolean {
    return this.circuitBreaker.isAvailable();
  }

  /**
   * Get service statistics
   * Returns circuit breaker stats
   */
  getStats() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Reset circuit breaker
   * Manually reset after fixing issues
   */
  reset(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Batch lookup multiple organizations
   * Respects rate limits and circuit breaker
   */
  async batchLookup(eins: string[]): Promise<Map<string, ProPublicaResponse | null>> {
    const results = new Map<string, ProPublicaResponse | null>();

    for (const ein of eins) {
      try {
        const data = await this.getByEIN(ein);
        results.set(ein, data);
      } catch (error: any) {
        console.error(`[ProPublica] Batch lookup failed for ${ein}:`, error.message);
        results.set(ein, null);
      }
    }

    return results;
  }
}

// Export singleton instance
export const proPublicaService = new ProPublicaService();