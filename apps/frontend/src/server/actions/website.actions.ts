'use server';
 

import { documentenSchema, type Document } from '@salvemundi/validations/schema/website.zod';
import { DOCUMENT_FIELDS } from '@salvemundi/validations/directus/fields';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getDisabledRoutes } from '@/lib/config/feature-flags';
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
    } catch {
        
        return [];
    }
}

