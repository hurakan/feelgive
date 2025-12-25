/**
 * Test script to verify news filtering works correctly for different locations
 * This tests that each location gets its own unique articles, not duplicates
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testLocationFiltering() {
  console.log('🧪 Testing News Filtering for Multiple Locations\n');
  console.log('=' .repeat(60));

  const locations = [
    { name: 'Ukraine', keywords: ['Ukraine disaster', 'Ukraine emergency', 'Ukraine crisis'] },
    { name: 'Middle East', keywords: ['Middle East disaster', 'Middle East emergency', 'Middle East crisis'] },
    { name: 'Africa', keywords: ['Africa disaster', 'Africa emergency', 'Africa crisis'] },
    { name: 'Argentina', keywords: ['Argentina disaster', 'Argentina emergency', 'Argentina crisis'] },
    { name: 'Somalia', keywords: ['Somalia disaster', 'Somalia emergency', 'Somalia crisis'] },
  ];

  const results = [];

  for (const location of locations) {
    console.log(`\n📍 Testing: ${location.name}`);
    console.log('-'.repeat(60));

    try {
      const response = await fetch(`${API_BASE_URL}/news/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: location.keywords,
          limit: 5,
          region: location.name.toLowerCase(),
          locale: 'en',
          category: 'crisis',
          forceRefresh: true, // Force fresh fetch to bypass cache
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Received ${data.count} articles`);
      console.log(`   From cache: ${data.fromCache}`);
      console.log(`   Data source: ${data.dataSource}`);
      
      if (data.articles && data.articles.length > 0) {
        console.log(`\n   Sample articles:`);
        data.articles.slice(0, 3).forEach((article, idx) => {
          console.log(`   ${idx + 1}. ${article.title.substring(0, 80)}...`);
          console.log(`      Source: ${article.source} | API: ${article.apiSource}`);
        });
      } else {
        console.log(`   ⚠️  No articles found`);
      }

      results.push({
        location: location.name,
        count: data.count,
        articles: data.articles || [],
        fromCache: data.fromCache,
      });

    } catch (error) {
      console.error(`❌ Error fetching news for ${location.name}:`, error.message);
      results.push({
        location: location.name,
        count: 0,
        articles: [],
        error: error.message,
      });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Analysis
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 ANALYSIS');
  console.log('='.repeat(60));

  // Check for duplicate articles across locations
  const allArticleUrls = new Map();
  let duplicatesFound = false;

  results.forEach(result => {
    result.articles.forEach(article => {
      if (allArticleUrls.has(article.url)) {
        const previousLocation = allArticleUrls.get(article.url);
        console.log(`\n⚠️  DUPLICATE FOUND:`);
        console.log(`   Article: "${article.title.substring(0, 60)}..."`);
        console.log(`   Appears in both: ${previousLocation} AND ${result.location}`);
        duplicatesFound = true;
      } else {
        allArticleUrls.set(article.url, result.location);
      }
    });
  });

  if (!duplicatesFound) {
    console.log('\n✅ No duplicate articles found across locations!');
  }

  // Summary
  console.log('\n📈 Summary:');
  results.forEach(result => {
    const status = result.count > 0 ? '✅' : '⚠️';
    console.log(`   ${status} ${result.location}: ${result.count} articles`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(duplicatesFound ? '❌ TEST FAILED: Duplicates found' : '✅ TEST PASSED: All locations have unique articles');
  console.log('='.repeat(60));
}

// Run the test
testLocationFiltering().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});