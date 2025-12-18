import { Charity, Classification, IdentifiedNeed } from '@/types';
import { VERIFIED_CHARITIES } from '@/data/charities-verified';

interface CharityScore {
  charity: Charity;
  totalScore: number;
  causeScore: number;
  geoScore: number;
  needsScore: number;
  trustScore: number;
  breakdown: string[];
}

/**
 * Match charities based on classification
 * @param classification - The classification result
 * @param availableCharities - Optional list of charities to match from (defaults to verified charities)
 */
export function matchCharities(
  classification: Classification,
  availableCharities: Charity[] = VERIFIED_CHARITIES
): Charity[] {
  const { cause, geo, geoName, identified_needs } = classification;
  
  console.log('🎯 matchCharities called with:');
  console.log(`   - availableCharities.length: ${availableCharities.length}`);
  console.log(`   - Using default VERIFIED_CHARITIES? ${availableCharities === VERIFIED_CHARITIES ? 'YES' : 'NO'}`);
  console.log(`   - cause: ${cause}`);
  
  // Filter charities by cause
  let matches = availableCharities.filter(charity =>
    charity.isActive && charity.causes.includes(cause)
  );
  
  console.log(`   - Matches after cause filter: ${matches.length}`);

  if (matches.length === 0) {
    return [];
  }

  // Score each charity
  const scoredCharities: CharityScore[] = matches.map(charity => {
    const breakdown: string[] = [];
    let totalScore = 0;

    // 1. Cause alignment (base score: 10 points)
    const causeScore = 10;
    totalScore += causeScore;
    breakdown.push(`Cause match: ${causeScore}`);

    // 2. Geographic relevance (0-15 points)
    let geoScore = 0;
    
    // Direct country match
    if (charity.countries.includes(geo) || charity.countries.includes(geoName.toLowerCase())) {
      geoScore += 10;
      breakdown.push(`Direct geographic match: +10`);
    }
    // Global reach
    else if (charity.countries.includes('global')) {
      geoScore += charity.geographicFlexibility * 1.5; // 1.5-7.5 points based on flexibility
      breakdown.push(`Global reach (flexibility ${charity.geographicFlexibility}): +${(charity.geographicFlexibility * 1.5).toFixed(1)}`);
    }
    // Regional proximity (partial match)
    else {
      const hasRegionalMatch = charity.countries.some(country => {
        // Check if any country is in the same region
        const regionMatches = [
          ['US', 'CA', 'MX'].includes(country) && ['US', 'CA', 'MX'].includes(geo),
          ['AF', 'AS', 'SA'].some(r => country.includes(r)) && ['AF', 'AS', 'SA'].some(r => geo.includes(r)),
        ];
        return regionMatches.some(Boolean);
      });
      
      if (hasRegionalMatch) {
        geoScore += 5;
        breakdown.push(`Regional proximity: +5`);
      }
    }
    
    totalScore += geoScore;

    // 3. Needs-based matching (0-20 points)
    let needsScore = 0;
    
    if (identified_needs.length > 0) {
      const matchedNeeds = identified_needs.filter(need => 
        charity.addressedNeeds.includes(need)
      );
      
      if (matchedNeeds.length > 0) {
        // Award points based on percentage of needs matched
        const needsMatchPercentage = matchedNeeds.length / identified_needs.length;
        needsScore = needsMatchPercentage * 20;
        breakdown.push(`Needs match (${matchedNeeds.length}/${identified_needs.length}): +${needsScore.toFixed(1)}`);
      }
    } else {
      // If no specific needs identified, give partial credit
      needsScore = 5;
      breakdown.push(`General capability: +5`);
    }
    
    totalScore += needsScore;

    // 4. Trust score (0-10 points, normalized)
    const trustScore = (charity.trustScore / 100) * 10;
    totalScore += trustScore;
    breakdown.push(`Trust score (${charity.trustScore}%): +${trustScore.toFixed(1)}`);

    // 5. Vetting level bonus (0-5 points)
    const vettingBonus = {
      'pg_direct': 5,
      'partner_pg_review': 3,
      'partner_only': 1,
    }[charity.vettingLevel];
    
    totalScore += vettingBonus;
    breakdown.push(`Vetting level: +${vettingBonus}`);

    return {
      charity,
      totalScore,
      causeScore,
      geoScore,
      needsScore,
      trustScore,
      breakdown
    };
  });

  // Sort by TOTAL COMPOSITE SCORE (relevance + trust combined)
  // This ensures variety and context-appropriate recommendations
  scoredCharities.sort((a, b) => {
    return b.totalScore - a.totalScore;
  });

  // Log top 3 for debugging (in production, this would go to analytics)
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Charity Matching Results (sorted by composite relevance):');
    scoredCharities.slice(0, 3).forEach((scored, index) => {
      console.log(`\n${index + 1}. ${scored.charity.name}`);
      console.log(`   Composite Score: ${scored.totalScore.toFixed(1)}`);
      console.log(`   Trust Score: ${scored.charity.trustScore}%`);
      scored.breakdown.forEach(line => console.log(`   - ${line}`));
    });
  }

  // Return top 3 matches
  return scoredCharities.slice(0, 3).map(s => s.charity);
}

export function getCharityById(id: string, charities: Charity[] = VERIFIED_CHARITIES): Charity | undefined {
  return charities.find(c => c.id === id);
}

export function getCharityBySlug(slug: string, charities: Charity[] = VERIFIED_CHARITIES): Charity | undefined {
  return charities.find(c => c.slug === slug);
}

export function getVettingLevelLabel(level: Charity['vettingLevel']): string {
  const labels = {
    'pg_direct': 'Directly Vetted',
    'partner_pg_review': 'Partner + FeelGive Reviewed',
    'partner_only': 'Partner Vetted',
  };
  return labels[level];
}

// Get explanation for why a charity was recommended
export function getRecommendationReasoning(
  charity: Charity, 
  classification: Classification
): string {
  const reasons: string[] = [];

  // Trust score (now primary factor)
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
      const needsList = matchedNeeds.map(n => n.replace('_', ' ')).join(', ');
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