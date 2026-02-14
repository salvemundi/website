import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { serverDirectusFetch } from './server-directus';

/**
 * Securely verifies if the current user has admin access.
 * This function performs a double-check against the database using the
 * server's admin token, ensuring that client-side session tampering cannot
 * grant unauthorized access.
 */
export async function verifyAdminAccess() {
    const user = await getCurrentUserAction();

    if (!user) {
        return { isAuthorized: false, user: null };
    }

    try {
        // Fetch strictly the admin_access flag and role using the System Admin Token
        // This request bypasses the user's own permissions and uses the server's privileges
        const adminCheck = await serverDirectusFetch<{ admin_access: boolean; role: string | null }>(
            `/users/${user.id}?fields=admin_access,role`,
            {
                // No Authorization header -> uses DIRECTUS_ADMIN_TOKEN automatically
                // Cache: 0 -> Always fetch fresh data from DB
                revalidate: 0,
            }
        );

        // Check if user has explicit admin_access flag OR is in the Admin Role
        // Note: You should configure ADMIN_ROLE_ID in your .env if you want role-based fallbacks
        const isAdmin =
            adminCheck.admin_access === true ||
            (adminCheck.role && adminCheck.role === process.env.ADMIN_ROLE_ID);

        return {
            isAuthorized: !!isAdmin,
            user
        };
    } catch (error) {
        console.error('[verifyAdminAccess] Verification failed:', error);
        return { isAuthorized: false, user };
    }
}

/**
 * Throws an error if the user is not an admin.
 * Use this at the start of Server Actions that perform sensitive operations.
 */
export async function requireAdmin() {
    const { isAuthorized } = await verifyAdminAccess();
    if (!isAuthorized) {
        throw new Error('Unauthorized: You do not have permission to perform this action.');
    }
}
