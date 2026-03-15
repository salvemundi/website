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
        const fields = 'id,name,description,location,event_date,event_date_end,image,status,price_members,price_non_members,only_members,inschrijf_deadline,contact,event_time,event_time_end';
        const url = `${directusUrl}/items/events?fields=${fields}&limit=-1&filter[status][_eq]=published`;

        const response = await fetch(url, {
            headers,
        });

        if (!response.ok) {
            console.error(`[Activities] Fetch failed with status: ${response.status} for ${url}`);
            await response.text(); // Consume body to prevent hanging promises
            return [];
        }

        const json = await response.json();
        type RawEvent = {
            id?: string | number;
            name?: string | null;
            description?: string | null;
            location?: string | null;
            event_date?: string | null;
            event_date_end?: string | null;
            image?: string | null;
            status?: string | null;
            price_members?: number | string | null;
            price_non_members?: number | string | null;
            only_members?: boolean | null;
            inschrijf_deadline?: string | null;
            contact?: string | null;
            event_time?: string | null;
            event_time_end?: string | null;
        };
        const rawData: RawEvent[] = json?.data ?? [];

        // Mapping van DB velden ('events') naar Zod Schema velden ('Activiteit')
        const mappedData = rawData.map((item) => ({
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            inschrijf_deadline: item.inschrijf_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
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
