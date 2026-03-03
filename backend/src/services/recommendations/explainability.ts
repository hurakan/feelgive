/**
 * Explainability System
 * 
 * Generates clear, actionable "why recommended" explanations for each organization.
 * Provides 2-3 bullet points covering geographic match, cause alignment, and trust signals.
 */

import { 
  RankedOrg, 
  GeoMatchLevel, 
  RecommendationReason, 
  OrgProfile,
  ScoreBreakdown 
} from './types.js';
import { getGeoBadge } from './geoMatcher.js';

/**
 * Generate explainability reasons for a ranked organization
 */
export function generateExplainability(
  org: OrgProfile,
  geoMatchLevel: GeoMatchLevel,
  scoreBreakdown: ScoreBreakdown,
  articleCountry: string,
  articleAdmin1?: string
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];

  // 1. Geographic match explanation (always first)
  reasons.push(generateGeoReason(org, geoMatchLevel, articleCountry, articleAdmin1));

  // 2. Cause match explanation (if significant)
  if (scoreBreakdown.cause >= 30) {
    reasons.push(generateCauseReason(org, scoreBreakdown.cause));
  }

  // 3. Trust signals explanation (if available)
  if (scoreBreakdown.trust > 0 || org.trustSignals?.verified) {
    reasons.push(generateTrustReason(org, scoreBreakdown.trust));
  }

  // 4. Global responder badge (if applicable)
  if (geoMatchLevel === GeoMatchLevel.GLOBAL) {
    reasons.push({
      type: 'global',
      text: 'Experienced global disaster response organization',
    });
  }

  // Limit to 3 most important reasons
  return reasons.slice(0, 3);
}

/**
 * Generate geographic match reason
 */
function generateGeoReason(
  org: OrgProfile,
  geoMatchLevel: GeoMatchLevel,
  articleCountry: string,
  articleAdmin1?: string
): RecommendationReason {
  const location = formatLocation(org.location);

  switch (geoMatchLevel) {
    case GeoMatchLevel.EXACT_ADMIN1:
      return {
        type: 'geographic',
        text: `Based in ${articleAdmin1 || articleCountry} - direct local presence (${location})`,
      };

    case GeoMatchLevel.EXACT_COUNTRY:
      return {
        type: 'geographic',
        text: `Operates in ${articleCountry} - national presence (${location})`,
      };

    case GeoMatchLevel.REGIONAL:
      return {
        type: 'geographic',
        text: `Regional responder serving ${articleCountry} area (${location})`,
      };

    case GeoMatchLevel.GLOBAL:
      return {
        type: 'geographic',
        text: `Global disaster response organization (based in ${location})`,
      };

    case GeoMatchLevel.MISMATCH:
    default:
      return {
        type: 'geographic',
        text: `Organization location: ${location}`,
      };
  }
}

/**
 * Generate cause alignment reason
 */
function generateCauseReason(
  org: OrgProfile,
  causeScore: number
): RecommendationReason {
  const description = org.description?.toLowerCase() || '';
  
  // Identify specific cause keywords
  const causeKeywords = extractCauseKeywords(description);
  
  if (causeScore >= 70) {
    return {
      type: 'cause',
      text: `Strong specialization in ${causeKeywords.join(', ')} - highly relevant mission`,
    };
  } else if (causeScore >= 50) {
    return {
      type: 'cause',
      text: `Mission includes ${causeKeywords.join(', ')} - relevant experience`,
    };
  } else {
    return {
      type: 'cause',
      text: `Works in related areas: ${causeKeywords.join(', ')}`,
    };
  }
}

/**
 * Generate trust signals reason
 */
function generateTrustReason(
  org: OrgProfile,
  trustScore: number
): RecommendationReason {
  const signals: string[] = [];

  // Check for verification
  if (org.trustSignals?.verified) {
    signals.push('verified profile');
  }

  // Check for ratings
  if (org.trustSignals?.charityNavigatorRating) {
    signals.push(`Charity Navigator rated`);
  }

  if (org.trustSignals?.guidestarRating) {
    signals.push(`GuideStar certified`);
  }

  // Check for transparency signals
  if (org.websiteUrl && org.description) {
    signals.push('complete transparency profile');
  }

  if (signals.length > 0) {
    return {
      type: 'trust',
      text: `Trust signals: ${signals.join(', ')}`,
    };
  } else if (trustScore > 0) {
    return {
      type: 'trust',
      text: `Trust score: ${trustScore.toFixed(0)}/100`,
    };
  } else {
    return {
      type: 'trust',
      text: 'Meets quality standards for profile completeness',
    };
  }
}

/**
 * Extract cause keywords from description
 */
function extractCauseKeywords(description: string): string[] {
  const keywords: string[] = [];
  
  const causePatterns = [
    { pattern: /disaster\s+relief/i, keyword: 'disaster relief' },
    { pattern: /emergency\s+response/i, keyword: 'emergency response' },
    { pattern: /humanitarian\s+aid/i, keyword: 'humanitarian aid' },
    { pattern: /refugee/i, keyword: 'refugee support' },
    { pattern: /food\s+security/i, keyword: 'food security' },
    { pattern: /water/i, keyword: 'water access' },
    { pattern: /shelter/i, keyword: 'shelter' },
    { pattern: /medical|health/i, keyword: 'medical aid' },
    { pattern: /education/i, keyword: 'education' },
    { pattern: /children/i, keyword: 'children\'s welfare' },
    { pattern: /earthquake/i, keyword: 'earthquake relief' },
    { pattern: /flood/i, keyword: 'flood relief' },
    { pattern: /wildfire|fire/i, keyword: 'wildfire relief' },
    { pattern: /hurricane|storm/i, keyword: 'hurricane relief' },
    { pattern: /conflict|war/i, keyword: 'conflict response' },
  ];

  for (const { pattern, keyword } of causePatterns) {
    if (pattern.test(description)) {
      keywords.push(keyword);
      if (keywords.length >= 3) break;
    }
  }

  // Fallback if no specific keywords found
  if (keywords.length === 0) {
    keywords.push('humanitarian work');
  }

  return keywords;
}

/**
 * Format location for display
 */
function formatLocation(location: { country?: string; admin1?: string; city?: string }): string {
  const parts: string[] = [];

  if (location.city) {
    parts.push(location.city);
  }

  if (location.admin1) {
    parts.push(location.admin1);
  }

  if (location.country) {
    parts.push(location.country);
  }

  return parts.length > 0 ? parts.join(', ') : 'Location unknown';
}

/**
 * Generate badge text for UI display
 */
export function generateBadge(geoMatchLevel: GeoMatchLevel): string | undefined {
  return getGeoBadge(geoMatchLevel);
}

/**
 * Format score breakdown for display
 */
export function formatScoreBreakdown(breakdown: ScoreBreakdown): string {
  return `Total: ${breakdown.final.toFixed(1)} (Geo: ${breakdown.geo.toFixed(1)}, Cause: ${breakdown.cause.toFixed(1)}, Trust: ${breakdown.trust.toFixed(1)}, Penalties: ${breakdown.penalties.toFixed(1)})`;
}

/**
 * Generate complete explainability for a ranked org
 */
export function enrichWithExplainability(
  org: OrgProfile,
  geoMatchLevel: GeoMatchLevel,
  scoreBreakdown: ScoreBreakdown,
  articleCountry: string,
  articleAdmin1?: string
): RankedOrg {
  const why = generateExplainability(
    org,
    geoMatchLevel,
    scoreBreakdown,
    articleCountry,
    articleAdmin1
  );

  const badge = generateBadge(geoMatchLevel);

  return {
    ...org,
    geoMatchLevel,
    scoreBreakdown,
    why,
    badge,
  };
}