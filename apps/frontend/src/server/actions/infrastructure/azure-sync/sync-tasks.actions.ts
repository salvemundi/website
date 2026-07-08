'use server';
import { safeConsoleError, logWarn } from '@/server/utils/logger';
import { revalidateTag, revalidatePath } from "next/cache";
import { checkSyncAccess, AZURE_SYNC_URL, INTERNAL_TOKEN } from "@/server/actions/infrastructure/azure-sync/sync-access";

interface SyncServiceErrorResponse {
    details?: unknown;
    error?: unknown;
}

interface DirectusUserRow {
    id?: string;
    entra_id?: unknown;
    email?: unknown;
}

export async function triggerFullSyncAction(options?: { fields: string[]; forceLink?: boolean; activeOnly?: boolean; sendExpiryEmails?: boolean }) {
    const admin = await checkSyncAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    if (!AZURE_SYNC_URL) {
        safeConsoleError("[sync-tasks.actions.ts][triggerFullSyncAction] AZURE_SYNC_SERVICE_URL is not configured.");
        return { success: false, error: "Systeemfout: Sync service URL niet geconfigureerd." };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
            const errorData = (await res.json().catch((parseError: unknown) => {
                safeConsoleError('[sync-tasks.actions.ts][triggerFullSyncAction] Error parsing sync response:', parseError);
                return { error: 'Sync service onbeschikbaar' };
            })) as unknown as SyncServiceErrorResponse;

            safeConsoleError(`[sync-tasks.actions.ts][triggerFullSyncAction] POST /run failed with status ${res.status}`, errorData);

            const errorMsg = typeof errorData.details === 'string'
                ? errorData.details
                : typeof errorData.error === 'string'
                    ? errorData.error
                    : 'Sync service onbeschikbaar';

            return {
                success: false,
                error: `Start Fout: ${errorMsg}`
            };
        }

        return { success: true, message: "Synchronisatie taak succesvol gestart." };
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            return { success: false, error: "Kon de synchronisatie niet starten (Timeout 30s)." };
        }
        safeConsoleError(`[sync-tasks.actions.ts][triggerFullSyncAction] Connection error to ${AZURE_SYNC_URL}/api/sync/run`, error);
        return { success: false, error: "Kon geen verbinding maken met de sync service." };
    }
}

export async function triggerUserSyncAction(userId: string, options?: { fields: string[]; forceLink?: boolean; activeOnly?: boolean; forceSyncPhotos?: boolean }) {
    const admin = await checkSyncAccess(userId);
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!userId) return { success: false, error: "Geen User ID opgegeven." };
    if (!INTERNAL_TOKEN) {
        return { success: false, error: "Systeemfout: Ontbrekende service token." };
    }

    if (!AZURE_SYNC_URL) {
        safeConsoleError("[sync-tasks.actions.ts][triggerUserSyncAction] AZURE_SYNC_SERVICE_URL is not configured.");
        return { success: false, error: "Systeemfout: Sync service URL niet geconfigureerd." };
    }

    let targetUser: DirectusUserRow | undefined;
    try {
        const { db, schema } = await import('@salvemundi/db');
        const { eq } = await import('drizzle-orm');
        const user = await db.query.directus_users.findFirst({
            where: eq(schema.directus_users.entra_id, userId)
        });
        targetUser = user as unknown as DirectusUserRow | undefined;
    } catch (error: unknown) {
        safeConsoleError(`[sync-tasks.actions.ts][triggerUserSyncAction] Drizzle lookup failed for user ${userId}`, error);
        return { success: false, error: "Kon de gebruiker niet ophalen uit de database." };
    }

    const entraId = typeof targetUser?.entra_id === 'string' ? targetUser.entra_id : null;
    if (!entraId) {
        const userEmail = typeof targetUser?.email === 'string' ? targetUser.email : userId;
        return {
            success: false,
            error: `Kon geen Entra ID vinden voor gebruiker ${userEmail}.`
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const res = await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(entraId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options || { fields: ['membership_expiry', 'geboortedatum', 'phone_number', 'committees', 'profile_photo', 'membership_status'] }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorData = (await res.json().catch((parseError: unknown) => {
                safeConsoleError('[sync-tasks.actions.ts][triggerUserSyncAction] Error parsing sync response:', parseError);
                return { error: 'Sync service onbeschikbaar' };
            })) as unknown as SyncServiceErrorResponse;

            safeConsoleError(`[sync-tasks.actions.ts][triggerUserSyncAction] POST /run/:id failed with status ${res.status}`, errorData);

            const errorMsg = typeof errorData.details === 'string'
                ? errorData.details
                : typeof errorData.error === 'string'
                    ? errorData.error
                    : 'Onbekende fout';

            return {
                success: false,
                error: `Service Fout: ${errorMsg}`
            };
        }

        const userEmailStr = typeof targetUser?.email === 'string' ? targetUser.email : undefined;
        const emailSlug = userEmailStr?.split('@')[0]?.replace(/\./g, '-');
        if (emailSlug) revalidatePath(`/beheer/leden/${encodeURIComponent(emailSlug)}`);
        revalidateTag(`user_${entraId}`, 'max');
        revalidatePath('/beheer/commissies');

        const isSelf = admin.id === targetUser?.id || admin.entra_id === targetUser?.entra_id;
        if (isSelf) {
            const { clearSessionCache } = await import('@/server/auth/session-utils');
            await clearSessionCache();
            revalidatePath('/profiel');
        }

        return { success: true, message: `Synchronisatie voor gebruiker ${userId} voltooid.` };
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            logWarn(`[sync-tasks.actions.ts][triggerUserSyncAction] Request to ${AZURE_SYNC_URL} timed out after 60s`);
            return {
                success: false,
                error: "De synchronisatie duurt te lang (60s). De taak loopt mogelijk nog op de achtergrond; ververs de pagina over een minuut."
            };
        }
        safeConsoleError(`[sync-tasks.actions.ts][triggerUserSyncAction] Connection error to ${AZURE_SYNC_URL}/api/sync/run/${userId}`, error);
        return { success: false, error: "Kon geen verbinding maken met de sync service." };
    }
}