import { TrackedLocation } from '@/types';

const STORAGE_KEY = 'feelgive_tracked_locations';

// Default locations to show news immediately
const DEFAULT_LOCATIONS: TrackedLocation[] = [
  {
    id: 'default_ukraine',
    type: 'country',
    value: 'Ukraine',
    displayName: 'Ukraine',
    createdAt: Date.now()
  },
  {
    id: 'default_middle_east',
    type: 'region',
    value: 'Middle East',
    displayName: 'Middle East',
    createdAt: Date.now()
  },
  {
    id: 'default_africa',
    type: 'region',
    value: 'Africa',
    displayName: 'Africa',
    createdAt: Date.now()
  }
];

export function getTrackedLocations(): TrackedLocation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  // If no stored locations, initialize with defaults
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOCATIONS));
    return DEFAULT_LOCATIONS;
  }
  
  try {
    const locations = JSON.parse(stored);
    // If empty array, return defaults
    if (locations.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOCATIONS));
      return DEFAULT_LOCATIONS;
    }
    return locations;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOCATIONS));
    return DEFAULT_LOCATIONS;
  }
}

export function saveTrackedLocation(location: TrackedLocation): void {
  const locations = getTrackedLocations();
  
  // Check if location already exists (prevent duplicates)
  const isDuplicate = locations.some(loc => {
    // For cities, check value, state, and country
    if (location.type === 'city' && loc.type === 'city') {
      return loc.value === location.value &&
             loc.state === location.state &&
             loc.country === location.country;
    }
    // For regions and countries, check value and type
    return loc.value === location.value && loc.type === location.type;
  });
  
  if (isDuplicate) {
    console.warn('Location already tracked:', location.displayName);
    return;
  }
  
  locations.push(location);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

export function removeTrackedLocation(id: string): void {
  const locations = getTrackedLocations();
  const filtered = locations.filter(loc => loc.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateLocationId(): string {
  return `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isLocationAlreadyTracked(value: string): boolean {
  const locations = getTrackedLocations();
  // Check exact match on value (which includes country code for postal codes)
  return locations.some(loc => loc.value.toLowerCase() === value.toLowerCase());
}

// Predefined regions
export const REGIONS = [
  'North America',
  'South America',
  'Central America',
  'Caribbean',
  'Europe',
  'Middle East',
  'Africa',
  'Asia',
  'Southeast Asia',
  'South Asia',
  'East Asia',
  'Oceania',
  'Pacific Islands'
];

// Common countries (can be expanded)
export const COUNTRIES = [
  'United States',
  'Canada',
  'Mexico',
  'Brazil',
  'Argentina',
  'United Kingdom',
  'France',
  'Germany',
  'Spain',
  'Italy',
  'Sudan',
  'South Sudan',
  'Congo',
  'Democratic Republic of Congo',
  'Nigeria',
  'Kenya',
  'Ethiopia',
  'Somalia',
  'Syria',
  'Yemen',
  'Gaza',
  'Palestine',
  'Ukraine',
  'Afghanistan',
  'Myanmar',
  'Cambodia',
  'India',
  'Bangladesh',
  'Pakistan',
  'China',
  'Japan',
  'Australia'
];

// US States
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

// Canadian Provinces and Territories
export const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
];

// Australian States and Territories
export const AUSTRALIA_STATES = [
  'Australian Capital Territory', 'New South Wales', 'Northern Territory',
  'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
];

// Indian States and Union Territories
export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Brazilian States
export const BRAZIL_STATES = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
  'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
  'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
  'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
  'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

// Mexican States
export const MEXICO_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Mexico City', 'Michoacán',
  'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
  'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco',
  'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

// Countries that support state/province selection
export const COUNTRIES_WITH_STATES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

// Get states/provinces for a country
export function getStatesForCountry(countryCode: string): string[] {
  switch (countryCode) {
    case 'US':
      return US_STATES;
    case 'CA':
      return CANADA_PROVINCES;
    case 'AU':
      return AUSTRALIA_STATES;
    case 'IN':
      return INDIA_STATES;
    case 'BR':
      return BRAZIL_STATES;
    case 'MX':
      return MEXICO_STATES;
    default:
      return [];
  }
}