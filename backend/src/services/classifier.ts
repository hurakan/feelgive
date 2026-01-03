/**
 * News Article Classifier Service
 * Classifies news articles as crisis/non-crisis using keyword-based pattern matching
 */

export type CrisisType = 
  | 'natural_disaster'
  | 'health_emergency'
  | 'conflict_displacement'
  | 'climate_disaster'
  | 'human_rights_violation'
  | 'none';

export interface EventTag {
  type: CrisisType;
  label: string;
  confidence: number;
}

interface CrisisPattern {
  keywords: string[];
  label: string;
}

// Crisis patterns for classification
const CRISIS_PATTERNS: Record<Exclude<CrisisType, 'none'>, CrisisPattern> = {
  natural_disaster: {
    keywords: [
      'earthquake', 'tsunami', 'hurricane', 'tornado', 'flood', 'wildfire',
      'volcano', 'landslide', 'avalanche', 'cyclone', 'typhoon', 'storm',
      'drought', 'blizzard', 'heatwave', 'disaster', 'emergency', 'evacuation'
    ],
    label: 'Natural Disaster'
  },
  health_emergency: {
    keywords: [
      'outbreak', 'epidemic', 'pandemic', 'disease', 'virus', 'infection',
      'health crisis', 'medical emergency', 'hospital', 'vaccine', 'treatment',
      'patient', 'illness', 'contamination', 'public health', 'WHO', 'CDC'
    ],
    label: 'Health Emergency'
  },
  conflict_displacement: {
    keywords: [
      'war', 'conflict', 'refugee', 'displaced', 'violence', 'attack',
      'military', 'bombing', 'casualties', 'humanitarian crisis', 'asylum',
      'migration', 'persecution', 'genocide', 'ethnic cleansing', 'civil war'
    ],
    label: 'Conflict & Displacement'
  },
  climate_disaster: {
    keywords: [
      'climate change', 'global warming', 'sea level', 'melting ice',
      'extreme weather', 'carbon emissions', 'greenhouse gas', 'climate crisis',
      'environmental disaster', 'deforestation', 'desertification', 'coral bleaching'
    ],
    label: 'Climate Crisis'
  },
  human_rights_violation: {
    keywords: [
      'human rights', 'abuse', 'torture', 'discrimination', 'oppression',
      'injustice', 'violation', 'persecution', 'freedom', 'protest',
      'demonstration', 'civil rights', 'inequality', 'exploitation'
    ],
    label: 'Human Rights'
  }
};

/**
 * Classify a news article based on its title and description
 * Uses keyword matching for fast, lightweight classification
 */
export function classifyNewsArticle(title: string, description: string): EventTag | undefined {
  const text = `${title} ${description}`.toLowerCase();
  
  let bestMatch: { type: CrisisType; label: string; score: number } | null = null;
  
  // Check each crisis type
  for (const [type, config] of Object.entries(CRISIS_PATTERNS)) {
    let score = 0;
    let matchedKeywords = 0;
    
    // Count keyword matches
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchedKeywords++;
        // Weight longer keywords more heavily
        score += keyword.split(' ').length;
      }
    }
    
    // Calculate confidence based on matches
    if (matchedKeywords > 0) {
      const confidence = Math.min(matchedKeywords / 3, 1); // Cap at 1.0
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          type: type as CrisisType,
          label: config.label,
          score
        };
      }
    }
  }
  
  // Only return if we have reasonable confidence (at least 2 keyword matches)
  if (bestMatch && bestMatch.score >= 2) {
    return {
      type: bestMatch.type,
      label: bestMatch.label,
      confidence: Math.min(bestMatch.score / 5, 1) // Normalize to 0-1
    };
  }
  
  return undefined;
}

/**
 * Check if an article is classified as a crisis
 */
export function isCrisisArticle(title: string, description: string): boolean {
  const classification = classifyNewsArticle(title, description);
  return classification !== undefined && classification.type !== 'none';
}

/**
 * Get the crisis type from classification
 */
export function getCrisisType(title: string, description: string): CrisisType {
  const classification = classifyNewsArticle(title, description);
  return classification?.type || 'none';
}