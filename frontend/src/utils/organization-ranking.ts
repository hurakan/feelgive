/**
 * Organization Ranking Utilities
 * 
 * Provides intelligent re-ranking of Every.org search results to ensure
 * the most relevant organizations appear first, fixing issues with
 * Every.org's fuzzy search returning incorrect results.
 */

import { EveryOrgNonprofit } from '@/types';

/**
 * Calculate relevance score for an organization based on search term
 * Higher scores indicate better matches
 * 
 * Scoring breakdown:
 * - Exact match: +1000 points
 * - Contains full search term: +500 points
 * - Word-by-word matches: +100 points each
 * - Description matches: +50 points each
 * - Corporate suffix penalty: -200 points
 * - Length mismatch penalty: -150 points (acronym confusion)
 * - No word overlap penalty: -500 points
 */
export function calculateRelevanceScore(
  searchTerm: string,
  org: EveryOrgNonprofit
): number {
  let score = 0;
  const searchLower = searchTerm.toLowerCase().trim();
  const orgName = org.name.toLowerCase().trim();
  const orgDesc = (org.description || '').toLowerCase();
  
  // 1. EXACT MATCH (highest priority)
  if (orgName === searchLower) {
    score += 1000;
    console.log(`   ✅ Exact match: ${org.name} (+1000)`);
    return score; // Early return for perfect match
  }
  
  // 2. CONTAINS FULL SEARCH TERM
  if (orgName.includes(searchLower)) {
    score += 500;
    console.log(`   ✅ Contains full term: ${org.name} (+500)`);
  }
  
  // 3. WORD-BY-WORD MATCHING
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
  const orgWords = orgName.split(/\s+/);
  
  // Count matched words in name
  const matchedWords = searchWords.filter(searchWord =>
    orgWords.some(orgWord => 
      orgWord.includes(searchWord) || searchWord.includes(orgWord)
    )
  );
  
  if (matchedWords.length > 0) {
    const wordScore = matchedWords.length * 100;
    score += wordScore;
    console.log(`   ✅ Matched ${matchedWords.length} words: ${org.name} (+${wordScore})`);
  }
  
  // 4. DESCRIPTION MATCHING (lower weight)
  const descMatches = searchWords.filter(word => orgDesc.includes(word));
  if (descMatches.length > 0) {
    const descScore = descMatches.length * 50;
    score += descScore;
    console.log(`   ✅ Description matches: ${org.name} (+${descScore})`);
  }
  
  // 5. PENALTIES
  
  // Penalty for corporate suffixes when not in search
  const corporateSuffixes = [' inc', ' corp', ' llc', ' ltd', ' co', ' foundation'];
  const hasCorporateSuffix = corporateSuffixes.some(suffix => orgName.endsWith(suffix));
  const searchHasCorporate = corporateSuffixes.some(suffix => 
    searchLower.includes(suffix.trim())
  );
  
  if (hasCorporateSuffix && !searchHasCorporate) {
    score -= 200;
    console.log(`   ⚠️  Corporate suffix penalty: ${org.name} (-200)`);
  }
  
  // Penalty for length mismatch (potential acronym confusion)
  // If searching for long name but org has short name, likely wrong org
  if (searchLower.length > 20 && orgName.length < 20) {
    score -= 150;
    console.log(`   ⚠️  Length mismatch penalty: ${org.name} (-150)`);
  }
  
  // Penalty for no word overlap at all
  if (matchedWords.length === 0 && searchWords.length > 0) {
    score -= 500;
    console.log(`   ❌ No word overlap: ${org.name} (-500)`);
  }
  
  // Penalty for student chapters/variants when not explicitly searched
  if (!searchLower.includes('student') && orgName.includes('student chapter')) {
    score -= 300;
    console.log(`   ⚠️  Student chapter penalty: ${org.name} (-300)`);
  }
  
  // Bonus for main organization indicators
  if (orgName.includes('usa') || orgName.includes('america') || orgName.includes('international')) {
    if (searchWords.length >= 2) { // Only for multi-word searches
      score += 50;
      console.log(`   ✅ Main org bonus: ${org.name} (+50)`);
    }
  }
  
  console.log(`   📊 Final score for ${org.name}: ${score}`);
  return score;
}

/**
 * Re-rank organizations based on relevance to search term
 * Returns organizations sorted by relevance score (highest first)
 */
export function reRankOrganizations(
  organizations: EveryOrgNonprofit[],
  searchTerm: string
): EveryOrgNonprofit[] {
  if (!searchTerm || organizations.length === 0) {
    return organizations;
  }
  
  console.log(`\n🔄 Re-ranking ${organizations.length} organizations for: "${searchTerm}"`);
  
  // Calculate scores for all organizations
  const scored = organizations.map(org => ({
    org,
    score: calculateRelevanceScore(searchTerm, org)
  }));
  
  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score);
  
  // Log top 3 for debugging
  console.log('\n🏆 Top 3 after re-ranking:');
  scored.slice(0, 3).forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.org.name} (score: ${item.score})`);
  });
  
  // Return sorted organizations
  return scored.map(item => item.org);
}

/**
 * Check if an organization should be filtered out based on search context
 * This is an additional filter beyond isIrrelevantOrganization
 */
export function shouldFilterBySearchContext(
  org: EveryOrgNonprofit,
  searchTerm: string
): boolean {
  const searchLower = searchTerm.toLowerCase();
  const orgName = org.name.toLowerCase();
  
  // Filter student chapters when not explicitly searched
  if (!searchLower.includes('student') && orgName.includes('student chapter')) {
    console.log(`🚫 Filtering student chapter: ${org.name}`);
    return true;
  }
  
  // Filter organizations with no word overlap
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
  if (searchWords.length > 0) {
    const orgWords = orgName.split(/\s+/);
    const hasAnyMatch = searchWords.some(sw =>
      orgWords.some(ow => ow.includes(sw) || sw.includes(ow))
    );
    
    if (!hasAnyMatch) {
      console.log(`🚫 Filtering no word overlap: ${org.name}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Get a human-readable explanation of why an organization was ranked highly
 */
export function getRankingExplanation(
  org: EveryOrgNonprofit,
  searchTerm: string,
  rank: number
): string {
  const searchLower = searchTerm.toLowerCase();
  const orgName = org.name.toLowerCase();
  
  if (orgName === searchLower) {
    return `Exact match for "${searchTerm}"`;
  }
  
  if (orgName.includes(searchLower)) {
    return `Name contains "${searchTerm}"`;
  }
  
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
  const matchedWords = searchWords.filter(word => orgName.includes(word));
  
  if (matchedWords.length === searchWords.length) {
    return `Matches all search terms`;
  }
  
  if (matchedWords.length > 0) {
    return `Matches ${matchedWords.length} of ${searchWords.length} search terms`;
  }
  
  return `Ranked #${rank} by relevance`;
}