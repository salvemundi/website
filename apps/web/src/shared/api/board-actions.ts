'use server';

import { fetchDirectus, buildQuery } from '@/shared/lib/server-directus';

/**
 * Server Action to fetch Board history securely using the Admin Token.
 * Bypasses client-side proxy and avoids user permission issues with the Board collection.
 */
export async function getBoards(): Promise<any[]> {
    console.log('[Action: getBoards] Starting fetch...');
    try {
        // Start with a simpler query to verify basic connectivity and collection existence
        const query = buildQuery({
            fields: 'id,naam,image,year,members.functie,members.name,members.user_id.first_name,members.user_id.last_name,members.user_id.avatar',
            sort: '-year',
            limit: '-1',
        });

        const url = `/items/Board?${query}`;
        console.log('[Action: getBoards] Fetching from:', url);

        const list = await fetchDirectus<any[]>(url, 300);

        if (!list) {
            console.log('[Action: getBoards] Received null or undefined');
            return [];
        }

        console.log('[Action: getBoards] Result count:', Array.isArray(list) ? list.length : 'not an array');
        if (Array.isArray(list) && list.length > 0) {
            console.log('[Action: getBoards] Sample item:', JSON.stringify(list[0]).substring(0, 100));
        }

        return Array.isArray(list) ? list : [];
    } catch (error) {
        console.error('[Action: getBoards] FAILED:', error);
        return [];
    }
}
