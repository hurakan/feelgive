import dotenv from 'dotenv';
import mongoose from 'mongoose';
import NewsAPIConfig from '../src/models/NewsAPIConfig.js';

dotenv.config();

const CRISIS_KEYWORDS = [
  'earthquake', 'flood', 'hurricane', 'wildfire', 'tsunami', 'drought',
  'refugee', 'conflict', 'war', 'disaster', 'emergency', 'crisis',
  'humanitarian', 'evacuation', 'casualties', 'displaced', 'relief'
];

const newsAPIs = [
  {
    name: 'NewsAPI.org Primary',
    provider: 'newsapi',
    apiKey: process.env.NEWSAPI_KEY || '',
    priority: 10,
    rateLimit: {
      requestsPerDay: 100,
      requestsPerHour: 10,
      currentDayUsage: 0,
      currentHourUsage: 0,
      lastResetDate: new Date(),
      lastResetHour: new Date(),
    },
    endpoints: {
      topHeadlines: 'https://newsapi.org/v2/top-headlines',
      everything: 'https://newsapi.org/v2/everything',
      sources: 'https://newsapi.org/v2/sources',
    },
    supportedFeatures: {
      topHeadlines: true,
      searchByKeyword: true,
      searchByCountry: true,
      searchByCategory: true,
      fullTextSearch: true,
    },
    keywords: CRISIS_KEYWORDS,
    countries: ['us', 'gb', 'ca', 'au'],
    categories: ['general', 'health'],
  },
  {
    name: 'NewsData.io Global',
    provider: 'newsdata',
    apiKey: process.env.NEWSDATA_KEY || '',
    priority: 9,
    rateLimit: {
      requestsPerDay: 200,
      currentDayUsage: 0,
      currentHourUsage: 0,
      lastResetDate: new Date(),
      lastResetHour: new Date(),
    },
    endpoints: {
      everything: 'https://newsdata.io/api/1/news',
    },
    supportedFeatures: {
      topHeadlines: false,
      searchByKeyword: true,
      searchByCountry: true,
      searchByCategory: true,
      fullTextSearch: false,
    },
    keywords: CRISIS_KEYWORDS,
    countries: ['us', 'gb', 'ca', 'au', 'in'],
    categories: [],
  },
  {
    name: 'Currents API',
    provider: 'currents',
    apiKey: process.env.CURRENTS_KEY || '',
    priority: 8,
    rateLimit: {
      requestsPerDay: 600,
      requestsPerHour: 50,
      currentDayUsage: 0,
      currentHourUsage: 0,
      lastResetDate: new Date(),
      lastResetHour: new Date(),
    },
    endpoints: {
      everything: 'https://api.currentsapi.services/v1/search',
    },
    supportedFeatures: {
      topHeadlines: false,
      searchByKeyword: true,
      searchByCountry: false,
      searchByCategory: false,
      fullTextSearch: true,
    },
    keywords: CRISIS_KEYWORDS,
    countries: [],
    categories: [],
  },
  {
    name: 'Guardian Open Platform',
    provider: 'guardian',
    apiKey: process.env.GUARDIAN_KEY || '',
    priority: 7,
    rateLimit: {
      requestsPerDay: 5000,
      requestsPerHour: 500,
      currentDayUsage: 0,
      currentHourUsage: 0,
      lastResetDate: new Date(),
      lastResetHour: new Date(),
    },
    endpoints: {
      everything: 'https://content.guardianapis.com/search',
    },
    supportedFeatures: {
      topHeadlines: false,
      searchByKeyword: true,
      searchByCountry: false,
      searchByCategory: true,
      fullTextSearch: true,
    },
    keywords: CRISIS_KEYWORDS,
    countries: [],
    categories: ['world', 'environment', 'society'],
  },
  {
    name: 'MediaStack',
    provider: 'mediastack',
    apiKey: process.env.MEDIASTACK_KEY || '',
    priority: 6,
    rateLimit: {
      requestsPerDay: 16, // 500/month ≈ 16/day
      currentDayUsage: 0,
      currentHourUsage: 0,
      lastResetDate: new Date(),
      lastResetHour: new Date(),
    },
    endpoints: {
      everything: 'http://api.mediastack.com/v1/news',
    },
    supportedFeatures: {
      topHeadlines: false,
      searchByKeyword: true,
      searchByCountry: true,
      searchByCategory: true,
      fullTextSearch: false,
    },
    keywords: CRISIS_KEYWORDS,
    countries: ['us', 'gb', 'ca'],
    categories: [],
  },
  {
    name: 'GNews.io',
    provider: 'gnews',
    apiKey: process.env.GNEWS_KEY || '',
    priority: 5,
    rateLimit: {
      requestsPerDay: 100,
      currentDayUsage: 0,
      currentHourUsage: 0,
      lastResetDate: new Date(),
      lastResetHour: new Date(),
    },
    endpoints: {
      everything: 'https://gnews.io/api/v4/search',
    },
    supportedFeatures: {
      topHeadlines: false,
      searchByKeyword: true,
      searchByCountry: false,
      searchByCategory: false,
      fullTextSearch: false,
    },
    keywords: CRISIS_KEYWORDS,
    countries: [],
    categories: [],
  },
];

async function initNewsAPIs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Initialize each news API configuration
    for (const apiConfig of newsAPIs) {
      if (!apiConfig.apiKey) {
        console.log(`⚠️  Skipping ${apiConfig.name} - no API key provided`);
        continue;
      }

      try {
        // Check if already exists
        const existing = await NewsAPIConfig.findOne({ provider: apiConfig.provider });
        
        if (existing) {
          console.log(`ℹ️  ${apiConfig.name} already configured`);
          continue;
        }

        // Create new configuration
        await NewsAPIConfig.create(apiConfig);
        console.log(`✅ Initialized ${apiConfig.name}`);
      } catch (error: any) {
        console.error(`❌ Error initializing ${apiConfig.name}:`, error.message);
      }
    }

    console.log('\n✅ News API initialization complete!');
    console.log('\nConfigured sources:');
    const configs = await NewsAPIConfig.find().sort({ priority: -1 });
    configs.forEach(config => {
      console.log(`  - ${config.name} (${config.provider}): ${config.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the initialization
initNewsAPIs();