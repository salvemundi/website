'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidateTag, revalidatePath } from "next/cache";
import { logAdminAction } from "@/server/actions/infrastructure/audit.actions";
import { isSuperAdmin } from "@/lib/auth";
import { getSystemDirectus } from "@/lib/directus";
import { deleteItem, updateItem } from "@directus/sdk";
import { type EnrichedUser } from "@/types/auth";
import { query } from '@/lib/database';
import { safeConsoleError } from '@/server/utils/logger';

interface DbStickerRow {
    id: string | number;
    latitude: string | number;
    longitude: string | number;
    location_name: string | null;
    status: string | null;
    description: string | null;
    image: string | null;
    city: string | null;
    country: string | null;
    address: string | null;
    date_created: string | Date;
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
}

async function requireStickerAdmin() {
    const session = await getEnrichedSession();

    if (!session?.user) throw new Error('Niet ingelogd');

    const user = session.user as unknown as EnrichedUser;
    if (!isSuperAdmin(user.committees)) {
        throw new Error('Geen rechten om stickers te beheren');
    }

    return session.user as unknown as EnrichedUser;
}

export async function getStickers() {
    await requireStickerAdmin();

    try {
        const sql = `
            SELECT 
                s.*,
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.avatar
            FROM "Stickers" s
            LEFT JOIN directus_users u ON s.user_created = u.id
            ORDER BY s.date_created DESC
        `;
        const { rows } = await query<DbStickerRow>(sql);

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
            date_created: s.date_created instanceof Date ? s.date_created.toISOString() : s.date_created,
            user_created: s.user_id ? {
                id: s.user_id,
                first_name: s.first_name,
                last_name: s.last_name,
                avatar: s.avatar
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
        await getSystemDirectus().request(deleteItem('Stickers', id));
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
        const updated = await getSystemDirectus().request(updateItem('Stickers', id, data));
        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        return updated;
    } catch (error: unknown) {
        safeConsoleError(`[admin-stickers.actions.ts][updateSticker] Failed to update sticker ${id}:`, error);
        throw new Error('Could not update sticker');
    }
}