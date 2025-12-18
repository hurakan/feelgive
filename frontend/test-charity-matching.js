/**
 * Test Script: Charity Matching Algorithm
 * 
 * This script tests the charity matching algorithm with various crisis scenarios
 * to verify that different organizations are being recommended based on context.
 * 
 * Run with: node test-charity-matching.js
 */

// Simulated charity data (subset from actual data)
const CHARITIES = [
  { id: 'dr-001', name: 'International Red Cross', causes: ['disaster_relief'], countries: ['global'], trustScore: 95, geographicFlexibility: 5, addressedNeeds: ['shelter', 'food', 'water', 'rescue', 'medical'] },
  { id: 'dr-002', name: 'Direct Relief', causes: ['disaster_relief'], countries: ['US', 'CA', 'MX'], trustScore: 92, geographicFlexibility: 2, addressedNeeds: ['rescue', 'medical', 'shelter'] },
  { id: 'dr-003', name: 'Habitat for Humanity', causes: ['disaster_relief'], countries: ['global'], trustScore: 90, geographicFlexibility: 4, addressedNeeds: ['shelter', 'education'] },
  
  { id: 'hc-001', name: 'Doctors Without Borders', causes: ['health_crisis'], countries: ['global'], trustScore: 96, geographicFlexibility: 5, addressedNeeds: ['medical', 'water', 'sanitation'] },
  { id: 'hc-002', name: 'UNICEF', causes: ['health_crisis'], countries: ['global'], trustScore: 94, geographicFlexibility: 5, addressedNeeds: ['medical', 'education', 'water'] },
  { id: 'hc-003', name: 'Partners In Health', causes: ['health_crisis'], countries: ['global'], trustScore: 93, geographicFlexibility: 4, addressedNeeds: ['medical', 'mental_health', 'education'] },
  
  { id: 'ce-001', name: 'The Nature Conservancy', causes: ['climate_events'], countries: ['global'], trustScore: 93, geographicFlexibility: 4, addressedNeeds: ['shelter', 'food', 'water', 'education'] },
  { id: 'ce-002', name: 'American Red Cross', causes: ['climate_events', 'disaster_relief'], countries: ['US'], trustScore: 91, geographicFlexibility: 1, addressedNeeds: ['shelter', 'rescue', 'mental_health'] },
  { id: 'ce-003', name: 'Ocean Conservancy', causes: ['climate_events'], countries: ['global'], trustScore: 89, geographicFlexibility: 4, addressedNeeds: ['shelter', 'water', 'food', 'education'] },
  
  { id: 'hum-001', name: 'UNHCR', causes: ['humanitarian_crisis'], countries: ['global'], trustScore: 97, geographicFlexibility: 5, addressedNeeds: ['shelter', 'food', 'water', 'medical', 'education', 'mental_health'] },
  { id: 'hum-002', name: 'World Food Programme', causes: ['humanitarian_crisis'], countries: ['global'], trustScore: 95, geographicFlexibility: 5, addressedNeeds: ['food', 'water', 'education'] },
  { id: 'hum-003', name: 'International Rescue Committee', causes: ['humanitarian_crisis', 'health_crisis'], countries: ['global'], trustScore: 94, geographicFlexibility: 5, addressedNeeds: ['medical', 'mental_health', 'water', 'sanitation', 'education'] },
  
  { id: 'sj-001', name: 'Save the Children', causes: ['social_justice'], countries: ['global'], trustScore: 92, geographicFlexibility: 5, addressedNeeds: ['education', 'food', 'medical', 'shelter'] },
  { id: 'sj-004', name: 'RAICES', causes: ['social_justice'], countries: ['US', 'MX'], trustScore: 94, geographicFlexibility: 2, addressedNeeds: ['legal_aid', 'education', 'mental_health'] },
  { id: 'sj-005', name: 'Al Otro Lado', causes: ['social_justice'], countries: ['US', 'MX'], trustScore: 91, geographicFlexibility: 2, addressedNeeds: ['shelter', 'food', 'legal_aid', 'mental_health', 'medical'] },
];

// Scoring function (simplified version of actual algorithm)
function scoreCharity(charity, classification) {
  let totalScore = 0;
  const breakdown = [];

  // 1. Cause match (10 points)
  const causeScore = 10;
  totalScore += causeScore;
  breakdown.push(`Cause: ${causeScore}`);

  // 2. Geographic relevance (0-15 points)
  let geoScore = 0;
  if (charity.countries.includes(classification.geo)) {
    geoScore = 10;
    breakdown.push(`Geo (direct): ${geoScore}`);
  } else if (charity.countries.includes('global')) {
    geoScore = charity.geographicFlexibility * 1.5;
    breakdown.push(`Geo (global): ${geoScore.toFixed(1)}`);
  }
  totalScore += geoScore;

  // 3. Needs matching (0-20 points)
  let needsScore = 0;
  if (classification.identified_needs.length > 0) {
    const matchedNeeds = classification.identified_needs.filter(need =>
      charity.addressedNeeds.includes(need)
    );
    if (matchedNeeds.length > 0) {
      needsScore = (matchedNeeds.length / classification.identified_needs.length) * 20;
      breakdown.push(`Needs (${matchedNeeds.length}/${classification.identified_needs.length}): ${needsScore.toFixed(1)}`);
    }
  } else {
    needsScore = 5;
    breakdown.push(`Needs (general): ${needsScore}`);
  }
  totalScore += needsScore;

  // 4. Trust score (0-10 points)
  const trustScore = (charity.trustScore / 100) * 10;
  totalScore += trustScore;
  breakdown.push(`Trust: ${trustScore.toFixed(1)}`);

  return { totalScore, breakdown };
}

// Test scenarios
const testScenarios = [
  // Disaster Relief
  { id: 1, cause: 'disaster_relief', geo: 'TR', geoName: 'Turkey', identified_needs: ['shelter', 'medical', 'rescue'], description: 'Turkey Earthquake' },
  { id: 2, cause: 'disaster_relief', geo: 'US', geoName: 'United States', identified_needs: ['shelter', 'rescue'], description: 'US Hurricane' },
  { id: 3, cause: 'disaster_relief', geo: 'MA', geoName: 'Morocco', identified_needs: ['shelter', 'medical', 'water'], description: 'Morocco Earthquake' },
  { id: 4, cause: 'disaster_relief', geo: 'PK', geoName: 'Pakistan', identified_needs: ['shelter', 'food', 'water'], description: 'Pakistan Floods' },
  { id: 5, cause: 'disaster_relief', geo: 'LY', geoName: 'Libya', identified_needs: ['shelter', 'medical', 'water'], description: 'Libya Floods' },
  
  // Health Crisis
  { id: 6, cause: 'health_crisis', geo: 'PS', geoName: 'Gaza', identified_needs: ['medical', 'water', 'sanitation'], description: 'Gaza Health Crisis' },
  { id: 7, cause: 'health_crisis', geo: 'MW', geoName: 'Malawi', identified_needs: ['medical', 'water'], description: 'Malawi Cholera' },
  { id: 8, cause: 'health_crisis', geo: 'CD', geoName: 'Congo', identified_needs: ['medical', 'sanitation'], description: 'Congo Ebola' },
  { id: 9, cause: 'health_crisis', geo: 'YE', geoName: 'Yemen', identified_needs: ['medical', 'food', 'water'], description: 'Yemen Health Crisis' },
  { id: 10, cause: 'health_crisis', geo: 'global', geoName: 'Global', identified_needs: ['medical', 'education'], description: 'Global Pandemic' },
  
  // Climate Events
  { id: 11, cause: 'climate_events', geo: 'US', geoName: 'United States', identified_needs: ['shelter', 'rescue'], description: 'US Wildfire' },
  { id: 12, cause: 'climate_events', geo: 'SO', geoName: 'Somalia', identified_needs: ['food', 'water'], description: 'Somalia Drought' },
  { id: 13, cause: 'climate_events', geo: 'ET', geoName: 'Ethiopia', identified_needs: ['food', 'water'], description: 'Ethiopia Drought' },
  { id: 14, cause: 'climate_events', geo: 'AU', geoName: 'Australia', identified_needs: ['shelter', 'rescue'], description: 'Australia Bushfire' },
  { id: 15, cause: 'climate_events', geo: 'BR', geoName: 'Brazil', identified_needs: ['shelter', 'water'], description: 'Brazil Floods' },
  
  // Humanitarian Crisis
  { id: 16, cause: 'humanitarian_crisis', geo: 'SD', geoName: 'Sudan', identified_needs: ['shelter', 'food', 'water', 'medical'], description: 'Sudan Conflict' },
  { id: 17, cause: 'humanitarian_crisis', geo: 'UA', geoName: 'Ukraine', identified_needs: ['shelter', 'food', 'medical'], description: 'Ukraine War' },
  { id: 18, cause: 'humanitarian_crisis', geo: 'AF', geoName: 'Afghanistan', identified_needs: ['food', 'shelter', 'medical'], description: 'Afghanistan Crisis' },
  { id: 19, cause: 'humanitarian_crisis', geo: 'SY', geoName: 'Syria', identified_needs: ['shelter', 'food', 'water', 'medical'], description: 'Syria Conflict' },
  { id: 20, cause: 'humanitarian_crisis', geo: 'YE', geoName: 'Yemen', identified_needs: ['food', 'water', 'medical'], description: 'Yemen Humanitarian' },
  
  // Social Justice
  { id: 21, cause: 'social_justice', geo: 'US', geoName: 'United States', identified_needs: ['legal_aid', 'shelter'], description: 'US Border Crisis' },
  { id: 22, cause: 'social_justice', geo: 'MX', geoName: 'Mexico', identified_needs: ['legal_aid', 'medical', 'shelter'], description: 'Mexico Migration' },
  { id: 23, cause: 'social_justice', geo: 'VE', geoName: 'Venezuela', identified_needs: ['food', 'medical', 'shelter'], description: 'Venezuela Migration' },
  { id: 24, cause: 'social_justice', geo: 'MM', geoName: 'Myanmar', identified_needs: ['shelter', 'food', 'medical'], description: 'Rohingya Crisis' },
  { id: 25, cause: 'social_justice', geo: 'global', geoName: 'Global', identified_needs: ['education', 'legal_aid'], description: 'Human Rights' },
];

// Run tests
console.log('CHARITY MATCHING ALGORITHM TEST REPORT');
console.log('=' .repeat(120));
console.log('\nTest ID\tCrisis Description\tCause\tLocation\tTop 3 Organizations\tScores');
console.log('-'.repeat(120));

const results = [];

testScenarios.forEach(scenario => {
  // Filter charities by cause
  const matches = CHARITIES.filter(c => c.causes.includes(scenario.cause));
  
  // Score each charity
  const scored = matches.map(charity => {
    const { totalScore, breakdown } = scoreCharity(charity, scenario);
    return { charity, totalScore, breakdown };
  });
  
  // Sort by total score
  scored.sort((a, b) => b.totalScore - a.totalScore);
  
  // Get top 3
  const top3 = scored.slice(0, 3);
  
  const orgNames = top3.map(s => s.charity.name).join(' | ');
  const scores = top3.map(s => s.totalScore.toFixed(1)).join(' | ');
  
  console.log(`${scenario.id}\t${scenario.description}\t${scenario.cause}\t${scenario.geoName}\t${orgNames}\t${scores}`);
  
  results.push({
    id: scenario.id,
    description: scenario.description,
    cause: scenario.cause,
    location: scenario.geoName,
    org1: top3[0]?.charity.name || 'N/A',
    score1: top3[0]?.totalScore.toFixed(1) || '0',
    org2: top3[1]?.charity.name || 'N/A',
    score2: top3[1]?.totalScore.toFixed(1) || '0',
    org3: top3[2]?.charity.name || 'N/A',
    score3: top3[2]?.totalScore.toFixed(1) || '0',
  });
});

console.log('\n' + '='.repeat(120));
console.log('\nGOOGLE SHEETS FORMAT (Copy below):');
console.log('='.repeat(120));
console.log('\nTest ID\tCrisis\tCause\tLocation\tOrg 1\tScore 1\tOrg 2\tScore 2\tOrg 3\tScore 3');

results.forEach(r => {
  console.log(`${r.id}\t${r.description}\t${r.cause}\t${r.location}\t${r.org1}\t${r.score1}\t${r.org2}\t${r.score2}\t${r.org3}\t${r.score3}`);
});

console.log('\n' + '='.repeat(120));
console.log('\nANALYSIS:');
console.log('- Total test scenarios: ' + testScenarios.length);
console.log('- Unique organizations appearing: ' + new Set(results.flatMap(r => [r.org1, r.org2, r.org3])).size);
console.log('- Disaster Relief tests: ' + results.filter(r => r.cause === 'disaster_relief').length);
console.log('- Health Crisis tests: ' + results.filter(r => r.cause === 'health_crisis').length);
console.log('- Climate Events tests: ' + results.filter(r => r.cause === 'climate_events').length);
console.log('- Humanitarian Crisis tests: ' + results.filter(r => r.cause === 'humanitarian_crisis').length);
console.log('- Social Justice tests: ' + results.filter(r => r.cause === 'social_justice').length);