'use server';

import { revalidatePath } from "next/cache";
import { db, schema } from '@salvemundi/db';
import { eq, and } from 'drizzle-orm';
import type { CommitteeMember } from '@/server/queries/commissies/admin-commissies.queries';
import { getCommitteeMembers as getCommitteeMembersQuery } from '@/server/queries/commissies/admin-commissies.queries';
import {
    updateCommitteeDetailsSchema,
    addCommitteeMemberSchema,
    toggleCommitteeLeaderSchema,
    removeCommitteeMemberSchema
} from '@salvemundi/validations';

import { safeConsoleError } from '@/server/utils/logger';

interface AzureErrorResponse {
    details?: string;
}

const getAzureManagementUrl = () => process.env.AZURE_MANAGEMENT_SERVICE_URL;

const serviceHeaders = (contentType = true) => {
    const token = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (contentType) headers['Content-Type'] = 'application/json';
    return headers;
};

import { enforceFeatureAccess, revalidateUserCache } from '@/server/actions/admin/admin-utils.actions';

async function checkAccess() {
    return enforceFeatureAccess('commissies');
}

export async function getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    await checkAccess();
    return getCommitteeMembersQuery(committeeId);
}

export async function updateCommitteeDetails(
    committeeId: string,
    payload: { short_description?: string; description?: string; image?: string }
): Promise<{ success: boolean; error?: string }> {
    const validated = updateCommitteeDetailsSchema.safeParse({ committeeId, payload });
    if (!validated.success) {
        return { success: false, error: 'Ongeldige invoer' };
    }
    await checkAccess();

    try {
        await db.update(schema.committees)
            .set(validated.data.payload)
            .where(eq(schema.committees.id, Number(committeeId)));
        revalidatePath(`/beheer/commissies/${committeeId}`);
        revalidatePath('/beheer/commissies');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[admin-committees.actions.ts][updateCommitteeDetails] Failed to update committee details for ${committeeId}:`, error);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function addCommitteeMember(
    azureGroupId: string,
    committeeId: string,
    userEmail: string
): Promise<{ success: boolean; error?: string }> {
    const validated = addCommitteeMemberSchema.safeParse({ azureGroupId, committeeId, userEmail });
    if (!validated.success) {
        return { success: false, error: 'Ongeldige invoer' };
    }
    await checkAccess();

    const user = await db.query.directus_users.findFirst({
        where: eq(schema.directus_users.email, userEmail),
        columns: { id: true, entra_id: true }
    });

    if (!user || !user.entra_id) {
        return { success: false, error: 'Gebruiker niet gevonden in het systeem (email onbekend of niet gesynchroniseerd)' };
    }

    const azureResponse = await fetch(`${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/members`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({ userId: user.entra_id })
    });
    if (!azureResponse.ok) {
        const azureError = await azureResponse.json().catch(() => ({})) as AzureErrorResponse;
        safeConsoleError(`[admin-committees.actions.ts][addCommitteeMember] Failed to add committee member ${userEmail}:`, azureError);
        return { success: false, error: 'Bewerking in Azure mislukt. Probeer het later opnieuw.' };
    }

    try {
        await db.insert(schema.committee_members).values({
            user_id: user.id,
            committee_id: Number(committeeId),
            is_leader: false,
            is_visible: true
        });
        await revalidateUserCache();
        revalidatePath('/beheer/commissies');

        const syncUrl = process.env.AZURE_SYNC_SERVICE_URL;
        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        if (syncUrl && internalToken) {
            fetch(`${syncUrl}/api/sync/run/${encodeURIComponent(user.entra_id)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${internalToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ convertUpn: true })
            }).catch((syncErr) => {
                safeConsoleError(`[admin-committees.actions.ts][addCommitteeMember] Failed to trigger sync for user ${user.entra_id}:`, syncErr);
            });
        }
    } catch (error: unknown) {
        safeConsoleError(`[admin-committees.actions.ts][addCommitteeMember] Failed to write local membership to Directus:`, error);
    }

    return { success: true };
}

export async function removeCommitteeMember(
    azureGroupId: string,
    entraId: string,
    isLeader?: boolean
): Promise<{ success: boolean; error?: string }> {
    const validated = removeCommitteeMemberSchema.safeParse({ azureGroupId, entraId, isLeader });
    if (!validated.success) {
        return { success: false, error: 'Ongeldige invoer' };
    }
    await checkAccess();

    if (isLeader) {
        await fetch(`${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/owners/${encodeURIComponent(entraId)}`, {
            method: 'DELETE',
            headers: serviceHeaders(false)
        }).then(async (response) => {
            if (!response.ok) {
                const body = await response.json().catch(() => ({})) as AzureErrorResponse;
                if (body.details?.includes('at least one owner')) {
                    safeConsoleError(`[admin-committees.actions.ts][removeCommitteeMember] Could not remove last owner ${entraId} from ${azureGroupId}:`, body);
                } else {
                    safeConsoleError(`[admin-committees.actions.ts][removeCommitteeMember] Failed to remove owner ${entraId} from ${azureGroupId}:`, body);
                }
            }
        }).catch((error: unknown) => {
            safeConsoleError(`[admin-committees.actions.ts][removeCommitteeMember] Fetch error removing owner ${entraId}:`, error);
        });
    }

    const azureResponse = await fetch(`${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/members/${encodeURIComponent(entraId)}`, {
        method: 'DELETE',
        headers: serviceHeaders(false)
    });

    if (!azureResponse.ok) {
        const memberError = await azureResponse.json().catch(() => ({})) as AzureErrorResponse;
        safeConsoleError(`[admin-committees.actions.ts][removeCommitteeMember] Failed to remove member ${entraId} from ${azureGroupId}:`, memberError);
        return { success: false, error: 'Verwijderen uit Azure groep mislukt.' };
    }

    try {
        const user = await db.query.directus_users.findFirst({
            where: eq(schema.directus_users.entra_id, entraId),
            columns: { id: true }
        });
        if (user) {
            const committee = await db.query.committees.findFirst({
                where: eq(schema.committees.azure_group_id, azureGroupId),
                columns: { id: true }
            });
            if (committee) {
                await db.delete(schema.committee_members).where(
                    and(
                        eq(schema.committee_members.user_id, user.id),
                        eq(schema.committee_members.committee_id, committee.id)
                    )
                );
                await revalidateUserCache();
            }
        }
        revalidatePath('/beheer/commissies');

        const syncUrl = process.env.AZURE_SYNC_SERVICE_URL;
        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        if (syncUrl && internalToken) {
            fetch(`${syncUrl}/api/sync/run/${encodeURIComponent(entraId)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${internalToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ convertUpn: true })
            }).catch((syncErr) => {
                safeConsoleError(`[admin-committees.actions.ts][removeCommitteeMember] Failed to trigger sync for user ${entraId}:`, syncErr);
            });
        }
    } catch (error: unknown) {
        safeConsoleError(`[admin-committees.actions.ts][removeCommitteeMember] Failed to delete local membership from Directus:`, error);
    }

    return { success: true };
}

export async function toggleCommitteeLeader(
    membershipId: number,
    currentIsLeader: boolean,
    azureGroupId: string | null | undefined,
    entraId: string
): Promise<{ success: boolean; error?: string }> {
    const validated = toggleCommitteeLeaderSchema.safeParse({ membershipId, currentIsLeader, azureGroupId, entraId });
    if (!validated.success) {
        return { success: false, error: 'Ongeldige invoer' };
    }
    await checkAccess();

    try {
        await db.update(schema.committee_members)
            .set({ is_leader: !currentIsLeader })
            .where(eq(schema.committee_members.id, membershipId));
        await revalidateUserCache();
        revalidatePath('/beheer/commissies');
    } catch (error: unknown) {
        safeConsoleError(`[admin-committees.actions.ts][toggleCommitteeLeader] Failed to toggle leader for membership ${membershipId}:`, error);
        return { success: false, error: 'Bijwerken mislukt' };
    }

    if (azureGroupId) {
        const path = currentIsLeader
            ? `${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/owners/${encodeURIComponent(entraId)}`
            : `${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/owners`;
        const method = currentIsLeader ? 'DELETE' : 'POST';
        await fetch(path, {
            method,
            headers: serviceHeaders(method === 'POST'),
            body: currentIsLeader ? undefined : JSON.stringify({ userId: entraId })
        }).then(async (response) => {
            if (!response.ok) {
                const body = await response.json().catch(() => ({})) as AzureErrorResponse;
                safeConsoleError(`[admin-committees.actions.ts][toggleCommitteeLeader] Failed to toggle leader in Azure for ${entraId}:`, body);
                if (body.details?.includes('at least one owner')) {
                    safeConsoleError(`[admin-committees.actions.ts][toggleCommitteeLeader] Could not remove last owner ${entraId} from ${azureGroupId}:`, body);
                }
            }
        }).catch((error: unknown) => {
            safeConsoleError(`[admin-committees.actions.ts][toggleCommitteeLeader] Failed to toggle leader in Azure for ${entraId}:`, error);
        });
    }

    return { success: true };
}