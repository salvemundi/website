'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { logAdminAction } from "./audit.actions";
import { isSuperAdmin } from "@/lib/auth";
import { type Committee } from "@/shared/lib/permissions";

import { getSystemDirectus } from "@/lib/directus";
import { readItems, deleteItem, updateItem } from "@directus/sdk";
import { STICKER_FIELDS } from "@salvemundi/validations";

import { type EnrichedUser } from "@/types/auth";

async function requireStickerAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) throw new Error('Niet ingelogd');

    const user = session.user as unknown as EnrichedUser;
    if (!isSuperAdmin(user.committees)) {
        throw new Error('Geen beheer rechten: SuperAdmin vereist');
    }
    
    return session.user as unknown as EnrichedUser;
}

import { query } from '@/lib/database';

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
        const { rows } = await query(sql);
        
        return rows.map((s) => ({
            ...s,
            id: Number(s.id),
            user_created: s.user_id ? {
                id: s.user_id,
                first_name: s.first_name,
                last_name: s.last_name,
                avatar: s.avatar
            } : null
        }));
    } catch (e: unknown) {
        console.error('[AdminStickers] Failed to fetch stickers:', e);
        throw new Error('Could not fetch stickers');
    }
}

export async function deleteSticker(id: number) {
    const session = await requireStickerAdmin();

    try {
        await getSystemDirectus().request(deleteItem('Stickers', id));
        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        
        await logAdminAction('sticker_deleted', 'SUCCESS', { sticker_id: id });

        return { success: true };
    } catch (error: unknown) {
        
        throw new Error('Could not delete sticker');
    }
}

export async function updateSticker(id: number, data: Partial<Record<string, unknown>>) {
    const session = await requireStickerAdmin();

    try {
        const updated = await getSystemDirectus().request(updateItem('Stickers', id, data));
        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        return updated;
    } catch (e: unknown) {
        
        throw new Error('Could not update sticker');
    }
}

