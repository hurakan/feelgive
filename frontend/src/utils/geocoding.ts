interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeCity(city: string, state?: string, countryCode?: string): Promise<GeocodingResult | null> {
  try {
    // Build query with city, state (if provided), and country
    let query = `city=${encodeURIComponent(city)}`;
    
    if (state) {
      query += `&state=${encodeURIComponent(state)}`;
    }
    
    if (countryCode) {
      query += `&countrycodes=${countryCode.toLowerCase()}`;
    }

    // Using OpenStreetMap Nominatim API (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${query}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'FeelGive/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export function isValidCity(city: string): boolean {
  // Basic validation - just check it's not empty and has reasonable length
  const cleaned = city.trim();
  return cleaned.length >= 2 && cleaned.length <= 100;
}