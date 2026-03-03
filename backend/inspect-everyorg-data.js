#!/usr/bin/env node

/**
 * Inspect Every.org API Response Data
 *
 * This script fetches real data from Every.org's search API
 * and displays all fields and values to understand what we can leverage
 * for geographic matching.
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.EVERY_ORG_API_PUBLIC_KEY;
const BASE_URL = 'https://partners.every.org/v0.2';

async function inspectSearchResults() {
  console.log('🔍 Inspecting Every.org Search API Response\n');
  console.log('='.repeat(80));
  
  // Test with Nigeria humanitarian query
  const searchTerm = 'Nigeria humanitarian';
  console.log(`\n📋 Search Query: "${searchTerm}"\n`);
  
  try {
    const url = `${BASE_URL}/search/${encodeURIComponent(searchTerm)}`;
    const response = await axios.get(url, {
      params: {
        apiKey: API_KEY,
        take: 10, // Get 10 results for inspection
      },
      timeout: 10000,
    });

    const nonprofits = response.data?.nonprofits || [];
    console.log(`✅ Retrieved ${nonprofits.length} organizations\n`);
    console.log('='.repeat(80));

    // Inspect first 3 orgs in detail
    nonprofits.slice(0, 3).forEach((org, index) => {
      console.log(`\n📊 ORGANIZATION ${index + 1}: ${org.name}`);
      console.log('-'.repeat(80));
      
      // List ALL fields and their values
      Object.entries(org).forEach(([key, value]) => {
        const valueStr = typeof value === 'object' 
          ? JSON.stringify(value, null, 2)
          : String(value);
        
        console.log(`\n  ${key}:`);
        console.log(`    ${valueStr.split('\n').join('\n    ')}`);
      });
      
      console.log('\n' + '='.repeat(80));
    });

    // Summary of all fields across all orgs
    console.log('\n\n📈 FIELD SUMMARY ACROSS ALL ORGANIZATIONS:');
    console.log('='.repeat(80));
    
    const fieldStats = {};
    nonprofits.forEach(org => {
      Object.keys(org).forEach(key => {
        if (!fieldStats[key]) {
          fieldStats[key] = {
            count: 0,
            hasValue: 0,
            sampleValues: new Set(),
          };
        }
        fieldStats[key].count++;
        if (org[key] !== null && org[key] !== undefined && org[key] !== '') {
          fieldStats[key].hasValue++;
          // Store sample values (limit to 5)
          if (fieldStats[key].sampleValues.size < 5) {
            const value = typeof org[key] === 'object' 
              ? JSON.stringify(org[key])
              : String(org[key]);
            fieldStats[key].sampleValues.add(value.substring(0, 100));
          }
        }
      });
    });

    Object.entries(fieldStats).forEach(([field, stats]) => {
      const coverage = ((stats.hasValue / stats.count) * 100).toFixed(1);
      console.log(`\n  ${field}:`);
      console.log(`    Coverage: ${stats.hasValue}/${stats.count} (${coverage}%)`);
      if (stats.sampleValues.size > 0) {
        console.log(`    Sample values:`);
        Array.from(stats.sampleValues).forEach(val => {
          console.log(`      - ${val}`);
        });
      }
    });

    // Focus on location-related fields
    console.log('\n\n🌍 LOCATION-RELATED FIELDS:');
    console.log('='.repeat(80));
    
    const locationFields = ['locationAddress', 'location', 'city', 'state', 'country', 'address', 'headquarters'];
    nonprofits.forEach((org, index) => {
      console.log(`\n  Org ${index + 1}: ${org.name}`);
      locationFields.forEach(field => {
        if (org[field] !== undefined) {
          console.log(`    ${field}: ${JSON.stringify(org[field])}`);
        }
      });
    });

  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function inspectDetailedNonprofit() {
  console.log('\n\n🔍 Inspecting Every.org Nonprofit Details API\n');
  console.log('='.repeat(80));
  
  // Test with a known nonprofit slug
  const slug = 'american-red-cross';
  console.log(`\n📋 Nonprofit Slug: "${slug}"\n`);
  
  try {
    const url = `${BASE_URL}/nonprofit/${encodeURIComponent(slug)}`;
    const response = await axios.get(url, {
      params: {
        apiKey: API_KEY,
      },
      timeout: 10000,
    });

    const nonprofit = response.data?.nonprofit;
    if (!nonprofit) {
      console.log('❌ No nonprofit data returned');
      return;
    }

    console.log(`✅ Retrieved detailed data for: ${nonprofit.name}\n`);
    console.log('='.repeat(80));
    
    // List ALL fields and their values
    console.log('\n📊 ALL FIELDS IN DETAILS API:');
    console.log('-'.repeat(80));
    
    Object.entries(nonprofit).forEach(([key, value]) => {
      const valueStr = typeof value === 'object' 
        ? JSON.stringify(value, null, 2)
        : String(value);
      
      console.log(`\n  ${key}:`);
      console.log(`    ${valueStr.split('\n').join('\n    ')}`);
    });

    // Focus on location data
    console.log('\n\n🌍 LOCATION DATA IN DETAILS API:');
    console.log('='.repeat(80));
    
    const locationFields = ['locationAddress', 'location', 'city', 'state', 'country', 'address', 'headquarters'];
    locationFields.forEach(field => {
      if (nonprofit[field] !== undefined) {
        console.log(`\n  ${field}:`);
        console.log(`    ${JSON.stringify(nonprofit[field], null, 2)}`);
      }
    });

  } catch (error) {
    console.error('❌ Error fetching nonprofit details:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run both inspections
async function main() {
  console.log('\n🚀 EVERY.ORG API DATA INSPECTION');
  console.log('='.repeat(80));
  console.log(`API Key: ${API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(80));

  if (!API_KEY) {
    console.error('\n❌ EVERY_ORG_API_PUBLIC_KEY environment variable not set');
    console.error('Please set it in your .env file');
    process.exit(1);
  }

  await inspectSearchResults();
  await inspectDetailedNonprofit();

  console.log('\n\n✅ Inspection complete!');
  console.log('='.repeat(80));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});