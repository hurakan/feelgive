/**
 * API Client for FeelGive Backend
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP error! status: ${response.status}`,
          success: false,
        };
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
      };
    }
  }

  // Donation endpoints
  async createDonation(donationData: {
    charityId: string;
    charityName: string;
    charitySlug: string;
    amount: number;
    cause: string;
    geo: string;
    geoName: string;
    articleUrl?: string;
    articleTitle?: string;
    userEmail?: string;
  }) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  }

  async getDonations(params?: {
    userEmail?: string;
    cause?: string;
    geo?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/donations${queryString ? `?${queryString}` : ''}`);
  }

  async getDonationStats(userEmail?: string) {
    const queryString = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
    return this.request(`/donations/stats${queryString}`);
  }

  async getMonthlyTotal(userEmail: string) {
    return this.request(`/donations/monthly-total?userEmail=${encodeURIComponent(userEmail)}`);
  }

  // User endpoints
  async getUser(email: string) {
    return this.request(`/users?email=${encodeURIComponent(email)}`);
  }

  async updateUserPreferences(preferences: {
    email: string;
    monthlyCapEnabled?: boolean;
    monthlyCap?: number;
  }) {
    return this.request('/users/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }

  async getUserProfile(email: string) {
    return this.request(`/users/profile?email=${encodeURIComponent(email)}`);
  }

  // Classification endpoints
  async createClassification(classificationData: {
    cause: string;
    tier1_crisis_type: string;
    tier2_root_cause: string;
    identified_needs: string[];
    geo: string;
    geoName: string;
    affectedGroups: string[];
    confidence: number;
    articleTitle?: string;
    articleUrl?: string;
    matchedKeywords: string[];
    relevantExcerpts: string[];
    hasMatchingCharities: boolean;
    detectedThemes?: string[];
    severityAssessment: {
      level: string;
      deathToll?: number;
      peopleAffected?: number;
      systemStatus: string;
      imminentRisk: boolean;
      reasoning: string;
    };
  }) {
    return this.request('/classifications', {
      method: 'POST',
      body: JSON.stringify(classificationData),
    });
  }

  async getClassifications(params?: {
    cause?: string;
    geo?: string;
    articleUrl?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/classifications${queryString ? `?${queryString}` : ''}`);
  }

  async getClassificationByArticle(articleUrl: string) {
    return this.request(`/classifications/by-article?articleUrl=${encodeURIComponent(articleUrl)}`);
  }

  async getClassificationStats() {
    return this.request('/classifications/stats');
  }

  // Organization endpoints
  async searchOrganizations(searchTerm?: string) {
    const queryString = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '';
    return this.request(`/organizations/search${queryString}`);
  }

  async getOrganizationBySlug(slug: string) {
    return this.request(`/organizations/${encodeURIComponent(slug)}`);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export default ApiClient;