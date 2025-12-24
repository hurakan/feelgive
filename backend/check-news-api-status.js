import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NewsAPIConfig from './src/models/NewsAPIConfig.js';

dotenv.config();

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feelgive');
    console.log('Connected to MongoDB\n');
    
    const configs = await NewsAPIConfig.find();
    
    console.log('=== News API Status ===\n');
    
    for (const config of configs) {
      console.log(`Provider: ${config.provider}`);
      console.log(`Name: ${config.name}`);
      console.log(`Enabled: ${config.isEnabled}`);
      console.log(`Priority: ${config.priority}`);
      console.log(`Last Error: ${config.lastError || 'None'}`);
      console.log(`Last Successful Fetch: ${config.lastSuccessfulFetch || 'Never'}`);
      console.log(`Last Fetched At: ${config.lastFetchedAt || 'Never'}`);
      console.log(`Daily Usage: ${config.rateLimit.currentDayUsage}/${config.rateLimit.requestsPerDay}`);
      console.log(`Hourly Usage: ${config.rateLimit.currentHourUsage || 0}/${config.rateLimit.requestsPerHour || 'N/A'}`);
      console.log(`Total Articles Fetched: ${config.totalArticlesFetched}`);
      console.log('---\n');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStatus();