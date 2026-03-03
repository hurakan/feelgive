/**
 * Every.org API Data Quality Assessment
 * 
 * Tests 100 random searches to measure:
 * - NTEE code availability
 * - Description completeness
 * - Tags availability
 * - Location data
 * - Other critical fields
 */

import { everyOrgClient } from './src/services/everyorg/client.js';

interface DataQualityMetrics {
  totalOrgs: number;
  withNTEE: number;
  withDescription: number;
  withTags: number;
  withLocation: number;
  withWebsite: number;
  withLogoUrl: number;
  avgDescriptionLength: number;
  avgTagCount: number;
  sampleOrgs: Array<{
    name: string;
    nteeCode?: string;
    descriptionLength: number;
    tagCount: number;
    hasLocation: boolean;
    hasWebsite: boolean;
  }>;
}

const TEST_QUERIES = [
  // Geographic queries
  'Nigeria', 'Thailand', 'Ukraine', 'Syria', 'Yemen', 'Afghanistan',
  'California', 'Texas', 'Florida', 'New York', 'Turkey', 'Japan',
  'Mexico', 'Brazil', 'India', 'Kenya', 'South Africa', 'Australia',
  
  // Cause-based queries
  'humanitarian', 'disaster relief', 'refugee', 'food security', 'water',
  'education', 'healthcare', 'children', 'women', 'elderly',
  'environment', 'climate', 'wildlife', 'ocean', 'forest',
  'poverty', 'homelessness', 'housing', 'employment', 'mental health',
  
  // Crisis types
  'earthquake', 'flood', 'hurricane', 'wildfire', 'drought',
  'conflict', 'war', 'violence', 'persecution', 'crisis',
  
  // Combined queries
  'Nigeria humanitarian', 'Syria refugee', 'California wildfire',
  'Ukraine relief', 'Yemen food', 'Afghanistan women',
  'Turkey earthquake', 'Brazil rainforest', 'India education',
  'Kenya water', 'South Africa healthcare', 'Australia wildlife',
  
  // Specific causes
  'malaria', 'HIV', 'cancer', 'diabetes', 'tuberculosis',
  'literacy', 'STEM', 'arts', 'sports', 'music',
  'human rights', 'justice', 'democracy', 'freedom', 'equality',
  'veterans', 'disabled', 'LGBTQ', 'indigenous', 'immigrants',
  
  // Development
  'microfinance', 'agriculture', 'infrastructure', 'technology', 'innovation',
  'clean energy', 'sanitation', 'transportation', 'communication', 'internet',
  
  // Animal welfare
  'animal rescue', 'pet adoption', 'farm animals', 'endangered species', 'marine life',
  
  // Arts & culture
  'museum', 'theater', 'dance', 'film', 'literature',
  
  // Religion
  'church', 'mosque', 'temple', 'synagogue', 'faith',
  
  // Community
  'community center', 'youth programs', 'senior services', 'family support', 'neighborhood',
];

async function assessDataQuality(): Promise<void> {
  console.log('🔍 Every.org API Data Quality Assessment');
  console.log('==========================================\n');
  
  const metrics: DataQualityMetrics = {
    totalOrgs: 0,
    withNTEE: 0,
    withDescription: 0,
    withTags: 0,
    withLocation: 0,
    withWebsite: 0,
    withLogoUrl: 0,
    avgDescriptionLength: 0,
    avgTagCount: 0,
    sampleOrgs: [],
  };
  
  let totalDescriptionLength = 0;
  let totalTagCount = 0;
  const seenSlugs = new Set<string>();
  
  console.log(`Testing ${TEST_QUERIES.length} queries...\n`);
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    
    try {
      const results = await everyOrgClient.searchNonprofits(query, { take: 20 });
      
      for (const org of results) {
        // Skip duplicates
        if (seenSlugs.has(org.slug)) continue;
        seenSlugs.add(org.slug);
        
        metrics.totalOrgs++;
        
        // Check NTEE code
        if (org.nteeCode) {
          metrics.withNTEE++;
        }
        
        // Check description
        if (org.description && org.description.length > 0) {
          metrics.withDescription++;
          totalDescriptionLength += org.description.length;
        }
        
        // Check tags
        if (org.tags && org.tags.length > 0) {
          metrics.withTags++;
          totalTagCount += org.tags.length;
        }
        
        // Check location
        if (org.location) {
          metrics.withLocation++;
        }
        
        // Check website
        if (org.websiteUrl) {
          metrics.withWebsite++;
        }
        
        // Check logo
        if (org.logoUrl) {
          metrics.withLogoUrl++;
        }
        
        // Sample first 10 orgs for detailed view
        if (metrics.sampleOrgs.length < 10) {
          metrics.sampleOrgs.push({
            name: org.name,
            nteeCode: org.nteeCode,
            descriptionLength: org.description?.length || 0,
            tagCount: org.tags?.length || 0,
            hasLocation: !!org.location,
            hasWebsite: !!org.websiteUrl,
          });
        }
      }
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${TEST_QUERIES.length} queries (${metrics.totalOrgs} unique orgs)`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn(`  ⚠️  Query "${query}" failed:`, error);
    }
  }
  
  // Calculate averages
  metrics.avgDescriptionLength = metrics.withDescription > 0 
    ? Math.round(totalDescriptionLength / metrics.withDescription)
    : 0;
  metrics.avgTagCount = metrics.withTags > 0
    ? Math.round((totalTagCount / metrics.withTags) * 10) / 10
    : 0;
  
  // Print results
  console.log('\n\n📊 DATA QUALITY REPORT');
  console.log('======================\n');
  
  console.log(`Total Unique Organizations: ${metrics.totalOrgs}\n`);
  
  console.log('Field Availability:');
  console.log(`  NTEE Code:    ${metrics.withNTEE.toLocaleString()} (${((metrics.withNTEE / metrics.totalOrgs) * 100).toFixed(1)}%)`);
  console.log(`  Description:  ${metrics.withDescription.toLocaleString()} (${((metrics.withDescription / metrics.totalOrgs) * 100).toFixed(1)}%)`);
  console.log(`  Tags:         ${metrics.withTags.toLocaleString()} (${((metrics.withTags / metrics.totalOrgs) * 100).toFixed(1)}%)`);
  console.log(`  Location:     ${metrics.withLocation.toLocaleString()} (${((metrics.withLocation / metrics.totalOrgs) * 100).toFixed(1)}%)`);
  console.log(`  Website:      ${metrics.withWebsite.toLocaleString()} (${((metrics.withWebsite / metrics.totalOrgs) * 100).toFixed(1)}%)`);
  console.log(`  Logo URL:     ${metrics.withLogoUrl.toLocaleString()} (${((metrics.withLogoUrl / metrics.totalOrgs) * 100).toFixed(1)}%)\n`);
  
  console.log('Quality Metrics:');
  console.log(`  Avg Description Length: ${metrics.avgDescriptionLength} characters`);
  console.log(`  Avg Tag Count:          ${metrics.avgTagCount} tags\n`);
  
  console.log('Sample Organizations (first 10):');
  console.log('================================\n');
  
  metrics.sampleOrgs.forEach((org, i) => {
    console.log(`${i + 1}. ${org.name}`);
    console.log(`   NTEE: ${org.nteeCode || 'MISSING'}`);
    console.log(`   Description: ${org.descriptionLength} chars`);
    console.log(`   Tags: ${org.tagCount}`);
    console.log(`   Location: ${org.hasLocation ? 'Yes' : 'No'}`);
    console.log(`   Website: ${org.hasWebsite ? 'Yes' : 'No'}\n`);
  });
  
  // Critical findings
  console.log('\n🚨 CRITICAL FINDINGS');
  console.log('====================\n');
  
  const nteePercentage = (metrics.withNTEE / metrics.totalOrgs) * 100;
  if (nteePercentage < 50) {
    console.log(`⚠️  NTEE codes are only available for ${nteePercentage.toFixed(1)}% of organizations`);
    console.log('   → Our scoring system relies heavily on NTEE codes (50 points)');
    console.log('   → We need to adjust thresholds or add fallback scoring\n');
  }
  
  const descPercentage = (metrics.withDescription / metrics.totalOrgs) * 100;
  if (descPercentage < 90) {
    console.log(`⚠️  Descriptions are missing for ${(100 - descPercentage).toFixed(1)}% of organizations\n`);
  }
  
  const tagPercentage = (metrics.withTags / metrics.totalOrgs) * 100;
  if (tagPercentage < 70) {
    console.log(`⚠️  Tags are only available for ${tagPercentage.toFixed(1)}% of organizations`);
    console.log('   → Tag-based scoring (30 points) will be limited\n');
  }
  
  console.log('\n✅ Assessment complete!');
}

// Run assessment
assessDataQuality().catch(console.error);