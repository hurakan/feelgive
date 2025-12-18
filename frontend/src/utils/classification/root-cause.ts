import { RootCause } from '@/types';
import { SemanticPattern } from './types';

export function determineRootCause(
  content: string,
  pattern: SemanticPattern,
  matchedKeywords: string[]
): RootCause {
  const lowerContent = content.toLowerCase();
  
  // Check for climate-driven causes
  if (lowerContent.includes('climate change') ||
      lowerContent.includes('global warming') ||
      lowerContent.includes('climate crisis')) {
    return 'climate_driven';
  }
  
  // Check for conflict-driven causes
  if (lowerContent.includes('war') ||
      lowerContent.includes('conflict') ||
      lowerContent.includes('military') ||
      lowerContent.includes('armed groups')) {
    return 'conflict_driven';
  }
  
  // Check for poverty-driven causes
  if (lowerContent.includes('poverty') ||
      lowerContent.includes('low-income') ||
      lowerContent.includes('lack of resources') ||
      lowerContent.includes('underfunded')) {
    return 'poverty_driven';
  }
  
  // Check for policy-driven causes
  if (lowerContent.includes('policy') ||
      lowerContent.includes('government') ||
      lowerContent.includes('enforcement') ||
      lowerContent.includes('legislation')) {
    return 'policy_driven';
  }
  
  // Check for multiple factors
  const factorCount = [
    lowerContent.includes('climate'),
    lowerContent.includes('conflict') || lowerContent.includes('war'),
    lowerContent.includes('poverty'),
    lowerContent.includes('policy')
  ].filter(Boolean).length;
  
  if (factorCount >= 2) {
    return 'multiple_factors';
  }
  
  // Default to pattern's typical root cause
  return pattern.typicalRootCauses[0] || 'unknown';
}