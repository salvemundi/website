'use server';


import { documentenSchema, type Document } from '@salvemundi/validations/schema/website.zod';
import { db } from '@salvemundi/db';
import { getDisabledRoutes } from '@/lib/config/feature-flags';
import { safeConsoleError } from '@/server/utils/logger';

export { getDisabledRoutes };


export async function getDocumenten(): Promise<Document[]> {
    try {
        const rawData = await db.query.documents.findMany({
            orderBy: (documents, { asc }) => [asc(documents.display_order)],
            limit: 50
        });

        const mappedData = rawData.map(doc => ({
            id: Number(doc.id),
            title: doc.title,
            description: doc.description,
            category: doc.category,
            file: doc.file,
            is_active: doc.is_active,
            display_order: doc.display_order,
            date_created: doc.created_at ? new Date(doc.created_at).toISOString() : null,
            date_updated: doc.updated_at ? new Date(doc.updated_at).toISOString() : null,
        }));

        const parsed = documentenSchema.safeParse(mappedData);

        if (!parsed.success) {
            safeConsoleError(`[website.actions.ts][getDocumenten] Zod validation failed:`, parsed.error);
            return [];
        }

        return parsed.data;
    } catch (error) {
        safeConsoleError(`[website.actions.ts][getDocumenten] Error while fetching documents:`, error);
        return [];
    }
}
