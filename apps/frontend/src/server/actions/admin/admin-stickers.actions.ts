'use server';

import { revalidateTag, revalidatePath } from "next/cache";
import { logAdminAction } from "@/server/actions/infrastructure/audit.actions";
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { safeConsoleError } from '@/server/utils/logger';

import { enforceFeatureAccess } from '@/server/actions/admin/admin-utils.actions';

async function requireStickerAdmin() {
    const { user } = await enforceFeatureAccess('stickers');
    return user;
}

export async function getStickers() {
    await requireStickerAdmin();

    try {
        const rows = await db.query.Stickers.findMany({
            with: {
                directus_user_user_created: {
                    columns: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        avatar: true,
                        email: true
                    }
                }
            },
            orderBy: (stickers, { desc }) => [desc(stickers.date_created)]
        });

        return rows.map((s) => ({
            id: Number(s.id),
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
            location_name: s.location_name || '',
            status: s.status || 'draft',
            description: s.description || null,
            image: s.image || null,
            city: s.city || null,
            country: s.country || null,
            address: s.address || null,
            date_created: s.date_created ? String(s.date_created) : undefined,
            user_created: s.directus_user_user_created ? {
                id: s.directus_user_user_created.id,
                first_name: s.directus_user_user_created.first_name,
                last_name: s.directus_user_user_created.last_name,
                avatar: s.directus_user_user_created.avatar,
                email: s.directus_user_user_created.email
            } : null
        }));
    } catch (error: unknown) {
        safeConsoleError('[admin-stickers.actions.ts][getStickers] Failed to fetch stickers:', error);
        throw new Error('Could not fetch stickers');
    }
}

export async function deleteSticker(id: number) {
    await requireStickerAdmin();

    try {
        await db.delete(schema.Stickers).where(eq(schema.Stickers.id, id));
        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');

        await logAdminAction('admin_sticker_deleted', 'SUCCESS', { context: 'sticker', sticker_id: id });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[admin-stickers.actions.ts][deleteSticker] Failed to delete sticker ${id}:`, error);
        throw new Error('Could not delete sticker');
    }
}

export async function updateSticker(id: number, data: Partial<{ [key: string]: unknown }>) {
    await requireStickerAdmin();

    try {
        const updated = await db.update(schema.Stickers).set(data).where(eq(schema.Stickers.id, id)).returning();
        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        return updated[0];
    } catch (error: unknown) {
        safeConsoleError(`[admin-stickers.actions.ts][updateSticker] Failed to update sticker ${id}:`, error);
        throw new Error('Could not update sticker');
    }
}