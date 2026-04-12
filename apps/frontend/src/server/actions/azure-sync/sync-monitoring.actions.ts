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
    } catch (err: any) {
        console.error(`[SYNC-ACTION] Connection error to ${AZURE_SYNC_URL}/api/sync/status:`, err.message);
        return { success: false, error: "Kon status niet ophalen." };
    }
}

export async function stopSyncAction() {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const redis = await getRedis();
        const statusRaw = await redis.get('v7:sync:status');
        if (statusRaw) {
            const status = JSON.parse(statusRaw);
            if (status.active) {
                status.abortRequested = true;
                await redis.set('v7:sync:status', JSON.stringify(status), 'EX', 86400 * 7);
            }
        }
        return { success: true };
    } catch (error: any) {
        console.error("[SYNC-ACTION] Stop sync failed:", error.message);
        return { success: false, error: error.message };
    }
}
