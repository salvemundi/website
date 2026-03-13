'use server';

import { connection } from 'next/server';
import { documentenSchema, type Document } from '@salvemundi/validations';

// Intern Directus adres — nooit hardcoded, altijd via env
const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

// Service token voor interne Directus API-aanroepen.
const getDirectusHeaders = (): HeadersInit | null => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
        console.warn('[website.actions] DIRECTUS_STATIC_TOKEN missing. Some data might not be available.');
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

/**
 * Haalt alle documenten op uit de 'documenten' collectie in Directus.
 * Gesorteerd op display_order (oplopend).
 * Resultaat is gecached via de 'use cache' directive.
 */
export async function getDocumenten(): Promise<Document[]> {
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/documents?sort=display_order&limit=50`;

    const headers = getDirectusHeaders();
    if (!headers) {
        return [];
    }

    let res: Response;
    try {
        res = await fetch(url, {
            headers,
            // Data wordt periodiek gecached en gerevalieerd via tags
            next: { tags: ['documenten'] },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // Loggen met context zodat de fout traceerbaar is in server-logs
        console.error(`[website.actions#getDocumenten] Fetch mislukt op ${url}: ${message}`);
        return [];
    }

    if (!res.ok) {
        console.error(`[website.actions#getDocumenten] Directus fout op ${url}: ${res.status} ${res.statusText}`);
        return [];
    }

    const json = await res.json();

    // Valideer de Directus response client-side met Zod
    const parsed = documentenSchema.safeParse(json?.data ?? []);

    if (!parsed.success) {
        console.error('[website.actions#getDocumenten] Zod validatie mislukt:', {
            fieldErrors: parsed.error.flatten().fieldErrors,
        });
        return [];
    }

    return parsed.data;
}

/**
 * Haalt alle momenteel uitgeschakelde routes op uit Directus (Feature Flags).
 * Wordt gebruikt voor UI-synchronisatie (huiden van knoppen).
 * We gebruiken cache-busting en no-store om altijd de meest actuele status te hebben.
 */
export async function getDisabledRoutes(): Promise<string[]> {
    await connection();
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/feature_flags?filter[is_active][_eq]=false&fields=route_match`;

    const headers = getDirectusHeaders();
    if (!headers) {
        return [];
    }

    try {
        const res = await fetch(url, {
            headers: {
                ...headers,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return [];
        }

        const json = await res.json();
        return (json?.data ?? []).map((flag: any) => flag.route_match);
    } catch (err) {
        console.error('[website.actions#getDisabledRoutes] Fout:', err);
        return [];
    }
}
