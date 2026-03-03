import EnrichedOrganization from '../models/EnrichedOrganization.js';
import IrsBmfRecord from '../models/IrsBmfRecord.js';

export interface DataQualityReport {
  totalOrganizations: number;
  withNTEE: number;
  withLocation: number;
  withFinancials: number;
  withRatings: number;
  staleData: number;
  erroredEnrichments: number;
  qualityScore: number;
  recommendations: string[];
  generatedAt: Date;
}

export interface QualityMetrics {
  completeness: number;
  freshness: number;
  accuracy: number;
  coverage: number;
}

class DataQualityService {
  /**
   * Generate comprehensive data quality report
   */
  async generateQualityReport(): Promise<DataQualityReport> {
    const [
      totalOrganizations,
      withNTEE,
      withLocation,
      withFinancials,
      withRatings,
      staleData,
      erroredEnrichments
    ] = await Promise.all([
      EnrichedOrganization.countDocuments(),
      EnrichedOrganization.countDocuments({ 'classification.nteeCode': { $exists: true, $ne: null } }),
      EnrichedOrganization.countDocuments({ 
        'location.city': { $exists: true, $ne: null },
        'location.state': { $exists: true, $ne: null }
      }),
      EnrichedOrganization.countDocuments({ 
        'financials.revenue': { $exists: true, $ne: null }
      }),
      EnrichedOrganization.countDocuments({ 
        'ratings.overall': { $exists: true, $ne: null }
      }),
      EnrichedOrganization.countDocuments({ isStale: true }),
      EnrichedOrganization.countDocuments({ 
        'enrichmentStatus.hasErrors': true 
      })
    ]);

    // Calculate quality score (0-100)
    const qualityScore = this.calculateQualityScore({
      totalOrganizations,
      withNTEE,
      withLocation,
      withFinancials,
      staleData,
      erroredEnrichments
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      totalOrganizations,
      withNTEE,
      withLocation,
      withFinancials,
      withRatings,
      staleData,
      erroredEnrichments
    });

    return {
      totalOrganizations,
      withNTEE,
      withLocation,
      withFinancials,
      withRatings,
      staleData,
      erroredEnrichments,
      qualityScore,
      recommendations,
      generatedAt: new Date()
    };
  }

  /**
   * Calculate overall quality score (0-100)
   */
  private calculateQualityScore(metrics: {
    totalOrganizations: number;
    withNTEE: number;
    withLocation: number;
    withFinancials: number;
    staleData: number;
    erroredEnrichments: number;
  }): number {
    if (metrics.totalOrganizations === 0) return 0;

    // Weighted scoring
    const nteeScore = (metrics.withNTEE / metrics.totalOrganizations) * 40; // 40% weight
    const locationScore = (metrics.withLocation / metrics.totalOrganizations) * 30; // 30% weight
    const financialScore = (metrics.withFinancials / metrics.totalOrganizations) * 20; // 20% weight
    const freshnessScore = (1 - (metrics.staleData / metrics.totalOrganizations)) * 5; // 5% weight
    const errorScore = (1 - (metrics.erroredEnrichments / metrics.totalOrganizations)) * 5; // 5% weight

    return Math.round(nteeScore + locationScore + financialScore + freshnessScore + errorScore);
  }

  /**
   * Generate actionable recommendations based on quality metrics
   */
  private generateRecommendations(metrics: {
    totalOrganizations: number;
    withNTEE: number;
    withLocation: number;
    withFinancials: number;
    withRatings: number;
    staleData: number;
    erroredEnrichments: number;
  }): string[] {
    const recommendations: string[] = [];

    // NTEE coverage
    const nteePercentage = (metrics.withNTEE / metrics.totalOrganizations) * 100;
    if (nteePercentage < 80) {
      recommendations.push(
        `NTEE code coverage is ${nteePercentage.toFixed(1)}%. Consider running bulk enrichment to improve classification accuracy.`
      );
    }

    // Location coverage
    const locationPercentage = (metrics.withLocation / metrics.totalOrganizations) * 100;
    if (locationPercentage < 90) {
      recommendations.push(
        `Location data coverage is ${locationPercentage.toFixed(1)}%. This may affect geographic filtering and recommendations.`
      );
    }

    // Financial data
    const financialPercentage = (metrics.withFinancials / metrics.totalOrganizations) * 100;
    if (financialPercentage < 60) {
      recommendations.push(
        `Financial data coverage is ${financialPercentage.toFixed(1)}%. Consider checking ProPublica API connectivity.`
      );
    }

    // Stale data
    const stalePercentage = (metrics.staleData / metrics.totalOrganizations) * 100;
    if (stalePercentage > 20) {
      recommendations.push(
        `${stalePercentage.toFixed(1)}% of enriched data is stale (>30 days old). Background refresh should handle this automatically.`
      );
    }

    // Errors
    const errorPercentage = (metrics.erroredEnrichments / metrics.totalOrganizations) * 100;
    if (errorPercentage > 5) {
      recommendations.push(
        `${errorPercentage.toFixed(1)}% of enrichments have errors. Check circuit breaker status and API connectivity.`
      );
    }

    // Ratings coverage (optional but nice to have)
    const ratingsPercentage = (metrics.withRatings / metrics.totalOrganizations) * 100;
    if (ratingsPercentage < 30) {
      recommendations.push(
        `Charity Navigator ratings coverage is ${ratingsPercentage.toFixed(1)}%. This is optional but improves credibility scoring.`
      );
    }

    // If everything looks good
    if (recommendations.length === 0) {
      recommendations.push('Data quality is excellent! All metrics are within acceptable ranges.');
    }

    return recommendations;
  }

  /**
   * Get detailed quality metrics for a specific organization
   */
  async getOrganizationQualityMetrics(slug: string): Promise<QualityMetrics | null> {
    const org = await EnrichedOrganization.findOne({ slug });
    if (!org) return null;

    // Calculate completeness (0-1)
    let completenessScore = 0;
    let totalFields = 0;

    // Core fields (required)
    totalFields += 3;
    if (org.ein) completenessScore += 1;
    if (org.name) completenessScore += 1;
    if (org.slug) completenessScore += 1;

    // Classification (important)
    totalFields += 2;
    if (org.classification?.nteeCode) completenessScore += 1;
    if (org.classification?.category) completenessScore += 1;

    // Location (important)
    totalFields += 3;
    if (org.location?.city) completenessScore += 1;
    if (org.location?.state) completenessScore += 1;
    if (org.location?.zip) completenessScore += 1;

    // Financials (nice to have)
    totalFields += 2;
    if (org.financials?.revenue) completenessScore += 0.5;
    if (org.financials?.assets) completenessScore += 0.5;

    const completeness = completenessScore / totalFields;

    // Calculate freshness (0-1)
    const daysSinceEnrichment = org.lastEnriched 
      ? (Date.now() - org.lastEnriched.getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    const freshness = Math.max(0, 1 - (daysSinceEnrichment / 30)); // 30 days = 0 freshness

    // Calculate accuracy (0-1) - based on source reliability
    let accuracyScore = 0;
    let sourceCount = 0;

    if (org.dataSources?.irsBmf) {
      accuracyScore += 1; // IRS is most reliable
      sourceCount++;
    }
    if (org.dataSources?.propublica) {
      accuracyScore += 0.9; // ProPublica is very reliable
      sourceCount++;
    }
    if (org.dataSources?.charityNavigator) {
      accuracyScore += 0.8; // Charity Navigator is reliable
      sourceCount++;
    }

    const accuracy = sourceCount > 0 ? accuracyScore / sourceCount : 0;

    // Calculate coverage (0-1) - how many sources were used
    const maxSources = 3;
    const coverage = sourceCount / maxSources;

    return {
      completeness,
      freshness,
      accuracy,
      coverage
    };
  }

  /**
   * Validate organization data and return issues
   */
  async validateOrganization(slug: string): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const org = await EnrichedOrganization.findOne({ slug });
    
    if (!org) {
      return {
        isValid: false,
        issues: ['Organization not found'],
        warnings: []
      };
    }

    const issues: string[] = [];
    const warnings: string[] = [];

    // Critical issues
    if (!org.ein) {
      issues.push('Missing EIN - cannot enrich from external sources');
    }
    if (!org.name) {
      issues.push('Missing organization name');
    }

    // Important warnings
    if (!org.classification?.nteeCode) {
      warnings.push('Missing NTEE code - affects crisis-to-cause matching');
    }
    if (!org.location?.state) {
      warnings.push('Missing state - affects geographic filtering');
    }
    if (!org.location?.city) {
      warnings.push('Missing city - affects local prioritization');
    }

    // Data quality warnings
    if (org.isStale) {
      warnings.push('Data is stale (>30 days old) - will be refreshed on next access');
    }
    if (org.enrichmentStatus?.hasErrors) {
      warnings.push('Previous enrichment attempts had errors - check error log');
    }

    // Source warnings
    if (!org.dataSources?.irsBmf && org.ein) {
      warnings.push('IRS BMF data not found - may need to import IRS database');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Get aggregated quality statistics
   */
  async getQualityStatistics(): Promise<{
    averageCompleteness: number;
    averageFreshness: number;
    averageAccuracy: number;
    averageCoverage: number;
  }> {
    const orgs = await EnrichedOrganization.find().limit(1000); // Sample for performance

    if (orgs.length === 0) {
      return {
        averageCompleteness: 0,
        averageFreshness: 0,
        averageAccuracy: 0,
        averageCoverage: 0
      };
    }

    let totalCompleteness = 0;
    let totalFreshness = 0;
    let totalAccuracy = 0;
    let totalCoverage = 0;

    for (const org of orgs) {
      const metrics = await this.getOrganizationQualityMetrics(org.slug);
      if (metrics) {
        totalCompleteness += metrics.completeness;
        totalFreshness += metrics.freshness;
        totalAccuracy += metrics.accuracy;
        totalCoverage += metrics.coverage;
      }
    }

    return {
      averageCompleteness: totalCompleteness / orgs.length,
      averageFreshness: totalFreshness / orgs.length,
      averageAccuracy: totalAccuracy / orgs.length,
      averageCoverage: totalCoverage / orgs.length
    };
  }
}

export const dataQualityService = new DataQualityService();