'use server';
import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { committeeSchema } from '@salvemundi/validations';

/**
 * PURE QUERIES: No and No headers() calls.
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
    const rows = await db.select().from(schema.committees).orderBy(schema.committees.name);
    
    // Validate each row against the schema
    return rows.map(i => {
        const parsed = committeeSchema.parse({
            ...i,
            id: Number(i.id) });
        return parsed;
    });
}

export async function getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    const rows = await db.select({
        directus_membership_id: schema.committee_members.id,
        is_leader: schema.committee_members.is_leader,
        user_id: schema.directus_users.id,
        entra_id: schema.directus_users.entra_id,
        first_name: schema.directus_users.first_name,
        last_name: schema.directus_users.last_name,
        email: schema.directus_users.email
    })
    .from(schema.committee_members)
    .innerJoin(schema.directus_users, eq(schema.committee_members.user_id, schema.directus_users.id))
    .where(eq(schema.committee_members.committee_id, Number(committeeId)));

    return rows.map((r) => adminCommitteeMemberSchema.parse({
        directusMembershipId: r.directus_membership_id,
        entraId: r.entra_id || r.user_id,
        displayName: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email,
        email: r.email || '',
        isLeader: r.is_leader || false }));
}

export async function countUniqueCommitteeMembers(): Promise<number> {
    const result = await db.select({
        count: sql<number>`count(distinct ${schema.committee_members.user_id})`
    })
    .from(schema.committee_members)
    .where(isNotNull(schema.committee_members.user_id));
    
    return Number(result[0]?.count || 0);
}
