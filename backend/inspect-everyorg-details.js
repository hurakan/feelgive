#!/usr/bin/env node

/**
 * Inspect Every.org Nonprofit Details API
 * 
 * Fetches detailed data for organizations to analyze location and cause data
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.EVERY_ORG_API_PUBLIC_KEY;
const BASE_URL = 'https://partners.every.org/v0.2';

// Orgs from Nigeria humanitarian search
const TEST_ORGS = [
  'nigerian-international-humanitarian-foundation-of-new-england-inc',
  'nigeria-gives',
  'we-go-nigeria',
  'nigeria-peoples-alliance-inc',
  'bridges-to-nigeria',
  'save-nigeria-group-usa-inc',
  'nigeria-soccer-federation-inc',
  'across-nigeria',
  'help-nigeria',
  'kidsake-nigeria',
];

async function fetchNonprofitDetails(slug) {
  try {
    const url = `${BASE_URL}/nonprofit/${encodeURIComponent(slug)}`;
    const response = await axios.get(url, {
      params: { apiKey: API_KEY },
      timeout: 10000,
    });

    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Error fetching ${slug}:`, error.message);
    return null;
  }
}

async function analyzeAllOrgs() {
  console.log('🔍 EVERY.ORG NONPROFIT DETAILS API ANALYSIS');
  console.log('='.repeat(80));
  console.log(`API Key: ${API_KEY ? '✅ Set' : '❌ Not set'}\n`);

  if (!API_KEY) {
    console.error('❌ EVERY_ORG_API_PUBLIC_KEY not set');
    process.exit(1);
  }

  const results = [];
  
  console.log(`📋 Fetching details for ${TEST_ORGS.length} organizations...\n`);

  for (const slug of TEST_ORGS) {
    console.log(`  Fetching: ${slug}...`);
    const data = await fetchNonprofitDetails(slug);
    if (data) {
      results.push({ slug, data });
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Retrieved ${results.length}/${TEST_ORGS.length} organizations\n`);
  console.log('='.repeat(80));

  // Detailed analysis of each org
  results.forEach((result, index) => {
    const { nonprofit, nonprofitTags } = result.data;
    
    console.log(`\n📊 ORGANIZATION ${index + 1}: ${nonprofit.name}`);
    console.log('-'.repeat(80));
    
    // Core fields
    console.log('\n  🏢 CORE INFORMATION:');
    console.log(`    ID: ${nonprofit.id}`);
    console.log(`    Name: ${nonprofit.name}`);
    console.log(`    Slug: ${nonprofit.primarySlug}`);
    console.log(`    EIN: ${nonprofit.ein}`);
    console.log(`    Disbursable: ${nonprofit.isDisbursable}`);
    
    // Location data
    console.log('\n  🌍 LOCATION DATA:');
    console.log(`    locationAddress: ${nonprofit.locationAddress || 'N/A'}`);
    
    // NTEE Code (cause classification)
    console.log('\n  🎯 CAUSE CLASSIFICATION (NTEE):');
    if (nonprofit.nteeCode) {
      console.log(`    Code: ${nonprofit.nteeCode}`);
      if (nonprofit.nteeCodeMeaning) {
        console.log(`    Major: ${nonprofit.nteeCodeMeaning.majorCode} - ${nonprofit.nteeCodeMeaning.majorMeaning}`);
        console.log(`    Decile: ${nonprofit.nteeCodeMeaning.decileCode} - ${nonprofit.nteeCodeMeaning.decileMeaning}`);
      }
    } else {
      console.log('    No NTEE code');
    }
    
    // Tags (cause categories)
    console.log('\n  🏷️  TAGS (Cause Categories):');
    if (nonprofitTags && nonprofitTags.length > 0) {
      nonprofitTags.forEach(tag => {
        console.log(`    - ${tag.tagName} (${tag.causeCategory})`);
        console.log(`      Title: ${tag.title}`);
      });
    } else {
      console.log('    No tags');
    }
    
    // Description
    console.log('\n  📝 DESCRIPTION:');
    console.log(`    ${nonprofit.description?.substring(0, 200)}${nonprofit.description?.length > 200 ? '...' : ''}`);
    
    if (nonprofit.descriptionLong) {
      console.log('\n  📄 LONG DESCRIPTION:');
      const longDesc = nonprofit.descriptionLong.substring(0, 200);
      const ellipsis = nonprofit.descriptionLong.length > 200 ? '...' : '';
      console.log(`    ${longDesc}${ellipsis}`);
    }
    
    // URLs
    console.log('\n  🔗 URLS:');
    console.log(`    Profile: ${nonprofit.profileUrl}`);
    console.log(`    Website: ${nonprofit.websiteUrl || 'N/A'}`);
    
    console.log('\n' + '='.repeat(80));
  });

  // Summary analysis
  console.log('\n\n📈 SUMMARY ANALYSIS');
  console.log('='.repeat(80));
  
  // Location field analysis
  console.log('\n🌍 LOCATION FIELD ANALYSIS:');
  const locationStats = {
    hasLocationAddress: 0,
    locationFormats: new Set(),
  };
  
  results.forEach(({ data }) => {
    const { nonprofit } = data;
    if (nonprofit.locationAddress) {
      locationStats.hasLocationAddress++;
      locationStats.locationFormats.add(nonprofit.locationAddress);
    }
  });
  
  console.log(`  Coverage: ${locationStats.hasLocationAddress}/${results.length} (${((locationStats.hasLocationAddress/results.length)*100).toFixed(1)}%)`);
  console.log(`  Unique formats: ${locationStats.locationFormats.size}`);
  console.log(`  Sample values:`);
  Array.from(locationStats.locationFormats).slice(0, 10).forEach(loc => {
    console.log(`    - "${loc}"`);
  });
  
  // NTEE code analysis
  console.log('\n🎯 NTEE CODE ANALYSIS:');
  const nteeStats = {
    hasNteeCode: 0,
    majorCategories: new Map(),
    decileCategories: new Map(),
  };
  
  results.forEach(({ data }) => {
    const { nonprofit } = data;
    if (nonprofit.nteeCode) {
      nteeStats.hasNteeCode++;
      if (nonprofit.nteeCodeMeaning) {
        const major = nonprofit.nteeCodeMeaning.majorMeaning;
        const decile = nonprofit.nteeCodeMeaning.decileMeaning;
        nteeStats.majorCategories.set(major, (nteeStats.majorCategories.get(major) || 0) + 1);
        nteeStats.decileCategories.set(decile, (nteeStats.decileCategories.get(decile) || 0) + 1);
      }
    }
  });
  
  console.log(`  Coverage: ${nteeStats.hasNteeCode}/${results.length} (${((nteeStats.hasNteeCode/results.length)*100).toFixed(1)}%)`);
  console.log(`  Major categories:`);
  Array.from(nteeStats.majorCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`    - ${category}: ${count} orgs`);
    });
  console.log(`  Decile categories:`);
  Array.from(nteeStats.decileCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`    - ${category}: ${count} orgs`);
    });
  
  // Tags analysis
  console.log('\n🏷️  TAGS ANALYSIS:');
  const tagStats = {
    hasTags: 0,
    allTags: new Map(),
    causeCategories: new Map(),
  };
  
  results.forEach(({ data }) => {
    const { nonprofitTags } = data;
    if (nonprofitTags && nonprofitTags.length > 0) {
      tagStats.hasTags++;
      nonprofitTags.forEach(tag => {
        tagStats.allTags.set(tag.tagName, (tagStats.allTags.get(tag.tagName) || 0) + 1);
        tagStats.causeCategories.set(tag.causeCategory, (tagStats.causeCategories.get(tag.causeCategory) || 0) + 1);
      });
    }
  });
  
  console.log(`  Coverage: ${tagStats.hasTags}/${results.length} (${((tagStats.hasTags/results.length)*100).toFixed(1)}%)`);
  console.log(`  Unique tags: ${tagStats.allTags.size}`);
  console.log(`  Most common tags:`);
  Array.from(tagStats.allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([tag, count]) => {
      console.log(`    - ${tag}: ${count} orgs`);
    });
  console.log(`  Cause categories:`);
  Array.from(tagStats.causeCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`    - ${category}: ${count} orgs`);
    });
  
  // Field availability comparison
  console.log('\n📊 FIELD AVAILABILITY COMPARISON:');
  console.log('  Search API vs Details API:');
  console.log(`    location (search): 100% coverage, format: "CITY, STATE"`);
  console.log(`    locationAddress (details): ${((locationStats.hasLocationAddress/results.length)*100).toFixed(1)}% coverage, format: "CITY, STATE"`);
  console.log(`    NTEE codes (details only): ${((nteeStats.hasNteeCode/results.length)*100).toFixed(1)}% coverage`);
  console.log(`    Tags (details only): ${((tagStats.hasTags/results.length)*100).toFixed(1)}% coverage`);
  
  console.log('\n✅ Analysis complete!');
  console.log('='.repeat(80));
}

analyzeAllOrgs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});