'use server';

import { revalidatePath } from "next/cache";
import { enforceFeatureAccess } from '@/server/actions/admin/admin-utils.actions';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function checkAdminAccess() {
    try {
        const result = await enforceFeatureAccess('leden');
        return result.user;
    } catch {
        return null;
    }
}

export async function updateMemberProfileAction(
    directusUserId: string,
    payload: {
        first_name?: string | null;
        last_name?: string | null;
        phone_number?: string | null;
        date_of_birth?: string | null;
    }
) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const user = await db.query.directus_users.findFirst({
            columns: { email: true, entra_id: true },
            where: eq(schema.directus_users.id, directusUserId)
        });
        if (!user) return { success: false, error: 'Lid niet gevonden' };

        if (user.entra_id && AZURE_MGMT_URL && INTERNAL_TOKEN) {
            await fetch(`${AZURE_MGMT_URL}/api/users/${encodeURIComponent(user.entra_id)}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    displayName: payload.first_name || payload.last_name ? `${payload.first_name || ''} ${payload.last_name || ''}`.trim() : undefined,
                    phoneNumber: payload.phone_number,
                    dateOfBirth: payload.date_of_birth
                })
            }).catch((error: unknown) => {
                safeConsoleError(`[admin-leden-profile.actions.ts][updateMemberProfileAction] Azure patch request failed:`, error);
            });
        }

        if (AZURE_SYNC_URL && INTERNAL_TOKEN) {
            await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`
                }
            }).catch((error: unknown) => {
                safeConsoleError(`[admin-leden-profile.actions.ts][updateMemberProfileAction] Failed to sync user for ${directusUserId}:`, error);
            });
        }

        const emailSlugForUpdate = user.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(emailSlugForUpdate)}`);

        await logAdminAction('admin_member_profile_updated', 'SUCCESS', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            updates: payload
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[admin-leden-profile.actions.ts][updateMemberProfileAction] Failed to update profile for ${directusUserId}:`, error);
        return { success: false, error: 'Opslaan mislukt' };
    }
}
