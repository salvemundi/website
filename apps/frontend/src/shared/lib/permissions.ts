import { AdminResource, RESOURCE_PERMISSIONS, COMMITTEES } from './permissions-config';

export interface Committee {
    id: number | string;
    name: string;
    azure_group_id?: string | null;
    is_leader?: boolean;
}

export interface UserPermissions {
    // isAdmin: boolean;
    isLeader: boolean;
    isICT: boolean;
    // Granular permissions
    canAccessIntro: boolean;
    canAccessReis: boolean;
    canAccessLogging: boolean;
    canAccessSync: boolean;
    canAccessCoupons: boolean;
    canAccessPermissions: boolean;
    canAccessStickers: boolean;
    canAccessKroegentocht: boolean;
    canAccessMembers: boolean;
    canAccessCommittees: boolean;
    canAccessActivitiesView: boolean;
    canAccessActivitiesEdit: boolean;
}

/**
 * Checks if a user has permission to access a specific resource.
 */
export function hasPermission(committees: Committee[] = [], resource: AdminResource): boolean {
    const requirement = RESOURCE_PERMISSIONS[resource];
    if (!requirement) return false;

    return committees.some(c => {
        // We exclusively use the azure_group_id (UUID) for authorization because 
        // administrative roles are linked to Entra ID groups, and numeric IDs 
        // are non-stable across environments.
        const hasPermissionForGroup = !!(c.azure_group_id && requirement.allowedCommitteeIds.includes(c.azure_group_id));

        // Certain restricted resources require the user to be a leader 
        // to prevent unauthorized actions by regular members.
        if (requirement.leaderOnly) {
            return hasPermissionForGroup && c.is_leader;
        }

        return hasPermissionForGroup;
    });

}


/**
 * Derives permissions from a list of committees.
 * This is the central source of truth for role-based access control.
 */
export function getPermissions(committees: Committee[] = []): UserPermissions {
    // Basic flags for backward compatibility or general navigation
    // const isAdmin = hasPermission(committees, AdminResource.Intro); 
    const isICT = hasPermission(committees, AdminResource.Sync); // Using Sync access as proxy for ICT-level access
    const isLeader = committees.some(c => c.is_leader && c.azure_group_id !== COMMITTEES.BESTUUR);

    return {
        // isAdmin,
        isLeader,
        isICT,
        canAccessIntro: hasPermission(committees, AdminResource.Intro),
        canAccessReis: hasPermission(committees, AdminResource.Reis),
        canAccessLogging: hasPermission(committees, AdminResource.Logging),
        canAccessSync: hasPermission(committees, AdminResource.Sync),
        canAccessCoupons: hasPermission(committees, AdminResource.Coupons),
        canAccessPermissions: hasPermission(committees, AdminResource.Permissions),
        canAccessStickers: hasPermission(committees, AdminResource.Stickers),
        canAccessKroegentocht: hasPermission(committees, AdminResource.Kroegentocht),
        canAccessMembers: hasPermission(committees, AdminResource.Users),
        canAccessCommittees: hasPermission(committees, AdminResource.Committees),
        canAccessActivitiesView: hasPermission(committees, AdminResource.ActivitiesView),
        canAccessActivitiesEdit: hasPermission(committees, AdminResource.ActivitiesEdit),
    };
}
