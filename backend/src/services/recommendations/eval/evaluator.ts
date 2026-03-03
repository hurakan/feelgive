/**
 * Evaluation Harness for Recommendation Engine
 * 
 * Computes metrics to measure recommendation quality:
 * - GeoPrecision@5: Geographic relevance of top 5 recommendations
 * - Relevance@5: Cause/keyword relevance
 * - Coverage: Ability to return sufficient results
 * - ExplainCompleteness: Quality of explanations
 */

import { ArticleSignals, RankedOrg, GeoMatchLevel } from '../types.js';
import { generateQueries } from '../queryBuilder.js';
import { computeGeoMatch } from '../geoMatcher.js';
import { normalizeArticleGeo, normalizeOrgLocation } from '../geoNormalizer.js';

/**
 * Evaluation test case
 */
export interface EvalTestCase {
  id: string;
  name: string;
  articleSignals: ArticleSignals;
  expectedGeo: {
    country: string;
    admin1?: string;
  };
  relevantKeywords?: string[];
  acceptableFallback: boolean;
}

/**
 * Evaluation metrics
 */
export interface EvalMetrics {
  geoPrecision5: number;      // % of top 5 matching geo requirements
  relevance5: number;          // % of top 5 with keyword overlap
  coverage: number;            // % of cases returning >= N results
  explainCompleteness: number; // % with complete explanations
  avgProcessingTime: number;   // Average processing time in ms
}

/**
 * Individual test result
 */
export interface EvalResult {
  testCase: EvalTestCase;
  metrics: {
    geoPrecision5: number;
    relevance5: number;
    hasMinResults: boolean;
    explainCompleteness: number;
    processingTime: number;
  };
  topOrgs: Array<{
    name: string;
    geoMatchLevel: GeoMatchLevel;
    hasWebsite: boolean;
    hasDescription: boolean;
    hasExplanation: boolean;
  }>;
  passed: boolean;
  failures: string[];
}

/**
 * Evaluation configuration
 */
export interface EvalConfig {
  minResults: number;
  geoPrecisionThreshold: number;
  relevanceThreshold: number;
  explainCompletenessThreshold: number;
}

/**
 * Default evaluation configuration
 */
const DEFAULT_CONFIG: EvalConfig = {
  minResults: 5,
  geoPrecisionThreshold: 0.8,
  relevanceThreshold: 0.6,
  explainCompletenessThreshold: 0.85,
};

/**
 * Recommendation Engine Evaluator
 */
export class RecommendationEvaluator {
  private config: EvalConfig;

  constructor(config: Partial<EvalConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate a single test case
   */
  evaluateTestCase(
    testCase: EvalTestCase,
    rankedOrgs: RankedOrg[]
  ): EvalResult {
    const startTime = Date.now();
    const failures: string[] = [];

    // Get top 5 for evaluation
    const top5 = rankedOrgs.slice(0, 5);

    // 1. Compute GeoPrecision@5
    const geoPrecision5 = this.computeGeoPrecision(
      top5,
      testCase.expectedGeo,
      testCase.acceptableFallback
    );

    if (geoPrecision5 < this.config.geoPrecisionThreshold) {
      failures.push(
        `GeoPrecision@5 (${geoPrecision5.toFixed(2)}) below threshold (${this.config.geoPrecisionThreshold})`
      );
    }

    // 2. Compute Relevance@5
    const relevance5 = this.computeRelevance(
      top5,
      testCase.relevantKeywords || []
    );

    if (relevance5 < this.config.relevanceThreshold) {
      failures.push(
        `Relevance@5 (${relevance5.toFixed(2)}) below threshold (${this.config.relevanceThreshold})`
      );
    }

    // 3. Check coverage
    const hasMinResults = rankedOrgs.length >= this.config.minResults;
    if (!hasMinResults) {
      failures.push(
        `Coverage: Only ${rankedOrgs.length} results (min: ${this.config.minResults})`
      );
    }

    // 4. Compute ExplainCompleteness
    const explainCompleteness = this.computeExplainCompleteness(top5);

    if (explainCompleteness < this.config.explainCompletenessThreshold) {
      failures.push(
        `ExplainCompleteness (${explainCompleteness.toFixed(2)}) below threshold (${this.config.explainCompletenessThreshold})`
      );
    }

    const processingTime = Date.now() - startTime;

    return {
      testCase,
      metrics: {
        geoPrecision5,
        relevance5,
        hasMinResults,
        explainCompleteness,
        processingTime,
      },
      topOrgs: top5.map(org => ({
        name: org.name,
        geoMatchLevel: org.geoMatchLevel,
        hasWebsite: !!org.websiteUrl,
        hasDescription: !!org.description,
        hasExplanation: org.why && org.why.length > 0,
      })),
      passed: failures.length === 0,
      failures,
    };
  }

  /**
   * Evaluate multiple test cases
   */
  evaluateTestSuite(
    testCases: EvalTestCase[],
    getRecommendations: (signals: ArticleSignals) => Promise<RankedOrg[]>
  ): Promise<{
    results: EvalResult[];
    aggregateMetrics: EvalMetrics;
    passed: boolean;
  }> {
    return new Promise(async (resolve) => {
      const results: EvalResult[] = [];

      for (const testCase of testCases) {
        const rankedOrgs = await getRecommendations(testCase.articleSignals);
        const result = this.evaluateTestCase(testCase, rankedOrgs);
        results.push(result);
      }

      // Compute aggregate metrics
      const aggregateMetrics = this.computeAggregateMetrics(results);

      // Check if suite passed
      const passed = results.every(r => r.passed);

      resolve({
        results,
        aggregateMetrics,
        passed,
      });
    });
  }

  /**
   * Compute GeoPrecision@5
   * Measures % of top 5 that match expected geographic requirements
   */
  private computeGeoPrecision(
    top5: RankedOrg[],
    expectedGeo: { country: string; admin1?: string },
    acceptableFallback: boolean
  ): number {
    if (top5.length === 0) return 0;

    let matches = 0;

    for (const org of top5) {
      const level = org.geoMatchLevel;

      // Exact admin1 match
      if (expectedGeo.admin1 && level === GeoMatchLevel.EXACT_ADMIN1) {
        matches++;
        continue;
      }

      // Exact country match
      if (level === GeoMatchLevel.EXACT_COUNTRY || level === GeoMatchLevel.EXACT_ADMIN1) {
        matches++;
        continue;
      }

      // Regional match (if fallback acceptable)
      if (acceptableFallback && level === GeoMatchLevel.REGIONAL) {
        matches += 0.5; // Partial credit
        continue;
      }

      // Global responder (if fallback acceptable)
      if (acceptableFallback && level === GeoMatchLevel.GLOBAL) {
        matches += 0.3; // Minimal credit
      }
    }

    return matches / top5.length;
  }

  /**
   * Compute Relevance@5
   * Measures keyword overlap in top 5 organizations
   */
  private computeRelevance(
    top5: RankedOrg[],
    relevantKeywords: string[]
  ): number {
    if (top5.length === 0 || relevantKeywords.length === 0) return 1.0;

    let totalRelevance = 0;

    for (const org of top5) {
      const description = (org.description || '').toLowerCase();
      const name = org.name.toLowerCase();
      const text = `${name} ${description}`;

      let keywordMatches = 0;
      for (const keyword of relevantKeywords) {
        if (text.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }

      totalRelevance += keywordMatches / relevantKeywords.length;
    }

    return totalRelevance / top5.length;
  }

  /**
   * Compute ExplainCompleteness
   * Measures % of orgs with complete explanations (website + description + why)
   */
  private computeExplainCompleteness(orgs: RankedOrg[]): number {
    if (orgs.length === 0) return 0;

    let complete = 0;

    for (const org of orgs) {
      const hasWebsite = !!org.websiteUrl;
      const hasDescription = !!org.description && org.description.length > 50;
      const hasExplanation = org.why && org.why.length >= 2;

      if (hasWebsite && hasDescription && hasExplanation) {
        complete++;
      }
    }

    return complete / orgs.length;
  }

  /**
   * Compute aggregate metrics across all test results
   */
  private computeAggregateMetrics(results: EvalResult[]): EvalMetrics {
    if (results.length === 0) {
      return {
        geoPrecision5: 0,
        relevance5: 0,
        coverage: 0,
        explainCompleteness: 0,
        avgProcessingTime: 0,
      };
    }

    const geoPrecision5 =
      results.reduce((sum, r) => sum + r.metrics.geoPrecision5, 0) / results.length;

    const relevance5 =
      results.reduce((sum, r) => sum + r.metrics.relevance5, 0) / results.length;

    const coverage =
      results.filter(r => r.metrics.hasMinResults).length / results.length;

    const explainCompleteness =
      results.reduce((sum, r) => sum + r.metrics.explainCompleteness, 0) / results.length;

    const avgProcessingTime =
      results.reduce((sum, r) => sum + r.metrics.processingTime, 0) / results.length;

    return {
      geoPrecision5,
      relevance5,
      coverage,
      explainCompleteness,
      avgProcessingTime,
    };
  }

  /**
   * Generate evaluation report
   */
  generateReport(
    results: EvalResult[],
    aggregateMetrics: EvalMetrics
  ): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('RECOMMENDATION ENGINE EVALUATION REPORT');
    lines.push('='.repeat(80));
    lines.push('');

    // Aggregate metrics
    lines.push('AGGREGATE METRICS:');
    lines.push(`  GeoPrecision@5:        ${(aggregateMetrics.geoPrecision5 * 100).toFixed(1)}%`);
    lines.push(`  Relevance@5:           ${(aggregateMetrics.relevance5 * 100).toFixed(1)}%`);
    lines.push(`  Coverage:              ${(aggregateMetrics.coverage * 100).toFixed(1)}%`);
    lines.push(`  ExplainCompleteness:   ${(aggregateMetrics.explainCompleteness * 100).toFixed(1)}%`);
    lines.push(`  Avg Processing Time:   ${aggregateMetrics.avgProcessingTime.toFixed(0)}ms`);
    lines.push('');

    // Pass/fail summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    lines.push(`RESULTS: ${passed}/${results.length} passed, ${failed} failed`);
    lines.push('');

    // Individual test results
    if (failed > 0) {
      lines.push('FAILED TESTS:');
      results.filter(r => !r.passed).forEach(result => {
        lines.push(`  ❌ ${result.testCase.name}`);
        result.failures.forEach(failure => {
          lines.push(`     - ${failure}`);
        });
      });
      lines.push('');
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}

/**
 * Create default evaluator instance
 */
export const evaluator = new RecommendationEvaluator();