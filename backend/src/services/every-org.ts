import axios from 'axios';

/**
 * Interface for Every.org nonprofit data
 */
export interface EveryOrgNonprofit {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  ein?: string;
  locationAddress?: string;
  primaryCategory?: string;
  nteeCode?: string;
  nteeCodeMeaning?: string;
}

/**
 * Interface for Every.org API response
 */
interface EveryOrgApiResponse {
  nonprofits: Array<{
    slug: string;
    name: string;
    description: string;
    logoUrl?: string;
    coverImageUrl?: string;
    websiteUrl?: string;
    ein?: string;
    locationAddress?: string;
    primaryCategory?: string;
    nteeCode?: string;
    nteeCodeMeaning?: string;
  }>;
}

/**
 * Service for interacting with Every.org API
 */
export class EveryOrgService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.EVERY_ORG_API_PUBLIC_KEY || '';
    this.baseUrl = 'https://partners.every.org/v0.2';

    if (!this.apiKey) {
      console.warn('EVERY_ORG_API_PUBLIC_KEY is not set in environment variables');
    }
  }

  /**
   * Search for organizations on Every.org
   * @param searchTerm - The search term (optional, defaults to empty string for all orgs)
   * @returns Array of nonprofit organizations
   */
  async searchOrganizations(searchTerm: string = ''): Promise<EveryOrgNonprofit[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Every.org API key is not configured');
      }

      // Build the search URL - Every.org Partners API v0.2 uses /search/{searchTerm} endpoint
      // Encode the search term to handle special characters properly
      const encodedSearchTerm = encodeURIComponent(searchTerm || '');
      const url = `${this.baseUrl}/search/${encodedSearchTerm}`;
      
      console.log(`Fetching organizations from Every.org: ${searchTerm || 'all'}`);

      const response = await axios.get<EveryOrgApiResponse>(url, {
        params: {
          apiKey: this.apiKey,
        },
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || !response.data.nonprofits) {
        console.warn('Invalid response from Every.org API');
        return [];
      }

      // Transform the response to match our interface
      const nonprofits = response.data.nonprofits.map((org) => ({
        slug: org.slug,
        name: org.name,
        description: org.description || '',
        logoUrl: org.logoUrl,
        coverImageUrl: org.coverImageUrl,
        websiteUrl: org.websiteUrl,
        ein: org.ein,
        locationAddress: org.locationAddress,
        primaryCategory: org.primaryCategory,
        nteeCode: org.nteeCode,
        nteeCodeMeaning: org.nteeCodeMeaning,
      }));

      console.log(`Successfully fetched ${nonprofits.length} organizations`);
      return nonprofits;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Every.org API error:', {
            status: error.response.status,
            data: error.response.data,
          });
          throw new Error(`Every.org API error: ${error.response.status}`);
        } else if (error.request) {
          console.error('No response from Every.org API');
          throw new Error('No response from Every.org API');
        }
      }
      console.error('Error fetching organizations:', error);
      throw new Error('Failed to fetch organizations from Every.org');
    }
  }

  /**
   * Get a specific organization by slug
   * @param slug - The organization slug
   * @returns The nonprofit organization or null if not found
   */
  async getOrganizationBySlug(slug: string): Promise<EveryOrgNonprofit | null> {
    try {
      const organizations = await this.searchOrganizations(slug);
      
      // Find exact match by slug
      const exactMatch = organizations.find(
        (org) => org.slug.toLowerCase() === slug.toLowerCase()
      );

      return exactMatch || null;
    } catch (error) {
      console.error(`Error fetching organization ${slug}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const everyOrgService = new EveryOrgService();