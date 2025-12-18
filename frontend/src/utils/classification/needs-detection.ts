import { IdentifiedNeed } from '@/types';

export const NEEDS_PATTERNS: { [key in IdentifiedNeed]: string[] } = {
  food: [
    'food', 'hunger', 'famine', 'starvation', 'malnutrition', 'meals',
    'food insecurity', 'food shortage', 'food aid', 'emergency food',
    'nutrition', 'feeding', 'hungry'
  ],
  shelter: [
    'shelter', 'housing', 'homeless', 'displaced', 'evacuation',
    'temporary shelter', 'emergency shelter', 'accommodation', 'refuge',
    'homes destroyed', 'buildings collapsed', 'roofless'
  ],
  medical: [
    'medical', 'healthcare', 'hospital', 'treatment', 'medicine',
    'doctors', 'nurses', 'surgery', 'medical supplies', 'health',
    'injured', 'sick', 'patients', 'medical care', 'emergency medical'
  ],
  water: [
    'water', 'clean water', 'drinking water', 'water shortage',
    'water scarcity', 'dehydration', 'water infrastructure',
    'water access', 'contaminated water', 'water supply'
  ],
  legal_aid: [
    'legal', 'lawyer', 'attorney', 'legal aid', 'legal representation',
    'deportation defense', 'legal services', 'court', 'legal help',
    'immigration lawyer', 'legal assistance'
  ],
  rescue: [
    'rescue', 'trapped', 'search and rescue', 'emergency rescue',
    'rescue operations', 'rescue teams', 'stranded', '救援'
  ],
  education: [
    'education', 'school', 'students', 'learning', 'teachers',
    'educational', 'classroom', 'scholarship', 'tuition'
  ],
  mental_health: [
    'mental health', 'trauma', 'psychological', 'counseling',
    'therapy', 'ptsd', 'mental health support', 'psychosocial'
  ],
  winterization: [
    'winter', 'cold', 'heating', 'insulation', 'blankets',
    'winter clothing', 'freezing', 'winterization', 'warm'
  ],
  sanitation: [
    'sanitation', 'hygiene', 'toilets', 'waste', 'sewage',
    'sanitary', 'hygiene kits', 'latrines', 'sanitation facilities'
  ]
};

export function detectNeeds(content: string): IdentifiedNeed[] {
  const lowerContent = content.toLowerCase();
  const detectedNeeds: IdentifiedNeed[] = [];
  
  for (const [need, patterns] of Object.entries(NEEDS_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerContent.includes(pattern.toLowerCase())) {
        detectedNeeds.push(need as IdentifiedNeed);
        break;
      }
    }
  }
  
  return [...new Set(detectedNeeds)];
}