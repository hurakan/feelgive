#!/usr/bin/env node

/**
 * Test script to verify news API filtering is working correctly
 * Tests that location-specific keywords are properly applied
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

async function testNewsFiltering() {
  console.log('🧪 Testing News API Filtering\n');
  console.log('=' .repeat(60));

  // Test 1: Nigeria-specific news
  console.log('\n📍 Test 1: Fetching Nigeria-specific news');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.post(`${API_BASE_URL}/news/fetch`, {
      keywords: [
        'Nigeria disaster',
        'Nigeria emergency',
        'Nigeria crisis',
        'Nigeria humanitarian',
        'Nigeria conflict'
      ],
      limit: 10,
      region: 'Nigeria',
      locale: 'en',
      category: 'crisis',
      forceRefresh: true
    });

    console.log(`✅ Received ${response.data.count} articles`);
    console.log(`   From cache: ${response.data.fromCache}`);
    console.log(`   Data source: ${response.data.dataSource}`);
    
    if (response.data.articles && response.data.articles.length > 0) {
      console.log('\n📰 Sample articles:');
      response.data.articles.slice(0, 5).forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   Source: ${article.source} (${article.apiSource})`);
        console.log(`   Published: ${new Date(article.publishedAt).toLocaleString()}`);
        
        // Check if article mentions Nigeria
        const mentionsNigeria = 
          article.title.toLowerCase().includes('nigeria') ||
          (article.description && article.description.toLowerCase().includes('nigeria'));
        
        if (mentionsNigeria) {
          console.log(`   ✅ Contains "Nigeria" - Filter working!`);
        } else {
          console.log(`   ⚠️  Does NOT contain "Nigeria" - May need filter adjustment`);
        }
      });
    } else {
      console.log('⚠️  No articles returned');
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  // Test 2: Different location (Ukraine)
  console.log('\n\n📍 Test 2: Fetching Ukraine-specific news');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.post(`${API_BASE_URL}/news/fetch`, {
      keywords: [
        'Ukraine disaster',
        'Ukraine emergency',
        'Ukraine crisis',
        'Ukraine humanitarian',
        'Ukraine conflict'
      ],
      limit: 5,
      region: 'Ukraine',
      locale: 'en',
      category: 'crisis',
      forceRefresh: true
    });

    console.log(`✅ Received ${response.data.count} articles`);
    
    if (response.data.articles && response.data.articles.length > 0) {
      console.log('\n📰 Sample articles:');
      response.data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   Source: ${article.source} (${article.apiSource})`);
        
        const mentionsUkraine = 
          article.title.toLowerCase().includes('ukraine') ||
          (article.description && article.description.toLowerCase().includes('ukraine'));
        
        if (mentionsUkraine) {
          console.log(`   ✅ Contains "Ukraine" - Filter working!`);
        } else {
          console.log(`   ⚠️  Does NOT contain "Ukraine" - May need filter adjustment`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  // Test 3: Check API usage stats
  console.log('\n\n📊 Test 3: Checking API usage stats');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/news/usage`);
    
    console.log('\nAPI Usage Statistics:');
    response.data.forEach(stat => {
      console.log(`\n${stat.name} (${stat.provider}):`);
      console.log(`  Status: ${stat.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`  Daily: ${stat.dailyUsage}/${stat.dailyLimit} (${stat.dailyRemaining} remaining)`);
      if (stat.hourlyLimit) {
        console.log(`  Hourly: ${stat.hourlyUsage}/${stat.hourlyLimit} (${stat.hourlyRemaining} remaining)`);
      }
      console.log(`  Total articles fetched: ${stat.totalArticlesFetched}`);
      if (stat.lastError) {
        console.log(`  ⚠️  Last error: ${stat.lastError}`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing complete!\n');
}

// Run the tests
testNewsFiltering().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});