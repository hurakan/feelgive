import { Charity } from '@/types';

export const CHARITIES: Charity[] = [
  // Disaster Relief
  {
    id: 'dr-001',
    name: 'International Red Cross',
    slug: 'red-cross',
    description: 'Provides immediate emergency relief to communities affected by natural disasters worldwide.',
    logo: '/placeholder-logo.png', // Will fallback to initials
    causes: ['disaster_relief'],
    countries: ['global'],
    trustScore: 95,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 5,
    addressedNeeds: ['shelter', 'food', 'water', 'rescue', 'medical'],
    profile: {
      fullLegalName: 'International Committee of the Red Cross',
      registrationNumber: 'EIN 45-1234567',
      yearFounded: 1863,
      headquarters: 'Geneva, Switzerland',
      website: 'https://www.icrc.org',
      socialLinks: {
        twitter: 'https://twitter.com/icrc',
        facebook: 'https://facebook.com/icrc',
      },
      missionStatement: 'To provide rapid, effective emergency relief to communities devastated by natural disasters, ensuring no family faces crisis alone.',
      programAreas: [
        'Emergency response & rescue operations',
        'Temporary shelter & housing',
        'Food & water distribution',
        'Medical aid & trauma support',
        'Long-term rebuilding assistance'
      ],
      regionsServed: ['Global', 'Asia-Pacific', 'Americas', 'Europe', 'Africa'],
      recentHighlights: [
        'In 2023, responded to 47 disasters across 28 countries, supporting over 125,000 families',
        'Deployed emergency teams within 48 hours to Turkey earthquake, providing shelter for 15,000 people',
        'Established 12 permanent disaster preparedness centers in high-risk regions'
      ],
      impactMetrics: [
        { label: 'Families Reached', value: '125,000+' },
        { label: 'Emergency Shelters Built', value: '3,200' },
        { label: 'Countries Served', value: '28' },
        { label: 'Response Time', value: '< 48 hours' }
      ],
      partnerships: [
        'United Nations Office for Disaster Risk Reduction (UNDRR)',
        'International Federation of Red Cross',
        'Local emergency services in 50+ countries'
      ]
    }
  },
  {
    id: 'dr-002',
    name: 'Direct Relief',
    slug: 'direct-relief',
    description: 'Improves the health and lives of people affected by poverty and emergencies.',
    logo: '/placeholder-logo.png',
    causes: ['disaster_relief'],
    countries: ['US', 'CA', 'MX'],
    trustScore: 92,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 2,
    addressedNeeds: ['rescue', 'medical', 'shelter'],
    profile: {
      fullLegalName: 'Direct Relief',
      dbaName: 'Direct Relief',
      registrationNumber: 'EIN 95-1831116',
      yearFounded: 1948,
      headquarters: 'Santa Barbara, California, USA',
      website: 'https://www.directrelief.org',
      socialLinks: {
        twitter: 'https://twitter.com/directrelief',
        instagram: 'https://instagram.com/directrelief',
      },
      missionStatement: 'To improve the health and lives of people affected by poverty or emergency situations by mobilizing and providing essential medical resources needed for their care.',
      programAreas: [
        'Emergency medical response',
        'Chronic disease programs',
        'Maternal & child health',
        'Medical equipment & supplies',
        'Healthcare facility support'
      ],
      regionsServed: ['United States', 'Caribbean', 'Central America', 'Global'],
      recentHighlights: [
        'Delivered over $2 billion in medical aid to 80+ countries in 2023',
        'Responded to major hurricanes with emergency medical supplies',
        'Supported 1,200+ community health centers across the US'
      ],
      impactMetrics: [
        { label: 'Medical Aid Value', value: '$2B+' },
        { label: 'Countries Served', value: '80+' },
        { label: 'Health Centers Supported', value: '1,200+' },
        { label: 'Emergency Responses', value: '45' }
      ],
      partnerships: [
        'World Health Organization',
        'CDC Foundation',
        'State health departments'
      ]
    }
  },
  {
    id: 'dr-003',
    name: 'Habitat for Humanity',
    slug: 'habitat-humanity',
    description: 'Helps families rebuild homes and lives after disasters through volunteer construction.',
    logo: '/placeholder-logo.png',
    causes: ['disaster_relief'],
    countries: ['global'],
    trustScore: 90,
    vettingLevel: 'partner_only',
    isActive: true,
    geographicFlexibility: 4,
    addressedNeeds: ['shelter', 'education'],
    profile: {
      fullLegalName: 'Habitat for Humanity International Inc.',
      registrationNumber: 'EIN 91-1914868',
      yearFounded: 1976,
      headquarters: 'Atlanta, Georgia, USA',
      website: 'https://www.habitat.org',
      socialLinks: {
        facebook: 'https://facebook.com/habitat',
        instagram: 'https://instagram.com/habitatforhumanity',
      },
      missionStatement: 'Seeking to put God\'s love into action, Habitat for Humanity brings people together to build homes, communities and hope.',
      programAreas: [
        'Home construction & repair',
        'Disaster response & recovery',
        'Community development',
        'Affordable housing advocacy',
        'Volunteer mobilization'
      ],
      regionsServed: ['70+ countries worldwide'],
      recentHighlights: [
        'Built or repaired 6.8 million homes, serving 34 million people',
        'Responded to major disasters in Philippines, Caribbean, and US',
        'Mobilized 1 million volunteers annually'
      ],
      impactMetrics: [
        { label: 'Homes Built/Repaired', value: '6.8M' },
        { label: 'People Served', value: '34M' },
        { label: 'Countries', value: '70+' },
        { label: 'Annual Volunteers', value: '1M' }
      ],
      partnerships: [
        'The Home Depot Foundation',
        'Lowe\'s',
        'Local governments worldwide'
      ]
    }
  },
  
  // Health Crisis
  {
    id: 'hc-001',
    name: 'Doctors Without Borders',
    slug: 'doctors-without-borders',
    description: 'Delivers emergency medical care to people affected by conflict, epidemics, disasters, or exclusion from healthcare.',
    logo: '/placeholder-logo.png',
    causes: ['health_crisis'],
    countries: ['global'],
    trustScore: 96,
    vettingLevel: 'pg_direct',
    isActive: true,
    geographicFlexibility: 5,
    addressedNeeds: ['medical', 'water', 'sanitation'],
    profile: {
      fullLegalName: 'Médecins Sans Frontières (MSF)',
      dbaName: 'Doctors Without Borders',
      registrationNumber: 'EIN 13-3433452',
      yearFounded: 1971,
      headquarters: 'Geneva, Switzerland',
      website: 'https://www.msf.org',
      socialLinks: {
        twitter: 'https://twitter.com/msf',
        instagram: 'https://instagram.com/doctorswithoutborders',
      },
      missionStatement: 'To provide lifesaving medical care to those most in need, regardless of race, religion, or political affiliation.',
      programAreas: [
        'Emergency medical response',
        'Epidemic control',
        'Surgery & trauma care',
        'Maternal & child health',
        'Mental health support'
      ],
      regionsServed: ['70+ countries in crisis zones'],
      recentHighlights: [
        'Treated 11.3 million patients in 2023',
        'Responded to conflicts in Ukraine, Sudan, and Gaza',
        'Delivered 546,300 babies in MSF-supported facilities'
      ],
      impactMetrics: [
        { label: 'Patients Treated', value: '11.3M' },
        { label: 'Countries Active', value: '70+' },
        { label: 'Babies Delivered', value: '546,300' },
        { label: 'Medical Staff', value: '63,000' }
      ],
      partnerships: [
        'World Health Organization',
        'UNICEF',
        'Local health ministries'
      ]
    }
  },
  {
    id: 'hc-002',
    name: 'UNICEF',
    slug: 'unicef',
    description: 'Works in the world\'s toughest places to reach the most disadvantaged children and adolescents.',
    logo: '/placeholder-logo.png',
    causes: ['health_crisis'],
    countries: ['global'],
    trustScore: 94,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 5,
    addressedNeeds: ['medical', 'education', 'water'],
    profile: {
      fullLegalName: 'United Nations Children\'s Fund',
      dbaName: 'UNICEF',
      registrationNumber: 'UN Agency',
      yearFounded: 1946,
      headquarters: 'New York, New York, USA',
      website: 'https://www.unicef.org',
      socialLinks: {
        twitter: 'https://twitter.com/unicef',
        facebook: 'https://facebook.com/unicef',
        instagram: 'https://instagram.com/unicef',
      },
      missionStatement: 'To advocate for the protection of children\'s rights, to help meet their basic needs and to expand their opportunities to reach their full potential.',
      programAreas: [
        'Child health & nutrition',
        'Immunization programs',
        'Education',
        'Water & sanitation',
        'Child protection'
      ],
      regionsServed: ['190+ countries and territories'],
      recentHighlights: [
        'Vaccinated 2.2 billion children against preventable diseases',
        'Provided education to 48 million children in emergencies',
        'Supplied clean water to 13.6 million people'
      ],
      impactMetrics: [
        { label: 'Children Vaccinated', value: '2.2B' },
        { label: 'Countries Served', value: '190+' },
        { label: 'Children in School', value: '48M' },
        { label: 'Clean Water Access', value: '13.6M' }
      ],
      partnerships: [
        'World Health Organization',
        'Gavi, the Vaccine Alliance',
        'National governments'
      ]
    }
  },
  {
    id: 'hc-003',
    name: 'Partners In Health',
    slug: 'partners-in-health',
    description: 'Provides high-quality healthcare to the world\'s poorest communities.',
    logo: '/placeholder-logo.png',
    causes: ['health_crisis'],
    countries: ['global'],
    trustScore: 93,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 4,
    addressedNeeds: ['medical', 'mental_health', 'education'],
    profile: {
      fullLegalName: 'Partners In Health',
      dbaName: 'PIH',
      registrationNumber: 'EIN 04-3567502',
      yearFounded: 1987,
      headquarters: 'Boston, Massachusetts, USA',
      website: 'https://www.pih.org',
      socialLinks: {
        twitter: 'https://twitter.com/pih',
        facebook: 'https://facebook.com/partnersinhealth',
      },
      missionStatement: 'To provide a preferential option for the poor in health care by bringing the benefits of modern medical science to those most in need.',
      programAreas: [
        'Community health systems',
        'Infectious disease treatment',
        'Maternal & child health',
        'Mental health services',
        'Medical education & training'
      ],
      regionsServed: ['12 countries including Haiti, Rwanda, Peru, Liberia'],
      recentHighlights: [
        'Supported 5.8 million patients in 2023',
        'Trained 15,000 community health workers',
        'Built or renovated 50 health facilities'
      ],
      impactMetrics: [
        { label: 'Patients Supported', value: '5.8M' },
        { label: 'Health Workers Trained', value: '15,000' },
        { label: 'Health Facilities', value: '50' },
        { label: 'Countries', value: '12' }
      ],
      partnerships: [
        'Harvard Medical School',
        'Brigham and Women\'s Hospital',
        'Local health ministries'
      ]
    }
  },
  
  // Climate Events
  {
    id: 'ce-001',
    name: 'The Nature Conservancy',
    slug: 'nature-conservancy',
    description: 'Works to protect ecologically important lands and waters for nature and people.',
    logo: '/placeholder-logo.png',
    causes: ['climate_events'],
    countries: ['global'],
    trustScore: 93,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 4,
    addressedNeeds: ['shelter', 'food', 'water', 'education'],
    profile: {
      fullLegalName: 'The Nature Conservancy',
      dbaName: 'TNC',
      registrationNumber: 'EIN 53-0242652',
      yearFounded: 1951,
      headquarters: 'Arlington, Virginia, USA',
      website: 'https://www.nature.org',
      socialLinks: {
        twitter: 'https://twitter.com/nature_org',
        instagram: 'https://instagram.com/nature_org',
      },
      missionStatement: 'To conserve the lands and waters on which all life depends through science-based solutions.',
      programAreas: [
        'Climate change mitigation',
        'Land & water conservation',
        'Sustainable agriculture',
        'Ocean protection',
        'Community resilience'
      ],
      regionsServed: ['79 countries and territories'],
      recentHighlights: [
        'Protected 125 million acres of land and thousands of miles of rivers',
        'Planted 1 billion trees globally',
        'Helped 100+ communities adapt to climate change'
      ],
      impactMetrics: [
        { label: 'Land Protected', value: '125M acres' },
        { label: 'Trees Planted', value: '1B' },
        { label: 'Countries', value: '79' },
        { label: 'Communities Supported', value: '100+' }
      ],
      partnerships: [
        'UN Environment Programme',
        'World Wildlife Fund',
        'Local conservation groups'
      ]
    }
  },
  {
    id: 'ce-002',
    name: 'American Red Cross',
    slug: 'american-red-cross',
    description: 'Prevents and alleviates human suffering in the face of emergencies including wildfires.',
    logo: '/placeholder-logo.png',
    causes: ['climate_events', 'disaster_relief'],
    countries: ['US'],
    trustScore: 91,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 1,
    addressedNeeds: ['shelter', 'rescue', 'mental_health'],
    profile: {
      fullLegalName: 'American National Red Cross',
      dbaName: 'American Red Cross',
      registrationNumber: 'EIN 53-0196605',
      yearFounded: 1881,
      headquarters: 'Washington, D.C., USA',
      website: 'https://www.redcross.org',
      socialLinks: {
        twitter: 'https://twitter.com/redcross',
        facebook: 'https://facebook.com/redcross',
      },
      missionStatement: 'To prevent and alleviate human suffering in the face of emergencies by mobilizing the power of volunteers and the generosity of donors.',
      programAreas: [
        'Disaster relief & recovery',
        'Blood donation services',
        'Emergency preparedness training',
        'International humanitarian aid',
        'Military family support'
      ],
      regionsServed: ['United States and territories'],
      recentHighlights: [
        'Responded to nearly 60,000 disasters in 2023',
        'Provided 6.8 million services to military families',
        'Collected 6.8 million blood donations'
      ],
      impactMetrics: [
        { label: 'Disasters Responded', value: '60,000' },
        { label: 'Military Services', value: '6.8M' },
        { label: 'Blood Donations', value: '6.8M' },
        { label: 'Volunteers', value: '300,000' }
      ],
      partnerships: [
        'FEMA',
        'International Red Cross',
        'State emergency agencies'
      ]
    }
  },
  {
    id: 'ce-003',
    name: 'Ocean Conservancy',
    slug: 'ocean-conservancy',
    description: 'Works to protect the ocean from today\'s greatest global challenges.',
    logo: '/placeholder-logo.png',
    causes: ['climate_events'],
    countries: ['global'],
    trustScore: 89,
    vettingLevel: 'partner_only',
    isActive: true,
    geographicFlexibility: 4,
    addressedNeeds: ['shelter', 'water', 'food', 'education'],
    profile: {
      fullLegalName: 'Ocean Conservancy',
      registrationNumber: 'EIN 23-7245152',
      yearFounded: 1972,
      headquarters: 'Washington, D.C., USA',
      website: 'https://oceanconservancy.org',
      socialLinks: {
        twitter: 'https://twitter.com/ourocean',
        instagram: 'https://instagram.com/ocean_conservancy',
      },
      missionStatement: 'To protect the ocean from today\'s greatest global challenges through science-based solutions for a healthy ocean and the wildlife and communities that depend on it.',
      programAreas: [
        'Ocean plastic pollution',
        'Climate change adaptation',
        'Sustainable fisheries',
        'Coastal resilience',
        'Arctic conservation'
      ],
      regionsServed: ['Coastal communities worldwide'],
      recentHighlights: [
        'Removed 25 million pounds of trash from beaches and waterways',
        'Protected 2 million square miles of ocean',
        'Engaged 1 million volunteers in coastal cleanups'
      ],
      impactMetrics: [
        { label: 'Trash Removed', value: '25M lbs' },
        { label: 'Ocean Protected', value: '2M sq mi' },
        { label: 'Volunteers', value: '1M' },
        { label: 'Countries', value: '150+' }
      ],
      partnerships: [
        'NOAA',
        'Coastal communities',
        'International marine organizations'
      ]
    }
  },
  
  // Humanitarian Crisis
  {
    id: 'hum-001',
    name: 'UNHCR',
    slug: 'unhcr',
    description: 'Protects refugees, forcibly displaced communities and stateless people.',
    logo: '/placeholder-logo.png',
    causes: ['humanitarian_crisis'],
    countries: ['global'],
    trustScore: 97,
    vettingLevel: 'pg_direct',
    isActive: true,
    geographicFlexibility: 5,
    addressedNeeds: ['shelter', 'food', 'water', 'medical', 'education', 'mental_health'],
    profile: {
      fullLegalName: 'United Nations High Commissioner for Refugees',
      dbaName: 'UNHCR',
      registrationNumber: 'UN Agency',
      yearFounded: 1950,
      headquarters: 'Geneva, Switzerland',
      website: 'https://www.unhcr.org',
      socialLinks: {
        twitter: 'https://twitter.com/refugees',
        facebook: 'https://facebook.com/unhcr',
        instagram: 'https://instagram.com/refugees',
      },
      missionStatement: 'To safeguard the rights and well-being of people who have been forced to flee, ensuring that everyone has the right to seek asylum and find safe refuge.',
      programAreas: [
        'Emergency shelter & housing',
        'Protection services',
        'Education for refugees',
        'Healthcare access',
        'Livelihood programs'
      ],
      regionsServed: ['135+ countries'],
      recentHighlights: [
        'Assisted 117 million forcibly displaced people in 2023',
        'Provided shelter to 2.8 million refugees',
        'Enrolled 7.2 million refugee children in school'
      ],
      impactMetrics: [
        { label: 'People Assisted', value: '117M' },
        { label: 'Shelter Provided', value: '2.8M' },
        { label: 'Children in School', value: '7.2M' },
        { label: 'Countries', value: '135+' }
      ],
      partnerships: [
        'UN agencies',
        'International NGOs',
        'Host governments'
      ]
    }
  },
  {
    id: 'hum-002',
    name: 'World Food Programme',
    slug: 'world-food-programme',
    description: 'The world\'s largest humanitarian organization addressing hunger and promoting food security.',
    logo: '/placeholder-logo.png',
    causes: ['humanitarian_crisis'],
    countries: ['global'],
    trustScore: 95,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 5,
    addressedNeeds: ['food', 'water', 'education'],
    profile: {
      fullLegalName: 'United Nations World Food Programme',
      dbaName: 'WFP',
      registrationNumber: 'UN Agency',
      yearFounded: 1961,
      headquarters: 'Rome, Italy',
      website: 'https://www.wfp.org',
      socialLinks: {
        twitter: 'https://twitter.com/wfp',
        facebook: 'https://facebook.com/worldfoodprogramme',
      },
      missionStatement: 'To eradicate hunger and malnutrition, with the ultimate goal in mind of eliminating the need for food aid itself.',
      programAreas: [
        'Emergency food assistance',
        'School feeding programs',
        'Nutrition programs',
        'Resilience building',
        'Supply chain logistics'
      ],
      regionsServed: ['120+ countries'],
      recentHighlights: [
        'Provided food assistance to 152 million people in 2023',
        'Fed 15.5 million children through school meals',
        'Delivered 5.4 million metric tons of food'
      ],
      impactMetrics: [
        { label: 'People Fed', value: '152M' },
        { label: 'School Meals', value: '15.5M' },
        { label: 'Food Delivered', value: '5.4M tons' },
        { label: 'Countries', value: '120+' }
      ],
      partnerships: [
        'FAO',
        'UNICEF',
        'National governments'
      ]
    }
  },
  {
    id: 'hum-003',
    name: 'International Rescue Committee',
    slug: 'international-rescue-committee',
    description: 'Helps people whose lives and livelihoods are shattered by conflict and disaster.',
    logo: '/placeholder-logo.png',
    causes: ['humanitarian_crisis', 'health_crisis'],
    countries: ['global'],
    trustScore: 94,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 5,
    addressedNeeds: ['medical', 'mental_health', 'water', 'sanitation', 'education'],
    profile: {
      fullLegalName: 'International Rescue Committee Inc.',
      dbaName: 'IRC',
      registrationNumber: 'EIN 13-5660870',
      yearFounded: 1933,
      headquarters: 'New York, New York, USA',
      website: 'https://www.rescue.org',
      socialLinks: {
        twitter: 'https://twitter.com/rescueorg',
        facebook: 'https://facebook.com/internationalrescuecommittee',
      },
      missionStatement: 'To help people whose lives and livelihoods are shattered by conflict and disaster to survive, recover and gain control of their future.',
      programAreas: [
        'Emergency response',
        'Health services',
        'Education programs',
        'Economic recovery',
        'Women\'s protection & empowerment'
      ],
      regionsServed: ['50+ countries'],
      recentHighlights: [
        'Reached 32 million people affected by crisis in 2023',
        'Provided healthcare to 9.8 million people',
        'Helped 1.2 million children access education'
      ],
      impactMetrics: [
        { label: 'People Reached', value: '32M' },
        { label: 'Healthcare Services', value: '9.8M' },
        { label: 'Children Educated', value: '1.2M' },
        { label: 'Countries', value: '50+' }
      ],
      partnerships: [
        'UN agencies',
        'Local NGOs',
        'Government partners'
      ]
    }
  },
  
  // Social Justice
  {
    id: 'sj-001',
    name: 'Save the Children',
    slug: 'save-the-children',
    description: 'Gives children a healthy start in life, the opportunity to learn and protection from harm.',
    logo: '/placeholder-logo.png',
    causes: ['social_justice'],
    countries: ['global'],
    trustScore: 92,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 5,
    addressedNeeds: ['education', 'food', 'medical', 'shelter'],
    profile: {
      fullLegalName: 'Save the Children Federation Inc.',
      dbaName: 'Save the Children',
      registrationNumber: 'EIN 06-0726487',
      yearFounded: 1919,
      headquarters: 'Fairfield, Connecticut, USA',
      website: 'https://www.savethechildren.org',
      socialLinks: {
        twitter: 'https://twitter.com/savethechildren',
        facebook: 'https://facebook.com/savethechildren',
        instagram: 'https://instagram.com/savethechildren',
      },
      missionStatement: 'To inspire breakthroughs in the way the world treats children and to achieve immediate and lasting change in their lives.',
      programAreas: [
        'Education programs',
        'Child protection',
        'Health & nutrition',
        'Emergency response',
        'Child rights advocacy'
      ],
      regionsServed: ['120+ countries'],
      recentHighlights: [
        'Reached 234 million children in 2023',
        'Provided education to 31 million children',
        'Delivered health services to 89 million children'
      ],
      impactMetrics: [
        { label: 'Children Reached', value: '234M' },
        { label: 'Education Access', value: '31M' },
        { label: 'Health Services', value: '89M' },
        { label: 'Countries', value: '120+' }
      ],
      partnerships: [
        'UNICEF',
        'World Bank',
        'National education ministries'
      ]
    }
  },
  {
    id: 'sj-002',
    name: 'Amnesty International',
    slug: 'amnesty-international',
    description: 'A global movement campaigning for a world where human rights are enjoyed by all.',
    logo: '/placeholder-logo.png',
    causes: ['social_justice'],
    countries: ['global'],
    trustScore: 90,
    vettingLevel: 'partner_only',
    isActive: true,
    geographicFlexibility: 4,
    addressedNeeds: ['legal_aid', 'education', 'mental_health'],
    profile: {
      fullLegalName: 'Amnesty International',
      dbaName: 'Amnesty',
      registrationNumber: 'UK Charity 1051681',
      yearFounded: 1961,
      headquarters: 'London, United Kingdom',
      website: 'https://www.amnesty.org',
      socialLinks: {
        twitter: 'https://twitter.com/amnesty',
        facebook: 'https://facebook.com/amnesty',
      },
      missionStatement: 'To undertake research and action focused on preventing and ending grave abuses of human rights, and to demand justice for those whose rights have been violated.',
      programAreas: [
        'Human rights documentation',
        'Legal advocacy',
        'Campaign mobilization',
        'Prisoner support',
        'Policy reform'
      ],
      regionsServed: ['150+ countries'],
      recentHighlights: [
        'Documented human rights violations in 159 countries',
        'Mobilized 10 million supporters worldwide',
        'Helped free 150+ prisoners of conscience'
      ],
      impactMetrics: [
        { label: 'Countries Monitored', value: '159' },
        { label: 'Global Supporters', value: '10M' },
        { label: 'Prisoners Freed', value: '150+' },
        { label: 'Campaigns', value: '500+' }
      ],
      partnerships: [
        'UN Human Rights Council',
        'International Criminal Court',
        'Civil society organizations'
      ]
    }
  },
  {
    id: 'sj-003',
    name: 'Oxfam International',
    slug: 'oxfam',
    description: 'Works to end the injustice of poverty by helping people build better lives.',
    logo: '/placeholder-logo.png',
    causes: ['social_justice'],
    countries: ['global'],
    trustScore: 88,
    vettingLevel: 'partner_only',
    isActive: true,
    geographicFlexibility: 4,
    addressedNeeds: ['education', 'food', 'legal_aid', 'water'],
    profile: {
      fullLegalName: 'Oxfam International',
      dbaName: 'Oxfam',
      registrationNumber: 'UK Charity 202918',
      yearFounded: 1942,
      headquarters: 'Nairobi, Kenya',
      website: 'https://www.oxfam.org',
      socialLinks: {
        twitter: 'https://twitter.com/oxfam',
        instagram: 'https://instagram.com/oxfam',
        facebook: 'https://facebook.com/oxfaminternational',
      },
      missionStatement: 'To create lasting solutions to poverty, hunger, and social injustice by working with communities and partners worldwide.',
      programAreas: [
        'Economic justice',
        'Gender equality',
        'Emergency response',
        'Climate justice',
        'Inequality reduction'
      ],
      regionsServed: ['90+ countries'],
      recentHighlights: [
        'Reached 21.8 million people with humanitarian assistance',
        'Supported 5.2 million people with livelihood programs',
        'Advocated for policy changes in 50+ countries'
      ],
      impactMetrics: [
        { label: 'People Reached', value: '21.8M' },
        { label: 'Livelihood Support', value: '5.2M' },
        { label: 'Countries', value: '90+' },
        { label: 'Policy Wins', value: '50+' }
      ],
      partnerships: [
        'UN agencies',
        'Local community organizations',
        'National governments'
      ]
    }
  },
  
  // Immigration Rights Organizations
  {
    id: 'sj-004',
    name: 'RAICES',
    slug: 'raices',
    description: 'Defends the rights of immigrants and refugees, and empowers them to know and use their rights.',
    logo: '/placeholder-logo.png',
    causes: ['social_justice'],
    countries: ['US', 'MX'],
    trustScore: 94,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 2,
    addressedNeeds: ['legal_aid', 'education', 'mental_health'],
    profile: {
      fullLegalName: 'Refugee and Immigrant Center for Education and Legal Services',
      dbaName: 'RAICES',
      registrationNumber: 'EIN 74-2436920',
      yearFounded: 1986,
      headquarters: 'San Antonio, Texas, USA',
      website: 'https://www.raicestexas.org',
      socialLinks: {
        twitter: 'https://twitter.com/raicestexas',
        facebook: 'https://facebook.com/raicestexas',
        instagram: 'https://instagram.com/raicestexas',
      },
      missionStatement: 'To defend the rights of immigrants and refugees, empower individuals, families and communities, and advocate for liberty and justice.',
      programAreas: [
        'Legal representation',
        'Bond assistance',
        'Family reunification',
        'Know Your Rights education',
        'Policy advocacy'
      ],
      regionsServed: ['Texas', 'US-Mexico border region'],
      recentHighlights: [
        'Provided legal services to 25,000+ immigrants in 2023',
        'Reunited 500+ families separated at the border',
        'Conducted 200+ Know Your Rights workshops'
      ],
      impactMetrics: [
        { label: 'Legal Cases', value: '25,000+' },
        { label: 'Families Reunited', value: '500+' },
        { label: 'Workshops', value: '200+' },
        { label: 'Success Rate', value: '95%' }
      ],
      partnerships: [
        'ACLU',
        'National Immigration Law Center',
        'Local legal aid organizations'
      ]
    }
  },
  {
    id: 'sj-005',
    name: 'Al Otro Lado',
    slug: 'al-otro-lado',
    description: 'Provides legal services to deportees, migrants, and refugees in Tijuana, Mexico.',
    logo: '/placeholder-logo.png',
    causes: ['social_justice'],
    countries: ['US', 'MX'],
    trustScore: 91,
    vettingLevel: 'partner_pg_review',
    isActive: true,
    geographicFlexibility: 2,
    addressedNeeds: ['shelter', 'food', 'legal_aid', 'mental_health', 'medical'],
    profile: {
      fullLegalName: 'Al Otro Lado Inc.',
      dbaName: 'Al Otro Lado',
      registrationNumber: 'EIN 46-2622847',
      yearFounded: 2012,
      headquarters: 'Los Angeles, California, USA',
      website: 'https://alotrolado.org',
      socialLinks: {
        twitter: 'https://twitter.com/alotroladoorg',
        facebook: 'https://facebook.com/alotroladoorg',
      },
      missionStatement: 'To provide legal and humanitarian support to refugees, deportees, and other migrants in Tijuana, Mexico.',
      programAreas: [
        'Legal representation for asylum seekers',
        'Medical & mental health services',
        'Humanitarian aid',
        'Family reunification',
        'Community education'
      ],
      regionsServed: ['US-Mexico border', 'Tijuana', 'Southern California'],
      recentHighlights: [
        'Provided legal services to 8,000+ asylum seekers in 2023',
        'Offered medical care to 3,500+ migrants',
        'Reunited 200+ families'
      ],
      impactMetrics: [
        { label: 'Legal Services', value: '8,000+' },
        { label: 'Medical Care', value: '3,500+' },
        { label: 'Families Reunited', value: '200+' },
        { label: 'Volunteers', value: '500+' }
      ],
      partnerships: [
        'Border Angels',
        'Jewish Family Service',
        'Local shelters in Tijuana'
      ]
    }
  },
  {
    id: 'sj-006',
    name: 'United We Dream',
    slug: 'united-we-dream',
    description: 'The largest immigrant youth-led organization in the nation.',
    logo: '/placeholder-logo.png',
    causes: ['social_justice'],
    countries: ['US'],
    trustScore: 89,
    vettingLevel: 'partner_only',
    isActive: true,
    geographicFlexibility: 1,
    addressedNeeds: ['education', 'legal_aid', 'mental_health'],
    profile: {
      fullLegalName: 'United We Dream Network',
      dbaName: 'United We Dream',
      registrationNumber: 'EIN 26-2042806',
      yearFounded: 2008,
      headquarters: 'Washington, D.C., USA',
      website: 'https://unitedwedream.org',
      socialLinks: {
        twitter: 'https://twitter.com/unitedwedream',
        instagram: 'https://instagram.com/unitedwedream',
      },
      missionStatement: 'To empower immigrant youth to develop their leadership, their organizing skills, and to develop campaigns to fight for justice and dignity for immigrants and all people.',
      programAreas: [
        'Youth leadership development',
        'DACA support & advocacy',
        'Immigration reform campaigns',
        'Community organizing',
        'Mental health support'
      ],
      regionsServed: ['United States'],
      recentHighlights: [
        'Mobilized 400,000+ immigrant youth nationwide',
        'Helped 50,000+ young people with DACA applications',
        'Led campaigns resulting in policy changes in 15 states'
      ],
      impactMetrics: [
        { label: 'Youth Mobilized', value: '400,000+' },
        { label: 'DACA Support', value: '50,000+' },
        { label: 'State Policy Wins', value: '15' },
        { label: 'Local Chapters', value: '100+' }
      ],
      partnerships: [
        'National Immigration Law Center',
        'ACLU',
        'Local immigrant rights organizations'
      ]
    }
  },
];