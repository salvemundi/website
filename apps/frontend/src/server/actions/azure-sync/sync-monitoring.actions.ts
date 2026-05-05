'use server';

import { getRedis } from "@/server/auth/redis-client";
import { checkSyncAccess, AZURE_SYNC_URL, INTERNAL_TOKEN } from "./sync-access";

export async function getSyncStatusAction() {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    if (!AZURE_SYNC_URL) {
        console.error("[SYNC-ACTION] AZURE_SYNC_SERVICE_URL is not configured.");
        return { success: false, error: "Systeemfout: Sync service URL niet geconfigureerd." };
    }

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/status`, {
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`[SYNC-ACTION] GET /status failed: ${res.status}`);
            return { success: false, error: "Status service onbeschikbaar" };
        }

        return await res.json();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Kon status niet ophalen.';
        console.error(`[SYNC-ACTION] Connection error to ${AZURE_SYNC_URL}/api/sync/status:`, message);
        return { success: false, error: "Kon status niet ophalen." };
    }
}

export async function stopSyncAction() {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const redis = await getRedis();
        
        // 1. Set the actual abort trigger key that the service polls
        await redis.set('v7:sync:abort', 'true', 'EX', 3600);
        
        // 2. Update the status object for instant UI feedback (abortRequested flag)
        const statusRaw = await redis.get('v7:sync:status');
        if (statusRaw) {
            const status = JSON.parse(statusRaw);
            if (status.active) {
                status.abortRequested = true;
                await redis.set('v7:sync:status', JSON.stringify(status), 'EX', 86400 * 7);
            }
        }
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error("[SYNC-ACTION] Stop sync failed:", message);
        return { success: false, error: message };
    }
}

export async function resetSyncStatusAction() {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!AZURE_SYNC_URL) return { success: false, error: "Sync service URL niet geconfigureerd." };

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/reset`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            }
        });

        if (!res.ok) return { success: false, error: "Reset mislukt" };

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error("[SYNC-ACTION] Reset sync failed:", message);
        return { success: false, error: message };
    }
}
