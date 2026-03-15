'use server';

import {
    heroBannersSchema,
    activiteitenSchema,
    sponsorsSchema,
    type HeroBanner,
    type Activiteit,
    type Sponsor,
} from '@salvemundi/validations';

// Intern Directus adres — nooit hardcoded, altijd via env
const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

// Service token voor interne Directus API-aanroepen.
// Public role is leeg — ALLE collecties vereisen authenticatie (Zero-Trust).
const getDirectusHeaders = (): HeadersInit | null => {
    // DIRECTUS_STATIC_TOKEN: statische API-token van de V7 Service User
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
        console.warn('[home.actions] DIRECTUS_STATIC_TOKEN missing. Some data might not be available.');
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

// ─── Hero Banners ─────────────────────────────────────────────────────────────

/**
 * Haalt alle hero-banners op uit Directus en mapt deze naar het HeroBanner type.
 */
export async function getHeroBanners(): Promise<HeroBanner[]> {
    const directusUrl = getDirectusUrl();
    // Vraag alleen noodzakelijke velden op die in de DB bestaan
    const url = `${directusUrl}/items/hero_banners?fields=id,title,image,sort&limit=10`;

    const headers = getDirectusHeaders();
    if (!headers) {
        return [];
    }

    let res: Response;
    try {
        res = await fetch(url, {
            headers,
            next: { revalidate: 300, tags: ['hero_banners'] },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[home.actions#getHeroBanners] Fetch mislukt:', { url, message });
        return [];
    }

    if (!res.ok) {
        console.error('[home.actions#getHeroBanners] Directus fout:', {
            url,
            status: res.status,
            statusText: res.statusText,
        });
        return [];
    }

    const json = await res.json();
    type RawHeroBanner = {
        id?: string | number;
        title?: string | null;
        image?: string | null;
        sort?: number | null;
    };
    const rawData: RawHeroBanner[] = json?.data ?? [];

    // Mapping van DB velden naar Zod Schema velden
    const mappedData = rawData.map((item) => ({
        id: item.id ?? '',
        title: item.title ?? '',
        subtitle: null, // Subtitle ontbreekt in huidige DB
        afbeelding_id: item.image ?? null,
        status: 'published', // Status ontbreekt in huidige DB, we nemen aan published
        display_order: item.sort ?? 0,
    }));

    const parsed = heroBannersSchema.safeParse(mappedData);

    if (!parsed.success) {
        console.error('[home.actions#getHeroBanners] Zod validatie mislukt:', {
            fieldErrors: parsed.error.flatten().fieldErrors,
        });
        return [];
    }

    return parsed.data;
}

// ─── Activiteiten ─────────────────────────────────────────────────────────────

/**
 * Haalt de eerstvolgende gepubliceerde evenementen op (gemapt van 'events' collectie).
 */
export async function getUpcomingActiviteiten(limit = 4): Promise<Activiteit[]> {
    const directusUrl = getDirectusUrl();
    // Collectie op VPS heet 'events'. Vraag alleen op wat nodig is.
    const fields = 'id,name,description,location,event_date,event_date_end,image,status,price_members,price_non_members,only_members,inschrijf_deadline,contact,event_time,event_time_end';
    const url = `${directusUrl}/items/events?fields=${fields}&filter[status][_eq]=published&filter[event_date][_gte]=$NOW&sort=event_date&limit=${limit}`;

    const headers = getDirectusHeaders();
    if (!headers) {
        return [];
    }

    let res: Response;
    try {
        res = await fetch(url, {
            headers,
            next: { revalidate: 300, tags: ['activiteiten'] },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[home.actions#getUpcomingActiviteiten] Fetch mislukt:', { url, message });
        return [];
    }

    if (!res.ok) {
        console.error('[home.actions#getUpcomingActiviteiten] Directus fout:', {
            url,
            status: res.status,
            statusText: res.statusText,
        });
        return [];
    }

    const json = await res.json();
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
        id: String(item.id ?? ''), // Zod verwacht string (uuid-formaat), VPS id's zijn op dit moment nog numbers
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
        console.error('[home.actions#getUpcomingActiviteiten] Zod validatie mislukt:', {
            fieldErrors: parsed.error.flatten().fieldErrors,
        });
        return parsed.data ?? []; // Return data we hebben, of leeg als het echt stuk is
    }

    return parsed.data;
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

/**
 * Haalt alle sponsors op uit Directus via de interne service-URL.
 * Vervangt de legacy /api/public-sponsors route-handler volledig.
 * revalidate: 0 zodat sponsor-wijzigingen in Directus direct zichtbaar zijn.
 */
export async function getSponsors(): Promise<Sponsor[]> {
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/sponsors?fields=sponsor_id,image,website_url,dark_bg&sort=sponsor_id&limit=-1`;

    const headers = getDirectusHeaders();
    if (!headers) {
        return [];
    }

    let res: Response;
    try {
        res = await fetch(url, {
            headers,
            next: { revalidate: 0, tags: ['sponsors'] },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[home.actions#getSponsors] Fetch mislukt:', { url, message });
        return [];
    }

    if (!res.ok) {
        console.error('[home.actions#getSponsors] Directus fout:', {
            url,
            status: res.status,
            statusText: res.statusText,
        });
        return [];
    }

    const json = await res.json();
    const parsed = sponsorsSchema.safeParse(json?.data ?? []);

    if (!parsed.success) {
        console.error('[home.actions#getSponsors] Zod validatie mislukt:', {
            fieldErrors: parsed.error.flatten().fieldErrors,
        });
        return [];
    }

    return parsed.data;
}
