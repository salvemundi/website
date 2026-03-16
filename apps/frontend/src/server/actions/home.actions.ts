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
const getDirectusHeaders = (): HeadersInit | null => {
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

/**
 * Helper voor Fetch met timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = 10000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// ─── Hero Banners ─────────────────────────────────────────────────────────────

export async function getHeroBanners(): Promise<HeroBanner[]> {
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/hero_banners?fields=id,title,image,sort&limit=10`;

    const headers = getDirectusHeaders();
    if (!headers) return [];

    try {
        console.log(`[home.actions#getHeroBanners] Fetching: ${url}`);
        const res = await fetchWithTimeout(url, {
            headers,
            next: { revalidate: 300, tags: ['hero_banners'] },
            timeout: 10000,
        });

        if (!res.ok) {
            console.error('[home.actions#getHeroBanners] Directus fout:', { status: res.status });
            return [];
        }

        const json = await res.json();
        const rawData = json?.data ?? [];

        const mappedData = rawData.map((item: any) => ({
            id: item.id ?? '',
            title: item.title ?? '',
            subtitle: null,
            afbeelding_id: item.image ?? null,
            status: 'published',
            display_order: item.sort ?? 0,
        }));

        const parsed = heroBannersSchema.safeParse(mappedData);
        if (!parsed.success) {
            console.error('[home.actions#getHeroBanners] Zod validatie mislukt');
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('[home.actions#getHeroBanners] Error:', err);
        return [];
    }
}

// ─── Activiteiten ─────────────────────────────────────────────────────────────

export async function getUpcomingActiviteiten(limit = 4): Promise<Activiteit[]> {
    const directusUrl = getDirectusUrl();
    const fields = 'id,name,description,location,event_date,event_date_end,image,status,price_members,price_non_members,only_members,inschrijf_deadline,contact,event_time,event_time_end';
    const url = `${directusUrl}/items/events?fields=${fields}&filter[status][_eq]=published&filter[event_date][_gte]=$NOW&sort=event_date&limit=${limit}`;

    const headers = getDirectusHeaders();
    if (!headers) return [];

    try {
        console.log(`[home.actions#getUpcomingActiviteiten] Fetching: ${url}`);
        const res = await fetchWithTimeout(url, {
            headers,
            next: { revalidate: 300, tags: ['activiteiten'] },
            timeout: 10000,
        });

        if (!res.ok) {
            console.error('[home.actions#getUpcomingActiviteiten] Directus fout:', { status: res.status });
            return [];
        }

        const json = await res.json();
        const rawData = json?.data ?? [];

        const mappedData = rawData.map((item: any) => ({
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
            return parsed.data ?? [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('[home.actions#getUpcomingActiviteiten] Error:', err);
        return [];
    }
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export async function getSponsors(): Promise<Sponsor[]> {
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/sponsors?fields=sponsor_id,image,website_url,dark_bg&sort=sponsor_id&limit=-1`;

    const headers = getDirectusHeaders();
    if (!headers) return [];

    try {
        console.log(`[home.actions#getSponsors] Fetching: ${url}`);
        const res = await fetchWithTimeout(url, {
            headers,
            next: { revalidate: 0, tags: ['sponsors'] },
            timeout: 10000,
        });

        if (!res.ok) {
            console.error('[home.actions#getSponsors] Directus fout:', { status: res.status });
            return [];
        }

        const json = await res.json();
        const parsed = sponsorsSchema.safeParse(json?.data ?? []);

        if (!parsed.success) {
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('[home.actions#getSponsors] Error:', err);
        return [];
    }
}
