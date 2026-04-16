'use server';

import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { readUsers } from "@directus/sdk";
import { USER_FULL_FIELDS } from "@salvemundi/validations";
import { checkSyncAccess, AZURE_SYNC_URL, INTERNAL_TOKEN } from "./sync-access";

export async function triggerFullSyncAction(options?: { fields: string[]; forceLink?: boolean; activeOnly?: boolean }) {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    if (!AZURE_SYNC_URL) {
        console.error("[SYNC-ACTION] AZURE_SYNC_SERVICE_URL is not configured.");
        return { success: false, error: "Systeemfout: Sync service URL niet geconfigureerd." };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for start

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options || { fields: [] }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Sync service onbeschikbaar' }));
            console.error(`[SYNC-ACTION] POST /run failed: ${res.status}`, errorData);
            return { 
                success: false, 
                error: `Start Fout: ${errorData.details || errorData.error || 'Sync service onbeschikbaar'}` 
            };
        }

        return { success: true, message: "Synchronisatie taak succesvol gestart." };
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            return { success: false, error: "Kon de synchronisatie niet starten (Timeout 30s)." };
        }
        console.error(`[SYNC-ACTION] Connection error to ${AZURE_SYNC_URL}/api/sync/run:`, err.message);
        return { success: false, error: "Kon geen verbinding maken met de sync service." };
    }
}

export async function triggerUserSyncAction(userId: string) {
    const admin = await checkSyncAccess(userId);
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!userId) return { success: false, error: "Geen User ID opgegeven." };
    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    if (!AZURE_SYNC_URL) {
        console.error("[SYNC-ACTION] AZURE_SYNC_SERVICE_URL is not configured.");
        return { success: false, error: "Systeemfout: Sync service URL niet geconfigureerd." };
    }

    let targetUser;
    try {
        const users = await getSystemDirectus().request(readUsers({
            filter: { entra_id: { _eq: userId } },
            fields: [...USER_FULL_FIELDS] as any
        }));
        targetUser = users?.[0];
    } catch (err: any) {
        console.error(`[SYNC-ACTION] Directus lookup failed for user ${userId}:`, err.message);
        return { success: false, error: "Kon de gebruiker niet ophalen uit Directus." };
    }
        
    const entraId = targetUser?.entra_id;
    if (!entraId) {
        return { 
            success: false, 
            error: `Kon geen Entra ID vinden voor gebruiker ${targetUser?.email || userId}.` 
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(entraId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Sync service onbeschikbaar' }));
            console.error(`[SYNC-ACTION] POST /run/:id failed: ${res.status}`, errorData);
            return { 
                success: false, 
                error: `Service Fout: ${errorData.details || errorData.error || 'Onbekende fout'}` 
            };
        }

        revalidateTag(`user_${userId}`, 'max');
        revalidatePath(`/beheer/leden/${userId}`);
        revalidatePath('/beheer/commissies');

        return { success: true, message: `Synchronisatie voor gebruiker ${userId} voltooid.` };
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            console.warn(`[SYNC-ACTION] Request to ${AZURE_SYNC_URL} timed out after 60s`);
            return { 
                success: false, 
                error: "De synchronisatie duurt te lang (60s). De taak loopt mogelijk nog op de achtergrond; ververs de pagina over een minuut." 
            };
        }
        console.error(`[SYNC-ACTION] Connection error to ${AZURE_SYNC_URL}/api/sync/run/${userId}:`, err.message);
        return { success: false, error: "Kon geen verbinding maken met de sync service." };
    }
}
