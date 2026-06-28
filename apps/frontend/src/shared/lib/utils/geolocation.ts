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
