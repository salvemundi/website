import 'server-only';
import { query } from '@/lib/database';
import { z } from 'zod';
import { committeeSchema } from '@salvemundi/validations';

/**
 * PURE QUERIES: No 'use server' and No headers() calls.
 * Safe to use in both Server Component renders and Server Actions.
 */

// Schema for the joined member results
const adminCommitteeMemberSchema = z.object({
    directusMembershipId: z.number().optional(),
    entraId: z.string(),
    displayName: z.string(),
    email: z.string(),
    isLeader: z.boolean() });

export type Committee = z.infer<typeof committeeSchema>;
export type CommitteeMember = z.infer<typeof adminCommitteeMemberSchema>;

export async function getCommittees(): Promise<Committee[]> {
    
    const { rows } = await query('SELECT * FROM committees ORDER BY name ASC');
    
    // Validate each row against the schema
    return rows.map(i => {
        const parsed = committeeSchema.parse({
            ...i,
            id: Number(i.id) });
        return parsed;
    });
}

export async function getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
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

    return rows.map((r) => adminCommitteeMemberSchema.parse({
        directusMembershipId: r.directus_membership_id,
        entraId: r.entra_id || r.user_id,
        displayName: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email,
        email: r.email || '',
        isLeader: r.is_leader || false }));
}

export async function countUniqueCommitteeMembers(): Promise<number> {
    
    const { rows } = await query('SELECT COUNT(DISTINCT user_id) as count FROM committee_members WHERE user_id IS NOT NULL');
    return Number(rows?.[0]?.count || 0);
}

