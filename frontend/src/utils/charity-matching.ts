import { Charity, Classification, IdentifiedNeed, RankedCharity, CauseCategory, RecommendationReason } from '@/types';
import { VERIFIED_CHARITIES } from '@/data/charities-verified';
import { areNeighboringCountries, areInSameRegion } from './geographic-regions';
import { calculateDataCompleteness } from './every-org-mapper';

/**
 * Adjacent cause mapping for Tier 3 (Related Match)
 * Maps primary causes to related/adjacent causes
 */
const ADJACENT_CAUSES: Record<CauseCategory, CauseCategory[]> = {
  disaster_relief: ['humanitarian_crisis', 'climate_events'],
  humanitarian_crisis: ['disaster_relief', 'social_justice'],
  health_crisis: ['humanitarian_crisis'],
  climate_events: ['disaster_relief'],
  social_justice: ['humanitarian_crisis'],
};

/**
 * Calculate geographic tier for an organization
 * Tier 1: Direct country or city match
 * Tier 2: Neighboring country or same region
 * Tier 3: Global with high flexibility (geographicFlexibility >= 7)
 * Tier 4: Global with low flexibility (geographicFlexibility < 7)
 * Tier 5: No match (filtered out)
 */
function calculateGeographicTier(
  charity: Charity,
  classification: Classification
): { tier: number; reason: string } {
  const { geo, geoName } = classification;
  const charityCountries = charity.countries.map(c => c.toUpperCase());
  const crisisCountry = geo.toUpperCase();
  
  // Tier 1: Direct country match or city match
  if (charityCountries.includes(crisisCountry)) {
    return {
      tier: 1,
      reason: `Operates directly in ${geoName}`
    };
  }
  
  // Check if geoName might be a city - if so, still consider it direct if country matches
  if (geoName && geoName !== geo) {
    const geoNameUpper = geoName.toUpperCase();
    if (charityCountries.includes(geoNameUpper)) {
      return {
        tier: 1,
        reason: `Operates directly in ${geoName}`
      };
    }
  }
  
  // Tier 2: Neighboring country or same region
  for (const charityCountry of charityCountries) {
    if (charityCountry === 'GLOBAL') continue;
    
    // Check if neighboring country
    if (areNeighboringCountries(crisisCountry, charityCountry)) {
      return {
        tier: 2,
        reason: `Operates in neighboring country (${charityCountry})`
      };
    }
    
    // Check if same region
    if (areInSameRegion(crisisCountry, charityCountry)) {
      return {
        tier: 2,
        reason: `Operates in the same region`
      };
    }
  }
  
  // Tier 3 & 4: Global organizations
  if (charityCountries.includes('GLOBAL')) {
    // Tier 3: High flexibility (can deploy rapidly anywhere)
    if (charity.geographicFlexibility >= 7) {
      return {
        tier: 3,
        reason: `Global responder with rapid deployment capability`
      };
    }
    
    // Tier 4: Lower flexibility (slower deployment or partner-based)
    return {
      tier: 4,
      reason: `Global organization with partner network`
    };
  }
  
  // Tier 5: No geographic match
  return {
    tier: 5,
    reason: `Does not operate in this region`
  };
}

/**
 * Calculate cause match level for an organization
 * Level 1: Perfect match (cause + specific need)
 * Level 2: Category match (cause only)
 * Level 3: Related/adjacent match
 * Level 4: No match (filtered out)
 */
function calculateCauseMatchLevel(
  charity: Charity,
  classification: Classification
): { level: number; reason: string } {
  const { cause, identified_needs } = classification;
  
  // Check if primary cause matches
  const hasPrimaryCauseMatch = charity.causes.includes(cause);
  
  if (hasPrimaryCauseMatch) {
    // Level 1: Perfect match - cause + specific needs
    if (identified_needs.length > 0) {
      const matchedNeeds = identified_needs.filter(need =>
        charity.addressedNeeds.includes(need)
      );
      
      if (matchedNeeds.length > 0) {
        const needsList = matchedNeeds
          .map(n => n.replace(/_/g, ' '))
          .join(', ');
        return {
          level: 1,
          reason: `Directly addresses ${needsList} needs`
        };
      }
    }
    
    // Level 2: Category match only
    return {
      level: 2,
      reason: `Specializes in ${cause.replace(/_/g, ' ')}`
    };
  }
  
  // Level 3: Adjacent/related cause
  const adjacentCauses = ADJACENT_CAUSES[cause] || [];
  const hasAdjacentMatch = charity.causes.some(c => adjacentCauses.includes(c));
  
  if (hasAdjacentMatch) {
    const matchedCause = charity.causes.find(c => adjacentCauses.includes(c));
    return {
      level: 3,
      reason: `Related expertise in ${matchedCause?.replace(/_/g, ' ')}`
    };
  }
  
  // Level 4: No match
  return {
    level: 4,
    reason: `Does not match crisis type`
  };
}

/**
 * Generate detailed recommendation reasons for transparency
 */
function generateRecommendationReasons(
  charity: Charity,
  classification: Classification,
  geoTier: number,
  geoReason: string,
  causeLevel: number,
  causeReason: string
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];
  
  // Geographic reason (primary if tier 1-2)
  if (geoTier <= 2) {
    reasons.push({
      type: 'geographic',
      label: geoReason,
      description: `This organization ${geoReason.toLowerCase()}, making them well-positioned to respond effectively to this crisis.`,
      strength: 'primary'
    });
  } else if (geoTier === 3) {
    reasons.push({
      type: 'geographic',
      label: geoReason,
      description: `This organization ${geoReason.toLowerCase()} and can deploy resources quickly to crisis zones worldwide.`,
      strength: 'secondary'
    });
  } else if (geoTier === 4) {
    reasons.push({
      type: 'geographic',
      label: geoReason,
      description: `This organization ${geoReason.toLowerCase()} and may be able to assist through partnerships.`,
      strength: 'supporting'
    });
  }
  
  // Cause match reason (primary if level 1)
  if (causeLevel === 1) {
    reasons.push({
      type: 'cause',
      label: causeReason,
      description: `This organization ${causeReason.toLowerCase()}, directly matching the identified crisis needs.`,
      strength: 'primary'
    });
  } else if (causeLevel === 2) {
    reasons.push({
      type: 'cause',
      label: causeReason,
      description: `This organization ${causeReason.toLowerCase()}, making them relevant for this type of crisis.`,
      strength: 'secondary'
    });
  } else if (causeLevel === 3) {
    reasons.push({
      type: 'cause',
      label: causeReason,
      description: `This organization has ${causeReason.toLowerCase()}, which may be applicable to this situation.`,
      strength: 'supporting'
    });
  }
  
  // Trust score reason
  if (charity.trustScore >= 95) {
    reasons.push({
      type: 'trust',
      label: `${charity.trustScore}% Trust Score`,
      description: 'This organization has an exceptional trust score based on verified data, transparency, and track record.',
      strength: 'supporting'
    });
  } else if (charity.trustScore >= 90) {
    reasons.push({
      type: 'trust',
      label: `${charity.trustScore}% Trust Score`,
      description: 'This organization has a high trust score indicating strong credibility and transparency.',
      strength: 'supporting'
    });
  }
  
  // Rapid response capability
  if (charity.geographicFlexibility >= 9) {
    reasons.push({
      type: 'rapid_response',
      label: 'Rapid Response Capability',
      description: 'This organization has demonstrated ability to deploy quickly to emerging crises worldwide.',
      strength: 'supporting'
    });
  }
  
  // Vetting level
  if (charity.vettingLevel === 'pg_direct') {
    reasons.push({
      type: 'vetting',
      label: 'Directly Vetted',
      description: 'This organization has been directly vetted and verified by FeelGive for quality and impact.',
      strength: 'supporting'
    });
  }
  
  // Specific needs matching
  if (classification.identified_needs.length > 0) {
    const matchedNeeds = classification.identified_needs.filter(need =>
      charity.addressedNeeds.includes(need)
    );
    if (matchedNeeds.length > 0) {
      const needsList = matchedNeeds.map(n => n.replace(/_/g, ' ')).join(', ');
      reasons.push({
        type: 'needs',
        label: `Addresses ${matchedNeeds.length} identified need${matchedNeeds.length > 1 ? 's' : ''}`,
        description: `This organization specifically addresses: ${needsList}.`,
        strength: matchedNeeds.length >= 3 ? 'primary' : 'secondary'
      });
    }
  }
  
  return reasons;
}

/**
 * Match charities using the new hierarchical tiered ranking algorithm
 * Returns ranked charities with explainability metadata
 *
 * @param classification - The classification result
 * @param availableCharities - Optional list of charities to match from (defaults to verified charities)
 * @returns Array of RankedCharity objects sorted by relevance
 */
export function matchCharities(
  classification: Classification,
  availableCharities: Charity[] = VERIFIED_CHARITIES
): RankedCharity[] {
  const { cause, geo, geoName, identified_needs } = classification;
  
  console.log('🎯 New Tiered Ranking Algorithm:');
  console.log(`   - Crisis: ${cause} in ${geoName} (${geo})`);
  console.log(`   - Needs: ${identified_needs.join(', ')}`);
  console.log(`   - Available charities: ${availableCharities.length}`);
  
  // Filter active charities only
  const activeCharities = availableCharities.filter(charity => charity.isActive);
  
  // Calculate tiers for each charity
  const rankedCharities: RankedCharity[] = activeCharities.map(charity => {
    // Calculate geographic tier
    const geoResult = calculateGeographicTier(charity, classification);
    
    // Calculate cause match level
    const causeResult = calculateCauseMatchLevel(charity, classification);
    
    // Calculate composite score for debugging (lower is better)
    // Primary: geo tier, Secondary: cause level, Tertiary: trust score (inverted)
    const final_rank_score =
      (geoResult.tier * 1000) +
      (causeResult.level * 100) +
      (100 - charity.trustScore);
    
    // Generate detailed recommendation reasons
    const recommendation_reasons = generateRecommendationReasons(
      charity,
      classification,
      geoResult.tier,
      geoResult.reason,
      causeResult.level,
      causeResult.reason
    );
    
    // Calculate data completeness
    const data_completeness = charity.websiteUrl !== undefined
      ? calculateDataCompleteness({
          slug: charity.slug,
          name: charity.name,
          description: charity.description,
          websiteUrl: charity.websiteUrl,
          ein: charity.ein,
          locationAddress: charity.locationAddress,
          nteeCode: charity.nteeCode,
        })
      : {
          has_description: Boolean(charity.description && charity.description.length > 50),
          has_website: Boolean(charity.websiteUrl),
          has_location: Boolean(charity.locationAddress),
          has_ein: Boolean(charity.ein),
          completeness_score: 70, // Default for legacy charities
        };
    
    return {
      ...charity,
      geographic_tier: geoResult.tier,
      cause_match_level: causeResult.level,
      proximity_reason: geoResult.reason,
      cause_match_reason: causeResult.reason,
      final_rank_score,
      recommendation_reasons,
      data_completeness,
    };
  });
  
  // Filter out complete mismatches (Tier 5 geo or Level 4 cause)
  let validMatches = rankedCharities.filter(rc => {
    const isValid = rc.geographic_tier <= 4 && rc.cause_match_level <= 3;
    
    if (!isValid) {
      console.log(`🚫 Filtered out: ${rc.name}`);
      console.log(`   - Geographic Tier: ${rc.geographic_tier} (${rc.proximity_reason})`);
      console.log(`   - Cause Level: ${rc.cause_match_level} (${rc.cause_match_reason})`);
      console.log(`   - Countries: ${rc.countries.join(', ')}`);
      console.log(`   - Geographic Flexibility: ${rc.geographicFlexibility}`);
    }
    
    return isValid;
  });
  
  // FALLBACK: If filtering removed everything, relax geographic constraint
  // This prevents the "no organizations" scenario
  if (validMatches.length === 0) {
    console.warn('⚠️ All organizations filtered out - applying fallback strategy');
    console.warn('   Relaxing geographic constraint to include cause-matched orgs');
    
    // Accept organizations with good cause match (Level 1-3) regardless of geography
    validMatches = rankedCharities.filter(rc => {
      const isValid = rc.cause_match_level <= 3;
      
      if (isValid) {
        console.log(`✅ Fallback included: ${rc.name}`);
        console.log(`   - Cause Level: ${rc.cause_match_level} (${rc.cause_match_reason})`);
        console.log(`   - Geographic Tier: ${rc.geographic_tier} (relaxed)`);
      }
      
      return isValid;
    });
    
    console.log(`✅ Fallback strategy resulted in ${validMatches.length} organizations`);
  }
  
  // Sort by hierarchical criteria:
  // 1. Geographic tier (ascending - lower is better)
  // 2. Cause match level (ascending - lower is better)
  // 3. Trust score (descending - higher is better)
  validMatches.sort((a, b) => {
    // Primary: Geographic tier
    if (a.geographic_tier !== b.geographic_tier) {
      return a.geographic_tier - b.geographic_tier;
    }
    
    // Secondary: Cause match level
    if (a.cause_match_level !== b.cause_match_level) {
      return a.cause_match_level - b.cause_match_level;
    }
    
    // Tertiary: Trust score (descending)
    return b.trustScore - a.trustScore;
  });
  
  // Log top 3 for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🏆 Top Ranked Organizations:');
    validMatches.slice(0, 3).forEach((ranked, index) => {
      console.log(`\n${index + 1}. ${ranked.name}`);
      console.log(`   Geographic Tier: ${ranked.geographic_tier} - ${ranked.proximity_reason}`);
      console.log(`   Cause Level: ${ranked.cause_match_level} - ${ranked.cause_match_reason}`);
      console.log(`   Trust Score: ${ranked.trustScore}%`);
      console.log(`   Final Rank Score: ${ranked.final_rank_score}`);
    });
  }
  
  // Return top 3 matches
  return validMatches.slice(0, 3);
}

/**
 * Get charity by ID
 */
export function getCharityById(id: string, charities: Charity[] = VERIFIED_CHARITIES): Charity | undefined {
  return charities.find(c => c.id === id);
}

/**
 * Get charity by slug
 */
export function getCharityBySlug(slug: string, charities: Charity[] = VERIFIED_CHARITIES): Charity | undefined {
  return charities.find(c => c.slug === slug);
}

/**
 * Get vetting level label
 */
export function getVettingLevelLabel(level: Charity['vettingLevel']): string {
  const labels = {
    'pg_direct': 'Directly Vetted',
    'partner_pg_review': 'Partner + FeelGive Reviewed',
    'partner_only': 'Partner Vetted',
  };
  return labels[level];
}

/**
 * Get recommendation reasoning for a ranked charity
 * Uses the explainability metadata from the ranking algorithm
 */
export function getRecommendationReasoning(
  charity: Charity | RankedCharity,
  classification: Classification
): string {
  // Check if this is a RankedCharity with explainability data
  if ('proximity_reason' in charity && 'cause_match_reason' in charity) {
    const ranked = charity as RankedCharity;
    
    const reasons: string[] = [];
    
    // Add geographic reasoning
    reasons.push(ranked.proximity_reason.toLowerCase());
    
    // Add cause reasoning
    reasons.push(ranked.cause_match_reason.toLowerCase());
    
    // Add trust score if exceptional
    if (ranked.trustScore >= 95) {
      reasons.push(`has exceptional trust score (${ranked.trustScore}%)`);
    } else if (ranked.trustScore >= 90) {
      reasons.push(`has high trust score (${ranked.trustScore}%)`);
    }
    
    // Add vetting level if directly vetted
    if (ranked.vettingLevel === 'pg_direct') {
      reasons.push('is directly vetted by FeelGive');
    }
    
    return `Recommended because this organization ${reasons.join(', ')}.`;
  }
  
  // Fallback for non-ranked charities (backward compatibility)
  const reasons: string[] = [];

  // Trust score
  if (charity.trustScore >= 95) {
    reasons.push(`has exceptional trust score (${charity.trustScore}%)`);
  } else if (charity.trustScore >= 90) {
    reasons.push(`has high trust score (${charity.trustScore}%)`);
  }

  // Geographic relevance
  if (charity.countries.includes(classification.geo) || 
      charity.countries.includes(classification.geoName.toLowerCase())) {
    reasons.push(`has direct operations in ${classification.geoName}`);
  } else if (charity.countries.includes('global')) {
    reasons.push(`operates globally with high deployment flexibility`);
  }

  // Needs matching
  if (classification.identified_needs.length > 0) {
    const matchedNeeds = classification.identified_needs.filter(need =>
      charity.addressedNeeds.includes(need)
    );
    if (matchedNeeds.length > 0) {
      const needsList = matchedNeeds.map(n => n.replace(/_/g, ' ')).join(', ');
      reasons.push(`directly addresses identified needs: ${needsList}`);
    }
  }

  // Vetting
  if (charity.vettingLevel === 'pg_direct') {
    reasons.push(`is directly vetted by FeelGive`);
  }

  return reasons.length > 0 
    ? `Recommended because this organization ${reasons.join(', ')}.`
    : `Recommended based on cause alignment and organizational capacity.`;
}