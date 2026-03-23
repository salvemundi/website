'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/auth-utils";

const AZURE_SYNC_URL = "http://v7-acc-sync:3002";
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function checkSyncAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    if (!isSuperAdmin(user.committees)) return null;
    return user;
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
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!userId) return { success: false, error: "Geen User ID opgegeven." };
    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(userId)}`, {
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
        revalidateTag(`user_${userId}`, 'default');
        revalidatePath(`/beheer/leden/${userId}`);

        return { success: true, message: `Synchronisatie voor gebruiker ${userId} voltooid.` };
    } catch (err) {
        console.error("[AzureSyncAction] User sync error:", err);
        return { success: false, error: "Kon geen verbinding maken met de sync service." };
    }
}

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

