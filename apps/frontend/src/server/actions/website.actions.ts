'use server';

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
    const url = `${directusUrl}/items/documenten?sort=display_order&limit=50`;

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
