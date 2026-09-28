import { BeheerFeature, FEATURE_ACCESS, COMMITTEES } from './permissions-config';

export interface Committee {
    id: number;
    name: string;
    azure_group_id?: string | null | undefined;
    is_leader?: boolean;
}

const featureAccessMap = new Map<string, readonly string[]>(Object.entries(FEATURE_ACCESS));

export function canAccess(committees: Committee[] | undefined, feature: BeheerFeature): boolean {
    if (!committees) return false;
    const isIct = committees.some(c => c.azure_group_id === COMMITTEES.ICT);
    if (isIct) return true;

    const allowed = featureAccessMap.get(feature);
    if (!allowed) return false;

    return committees.some(c => c.azure_group_id && allowed.includes(c.azure_group_id));
}

export function checkFeatureAccess(committees: Committee[] | undefined, feature: BeheerFeature): { hasAccess: boolean; isLeader: boolean } {
    if (!committees) return { hasAccess: false, isLeader: false };

    const isIct = committees.some(c => c.azure_group_id === COMMITTEES.ICT);
    if (isIct) {
        return { hasAccess: true, isLeader: true };
    }

    const hasAccess = canAccess(committees, feature);
    if (!hasAccess) return { hasAccess: false, isLeader: false };

    const allowed = featureAccessMap.get(feature) || [];
    const isBestuur = committees.some(c => c.azure_group_id === COMMITTEES.BESTUUR && allowed.includes(COMMITTEES.BESTUUR));
    const isLeaderOfAllowedCommittee = committees.some(c => c.is_leader && c.azure_group_id && allowed.includes(c.azure_group_id));

    const isLeader = isBestuur || isLeaderOfAllowedCommittee;

    return { hasAccess, isLeader };
}

export function hasPermission(committees: Committee[] | undefined, feature: BeheerFeature): boolean {
    return canAccess(committees, feature);
}

export function getPermissions(committees: Committee[] = []): string[] {
    const safeCommittees = committees;
    const isICT = safeCommittees.some(c => c.azure_group_id === COMMITTEES.ICT);
    const isLeader = isICT || safeCommittees.some(c => c.is_leader);
    const permissions: string[] = [];
    const features = Object.keys(FEATURE_ACCESS) as BeheerFeature[];

    for (const feature of features) {
        if (canAccess(safeCommittees, feature)) {
            permissions.push(feature);
        }
    }

    if (checkFeatureAccess(safeCommittees, 'activiteiten').isLeader) {
        permissions.push('activiteiten:edit');
    }

    if (checkFeatureAccess(safeCommittees, 'vacatures').isLeader) {
        permissions.push('vacatures:edit');
    }

    if (isICT) permissions.push('ict');
    if (isLeader) permissions.push('leader');

    return permissions;
}