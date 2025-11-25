import { directusFetch } from './directus';
import { Sticker } from '../types';

export interface CreateStickerData {
  location_name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  description?: string;
  country?: string;
  city?: string;
  image?: string;
}

// Get all stickers
export async function getAllStickers(): Promise<Sticker[]> {
  try {
    // Expand the user_created relation so the frontend can show who added each sticker
    const stickers = await directusFetch<Sticker[]>('/items/Stickers?fields=*,user_created.*&sort=-date_created');
    
    if (Array.isArray(stickers)) {
      return stickers;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching stickers:', error);
    return [];
  }
}

// Get single sticker by ID
export async function getStickerById(id: number): Promise<Sticker> {
  try {
  const sticker = await directusFetch<Sticker>(`/items/Stickers/${id}?fields=*,user_created.*`);
    return sticker;
  } catch (error) {
    console.error('Error fetching sticker:', error);
    throw error;
  }
}

// Create new sticker location
export async function createSticker(data: CreateStickerData, userToken?: string): Promise<Sticker> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl'}/items/Stickers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      let errorMessage = `Failed to create sticker (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && Array.isArray(errorJson.errors)) {
          errorMessage += ': ' + errorJson.errors.map((e: any) => e.message).join(', ');
        } else if (errorJson.error) {
          errorMessage += ': ' + errorJson.error.message;
        }
      } catch {
        errorMessage += ': ' + errorText;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating sticker:', error);
    throw error;
  }
}

// Delete sticker (only by creator or admin)
export async function deleteSticker(id: number, userToken: string): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl'}/items/Stickers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete sticker');
    }
  } catch (error) {
    console.error('Error deleting sticker:', error);
    throw error;
  }
}

// Get sticker stats
export interface StickerStats {
  total: number;
  countries: number;
  cities: number;
  mostRecentCity?: string;
  topCountry?: { country: string; count: number };
}

export function calculateStickerStats(stickers: Sticker[]): StickerStats {
  const uniqueCountries = new Set(stickers.filter(s => s.country).map(s => s.country));
  const uniqueCities = new Set(stickers.filter(s => s.city).map(s => s.city));
  
  // Count stickers per country
  const countryCount: Record<string, number> = {};
  stickers.forEach(sticker => {
    if (sticker.country) {
      countryCount[sticker.country] = (countryCount[sticker.country] || 0) + 1;
    }
  });

  // Find top country
  let topCountry: { country: string; count: number } | undefined;
  Object.entries(countryCount).forEach(([country, count]) => {
    if (!topCountry || count > topCountry.count) {
      topCountry = { country, count };
    }
  });

  // Get most recent city
  const mostRecent = stickers
    .filter(s => s.city)
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())[0];

  return {
    total: stickers.length,
    countries: uniqueCountries.size,
    cities: uniqueCities.size,
    mostRecentCity: mostRecent?.city,
    topCountry,
  };
}

// Geocoding function to get coordinates from address
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; display_name: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

// Reverse geocoding to get address details from coordinates
export async function reverseGeocode(lat: number, lon: number): Promise<{ 
  city?: string; 
  country?: string; 
  display_name: string;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    
    if (data) {
      return {
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
        display_name: data.display_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
