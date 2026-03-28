'use server';
 
import { connection } from 'next/server';

import { documentenSchema, type Document, DOCUMENT_FIELDS, FEATURE_FLAG_FIELDS } from '@salvemundi/validations';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function getDocumenten(): Promise<Document[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('documents', {
            fields: [...DOCUMENT_FIELDS],
            sort: ['display_order'],
            limit: 50
        }));

        const parsed = documentenSchema.safeParse(rawData);

        if (!parsed.success) {
            console.error('[website.actions#getDocumenten] Zod validation failed:', {
                fieldErrors: parsed.error.flatten().fieldErrors,
            });
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error(`[website.actions#getDocumenten] Fetch failed:`, err);
        return [];
    }
}

export async function getDisabledRoutes(): Promise<string[]> {
    await connection();
    try {
        const result = await getSystemDirectus().request(readItems('feature_flags', {
            filter: { is_active: { _eq: false } },
            fields: [...FEATURE_FLAG_FIELDS]
        }));

        return result
            .map((flag: any) => flag.route_match)
            .filter((route: string | null | undefined): route is string => Boolean(route));
    } catch (err) {
        console.error('[website.actions#getDisabledRoutes] Error:', err);
        return [];
    }
}
