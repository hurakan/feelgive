import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NewsAPIConfig from './src/models/NewsAPIConfig.js';

dotenv.config();

async function fixAPIs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feelgive');
    console.log('Connected to MongoDB\n');
    
    console.log('=== Fixing News API Configuration ===\n');
    
    // Disable MediaStack (at daily limit)
    const mediastack = await NewsAPIConfig.findOne({ provider: 'mediastack' });
    if (mediastack) {
      mediastack.isEnabled = false;
      await mediastack.save();
      console.log('✅ Disabled MediaStack (daily limit reached: 16/16)');
    }
    
    // Disable Currents API (timeout issues)
    const currents = await NewsAPIConfig.findOne({ provider: 'currents' });
    if (currents) {
      currents.isEnabled = false;
      await currents.save();
      console.log('✅ Disabled Currents API (timeout issues)');
    }
    
    // Ensure working APIs are enabled
    const guardian = await NewsAPIConfig.findOne({ provider: 'guardian' });
    if (guardian && !guardian.isEnabled) {
      guardian.isEnabled = true;
      await guardian.save();
      console.log('✅ Enabled Guardian Open Platform');
    }
    
    const gnews = await NewsAPIConfig.findOne({ provider: 'gnews' });
    if (gnews && !gnews.isEnabled) {
      gnews.isEnabled = true;
      await gnews.save();
      console.log('✅ Enabled GNews.io');
    }
    
    const newsdata = await NewsAPIConfig.findOne({ provider: 'newsdata' });
    if (newsdata && !newsdata.isEnabled) {
      newsdata.isEnabled = true;
      await newsdata.save();
      console.log('✅ Enabled NewsData.io');
    }
    
    console.log('\n=== Current Configuration ===\n');
    
    const configs = await NewsAPIConfig.find().sort({ priority: -1 });
    configs.forEach(config => {
      const status = config.isEnabled ? '✅ ENABLED' : '❌ DISABLED';
      const usage = `${config.rateLimit.currentDayUsage}/${config.rateLimit.requestsPerDay}`;
      console.log(`${status} - ${config.name} (${usage} daily)`);
    });
    
    console.log('\n=== Summary ===');
    console.log('Disabled APIs with issues:');
    console.log('  - MediaStack: Daily limit reached (16/16)');
    console.log('  - Currents API: Timeout issues');
    console.log('\nActive APIs:');
    console.log('  - Guardian Open Platform: 5000 requests/day');
    console.log('  - GNews.io: 100 requests/day');
    console.log('  - NewsData.io: 200 requests/day');
    console.log('\nTotal available: 5,300 requests/day');
    console.log('\n✅ Configuration updated successfully!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAPIs();