import { everyOrgClient, NonprofitCandidate } from '../everyorg/client.js';

/**
 * Normalized entities extracted from article
 */
export interface ArticleEntities {
  geography: {
    country?: string;
    region?: string;
    city?: string;
  };
  disasterType?: string; // earthquake, wildfire, flood, etc.
  affectedGroup?: string; // refugees, children, etc.
}

/**
 * Input for candidate generation
 */
export interface CandidateGenerationInput {
  articleText: string; // title + description + optional content
  entities: ArticleEntities;
  causes: string[]; // Every.org causes
}

/**
 * Output from candidate generation
 */
export interface CandidateGenerationResult {
  candidates: NonprofitCandidate[];
  searchTermsUsed: string[];
  causesUsed: string[];
  candidateCount: number;
}

/**
 * Candidate Generator Service
 * Generates a pool of nonprofit candidates using browse + search strategies
 */
export class CandidateGenerator {
  private maxCandidates: number = 200;
  private maxSearchTerms: number = 5;
  private maxCausesToBrowse: number = 3;
  private resultsPerQuery: number = 50;

  /**
   * Generate candidate nonprofits for an article
   */
  async generateCandidates(
    input: CandidateGenerationInput
  ): Promise<CandidateGenerationResult> {
    const { entities, causes } = input;
    const candidatesMap = new Map<string, NonprofitCandidate>();
    const searchTermsUsed: string[] = [];
    const causesUsed: string[] = [];

    console.log('🔍 Starting candidate generation...');
    console.log(`  Causes: ${causes.join(', ')}`);
    console.log(`  Geography: ${JSON.stringify(entities.geography)}`);
    console.log(`  Disaster type: ${entities.disasterType || 'none'}`);

    // Step 1: Browse by causes (if available)
    if (causes.length > 0) {
      const causesToBrowse = causes.slice(0, this.maxCausesToBrowse);
      
      for (const cause of causesToBrowse) {
        console.log(`  📚 Browsing cause: ${cause}`);
        const results = await everyOrgClient.browseCause(cause, {
          take: this.resultsPerQuery,
          page: 1,
        });

        results.forEach(org => {
          if (!candidatesMap.has(org.slug)) {
            candidatesMap.set(org.slug, org);
          }
        });

        causesUsed.push(cause);
      }
    }

    // Step 2: Build search terms
    const searchTerms = this.buildSearchTerms(entities);
    const termsToUse = searchTerms.slice(0, this.maxSearchTerms);

    // Step 3: Search for each term
    for (const term of termsToUse) {
      console.log(`  🔎 Searching: "${term}"`);
      
      // Search with causes if available
      const results = await everyOrgClient.searchNonprofits(term, {
        causes: causes.length > 0 ? causes : undefined,
        take: this.resultsPerQuery,
      });

      results.forEach(org => {
        if (!candidatesMap.has(org.slug)) {
          candidatesMap.set(org.slug, org);
        }
      });

      searchTermsUsed.push(term);
    }

    // Step 4: Deduplicate and limit
    const candidates = Array.from(candidatesMap.values()).slice(
      0,
      this.maxCandidates
    );

    console.log(`✅ Generated ${candidates.length} unique candidates`);

    return {
      candidates,
      searchTermsUsed,
      causesUsed,
      candidateCount: candidates.length,
    };
  }

  /**
   * Build search terms from article entities
   */
  private buildSearchTerms(entities: ArticleEntities): string[] {
    const terms: string[] = [];

    // Add disaster type
    if (entities.disasterType) {
      terms.push(entities.disasterType);
      terms.push(`${entities.disasterType} relief`);
    }

    // Add geography-based terms
    const { country, region, city } = entities.geography;
    
    if (country) {
      terms.push(country);
      if (entities.disasterType) {
        terms.push(`${country} ${entities.disasterType}`);
      }
    }

    if (region) {
      terms.push(region);
    }

    if (city) {
      terms.push(city);
    }

    // Add affected group
    if (entities.affectedGroup) {
      terms.push(entities.affectedGroup);
      if (entities.disasterType) {
        terms.push(`${entities.affectedGroup} ${entities.disasterType}`);
      }
    }

    // Add generic disaster relief terms
    if (entities.disasterType) {
      terms.push('disaster relief');
      terms.push('emergency response');
    }

    // Remove duplicates and empty strings
    return [...new Set(terms.filter(t => t && t.trim().length > 0))];
  }
}

// Export singleton instance
export const candidateGenerator = new CandidateGenerator();