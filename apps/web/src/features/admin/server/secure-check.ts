'use server';

import { cookies } from 'next/headers';
import { AUTH_COOKIES } from '@/shared/config/auth-config';
import { serverDirectusFetch } from '@/shared/lib/server-directus';

export interface PermissionRequirements {
    /**
     * List of committee tokens that are allowed access.
     * These correspond to the 'commissie_token' field in Directus.
     * e.g. ['ict', 'bestuur']
     * If multiple are provided, user needs to be in at least one.
     */
    commissie_tokens?: string[];

    /**
     * List of roles (Directus role names) that are allowed access.
     * e.g. ['Administrator', 'Moderator']
     */
    roles?: string[];

    /**
     * If true, requires the user to have a leadership role in one of the required committees.
     */
    requireCommitteeLeadership?: boolean;
}

export interface UserPermissionContext {
    userId: string;
    committees: Array<{ token: string; isLeader: boolean }>;
    role: string | null;
}

/**
 * Verifies permissions based on 'commissie_token' and 'is_leader' field.
 */
export async function verifyUserPermissions(requirements: PermissionRequirements): Promise<UserPermissionContext> {
    const cookieStore = await cookies();
    // Support Test Mode (impersonation) via directus_test_token
    const token = cookieStore.get(AUTH_COOKIES.TEST_TOKEN)?.value || cookieStore.get(AUTH_COOKIES.SESSION)?.value;

    if (!token) {
        throw new Error('Unauthorized: No active session');
    }

    // 1. Validate Session & Get User ID
    let userId: string;
    try {
        const me = await serverDirectusFetch<any>('/users/me?fields=id', {
            headers: { Authorization: `Bearer ${token}` },
            revalidate: 0
        });
        userId = me?.id;
    } catch (error) {
        throw new Error('Unauthorized: Invalid or expired session');
    }

    if (!userId) {
        throw new Error('Unauthorized: Unable to identify user');
    }

    // 2. Fetch Data
    // CHANGE: Fetching 'is_leader' from committee_members schema instead of 'function'
    const [userRoleData, committeeMembersData] = await Promise.all([
        serverDirectusFetch<any>(`/users/${userId}?fields=role.name`),
        serverDirectusFetch<any[]>(`/items/committee_members?fields=committee_id.commissie_token,is_leader&filter[user_id][_eq]=${userId}`)
    ]);

    const userRole = userRoleData?.role?.name || null;

    // Normalize: user has a list of { token: 'ict', isLeader: true/false }
    const userCommittees = (Array.isArray(committeeMembersData) ? committeeMembersData : []).map((m: any) => {
        const token = (m.committee_id?.commissie_token || '').toLowerCase();
        // Uses the database boolean 'is_leader'
        const isLeader = m.is_leader === true;
        return { token, isLeader };
    }).filter(c => c.token !== '');

    // 3. Evaluate Permissions

    // Check Global Role
    if (requirements.roles && requirements.roles.length > 0) {
        const hasRole = userRole && requirements.roles.some(r => r.toLowerCase() === userRole.toLowerCase());
        if (hasRole) {
            return { userId, committees: userCommittees, role: userRole };
        }
    }

    // Check Committees (via Tokens)
    if (requirements.commissie_tokens && requirements.commissie_tokens.length > 0) {
        const requiredTokens = requirements.commissie_tokens.map(t => t.toLowerCase());

        // Match user's tokens against required tokens
        const matches = userCommittees.filter(uc => requiredTokens.includes(uc.token));

        if (matches.length > 0) {
            if (requirements.requireCommitteeLeadership) {
                const hasLeadership = matches.some(m => m.isLeader);
                if (!hasLeadership) {
                    // console.warn(`[verifyUserPermissions] Access Denied. User ${userId} is in ${matches.map(m=>m.token)}, but not a leader.`);
                    throw new Error(`Access Denied: Requires leadership in these committees.`);
                }
            }
            return { userId, committees: userCommittees, role: userRole };
        } else {
            if (!requirements.roles || requirements.roles.length === 0) {
                // console.warn(`[verifyUserPermissions] Access Denied. User ${userId} has tokens [${userCommittees.map(c=>c.token)}], required [${requiredTokens}]`);
                throw new Error(`Access Denied: Requires membership in specific committees.`);
            }
        }
    }

    // If no requirements passed = Auth Check Only
    if ((!requirements.roles || requirements.roles.length === 0) && (!requirements.commissie_tokens || requirements.commissie_tokens.length === 0)) {
        return { userId, committees: userCommittees, role: userRole };
    }

    throw new Error('Access Denied: Insufficient permissions');
}
