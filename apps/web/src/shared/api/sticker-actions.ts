'use server';

import { serverDirectusFetch, mutateDirectus, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { z } from 'zod';

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

// Strict Zod Validation Schema for CreateStickerData
const createStickerSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    location_name: z.string().min(1, 'Naam van locatie is verplicht.'),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    image: z.string().optional()
});

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
        // Secure Auth Guard enforcing real user context
        const user = await getCurrentUserAction();
        if (!user || !user.id) {
            return { success: false, error: 'Je moet ingelogd zijn om een sticker toe te voegen.' };
        }

        // Validate payload using explicit schema
        const validatedData = createStickerSchema.parse(data);

        // Mutate securely binding user_created to the authenticated identifier
        const payload = {
            ...validatedData,
            user_created: user.id
        };

        const result = await mutateDirectus<Sticker>(
            '/items/stickers',
            'POST',
            payload
        );

        // Revalidate the stickers tag to update the map/list
        revalidatePath('/stickers');

        return { success: true, data: result };
    } catch (error: any) {
        console.error('[StickerAction] Failed to create sticker:', error.message);
        if (error instanceof z.ZodError) {
            return { success: false, error: (error as any).errors.map((e: any) => e.message).join(', ') };
        }
        return { success: false, error: error.message || 'Kon stickerlocatie niet opslaan.' };
    }
}
