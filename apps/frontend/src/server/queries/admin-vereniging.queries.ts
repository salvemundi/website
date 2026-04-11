import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { 
    COMMITTEE_FIELDS, 
    COMMITTEE_MEMBER_FIELDS 
} from '@salvemundi/validations';

/**
 * PURE QUERIES: No 'use server' and No headers() calls.
 * Safe to use in both Server Component renders and Server Actions.
 */

export type Committee = {
    id: number;
    name: string;
    email?: string | null;
    azure_group_id?: string | null;
    description?: string | null;
    short_description?: string | null;
    image?: string | null;
};

export type CommitteeMember = {
    directusMembershipId?: number;
    entraId: string;
    displayName: string;
    email: string;
    isLeader: boolean;
};

export async function getCommitteesInternal(): Promise<Committee[]> {
    try {
        const items = await getSystemDirectus().request(readItems('committees', {
            limit: -1,
            fields: [...COMMITTEE_FIELDS],
            sort: ['name']
        }));
        return (items ?? []).map(i => ({
            ...i,
            id: Number(i.id),
            name: i.name || '',
        })) as Committee[];
    } catch (e) {
        
        return [];
    }
}

export async function getCommitteeMembersInternal(committeeId: string): Promise<CommitteeMember[]> {
    try {
        const items = await getSystemDirectus().request(readItems('committee_members' as any, {
            filter: { committee_id: { _eq: committeeId } },
            fields: [
                ...COMMITTEE_MEMBER_FIELDS,
                { user_id: ['id', 'entra_id', 'first_name', 'last_name', 'email'] }
            ] as any,
            limit: -1
        }));

        return (items ?? [])
            .filter((r: any) => r.user_id)
            .map((r: any) => ({
                directusMembershipId: r.id,
                entraId: r.user_id.entra_id || r.user_id.id,
                displayName: `${r.user_id.first_name || ''} ${r.user_id.last_name || ''}`.trim() || r.user_id.email,
                email: r.user_id.email || '',
                isLeader: r.is_leader || false,
            }));
    } catch (e) {
        
        return [];
    }
}

export async function getUniqueCommitteeMembersCountInternal(): Promise<number> {
    try {
        const memberships = await getSystemDirectus().request(readItems('committee_members' as any, {
            fields: ['user_id'] as any,
            limit: -1
        }));

        if (!memberships || !Array.isArray(memberships)) return 0;

        const uniqueUserIds = new Set(
            memberships
                .map((m: any) => m.user_id)
                .filter(id => id !== null && id !== undefined)
        );

        return uniqueUserIds.size;
    } catch (e) {
        
        return 0;
    }
}
