'use server';

import { auth } from '@/server/auth/auth';
import { revalidatePath } from "next/cache";
import { headers } from 'next/headers';

import { isSuperAdmin } from '@/lib/auth';
import { getSystemDirectus } from '@/lib/directus';
import { updateItem, readUsers } from '@directus/sdk';
import { USER_ID_FIELDS } from '@salvemundi/validations/directus/fields';
import type { 
    Committee, 
    CommitteeMember 
} from '@/server/queries/admin-vereniging.queries';
import { 
    getCommitteesInternal, 
    getCommitteeMembersInternal, 
    getUniqueCommitteeMembersCountInternal,
} from '@/server/queries/admin-vereniging.queries';
import { triggerUserSyncAction } from './azure-sync/sync-tasks.actions';

const getAzureManagementUrl = () => process.env.AZURE_MANAGEMENT_SERVICE_URL;

const serviceHeaders = (contentType = true) => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    const h: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (contentType) h['Content-Type'] = 'application/json';
    return h;
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
        
        return { success: false, error: 'Bewerking in Azure mislukt. Probeer het later opnieuw.' };
    }

    await triggerUserSyncAction(user.entra_id);

    return { success: true };
}

export async function removeCommitteeMember(
    azureGroupId: string,
    entraId: string
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    const azRes = await fetch(`${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/members/${encodeURIComponent(entraId)}`, {
        method: 'DELETE',
        headers: serviceHeaders(false),
    });
    if (!azRes.ok) {
        const err = await azRes.json().catch(() => ({}));
        
        return { success: false, error: 'Verwijderen uit Azure groep mislukt.' };
    }

    await triggerUserSyncAction(entraId);

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
        
        return { success: false, error: 'Bijwerken mislukt' };
    }

    if (azureGroupId) {
        const path = currentIsLeader
            ? `${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/owners/${encodeURIComponent(entraId)}`
            : `${getAzureManagementUrl()}/api/groups/${encodeURIComponent(azureGroupId)}/owners`;
        const method = currentIsLeader ? 'DELETE' : 'POST';
        await fetch(path, {
            method,
            headers: serviceHeaders(!currentIsLeader),
            body: currentIsLeader ? undefined : JSON.stringify({ userId: entraId }),
        }).catch(() => {});
    }

    return { success: true };
}
