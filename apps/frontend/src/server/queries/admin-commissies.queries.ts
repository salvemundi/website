import 'server-only';
import { query } from '@/lib/database';
import { cacheLife } from 'next/cache';

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

export async function getCommittees(): Promise<Committee[]> {
    'use cache';
    cacheLife('minutes');
    
    try {
        const { rows } = await query('SELECT * FROM committees ORDER BY name ASC');
        return rows.map(i => ({
            ...i,
            id: Number(i.id),
            name: i.name || '',
        })) as Committee[];
    } catch (e) {
        return [];
    }
}

export async function getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    try {
        const sql = `
            SELECT 
                cm.id as directus_membership_id,
                cm.is_leader,
                u.id as user_id,
                u.entra_id,
                u.first_name,
                u.last_name,
                u.email
            FROM committee_members cm
            INNER JOIN directus_users u ON cm.user_id = u.id
            WHERE cm.committee_id = $1
        `;
        const { rows } = await query(sql, [committeeId]);

        return rows.map((r) => ({
            directusMembershipId: r.directus_membership_id,
            entraId: r.entra_id || r.user_id,
            displayName: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email,
            email: r.email || '',
            isLeader: r.is_leader || false,
        }));
    } catch (e) {
        return [];
    }
}

export async function countUniqueCommitteeMembers(): Promise<number> {
    'use cache';
    cacheLife('hours');
    
    try {
        const { rows } = await query('SELECT COUNT(DISTINCT user_id) as count FROM committee_members WHERE user_id IS NOT NULL');
        return Number(rows?.[0]?.count || 0);
    } catch (e) {
        return 0;
    }
}
