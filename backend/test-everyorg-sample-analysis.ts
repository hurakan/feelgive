import axios from 'axios';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EveryOrgNonprofit {
  name: string;
  slug: string;
  description: string;
  locationAddress: string;
  websiteUrl: string;
  ein: string;
  coverImageUrl: string;
  logoUrl: string;
  primaryCategory: string;
  nteeCode: string;
  nteeCodeMeaning: string;
}

interface EveryOrgSearchResult {
  nonprofits: EveryOrgNonprofit[];
}

const API_KEY = process.env.EVERY_ORG_API_PUBLIC_KEY;
const BASE_URL = 'https://partners.every.org/v0.2';

if (!API_KEY) {
  console.error('ERROR: EVERY_ORG_API_PUBLIC_KEY not found in environment variables');
  console.error('Please set it in your .env file');
  process.exit(1);
}

// Various search terms to get diverse organizations
const SEARCH_TERMS = [
  'education',
  'health',
  'environment',
  'children',
  'disaster',
  'poverty',
  'water',
  'food',
  'wildlife',
  'human rights',
  'refugees',
  'climate',
  'medical',
  'community',
  'relief',
  'cancer',
  'homeless',
  'veterans',
  'animals',
  'arts',
  'women',
  'youth',
  'elderly',
  'housing',
  'hunger'
];

async function searchOrganizations(term: string): Promise<EveryOrgNonprofit[]> {
  try {
    const encodedTerm = encodeURIComponent(term);
    const url = `${BASE_URL}/search/${encodedTerm}`;
    
    const response = await axios.get<EveryOrgSearchResult>(url, {
      params: {
        apiKey: API_KEY
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data.nonprofits || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`  Error searching for "${term}":`, error.response?.status, error.message);
    } else {
      console.error(`  Error searching for "${term}":`, error);
    }
    return [];
  }
}

async function collectSampleOrganizations() {
  console.log('Starting collection of 100 random organizations from Every.org...\n');
  console.log(`Using API Key: ${API_KEY?.substring(0, 10)}...`);
  console.log('');
  
  const collectedOrgs = new Set<string>();
  const orgDetails: any[] = [];
  
  // Shuffle search terms for randomness
  const shuffledTerms = [...SEARCH_TERMS].sort(() => Math.random() - 0.5);
  
  for (const term of shuffledTerms) {
    if (orgDetails.length >= 100) {
      break;
    }
    
    console.log(`Searching: "${term}" (${orgDetails.length}/100 collected)`);
    
    const searchResults = await searchOrganizations(term);
    console.log(`  Found ${searchResults.length} results`);
    
    if (searchResults.length === 0) {
      continue;
    }
    
    // Randomly select from results
    const shuffledResults = searchResults.sort(() => Math.random() - 0.5);
    
    for (const org of shuffledResults) {
      if (collectedOrgs.has(org.slug)) {
        continue; // Skip duplicates
      }
      
      collectedOrgs.add(org.slug);
      orgDetails.push({
        searchTerm: term,
        organization: org
      });
      
      console.log(`  ✓ Added: ${org.name} (${org.slug}) - ${orgDetails.length}/100`);
      
      if (orgDetails.length >= 100) {
        break;
      }
    }
    
    // Add delay between searches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return orgDetails;
}

async function analyzeData(organizations: any[]) {
  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log(`Total Organizations Collected: ${organizations.length}\n`);
  
  // NTEE Analysis
  const withNTEE = organizations.filter(org => org.organization.nteeCode);
  const withoutNTEE = organizations.filter(org => !org.organization.nteeCode);
  
  console.log('NTEE CODE AVAILABILITY:');
  console.log(`  Organizations WITH NTEE Code: ${withNTEE.length} (${(withNTEE.length / organizations.length * 100).toFixed(1)}%)`);
  console.log(`  Organizations WITHOUT NTEE Code: ${withoutNTEE.length} (${(withoutNTEE.length / organizations.length * 100).toFixed(1)}%)`);
  
  if (withNTEE.length > 0) {
    console.log('\n  Sample NTEE Codes Found:');
    withNTEE.slice(0, 15).forEach(org => {
      console.log(`    - ${org.organization.name}: ${org.organization.nteeCode} (${org.organization.nteeCodeMeaning || 'No meaning provided'})`);
    });
  }
  
  // Location Data Analysis
  console.log('\n\nLOCATION DATA COMPLETENESS:');
  const withAddress = organizations.filter(org => org.organization.locationAddress).length;
  
  console.log(`  Full Address: ${withAddress} (${(withAddress / organizations.length * 100).toFixed(1)}%)`);
  
  if (withAddress > 0) {
    console.log('\n  Sample Addresses:');
    organizations
      .filter(org => org.organization.locationAddress)
      .slice(0, 10)
      .forEach(org => {
        console.log(`    - ${org.organization.name}: ${org.organization.locationAddress}`);
      });
  }
  
  // Primary Category Analysis
  console.log('\n\nPRIMARY CATEGORY AVAILABILITY:');
  const withCategory = organizations.filter(org => org.organization.primaryCategory).length;
  console.log(`  Organizations with primary category: ${withCategory} (${(withCategory / organizations.length * 100).toFixed(1)}%)`);
  
  if (withCategory > 0) {
    const categoryCount: Record<string, number> = {};
    organizations.forEach(org => {
      if (org.organization.primaryCategory) {
        categoryCount[org.organization.primaryCategory] = (categoryCount[org.organization.primaryCategory] || 0) + 1;
      }
    });
    
    console.log('\n  Category Distribution:');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`    - ${category}: ${count} organizations`);
      });
  }
  
  // Description Analysis
  console.log('\n\nDESCRIPTION AVAILABILITY:');
  const withDescription = organizations.filter(org => org.organization.description).length;
  console.log(`  Organizations with description: ${withDescription} (${(withDescription / organizations.length * 100).toFixed(1)}%)`);
  
  // EIN Analysis
  console.log('\n\nEIN (TAX ID) AVAILABILITY:');
  const withEIN = organizations.filter(org => org.organization.ein).length;
  console.log(`  Organizations with EIN: ${withEIN} (${(withEIN / organizations.length * 100).toFixed(1)}%)`);
  
  // Website Analysis
  console.log('\n\nWEBSITE AVAILABILITY:');
  const withWebsite = organizations.filter(org => org.organization.websiteUrl).length;
  console.log(`  Organizations with website: ${withWebsite} (${(withWebsite / organizations.length * 100).toFixed(1)}%)`);
  
  // Image Analysis
  console.log('\n\nIMAGE AVAILABILITY:');
  const withLogo = organizations.filter(org => org.organization.logoUrl).length;
  const withCover = organizations.filter(org => org.organization.coverImageUrl).length;
  console.log(`  Organizations with logo: ${withLogo} (${(withLogo / organizations.length * 100).toFixed(1)}%)`);
  console.log(`  Organizations with cover image: ${withCover} (${(withCover / organizations.length * 100).toFixed(1)}%)`);
  
  // Search Term Distribution
  console.log('\n\nSEARCH TERM DISTRIBUTION:');
  const termCount: Record<string, number> = {};
  organizations.forEach(org => {
    termCount[org.searchTerm] = (termCount[org.searchTerm] || 0) + 1;
  });
  
  Object.entries(termCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([term, count]) => {
      console.log(`  ${term}: ${count} organizations`);
    });
}

async function main() {
  try {
    const organizations = await collectSampleOrganizations();
    
    if (organizations.length === 0) {
      console.error('\nNo organizations were collected. Please check your API key and network connection.');
      process.exit(1);
    }
    
    // Save raw data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `everyorg-sample-${timestamp}.json`;
    
    fs.writeFileSync(
      filename,
      JSON.stringify(organizations, null, 2)
    );
    
    console.log(`\n✓ Raw data saved to: ${filename}`);
    
    // Perform analysis
    await analyzeData(organizations);
    
    // Create detailed NTEE report
    console.log('\n\nCREATING DETAILED REPORTS...');
    
    const nteeReport = organizations.map(org => ({
      name: org.organization.name,
      slug: org.organization.slug,
      searchTerm: org.searchTerm,
      locationAddress: org.organization.locationAddress || 'MISSING',
      nteeCode: org.organization.nteeCode || 'MISSING',
      nteeCodeMeaning: org.organization.nteeCodeMeaning || 'MISSING',
      primaryCategory: org.organization.primaryCategory || 'MISSING',
      ein: org.organization.ein || 'MISSING',
      hasWebsite: !!org.organization.websiteUrl,
      hasLogo: !!org.organization.logoUrl,
      description: org.organization.description ? org.organization.description.substring(0, 200) + '...' : 'MISSING'
    }));
    
    const nteeReportFilename = `everyorg-ntee-report-${timestamp}.json`;
    fs.writeFileSync(
      nteeReportFilename,
      JSON.stringify(nteeReport, null, 2)
    );
    
    console.log(`✓ NTEE report saved to: ${nteeReportFilename}`);
    
    // Create CSV for easy analysis
    const csvLines = [
      'Name,Slug,Search Term,NTEE Code,NTEE Meaning,Primary Category,Has Address,Has EIN,Has Website'
    ];
    
    organizations.forEach(org => {
      const o = org.organization;
      csvLines.push([
        `"${o.name.replace(/"/g, '""')}"`,
        o.slug,
        org.searchTerm,
        o.nteeCode || 'MISSING',
        `"${(o.nteeCodeMeaning || 'MISSING').replace(/"/g, '""')}"`,
        o.primaryCategory || 'MISSING',
        o.locationAddress ? 'YES' : 'NO',
        o.ein ? 'YES' : 'NO',
        o.websiteUrl ? 'YES' : 'NO'
      ].join(','));
    });
    
    const csvFilename = `everyorg-analysis-${timestamp}.csv`;
    fs.writeFileSync(csvFilename, csvLines.join('\n'));
    console.log(`✓ CSV report saved to: ${csvFilename}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('COLLECTION AND ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nTotal organizations collected: ${organizations.length}`);
    console.log(`Files created:`);
    console.log(`  - ${filename} (full JSON data)`);
    console.log(`  - ${nteeReportFilename} (NTEE analysis JSON)`);
    console.log(`  - ${csvFilename} (CSV for spreadsheet analysis)`);
    
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

main();