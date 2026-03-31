'use server';

import { auth } from '@/server/auth/auth';
import { revalidateTag, revalidatePath } from "next/cache";
import { headers } from 'next/headers';

import { isSuperAdmin } from '@/lib/auth-utils';
import { getSystemDirectus } from '@/lib/directus';
import { updateItem, readUsers } from '@directus/sdk';
import { USER_ID_FIELDS } from '@salvemundi/validations';
import { 
    getCommitteesInternal, 
    getCommitteeMembersInternal, 
    getUniqueCommitteeMembersCountInternal,
    type Committee,
    type CommitteeMember
} from '@/server/queries/admin-vereniging.queries';

export type { Committee, CommitteeMember };

const getAzureManagementUrl = () => process.env.AZURE_MANAGEMENT_SERVICE_URL;

const serviceHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

async function checkAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');
    
    const user = session.user as any;
    if (!isSuperAdmin(user.committees)) {
        throw new Error('Geen toegang: SuperAdmin rechten vereist.');
    }
    
    return session;
}

/**
 * SERVER ACTIONS: Exposable to Client Components.
 */

export async function getCommittees(): Promise<Committee[]> {
    await checkAccess();
    return getCommitteesInternal();
}

export async function getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    await checkAccess();
    return getCommitteeMembersInternal(committeeId);
}

export async function getUniqueCommitteeMembersCount(): Promise<number> {
    await checkAccess();
    return getUniqueCommitteeMembersCountInternal();
}

export async function updateCommitteeDetails(
    committeeId: string,
    payload: { short_description?: string; description?: string; image?: string }
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    
    try {
        await getSystemDirectus().request(updateItem('committees', committeeId, payload));
        revalidatePath(`/beheer/committees/${committeeId}`);
        revalidatePath('/beheer/committees');
        return { success: true };
    } catch (e) {
        console.error('[AdminCommittees] Update failed:', e);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function addCommitteeMember(
    azureGroupId: string,
    committeeId: string,
    userEmail: string
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();

    const users = await getSystemDirectus().request(readUsers({
        filter: { email: { _eq: userEmail } },
        fields: [...USER_ID_FIELDS],
        limit: 1
    }));
    const user = users?.[0];
    if (!user?.entra_id) {
        return { success: false, error: 'Gebruiker niet gevonden in het systeem (email onbekend of niet gesynchroniseerd)' };
    }

    const azRes = await fetch(`${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/members`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({ userId: user.entra_id }),
    });
    if (!azRes.ok) {
        const err = await azRes.json().catch(() => ({}));
        console.error('[AdminCommittees] Add member Azure error:', err);
        return { success: false, error: 'Bewerking in Azure mislukt. Probeer het later opnieuw.' };
    }

    return { success: true };
}

export async function removeCommitteeMember(
    azureGroupId: string,
    entraId: string
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    const azRes = await fetch(`${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/members/${encodeURIComponent(entraId)}`, {
        method: 'DELETE',
        headers: serviceHeaders(),
    });
    if (!azRes.ok) {
        const err = await azRes.json().catch(() => ({}));
        console.error('[AdminCommittees] Remove member Azure error:', err);
        return { success: false, error: 'Verwijderen uit Azure groep mislukt.' };
    }
    return { success: true };
}

export async function toggleCommitteeLeader(
    membershipId: number,
    currentIsLeader: boolean,
    azureGroupId: string | null | undefined,
    entraId: string
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();

    try {
        await getSystemDirectus().request(updateItem('committee_members' as any, membershipId, { is_leader: !currentIsLeader }));
        revalidatePath('/beheer/vereniging');
    } catch (e) {
        console.error('[AdminCommittees] Toggle leader failed:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }

    if (azureGroupId) {
        const path = currentIsLeader
            ? `${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/owners/${encodeURIComponent(entraId)}`
            : `${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/owners`;
        const method = currentIsLeader ? 'DELETE' : 'POST';
        await fetch(path, {
            method,
            headers: serviceHeaders(),
            body: currentIsLeader ? undefined : JSON.stringify({ userId: entraId }),
        }).catch(e => console.warn('[committees] Azure owner sync failed:', e));
    }

    return { success: true };
}
