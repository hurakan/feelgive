import { Charity, RankedCharity, EveryOrgNonprofit } from '@/types';
import { apiClient } from './api-client';

/**
 * Verifies a list of charities against the backend API.
 * For each charity, it searches the Every.org database via our backend
 * and updates the charity object with verified details if found.
 * Preserves RankedCharity metadata if present.
 */
export async function verifyCharitiesWithBackend<T extends Charity>(charities: T[]): Promise<T[]> {
  console.log('🔍 Verifying charities with backend...', charities.map(c => c.name));
  
  const verifiedCharities = await Promise.all(
    charities.map(async (charity) => {
      try {
        // Search for the organization by name
        console.log(`📡 Searching for verified details for: ${charity.name}`);
        const response = await apiClient.searchOrganizations(charity.name);
        console.log(`📨 Received response for ${charity.name}:`, response);
        
        // Cast response data to the expected shape
        const searchData = response.data as { organizations: EveryOrgNonprofit[] } | undefined;

        if (response.success && searchData && Array.isArray(searchData.organizations) && searchData.organizations.length > 0) {
          // Take the first result as the best match
          const verifiedOrg = searchData.organizations[0];
          console.log(`✅ Verified match found for ${charity.name}: ${verifiedOrg.name} (${verifiedOrg.slug})`);
          
          // Update charity with verified details
          return {
            ...charity,
            name: verifiedOrg.name,
            slug: verifiedOrg.slug,
            description: verifiedOrg.description || charity.description,
            // If the API provides a logo, we could use it here, but our type definition might need checking
            // keeping existing properties that aren't overwritten
            everyOrgVerified: true,
            // Add profile details if available from API response (though search usually returns minimal info)
            profile: {
                ...charity.profile!,
                website: verifiedOrg.websiteUrl || charity.profile?.website || '',
                // Add other fields if available in the future
            }
          };
        } else {
          console.log(`⚠️ No verified match found for ${charity.name}, keeping original data`);
          return charity;
        }
      } catch (error) {
        console.error(`❌ Error verifying charity ${charity.name}:`, error);
        return charity;
      }
    })
  );

  return verifiedCharities;
}