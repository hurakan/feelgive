/**
 * Context-Aware Cause Scorer
 * 
 * Scores organizations based on cause relevance to crisis type
 * Uses NTEE codes, tags, and description keywords with context-aware weights
 */

export type CrisisType = 'humanitarian' | 'sports' | 'religious_persecution' | 'natural_disaster';

export interface CauseRelevanceScore {
  totalScore: number;
  crisisType: CrisisType;
  breakdown: {
    ntee: { score: number; reason: string };
    tags: { score: number; reason: string };
    description: { score: number; reason: string };
  };
}

/**
 * Detect crisis type from article title and description
 */
export function detectCrisisType(title: string, description: string = ''): CrisisType {
  const text = `${title} ${description}`.toLowerCase();
  
  // Sports disaster (stadium, match, team, etc.)
  if (text.match(/stadium|soccer|football|sports|athletics|match|game|team|player|tournament/)) {
    return 'sports';
  }
  
  // Natural disaster (earthquake, flood, hurricane, etc.)
  if (text.match(/earthquake|flood|hurricane|tsunami|wildfire|drought|cyclone|typhoon|tornado|landslide|volcano/)) {
    return 'natural_disaster';
  }
  
  // Religious persecution - but if it's also violent/humanitarian, treat as humanitarian
  // Check for violence/humanitarian keywords
  const hasViolence = text.match(/attack|kidnap|kill|violence|conflict|crisis|humanitarian/);
  const hasReligious = text.match(/church|mosque|temple|synagogue|christian|muslim|jewish|hindu|buddhist|religious|persecution|faith/);
  
  if (hasReligious && !hasViolence) {
    // Pure religious (e.g., "church fundraiser") - not a crisis
    return 'religious_persecution';
  }
  
  // Default: humanitarian/conflict (includes religious violence)
  return 'humanitarian';
}

/**
 * Compute cause relevance score (0-100)
 */
export function computeCauseRelevance(
  orgNteeCode: string | undefined,
  orgTags: string[],
  orgDescription: string,
  crisisType: CrisisType
): CauseRelevanceScore {
  const nteeResult = getNTEECauseScore(orgNteeCode, crisisType);
  const tagsResult = getTagsCauseScore(orgTags, crisisType);
  const descResult = getDescriptionCauseScore(orgDescription, crisisType);
  
  return {
    totalScore: nteeResult.score + tagsResult.score + descResult.score,
    crisisType,
    breakdown: {
      ntee: nteeResult,
      tags: tagsResult,
      description: descResult,
    },
  };
}

/**
 * Get NTEE code cause score (0-50 points)
 * Context-aware: different weights for different crisis types
 */
function getNTEECauseScore(
  nteeCode: string | undefined,
  crisisType: CrisisType
): { score: number; reason: string } {
  if (!nteeCode) {
    return { score: 0, reason: 'No NTEE code' };
  }
  
  // Humanitarian crisis (conflict, attack, kidnapping, etc.)
  if (crisisType === 'humanitarian') {
    if (nteeCode.startsWith('Q3')) return { score: 50, reason: 'International Development (Q3x)' };
    if (nteeCode.startsWith('P2') || nteeCode.startsWith('P6')) {
      return { score: 50, reason: 'Human Services/Emergency Assistance (P2x/P6x)' };
    }
    if (nteeCode.startsWith('M2')) return { score: 50, reason: 'Disaster Relief (M2x)' };
    if (nteeCode.startsWith('K3')) return { score: 40, reason: 'Food Programs (K3x)' };
    if (nteeCode.startsWith('L4')) return { score: 40, reason: 'Shelter (L4x)' };
    if (nteeCode.startsWith('E')) return { score: 30, reason: 'Health Services (E)' };
    if (nteeCode.startsWith('P')) return { score: 25, reason: 'Human Services (P)' };
    if (nteeCode.startsWith('X2')) return { score: 10, reason: 'Religion (X2x) - low priority' };
    if (nteeCode.startsWith('N7')) return { score: 0, reason: 'Sports (N7x) - not relevant' };
    if (nteeCode.startsWith('A')) return { score: 0, reason: 'Arts/Culture (A) - not relevant' };
    if (nteeCode.startsWith('B')) return { score: 0, reason: 'Education (B) - not relevant' };
    return { score: 0, reason: `NTEE ${nteeCode} not humanitarian-focused` };
  }
  
  // Sports disaster (stadium collapse, team tragedy, etc.)
  if (crisisType === 'sports') {
    if (nteeCode.startsWith('N7')) return { score: 50, reason: 'Sports (N7x)' };
    if (nteeCode.startsWith('N')) return { score: 40, reason: 'Recreation (N)' };
    if (nteeCode.startsWith('P2')) return { score: 30, reason: 'Human Services (P2x)' };
    if (nteeCode.startsWith('E')) return { score: 30, reason: 'Health Services (E)' };
    if (nteeCode.startsWith('M2')) return { score: 20, reason: 'Disaster Relief (M2x)' };
    return { score: 0, reason: `NTEE ${nteeCode} not sports-related` };
  }
  
  // Religious persecution
  if (crisisType === 'religious_persecution') {
    if (nteeCode.startsWith('X2')) return { score: 50, reason: 'Religion (X2x)' };
    if (nteeCode.startsWith('X')) return { score: 40, reason: 'Religion-related (X)' };
    if (nteeCode.startsWith('Q3')) return { score: 40, reason: 'International Development (Q3x)' };
    if (nteeCode.startsWith('P2')) return { score: 30, reason: 'Human Services (P2x)' };
    if (nteeCode.startsWith('R')) return { score: 20, reason: 'Civil Rights (R)' };
    return { score: 0, reason: `NTEE ${nteeCode} not religion-focused` };
  }
  
  // Natural disaster (earthquake, flood, hurricane, etc.)
  if (crisisType === 'natural_disaster') {
    if (nteeCode.startsWith('M2')) return { score: 50, reason: 'Disaster Relief (M2x)' };
    if (nteeCode.startsWith('P6')) return { score: 50, reason: 'Emergency Assistance (P6x)' };
    if (nteeCode.startsWith('E')) return { score: 40, reason: 'Health Services (E)' };
    if (nteeCode.startsWith('K3')) return { score: 30, reason: 'Food Programs (K3x)' };
    if (nteeCode.startsWith('L4')) return { score: 30, reason: 'Shelter (L4x)' };
    if (nteeCode.startsWith('P2')) return { score: 25, reason: 'Human Services (P2x)' };
    if (nteeCode.startsWith('Q3')) return { score: 20, reason: 'International Development (Q3x)' };
    return { score: 0, reason: `NTEE ${nteeCode} not disaster-focused` };
  }
  
  return { score: 0, reason: 'Unknown crisis type' };
}

/**
 * Get tags cause score (0-30 points)
 */
function getTagsCauseScore(
  tags: string[],
  crisisType: CrisisType
): { score: number; reason: string } {
  if (!tags || tags.length === 0) {
    return { score: 0, reason: 'No tags' };
  }
  
  const tagsLower = tags.map(t => t.toLowerCase());
  
  // Humanitarian crisis
  if (crisisType === 'humanitarian') {
    if (tagsLower.includes('humanitarian')) return { score: 30, reason: 'Tag: humanitarian' };
    if (tagsLower.includes('refugees')) return { score: 30, reason: 'Tag: refugees' };
    if (tagsLower.includes('humans')) return { score: 25, reason: 'Tag: humans' };
    if (tagsLower.includes('food')) return { score: 20, reason: 'Tag: food' };
    if (tagsLower.includes('shelter')) return { score: 20, reason: 'Tag: shelter' };
    if (tagsLower.includes('health')) return { score: 20, reason: 'Tag: health' };
    if (tagsLower.includes('emergency')) return { score: 20, reason: 'Tag: emergency' };
    if (tagsLower.includes('relief')) return { score: 20, reason: 'Tag: relief' };
    if (tagsLower.includes('religion')) return { score: 5, reason: 'Tag: religion (low priority)' };
    if (tagsLower.includes('athletics')) return { score: 0, reason: 'Tag: athletics (not relevant)' };
    if (tagsLower.includes('sports')) return { score: 0, reason: 'Tag: sports (not relevant)' };
    return { score: 0, reason: 'No relevant tags' };
  }
  
  // Sports disaster
  if (crisisType === 'sports') {
    if (tagsLower.includes('athletics')) return { score: 30, reason: 'Tag: athletics' };
    if (tagsLower.includes('sports')) return { score: 30, reason: 'Tag: sports' };
    if (tagsLower.includes('recreation')) return { score: 25, reason: 'Tag: recreation' };
    if (tagsLower.includes('humans')) return { score: 15, reason: 'Tag: humans' };
    if (tagsLower.includes('health')) return { score: 15, reason: 'Tag: health' };
    return { score: 0, reason: 'No relevant tags' };
  }
  
  // Religious persecution
  if (crisisType === 'religious_persecution') {
    if (tagsLower.includes('religion')) return { score: 30, reason: 'Tag: religion' };
    if (tagsLower.includes('christianity')) return { score: 30, reason: 'Tag: christianity' };
    if (tagsLower.includes('faith')) return { score: 30, reason: 'Tag: faith' };
    if (tagsLower.includes('humanitarian')) return { score: 20, reason: 'Tag: humanitarian' };
    if (tagsLower.includes('humans')) return { score: 15, reason: 'Tag: humans' };
    return { score: 0, reason: 'No relevant tags' };
  }
  
  // Natural disaster
  if (crisisType === 'natural_disaster') {
    if (tagsLower.includes('disaster')) return { score: 30, reason: 'Tag: disaster' };
    if (tagsLower.includes('emergency')) return { score: 30, reason: 'Tag: emergency' };
    if (tagsLower.includes('relief')) return { score: 25, reason: 'Tag: relief' };
    if (tagsLower.includes('humanitarian')) return { score: 25, reason: 'Tag: humanitarian' };
    if (tagsLower.includes('health')) return { score: 20, reason: 'Tag: health' };
    if (tagsLower.includes('food')) return { score: 15, reason: 'Tag: food' };
    if (tagsLower.includes('shelter')) return { score: 15, reason: 'Tag: shelter' };
    return { score: 0, reason: 'No relevant tags' };
  }
  
  return { score: 0, reason: 'Unknown crisis type' };
}

/**
 * Get description cause score (0-20 points)
 */
function getDescriptionCauseScore(
  description: string,
  crisisType: CrisisType
): { score: number; reason: string } {
  const descLower = description.toLowerCase();
  
  // Humanitarian crisis
  if (crisisType === 'humanitarian') {
    const humanitarianKeywords = [
      'humanitarian', 'relief', 'aid', 'emergency',
      'refugees', 'displaced', 'victims', 'survivors',
      'food', 'shelter', 'medical', 'health',
      'conflict', 'crisis', 'assistance',
    ];
    
    const matches = humanitarianKeywords.filter(kw => descLower.includes(kw));
    if (matches.length > 0) {
      const score = Math.min(matches.length * 5, 20);
      return { score, reason: `Keywords: ${matches.slice(0, 3).join(', ')}` };
    }
    return { score: 0, reason: 'No humanitarian keywords' };
  }
  
  // Sports disaster
  if (crisisType === 'sports') {
    const sportsKeywords = ['sports', 'athletics', 'athletes', 'teams', 'recreation', 'competition'];
    const matches = sportsKeywords.filter(kw => descLower.includes(kw));
    if (matches.length > 0) {
      const score = Math.min(matches.length * 5, 20);
      return { score, reason: `Keywords: ${matches.slice(0, 3).join(', ')}` };
    }
    return { score: 0, reason: 'No sports keywords' };
  }
  
  // Religious persecution
  if (crisisType === 'religious_persecution') {
    const religiousKeywords = ['religious', 'faith', 'church', 'christian', 'muslim', 'persecution', 'worship'];
    const matches = religiousKeywords.filter(kw => descLower.includes(kw));
    if (matches.length > 0) {
      const score = Math.min(matches.length * 5, 20);
      return { score, reason: `Keywords: ${matches.slice(0, 3).join(', ')}` };
    }
    return { score: 0, reason: 'No religious keywords' };
  }
  
  // Natural disaster
  if (crisisType === 'natural_disaster') {
    const disasterKeywords = [
      'disaster', 'emergency', 'relief', 'recovery',
      'earthquake', 'flood', 'hurricane', 'wildfire',
      'rescue', 'evacuation', 'shelter',
    ];
    const matches = disasterKeywords.filter(kw => descLower.includes(kw));
    if (matches.length > 0) {
      const score = Math.min(matches.length * 5, 20);
      return { score, reason: `Keywords: ${matches.slice(0, 3).join(', ')}` };
    }
    return { score: 0, reason: 'No disaster keywords' };
  }
  
  return { score: 0, reason: 'Unknown crisis type' };
}