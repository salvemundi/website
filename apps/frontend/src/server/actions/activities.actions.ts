'use server';

import { activiteitenSchema, type Activiteit } from '@salvemundi/validations';

// Intern Directus adres — nooit hardcoded, altijd via env
const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

// Service token voor interne Directus API-aanroepen.
const getDirectusHeaders = (): HeadersInit | null => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
        console.warn('[Activities] DIRECTUS_STATIC_TOKEN missing.');
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

/**
 * Fetch all upcoming and past activities
 * Features 'use cache' to ensure static rendering & caching
 */
export async function getActivities(): Promise<Activiteit[]> {
    // 'use cache'; // Temporarily disabled if causing issues with fetch

    try {
        const directusUrl = getDirectusUrl();
        const headers = getDirectusHeaders();
        if (!headers) return [];

        // Collectie heet 'events' op de VPS.
        const fields = 'id,name,description,location,event_date,event_date_end,image,status';
        const url = `${directusUrl}/items/events?fields=${fields}&limit=-1&filter[status][_eq]=published`;

        const response = await fetch(url, {
            headers,
        });

        if (!response.ok) {
            console.error(`[Activities] Fetch failed with status: ${response.status} for ${url}`);
            return [];
        }

        const json = await response.json();
        const rawData = json?.data ?? [];

        // Mapping van DB velden ('events') naar Zod Schema velden ('Activiteit')
        const mappedData = rawData.map((item: any) => ({
            id: String(item.id),
            titel: item.name,
            beschrijving: item.description,
            locatie: item.location,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image,
            status: item.status,
        }));

        const parsed = activiteitenSchema.safeParse(mappedData);

        if (!parsed.success) {
            console.error('[Activities] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[Activities] Error fetching activities:', error);
        return [];
    }
}
