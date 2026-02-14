'use server';

import { verifyAdminAccess } from '@/shared/lib/admin-only';
import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { User } from '@/shared/model/types/auth';

/**
 * Securely fetch ALL users for admin panel.
 * This action ensures only users with verified admin_access can execute it.
 */
export async function getAdminUsersList(page = 1, limit = 50): Promise<{ users: User[], total: number }> {
    const { isAuthorized } = await verifyAdminAccess();

    if (!isAuthorized) {
        throw new Error('Unauthorized: Admin access required.');
    }

    // Perform query as System Admin (no user token passed)
    const query = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
        sort: '-date_created',
        fields: 'id,email,first_name,last_name,role,admin_access,membership_status,membership_expiry',
        meta: 'filter_count'
    });

    try {
        const response = await serverDirectusFetch<{ data: any[], meta: { filter_count: number } }>(
            `/users?${query.toString()}`,
            { revalidate: 0 }
        );

        // Map raw Directus response to safe User objects
        const users = (response.data || []).map((u: any) => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            role: u.role,
            admin_access: u.admin_access,
            membership_status: u.membership_status,
            membership_expiry: u.membership_expiry,
            is_member: u.membership_status === 'active', // Simplified for list view
        } as User));

        return {
            users,
            total: response.meta?.filter_count || 0
        };
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        throw new Error('Failed to load users.');
    }
}

/**
 * Securely toggle admin access for a user.
 * This action ensures only existing admins can promote others.
 */
export async function toggleAdminAccessAction(targetUserId: string, grantAccess: boolean) {
    const { isAuthorized, user: currentUser } = await verifyAdminAccess();

    if (!isAuthorized) {
        throw new Error('Unauthorized: Admin access required.');
    }

    if (currentUser?.id === targetUserId) {
        throw new Error('Cannot modify your own admin access.');
    }

    try {
        await serverDirectusFetch(`/users/${targetUserId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                admin_access: grantAccess
            })
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to toggle admin access:', error);
        throw new Error('Failed to update user permissions.');
    }
}
