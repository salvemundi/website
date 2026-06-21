'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidatePath } from "next/cache";
import { isSuperAdmin } from '@/lib/auth';
import { getSystemDirectus } from '@/lib/directus';
import { updateItem, readUsers, createItem, deleteItem, readItems } from '@directus/sdk';
import { USER_ID_FIELDS } from '@salvemundi/validations/directus/fields';
import type { CommitteeMember } from '@/server/queries/admin-commissies.queries';
import { getCommitteeMembers as getCommitteeMembersQuery } from '@/server/queries/admin-commissies.queries';
import {
    updateCommitteeDetailsSchema,
    addCommitteeMemberSchema,
    toggleCommitteeLeaderSchema,
    removeCommitteeMemberSchema
} from '@salvemundi/validations';
import { type EnrichedUser } from '@/types/auth';
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

async function checkAccess() {
    const session = await getEnrichedSession();
    if (!session?.user) throw new Error('Niet ingelogd');

    const user = session.user as unknown as EnrichedUser;
    if (!isSuperAdmin(user.committees)) {
        throw new Error('Geen toegang: Beheerrechten vereist.');
    }

    return session;
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
        await getSystemDirectus().request(updateItem('committees', committeeId, validated.data.payload));
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

    const users = await getSystemDirectus().request(readUsers({
        filter: { email: { _eq: userEmail } },
        fields: [...USER_ID_FIELDS],
        limit: 1
    }));

    const user = users[0] as { id: string; entra_id?: string | null } | undefined;
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
        await getSystemDirectus().request(createItem('committee_members', {
            user_id: user.id,
            committee_id: Number(committeeId),
            is_leader: false,
            is_visible: true
        }));
        revalidatePath('/beheer/commissies');
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
        const users = await getSystemDirectus().request(readUsers({
            filter: { entra_id: { _eq: entraId } },
            fields: ['id'],
            limit: 1
        }));
        const user = users[0] as { id: string } | undefined;
        if (user) {
            const committees = await getSystemDirectus().request(readItems('committees', {
                filter: { azure_group_id: { _eq: azureGroupId } },
                fields: ['id'],
                limit: 1
            }));
            const committee = committees[0] as unknown as { id: string | number } | undefined;
            if (committee) {
                const memberships = await getSystemDirectus().request(readItems('committee_members', {
                    filter: {
                        user_id: { _eq: user.id },
                        committee_id: { _eq: Number(committee.id) }
                    },
                    fields: ['id']
                })) as unknown as { id: number }[];
                for (const m of memberships) {
                    await getSystemDirectus().request(deleteItem('committee_members', m.id));
                }
            }
        }
        revalidatePath('/beheer/commissies');
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
        await getSystemDirectus().request(updateItem('committee_members', membershipId, { is_leader: !currentIsLeader }));
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