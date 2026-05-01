import 'server-only';
import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { isSuperAdmin } from "@/lib/auth";

export const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
export const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

import { type EnrichedUser } from "@/types/auth";

export async function checkSyncAccess(targetId?: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as unknown as EnrichedUser;
    
    // Allow if SuperAdmin OR if it's the user's own ID/EntraID
    const isOwner = targetId && (user.id === targetId || user.entra_id === targetId);
    if (isSuperAdmin(user.committees) || isOwner) {
        return user;
    }
    
    return null;
}
