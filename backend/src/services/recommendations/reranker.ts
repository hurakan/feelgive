import { NonprofitCandidate, TrustVettingSignals } from '../everyorg/client.js';
import { ArticleEntities } from './candidateGenerator.js';

/**
 * Geographic tier for ranking
 */
export type GeoTier = 'tier1' | 'tier2' | 'tier3';

/**
 * Ranked nonprofit with scoring breakdown
 */
export interface NonprofitRanked extends NonprofitCandidate {
  score: {
    total: number;
    geo: number;
    cause: number;
    trust: number;
    quality: number;
  };
  geoTier: GeoTier;
  reasons: string[];
  scoreBreakdown: string;
  trustVetting?: TrustVettingSignals;
}

/**
 * Reranking input
 */
export interface RerankingInput {
  candidates: NonprofitCandidate[];
  entities: ArticleEntities;
  causes: string[];
  articleKeywords: string[];
  trustProvider?: (org: NonprofitCandidate) => Promise<TrustVettingSignals>;
  vettingProvider?: (org: NonprofitCandidate) => Promise<TrustVettingSignals>;
}

/**
 * Reranking result
 */
export interface RerankingResult {
  ranked: NonprofitRanked[];
  geoTierCounts: { tier1: number; tier2: number; tier3: number };
  excludedCounts: { vetting: number; cause: number };
  trustCoverage: number; // percentage with trust scores
}

/**
 * Geographic region mappings for tier 2 (regional neighbors)
 */
const REGIONAL_NEIGHBORS: { [key: string]: string[] } = {
  // North America
  'United States': ['Canada', 'Mexico'],
  'Canada': ['United States'],
  'Mexico': ['United States', 'Guatemala', 'Belize'],
  
  // Europe
  'Turkey': ['Greece', 'Bulgaria', 'Syria', 'Iraq', 'Iran'],
  'Greece': ['Turkey', 'Bulgaria', 'Albania'],
  
  // Asia
  'Bangladesh': ['India', 'Myanmar'],
  'India': ['Bangladesh', 'Pakistan', 'Nepal', 'Sri Lanka'],
  
  // Add more as needed
};

/**
 * Disaster relief related keywords
 */
const DISASTER_RELIEF_KEYWORDS = [
  'disaster', 'relief', 'emergency', 'response', 'humanitarian',
  'crisis', 'aid', 'rescue', 'recovery', 'rebuild', 'shelter',
  'food', 'water', 'medical', 'health', 'refugee', 'displaced',
  'earthquake', 'flood', 'wildfire', 'hurricane', 'tornado',
  'tsunami', 'drought', 'famine', 'conflict', 'war'
];

/**
 * Reranker Service
 * Implements policy-aligned ranking: Geo PRIMARY → Cause SECONDARY → Trust TIEBREAKER
 */
export class Reranker {
  private minQualityScore: number = 0.3;
  private targetTrustScore: number = 90;

  /**
   * Rerank candidates according to policy
   */
  async rerank(input: RerankingInput): Promise<RerankingResult> {
    const { candidates, entities, causes, articleKeywords, trustProvider, vettingProvider } = input;
    
    console.log('🎯 Starting reranking...');
    console.log(`  Candidates: ${candidates.length}`);

    const ranked: NonprofitRanked[] = [];
    const excluded = { vetting: 0, cause: 0 };
    let trustScoreCount = 0;

    // Process each candidate
    for (const candidate of candidates) {
      // Get trust/vetting signals
      const trustVetting = await this.getTrustVettingSignals(
        candidate,
        trustProvider,
        vettingProvider
      );

      // A) Vetting gate (hard filter)
      if (!this.passesVettingGate(candidate, trustVetting)) {
        excluded.vetting++;
        continue;
      }

      // B) Geographic proximity (PRIMARY)
      const geoTier = this.determineGeoTier(candidate, entities.geography);
      const geoScore = this.calculateGeoScore(geoTier);

      // C) Cause alignment (SECONDARY)
      const causeScore = this.calculateCauseScore(candidate, causes, articleKeywords);
      
      // Exclude if no cause match at all (unless candidate pool too small)
      if (causeScore === 0 && ranked.length >= 5) {
        excluded.cause++;
        continue;
      }

      // D) Trust score (TIEBREAKER)
      const trustScore = trustVetting.trustScore || 0;
      if (trustVetting.trustScore !== undefined) {
        trustScoreCount++;
      }

      // E) Quality signals
      const qualityScore = this.calculateQualityScore(candidate);

      // Calculate total score (weighted by priority)
      const total = this.calculateTotalScore({
        geo: geoScore,
        cause: causeScore,
        trust: trustScore,
        quality: qualityScore,
      });

      // Generate reasons
      const reasons = this.generateReasons(
        geoTier,
        causeScore,
        trustVetting,
        qualityScore,
        candidate
      );

      ranked.push({
        ...candidate,
        score: {
          total,
          geo: geoScore,
          cause: causeScore,
          trust: trustScore,
          quality: qualityScore,
        },
        geoTier,
        reasons,
        scoreBreakdown: this.formatScoreBreakdown({
          total,
          geo: geoScore,
          cause: causeScore,
          trust: trustScore,
          quality: qualityScore,
        }),
        trustVetting,
      });
    }

    // Sort by total score (descending)
    ranked.sort((a, b) => {
      // Primary: geo tier (tier1 > tier2 > tier3)
      if (a.geoTier !== b.geoTier) {
        const tierOrder = { tier1: 3, tier2: 2, tier3: 1 };
        return tierOrder[b.geoTier] - tierOrder[a.geoTier];
      }
      
      // Secondary: cause score
      if (Math.abs(a.score.cause - b.score.cause) > 0.1) {
        return b.score.cause - a.score.cause;
      }
      
      // Tiebreaker: trust score
      return b.score.trust - a.score.trust;
    });

    // Apply diversity rule: avoid repeating same primary tag >2 times
    const diversified = this.applyDiversityRule(ranked);

    // Count geo tiers
    const geoTierCounts = {
      tier1: diversified.filter(r => r.geoTier === 'tier1').length,
      tier2: diversified.filter(r => r.geoTier === 'tier2').length,
      tier3: diversified.filter(r => r.geoTier === 'tier3').length,
    };

    const trustCoverage = candidates.length > 0 
      ? (trustScoreCount / candidates.length) * 100 
      : 0;

    console.log('✅ Reranking complete');
    console.log(`  Ranked: ${diversified.length}`);
    console.log(`  Excluded (vetting): ${excluded.vetting}`);
    console.log(`  Excluded (cause): ${excluded.cause}`);
    console.log(`  Trust coverage: ${trustCoverage.toFixed(1)}%`);

    return {
      ranked: diversified,
      geoTierCounts,
      excludedCounts: excluded,
      trustCoverage,
    };
  }

  /**
   * Get trust and vetting signals (pluggable)
   */
  private async getTrustVettingSignals(
    candidate: NonprofitCandidate,
    trustProvider?: (org: NonprofitCandidate) => Promise<TrustVettingSignals>,
    vettingProvider?: (org: NonprofitCandidate) => Promise<TrustVettingSignals>
  ): Promise<TrustVettingSignals> {
    // Try custom providers first
    if (trustProvider) {
      try {
        return await trustProvider(candidate);
      } catch (error) {
        console.warn(`Trust provider failed for ${candidate.slug}:`, error);
      }
    }

    if (vettingProvider) {
      try {
        return await vettingProvider(candidate);
      } catch (error) {
        console.warn(`Vetting provider failed for ${candidate.slug}:`, error);
      }
    }

    // Default: unknown
    return {
      trustScore: undefined,
      vettedStatus: 'unknown',
      source: 'none',
    };
  }

  /**
   * Vetting gate (hard filter)
   */
  private passesVettingGate(
    candidate: NonprofitCandidate,
    trustVetting: TrustVettingSignals
  ): boolean {
    // If definitively false, exclude
    if (trustVetting.vettedStatus === 'unverified') {
      return false;
    }

    // If unknown, apply fallback gating rules
    if (trustVetting.vettedStatus === 'unknown') {
      // Require minimum metadata quality
      if (!candidate.description || !candidate.websiteUrl) {
        return false;
      }

      // Penalize legal-name-only patterns (e.g., "JOHN DOE FOUNDATION INC")
      if (this.isLegalNameOnly(candidate.name)) {
        return false;
      }

      // Penalize suspicious/generic name patterns
      if (this.hasSuspiciousNamePattern(candidate.name)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if name is legal-name-only pattern
   */
  private isLegalNameOnly(name: string): boolean {
    const legalSuffixes = /\b(INC|LLC|CORP|CORPORATION|FOUNDATION|TRUST|LTD)\b/i;
    const allCaps = name === name.toUpperCase();
    
    return allCaps && legalSuffixes.test(name);
  }

  /**
   * Check for suspicious or generic name patterns
   */
  private hasSuspiciousNamePattern(name: string): boolean {
    const suspiciousPatterns = [
      /^[A-Z\s]+$/,  // All caps (e.g., "GENERIC CHARITY")
      /\b(FUND|FOUNDATION|TRUST|CHARITY)\s*\d+$/i,  // Generic with numbers (e.g., "FUND 123")
      /^(THE\s+)?[A-Z\s]+(FUND|FOUNDATION|TRUST)$/i,  // Very generic (e.g., "THE CHARITY FUND")
    ];

    return suspiciousPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Determine geographic tier
   */
  private determineGeoTier(
    candidate: NonprofitCandidate,
    geography: { country?: string; region?: string; city?: string }
  ): GeoTier {
    const { country, region, city } = geography;
    const location = candidate.locationAddress?.toLowerCase() || '';

    // Tier 1: Direct match
    if (country && location.includes(country.toLowerCase())) {
      return 'tier1';
    }
    if (region && location.includes(region.toLowerCase())) {
      return 'tier1';
    }
    if (city && location.includes(city.toLowerCase())) {
      return 'tier1';
    }

    // Tier 2: Regional neighbor
    if (country) {
      const neighbors = REGIONAL_NEIGHBORS[country] || [];
      for (const neighbor of neighbors) {
        if (location.includes(neighbor.toLowerCase())) {
          return 'tier2';
        }
      }
    }

    // Tier 3: Global responder
    return 'tier3';
  }

  /**
   * Calculate geo score based on tier
   */
  private calculateGeoScore(tier: GeoTier): number {
    switch (tier) {
      case 'tier1': return 100;
      case 'tier2': return 60;
      case 'tier3': return 30;
    }
  }

  /**
   * Calculate cause alignment score
   */
  private calculateCauseScore(
    candidate: NonprofitCandidate,
    causes: string[],
    articleKeywords: string[]
  ): number {
    let score = 0;

    // Check causes
    const orgCauses = (candidate.causes || []).map(c => c.toLowerCase());
    const targetCauses = causes.map(c => c.toLowerCase());
    
    for (const cause of targetCauses) {
      if (orgCauses.includes(cause)) {
        score += 30;
      }
    }

    // Check description for disaster relief keywords
    const description = (candidate.description || '').toLowerCase();
    const ntee = (candidate.nteeCodeMeaning || '').toLowerCase();
    
    for (const keyword of DISASTER_RELIEF_KEYWORDS) {
      if (description.includes(keyword) || ntee.includes(keyword)) {
        score += 5;
        if (score >= 50) break; // Cap at 50 from keywords
      }
    }

    // Check article keywords
    for (const keyword of articleKeywords) {
      if (description.includes(keyword.toLowerCase())) {
        score += 3;
        if (score >= 60) break;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(candidate: NonprofitCandidate): number {
    let score = 0;

    // Has description
    if (candidate.description && candidate.description.length > 50) {
      score += 30;
    }

    // Has website
    if (candidate.websiteUrl) {
      score += 30;
    }

    // Has logo
    if (candidate.logoUrl) {
      score += 10;
    }

    // Has EIN
    if (candidate.ein) {
      score += 10;
    }

    // Has location
    if (candidate.locationAddress) {
      score += 10;
    }

    // Has NTEE code
    if (candidate.nteeCode) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate total score (weighted by policy priority)
   * Updated weights: geo 45%, cause 40%, trust 15%
   */
  private calculateTotalScore(scores: {
    geo: number;
    cause: number;
    trust: number;
    quality: number;
  }): number {
    // Base score with updated weights
    let total = (
      scores.geo * 0.45 +      // 45% - PRIMARY (increased from 40%)
      scores.cause * 0.40 +    // 40% - SECONDARY (increased from 35%)
      scores.trust * 0.15      // 15% - TIEBREAKER (unchanged)
    );

    // Quality is now used for penalties rather than positive weight
    // Apply penalties based on quality issues
    const penalties = this.calculatePenalties(scores.quality);
    total = Math.max(0, total - penalties);

    return total;
  }

  /**
   * Calculate penalties for quality issues
   * Returns penalty points to subtract from total score
   */
  private calculatePenalties(qualityScore: number): number {
    let penalties = 0;

    // Missing website + description: -30 points (0.3 * 100)
    if (qualityScore < 60) {
      penalties += 30;
    }

    // Very low quality (missing most metadata): additional -20 points
    if (qualityScore < 40) {
      penalties += 20;
    }

    return penalties;
  }

  /**
   * Check if organization might be a duplicate/umbrella entry
   * This is used during deduplication in the diversity rule
   */
  private isDuplicateUmbrellaEntry(org: NonprofitRanked, existing: NonprofitRanked[]): boolean {
    const orgName = org.name.toLowerCase();
    
    for (const existingOrg of existing) {
      const existingName = existingOrg.name.toLowerCase();
      
      // Check for umbrella patterns (e.g., "Red Cross" vs "American Red Cross")
      if (orgName.includes(existingName) || existingName.includes(orgName)) {
        // If names are very similar, consider it a duplicate
        const similarity = this.calculateNameSimilarity(orgName, existingName);
        if (similarity > 0.8) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Calculate name similarity (simple Jaccard similarity on words)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const words1 = new Set(name1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(name2.split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate human-readable reasons
   */
  private generateReasons(
    geoTier: GeoTier,
    causeScore: number,
    trustVetting: TrustVettingSignals,
    qualityScore: number,
    candidate: NonprofitCandidate
  ): string[] {
    const reasons: string[] = [];

    // Geo reason
    if (geoTier === 'tier1') {
      reasons.push(`Operates directly in impacted area (${candidate.locationAddress})`);
    } else if (geoTier === 'tier2') {
      reasons.push(`Regional responder (${candidate.locationAddress})`);
    } else {
      reasons.push('Global disaster response organization');
    }

    // Cause reason
    if (causeScore >= 50) {
      reasons.push('Strong disaster relief specialization');
    } else if (causeScore >= 30) {
      reasons.push('Relevant disaster response experience');
    } else if (causeScore > 0) {
      reasons.push('Some disaster relief capability');
    }

    // Trust reason
    if (trustVetting.trustScore !== undefined) {
      reasons.push(`Trust score: ${trustVetting.trustScore}% (${trustVetting.source})`);
    } else {
      reasons.push('Trust score unavailable; tie-breaker skipped');
    }

    // Vetting reason
    if (trustVetting.vettedStatus === 'verified') {
      reasons.push('Partner-reviewed organization');
    } else if (trustVetting.vettedStatus === 'unknown') {
      reasons.push('Vetting status unknown; passed quality checks');
    }

    // Quality reason
    if (qualityScore >= 80) {
      reasons.push('Complete profile with verified information');
    }

    return reasons;
  }

  /**
   * Format score breakdown
   */
  private formatScoreBreakdown(scores: {
    total: number;
    geo: number;
    cause: number;
    trust: number;
    quality: number;
  }): string {
    return `Total: ${scores.total.toFixed(1)} (Geo: ${scores.geo}, Cause: ${scores.cause}, Trust: ${scores.trust}, Quality: ${scores.quality})`;
  }

  /**
   * Apply diversity rule: avoid repeating same primary tag >2 times
   */
  private applyDiversityRule(ranked: NonprofitRanked[]): NonprofitRanked[] {
    const tagCounts = new Map<string, number>();
    const diversified: NonprofitRanked[] = [];

    for (const org of ranked) {
      const tag = org.primaryCategory || 'unknown';
      const count = tagCounts.get(tag) || 0;

      if (count < 2) {
        diversified.push(org);
        tagCounts.set(tag, count + 1);
      }
    }

    // Add remaining orgs if we have less than 10
    if (diversified.length < 10) {
      for (const org of ranked) {
        if (!diversified.includes(org) && diversified.length < 20) {
          diversified.push(org);
        }
      }
    }

    return diversified;
  }
}

// Export singleton instance
export const reranker = new Reranker();