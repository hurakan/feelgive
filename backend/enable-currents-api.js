import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NewsAPIConfig from './src/models/NewsAPIConfig.js';

dotenv.config();

async function enableCurrents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feelgive');
    console.log('Connected to MongoDB\n');
    
    const currents = await NewsAPIConfig.findOne({ provider: 'currents' });
    
    if (!currents) {
      console.error('❌ Currents API config not found');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    // Clear the error and enable
    currents.isEnabled = true;
    currents.lastError = undefined;
    await currents.save();
    
    console.log('✅ Currents API has been re-enabled');
    console.log('\nOptimizations applied:');
    console.log('  - Uses fast latest-news endpoint (~300ms)');
    console.log('  - Falls back to search if needed');
    console.log('  - Simplified query for better performance');
    console.log('  - 30s timeout for latest-news, 60s for search');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

enableCurrents();