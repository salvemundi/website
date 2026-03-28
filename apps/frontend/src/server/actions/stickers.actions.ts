'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";

import { getSystemDirectus } from "@/lib/directus";
import { readItems, createItem, uploadFiles } from "@directus/sdk";
import { STICKER_FIELDS } from "@salvemundi/validations";

export async function getPublicStickers() {
    try {
        return await getSystemDirectus().request(readItems('Stickers', {
            fields: [...STICKER_FIELDS, { user_created: ['id', 'first_name', 'last_name', 'avatar'] }] as any,
            sort: ['-date_created'],
            limit: -1
        }));
    } catch (error) {
        console.error('[Stickers] Error fetching stickers:', error);
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
        const result = await getSystemDirectus().request(createItem('Stickers', payload));

        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        return result;
    } catch (error) {
        console.error('[Stickers] Sticker create error:', error);
        throw new Error('Kon sticker niet opslaan.');
    }
}

export async function uploadFileAction(formData: FormData) {
    const session = await auth.api.getSession({ headers: await headers() });
    
    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('file-upload', 5, 300);
    if (!success) {
        throw new Error('Te veel bestanden geüpload. Probeer het later opnieuw.');
    }
    try {
        const directus = getSystemDirectus();
        const result = await directus.request(uploadFiles(formData));
        return (result as any).id;
    } catch (error) {
        console.error('[Stickers] Photo upload failed:', error);
        throw new Error('Foto upload mislukt op de server.');
    }
}
