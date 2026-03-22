'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";

/**
 * Access the internal Directus URL for improved performance and security
 * within the cluster/VPS environment.
 */
import { getSystemDirectus } from "@/lib/directus";
import { readItems, deleteItem, updateItem } from "@directus/sdk";

/**
 * Ensures the user is logged in and belongs to a committee with administrative 
 * access to sticker moderation (ICT or Bestuur).
 */
async function requireStickerAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) throw new Error('Niet ingelogd');

    const committees = (session.user as any).committees || [];
    const isAdmin = committees.some((c: any) => 
        ['ict', 'bestuur'].some(role => (c.name || '').toLowerCase().includes(role))
    );

    if (!isAdmin) throw new Error('Geen beheer rechten');
    
    return session.user;
}

/**
 * Fetches all stickers for moderation, including creator details.
 * We fetch all stickers (-1 limit) as the total volume is currently manageable.
 */
export async function getStickers() {
    await requireStickerAdmin();
    
    try {
        const stickers = await getSystemDirectus().request(readItems('stickers', {
            fields: ['id', 'name', 'date_created', { user_created: ['id', 'first_name', 'last_name'] }],
            sort: ['-date_created'],
            limit: -1
        }));
        return stickers || [];
    } catch (e) {
        console.error('[AdminStickers] Fetch failed:', e);
        throw new Error('Kon stickers niet ophalen');
    }
}

/**
 * Deletes a sticker from the system.
 * Triggers a revalidation of the 'stickers' tag to update the admin table and public map.
 */
export async function deleteSticker(id: number) {
    const session = await requireStickerAdmin();

    try {
        await getUserDirectus((session as any).session?.token).request(deleteItem('stickers', id));
        revalidateTag('stickers', 'default');
        return { success: true };
    } catch (e) {
        console.error('[AdminStickers] Delete failed:', e);
        throw new Error('Kon sticker niet verwijderen');
    }
}

/**
 * Updates sticker data (e.g., status or coordinates).
 * Revalidation is required to ensure consistent state across the board.
 */
export async function updateSticker(id: number, data: any) {
    const session = await requireStickerAdmin();

    try {
        const updated = await getUserDirectus((session as any).session?.token).request(updateItem('stickers', id, data));
        revalidateTag('stickers', 'default');
        return updated;
    } catch (e) {
        console.error('[AdminStickers] Update failed:', e);
        throw new Error('Kon sticker niet bijwerken');
    }
}

