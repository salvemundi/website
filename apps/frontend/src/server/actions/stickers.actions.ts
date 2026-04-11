'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";

import { query } from "@/lib/database";

export async function getPublicStickers() {
    try {
        const { rows } = await query(
            `SELECT s.*, u.id as user_id, u.first_name, u.last_name, u.avatar
             FROM Stickers s
             LEFT JOIN directus_users u ON s.user_created = u.id
             ORDER BY s.date_created DESC`,
            []
        );

        return (rows || []).map(row => ({
            ...row,
            user_created: row.user_id ? {
                id: row.user_id,
                first_name: row.first_name,
                last_name: row.last_name,
                avatar: row.avatar
            } : null
        }));
    } catch (error) {
        
        return [];
    }
}

export async function createStickerPublic(data: any) {
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
