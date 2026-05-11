import { query } from "@/lib/database";
import { getPermissions } from "@/shared/lib/permissions";
import { createDirectus, rest, staticToken, readMe } from "@directus/sdk";
import { type ExtendedSession } from "@/types/auth";

/**
 * Validates if an admin user has the rights to impersonate others.
 */
export async function canUserImpersonate(userId: string): Promise<boolean> {
    try {
        const { rows } = await query(
            `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
             FROM committee_members m 
             JOIN committees c ON m.committee_id = c.id 
             WHERE m.user_id = $1`,
            [userId]
        );
        
        const perms = getPermissions(rows);
        return perms.isICT || perms.isLeader || perms.isAdmin;
    } catch (error) {
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
        const testClient = createDirectus(directusUrl)
            .with(staticToken(testToken))
            .with(rest());

        const targetUserRes = await testClient.request(readMe({
            fields: ['id', 'first_name', 'last_name', 'email', 'avatar']
        } as never)) as Record<string, unknown>;

        if (!targetUserRes?.id) {
            return session;
        }

        // DATABASE FALLBACK for user details
        const { rows: dbUserRows } = await query(
            `SELECT first_name, last_name, email, avatar FROM directus_users WHERE id = $1`,
            [targetUserRes.id]
        );
        const dbUser = dbUserRows[0] || {};

        const targetEmail = (targetUserRes.email as string) || (dbUser.email as string) || `user-${(targetUserRes.id as string).substring(0, 8)}@salvemundi.local`;
        const targetFirstName = (targetUserRes.first_name as string) || (dbUser.first_name as string) || '';
        const targetLastName = (targetUserRes.last_name as string) || (dbUser.last_name as string) || '';
        const targetName = `${targetFirstName} ${targetLastName}`.trim() || targetEmail;

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
            id: targetUserRes.id as string,
            email: targetEmail,
            name: targetName,
            image: targetUserRes.avatar ? `${directusUrl}/assets/${targetUserRes.avatar}` : null,
            ...targetPerms,
            committees: targetCommittees,
            impersonated: true
        };

        // CRITICAL: Also swap the userId in the session object itself 
        // to ensure DB queries using session.userId find the target user.
        sessionWithImpersonation.session.userId = targetUserRes.id as string;

        return sessionWithImpersonation;
    } catch (error) {
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
        return session;
    }
}
