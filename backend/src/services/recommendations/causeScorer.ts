/**
 * Advanced Cause Relevance Scorer
 * 
 * Part of FeelGive's secret sauce - determines how well an organization's
 * mission aligns with the article's humanitarian cause.
 * 
 * Scoring Components:
 * - Exact Cause Match: +40 points (org.causes includes article cause)
 * - Semantic Match: +30 points (similar causes via keyword expansion)
 * - Keyword Match: +20 points (description contains cause keywords)
 * - NTEE Code Alignment: +10 points (tax classification matches)
 */

import { OrgProfile } from './types.js';

/**
 * Cause relevance score result
 */
export interface CauseRelevanceScore {
  score: number;           // 0-100
  matchType: 'exact' | 'semantic' | 'keyword' | 'none';
  matchedCauses: string[]; // Which causes matched
  confidence: number;      // 0-1
  breakdown: {
    exactMatch: number;
    semanticMatch: number;
    keywordMatch: number;
    nteeMatch: number;
  };
}

/**
 * Cause keyword mappings for semantic matching
 */
const CAUSE_KEYWORDS: Record<string, string[]> = {
  'humanitarian': ['humanitarian', 'relief', 'aid', 'assistance', 'emergency', 'crisis', 'disaster'],
  'disaster-relief': ['disaster', 'relief', 'emergency', 'response', 'recovery', 'rescue'],
  'conflict': ['conflict', 'war', 'peace', 'refugee', 'displaced', 'asylum', 'violence'],
  'health': ['health', 'medical', 'healthcare', 'hospital', 'clinic', 'disease', 'treatment'],
  'education': ['education', 'school', 'learning', 'literacy', 'training', 'scholarship'],
  'poverty': ['poverty', 'economic', 'livelihood', 'income', 'employment', 'microfinance'],
  'hunger': ['hunger', 'food', 'nutrition', 'feeding', 'famine', 'malnutrition'],
  'water': ['water', 'sanitation', 'hygiene', 'clean water', 'wells', 'wash'],
  'shelter': ['shelter', 'housing', 'homeless', 'accommodation', 'temporary housing'],
  'children': ['children', 'child', 'youth', 'orphan', 'family', 'pediatric'],
  'women': ['women', 'girls', 'gender', 'maternal', 'female'],
  'environment': ['environment', 'climate', 'conservation', 'sustainability', 'ecology'],
};

/**
 * NTEE code to cause mapping (simplified)
 */
const NTEE_CAUSE_MAP: Record<string, string[]> = {
  'P': ['humanitarian', 'disaster-relief'], // Human Services
  'Q': ['health'], // Health
  'B': ['education'], // Education
  'K': ['hunger', 'poverty'], // Food, Agriculture
  'L': ['shelter', 'poverty'], // Housing
  'M': ['humanitarian', 'conflict'], // Public Safety
  'S': ['humanitarian', 'disaster-relief'], // Community Improvement
};

/**
 * Advanced Cause Scorer
 */
export class CauseScorer {
  /**
   * Compute cause relevance score for an organization
   */
  computeCauseRelevance(
    org: OrgProfile,
    articleCauses: string[],
    articleContext?: string
  ): CauseRelevanceScore {
    const breakdown = {
      exactMatch: 0,
      semanticMatch: 0,
      keywordMatch: 0,
      nteeMatch: 0,
    };

    const matchedCauses: string[] = [];

    // 1. Exact cause matching (+40 points)
    breakdown.exactMatch = this.matchExactCauses(
      org.categories || [],
      articleCauses,
      matchedCauses
    );

    // 2. Semantic matching via keyword expansion (+30 points)
    breakdown.semanticMatch = this.matchSemanticCauses(
      org.description || '',
      articleCauses,
      matchedCauses
    );

    // 3. Keyword matching in description (+20 points)
    breakdown.keywordMatch = this.matchKeywords(
      org.description || '',
      articleCauses,
      matchedCauses
    );

    // 4. NTEE code alignment (+10 points)
    if (org.raw?.searchHit?.nteeCode) {
      breakdown.nteeMatch = this.matchNTEECode(
        org.raw.searchHit.nteeCode,
        articleCauses,
        matchedCauses
      );
    }

    // Calculate total score
    const totalScore = Math.min(
      100,
      breakdown.exactMatch +
      breakdown.semanticMatch +
      breakdown.keywordMatch +
      breakdown.nteeMatch
    );

    // Determine match type
    let matchType: 'exact' | 'semantic' | 'keyword' | 'none' = 'none';
    if (breakdown.exactMatch > 0) matchType = 'exact';
    else if (breakdown.semanticMatch > 0) matchType = 'semantic';
    else if (breakdown.keywordMatch > 0) matchType = 'keyword';

    // Calculate confidence (0-1)
    const confidence = this.calculateConfidence(breakdown, matchedCauses.length);

    return {
      score: totalScore,
      matchType,
      matchedCauses: [...new Set(matchedCauses)], // Deduplicate
      confidence,
      breakdown,
    };
  }

  /**
   * Match exact causes (org.categories vs article causes)
   */
  private matchExactCauses(
    orgCauses: string[],
    articleCauses: string[],
    matchedCauses: string[]
  ): number {
    let score = 0;
    const normalizedOrgCauses = orgCauses.map(c => c.toLowerCase().trim());

    for (const articleCause of articleCauses) {
      const normalized = articleCause.toLowerCase().trim();
      
      if (normalizedOrgCauses.includes(normalized)) {
        score += 40; // Full points for exact match
        matchedCauses.push(articleCause);
        break; // Only count once
      }
    }

    return Math.min(40, score);
  }

  /**
   * Match semantic causes via keyword expansion
   */
  private matchSemanticCauses(
    orgDescription: string,
    articleCauses: string[],
    matchedCauses: string[]
  ): number {
    let score = 0;
    const descLower = orgDescription.toLowerCase();

    for (const articleCause of articleCauses) {
      const keywords = CAUSE_KEYWORDS[articleCause.toLowerCase()] || [];
      
      // Check if any semantic keywords appear in description
      const matchCount = keywords.filter(kw => descLower.includes(kw)).length;
      
      if (matchCount >= 2) {
        // Strong semantic match (2+ keywords)
        score += 30;
        matchedCauses.push(articleCause);
        break;
      } else if (matchCount === 1) {
        // Weak semantic match (1 keyword)
        score += 15;
      }
    }

    return Math.min(30, score);
  }

  /**
   * Match keywords in description
   */
  private matchKeywords(
    orgDescription: string,
    articleCauses: string[],
    matchedCauses: string[]
  ): number {
    let score = 0;
    const descLower = orgDescription.toLowerCase();

    // Generic humanitarian keywords
    const genericKeywords = [
      'disaster', 'relief', 'emergency', 'humanitarian', 'crisis',
      'aid', 'rescue', 'recovery', 'shelter', 'food', 'water',
      'medical', 'health', 'refugee', 'displaced', 'conflict',
    ];

    const matchCount = genericKeywords.filter(kw => descLower.includes(kw)).length;

    if (matchCount >= 3) {
      score = 20; // Strong keyword presence
    } else if (matchCount >= 2) {
      score = 15; // Moderate keyword presence
    } else if (matchCount >= 1) {
      score = 10; // Weak keyword presence
    }

    return score;
  }

  /**
   * Match NTEE code to causes
   */
  private matchNTEECode(
    nteeCode: string,
    articleCauses: string[],
    matchedCauses: string[]
  ): number {
    // NTEE codes are like "P20" - first letter is category
    const category = nteeCode.charAt(0).toUpperCase();
    const mappedCauses = NTEE_CAUSE_MAP[category] || [];

    for (const articleCause of articleCauses) {
      if (mappedCauses.includes(articleCause.toLowerCase())) {
        matchedCauses.push(articleCause);
        return 10; // NTEE alignment bonus
      }
    }

    return 0;
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(
    breakdown: { exactMatch: number; semanticMatch: number; keywordMatch: number; nteeMatch: number },
    matchedCausesCount: number
  ): number {
    // Confidence based on match strength and diversity
    let confidence = 0;

    if (breakdown.exactMatch > 0) confidence += 0.5;
    if (breakdown.semanticMatch > 0) confidence += 0.3;
    if (breakdown.keywordMatch > 0) confidence += 0.1;
    if (breakdown.nteeMatch > 0) confidence += 0.1;

    // Bonus for multiple matched causes
    if (matchedCausesCount > 1) confidence += 0.1;

    return Math.min(1.0, confidence);
  }
}

// Export singleton instance
export const causeScorer = new CauseScorer();