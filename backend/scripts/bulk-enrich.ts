#!/usr/bin/env tsx
/**
 * Bulk Enrichment Script
 * Enriches multiple organizations from Every.org
 * 
 * Usage:
 *   npm run bulk-enrich
 *   or
 *   tsx backend/scripts/bulk-enrich.ts [--limit=100] [--force]
 */

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { organizationEnrichmentService } from '../src/services/organization-enrichment.js';
import EnrichedOrganization from '../src/models/EnrichedOrganization.js';

// Load environment variables
dotenv.config();

interface BulkEnrichOptions {
  limit?: number;
  force?: boolean;
  onlyStale?: boolean;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: BulkEnrichOptions = {
    limit: 100,
    force: false,
    onlyStale: false,
  };

  args.forEach(arg => {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--only-stale') {
      options.onlyStale = true;
    }
  });

  console.log('='.repeat(60));
  console.log('Bulk Organization Enrichment');
  console.log('='.repeat(60));
  console.log();
  console.log('Options:');
  console.log(`  Limit: ${options.limit}`);
  console.log(`  Force refresh: ${options.force}`);
  console.log(`  Only stale: ${options.onlyStale}`);
  console.log();

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await connectDatabase();
    console.log('✅ Connected to MongoDB');
    console.log();

    // Get organizations to enrich
    console.log('🔍 Finding organizations to enrich...');
    
    let query: any = {};
    if (options.onlyStale) {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 30);
      query = {
        $or: [
          { 'metadata.lastEnrichedAt': { $lt: staleDate } },
          { 'metadata.enrichmentStatus': 'failed' },
          { 'metadata.enrichmentStatus': 'pending' },
        ],
      };
    }

    const organizations = await EnrichedOrganization.find(query)
      .limit(options.limit!)
      .select('everyOrgSlug everyOrgId ein name description')
      .lean();

    if (organizations.length === 0) {
      console.log('✅ No organizations need enrichment!');
      process.exit(0);
    }

    console.log(`📊 Found ${organizations.length} organizations to enrich`);
    console.log();

    // Show statistics before enrichment
    const statsBefore = await organizationEnrichmentService.getStats();
    console.log('Current Statistics:');
    console.log(`  Total: ${statsBefore.total}`);
    console.log(`  Complete: ${statsBefore.complete}`);
    console.log(`  Partial: ${statsBefore.partial}`);
    console.log(`  Failed: ${statsBefore.failed}`);
    console.log(`  Stale: ${statsBefore.stale}`);
    console.log();

    // Confirm enrichment
    console.log('🚀 Starting bulk enrichment...');
    console.log('   This may take several minutes');
    console.log('   Progress will be shown for each organization');
    console.log();

    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;
    let cacheHits = 0;

    // Process each organization
    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      const progress = `[${i + 1}/${organizations.length}]`;

      try {
        console.log(`${progress} Enriching: ${org.name} (${org.ein || 'no EIN'})`);

        const result = await organizationEnrichmentService.enrichOrganization(
          {
            slug: org.everyOrgSlug,
            id: org.everyOrgId,
            ein: org.ein,
            name: org.name,
            description: org.description,
          },
          options.force
        );

        if (result.success) {
          successCount++;
          if (result.fromCache) {
            cacheHits++;
            console.log(`  ✅ Success (cached) - Sources: ${result.sources.join(', ')}`);
          } else {
            console.log(`  ✅ Success (enriched) - Sources: ${result.sources.join(', ')}`);
          }
        } else {
          failureCount++;
          console.log(`  ❌ Failed - Errors: ${result.errors.join(', ')}`);
        }

        // Small delay to respect rate limits
        if (i < organizations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error: any) {
        failureCount++;
        console.log(`  ❌ Error: ${error.message}`);
      }

      console.log();
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('='.repeat(60));
    console.log('Bulk Enrichment Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`💾 Cache hits: ${cacheHits}`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    console.log();

    // Show statistics after enrichment
    const statsAfter = await organizationEnrichmentService.getStats();
    console.log('Updated Statistics:');
    console.log(`  Total: ${statsAfter.total} (${statsAfter.total - statsBefore.total >= 0 ? '+' : ''}${statsAfter.total - statsBefore.total})`);
    console.log(`  Complete: ${statsAfter.complete} (${statsAfter.complete - statsBefore.complete >= 0 ? '+' : ''}${statsAfter.complete - statsBefore.complete})`);
    console.log(`  Partial: ${statsAfter.partial} (${statsAfter.partial - statsBefore.partial >= 0 ? '+' : ''}${statsAfter.partial - statsBefore.partial})`);
    console.log(`  Failed: ${statsAfter.failed} (${statsAfter.failed - statsBefore.failed >= 0 ? '+' : ''}${statsAfter.failed - statsBefore.failed})`);
    console.log(`  Stale: ${statsAfter.stale}`);
    console.log();

    console.log('✅ Bulk enrichment completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error();
    console.error('❌ Bulk enrichment failed:', error.message);
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log();
  console.log('⚠️  Bulk enrichment interrupted by user');
  console.log('   Partial progress has been saved');
  process.exit(1);
});

// Run main function
main();