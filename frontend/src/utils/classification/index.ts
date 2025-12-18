import { Classification, CauseCategory } from '@/types';
import { SEMANTIC_PATTERNS } from './patterns';
import { analyzeSemanticContext } from './semantic-analysis';
import { detectNeeds } from './needs-detection';
import { assessSeverity } from './severity-assessment';
import { extractExcerpts } from './excerpt-extraction';

const MIN_CONFIDENCE_THRESHOLD = 0.35; // Lowered from 0.50 to 0.35 to allow more valid classifications

const AFFECTED_GROUPS_MAP: { [key in CauseCategory]: string[] } = {
  disaster_relief: ['families', 'communities', 'displaced residents', 'survivors'],
  health_crisis: ['patients', 'vulnerable populations', 'healthcare workers', 'affected communities'],
  climate_events: ['residents', 'families', 'local communities', 'wildlife'],
  humanitarian_crisis: ['refugees', 'displaced families', 'children', 'vulnerable populations', 'civilians'],
  social_justice: ['marginalized communities', 'students', 'activists', 'underserved populations', 'immigrants', 'undocumented individuals'],
};

export async function classifyContent(
  url: string,
  title?: string,
  text?: string
): Promise<Classification | null> {
  const content = `${url} ${title || ''} ${text || ''}`;
  
  console.log('🔍 Starting classification...');
  
  // Analyze content against all patterns
  const analyses = SEMANTIC_PATTERNS.map(pattern => 
    analyzeSemanticContext(content, pattern)
  );

  // Filter out zero-score results (blocked by negative indicators or insufficient core indicators)
  const validAnalyses = analyses.filter(a => a.score > 0);
  
  console.log(`📊 Valid analyses: ${validAnalyses.length}/${analyses.length}`);

  // If NO valid analyses, return null (non-crisis content)
  if (validAnalyses.length === 0) {
    console.log('❌ No valid classifications - content is non-crisis');
    return null;
  }

  // Sort by score (highest first)
  validAnalyses.sort((a, b) => b.score - a.score);
  const bestMatch = validAnalyses[0];
  const secondBest = validAnalyses.length > 1 ? validAnalyses[1] : null;

  console.log(`🏆 Best match: ${bestMatch.cause} with score ${bestMatch.score}`);
  console.log(`📊 Pattern analysis results:`, validAnalyses.map(a => ({
    cause: a.cause,
    score: a.score,
    keywords: a.matchedKeywords.length
  })));

  // Find the pattern for the best match
  const pattern = SEMANTIC_PATTERNS.find(p => p.cause === bestMatch.cause)!;
  
  // Check if score meets minimum threshold
  if (bestMatch.score < pattern.minScore) {
    console.log(`❌ Score ${bestMatch.score} below minimum ${pattern.minScore}`);
    return null;
  }
  
  const hasMatchingCharities = bestMatch.score >= pattern.minScore;

  // Calculate confidence
  let confidence = Math.min(0.95, 0.35 + (bestMatch.score * 0.04));
  
  // Boost confidence if there's a clear winner
  if (secondBest && secondBest.score > 0) {
    const scoreDiff = bestMatch.score - secondBest.score;
    if (scoreDiff > 5) {
      confidence = Math.min(0.95, confidence + 0.15);
    } else if (scoreDiff > 3) {
      confidence = Math.min(0.95, confidence + 0.08);
    }
  }

  console.log(`📈 Confidence calculation: base=${0.35 + (bestMatch.score * 0.04).toFixed(2)}, final=${(confidence * 100).toFixed(0)}%`);

  // Check confidence threshold
  if (confidence < MIN_CONFIDENCE_THRESHOLD) {
    console.log(`❌ Confidence ${(confidence * 100).toFixed(0)}% below threshold ${(MIN_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%`);
    return null;
  }

  // Extract relevant excerpts
  const relevantExcerpts = text ? extractExcerpts(text, bestMatch.matchedKeywords) : [];
  
  // Detect needs
  const identifiedNeeds = detectNeeds(content);
  
  // Assess severity
  const severityAssessment = assessSeverity(content, bestMatch.matchedKeywords);

  console.log('✅ Classification successful');

  return {
    cause: bestMatch.cause,
    tier1_crisis_type: bestMatch.crisisType,
    tier2_root_cause: bestMatch.rootCause,
    identified_needs: identifiedNeeds,
    geo: bestMatch.geo,
    geoName: bestMatch.geoName,
    affectedGroups: AFFECTED_GROUPS_MAP[bestMatch.cause],
    confidence,
    articleUrl: url,
    articleTitle: title,
    matchedKeywords: bestMatch.matchedKeywords,
    relevantExcerpts,
    hasMatchingCharities: confidence >= MIN_CONFIDENCE_THRESHOLD && hasMatchingCharities,
    detectedThemes: bestMatch.detectedThemes,
    severityAssessment
  };
}

export function getCauseLabel(cause: CauseCategory): string {
  const labels: { [key in CauseCategory]: string } = {
    disaster_relief: 'Disaster Relief',
    health_crisis: 'Health Crisis',
    climate_events: 'Climate Events',
    humanitarian_crisis: 'Humanitarian Crisis',
    social_justice: 'Social Justice',
  };
  return labels[cause];
}