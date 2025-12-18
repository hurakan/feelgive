import { CrisisType } from '@/types';

interface EventTag {
  type: CrisisType;
  label: string;
  confidence: number;
}

// Lightweight keyword-based classifier for news articles
const CRISIS_PATTERNS = {
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
 * Quickly classify a news article based on its title and description
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
 * Get color scheme for event tag based on crisis type
 */
export function getEventTagColor(type: CrisisType): {
  bg: string;
  text: string;
  border: string;
} {
  const colors = {
    natural_disaster: {
      bg: 'bg-orange-100 dark:bg-orange-950',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-300 dark:border-orange-700'
    },
    health_emergency: {
      bg: 'bg-red-100 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-300 dark:border-red-700'
    },
    conflict_displacement: {
      bg: 'bg-purple-100 dark:bg-purple-950',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-700'
    },
    climate_disaster: {
      bg: 'bg-green-100 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700'
    },
    human_rights_violation: {
      bg: 'bg-blue-100 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-700'
    },
    none: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600'
    }
  };
  
  return colors[type] || colors.none;
}