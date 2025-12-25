/**
 * Every.org Fuzzy Search Analysis & Testing Script
 *
 * This script tests the Every.org API's fuzzy search behavior to identify
 * issues with incorrect organization recommendations.
 */

require('dotenv').config();
const axios = require('axios');

// Test cases representing real-world scenarios
const TEST_CASES = [
  {
    name: 'International Rescue Committee',
    searchTerm: 'International Rescue Committee',
    expectedSlug: 'rescue',
    description: 'Major humanitarian organization - should return exact match'
  },
  {
    name: 'Doctors Without Borders',
    searchTerm: 'Doctors Without Borders',
    expectedSlug: 'doctors-without-borders-usa',
    description: 'Well-known medical humanitarian org'
  },
  {
    name: 'Red Cross',
    searchTerm: 'Red Cross',
    expectedSlug: 'american-red-cross',
    description: 'Major disaster relief organization'
  },
  {
    name: 'UNICEF',
    searchTerm: 'UNICEF',
    expectedSlug: 'unicef-usa',
    description: 'UN children\'s fund'
  },
  {
    name: 'World Food Programme',
    searchTerm: 'World Food Programme',
    expectedSlug: 'world-food-program-usa',
    description: 'UN food assistance organization'
  },
  {
    name: 'CARE',
    searchTerm: 'CARE',
    expectedSlug: 'care',
    description: 'Humanitarian organization - short acronym test'
  },
  {
    name: 'Save the Children',
    searchTerm: 'Save the Children',
    expectedSlug: 'save-the-children',
    description: 'Children\'s rights organization'
  },
  {
    name: 'Oxfam',
    searchTerm: 'Oxfam',
    expectedSlug: 'oxfam-america',
    description: 'Anti-poverty organization'
  }
];

// Every.org API configuration
const EVERY_ORG_API_KEY = process.env.EVERY_ORG_API_PUBLIC_KEY || '';
const BASE_URL = 'https://partners.every.org/v0.2';

/**
 * Search Every.org API
 */
async function searchEveryOrg(searchTerm) {
  try {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const url = `${BASE_URL}/search/${encodedSearchTerm}`;
    
    const response = await axios.get(url, {
      params: { apiKey: EVERY_ORG_API_KEY },
      timeout: 10000
    });
    
    return response.data.nonprofits || [];
  } catch (error) {
    console.error(`Error searching for "${searchTerm}":`, error.message);
    return [];
  }
}

/**
 * Analyze search results for issues
 */
function analyzeResults(searchTerm, results, expectedSlug) {
  const issues = [];
  const warnings = [];
  
  if (results.length === 0) {
    issues.push('No results returned');
    return { issues, warnings, topResult: null };
  }
  
  const topResult = results[0];
  
  // Check if expected org is in results
  const expectedOrg = results.find(r => r.slug === expectedSlug);
  if (!expectedOrg) {
    warnings.push(`Expected org "${expectedSlug}" not found in results`);
  } else if (results.indexOf(expectedOrg) > 0) {
    warnings.push(`Expected org is at position ${results.indexOf(expectedOrg) + 1}, not #1`);
  }
  
  // Check for acronym confusion
  const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const searchAcronym = searchWords.map(w => w[0]).join('');
  
  results.forEach((org, index) => {
    const orgName = org.name.toLowerCase();
    
    // Check for corporate suffix confusion
    const corporateSuffixes = [' inc', ' corp', ' llc', ' ltd', ' co'];
    const hasCorporateSuffix = corporateSuffixes.some(suffix => orgName.endsWith(suffix));
    
    if (hasCorporateSuffix && searchTerm.length > 20 && orgName.length < 20) {
      if (searchAcronym.length >= 3 && orgName.includes(searchAcronym)) {
        issues.push(`Result #${index + 1} "${org.name}" appears to be acronym confusion (has corporate suffix)`);
      }
    }
    
    // Check for completely different organizations
    const searchLower = searchTerm.toLowerCase();
    const hasAnyCommonWord = searchWords.some(word => orgName.includes(word));
    
    if (!hasAnyCommonWord && index < 3) {
      warnings.push(`Result #${index + 1} "${org.name}" has no common words with search term`);
    }
  });
  
  return { issues, warnings, topResult };
}

/**
 * Calculate relevance score for a result
 */
function calculateRelevanceScore(searchTerm, org) {
  let score = 0;
  const searchLower = searchTerm.toLowerCase();
  const orgName = org.name.toLowerCase();
  const orgDesc = (org.description || '').toLowerCase();
  
  // Exact match (highest score)
  if (orgName === searchLower) {
    score += 100;
  }
  
  // Contains full search term
  if (orgName.includes(searchLower)) {
    score += 50;
  }
  
  // Word-by-word matching
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
  const matchedWords = searchWords.filter(word => orgName.includes(word));
  score += matchedWords.length * 10;
  
  // Description matching
  const descMatches = searchWords.filter(word => orgDesc.includes(word));
  score += descMatches.length * 5;
  
  // Penalty for corporate suffixes when not in search
  const corporateSuffixes = [' inc', ' corp', ' llc', ' ltd', ' co'];
  const hasCorporateSuffix = corporateSuffixes.some(suffix => orgName.endsWith(suffix));
  const searchHasCorporate = corporateSuffixes.some(suffix => searchLower.includes(suffix.trim()));
  
  if (hasCorporateSuffix && !searchHasCorporate) {
    score -= 20;
  }
  
  // Penalty for length mismatch (acronym confusion indicator)
  if (searchLower.length > 20 && orgName.length < 20) {
    score -= 15;
  }
  
  return score;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🔍 Every.org Fuzzy Search Analysis\n');
  console.log('=' .repeat(80));
  
  if (!EVERY_ORG_API_KEY) {
    console.error('❌ ERROR: EVERY_ORG_API_PUBLIC_KEY environment variable not set');
    console.log('\nPlease set it in your .env file or export it:');
    console.log('export EVERY_ORG_API_PUBLIC_KEY="your-key-here"');
    process.exit(1);
  }
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Search: "${testCase.searchTerm}"`);
    console.log(`   Expected: ${testCase.expectedSlug}`);
    console.log(`   ${testCase.description}`);
    console.log('-'.repeat(80));
    
    const searchResults = await searchEveryOrg(testCase.searchTerm);
    const analysis = analyzeResults(testCase.searchTerm, searchResults, testCase.expectedSlug);
    
    console.log(`\n   Results: ${searchResults.length} organizations found`);
    
    if (searchResults.length > 0) {
      console.log('\n   Top 5 Results:');
      searchResults.slice(0, 5).forEach((org, index) => {
        const relevanceScore = calculateRelevanceScore(testCase.searchTerm, org);
        const isExpected = org.slug === testCase.expectedSlug;
        const marker = isExpected ? '✅' : index === 0 ? '🔝' : '  ';
        
        console.log(`   ${marker} #${index + 1}: ${org.name}`);
        console.log(`      Slug: ${org.slug}`);
        console.log(`      Relevance Score: ${relevanceScore}`);
        if (org.nteeCode) {
          console.log(`      NTEE: ${org.nteeCode} - ${org.nteeCodeMeaning || 'N/A'}`);
        }
        if (org.locationAddress) {
          console.log(`      Location: ${org.locationAddress}`);
        }
      });
    }
    
    if (analysis.issues.length > 0) {
      console.log('\n   ⚠️  Issues Found:');
      analysis.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    if (analysis.warnings.length > 0) {
      console.log('\n   ⚡ Warnings:');
      analysis.warnings.forEach(warning => console.log(`      - ${warning}`));
    }
    
    results.push({
      testCase,
      searchResults,
      analysis,
      passed: analysis.issues.length === 0 && searchResults[0]?.slug === testCase.expectedSlug
    });
    
    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.testCase.name}`);
      if (r.searchResults.length > 0) {
        console.log(`     Got: ${r.searchResults[0].name} (${r.searchResults[0].slug})`);
        console.log(`     Expected: ${r.testCase.expectedSlug}`);
      }
    });
  }
  
  // Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS\n');
  
  const totalIssues = results.reduce((sum, r) => sum + r.analysis.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.analysis.warnings.length, 0);
  
  if (totalIssues > 0) {
    console.log(`Found ${totalIssues} critical issues with fuzzy search results:`);
    console.log('1. Implement stricter filtering for acronym confusion');
    console.log('2. Add relevance scoring to re-rank results');
    console.log('3. Filter out corporate entities when not explicitly searched');
    console.log('4. Consider using exact match API endpoint when available');
  }
  
  if (totalWarnings > 0) {
    console.log(`\nFound ${totalWarnings} warnings:`);
    console.log('1. Expected organizations not appearing as top results');
    console.log('2. Consider implementing custom ranking algorithm');
    console.log('3. May need to use organization name normalization');
  }
  
  if (totalIssues === 0 && totalWarnings === 0) {
    console.log('✅ No major issues found with fuzzy search!');
    console.log('The current filtering logic appears to be working correctly.');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});