import axios from 'axios';

interface Charity {
  id: string;
  name: string;
  slug: string;
}

interface ValidationResult {
  slug: string;
  name: string;
  isValid: boolean;
  everyOrgName?: string;
  suggestedSlug?: string;
  error?: string;
}

const CHARITIES: Charity[] = [
  { id: 'dr-001', name: 'International Red Cross', slug: 'red-cross' },
  { id: 'dr-002', name: 'Direct Relief', slug: 'direct-relief' },
  { id: 'dr-003', name: 'Habitat for Humanity', slug: 'habitat-humanity' },
  { id: 'hc-001', name: 'Doctors Without Borders', slug: 'doctors-without-borders' },
  { id: 'hc-002', name: 'UNICEF', slug: 'unicef' },
  { id: 'hc-003', name: 'Partners In Health', slug: 'partners-in-health' },
  { id: 'ce-001', name: 'The Nature Conservancy', slug: 'nature-conservancy' },
  { id: 'ce-002', name: 'American Red Cross', slug: 'american-red-cross' },
  { id: 'ce-003', name: 'Ocean Conservancy', slug: 'ocean-conservancy' },
  { id: 'hum-001', name: 'UNHCR', slug: 'unhcr' },
  { id: 'hum-002', name: 'World Food Programme', slug: 'world-food-programme' },
  { id: 'hum-003', name: 'International Rescue Committee', slug: 'international-rescue-committee' },
  { id: 'sj-001', name: 'Save the Children', slug: 'save-the-children' },
  { id: 'sj-002', name: 'Amnesty International', slug: 'amnesty-international' },
  { id: 'sj-003', name: 'Oxfam International', slug: 'oxfam' },
  { id: 'sj-004', name: 'RAICES', slug: 'raices' },
  { id: 'sj-005', name: 'Al Otro Lado', slug: 'al-otro-lado' },
  { id: 'sj-006', name: 'United We Dream', slug: 'united-we-dream' },
];

async function searchEveryOrg(charityName: string, currentSlug: string): Promise<{
  suggestedSlug: string | null;
  everyOrgName: string | null;
  isCurrentSlugValid: boolean;
}> {
  try {
    // Use Every.org's public search API
    const searchQuery = encodeURIComponent(charityName);
    const response = await axios.get(`https://partners.every.org/v0.2/search/${searchQuery}`, {
      timeout: 15000,
      headers: {
        'User-Agent': 'FeelGive-Validator/1.0',
      },
    });

    if (response.data && response.data.nonprofits && response.data.nonprofits.length > 0) {
      const nonprofits = response.data.nonprofits;
      
      // Check if current slug matches any result
      const currentMatch = nonprofits.find((np: any) => np.slug === currentSlug);
      
      if (currentMatch) {
        return {
          suggestedSlug: currentSlug,
          everyOrgName: currentMatch.name,
          isCurrentSlugValid: true,
        };
      }
      
      // Return first result as suggestion
      return {
        suggestedSlug: nonprofits[0].slug,
        everyOrgName: nonprofits[0].name,
        isCurrentSlugValid: false,
      };
    }
    
    return {
      suggestedSlug: null,
      everyOrgName: null,
      isCurrentSlugValid: false,
    };
  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    return {
      suggestedSlug: null,
      everyOrgName: null,
      isCurrentSlugValid: false,
    };
  }
}

async function validateAllCharities(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  console.log('🔍 Validating charity slugs on Every.org...\n');
  console.log('This may take a few minutes (2 second delay between requests)...\n');

  for (let i = 0; i < CHARITIES.length; i++) {
    const charity = CHARITIES[i];
    process.stdout.write(`[${i + 1}/${CHARITIES.length}] Checking ${charity.name} (${charity.slug})... `);

    try {
      const searchResult = await searchEveryOrg(charity.name, charity.slug);
      
      const result: ValidationResult = {
        slug: charity.slug,
        name: charity.name,
        isValid: searchResult.isCurrentSlugValid,
        everyOrgName: searchResult.everyOrgName || undefined,
        suggestedSlug: searchResult.isCurrentSlugValid ? undefined : searchResult.suggestedSlug || undefined,
        error: searchResult.suggestedSlug ? undefined : 'Not found on Every.org',
      };

      results.push(result);

      if (searchResult.isCurrentSlugValid) {
        console.log('✅');
      } else if (searchResult.suggestedSlug) {
        console.log('⚠️  (found alternative)');
      } else {
        console.log('❌');
      }
    } catch (error: any) {
      if (error.message === 'RATE_LIMITED') {
        console.log('⏸️  Rate limited, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        i--; // Retry this charity
        continue;
      }
      
      results.push({
        slug: charity.slug,
        name: charity.name,
        isValid: false,
        error: error.message,
      });
      console.log('❌');
    }

    // Rate limiting - wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

function printResults(results: ValidationResult[]) {
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(80) + '\n');

  const valid = results.filter(r => r.isValid);
  const invalid = results.filter(r => !r.isValid);

  console.log(`✅ Valid: ${valid.length}/${results.length}`);
  console.log(`❌ Invalid: ${invalid.length}/${results.length}\n`);

  if (valid.length > 0) {
    console.log('✅ VALID SLUGS:\n');
    valid.forEach(r => {
      console.log(`  • ${r.name}`);
      console.log(`    Slug: ${r.slug}`);
      if (r.everyOrgName) {
        console.log(`    Every.org Name: ${r.everyOrgName}`);
      }
      console.log();
    });
  }

  if (invalid.length > 0) {
    console.log('❌ INVALID SLUGS:\n');
    invalid.forEach(r => {
      console.log(`  • ${r.name}`);
      console.log(`    Current Slug: ${r.slug}`);
      console.log(`    Error: ${r.error}`);
      if (r.suggestedSlug) {
        console.log(`    ✨ Suggested Slug: ${r.suggestedSlug}`);
      }
      console.log();
    });
  }

  console.log('='.repeat(80));
  console.log('\n📝 Next Steps:\n');
  console.log('1. Update invalid slugs in frontend/src/data/charities.ts');
  console.log('2. Set everyOrgVerified: true for all valid slugs');
  console.log('3. Re-run this script to verify changes\n');
}

// Run validation
validateAllCharities()
  .then(results => {
    printResults(results);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });