#!/usr/bin/env tsx
/**
 * IRS BMF Import Script
 * Downloads and imports IRS Business Master File data into MongoDB
 * 
 * Usage:
 *   npm run import-irs-bmf
 *   or
 *   tsx backend/scripts/import-irs-bmf.ts
 */

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { irsBmfIngestionService } from '../src/services/irs-bmf-ingestion.js';
import IrsBmfRecord from '../src/models/IrsBmfRecord.js';

// Load environment variables
dotenv.config();

async function main() {
  console.log('='.repeat(60));
  console.log('IRS Business Master File Import');
  console.log('='.repeat(60));
  console.log();

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await connectDatabase();
    console.log('✅ Connected to MongoDB');
    console.log();

    // Check existing data
    const existingCount = await IrsBmfRecord.countDocuments();
    console.log(`📊 Current IRS BMF records: ${existingCount.toLocaleString()}`);
    console.log();

    // Confirm import
    if (existingCount > 0) {
      console.log('⚠️  WARNING: Existing data will be updated/replaced');
      console.log('   This process may take 30-60 minutes');
      console.log();
    }

    console.log('🚀 Starting IRS BMF import...');
    console.log('   This will download ~1.8 million records from IRS');
    console.log('   Progress will be shown for each region');
    console.log();

    const startTime = Date.now();

    // Perform import
    const result = await irsBmfIngestionService.importAll();

    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log();
    console.log('='.repeat(60));
    console.log('Import Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Total records: ${result.totalRecords.toLocaleString()}`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    console.log();

    // Show statistics
    console.log('📈 Getting statistics...');
    const stats = await irsBmfIngestionService.getStats();
    
    console.log();
    console.log('Statistics:');
    console.log(`  Total records: ${stats.totalRecords.toLocaleString()}`);
    console.log(`  Last import: ${stats.lastImport?.toLocaleString() || 'Never'}`);
    console.log();
    console.log('  Top 5 states by organization count:');
    Object.entries(stats.recordsByState)
      .slice(0, 5)
      .forEach(([state, count], index) => {
        console.log(`    ${index + 1}. ${state}: ${count.toLocaleString()}`);
      });
    console.log();
    console.log('  Organizations by NTEE major category:');
    Object.entries(stats.recordsByNTEE)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([category, count]) => {
        console.log(`    ${category}: ${count.toLocaleString()}`);
      });

    console.log();
    console.log('✅ Import completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error();
    console.error('❌ Import failed:', error.message);
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log();
  console.log('⚠️  Import interrupted by user');
  process.exit(1);
});

// Run main function
main();