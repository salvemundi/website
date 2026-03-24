'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/auth-utils";
import { getSystemDirectus } from "@/lib/directus";
import { readUsers } from "@directus/sdk";

const AZURE_SYNC_URL = "http://100.77.182.130:3002";
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function checkSyncAccess(targetId?: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    
    // Allow if SuperAdmin OR if it's the user's own ID/EntraID
    const isOwner = targetId && (user.id === targetId || user.entra_id === targetId);
    if (isSuperAdmin(user.committees) || isOwner) {
        return user;
    }
    
    return null;
}

/**
 * Triggers a full synchronization job in the Azure Sync Service.
 */
export async function triggerFullSyncAction(options?: { fields: string[]; forceLink?: boolean; activeOnly?: boolean }) {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options || { fields: [] })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Sync service onbeschikbaar' }));
            console.error("[AzureSyncAction] Service error:", errorData);
            return { success: false, error: "De synchronisatie service is momenteel niet bereikbaar." };
        }

        return { success: true, message: "Synchronisatie taak succesvol gestart." };
    } catch (err) {
        console.error("[AzureSyncAction] Full sync error:", err);
        return { success: false, error: "Kon geen verbinding maken met de sync service." };
    }
}

/**
 * Triggers a targeted synchronization for a specific user.
 */
export async function triggerUserSyncAction(userId: string) {
    const admin = await checkSyncAccess(userId);
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!userId) return { success: false, error: "Geen User ID opgegeven." };
    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    try {
        // Fetch the user from Directus by Entra ID (Strictly)
        const users = await getSystemDirectus().request(readUsers({
            filter: { entra_id: { _eq: userId } },
            fields: ['entra_id', 'email']
        }));
        
        const targetUser = users?.[0];
        const entraId = targetUser?.entra_id;
        
        if (!entraId) {
            return { 
                success: false, 
                error: `Kon geen Entra ID vinden voor gebruiker ${targetUser?.email || userId}. Zorg dat de identifier correct is ingevuld in Directus.` 
            };
        }

        // Validate Entra ID format (must be UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(entraId)) {
            return { 
                success: false, 
                error: `De Entra ID "${entraId}" voor deze gebruiker is ongeldig (geen UUID). De sync is afgebroken om fouten te voorkomen.` 
            };
        }

        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(entraId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Sync service onbeschikbaar' }));
            console.error("[AzureSyncAction] Service error:", errorData);
            return { success: false, error: "De synchronisatie service is momenteel niet bereikbaar." };
        }

        // Revalidate the specific user to show updated data
        revalidateTag(`user_${userId}`, 'max');
        revalidatePath(`/beheer/leden/${userId}`);

        return { success: true, message: `Synchronisatie voor gebruiker ${userId} voltooid.` };
    } catch (err) {
        console.error("[AzureSyncAction] User sync error:", err);
        return { success: false, error: "Kon geen verbinding maken met de sync service." };
    }
}

import { getRedis } from "@/server/auth/redis-client";

/**
 * Fetches the current status of the sync job.
 */
export async function getSyncStatusAction() {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/status`, {
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            return { success: false, error: "Status service onbeschikbaar" };
        }

        return await res.json();
    } catch (err) {
        console.error("[AzureSyncAction] Get status error:", err);
        return { success: false, error: "Kon status niet ophalen." };
    }
}

/**
 * Requests the current sync job to stop.
 */
export async function stopSyncAction() {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const redis = await getRedis();
        // 1. Signal the job via a separate key so it doesn't get clobbered
        await redis.set('v7:sync:abort', 'true', 'EX', 600); // 10 min TTL

        // 2. Also update status for immediate UI feedback if possible
        const data = await redis.get('v7:sync:status');
        if (data) {
            const status = JSON.parse(data);
            if (status.active) {
                status.abortRequested = true;
                await redis.set('v7:sync:status', JSON.stringify(status), 'EX', 86400 * 7);
            }
        }
        return { success: true };
    } catch (error: any) {
        console.error('[Action] stopSyncAction error:', error);
        return { success: false, error: error.message };
    }
}

