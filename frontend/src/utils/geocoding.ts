interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodePostalCode(postalCode: string, countryCode?: string): Promise<GeocodingResult | null> {
  try {
    // Build query with country code for better accuracy
    let query = `postalcode=${encodeURIComponent(postalCode)}`;
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

export function isValidPostalCode(code: string): boolean {
  // Remove spaces and convert to uppercase
  const cleaned = code.replace(/\s/g, '').toUpperCase();

  // Basic validation - just check it's not empty and has reasonable length
  // Specific format validation is hard because every country is different
  return cleaned.length >= 3 && cleaned.length <= 10;
}

// Get postal code format hint for a country
export function getPostalCodeFormat(countryCode: string): string {
  const formats: { [key: string]: string } = {
    'US': '5 digits (e.g., 90210)',
    'CA': 'A1A 1A1 format (e.g., M5H 2N2)',
    'GB': 'Various formats (e.g., SW1A 1AA)',
    'AU': '4 digits (e.g., 2000)',
    'DE': '5 digits (e.g., 10115)',
    'FR': '5 digits (e.g., 75001)',
    'IT': '5 digits (e.g., 00100)',
    'ES': '5 digits (e.g., 28001)',
    'NL': '4 digits + 2 letters (e.g., 1012 AB)',
    'BE': '4 digits (e.g., 1000)',
    'CH': '4 digits (e.g., 8001)',
    'AT': '4 digits (e.g., 1010)',
    'SE': '3 digits + space + 2 digits (e.g., 111 22)',
    'NO': '4 digits (e.g., 0001)',
    'DK': '4 digits (e.g., 1050)',
    'FI': '5 digits (e.g., 00100)',
    'PL': '5 digits with dash (e.g., 00-001)',
    'CZ': '5 digits with space (e.g., 110 00)',
    'PT': '7 digits with dash (e.g., 1000-001)',
    'IE': '3-7 characters (e.g., D01)',
    'NZ': '4 digits (e.g., 1010)',
    'JP': '7 digits with dash (e.g., 100-0001)',
    'KR': '5 digits (e.g., 03000)',
    'SG': '6 digits (e.g., 018956)',
    'IN': '6 digits (e.g., 110001)',
    'BR': '8 digits with dash (e.g., 01310-100)',
    'MX': '5 digits (e.g., 01000)',
    'AR': '4-5 characters (e.g., C1000)',
    'ZA': '4 digits (e.g., 0001)',
  };
  
  return formats[countryCode] || 'Varies by country';
}