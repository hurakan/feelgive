import { SemanticPattern } from './types';

export function detectGeography(
  content: string,
  pattern: SemanticPattern
): { geo: string; geoName: string; geoScore: number } {
  const lowerContent = content.toLowerCase();
  let geo = 'global';
  let geoName = 'Global';
  let geoScore = 0;
  
  if (!pattern.geoKeywords) {
    return { geo, geoName, geoScore };
  }
  
  // Sort locations by specificity (more specific = higher priority)
  const locationEntries = Object.entries(pattern.geoKeywords).sort((a, b) => {
    // Prioritize specific countries/regions over broad ones
    const aIsBroad = ['Global', 'Asia', 'Africa', 'Europe', 'Americas'].includes(a[0]);
    const bIsBroad = ['Global', 'Asia', 'Africa', 'Europe', 'Americas'].includes(b[0]);
    
    if (aIsBroad && !bIsBroad) return 1;
    if (!aIsBroad && bIsBroad) return -1;
    return 0;
  });
  
  for (const [location, keywords] of locationEntries) {
    let locationMatches = 0;
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        locationMatches++;
      }
    }
    
    // Only update if we found matches AND (no previous match OR this is more specific)
    if (locationMatches > 0 && locationMatches > geoScore) {
      geo = location.toLowerCase().replace(/\s+/g, '-');
      geoName = location;
      geoScore = locationMatches;
    }
  }
  
  return { geo, geoName, geoScore };
}