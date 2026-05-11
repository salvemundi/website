'use server';

import { checkAdminAccess } from './activiteit-utils';
import { getActivitySignupsInternal } from "@/server/queries/admin-event.queries";

/**
 * Fetches all signups for a specific activity (Admin only).
 */
export async function getActivitySignups(eventId: string) {
    const session = await checkAdminAccess();
    if (!session) return [];
    
    try {
        return await getActivitySignupsInternal(eventId);
    } catch {
        return [];
    }
}
