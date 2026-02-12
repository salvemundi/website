'use server';

import { SafeHaven } from '@/shared/lib/api/salvemundi';

const DIRECTUS_URL = process.env.INTERNAL_DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

/**
 * Server Action to fetch Safe Havens securely using the Admin Token.
 * Bypasses client-side proxy and avoids user permission issues.
 */
export async function getSafeHavens(): Promise<SafeHaven[]> {
    if (!DIRECTUS_URL || !ADMIN_TOKEN) {
        console.error('[Action: getSafeHavens] Missing env vars');
        return [];
    }

    try {
        const query = new URLSearchParams({
            fields: 'id,contact_name,image,user_id',
            sort: 'contact_name',
            limit: '-1',
        });

        // Use the remote Directus URL directly
        const endpoint = `${DIRECTUS_URL}/items/safe_havens?${query.toString()}`;
        console.log(`[Action: getSafeHavens] Fetching from ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json',
            },
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!response.ok) {
            console.error(`[Action: getSafeHavens] Failed: ${response.status} ${response.statusText}`);
            return [];
        }

        const json = await response.json();
        return json.data || [];
    } catch (error) {
        console.error('[Action: getSafeHavens] Error:', error);
        return [];
    }
}
