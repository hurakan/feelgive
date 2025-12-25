import { useState, useEffect, useCallback } from 'react';
import { Charity, EveryOrgNonprofit } from '@/types';
import { apiClient } from '@/utils/api-client';
import { VERIFIED_CHARITIES as fallbackCharities } from '@/data/charities-verified';
import { mapEveryOrgToCharity, isIrrelevantOrganization } from '@/utils/every-org-mapper';
import { reRankOrganizations, shouldFilterBySearchContext } from '@/utils/organization-ranking';

interface UseOrganizationsResult {
  organizations: Charity[];
  loading: boolean;
  error: string | null;
  refetch: (searchTerm?: string) => Promise<Charity[]>;
}

/**
 * API response format from backend
 * Maps to EveryOrgNonprofit structure
 */
interface OrganizationApiResponse {
  nonprofitId?: string;
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  ein?: string;
  location?: string;
  locationAddress?: string;
  primaryCategory?: string;
  categories?: string[];
  nteeCode?: string;
  nteeCodeMeaning?: string;
}

/**
 * Hook to fetch organizations from the backend API
 * Falls back to hardcoded data if API fails
 * Caches results to avoid unnecessary API calls
 */
export function useOrganizations(searchTerm?: string, fetchOnMount: boolean = true): UseOrganizationsResult {
  const [organizations, setOrganizations] = useState<Charity[]>([]);
  const [loading, setLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, Charity[]>>(new Map());

  const mapApiResponseToCharity = (org: OrganizationApiResponse): Charity => {
    // Convert API response to EveryOrgNonprofit format
    const everyOrgData: EveryOrgNonprofit = {
      slug: org.slug,
      name: org.name,
      description: org.description,
      logoUrl: org.logoUrl,
      coverImageUrl: org.coverImageUrl,
      websiteUrl: org.websiteUrl,
      ein: org.ein,
      locationAddress: org.locationAddress || org.location,
      primaryCategory: org.primaryCategory,
      nteeCode: org.nteeCode,
      nteeCodeMeaning: org.nteeCodeMeaning,
    };
    
    // Use intelligent mapping function
    return mapEveryOrgToCharity(everyOrgData);
  };

  const fetchOrganizations = useCallback(async (search?: string) => {
    const cacheKey = search || 'all';
    
    console.log('🔄 useOrganizations: fetchOrganizations called with search:', search);
    
    // Check cache first
    if (cache.has(cacheKey)) {
      console.log('✅ useOrganizations: Using cached data');
      const cachedData = cache.get(cacheKey)!;
      setOrganizations(cachedData);
      setLoading(false);
      return cachedData;
    }

    console.log('📡 useOrganizations: Fetching from API...');
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.searchOrganizations(search);
      console.log('📡 useOrganizations: API response:', { success: response.success, hasData: !!response.data, error: response.error });

      if (response.success && response.data) {
        const responseData = response.data as any;
        // Backend returns { success, count, organizations }
        const orgs = responseData.organizations || [];
        
        console.log(`✅ useOrganizations: Received ${orgs.length} organizations from API`);
        
        // Convert to EveryOrgNonprofit format for filtering and ranking
        const everyOrgOrgs = orgs.map((org: OrganizationApiResponse): EveryOrgNonprofit => ({
          slug: org.slug,
          name: org.name,
          description: org.description,
          logoUrl: org.logoUrl,
          coverImageUrl: org.coverImageUrl,
          websiteUrl: org.websiteUrl,
          ein: org.ein,
          locationAddress: org.locationAddress || org.location,
          primaryCategory: org.primaryCategory,
          nteeCode: org.nteeCode,
          nteeCodeMeaning: org.nteeCodeMeaning,
        }));
        
        // Filter out irrelevant organizations
        const relevantOrgs = everyOrgOrgs.filter(org =>
          !isIrrelevantOrganization(org, search) &&
          !shouldFilterBySearchContext(org, search || '')
        );
        
        console.log(`✅ useOrganizations: ${relevantOrgs.length} relevant organizations after filtering (removed ${orgs.length - relevantOrgs.length})`);
        
        // Re-rank organizations by relevance if we have a search term
        const rankedOrgs = search ? reRankOrganizations(relevantOrgs, search) : relevantOrgs;
        
        // Map to Charity type
        const mappedOrgs = rankedOrgs.map((org: EveryOrgNonprofit) => mapEveryOrgToCharity(org));
        
        // Update cache
        setCache(prev => new Map(prev).set(cacheKey, mappedOrgs));
        setOrganizations(mappedOrgs);
        console.log(`✅ useOrganizations: Set ${mappedOrgs.length} organizations in state`);
        return mappedOrgs;
      } else {
        throw new Error(response.error || 'Failed to fetch organizations');
      }
    } catch (err) {
      console.error('❌ useOrganizations: Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      
      // Fall back to hardcoded data
      console.log('⚠️ useOrganizations: Falling back to hardcoded charity data');
      setOrganizations(fallbackCharities);
      console.log(`⚠️ useOrganizations: Set ${fallbackCharities.length} fallback charities in state`);
      return fallbackCharities;
    } finally {
      setLoading(false);
      console.log('✅ useOrganizations: Loading complete');
    }
  }, [cache]);

  const refetch = useCallback(async (search?: string): Promise<Charity[]> => {
    // Clear cache for this search term
    const cacheKey = search || 'all';
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
    
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.searchOrganizations(search);
      console.log('📡 refetch: API response:', { success: response.success, hasData: !!response.data, error: response.error });

      if (response.success && response.data) {
        const responseData = response.data as any;
        // Backend returns { success, count, organizations }
        const orgs = responseData.organizations || [];
        
        console.log(`✅ refetch: Received ${orgs.length} organizations from API`);
        
        // Convert to EveryOrgNonprofit format for filtering and ranking
        const everyOrgOrgs = orgs.map((org: OrganizationApiResponse): EveryOrgNonprofit => ({
          slug: org.slug,
          name: org.name,
          description: org.description,
          logoUrl: org.logoUrl,
          coverImageUrl: org.coverImageUrl,
          websiteUrl: org.websiteUrl,
          ein: org.ein,
          locationAddress: org.locationAddress || org.location,
          primaryCategory: org.primaryCategory,
          nteeCode: org.nteeCode,
          nteeCodeMeaning: org.nteeCodeMeaning,
        }));
        
        // Filter out irrelevant organizations
        const relevantOrgs = everyOrgOrgs.filter(org =>
          !isIrrelevantOrganization(org, search) &&
          !shouldFilterBySearchContext(org, search || '')
        );
        
        console.log(`✅ refetch: ${relevantOrgs.length} relevant organizations after filtering (removed ${orgs.length - relevantOrgs.length})`);
        
        // Re-rank organizations by relevance if we have a search term
        const rankedOrgs = search ? reRankOrganizations(relevantOrgs, search) : relevantOrgs;
        
        // Map to Charity type
        const mappedOrgs = rankedOrgs.map((org: EveryOrgNonprofit) => mapEveryOrgToCharity(org));
        
        // Update cache
        setCache(prev => new Map(prev).set(cacheKey, mappedOrgs));
        setOrganizations(mappedOrgs);
        console.log(`✅ refetch: Set ${mappedOrgs.length} organizations in state`);
        
        return mappedOrgs;
      } else {
        throw new Error(response.error || 'Failed to fetch organizations');
      }
    } catch (err) {
      console.error('❌ refetch: Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      
      // Fall back to hardcoded data
      console.log('⚠️ refetch: Falling back to hardcoded charity data');
      setOrganizations(fallbackCharities);
      console.log(`⚠️ refetch: Set ${fallbackCharities.length} fallback charities in state`);
      
      return fallbackCharities;
    } finally {
      setLoading(false);
      console.log('✅ refetch: Loading complete');
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      fetchOrganizations(searchTerm);
    }
  }, [searchTerm, fetchOrganizations, fetchOnMount]);

  return {
    organizations,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a specific organization by slug
 */
export function useOrganization(slug: string) {
  const [organization, setOrganization] = useState<Charity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchOrganization = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getOrganizationBySlug(slug);

        if (response.success && response.data) {
          const responseData = response.data as any;
          // Backend returns { success, organization }
          const org = responseData.organization as OrganizationApiResponse;
          
          // Convert to EveryOrgNonprofit format
          const everyOrgData: EveryOrgNonprofit = {
            slug: org.slug,
            name: org.name,
            description: org.description,
            logoUrl: org.logoUrl,
            coverImageUrl: org.coverImageUrl,
            websiteUrl: org.websiteUrl,
            ein: org.ein,
            locationAddress: org.locationAddress || org.location,
            primaryCategory: org.primaryCategory,
            nteeCode: org.nteeCode,
            nteeCodeMeaning: org.nteeCodeMeaning,
          };
          
          // Map to Charity type
          const mappedOrg = mapEveryOrgToCharity(everyOrgData);
          setOrganization(mappedOrg);
        } else {
          throw new Error(response.error || 'Organization not found');
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch organization');
        
        // Try to find in fallback data
        const fallback = fallbackCharities.find(c => c.slug === slug);
        if (fallback) {
          setOrganization(fallback);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [slug]);

  return {
    organization,
    loading,
    error,
  };
}