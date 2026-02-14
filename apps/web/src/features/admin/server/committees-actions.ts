'use server';

import { serverDirectusFetch, CACHE_PRESETS } from '@/shared/lib/server-directus';
import { verifyUserPermissions } from './secure-check';
import { COMMITTEE_TOKENS } from '@/shared/config/committee-tokens';
import { revalidatePath } from 'next/cache';

const ADMIN_TOKENS = [COMMITTEE_TOKENS.ICT, COMMITTEE_TOKENS.BESTUUR];
const SERVICE_SECRET = process.env.SERVICE_SECRET;
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002';

/**
 * Verify if the current user has permission to manage committees.
 * Only Administrator, Bestuur, or ICT members are allowed.
 */
async function verifyCommitteeAdmin() {
    const context = await verifyUserPermissions({});
    const userRole = context.role;
    const userTokens = context.committees.map(c => c.token);

    if (userRole === 'Administrator' || userTokens.some(t => ADMIN_TOKENS.includes(t as any))) {
        return context;
    }

    throw new Error('Access Denied: You do not have permission to manage committees.');
}

/**
 * Fetch all committees for administrative display.
 */
export async function getAdminCommitteesAction() {
    await verifyCommitteeAdmin();
    return await serverDirectusFetch<any[]>('/items/committees?fields=id,name,email,azureGroupId,description,short_description,image&limit=-1&sort=name', CACHE_PRESETS.DYNAMIC);
}

/**
 * Fetch members for a specific committee from Azure (via Identity Service)
 * and their leader status from Directus.
 */
export async function getCommitteeMembersAction(azureGroupId: string, committeeId: string) {
    await verifyCommitteeAdmin();

    // 1. Fetch members from Identity Service (Azure Graph)
    // We use server-side fetch with the internal service secret.
    let azureMembers: any[] = [];
    try {
        const azureRes = await fetch(`${IDENTITY_SERVICE_URL}/api/membership/groups/${azureGroupId}/members`, {
            headers: {
                'x-api-key': SERVICE_SECRET || '',
                'Cache-Control': 'no-cache'
            }
        });

        if (azureRes.ok) {
            const data = await azureRes.json();
            azureMembers = Array.isArray(data) ? data : [];
        } else {
            console.error(`[Committees] Identity service returned ${azureRes.status}`);
        }
    } catch (error) {
        console.error('[Committees] Failed to fetch Azure members:', error);
    }

    // 2. Fetch Directus metadata (leader status, etc.)
    const directusMembers = await serverDirectusFetch<any[]>(
        `/items/committee_members?filter[committee_id][_eq]=${committeeId}&fields=id,is_leader,user_id.entra_id&limit=-1`,
        CACHE_PRESETS.DYNAMIC
    );

    return {
        azureMembers,
        directusMembers: Array.isArray(directusMembers) ? directusMembers : []
    };
}

/**
 * Add a member to a committee's Azure AD group.
 */
export async function addCommitteeMemberAction(azureGroupId: string, email: string) {
    await verifyCommitteeAdmin();

    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/membership/groups/${azureGroupId}/members`, {
        method: 'POST',
        headers: {
            'x-api-key': SERVICE_SECRET || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || 'Failed to add member to Azure group');
    }

    revalidatePath('/admin/committees');
    return { success: true };
}

/**
 * Remove a member from a committee's Azure AD group.
 */
export async function removeCommitteeMemberAction(azureGroupId: string, azureId: string) {
    await verifyCommitteeAdmin();

    const res = await fetch(`${IDENTITY_SERVICE_URL}/api/membership/groups/${azureGroupId}/members/${azureId}`, {
        method: 'DELETE',
        headers: {
            'x-api-key': SERVICE_SECRET || '',
        }
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || 'Failed to remove member from Azure group');
    }

    revalidatePath('/admin/committees');
    return { success: true };
}

/**
 * Toggle the 'is_leader' flag for a committee membership in Directus.
 */
export async function toggleCommitteeLeaderAction(membershipId: number, currentStatus: boolean) {
    await verifyCommitteeAdmin();

    await serverDirectusFetch(`/items/committee_members/${membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_leader: !currentStatus })
    });

    revalidatePath('/admin/committees');
    return { success: true };
}

/**
 * Update committee details (description, short description, etc.) in Directus.
 */
export async function updateCommitteeDetailsAction(committeeId: string, data: { short_description?: string; description?: string; image?: string }) {
    await verifyCommitteeAdmin();

    await serverDirectusFetch(`/items/committees/${committeeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });

    revalidatePath('/admin/committees');
    return { success: true };
}
