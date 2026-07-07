'use server';

import { revalidateTag, revalidatePath } from "next/cache";
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

export async function manageAzureMembershipAction(userId: string, azureGroupId: string, action: 'add' | 'remove', directusUserId: string) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!azureGroupId) return { success: false, error: "Dit comité is niet gekoppeld aan Azure." };

    try {
        const mgmtEndpoint = action === 'add'
            ? `${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(azureGroupId)}/members`
            : `${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(azureGroupId)}/members/${encodeURIComponent(userId)}`;

        const mgmtRes = await fetch(mgmtEndpoint, {
            method: action === 'add' ? 'POST' : 'DELETE',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: action === 'add' ? JSON.stringify({ userId }) : undefined
        });

        if (!mgmtRes.ok) {
            const errorText = await mgmtRes.text().catch(() => 'Unknown Error');
            await logAdminAction('admin_azure_membership_updated', 'ERROR', {
                context: 'lidmaatschap',
                member_id: directusUserId,
                azure_group_id: azureGroupId,
                action: action,
                error: errorText
            });
            return { success: false, error: "Fout bij communicatie met de Azure Management service." };
        }

        await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            }
        });

        const firstRevalRow = await db.query.directus_users.findFirst({
            columns: { email: true },
            where: eq(schema.directus_users.id, directusUserId)
        });
        const emailSlug = firstRevalRow?.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(emailSlug)}`);
        revalidateTag(`user_${directusUserId}`, 'max');
        revalidateTag(`user_committees_${directusUserId}`, 'max');

        await logAdminAction('admin_azure_membership_updated', 'SUCCESS', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            azure_group_id: azureGroupId,
            action: action
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[admin-leden-azure.actions.ts][manageAzureMembershipAction] Failed to manage Azure membership for ${directusUserId}:`, error);
        await logAdminAction('admin_azure_membership_updated', 'ERROR', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            azure_group_id: azureGroupId,
            action: action,
            error: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: "Er is een fout opgetreden bij het bijwerken in Azure." };
    }
}

export async function provisionAzureAccountAction(directusUserId: string) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const user = await db.query.directus_users.findFirst({
            columns: { email: true, first_name: true, last_name: true, phone_number: true, date_of_birth: true },
            where: eq(schema.directus_users.id, directusUserId)
        });
        if (!user || !user.email) return { success: false, error: "Lid niet gevonden of geen e-mailadres." };

        const res = await fetch(`${AZURE_MGMT_URL}/api/provisioning/user`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phoneNumber: user.phone_number,
                dateOfBirth: user.date_of_birth
            })
        });

        if (!res.ok) {
            const errorData = (await res.json().catch(() => ({ error: 'Onbekende fout' }))) as { error?: string };
            safeConsoleError(`[admin-leden-azure.actions.ts][provisionAzureAccountAction] Failed to provision Azure account for ${directusUserId}:`, errorData);
            return { success: false, error: errorData.error || "Azure provisioning mislukt." };
        }

        const provisionSlug = user.email.split('@')[0].replace(/\./g, '-');
        revalidatePath(`/beheer/leden/${encodeURIComponent(provisionSlug)}`);

        await logAdminAction('admin_azure_provisioning', 'SUCCESS', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            email: user.email
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[admin-leden-azure.actions.ts][provisionAzureAccountAction] Failed to provision Azure account for ${directusUserId}:`, error);
        return { success: false, error: "Er is een fout opgetreden bij het aanmaken van het Azure account." };
    }
}
