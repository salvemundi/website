'use server';

import { connection } from 'next/server';
import { documentenSchema, type Document } from '@salvemundi/validations';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * Haalt alle documenten op uit de 'documenten' collectie in Directus.
 * Gesorteerd op display_order (oplopend).
 * Resultaat is gecached via de 'use cache' directive.
 */
export async function getDocumenten(): Promise<Document[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('documents', {
            fields: ['id', 'title', 'file', 'category', 'display_order'],
            sort: ['display_order'],
            limit: 50
        }));

        // Valideer de Directus response met Zod
        const parsed = documentenSchema.safeParse(rawData);

        if (!parsed.success) {
            console.error('[website.actions#getDocumenten] Zod validatie mislukt:', {
                fieldErrors: parsed.error.flatten().fieldErrors,
            });
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error(`[website.actions#getDocumenten] Fetch mislukt:`, err);
        return [];
    }
}

/**
 * Haalt alle momenteel uitgeschakelde routes op uit Directus (Feature Flags).
 * Wordt gebruikt voor UI-synchronisatie (huiden van knoppen).
 * We gebruiken cache-busting en no-store om altijd de meest actuele status te hebben.
 */
export async function getDisabledRoutes(): Promise<string[]> {
    await connection();
    try {
        const result = await getSystemDirectus().request(readItems('feature_flags', {
            filter: { is_active: { _eq: false } },
            fields: ['route_match']
        }));

        return result
            .map((flag: any) => flag.route_match)
            .filter((route: string | null | undefined): route is string => Boolean(route));
    } catch (err) {
        console.error('[website.actions#getDisabledRoutes] Fout:', err);
        return [];
    }
}
