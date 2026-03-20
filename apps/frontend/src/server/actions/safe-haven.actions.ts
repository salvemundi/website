'use server';

import { safeHavensSchema, type SafeHaven } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * Interne helper die de data uit Directus ophaalt.
 * Deze functie is volledig statisch voor de cache en mag GEEN dynamic metadata (headers, cookies) bevatten.
 */
async function fetchSafeHavensFromDirectus(): Promise<SafeHaven[]> {
    try {
        const rawData = await directus.request(readItems('safe_havens', {
            limit: 50
        }));

        // Mapping van DB velden naar Zod Schema velden
        const mappedData = rawData.map((item: any) => ({
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
    } catch (err: unknown) {
        console.error('[safe-haven.actions#fetchSafeHavensFromDirectus] Fetch mislukt:', err);
        return [];
    }
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
