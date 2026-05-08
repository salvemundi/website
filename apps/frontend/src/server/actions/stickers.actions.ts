'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";

import { getSystemDirectus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import { STICKER_FIELDS, stickerPublicSchema } from "@salvemundi/validations";

import { query } from '@/lib/database';
import { z } from 'zod';

import { cacheLife, cacheTag } from 'next/cache';

const stickerListSchema = z.array(stickerPublicSchema);

export async function getPublicStickers() {
    'use cache';
    cacheLife('max');
    cacheTag('stickers');
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

    const mapped = rows.map((row) => ({
        ...row,
        id: Number(row.id),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        date_created: row.date_created instanceof Date ? row.date_created.toISOString() : row.date_created,
        user_created: row.user_id ? {
            id: row.user_id,
            first_name: row.first_name,
            last_name: row.last_name,
            avatar: row.avatar
        } : null
    }));

    // Validate and clean data before sending to the client
    return stickerListSchema.parse(mapped);
}

export async function createStickerPublic(data: Record<string, unknown>) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error('Je moet ingelogd zijn om een sticker toe te voegen.');
    }

    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('sticker-create', 5, 300);
    if (!success) {
        throw new Error('Te veel stickers geplaatst. Probeer het later opnieuw.');
    }

    const payload = {
        ...data,
        user_created: session.user.id
    };

    try {
        const { getSystemDirectus } = await import("@/lib/directus");
        const { createItem } = await import("@directus/sdk");
        const result = await getSystemDirectus().request(createItem('Stickers', payload));

        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        return result;
    } catch (error) {
        
        throw new Error('Kon sticker niet opslaan.');
    }
}

export async function uploadFileAction(formData: FormData) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        throw new Error('Niet geautoriseerd: Je moet ingelogd zijn om bestanden te uploaden.');
    }
    
    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('file-upload', 5, 300);
    if (!success) {
        throw new Error('Te veel bestanden geüpload. Probeer het later opnieuw.');
    }
    try {
        const { getSystemDirectus } = await import("@/lib/directus");
        const { uploadFiles } = await import("@directus/sdk");
        const directus = getSystemDirectus();
        const result = await directus.request(uploadFiles(formData));
        const fileObj = Array.isArray(result) ? result[0] : result;
        return fileObj?.id || null;
    } catch (error) {
        
        throw new Error('Foto upload mislukt op de server.');
    }
}
