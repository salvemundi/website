import { Sticker, StickerStats } from './types';

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
