import 'server-only';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { canAccess } from "@/shared/lib/permissions";

export const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
export const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();


export async function checkSyncAccess(targetId?: string) {
    const session = await getEnrichedSession();
    if (!session) return null;
    
    const user = session.user;
    
    const isOwner = targetId && (user.id === targetId || user.entra_id === targetId);
    if (canAccess(user.committees, 'sync') || isOwner) {
        return user;
    }
    
    return null;
}
