'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";

/**
 * Access the internal Directus URL for improved performance and security
 * within the cluster/VPS environment.
 */
const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL;

/**
 * Common headers for Directus API calls, using the static service token
 * for administrative actions.
 */
const getDirectusHeaders = () => ({
    'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
    'Content-Type': 'application/json'
});

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
    
    const res = await fetch(`${getDirectusUrl()}/items/stickers?fields=*,user_created.id,user_created.first_name,user_created.last_name&sort=-date_created&limit=-1`, {
        headers: getDirectusHeaders(),
        next: { tags: ['stickers'] }
    });

    if (!res.ok) throw new Error('Kon stickers niet ophalen');
    const json = await res.json();
    return json.data || [];
}

/**
 * Deletes a sticker from the system.
 * Triggers a revalidation of the 'stickers' tag to update the admin table and public map.
 */
export async function deleteSticker(id: number) {
    await requireStickerAdmin();

    const res = await fetch(`${getDirectusUrl()}/items/stickers/${id}`, {
        method: 'DELETE',
        headers: getDirectusHeaders()
    });

    if (!res.ok) throw new Error('Kon sticker niet verwijderen');
    
    revalidateTag('stickers', 'default');
    return { success: true };
}

/**
 * Updates sticker data (e.g., status or coordinates).
 * Revalidation is required to ensure consistent state across the board.
 */
export async function updateSticker(id: number, data: any) {
    await requireStickerAdmin();

    const res = await fetch(`${getDirectusUrl()}/items/stickers/${id}`, {
        method: 'PATCH',
        headers: getDirectusHeaders(),
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Kon sticker niet bijwerken');
    
    revalidateTag('stickers', 'default');
    const json = await res.json();
    return json.data;
}

