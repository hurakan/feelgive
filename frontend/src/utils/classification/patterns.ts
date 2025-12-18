import { SemanticPattern } from './types';

// Common negative indicators for ALL patterns (entertainment, sports, tech, etc.)
const COMMON_NEGATIVE_INDICATORS = [
  // Entertainment & Music
  'concert', 'tour', 'album', 'song', 'band', 'musician', 'artist', 'performance',
  'documentary', 'film', 'movie', 'show', 'series', 'episode', 'streaming',
  'festival', 'venue', 'tickets', 'setlist', 'tracklist', 'release date',
  'music video', 'premiere', 'debut', 'soundtrack', 'lyrics', 'guitar', 'drums',
  'metal injection', 'rolling stone', 'pitchfork', 'billboard', 'mtv', 'vh1',
  'grammy', 'oscar', 'emmy', 'award show', 'red carpet', 'nominees announced',
  
  // Sports
  'game', 'match', 'tournament', 'championship', 'playoff', 'season', 'league',
  'team', 'player', 'coach', 'score', 'goal', 'touchdown', 'basket', 'run',
  'espn', 'sports', 'athletic', 'stadium', 'arena', 'field',
  'nfl', 'nba', 'mlb', 'nhl', 'fifa', 'olympics', 'medal count',
  
  // Technology & Products
  'review', 'unboxing', 'specs', 'features', 'price', 'release', 'launch',
  'iphone', 'android', 'laptop', 'gaming', 'console', 'app', 'software',
  'tech', 'gadget', 'device', 'product', 'brand', 'model',
  'apple', 'google', 'microsoft', 'samsung', 'sony',
  
  // Business & Finance
  'stock', 'market', 'earnings', 'revenue', 'profit', 'investment',
  'ceo', 'company', 'business', 'corporate', 'merger', 'acquisition',
  'wall street', 'nasdaq', 'dow jones',
  
  // Opinion & Analysis
  'opinion', 'editorial', 'commentary', 'analysis', 'perspective', 'viewpoint',
  'op-ed', 'column', 'blog post', 'think piece', 'hot take',
  
  // Historical/Past Events
  'anniversary', 'remembering', 'looking back', 'history of', 'years ago',
  'retrospective', 'throwback', 'archive', 'vintage',
  
  // Metaphorical Language (not literal crisis)
  'fire performance', 'killing it', 'slaying', 'crushing it', 'explosive growth',
  'viral', 'trending', 'hot take', 'heated debate', 'burning question',
  
  // Entertainment-specific terms that might contain crisis words
  'star wars', 'game of thrones', 'breaking bad', 'the wire',
  'midnight fire', 'dark waters', 'fire emblem'
];

export const DISASTER_RELIEF_PATTERN: SemanticPattern = {
  cause: 'disaster_relief',
  crisisType: 'natural_disaster',
  typicalRootCauses: ['natural_phenomenon', 'climate_driven'],
  coreIndicators: [
    // Natural disasters
    'earthquake', 'flood', 'hurricane', 'tornado', 'tsunami',
    'landslide', 'avalanche', 'cyclone', 'typhoon', 'wildfire',
    'disaster', 'natural disaster', 'emergency', 'catastrophe',
    'destruction', 'devastation', 'storm', 'severe weather',
    // **PROMOTED FROM SUPPORTING**: Strong crisis indicators
    'displaced', 'displace', 'displacement', 'evacuate', 'evacuation'
  ],
  supportingContext: [
    'destroyed', 'damage', 'collapsed', 'debris',
    'survivors', 'casualties', 'missing', 'trapped', 'rescue',
    'homes destroyed', 'buildings collapsed', 'infrastructure damage',
    'power outage', 'roads blocked', 'emergency services',
    'thousands', 'hundreds', 'families', 'residents'
  ],
  actionIndicators: [
    'emergency response', 'rescue operations', 'relief efforts',
    'emergency shelter', 'search and rescue', 'disaster relief', 'aid workers',
    'red cross', 'fema', 'emergency management', 'disaster zone'
  ],
  negativeIndicators: [
    ...COMMON_NEGATIVE_INDICATORS,
    'election', 'campaign', 'congress', 'senate', 'legislation',
    'bill', 'vote', 'political', 'debate', 'policy discussion',
    'war', 'conflict', 'military operation', 'occupation', 'siege',
    'ice', 'deportation', 'immigration', 'border patrol',
    // **ADDED**: Block climate-specific terms to prevent misclassification
    'climate change', 'global warming', 'sea level rise', 'coral bleaching',
    'permafrost', 'ice caps melting'
  ],
  minScore: 6,
  geoKeywords: {
    'Bangladesh': ['bangladesh', 'dhaka', 'chittagong'],
    'Chile': ['chile', 'santiago'],
    'Japan': ['japan', 'tokyo', 'osaka'],
    'Philippines': ['philippines', 'manila'],
    'United States': ['california', 'florida', 'texas', 'louisiana', 'midwest'],
  }
};

export const HEALTH_CRISIS_PATTERN: SemanticPattern = {
  cause: 'health_crisis',
  crisisType: 'health_emergency',
  typicalRootCauses: ['natural_phenomenon', 'poverty_driven', 'conflict_driven'],
  coreIndicators: [
    // Disease outbreaks
    'outbreak', 'epidemic', 'pandemic', 'disease spread', 'virus outbreak',
    'infection rate', 'health emergency', 'medical emergency',
    'disease', 'virus', 'illness', 'sick', 'hospital', 'medical crisis',
    'health crisis', 'public health', 'contagious', 'infectious',
    // **SPECIFIC DISEASES**: These get extra weight
    'cholera', 'measles', 'ebola', 'malaria', 'tuberculosis', 'dengue',
    'meningitis', 'hepatitis', 'diphtheria', 'polio'
  ],
  supportingContext: [
    'patients', 'hospitals overwhelmed', 'healthcare system', 'medical supplies',
    'ventilators', 'icu beds', 'mortality rate', 'death toll', 'infected',
    'symptoms', 'treatment', 'vaccine', 'medication', 'doctors', 'nurses',
    'healthcare workers', 'medical staff', 'hospital capacity',
    'refugee camp', 'displaced', 'vulnerable populations',
    // **ADDED**: Common health crisis descriptors
    'kills', 'deaths', 'casualties', 'children', 'widespread'
  ],
  actionIndicators: [
    'vaccination campaign', 'medical response', 'treatment centers',
    'healthcare workers deployed', 'emergency medical', 'quarantine measures',
    'testing', 'contact tracing', 'isolation', 'medical aid'
  ],
  negativeIndicators: [
    ...COMMON_NEGATIVE_INDICATORS,
    'election', 'campaign', 'congress', 'senate', 'legislation',
    'political debate', 'policy proposal', 'budget discussion',
    'ice', 'deportation', 'immigration', 'border patrol',
    // **ADDED**: Block when "humanitarian crisis" is the main focus
    'humanitarian crisis worsens', 'humanitarian emergency'
  ],
  minScore: 6,
  geoKeywords: {
    'Global': ['global', 'worldwide', 'international', 'multiple countries'],
    'Africa': ['africa', 'congo', 'nigeria', 'kenya', 'ebola'],
    'Asia': ['asia', 'india', 'china'],
    'Yemen': ['yemen', 'yemeni'],
    'Afghanistan': ['afghanistan', 'afghan'],
    'Samoa': ['samoa', 'samoan'],
  }
};

export const CLIMATE_EVENTS_PATTERN: SemanticPattern = {
  cause: 'climate_events',
  crisisType: 'climate_disaster',
  typicalRootCauses: ['climate_driven'],
  coreIndicators: [
    // Acute climate disasters
    'wildfire', 'drought', 'heatwave', 'extreme heat', 'record temperatures',
    'flooding', 'sea level rise', 'glacier melting', 'extreme weather',
    'climate emergency', 'environmental disaster',
    'monsoon', 'heavy rain', 'torrential rain', 'deluge',
    // **ADDED**: Slow-onset climate events
    'coral bleaching', 'coral reef', 'permafrost', 'ice caps', 'ice melt',
    'melting ice', 'polar ice', 'arctic ice', 'deforestation', 'rainforest fires',
    // **ADDED**: Specific phrases for sea level rise
    'rising sea levels', 'rising sea level'
  ],
  supportingContext: [
    'climate change', 'global warming', 'environmental disaster',
    'ecosystem collapse', 'habitat destruction', 'species extinction',
    'carbon emissions', 'temperature records', 'weather patterns',
    'rising temperatures', 'melting ice', 'sea levels', 'coral bleaching',
    'rainfall', 'precipitation', 'seasonal', 'weather system',
    // **ADDED**: Impact indicators
    'threatens', 'threatening', 'kills', 'deaths', 'casualties',
    'millions', 'thousands', 'hundreds', 'east africa', 'europe',
    'amazon', 'great barrier reef', 'arctic', 'antarctic',
    // **ADDED**: More climate-specific descriptors
    'devastates', 'devastation', 'faster', 'accelerating', 'rapid',
    'unprecedented', 'alarming', 'predicted', 'pacific island'
  ],
  actionIndicators: [
    'firefighting efforts', 'evacuation orders', 'emergency cooling centers',
    'water rationing', 'climate adaptation', 'disaster response',
    'fire crews', 'containment', 'climate action', 'environmental response'
  ],
  negativeIndicators: [
    ...COMMON_NEGATIVE_INDICATORS,
    'election', 'campaign', 'congress', 'senate', 'legislation debate',
    'political discussion', 'policy proposal', 'budget hearing',
    'war', 'conflict', 'military', 'refugee', 'displacement', 'occupation',
    'ice', 'deportation', 'immigration', 'border patrol',
    // Opinion/editorial indicators
    'rethinking', 'editorial', 'opinion', 'perspective', 'commentary'
  ],
  minScore: 6,
  geoKeywords: {
    'Asia': ['asia', 'asian', 'south asia', 'southeast asia', 'east asia', 'monsoon'],
    'India': ['india', 'indian', 'mumbai', 'delhi', 'kolkata', 'chennai', 'bangalore'],
    'Bangladesh': ['bangladesh', 'bangladeshi', 'dhaka', 'chittagong'],
    'Pakistan': ['pakistan', 'pakistani', 'karachi', 'lahore', 'islamabad'],
    'Nepal': ['nepal', 'nepalese', 'kathmandu'],
    'Myanmar': ['myanmar', 'burma', 'yangon', 'mandalay'],
    'Thailand': ['thailand', 'thai', 'bangkok'],
    'Vietnam': ['vietnam', 'vietnamese', 'hanoi', 'ho chi minh'],
    'Philippines': ['philippines', 'filipino', 'manila'],
    'Indonesia': ['indonesia', 'indonesian', 'jakarta', 'bali'],
    'China': ['china', 'chinese', 'beijing', 'shanghai', 'guangzhou'],
    'California': ['california', 'ca', 'los angeles', 'san francisco', 'sacramento'],
    'Australia': ['australia', 'australian', 'sydney', 'melbourne', 'queensland'],
    'Greece': ['greece', 'greek', 'athens'],
    'Amazon': ['amazon', 'brazil', 'rainforest', 'brazilian'],
    'Europe': ['europe', 'european'],
    'Africa': ['africa', 'african', 'east africa'],
    'Pacific': ['pacific', 'pacific island', 'tuvalu', 'kiribati', 'marshall islands'],
  }
};

export const HUMANITARIAN_CRISIS_PATTERN: SemanticPattern = {
  cause: 'humanitarian_crisis',
  crisisType: 'conflict_displacement',
  typicalRootCauses: ['conflict_driven', 'multiple_factors'],
  coreIndicators: [
    // Displacement & refugees
    'refugee crisis', 'displaced persons', 'mass displacement', 'fleeing violence',
    'humanitarian emergency', 'famine', 'starvation', 'food insecurity crisis',
    'kidnapped', 'abducted', 'hostages', 'captivity', 'armed groups',
    'refugees fleeing', 'asylum seekers', 'humanitarian', 'crisis', 'conflict',
    'war', 'violence', 'persecution', 'suffering',
    'siege', 'blockade', 'occupation', 'military operation', 'civilian casualties',
    'gaza', 'palestine', 'west bank', 'refugee camp', 'idp camp',
    'ethnic cleansing', 'genocide', 'war crimes', 'atrocities',
    // **PROMOTED FROM SUPPORTING**: Strong humanitarian indicators
    'trapped', 'besieged', 'fleeing to', 'seeking refuge', 'escaping war'
  ],
  supportingContext: [
    'refugee camps', 'asylum seekers', 'internally displaced', 'humanitarian aid',
    'food shortage', 'malnutrition', 'lack of shelter', 'water scarcity',
    'conflict zone', 'war-torn', 'persecution', 'ethnic cleansing',
    'schoolchildren', 'students', 'families', 'violence', 'terror', 'militants',
    'civilians', 'innocent people', 'vulnerable populations', 'emergency aid',
    'humanitarian corridor', 'safe zone', 'buffer zone', 'ceasefire',
    'palestinian', 'israeli', 'hamas', 'idf', 'un agency', 'unrwa',
    'aid convoy', 'humanitarian access', 'border crossing', 'evacuation route',
    'myanmar', 'rohingya', 'south sudan', 'syria'
  ],
  actionIndicators: [
    'humanitarian response', 'aid distribution', 'refugee assistance',
    'emergency food', 'shelter provision', 'unhcr', 'red cross',
    'humanitarian organizations', 'relief operations', 'rescue mission',
    'negotiation', 'release secured', 'freed', 'liberation',
    'aid convoy', 'relief supplies', 'emergency assistance',
    'peacekeeping', 'ceasefire talks', 'humanitarian pause'
  ],
  negativeIndicators: [
    ...COMMON_NEGATIVE_INDICATORS,
    'election campaign', 'political fundraising', 'campaign strategy',
    'legislative debate', 'budget discussion', 'committee hearing',
    'earthquake', 'flood', 'hurricane', 'wildfire', 'natural disaster',
    // **REMOVED**: Disease names should NOT block humanitarian classification
    // Many humanitarian crises involve disease outbreaks (cholera in refugee camps, etc.)
    // Instead, we boost health_crisis when disease is the PRIMARY focus
    // 'outbreak', 'epidemic', 'pandemic', 'ebola', 'cholera', 'measles',
    // 'malaria', 'tuberculosis', 'dengue', 'meningitis', 'polio', 'diphtheria'
    // **ADDED**: Block social justice terms to prevent misclassification
    'mass incarceration', 'prison system', 'criminal justice system',
    'police brutality', 'ice raids', 'deportation of'
  ],
  minScore: 6,
  geoKeywords: {
    'Gaza': ['gaza', 'gaza strip', 'palestinian territories', 'rafah', 'khan younis'],
    'Palestine': ['palestine', 'palestinian', 'west bank', 'occupied territories'],
    'Syria': ['syria', 'syrian', 'aleppo', 'damascus', 'idlib'],
    'Ukraine': ['ukraine', 'ukrainian', 'kyiv', 'kharkiv', 'mariupol'],
    'Yemen': ['yemen', 'yemeni', 'sanaa', 'aden'],
    'Sudan': ['sudan', 'darfur', 'khartoum'],
    'Myanmar': ['myanmar', 'rohingya', 'rakhine'],
    'Nigeria': ['nigeria', 'nigerian', 'boko haram', 'kaduna', 'lagos'],
    'Afghanistan': ['afghanistan', 'afghan', 'kabul', 'kandahar'],
    'South Sudan': ['south sudan', 'juba'],
    'Somalia': ['somalia', 'mogadishu'],
  }
};

export const SOCIAL_JUSTICE_PATTERN: SemanticPattern = {
  cause: 'social_justice',
  crisisType: 'human_rights_violation',
  typicalRootCauses: ['systemic_inequality', 'policy_driven'],
  coreIndicators: [
    // Civil rights & discrimination
    'civil rights movement', 'protest movement', 'social justice campaign',
    'discrimination lawsuit', 'inequality crisis', 'systemic racism',
    'human rights violation', 'oppression of minorities',
    'discrimination', 'inequality', 'injustice', 'racism', 'prejudice',
    'civil rights', 'social justice', 'protest', 'demonstration',
    // Immigration & deportation (SPECIFIC to social_justice)
    'ice raids', 'immigration enforcement', 'border patrol',
    'immigration rights', 'immigrant rights', 'undocumented', 'daca',
    'asylum denied', 'immigration detention', 'family separation',
    'deported', 'deportation', 'removal', 'immigration court',
    // **ADDED**: Criminal justice & incarceration
    'mass incarceration', 'incarceration', 'prison system', 'criminal justice',
    'police brutality', 'excessive force', 'racial profiling', 'wrongful arrest',
    // **ADDED**: Indigenous rights
    'indigenous rights', 'land rights', 'treaty violation', 'pipeline construction'
  ],
  supportingContext: [
    'protesters', 'demonstrations', 'activists', 'advocacy groups',
    'marginalized communities', 'discrimination', 'inequality',
    'civil rights', 'human rights', 'social change', 'justice reform',
    'equality', 'fairness', 'oppression', 'marginalized', 'underserved',
    'immigrants', 'undocumented immigrants', 'immigration policy',
    'deportation defense', 'legal aid', 'immigration lawyers',
    'detention centers', 'ice raids', 'family separation',
    'visa issues', 'citizenship', 'green card', 'asylum process',
    'immigration reform', 'border policy', 'sanctuary cities',
    'police', 'law enforcement', 'officers', 'sparks', 'outrage',
    'prison', 'inmates', 'incarcerated', 'sentencing', 'indigenous', 'tribal',
    // **ADDED**: More social justice descriptors
    'disproportionately', 'affects', 'black americans', 'communities of color'
  ],
  actionIndicators: [
    'community organizing', 'legal aid', 'advocacy campaign',
    'education programs', 'support services', 'grassroots movement',
    'civil rights organization', 'justice initiative',
    'rally', 'march', 'petition', 'activism',
    'immigration legal services', 'deportation defense', 'know your rights',
    'immigrant support', 'aclu', 'immigration advocacy', 'legal representation'
  ],
  negativeIndicators: [
    ...COMMON_NEGATIVE_INDICATORS,
    'election campaign', 'political fundraising', 'campaign strategy',
    'legislative debate only', 'budget discussion',
    // **ADDED**: Prevent humanitarian overlap
    'war', 'conflict zone', 'military operation', 'refugee camp',
    'fleeing to', 'seeking refuge', 'escaping war', 'humanitarian corridor',
    'armed groups', 'militants', 'siege', 'blockade',
    // Opinion/editorial indicators
    'viewpoint', 'optimistic about', 'perspective', 'think piece'
  ],
  minScore: 6,
  geoKeywords: {
    'United States': ['us', 'usa', 'america', 'american', 'border', 'texas', 'arizona', 'california'],
    'Honduras': ['honduras', 'honduran', 'tegucigalpa'],
    'Mexico': ['mexico', 'mexican', 'border'],
    'Central America': ['central america', 'guatemala', 'el salvador'],
    'Global': ['global', 'worldwide', 'international'],
  }
};

export const SEMANTIC_PATTERNS: SemanticPattern[] = [
  DISASTER_RELIEF_PATTERN,
  HEALTH_CRISIS_PATTERN,
  CLIMATE_EVENTS_PATTERN,
  HUMANITARIAN_CRISIS_PATTERN,
  SOCIAL_JUSTICE_PATTERN,
];