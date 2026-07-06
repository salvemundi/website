import { AdminFeature, FEATURE_ACCESS, COMMITTEES } from './permissions-config';

export interface Committee {
    id: number;
    name: string;
    azure_group_id?: string | null | undefined;
    is_leader?: boolean;
}

const featureAccessMap = new Map<string, readonly string[]>(Object.entries(FEATURE_ACCESS));

export function canAccess(committees: Committee[] | undefined, feature: AdminFeature): boolean {
    if (!committees) return false;
    const isIct = committees.some(c => c.azure_group_id === COMMITTEES.ICT);
    if (isIct) return true;

    const allowed = featureAccessMap.get(feature);
    if (!allowed) return false;

    return committees.some(c => c.azure_group_id && allowed.includes(c.azure_group_id));
}

export function checkFeatureAccess(committees: Committee[] | undefined, feature: AdminFeature): { hasAccess: boolean; isLeader: boolean } {
    if (!committees) return { hasAccess: false, isLeader: false };
    const hasAccess = canAccess(committees, feature);
    const isLeader = committees.some(c => c.is_leader && c.azure_group_id !== COMMITTEES.BESTUUR);
    return { hasAccess, isLeader };
}

const resourceToFeature = new Map<string, AdminFeature>([
    ['admin:intro', 'intro'],
    ['admin:reis', 'reis'],
    ['admin:committees', 'commissies'],
    ['admin:coupons', 'coupons'],
    ['admin:stickers', 'stickers'],
    ['admin:logging', 'logging'],
    ['admin:sync', 'sync'],
    ['admin:users', 'leden'],
    ['admin:kroegentocht', 'kroegentocht'],
    ['admin:activities:view', 'activiteiten'],
    ['admin:activities:edit', 'activiteiten'],
    ['admin:webshop', 'webshop']
]);

export function hasPermission(committees: Committee[] | undefined, resource: string): boolean {
    const feature = resourceToFeature.get(resource);
    return feature ? canAccess(committees, feature) : false;
}

export function getPermissions(committees: Committee[] | undefined = []): string[] {
    const safeCommittees = committees;
    const isICT = safeCommittees.some(c => c.azure_group_id === COMMITTEES.ICT);
    const isLeader = safeCommittees.some(c => c.is_leader && c.azure_group_id !== COMMITTEES.BESTUUR);

    const permissions: string[] = [];

    const features: AdminFeature[] = [
        'intro', 'reis', 'logging', 'sync', 'coupons', 'stickers', 
        'kroegentocht', 'leden', 'commissies', 'activiteiten', 
        'webshop', 'impersonate', 'services'
    ];

    for (const feature of features) {
        if (canAccess(safeCommittees, feature)) {
            permissions.push(feature);
        }
    }

    if (isICT || (canAccess(safeCommittees, 'activiteiten') && isLeader)) {
        permissions.push('activiteiten:edit');
    }

    if (isICT) permissions.push('ict');
    if (isLeader) permissions.push('leader');

    return permissions;
}