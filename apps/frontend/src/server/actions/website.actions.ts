'use server';
 
import { connection } from 'next/server';

import { documentenSchema, type Document, DOCUMENT_FIELDS } from '@salvemundi/validations';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getDisabledRoutes, FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
export { getDisabledRoutes };

export async function getDocumenten(): Promise<Document[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('documents', {
            fields: [...DOCUMENT_FIELDS],
            sort: ['display_order'],
            limit: 50
        }));

        const parsed = documentenSchema.safeParse(rawData);

        if (!parsed.success) {
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        
        return [];
    }
}

