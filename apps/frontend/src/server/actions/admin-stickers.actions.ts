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

async function requireStickerAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) throw new Error('Niet ingelogd');

    const user = session.user as { committees?: Committee[] };
    if (!isSuperAdmin(user.committees)) {
        throw new Error('Geen beheer rechten: SuperAdmin vereist');
    }
    
    return session.user;
}

export async function getStickers() {
    await requireStickerAdmin();
    
    try {
        const stickers = await getSystemDirectus().request(readItems('Stickers', {
            fields: [
                ...STICKER_FIELDS, 
                { user_created: ['id', 'first_name', 'last_name', 'avatar'] }
            ] as unknown as any[],
            sort: ['-date_created'],
            limit: -1
        }));
        return (stickers as Record<string, unknown>[] ?? []).map((s) => ({
            ...s,
            id: Number(s.id)
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
    } catch (error) {
        
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
    } catch (e) {
        
        throw new Error('Could not update sticker');
    }
}

