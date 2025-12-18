import { SemanticPattern, AnalysisResult } from './types';
import { detectGeography } from './geographic-detection';
import { determineRootCause } from './root-cause';

function matchesWord(content: string, word: string): boolean {
  // Create regex with word boundaries
  // \b matches word boundaries (start/end of word)
  const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(content);
}

export function analyzeSemanticContext(
  content: string,
  pattern: SemanticPattern
): AnalysisResult {
  const lowerContent = content.toLowerCase();
  
  // **PENALTY SYSTEM: Negative indicators reduce score instead of blocking**
  let negativePenalty = 0;
  for (const negative of pattern.negativeIndicators) {
    if (matchesWord(content, negative)) {
      negativePenalty += 2;
      console.log(`⚠️ Negative indicator penalty: "${negative}" (-2 points)`);
    }
  }
  
  let score = 0;
  let contextScore = 0;
  let actionScore = 0;
  const matchedKeywords: string[] = [];
  const detectedThemes: string[] = [];

  // Count core indicators
  let coreIndicatorCount = 0;
  for (const indicator of pattern.coreIndicators) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      score += 4;
      matchedKeywords.push(indicator);
      detectedThemes.push(indicator);
      coreIndicatorCount++;
    }
  }

  // **BALANCED APPROACH: Require at least 1 core indicator**
  if (coreIndicatorCount === 0) {
    console.log(`❌ No core indicators found`);
    return {
      cause: pattern.cause,
      score: 0,
      matchedKeywords: [],
      contextScore: 0,
      actionScore: 0,
      negativeScore: 0,
      geo: 'global',
      geoName: 'Global',
      detectedThemes: [],
      crisisType: 'none',
      rootCause: 'unknown'
    };
  }

  // Check for supporting context
  for (const context of pattern.supportingContext) {
    if (lowerContent.includes(context.toLowerCase())) {
      contextScore += 2;
      matchedKeywords.push(context);
    }
  }

  // Check for action indicators
  for (const action of pattern.actionIndicators) {
    if (lowerContent.includes(action.toLowerCase())) {
      actionScore += 2.5;
      matchedKeywords.push(action);
    }
  }

  // Calculate total score with negative penalty
  score += contextScore + actionScore;
  
  // Apply negative penalty (but don't go below 0)
  const finalScore = Math.max(0, score - negativePenalty);
  
  if (negativePenalty > 0) {
    console.log(`📉 Score after penalty: ${score} - ${negativePenalty} = ${finalScore}`);
  }

  // **LOWERED THRESHOLD: If only 1 core indicator, require score ≥ 6 (was 8)**
  // This helps catch short but valid crisis headlines
  if (coreIndicatorCount === 1 && finalScore < 6) {
    console.log(`❌ Only 1 core indicator with insufficient supporting evidence (score: ${finalScore}, need: 6)`);
    return {
      cause: pattern.cause,
      score: 0,
      matchedKeywords: [],
      contextScore: 0,
      actionScore: 0,
      negativeScore: 0,
      geo: 'global',
      geoName: 'Global',
      detectedThemes: [],
      crisisType: 'none',
      rootCause: 'unknown'
    };
  }

  // Detect geography
  const { geo, geoName, geoScore } = detectGeography(content, pattern);
  const finalScoreWithGeo = finalScore + (geoScore * 2);

  // Determine root cause
  const rootCause = determineRootCause(content, pattern, matchedKeywords);

  console.log(`✅ Pattern ${pattern.cause}: ${coreIndicatorCount} core indicators, final score: ${finalScoreWithGeo}`);

  return {
    cause: pattern.cause,
    score: finalScoreWithGeo,
    matchedKeywords,
    contextScore,
    actionScore,
    negativeScore: negativePenalty,
    geo,
    geoName,
    detectedThemes,
    crisisType: pattern.crisisType,
    rootCause
  };
}