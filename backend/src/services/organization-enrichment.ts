import EnrichedOrganization, { IEnrichedOrganization } from '../models/EnrichedOrganization.js';
import IrsBmfRecord from '../models/IrsBmfRecord.js';
import NTEECode from '../models/NTEECode.js';
import { irsBmfIngestionService } from './irs-bmf-ingestion.js';
import { proPublicaService } from './propublica.js';
import { charityNavigatorService } from './charity-navigator.js';
import { EINNormalizer } from '../utils/ein-normalizer.js';

/**
 * Organization Enrichment Service
 * Orchestrates data enrichment from multiple sources with stale-while-revalidate pattern
 * 
 * Data Source Priority:
 * 1. IRS BMF (local, fastest, most reliable)
 * 2. ProPublica (API, detailed financials)
 * 3. Charity Navigator (API, ratings, optional)
 */

export interface EveryOrgData {
  slug: string;
  id: string;
  ein?: string;
  name: string;
  description?: string;
}

export interface EnrichmentResult {
  success: boolean;
  organization: IEnrichedOrganization | null;
  sources: string[];
  errors: string[];
  fromCache: boolean;
}

export class OrganizationEnrichmentService {
  private enrichmentVersion = 1; // Increment when enrichment logic changes
  private staleThresholdDays = 30; // Consider data stale after 30 days

  /**
   * Enrich a single organization with stale-while-revalidate pattern
   * Returns cached data immediately if available, triggers background refresh if stale
   */
  async enrichOrganization(
    everyOrgData: EveryOrgData,
    forceRefresh: boolean = false
  ): Promise<EnrichmentResult> {
    console.log(`[Enrichment] Processing: ${everyOrgData.name} (${everyOrgData.ein})`);

    // Normalize EIN
    const normalizedEIN = EINNormalizer.normalize(everyOrgData.ein);
    if (!normalizedEIN) {
      return {
        success: false,
        organization: null,
        sources: [],
        errors: ['Invalid or missing EIN'],
        fromCache: false,
      };
    }

    // Check for existing enrichment
    const existing = await EnrichedOrganization.findOne({
      ein: normalizedEIN,
    });

    // Stale-while-revalidate logic
    if (existing && !forceRefresh) {
      const needsRefresh = this.needsEnrichment(existing);

      if (!needsRefresh) {
        // Data is fresh, return immediately
        console.log(`[Enrichment] Using fresh cached data for ${everyOrgData.name}`);
        return {
          success: true,
          organization: existing,
          sources: existing.metadata.sourcesUsed,
          errors: [],
          fromCache: true,
        };
      }

      // Data is stale, return cached but trigger background refresh
      console.log(`[Enrichment] Returning stale data, triggering background refresh for ${everyOrgData.name}`);
      
      // Trigger background refresh (don't await)
      this.backgroundEnrich(everyOrgData, normalizedEIN).catch(error => {
        console.error(`[Enrichment] Background refresh failed for ${everyOrgData.name}:`, error);
      });

      return {
        success: true,
        organization: existing,
        sources: existing.metadata.sourcesUsed,
        errors: ['Data is stale, refresh in progress'],
        fromCache: true,
      };
    }

    // No cache or force refresh - perform full enrichment
    return await this.performEnrichment(everyOrgData, normalizedEIN);
  }

  /**
   * Check if organization needs enrichment
   */
  private needsEnrichment(org: IEnrichedOrganization): boolean {
    // Never enriched or failed
    if (!org.metadata.isEnriched || org.metadata.enrichmentStatus === 'failed') {
      return true;
    }

    // Explicit next enrichment date set
    if (org.metadata.nextEnrichmentDue && org.metadata.nextEnrichmentDue < new Date()) {
      return true;
    }

    // Check if stale (older than threshold)
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - this.staleThresholdDays);
    return org.metadata.lastEnrichedAt < staleDate;
  }

  /**
   * Background enrichment (async, no return value)
   */
  private async backgroundEnrich(everyOrgData: EveryOrgData, normalizedEIN: string): Promise<void> {
    console.log(`[Enrichment] Background refresh started for ${everyOrgData.name}`);
    await this.performEnrichment(everyOrgData, normalizedEIN);
    console.log(`[Enrichment] Background refresh completed for ${everyOrgData.name}`);
  }

  /**
   * Perform actual enrichment from all sources
   */
  private async performEnrichment(
    everyOrgData: EveryOrgData,
    normalizedEIN: string
  ): Promise<EnrichmentResult> {
    const sources: string[] = [];
    const errors: string[] = [];

    // Initialize enriched data
    const enrichedData: any = {
      ein: normalizedEIN,
      everyOrgSlug: everyOrgData.slug,
      everyOrgId: everyOrgData.id,
      name: everyOrgData.name, // Use Every.org name (better UX)
      description: everyOrgData.description,
      metadata: {
        isEnriched: false,
        enrichmentStatus: 'pending',
        lastEnrichedAt: new Date(),
        enrichmentVersion: this.enrichmentVersion,
        sourcesUsed: [],
        errorLog: [],
      },
    };

    // Step 1: Try IRS BMF (local, fastest)
    try {
      const irsData = await irsBmfIngestionService.lookupByEIN(normalizedEIN);
      if (irsData) {
        console.log(`[Enrichment] IRS BMF data found for ${everyOrgData.name}`);

        // Get NTEE meaning
        const nteeInfo = await this.getNTEEInfo(irsData.nteeCode);

        enrichedData.classification = {
          nteeCode: irsData.nteeCode,
          majorGroup: nteeInfo.majorGroup,
          description: nteeInfo.description,
          source: 'IRS_BMF',
        };

        enrichedData.location = {
          street: irsData.street,
          city: irsData.city,
          state: irsData.state,
          zip: irsData.zip,
          country: 'USA',
          source: 'IRS_BMF',
        };

        enrichedData.financials = {
          revenue: irsData.revenueAmount,
          assets: irsData.assetAmount,
          fiscalYear: irsData.taxPeriod ? parseInt(irsData.taxPeriod.substring(0, 4)) : undefined,
          source: 'IRS_BMF',
          lastUpdated: new Date(),
        };

        sources.push('IRS_BMF');
      }
    } catch (error: any) {
      console.error(`[Enrichment] IRS BMF error:`, error.message);
      errors.push(`IRS_BMF: ${error.message}`);
      enrichedData.metadata.errorLog.push({
        source: 'IRS_BMF',
        error: error.message,
        timestamp: new Date(),
      });
    }

    // Step 2: Try ProPublica (additional data)
    if (proPublicaService.isAvailable()) {
      try {
        const proPublicaData = await proPublicaService.getByEIN(normalizedEIN);
        if (proPublicaData) {
          console.log(`[Enrichment] ProPublica data found for ${everyOrgData.name}`);

          // Fill in missing classification
          if (!enrichedData.classification && proPublicaData.organization.ntee_code) {
            const nteeInfo = await this.getNTEEInfo(proPublicaData.organization.ntee_code);
            enrichedData.classification = {
              nteeCode: proPublicaData.organization.ntee_code,
              majorGroup: nteeInfo.majorGroup,
              description: nteeInfo.description,
              source: 'PROPUBLICA',
            };
          }

          // Fill in missing location
          if (!enrichedData.location) {
            enrichedData.location = {
              street: proPublicaData.organization.address,
              city: proPublicaData.organization.city,
              state: proPublicaData.organization.state,
              zip: proPublicaData.organization.zipcode,
              country: 'USA',
              source: 'PROPUBLICA',
            };
          }

          // Update/add financial data from latest filing
          if (proPublicaData.filings_with_data && proPublicaData.filings_with_data.length > 0) {
            const latestFiling = proPublicaData.filings_with_data[0];
            enrichedData.financials = {
              revenue: latestFiling.totrevenue,
              expenses: latestFiling.totfuncexpns,
              assets: latestFiling.totassetsend,
              fiscalYear: latestFiling.tax_prd_yr,
              source: 'PROPUBLICA',
              lastUpdated: new Date(),
            };
          }

          sources.push('PROPUBLICA');
        }
      } catch (error: any) {
        console.error(`[Enrichment] ProPublica error:`, error.message);
        errors.push(`PROPUBLICA: ${error.message}`);
        enrichedData.metadata.errorLog.push({
          source: 'PROPUBLICA',
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    // Step 3: Try Charity Navigator (ratings, optional)
    if (charityNavigatorService.isAvailable()) {
      try {
        const cnData = await charityNavigatorService.getByEIN(normalizedEIN);
        if (cnData) {
          console.log(`[Enrichment] Charity Navigator data found for ${everyOrgData.name}`);

          enrichedData.mission = cnData.mission;
          enrichedData.websiteUrl = cnData.websiteURL;

          if (cnData.currentRating) {
            enrichedData.rating = {
              score: cnData.currentRating.score,
              stars: cnData.currentRating.rating,
              source: 'CHARITY_NAVIGATOR',
              lastUpdated: new Date(),
            };
          }

          // Fill in missing classification
          if (!enrichedData.classification && cnData.irsClassification) {
            const nteeCode = cnData.irsClassification.nteeType + cnData.irsClassification.nteeSuffix;
            const nteeInfo = await this.getNTEEInfo(nteeCode);
            enrichedData.classification = {
              nteeCode,
              majorGroup: nteeInfo.majorGroup,
              description: nteeInfo.description,
              source: 'CHARITY_NAVIGATOR',
            };
          }

          sources.push('CHARITY_NAVIGATOR');
        }
      } catch (error: any) {
        console.error(`[Enrichment] Charity Navigator error:`, error.message);
        errors.push(`CHARITY_NAVIGATOR: ${error.message}`);
        enrichedData.metadata.errorLog.push({
          source: 'CHARITY_NAVIGATOR',
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    // Determine enrichment status
    if (sources.length === 0) {
      enrichedData.metadata.enrichmentStatus = 'failed';
      enrichedData.metadata.isEnriched = false;
    } else if (enrichedData.classification && enrichedData.location) {
      enrichedData.metadata.enrichmentStatus = 'complete';
      enrichedData.metadata.isEnriched = true;
    } else {
      enrichedData.metadata.enrichmentStatus = 'partial';
      enrichedData.metadata.isEnriched = true;
    }

    enrichedData.metadata.sourcesUsed = sources;

    // Set next enrichment date (30 days from now)
    const nextEnrichment = new Date();
    nextEnrichment.setDate(nextEnrichment.getDate() + this.staleThresholdDays);
    enrichedData.metadata.nextEnrichmentDue = nextEnrichment;

    // Save to database
    const saved = await this.saveEnrichedData(enrichedData);

    console.log(
      `[Enrichment] Completed for ${everyOrgData.name}: ${enrichedData.metadata.enrichmentStatus} (${sources.length} sources)`
    );

    return {
      success: enrichedData.metadata.isEnriched,
      organization: saved,
      sources,
      errors,
      fromCache: false,
    };
  }

  /**
   * Get NTEE code information
   */
  private async getNTEEInfo(nteeCode?: string): Promise<{
    majorGroup: string;
    description: string;
  }> {
    if (!nteeCode || nteeCode.length === 0) {
      return {
        majorGroup: 'Z',
        description: 'Unknown',
      };
    }

    const majorGroup = nteeCode.charAt(0).toUpperCase();
    
    // Try to get from database
    const nteeRecord = await NTEECode.findOne({ code: nteeCode.toUpperCase() });
    if (nteeRecord) {
      return {
        majorGroup: nteeRecord.majorCategory,
        description: nteeRecord.description,
      };
    }

    // Fallback to static mapping
    const categories: Record<string, string> = {
      A: 'Arts, Culture & Humanities',
      B: 'Education',
      C: 'Environment',
      D: 'Animal-Related',
      E: 'Health Care',
      F: 'Mental Health & Crisis Intervention',
      G: 'Diseases, Disorders & Medical Disciplines',
      H: 'Medical Research',
      I: 'Crime & Legal-Related',
      J: 'Employment',
      K: 'Food, Agriculture & Nutrition',
      L: 'Housing & Shelter',
      M: 'Public Safety, Disaster Preparedness & Relief',
      N: 'Recreation & Sports',
      O: 'Youth Development',
      P: 'Human Services',
      Q: 'International, Foreign Affairs & National Security',
      R: 'Civil Rights, Social Action & Advocacy',
      S: 'Community Improvement & Capacity Building',
      T: 'Philanthropy, Voluntarism & Grantmaking Foundations',
      U: 'Science & Technology',
      V: 'Social Science',
      W: 'Public & Societal Benefit',
      X: 'Religion-Related',
      Y: 'Mutual & Membership Benefit',
      Z: 'Unknown',
    };

    return {
      majorGroup,
      description: categories[majorGroup] || 'Unknown',
    };
  }

  /**
   * Save or update enriched data
   */
  private async saveEnrichedData(data: any): Promise<IEnrichedOrganization> {
    return await EnrichedOrganization.findOneAndUpdate(
      { ein: data.ein },
      data,
      { upsert: true, new: true }
    );
  }

  /**
   * Batch enrich multiple organizations
   * Respects rate limits and processes sequentially
   */
  async enrichBatch(
    organizations: EveryOrgData[],
    forceRefresh: boolean = false
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];

    for (const org of organizations) {
      try {
        const result = await this.enrichOrganization(org, forceRefresh);
        results.push(result);

        // Small delay between enrichments to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error: any) {
        console.error(`[Enrichment] Failed to enrich ${org.name}:`, error.message);
        results.push({
          success: false,
          organization: null,
          sources: [],
          errors: [error.message],
          fromCache: false,
        });
      }
    }

    return results;
  }

  /**
   * Get enrichment statistics
   */
  async getStats(): Promise<{
    total: number;
    complete: number;
    partial: number;
    failed: number;
    pending: number;
    stale: number;
  }> {
    const total = await EnrichedOrganization.countDocuments();
    const complete = await EnrichedOrganization.countDocuments({
      'metadata.enrichmentStatus': 'complete',
    });
    const partial = await EnrichedOrganization.countDocuments({
      'metadata.enrichmentStatus': 'partial',
    });
    const failed = await EnrichedOrganization.countDocuments({
      'metadata.enrichmentStatus': 'failed',
    });
    const pending = await EnrichedOrganization.countDocuments({
      'metadata.enrichmentStatus': 'pending',
    });

    // Count stale records
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - this.staleThresholdDays);
    const stale = await EnrichedOrganization.countDocuments({
      'metadata.lastEnrichedAt': { $lt: staleDate },
      'metadata.enrichmentStatus': { $in: ['complete', 'partial'] },
    });

    return {
      total,
      complete,
      partial,
      failed,
      pending,
      stale,
    };
  }
}

// Export singleton instance
export const organizationEnrichmentService = new OrganizationEnrichmentService();