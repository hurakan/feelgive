/**
 * Demonyms and Regional Groupings
 * 
 * Maps countries to their demonyms (e.g., Nigeria → Nigerian)
 * and regional groupings (e.g., Nigeria → West Africa)
 */

export const DEMONYMS: Record<string, string[]> = {
  // Africa
  'nigeria': ['nigerian', 'nigerians'],
  'kenya': ['kenyan', 'kenyans'],
  'somalia': ['somali', 'somalis', 'somalian', 'somalians'],
  'ethiopia': ['ethiopian', 'ethiopians'],
  'south africa': ['south african', 'south africans'],
  'ghana': ['ghanaian', 'ghanaians'],
  'uganda': ['ugandan', 'ugandans'],
  'tanzania': ['tanzanian', 'tanzanians'],
  'mozambique': ['mozambican', 'mozambicans'],
  'sudan': ['sudanese'],
  'south sudan': ['south sudanese'],
  
  // Middle East
  'syria': ['syrian', 'syrians'],
  'iraq': ['iraqi', 'iraqis'],
  'afghanistan': ['afghan', 'afghans'],
  'pakistan': ['pakistani', 'pakistanis'],
  'yemen': ['yemeni', 'yemenis'],
  'lebanon': ['lebanese'],
  'jordan': ['jordanian', 'jordanians'],
  'palestine': ['palestinian', 'palestinians'],
  'gaza': ['gazan', 'gazans', 'palestinian', 'palestinians'],
  'israel': ['israeli', 'israelis'],
  'turkey': ['turkish', 'turks'],
  'iran': ['iranian', 'iranians'],
  
  // Asia
  'thailand': ['thai', 'thais'],
  'myanmar': ['burmese', 'myanmarese'],
  'bangladesh': ['bangladeshi', 'bangladeshis'],
  'india': ['indian', 'indians'],
  'nepal': ['nepali', 'nepalis', 'nepalese'],
  'philippines': ['filipino', 'filipinos', 'philippine'],
  'indonesia': ['indonesian', 'indonesians'],
  'vietnam': ['vietnamese'],
  'cambodia': ['cambodian', 'cambodians'],
  'laos': ['laotian', 'laotians', 'lao'],
  
  // Europe
  'ukraine': ['ukrainian', 'ukrainians'],
  'russia': ['russian', 'russians'],
  'poland': ['polish', 'poles'],
  'romania': ['romanian', 'romanians'],
  'greece': ['greek', 'greeks'],
  'serbia': ['serbian', 'serbians'],
  'bosnia': ['bosnian', 'bosnians'],
  'croatia': ['croatian', 'croatians'],
  
  // Americas
  'united states': ['american', 'americans'],
  'mexico': ['mexican', 'mexicans'],
  'haiti': ['haitian', 'haitians'],
  'venezuela': ['venezuelan', 'venezuelans'],
  'colombia': ['colombian', 'colombians'],
  'brazil': ['brazilian', 'brazilians'],
  'peru': ['peruvian', 'peruvians'],
  'chile': ['chilean', 'chileans'],
  'argentina': ['argentinian', 'argentinians', 'argentine'],
};

export const REGIONS: Record<string, string[]> = {
  // Africa
  'nigeria': ['west africa', 'africa', 'sub-saharan africa'],
  'kenya': ['east africa', 'africa', 'sub-saharan africa'],
  'somalia': ['east africa', 'horn of africa', 'africa'],
  'ethiopia': ['east africa', 'horn of africa', 'africa'],
  'south africa': ['southern africa', 'africa', 'sub-saharan africa'],
  'ghana': ['west africa', 'africa', 'sub-saharan africa'],
  'uganda': ['east africa', 'africa', 'sub-saharan africa'],
  'tanzania': ['east africa', 'africa', 'sub-saharan africa'],
  'mozambique': ['southern africa', 'africa', 'sub-saharan africa'],
  'sudan': ['north africa', 'africa'],
  'south sudan': ['east africa', 'africa', 'sub-saharan africa'],
  
  // Middle East
  'syria': ['middle east', 'levant', 'western asia'],
  'iraq': ['middle east', 'western asia'],
  'afghanistan': ['central asia', 'south asia'],
  'pakistan': ['south asia'],
  'yemen': ['middle east', 'arabian peninsula'],
  'lebanon': ['middle east', 'levant'],
  'jordan': ['middle east', 'levant'],
  'palestine': ['middle east', 'levant'],
  'gaza': ['middle east', 'levant', 'palestine'],
  'israel': ['middle east', 'levant'],
  'turkey': ['middle east', 'anatolia', 'western asia'],
  'iran': ['middle east', 'western asia'],
  
  // Asia
  'thailand': ['southeast asia', 'asia'],
  'myanmar': ['southeast asia', 'asia'],
  'bangladesh': ['south asia', 'asia'],
  'india': ['south asia', 'asia'],
  'nepal': ['south asia', 'asia'],
  'philippines': ['southeast asia', 'asia'],
  'indonesia': ['southeast asia', 'asia'],
  'vietnam': ['southeast asia', 'asia'],
  'cambodia': ['southeast asia', 'asia'],
  'laos': ['southeast asia', 'asia'],
  
  // Europe
  'ukraine': ['eastern europe', 'europe'],
  'russia': ['eastern europe', 'europe', 'eurasia'],
  'poland': ['eastern europe', 'central europe', 'europe'],
  'romania': ['eastern europe', 'europe'],
  'greece': ['southern europe', 'europe', 'balkans'],
  'serbia': ['southeastern europe', 'europe', 'balkans'],
  'bosnia': ['southeastern europe', 'europe', 'balkans'],
  'croatia': ['southeastern europe', 'europe', 'balkans'],
  
  // Americas
  'united states': ['north america', 'americas'],
  'mexico': ['north america', 'latin america', 'americas'],
  'haiti': ['caribbean', 'latin america', 'americas'],
  'venezuela': ['south america', 'latin america', 'americas'],
  'colombia': ['south america', 'latin america', 'americas'],
  'brazil': ['south america', 'latin america', 'americas'],
  'peru': ['south america', 'latin america', 'americas'],
  'chile': ['south america', 'latin america', 'americas'],
  'argentina': ['south america', 'latin america', 'americas'],
};

/**
 * Get demonyms for a country
 */
export function getDemonyms(country: string): string[] {
  return DEMONYMS[country.toLowerCase()] || [];
}

/**
 * Get regions for a country
 */
export function getRegions(country: string): string[] {
  return REGIONS[country.toLowerCase()] || [];
}