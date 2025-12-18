import { TrackedLocation } from '@/types';

const STORAGE_KEY = 'feelgive_tracked_locations';

export function getTrackedLocations(): TrackedLocation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveTrackedLocation(location: TrackedLocation): void {
  const locations = getTrackedLocations();
  locations.push(location);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

export function removeTrackedLocation(id: string): void {
  const locations = getTrackedLocations();
  const filtered = locations.filter(loc => loc.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  console.log('Removed location. Remaining:', filtered.length);
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