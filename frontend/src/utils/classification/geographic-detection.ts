import { SemanticPattern } from './types';

/**
 * Context-aware geographic entity extraction
 * Identifies the PRIMARY subject location, not just mentioned locations
 */

interface LocationMatch {
  location: string;
  keywords: string[];
  matchCount: number;
  contextScore: number;
  isSubject: boolean;
}

/**
 * Determines if a location mention is the subject or just a comparison/reference
 */
function analyzeLocationContext(content: string, keyword: string): {
  isSubject: boolean;
  contextScore: number;
} {
  const lowerContent = content.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  // Find all occurrences of the keyword
  const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
  const matches = [...lowerContent.matchAll(regex)];
  
  if (matches.length === 0) {
    return { isSubject: false, contextScore: 0 };
  }
  
  let subjectScore = 0;
  let contextScore = 0;
  
  for (const match of matches) {
    const index = match.index!;
    const beforeContext = lowerContent.substring(Math.max(0, index - 100), index);
    const afterContext = lowerContent.substring(index, Math.min(lowerContent.length, index + 100));
    const fullContext = beforeContext + afterContext;
    
    // SUBJECT INDICATORS (location is the main focus)
    // Strong subject indicators
    if (
      /\bin\s+\w+$/i.test(beforeContext) || // "in [location]"
      /^[^,]{0,20}\s+(is|are|has|have|faces|facing|experiencing|suffers?|hit|struck|affected)/i.test(afterContext) || // "[location] is/has/faces..."
      /^[^,]{0,30}$/i.test(afterContext.split(/[.!?]/)[0]) // Location at start of sentence
    ) {
      subjectScore += 3;
      contextScore += 3;
    }
    
    // Medium subject indicators
    if (
      /\b(crisis|disaster|emergency|situation|conflict|war|outbreak|epidemic)\s+in\s+\w+$/i.test(beforeContext) || // "crisis in [location]"
      /^[^,]{0,20}\s+(residents|people|population|civilians|victims|survivors)/i.test(afterContext) // "[location] residents/people..."
    ) {
      subjectScore += 2;
      contextScore += 2;
    }
    
    // COMPARISON/REFERENCE INDICATORS (location is mentioned but not the subject)
    // Strong comparison indicators (NEGATIVE score)
    if (
      /\b(like|similar to|compared to|than|versus|vs\.?|unlike|except)\s+\w+$/i.test(beforeContext) || // "like [location]"
      /\b(second|third|fourth|largest|biggest|smaller|larger|after|behind)\s+\w+$/i.test(beforeContext) || // "second largest [location]"
      /^[^,]{0,20}\s+(is|was|has)\s+(second|third|largest|biggest|smaller)/i.test(afterContext) // "[location] is second..."
    ) {
      subjectScore -= 2;
      contextScore -= 1;
    }
    
    // Medium comparison indicators
    if (
      /\b(also|too|as well|similarly|likewise)\b/i.test(fullContext) || // "also in [location]"
      /\b(other|another|different)\s+\w+$/i.test(beforeContext) // "other [location]"
    ) {
      subjectScore -= 1;
    }
    
    // TITLE/HEADLINE BOOST
    // If location appears in first 100 characters (likely title/headline)
    if (index < 100) {
      subjectScore += 2;
      contextScore += 2;
    }
    
    // FREQUENCY BOOST
    // Multiple mentions suggest it's the subject
    if (matches.length >= 3) {
      contextScore += 1;
    }
  }
  
  return {
    isSubject: subjectScore > 0,
    contextScore: Math.max(0, contextScore)
  };
}

/**
 * Extracts geographic entities with semantic understanding
 */
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
  
  // Analyze all locations with context
  const locationMatches: LocationMatch[] = [];
  
  for (const [location, keywords] of Object.entries(pattern.geoKeywords)) {
    let matchCount = 0;
    let totalContextScore = 0;
    let isSubject = false;
    const matchedKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        matchCount++;
        matchedKeywords.push(keyword);
        
        // Analyze context for this keyword
        const analysis = analyzeLocationContext(content, keyword);
        totalContextScore += analysis.contextScore;
        
        if (analysis.isSubject) {
          isSubject = true;
        }
      }
    }
    
    if (matchCount > 0) {
      locationMatches.push({
        location,
        keywords: matchedKeywords,
        matchCount,
        contextScore: totalContextScore,
        isSubject
      });
    }
  }
  
  if (locationMatches.length === 0) {
    return { geo, geoName, geoScore };
  }
  
  // Sort by priority:
  // 1. Subject locations (isSubject = true)
  // 2. Context score (higher = more relevant)
  // 3. Match count (more mentions)
  // 4. Specificity (specific countries over broad regions)
  locationMatches.sort((a, b) => {
    // Prioritize subject locations
    if (a.isSubject && !b.isSubject) return -1;
    if (!a.isSubject && b.isSubject) return 1;
    
    // Then by context score
    if (a.contextScore !== b.contextScore) {
      return b.contextScore - a.contextScore;
    }
    
    // Then by match count
    if (a.matchCount !== b.matchCount) {
      return b.matchCount - a.matchCount;
    }
    
    // Finally by specificity (avoid broad regions)
    const aIsBroad = ['Global', 'Asia', 'Africa', 'Europe', 'Americas', 'Pacific'].includes(a.location);
    const bIsBroad = ['Global', 'Asia', 'Africa', 'Europe', 'Americas', 'Pacific'].includes(b.location);
    
    if (aIsBroad && !bIsBroad) return 1;
    if (!aIsBroad && bIsBroad) return -1;
    
    return 0;
  });
  
  // Select the best match
  const bestMatch = locationMatches[0];
  
  // Only use this location if it has positive context score OR is marked as subject
  if (bestMatch.contextScore > 0 || bestMatch.isSubject) {
    geo = bestMatch.location.toLowerCase().replace(/\s+/g, '-');
    geoName = bestMatch.location;
    geoScore = bestMatch.matchCount + bestMatch.contextScore;
    
    console.log(`🌍 Geographic detection: ${geoName} (subject: ${bestMatch.isSubject}, context: ${bestMatch.contextScore}, matches: ${bestMatch.matchCount})`);
    
    // Log if we filtered out comparison mentions
    const comparisonLocations = locationMatches.filter(m => !m.isSubject && m.contextScore <= 0);
    if (comparisonLocations.length > 0) {
      console.log(`   Filtered out comparison mentions: ${comparisonLocations.map(m => m.location).join(', ')}`);
    }
  }
  
  return { geo, geoName, geoScore };
}