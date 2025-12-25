#!/usr/bin/env tsx

/**
 * Test script for the recommendation engine
 * Tests real-world scenarios with debug output
 */

import { recommendationOrchestrator } from './src/services/recommendations/orchestrator.js';
import { ArticleContext } from './src/services/recommendations/orchestrator.js';

// Test scenarios
const scenarios: { name: string; context: ArticleContext }[] = [
  {
    name: 'Turkey Earthquake',
    context: {
      title: 'Massive 7.8 Earthquake Strikes Turkey and Syria',
      description: 'A devastating earthquake has struck southern Turkey and northern Syria, causing widespread destruction and thousands of casualties. Emergency response teams are working to rescue survivors from collapsed buildings.',
      entities: {
        geography: {
          country: 'Turkey',
          region: 'Southern Turkey',
        },
        disasterType: 'earthquake',
        affectedGroup: 'families',
      },
      causes: ['disaster-relief', 'humanitarian-aid'],
      keywords: ['earthquake', 'Turkey', 'Syria', 'disaster', 'emergency', 'rescue'],
    },
  },
  {
    name: 'California Wildfire',
    context: {
      title: 'Wildfire Forces Evacuations in Northern California',
      description: 'A rapidly spreading wildfire in Northern California has forced thousands to evacuate their homes. Firefighters are battling the blaze as strong winds fuel the flames.',
      entities: {
        geography: {
          country: 'United States',
          region: 'California',
          city: 'Northern California',
        },
        disasterType: 'wildfire',
        affectedGroup: 'residents',
      },
      causes: ['disaster-relief', 'climate-action'],
      keywords: ['wildfire', 'California', 'evacuation', 'fire', 'emergency'],
    },
  },
  {
    name: 'Bangladesh Flood',
    context: {
      title: 'Severe Flooding Displaces Millions in Bangladesh',
      description: 'Monsoon rains have caused severe flooding across Bangladesh, displacing millions of people and destroying crops. Humanitarian organizations are providing emergency shelter and food assistance.',
      entities: {
        geography: {
          country: 'Bangladesh',
        },
        disasterType: 'flood',
        affectedGroup: 'displaced families',
      },
      causes: ['disaster-relief', 'humanitarian-aid'],
      keywords: ['flood', 'Bangladesh', 'monsoon', 'displaced', 'humanitarian'],
    },
  },
];

/**
 * Print debug report
 */
function printDebugReport(scenarioName: string, result: any) {
  console.log('\n' + '='.repeat(80));
  console.log(`SCENARIO: ${scenarioName}`);
  console.log('='.repeat(80));

  if (result.debug) {
    console.log('\n📊 DEBUG INFORMATION:');
    console.log(`  Processing Time: ${result.debug.processingTimeMs}ms`);
    console.log(`  Cache Hit: ${result.debug.cacheHit ? 'YES' : 'NO'}`);
    console.log(`  Candidates Generated: ${result.debug.candidateCount}`);
    console.log(`  Enriched: ${result.debug.enrichmentCount}`);
    console.log(`  Trust Coverage: ${result.debug.trustCoverage.toFixed(1)}%`);
    
    console.log('\n🔍 SEARCH STRATEGY:');
    console.log(`  Causes Used: ${result.debug.causesUsed.join(', ')}`);
    console.log(`  Search Terms: ${result.debug.searchTermsUsed.join(', ')}`);
    
    console.log('\n🌍 GEOGRAPHIC DISTRIBUTION:');
    console.log(`  Tier 1 (Direct): ${result.debug.geoTierCounts.tier1}`);
    console.log(`  Tier 2 (Regional): ${result.debug.geoTierCounts.tier2}`);
    console.log(`  Tier 3 (Global): ${result.debug.geoTierCounts.tier3}`);
    
    console.log('\n🚫 EXCLUSIONS:');
    console.log(`  Vetting: ${result.debug.excludedCounts.vetting}`);
    console.log(`  Cause Mismatch: ${result.debug.excludedCounts.cause}`);
    
    console.log('\n📈 CACHE STATS:');
    console.log(`  Hits: ${result.debug.cacheStats.hits}`);
    console.log(`  Misses: ${result.debug.cacheStats.misses}`);
    console.log(`  Hit Rate: ${result.debug.cacheStats.hitRate.toFixed(1)}%`);
  }

  console.log('\n🏆 TOP 10 RECOMMENDATIONS:');
  console.log('-'.repeat(80));

  result.nonprofits.slice(0, 10).forEach((org: any, index: number) => {
    console.log(`\n${index + 1}. ${org.name} (${org.slug})`);
    console.log(`   Location: ${org.locationAddress || 'Unknown'}`);
    console.log(`   Geo Tier: ${org.geoTier.toUpperCase()}`);
    console.log(`   Score: ${org.score.total.toFixed(1)} (Geo: ${org.score.geo}, Cause: ${org.score.cause}, Trust: ${org.score.trust}, Quality: ${org.score.quality})`);
    console.log(`   Website: ${org.websiteUrl || 'N/A'}`);
    console.log(`   Profile: ${org.profileUrl}`);
    
    if (org.trustVetting) {
      console.log(`   Trust: ${org.trustVetting.trustScore !== undefined ? org.trustVetting.trustScore + '%' : 'Unknown'} (${org.trustVetting.vettedStatus})`);
    }
    
    console.log(`   Reasons:`);
    org.reasons.forEach((reason: string) => {
      console.log(`     • ${reason}`);
    });
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🚀 Starting Recommendation Engine Tests\n');

  for (const scenario of scenarios) {
    try {
      const result = await recommendationOrchestrator.recommendNonprofitsForArticle(
        scenario.context,
        { debug: true, topN: 10 }
      );

      printDebugReport(scenario.name, result);

      // Verify results
      if (result.nonprofits.length === 0) {
        console.log(`⚠️  WARNING: No recommendations found for ${scenario.name}`);
      } else {
        console.log(`✅ ${scenario.name}: ${result.nonprofits.length} recommendations`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${scenario.name}:`, error);
    }
  }

  // Test cache hit
  console.log('\n🔄 Testing Cache Hit...');
  const cacheTestResult = await recommendationOrchestrator.recommendNonprofitsForArticle(
    scenarios[0].context,
    { debug: true, topN: 10 }
  );

  if (cacheTestResult.debug?.cacheHit) {
    console.log('✅ Cache hit successful!');
  } else {
    console.log('⚠️  Cache hit failed (expected on first run)');
  }

  console.log('\n✅ All tests complete!');
}

// Run tests
runTests().catch(console.error);