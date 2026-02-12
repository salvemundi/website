'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';

export type Document = {
    id: number;
    title: string;
    description?: string;
    file: string;
    category?: string;
    display_order?: number;
};

/**
 * Server Action to fetch all active documents.
 * This directly calls the Directus API using the service token on the server.
 */
export async function getDocumentsAction() {
    try {
        const documents = await serverDirectusFetch<Document[]>(
            '/items/documents?fields=id,title,description,file,category,display_order&filter[is_active][_eq]=true&sort=display_order,title',
            {
                ...CACHE_PRESETS.MODERATE,
                tags: [COLLECTION_TAGS.DOCUMENTS]
            }
        );
        return documents || [];
    } catch (error: any) {
        console.error('[DocumentAction] Failed to fetch documents:', error.message);
        return [];
    }
}
