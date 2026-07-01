import { AdminResource, RESOURCE_PERMISSIONS, COMMITTEES } from './permissions-config';

export interface Committee {
    id: number;
    name: string;
    azure_group_id?: string | null | undefined;
    is_leader?: boolean;
}

export interface UserPermissions {
    isAdmin: boolean;
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
    canAccessMail: boolean;
    canAccessWebshop: boolean;
}

export function hasPermission(committees: Committee[] = [], resource: AdminResource): boolean {
    const requirement = Reflect.get(RESOURCE_PERMISSIONS, resource) as typeof RESOURCE_PERMISSIONS[AdminResource];

    return committees.some(c => {
        const hasPermissionForGroup = !!(c.azure_group_id && requirement.allowedCommitteeIds.includes(c.azure_group_id));
        if (requirement.leaderOnly) {
            return hasPermissionForGroup && c.is_leader;
        }

        return hasPermissionForGroup;
    });

}

export function getPermissions(committees: Committee[] = []): UserPermissions {
    const isAdmin = hasPermission(committees, AdminResource.Intro);
    const isICT = hasPermission(committees, AdminResource.Sync);
    const isLeader = committees.some(c => c.is_leader && c.azure_group_id !== COMMITTEES.BESTUUR);

    return {
        isAdmin,
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
        canAccessMail: hasPermission(committees, AdminResource.Sync), // Proxying mail access to ICT/Sync for now
        canAccessWebshop: hasPermission(committees, AdminResource.Webshop),
    };
}
