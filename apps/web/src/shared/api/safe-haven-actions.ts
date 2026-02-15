'use server';

import type { SafeHaven } from '@/shared/lib/api/types';

import { fetchDirectus, buildQuery } from '@/shared/lib/server-directus';

/**
 * Server Action to fetch Safe Havens securely using the Admin Token.
 * Bypasses client-side proxy and avoids user permission issues.
 */
export async function getSafeHavens(): Promise<SafeHaven[]> {
    try {
        const query = buildQuery({
            fields: 'id,contact_name,image,user_id',
            sort: 'contact_name',
            limit: '-1',
        });

        const list = await fetchDirectus<SafeHaven[]>(`/items/safe_havens?${query}`, 60);
        return list || [];
    } catch (error) {
        console.error('[Action: getSafeHavens] Error:', error);
        return [];
    }
}
