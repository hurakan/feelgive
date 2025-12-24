import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import NewsAPIConfig from './src/models/NewsAPIConfig.js';

dotenv.config();

async function testCurrentsAPI() {
  console.log('=== Testing Currents API ===\n');
  
  // Connect to MongoDB to get API key
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feelgive');
  const config = await NewsAPIConfig.findOne({ provider: 'currents' });
  
  if (!config) {
    console.error('❌ Currents API config not found in database');
    await mongoose.disconnect();
    process.exit(1);
  }
  
  const CURRENTS_API_KEY = config.apiKey;
  console.log('API Key:', CURRENTS_API_KEY.substring(0, 10) + '...');
  
  // Test 1: Simple search with minimal keywords
  console.log('\n--- Test 1: Simple search (1 keyword) ---');
  try {
    const startTime = Date.now();
    const response = await axios.get('https://api.currentsapi.services/v1/search', {
      params: {
        keywords: 'disaster',
        language: 'en',
        page_size: 5
      },
      headers: {
        'Authorization': CURRENTS_API_KEY
      },
      timeout: 90000 // 90 seconds
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Success in ${duration}ms`);
    console.log(`Articles returned: ${response.data.news?.length || 0}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    if (error.code === 'ECONNABORTED') {
      console.error('   Reason: Request timeout');
    }
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
  
  // Test 2: Latest news endpoint (no search)
  console.log('\n--- Test 2: Latest news (no search) ---');
  try {
    const startTime = Date.now();
    const response = await axios.get('https://api.currentsapi.services/v1/latest-news', {
      params: {
        language: 'en',
        page_size: 5
      },
      headers: {
        'Authorization': CURRENTS_API_KEY
      },
      timeout: 90000
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Success in ${duration}ms`);
    console.log(`Articles returned: ${response.data.news?.length || 0}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    if (error.code === 'ECONNABORTED') {
      console.error('   Reason: Request timeout');
    }
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
  
  // Test 3: Search with category instead of keywords
  console.log('\n--- Test 3: Category search ---');
  try {
    const startTime = Date.now();
    const response = await axios.get('https://api.currentsapi.services/v1/latest-news', {
      params: {
        language: 'en',
        category: 'world',
        page_size: 5
      },
      headers: {
        'Authorization': CURRENTS_API_KEY
      },
      timeout: 90000
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Success in ${duration}ms`);
    console.log(`Articles returned: ${response.data.news?.length || 0}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    if (error.code === 'ECONNABORTED') {
      console.error('   Reason: Request timeout');
    }
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
  
  console.log('\n=== Test Complete ===');
  await mongoose.disconnect();
}

testCurrentsAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});