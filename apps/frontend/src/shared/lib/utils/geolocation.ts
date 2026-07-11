export interface NominatimAddress {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    country?: string;
}

export interface NominatimResponse {
    address?: NominatimAddress;
}

export interface LocationSearchResult {
    lat: number;
    lng: number;
    displayName: string;
    city: string;
    country: string;
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query.trim()) return [];

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=nl&q=${encodeURIComponent(query)}`,
            { headers: { 'User-Agent': 'SalveMundi-Website' } }
        );

        if (!response.ok) return [];

        const items = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string; address?: NominatimAddress }>;

        return items
            .map((item) => {
                const addr = item.address || {};
                return {
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    displayName: item.display_name || '',
                    city: addr.city || addr.town || addr.village || addr.suburb || '',
                    country: addr.country || ''
                };
            })
            .filter((item) => !Number.isNaN(item.lat) && !Number.isNaN(item.lng));
    } catch {
        return [];
    }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; country: string }> {
    let city = '';
    let country = '';

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=nl`,
            { headers: { 'User-Agent': 'SalveMundi-Website' } }
        );
        
        if (response.ok) {
            const geoData = (await response.json()) as NominatimResponse;
            const addr = geoData.address || {};
            city = addr.city || addr.town || addr.village || addr.suburb || '';
            country = addr.country || '';
        }
    } catch {
        // Silently ignore geocoding errors to allow fallback to manual input
    }

    return { city, country };
}
