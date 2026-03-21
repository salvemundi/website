'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";

import { directus, directusRequest } from "@/lib/directus";
import { readItems, createItem, uploadFiles } from "@directus/sdk";

/**
 * Fetches all stickers marked as published for the public map view.
 * We include avatar and identity info to enable the leaderboard and custom markers.
 */
export async function getPublicStickers() {
    try {
        return await directusRequest<any[]>(readItems('stickers', {
            fields: ['*', { user_created: ['id', 'first_name', 'last_name', 'avatar'] }] as any,
            sort: ['-date_created'],
            limit: -1
        }));
    } catch (error) {
        console.error('[Stickers] Error fetching stickers:', error);
        return [];
    }
}

/**
 * Allows a registered and logged-in user to 'claim' a spot on the map.
 * Linking to the current user is essential for the leaderboard system.
 */
export async function createStickerPublic(data: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error('Je moet ingelogd zijn om een sticker toe te voegen.');
    }

    const payload = {
        ...data,
        user_created: session.user.id
    };

    try {
        const result = await directusRequest<any>(createItem('stickers', payload));

        // Immediately update both admin and public views.
        revalidateTag('stickers', 'default');
        return result;
    } catch (error) {
        console.error('[Stickers] Sticker create error:', error);
        throw new Error('Kon sticker niet opslaan.');
    }
}

/**
 * Uploads a file to Directus from the server.
 * This allows client components to upload files without needing DIRECTUS_STATIC_TOKEN in the browser.
 */
export async function uploadFileAction(formData: FormData) {
    try {
        const result = await directusRequest<any>(uploadFiles(formData));
        return result.id;
    } catch (error) {
        console.error('[Stickers] Photo upload failed:', error);
        throw new Error('Foto upload mislukt op de server.');
    }
}
