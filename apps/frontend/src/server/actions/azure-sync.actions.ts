'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";

const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

async function checkSyncAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    const memberships = user.committees || [];
    const isAdmin = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    if (!isAdmin) return null;
    return user;
}

/**
 * Triggers a full synchronization job in the Azure Sync Service.
 */
export async function triggerFullSyncAction() {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Sync service onbeschikbaar' }));
            return { success: false, error: errorData.error || `Sync gefaald (${res.status})` };
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
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Sync service onbeschikbaar' }));
            return { success: false, error: errorData.error || `Sync gefaald (${res.status})` };
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

