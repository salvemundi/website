'use server';

import { safeHavensSchema, type SafeHaven } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

// Intern Directus adres — nooit hardcoded, altijd via env
const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

/**
 * Helper voor Directus headers met de Service Token.
 */
const getDirectusHeaders = (): HeadersInit | null => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
        console.warn('[safe-haven.actions] DIRECTUS_STATIC_TOKEN is missing.');
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

/**
 * Interne helper die de data uit Directus ophaalt.
 * Deze functie is volledig statisch voor de cache en mag GEEN dynamic metadata (headers, cookies) bevatten.
 */
async function fetchSafeHavensFromDirectus(): Promise<SafeHaven[]> {
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/safe_havens?limit=50`;

    let res: Response;
    try {
        const headersInit = getDirectusHeaders();
        if (!headersInit) {
            return [];
        }
        res = await fetch(url, {
            headers: headersInit,
            next: { tags: ['safe_havens'] },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[safe-haven.actions#fetchSafeHavensFromDirectus] Fetch mislukt:', { url, message });
        return [];
    }

    if (!res.ok) {
        console.error('[safe-haven.actions#fetchSafeHavensFromDirectus] Directus fout:', {
            url,
            status: res.status,
        });
        return [];
    }

    const json = await res.json();
    type RawSafeHaven = {
        id?: string | number;
        contact_name?: string | null;
        email?: string | null;
        phone_number?: string | null;
        image?: string | null;
        sort?: number | null;
    };
    const rawData: RawSafeHaven[] = json?.data ?? [];

    // Mapping van DB velden naar Zod Schema velden
    const mappedData = rawData.map((item) => ({
        id: item.id ?? '',
        naam: item.contact_name ?? '',
        email: item.email ?? null,
        telefoon: item.phone_number ?? null,
        beschrijving: null, // Beschrijving ontbreekt in huidige DB
        afbeelding_id: item.image ?? null,
        status: 'published',
        sort: item.sort ?? 0,
    }));

    const parsed = safeHavensSchema.safeParse(mappedData);
    if (!parsed.success) {
        console.error('[safe-haven.actions#fetchSafeHavensFromDirectus] Zod validatie mislukt:', {
            fieldErrors: parsed.error.flatten().fieldErrors,
        });
        return [];
    }

    return parsed.data;
}

/**
 * Haalt alle vertrouwenspersonen (safe_havens) op uit Directus.
 * 
 * Beveiligingslogica conform V7:
 * - Gebruikt fetchSafeHavensFromDirectus via 'use cache' voor de data-opslag.
 * - Controleert de Better Auth sessie op de server (DYNAMIC).
 * - Filtert email en telefoon weg indien de bezoeker niet is ingelogd.
 */
export async function getSafeHavens(): Promise<SafeHaven[]> {
    // 1. Controleer authenticatie op de server (Dynamic — buiten 'use cache')
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const isAuthenticated = !!session;

    // 2. Haal de gecachte data op
    const allHavens = await fetchSafeHavensFromDirectus();

    // 3. Server-side filtering van gevoelige gegevens (email/telefoon) voor niet-leden
    return allHavens.map((haven) => ({
        ...haven,
        email: isAuthenticated ? haven.email : null,
        telefoon: isAuthenticated ? haven.telefoon : null,
    }));
}
