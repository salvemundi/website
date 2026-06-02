'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidateTag, revalidatePath } from "next/cache";

import { stickerPublicSchema } from "@salvemundi/validations";

import { query } from '@/lib/database';
import { z } from 'zod';
import { safeConsoleError } from '@/server/utils/logger';

const stickerListSchema = z.array(stickerPublicSchema);

const stickerCreateSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    location_name: z.string(),
    description: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
});

interface RawStickerDbRow {
    id: string | number;
    latitude: string | number;
    longitude: string | number;
    location_name?: string | null;
    description?: string | null;
    city?: string | null;
    country?: string | null;
    image?: string | null;
    date_created?: string | Date | null;
    status: string;
    user_created?: string | null;
    user_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    avatar?: string | null;
}

export async function getPublicStickers() {
    const session = await getEnrichedSession();
    const isLoggedIn = !!session?.user;

    const sql = `
        SELECT 
            s.*,
            u.id as user_id,
            u.first_name,
            u.last_name,
            u.avatar
        FROM "Stickers" s
        LEFT JOIN directus_users u ON s.user_created = u.id
        WHERE s.status = 'published'
        ORDER BY s.date_created DESC
    `;
    const { rows } = await query(sql);

    const mapped = (rows as RawStickerDbRow[]).map((row) => ({
        id: Number(row.id),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        location_name: row.location_name || '',
        description: row.description || '',
        city: row.city || '',
        country: row.country || '',
        image: row.image || null,
        date_created: row.date_created instanceof Date ? row.date_created.toISOString() : (row.date_created || ''),
        user_created: (isLoggedIn && row.user_id) ? {
            id: row.user_id,
            first_name: row.first_name,
            last_name: row.last_name,
            avatar: row.avatar
        } : null
    }));

    return stickerListSchema.parse(mapped);
}

export async function createStickerPublic(data: unknown) {
    const session = await getEnrichedSession();

    if (!session?.user) {
        throw new Error('Je moet ingelogd zijn om een sticker toe te voegen.');
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('sticker-create', 5, 300);
    if (!success) {
        throw new Error('Te veel stickers geplaatst. Probeer het later opnieuw.');
    }

    const parsed = stickerCreateSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige stickergegevens.' };
    }

    const payload = {
        ...parsed.data,
        status: 'published',
        user_created: session.user.id
    };

    try {
        const { getSystemDirectus } = await import("@/lib/directus");
        const { createItem } = await import("@directus/sdk");
        const result = await getSystemDirectus().request(createItem('Stickers', payload));

        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        return { success: true, data: result };
    } catch (error) {
        safeConsoleError(`[stickers.actions.ts][createStickerPublic] Error while creating sticker:`, error);
        return { success: false, error: 'Kon sticker niet opslaan.' };
    }
}

export async function uploadFileAction(formData: FormData): Promise<{ success: true; data: string } | { success: false; error: string }> {
    const session = await getEnrichedSession();
    if (!session?.user) {
        throw new Error('Niet geautoriseerd: Je moet ingelogd zijn om bestanden te uploaden.');
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('file-upload', 5, 300);
    if (!success) {
        throw new Error('Te veel bestanden geüpload. Probeer het later opnieuw.');
    }
    try {
        const { getSystemDirectus } = await import("@/lib/directus");
        const { uploadFiles } = await import("@directus/sdk");
        const directus = getSystemDirectus();
        const result = (await directus.request(uploadFiles(formData))) as unknown;
        const fileObj = Array.isArray(result) ? (result as unknown[])[0] : result;
        const fileId = (fileObj && typeof fileObj === 'object' && 'id' in fileObj) ? String((fileObj as { id: unknown }).id) : null;
        if (!fileId) {
            return { success: false, error: 'Foto upload mislukt op de server.' };
        }
        return { success: true, data: fileId };
    } catch (error) {
        safeConsoleError(`[stickers.actions.ts][uploadFileAction] Error while uploading file:`, error);
        return { success: false, error: 'Foto upload mislukt op de server.' };
    }
}
