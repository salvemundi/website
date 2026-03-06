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
 * Haalt alle gepubliceerde hero-banners op uit Directus via de interne service-URL.
 * Resultaat 5 minuten gecached en chirurgisch invalideerbaar via 'hero_banners' tag.
 */
export async function getHeroBanners(): Promise<HeroBanner[]> {

    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/hero_banners?filter[status][_eq]=published&sort=display_order&limit=10`;

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
    const parsed = heroBannersSchema.safeParse(json?.data ?? []);

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
 * Haalt de eerstvolgende gepubliceerde activiteiten op uit Directus.
 * Gesorteerd op datum_start (oplopend), standaard maximaal 4 resultaten.
 * Gecached en invalideerbaar via 'activiteiten' tag na mutaties.
 */
export async function getUpcomingActiviteiten(limit = 4): Promise<Activiteit[]> {

    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/activiteiten?filter[status][_eq]=published&sort=datum_start&limit=${limit}`;

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
    const parsed = activiteitenSchema.safeParse(json?.data ?? []);

    if (!parsed.success) {
        console.error('[home.actions#getUpcomingActiviteiten] Zod validatie mislukt:', {
            fieldErrors: parsed.error.flatten().fieldErrors,
        });
        return [];
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
