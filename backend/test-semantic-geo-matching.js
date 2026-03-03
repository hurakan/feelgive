#!/usr/bin/env node

/**
 * Test Semantic Geographic Matching
 * 
 * Demonstrates how semantic matching works vs physical location matching
 * using real data from Every.org Nigeria humanitarian search
 */

// Real data from Every.org search
const NIGERIA_ORGS = [
  {
    name: 'Nigerian International Humanitarian Foundation Of New England Inc',
    location: 'LYNN, MA',
    description: 'Nigerian International Humanitarian Foundation Of New England Inc is a nonprofit organization focused on providing human services. It is based in Lynn, MA. It received its nonprofit status in 2014.',
    nteeCode: 'P20',
    nteeMeaning: 'Human Service Organizations',
    tags: ['humans'],
  },
  {
    name: 'Nigeria Gives',
    location: 'AUSTIN, TX',
    description: 'An organization focused on international issues. It received its nonprofit status in 2023.',
    nteeCode: 'Q33',
    nteeMeaning: 'International Development',
    tags: [],
  },
  {
    name: 'We Go - Nigeria',
    location: 'ROCKWALL, TX',
    description: 'We Go - Nigeria is a nonprofit religious or spiritual organization. It is based in Rockwall, TX. It received its nonprofit status in 2019.',
    nteeCode: 'X21',
    nteeMeaning: 'Christianity',
    tags: ['religion', 'christianity'],
  },
  {
    name: 'Nigeria Peoples Alliance Inc',
    location: 'RIVERDALE, GA',
    description: 'An organization focused on providing human services. It received its nonprofit status in 2022.',
    nteeCode: 'P20',
    nteeMeaning: 'Human Service Organizations',
    tags: [],
  },
  {
    name: 'Bridges To Nigeria',
    location: 'MURRAY, UT',
    description: 'Bridges To Nigeria is a nonprofit organization focused on international issues. It is based in Murray, UT. It received its nonprofit status in 2013.',
    nteeCode: 'Q33',
    nteeMeaning: 'International Development',
    tags: ['humans'],
  },
  {
    name: 'Save Nigeria Group Usa Inc',
    location: 'WORTHINGTON, MN',
    description: 'An organization focused on public or societal benefit. It received its nonprofit status in 2022.',
    nteeCode: 'W70',
    nteeMeaning: 'Leadership Development',
    tags: ['leadershipdevelopment'],
  },
  {
    name: 'Nigeria Soccer Federation Inc',
    location: 'RICHARDSON, TX',
    description: 'Nigeria Soccer Federation Inc is a nonprofit organization focused on recreation, sports, leisure, or athletics. It is based in Washington, DC. It received its nonprofit status in 2016.',
    nteeCode: 'N70',
    nteeMeaning: 'Amateur Sports Competitions',
    tags: ['humans', 'athletics'],
  },
  {
    name: 'Across Nigeria',
    location: 'NEW HARTFORD, CT',
    description: 'Across Nigeria is a nonprofit religious or spiritual organization. It is based in Plainville, CT. It received its nonprofit status in 2019.',
    nteeCode: 'X20',
    nteeMeaning: 'Christianity',
    tags: ['religion', 'christianity'],
  },
  {
    name: 'Help Nigeria',
    location: 'WASHINGTON, MI',
    description: 'An organization focused on international issues. It received its nonprofit status in 2020.',
    nteeCode: 'Q33',
    nteeMeaning: 'International Development',
    tags: [],
  },
  {
    name: 'Kidsake Nigeria',
    location: 'KATY, TX',
    description: 'Kidsake Nigeria is a nonprofit organization focused on providing human services. It is based in Katy, TX. It received its nonprofit status in 2019.',
    nteeCode: 'P30',
    nteeMeaning: 'Children and Youth Services',
    tags: ['humans'],
  },
];

// Add Thailand org for comparison
const THAILAND_ORG = {
  name: 'Thailand Humanitarian Academic Initiative',
  location: 'BANGKOK, TH',
  description: 'Thailand Humanitarian Academic Initiative is a nonprofit organization focused on education and humanitarian work in Thailand.',
  nteeCode: 'B20',
  nteeMeaning: 'Education',
  tags: ['education'],
};

// Demonym dictionary
const DEMONYMS = {
  'nigeria': ['nigerian', 'nigerians'],
  'thailand': ['thai', 'thais'],
  'united states': ['american', 'americans'],
  'syria': ['syrian', 'syrians'],
  'turkey': ['turkish', 'turks'],
  'gaza': ['gazan', 'gazans', 'palestinian', 'palestinians'],
};

// Regional groupings
const REGIONS = {
  'nigeria': ['west africa', 'africa'],
  'thailand': ['southeast asia', 'asia'],
  'syria': ['middle east', 'levant'],
  'turkey': ['middle east', 'anatolia'],
  'gaza': ['middle east', 'palestine'],
};

/**
 * Extract geographic score from organization name
 */
function extractGeoFromName(orgName, targetCountry) {
  const nameLower = orgName.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Exact country match in name
  if (nameLower.includes(targetLower)) {
    return { score: 40, reason: `Name contains "${targetCountry}"` };
  }
  
  // Demonym match
  const demonyms = DEMONYMS[targetLower] || [];
  for (const demonym of demonyms) {
    if (nameLower.includes(demonym)) {
      return { score: 40, reason: `Name contains demonym "${demonym}"` };
    }
  }
  
  // Regional match
  const regions = REGIONS[targetLower] || [];
  for (const region of regions) {
    if (nameLower.includes(region)) {
      return { score: 20, reason: `Name contains region "${region}"` };
    }
  }
  
  return { score: 0, reason: 'No geographic match in name' };
}

/**
 * Extract geographic score from description
 */
function extractGeoFromDescription(description, targetCountry) {
  const descLower = description.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  // Service area patterns
  const servicePatterns = [
    `works in ${targetLower}`,
    `serves ${targetLower}`,
    `operates in ${targetLower}`,
    `${targetLower} communities`,
    `focused on ${targetLower}`,
  ];
  
  for (const pattern of servicePatterns) {
    if (descLower.includes(pattern)) {
      return { score: 30, reason: `Description mentions "${pattern}"` };
    }
  }
  
  // Country mention anywhere
  if (descLower.includes(targetLower)) {
    return { score: 15, reason: `Description mentions "${targetCountry}"` };
  }
  
  // Regional mention
  const regions = REGIONS[targetLower] || [];
  for (const region of regions) {
    if (descLower.includes(region)) {
      return { score: 10, reason: `Description mentions region "${region}"` };
    }
  }
  
  return { score: 0, reason: 'No geographic match in description' };
}

/**
 * Get search query score
 */
function getSearchQueryScore(query, targetCountry) {
  const queryLower = query.toLowerCase();
  const targetLower = targetCountry.toLowerCase();
  
  if (queryLower.includes(targetLower)) {
    return { score: 20, reason: `Matched query "${query}"` };
  }
  
  return { score: 0, reason: 'Query did not contain target country' };
}

/**
 * Get NTEE code score
 */
function getNTEEGeoScore(nteeCode) {
  if (!nteeCode) {
    return { score: 0, reason: 'No NTEE code' };
  }
  
  // International development
  if (nteeCode.startsWith('Q3')) {
    return { score: 10, reason: 'International Development (Q3x)' };
  }
  
  // Human services
  if (nteeCode.startsWith('P')) {
    return { score: 5, reason: 'Human Services (Pxx)' };
  }
  
  return { score: 0, reason: `NTEE ${nteeCode} not internationally focused` };
}

/**
 * Compute semantic geographic relevance
 */
function computeSemanticGeoRelevance(org, targetCountry, searchQuery) {
  const nameResult = extractGeoFromName(org.name, targetCountry);
  const descResult = extractGeoFromDescription(org.description, targetCountry);
  const queryResult = getSearchQueryScore(searchQuery, targetCountry);
  const nteeResult = getNTEEGeoScore(org.nteeCode);
  
  const totalScore = nameResult.score + descResult.score + queryResult.score + nteeResult.score;
  
  return {
    totalScore,
    breakdown: {
      name: nameResult,
      description: descResult,
      query: queryResult,
      ntee: nteeResult,
    },
  };
}

/**
 * Compute physical location match (old approach)
 */
function computePhysicalLocationMatch(org, targetCountry) {
  const location = org.location || '';
  
  // Parse location (e.g., "LYNN, MA" → USA)
  let orgCountry = 'Unknown';
  if (location.includes(',')) {
    const parts = location.split(',').map(p => p.trim());
    if (parts.length === 2 && parts[1].length === 2) {
      orgCountry = 'United States';
    }
  }
  
  // Compare with target
  if (orgCountry === targetCountry) {
    return { match: 'EXACT', score: 100, reason: `Based in ${targetCountry}` };
  } else if (orgCountry === 'Unknown') {
    return { match: 'GLOBAL', score: 30, reason: 'Location unknown, may operate globally' };
  } else {
    return { match: 'MISMATCH', score: 0, reason: `Based in ${orgCountry}, not ${targetCountry}` };
  }
}

/**
 * Run test
 */
function runTest() {
  console.log('🧪 SEMANTIC GEOGRAPHIC MATCHING TEST');
  console.log('='.repeat(80));
  console.log('\nTarget: Nigeria humanitarian crisis');
  console.log('Search Query: "Nigeria humanitarian"');
  console.log('\n' + '='.repeat(80));
  
  // Test all Nigeria orgs
  const results = NIGERIA_ORGS.map(org => {
    const semantic = computeSemanticGeoRelevance(org, 'Nigeria', 'Nigeria humanitarian');
    const physical = computePhysicalLocationMatch(org, 'Nigeria');
    
    return {
      org,
      semantic,
      physical,
    };
  });
  
  // Add Thailand org
  const thailandSemantic = computeSemanticGeoRelevance(THAILAND_ORG, 'Nigeria', 'Nigeria humanitarian');
  const thailandPhysical = computePhysicalLocationMatch(THAILAND_ORG, 'Nigeria');
  
  results.push({
    org: THAILAND_ORG,
    semantic: thailandSemantic,
    physical: thailandPhysical,
  });
  
  // Sort by semantic score
  results.sort((a, b) => b.semantic.totalScore - a.semantic.totalScore);
  
  // Display results
  console.log('\n📊 RESULTS (sorted by semantic score):\n');
  
  results.forEach((result, index) => {
    const { org, semantic, physical } = result;
    
    console.log(`${index + 1}. ${org.name}`);
    console.log(`   Location: ${org.location}`);
    console.log(`   NTEE: ${org.nteeCode} - ${org.nteeMeaning}`);
    console.log('');
    console.log(`   🎯 SEMANTIC SCORE: ${semantic.totalScore}/100`);
    console.log(`      Name:        ${semantic.breakdown.name.score} pts - ${semantic.breakdown.name.reason}`);
    console.log(`      Description: ${semantic.breakdown.description.score} pts - ${semantic.breakdown.description.reason}`);
    console.log(`      Query:       ${semantic.breakdown.query.score} pts - ${semantic.breakdown.query.reason}`);
    console.log(`      NTEE:        ${semantic.breakdown.ntee.score} pts - ${semantic.breakdown.ntee.reason}`);
    console.log('');
    console.log(`   📍 PHYSICAL LOCATION: ${physical.match} (${physical.score}/100)`);
    console.log(`      ${physical.reason}`);
    console.log('');
    console.log('-'.repeat(80));
    console.log('');
  });
  
  // Summary
  console.log('\n📈 SUMMARY:\n');
  
  const semanticFiltered = results.filter(r => r.semantic.totalScore >= 30);
  const physicalFiltered = results.filter(r => r.physical.score >= 30);
  
  console.log(`Total orgs tested: ${results.length}`);
  console.log('');
  console.log('SEMANTIC MATCHING (threshold: 30/100):');
  console.log(`  Passed filter: ${semanticFiltered.length} orgs`);
  console.log(`  Failed filter: ${results.length - semanticFiltered.length} orgs`);
  console.log('  Passed orgs:');
  semanticFiltered.forEach(r => {
    console.log(`    - ${r.org.name} (${r.semantic.totalScore}/100)`);
  });
  console.log('  Failed orgs:');
  results.filter(r => r.semantic.totalScore < 30).forEach(r => {
    console.log(`    - ${r.org.name} (${r.semantic.totalScore}/100)`);
  });
  console.log('');
  console.log('PHYSICAL LOCATION MATCHING (threshold: 30/100):');
  console.log(`  Passed filter: ${physicalFiltered.length} orgs`);
  console.log(`  Failed filter: ${results.length - physicalFiltered.length} orgs`);
  console.log('  Passed orgs:');
  physicalFiltered.forEach(r => {
    console.log(`    - ${r.org.name} (${r.physical.match})`);
  });
  console.log('  Failed orgs:');
  results.filter(r => r.physical.score < 30).forEach(r => {
    console.log(`    - ${r.org.name} (${r.physical.match})`);
  });
  console.log('');
  console.log('🎯 KEY FINDINGS:');
  console.log('');
  
  const thailandResult = results.find(r => r.org.name.includes('Thailand'));
  console.log(`1. Thailand org semantic score: ${thailandResult.semantic.totalScore}/100`);
  console.log(`   → ${thailandResult.semantic.totalScore >= 30 ? '❌ PASSES' : '✅ FILTERED OUT'} (threshold: 30)`);
  console.log('');
  
  const nigeriaRelevant = results.filter(r => 
    r.org.name.toLowerCase().includes('nigeria') && r.semantic.totalScore >= 30
  );
  console.log(`2. Nigeria-relevant orgs passing semantic filter: ${nigeriaRelevant.length}`);
  console.log('');
  
  const physicalMismatches = results.filter(r => r.physical.match === 'MISMATCH');
  console.log(`3. Orgs filtered out by physical location: ${physicalMismatches.length}`);
  console.log(`   (All US-based orgs working in Nigeria)`);
  console.log('');
  
  console.log('✅ CONCLUSION:');
  console.log('   Semantic matching correctly identifies Nigeria-relevant orgs');
  console.log('   and filters out Thailand org, while physical location matching');
  console.log('   would filter out ALL orgs (including Nigeria-relevant ones).');
  console.log('');
  console.log('='.repeat(80));
}

// Run the test
runTest();