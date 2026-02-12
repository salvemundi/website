'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';
import { revalidatePath } from 'next/cache';

export type CreateStickerData = {
    latitude: number;
    longitude: number;
    location_name: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    image?: string;
};

export type Sticker = {
    id: number;
    latitude: number;
    longitude: number;
    location_name: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    image?: any;
    is_active: boolean;
    date_created: string;
    user_created?: any;
    created_by?: any;
};

/**
 * Server Action to fetch all stickers.
 */
export async function getStickersAction() {
    try {
        const stickers = await serverDirectusFetch<Sticker[]>(
            '/items/Stickers?fields=*,user_created.*,created_by.*&sort=-date_created',
            {
                ...CACHE_PRESETS.MODERATE,
                tags: [COLLECTION_TAGS.STICKERS]
            }
        );
        return stickers || [];
    } catch (error: any) {
        console.error('[StickerAction] Failed to fetch stickers:', error.message);
        return [];
    }
}

/**
 * Server Action to create a new sticker location.
 */
export async function createStickerAction(data: CreateStickerData) {
    try {
        const result = await serverDirectusFetch<Sticker>(
            '/items/stickers',
            {
                method: 'POST',
                body: JSON.stringify(data),
                revalidate: 0
            }
        );

        // Revalidate the stickers tag to update the map/list
        revalidatePath('/stickers');

        return { success: true, data: result };
    } catch (error: any) {
        console.error('[StickerAction] Failed to create sticker:', error.message);
        return { success: false, error: error.message || 'Kon stickerlocatie niet opslaan.' };
    }
}
