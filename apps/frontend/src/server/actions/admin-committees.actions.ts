'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';
const getAzureManagementUrl = () => process.env.AZURE_MANAGEMENT_SERVICE_URL || 'http://v7-azure-management:3006';

const directusHeaders = () => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) throw new Error('DIRECTUS_STATIC_TOKEN is missing');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const serviceHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

async function checkAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');
    const user = session.user as any;
    const memberships: any[] = user.committees ?? [];
    const names = memberships.map((c: any) => (c?.committee_id?.name || c?.name || '').toString().toLowerCase());
    const hasAccess = names.some(n => n.includes('bestuur') || n.includes('ict') || n.includes('kandi'))
        || !!user.entra_id;
    if (!hasAccess) throw new Error('Geen toegang');
    return user;
}

export type Committee = {
    id: string;
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
    const res = await fetch(
        `${getDirectusUrl()}/items/committees?limit=200&fields=id,name,email,azureGroupId,description,short_description,image&sort=name`,
        { headers: directusHeaders() }
    );
    if (!res.ok) throw new Error('Kon commissies niet ophalen');
    const json = await res.json();
    return json.data ?? [];
}

export async function updateCommitteeDetails(
    committeeId: string,
    payload: { short_description?: string; description?: string; image?: string }
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    const res = await fetch(`${getDirectusUrl()}/items/committees/${committeeId}`, {
        method: 'PATCH',
        headers: directusHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) return { success: false, error: 'Opslaan mislukt' };
    return { success: true };
}

// ── Members ────────────────────────────────────────────────────────────────

export async function getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    await checkAccess();
    // 1) Load committee_members from Directus, with user entra_id, name, email
    const res = await fetch(
        `${getDirectusUrl()}/items/committee_members?filter[committee_id][_eq]=${committeeId}&fields=id,is_leader,user_id.id,user_id.entra_id,user_id.first_name,user_id.last_name,user_id.email&limit=200`,
        { headers: directusHeaders() }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = json.data ?? [];

    return rows
        .filter(r => r.user_id)
        .map(r => ({
            directusMembershipId: r.id,
            entraId: r.user_id.entra_id || r.user_id.id,
            displayName: `${r.user_id.first_name || ''} ${r.user_id.last_name || ''}`.trim() || r.user_id.email,
            email: r.user_id.email || '',
            isLeader: r.is_leader || false,
        }));
}

export async function addCommitteeMember(
    azureGroupId: string,
    committeeId: string,
    userEmail: string
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();

    // 1) Lookup user by email in Directus
    const userRes = await fetch(
        `${getDirectusUrl()}/users?filter[email][_eq]=${encodeURIComponent(userEmail)}&fields=id,entra_id&limit=1`,
        { headers: directusHeaders() }
    );
    const userJson = await userRes.json();
    const user = userJson.data?.[0];
    if (!user?.entra_id) {
        return { success: false, error: 'Gebruiker niet gevonden in het systeem (email onbekend of niet gesynchroniseerd)' };
    }

    // 2) Add to Azure Group via Azure Management Service
    const azRes = await fetch(`${getAzureManagementUrl()}/groups/${azureGroupId}/members`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({ userId: user.entra_id }),
    });
    if (!azRes.ok) {
        const err = await azRes.json().catch(() => ({}));
        return { success: false, error: err.error || 'Toevoegen aan Azure groep mislukt' };
    }

    return { success: true };
}

export async function removeCommitteeMember(
    azureGroupId: string,
    entraId: string
): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    const azRes = await fetch(`${getAzureManagementUrl()}/groups/${azureGroupId}/members/${entraId}`, {
        method: 'DELETE',
        headers: serviceHeaders(),
    });
    if (!azRes.ok) {
        const err = await azRes.json().catch(() => ({}));
        return { success: false, error: err.error || 'Verwijderen mislukt' };
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

    // Update is_leader in Directus
    const res = await fetch(`${getDirectusUrl()}/items/committee_members/${membershipId}`, {
        method: 'PATCH',
        headers: directusHeaders(),
        body: JSON.stringify({ is_leader: !currentIsLeader }),
    });
    if (!res.ok) return { success: false, error: 'Bijwerken mislukt' };

    // If there's an Azure group, also update owners
    if (azureGroupId) {
        const path = currentIsLeader
            ? `${getAzureManagementUrl()}/groups/${azureGroupId}/owners/${entraId}`
            : `${getAzureManagementUrl()}/groups/${azureGroupId}/owners`;
        const method = currentIsLeader ? 'DELETE' : 'POST';
        await fetch(path, {
            method,
            headers: serviceHeaders(),
            body: currentIsLeader ? undefined : JSON.stringify({ userId: entraId }),
        }).catch(e => console.warn('[committees] Azure owner sync failed:', e));
    }

    return { success: true };
}
