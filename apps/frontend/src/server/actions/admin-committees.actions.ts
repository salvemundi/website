'use server';

import { auth } from '@/server/auth/auth';
import { revalidateTag, revalidatePath } from "next/cache";
import { headers } from 'next/headers';

import { getSystemDirectus, getUserDirectus } from '@/lib/directus';
import { readItems, updateItem, readUsers } from '@directus/sdk';

const getAzureManagementUrl = () => process.env.AZURE_MANAGEMENT_SERVICE_URL;

const serviceHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

async function checkAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');
    const userRole = (session.user as any).role; // Adjust based on actual session type
    // Fallback access check
    const hasAccess = !!session.user;
    if (!hasAccess) throw new Error('Geen toegang');
    return session;
}

export type Committee = {
    id: number;
    name: string;
    email?: string | null;
    azureGroupId?: string | null;
    description?: string | null;
    short_description?: string | null;
    image?: string | null;
};

export type CommitteeMember = {
    directusMembershipId?: number;
    entraId: string;
    displayName: string;
    email: string;
    isLeader: boolean;
};

// ── Committees ─────────────────────────────────────────────────────────────

export async function getCommittees(): Promise<Committee[]> {
    await checkAccess();
    try {
        const items = await getSystemDirectus().request(readItems('committees', {
            limit: 200,
            fields: ['id', 'name', 'email', 'azureGroupId', 'description', 'short_description', 'image'],
            sort: ['name']
        }));
        return items as Committee[];
    } catch (e) {
        console.error('[AdminCommittees] Fetch failed:', e);
        throw new Error('Kon commissies niet ophalen');
    }
}

export async function updateCommitteeDetails(
    committeeId: string,
    payload: { short_description?: string; description?: string; image?: string }
): Promise<{ success: boolean; error?: string }> {
    const session = await checkAccess();
    
    try {
        await getUserDirectus(session.session.token).request(updateItem('committees', committeeId, payload));
    revalidatePath(`/beheer/committees/${committeeId}`);
    revalidatePath('/beheer/committees');
    return { success: true };
    } catch (e) {
        console.error('[AdminCommittees] Update failed:', e);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

// ── Members ────────────────────────────────────────────────────────────────

export async function getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    await checkAccess();
    try {
        const items = await getSystemDirectus().request(readItems('committee_members' as any, {
            filter: { committee_id: { _eq: committeeId } },
            fields: ['id', 'is_leader', { user_id: ['id', 'entra_id', 'first_name', 'last_name', 'email'] }],
            limit: 200
        }));

        return (items ?? [])
            .filter((r: any) => r.user_id)
            .map((r: any) => ({
                directusMembershipId: r.id,
                entraId: r.user_id.entra_id || r.user_id.id,
                displayName: `${r.user_id.first_name || ''} ${r.user_id.last_name || ''}`.trim() || r.user_id.email,
                email: r.user_id.email || '',
                isLeader: r.is_leader || false,
            }));
    } catch (e) {
        console.error('[AdminCommittees] Fetch members failed:', e);
        return [];
    }
}

export async function addCommitteeMember(
    azureGroupId: string,
    committeeId: string,
    userEmail: string
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();

    // 1) Lookup user by email in Directus
    const users = await getSystemDirectus().request(readUsers({
        filter: { email: { _eq: userEmail } },
        fields: ['id', 'entra_id'],
        limit: 1
    }));
    const user = users?.[0];
    if (!user?.entra_id) {
        return { success: false, error: 'Gebruiker niet gevonden in het systeem (email onbekend of niet gesynchroniseerd)' };
    }

    // 2) Add to Azure Group via Azure Management Service
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
    const session = await checkAccess();

    // Update is_leader in Directus
    try {
        await getUserDirectus(session.session.token).request(updateItem('committee_members' as any, membershipId, { is_leader: !currentIsLeader }));
        revalidatePath('/beheer/vereniging');
    } catch (e) {
        console.error('[AdminCommittees] Toggle leader failed:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }

    // If there's an Azure group, also update owners
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
