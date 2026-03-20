'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";

/**
 * Publicly accessible stickers should use the internal URL when called from the server
 * to minimize latency and bypass external firewalls.
 */
const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

/**
 * Access tokens are managed via environment variables to keep our API calls 
 * authenticated without exposing credentials to the client.
 */
const getDirectusHeaders = () => ({
    'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
    'Content-Type': 'application/json'
});

/**
 * Fetches all stickers marked as published for the public map view.
 * We include avatar and identity info to enable the leaderboard and custom markers.
 */
export async function getPublicStickers() {
    const res = await fetch(`${getDirectusUrl()}/items/stickers?fields=*,user_created.id,user_created.first_name,user_created.last_name,user_created.avatar&sort=-date_created&limit=-1`, {
        headers: getDirectusHeaders(),
        next: { tags: ['stickers'] }
    });

    if (!res.ok) throw new Error('Kon stickers niet ophalen');
    const json = await res.json();
    return json.data || [];
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

    /**
     * We explicitly set user_created because we are using a static service token 
     * which would otherwise attribute all stickers to the service account itself.
     */
    const payload = {
        ...data,
        user_created: session.user.id
    };

    const res = await fetch(`${getDirectusUrl()}/items/stickers`, {
        method: 'POST',
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json();
        console.error('Sticker create error:', err);
        throw new Error('Kon sticker niet opslaan.');
    }

    // Immediately update both admin and public views.
    revalidateTag('stickers', 'default');
    const json = await res.json();
    return json.data;
}
