import { query } from "@/lib/database";
import { getPermissions } from "@/shared/lib/permissions";
import { createDirectus, rest, staticToken, readMe } from "@directus/sdk";
import { type ExtendedSession } from "@/types/auth";

/**
 * Validates if an admin user has the rights to impersonate others.
 */
export async function canUserImpersonate(userId: string): Promise<boolean> {
    try {
        console.log(`[ImpersonationUtils] Checking permissions for userId: ${userId}`);
        const { rows } = await query(
            `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
             FROM committee_members m 
             JOIN committees c ON m.committee_id = c.id 
             WHERE m.user_id = $1`,
            [userId]
        );
        
        console.log(`[ImpersonationUtils] Found committees: ${rows.map(r => r.name).join(', ')}`);
        const perms = getPermissions(rows);
        console.log(`[ImpersonationUtils] Perms - ICT: ${perms.isICT}, Leader: ${perms.isLeader}, Admin: ${perms.isAdmin}`);
        
        // For development/debugging: allow if ICT, Leader, OR explicitly Admin
        return perms.isICT || perms.isLeader || perms.isAdmin;
    } catch (error) {
        console.error('[ImpersonationUtils] Failed to check permissions:', error);
        return false;
    }
}

/**
 * Performs the actual user swap in the session object based on a Directus token.
 */
export async function performImpersonationSwap(
    session: ExtendedSession, 
    testToken: string
): Promise<ExtendedSession> {
    const directusUrl = process.env.DIRECTUS_SERVICE_URL;
    if (!directusUrl) return session;

    try {
        console.log(`[ImpersonationUtils] Starting swap. Target token: ${testToken.substring(0, 5)}...`);
        if (!directusUrl) {
            console.error('[ImpersonationUtils] DIRECTUS_SERVICE_URL is missing!');
            return session;
        }

        const testClient = createDirectus(directusUrl)
            .with(staticToken(testToken))
            .with(rest());

        console.log(`[ImpersonationUtils] Fetching target user info from ${directusUrl}...`);
        const targetUserRes = await testClient.request(readMe({
            fields: ['id', 'first_name', 'last_name', 'email', 'avatar']
        } as never)) as any;

        if (!targetUserRes?.id) {
            console.warn('[ImpersonationUtils] Target user not found or token invalid.');
            return session;
        }

        // DATABASE FALLBACK for user details
        const { rows: dbUserRows } = await query(
            `SELECT first_name, last_name, email, avatar FROM directus_users WHERE id = $1`,
            [targetUserRes.id]
        );
        const dbUser = dbUserRows[0] || {};

        const targetEmail = targetUserRes.email || dbUser.email || `user-${targetUserRes.id.substring(0, 8)}@salvemundi.local`;
        const targetFirstName = targetUserRes.first_name || dbUser.first_name || '';
        const targetLastName = targetUserRes.last_name || dbUser.last_name || '';
        const targetName = `${targetFirstName} ${targetLastName}`.trim() || targetEmail;

        console.log(`[ImpersonationUtils] Swapping to user: ${targetName} (${targetEmail})`);

        const { rows: targetCommittees } = await query(
            `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
             FROM committee_members m 
             JOIN committees c ON m.committee_id = c.id 
             WHERE m.user_id = $1`,
            [targetUserRes.id]
        );

        const targetPerms = getPermissions(targetCommittees);
        
        // Deep clone session to avoid side effects
        const sessionWithImpersonation = JSON.parse(JSON.stringify(session)) as ExtendedSession;
        
        // Store original admin context
        sessionWithImpersonation.impersonatedBy = {
            id: session.user.id,
            name: session.user.name || session.user.email,
            email: session.user.email,
            isNormallyAdmin: true
        };

        // Swap user
        sessionWithImpersonation.user = {
            ...session.user,
            id: targetUserRes.id,
            email: targetEmail,
            name: targetName,
            image: targetUserRes.avatar ? `${directusUrl}/assets/${targetUserRes.avatar}` : null,
            ...targetPerms,
            committees: targetCommittees,
            impersonated: true
        };

        // CRITICAL: Also swap the userId in the session object itself 
        // to ensure DB queries using session.userId find the target user.
        sessionWithImpersonation.session.userId = targetUserRes.id;

        console.log('[ImpersonationUtils] Swap successful!');
        return sessionWithImpersonation;
    } catch (error) {
        console.error('[ImpersonationUtils] Swap failed with error:', error instanceof Error ? error.message : 'Unknown error');
        return session;
    }
}

/**
 * Standard session enrichment (permissions, committees) for normal users.
 */
export async function enrichSession(session: ExtendedSession): Promise<ExtendedSession> {
    try {
        const { rows } = await query(
            `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
             FROM committee_members m 
             JOIN committees c ON m.committee_id = c.id 
             WHERE m.user_id = $1`,
            [session.user.id]
        );

        const perms = getPermissions(rows);
        const enrichedSession = JSON.parse(JSON.stringify(session)) as ExtendedSession;
        enrichedSession.user = {
            ...session.user,
            ...perms,
            committees: rows
        };

        return enrichedSession;
    } catch (error) {
        console.error('[ImpersonationUtils] Enrichment failed:', error);
        return session;
    }
}
