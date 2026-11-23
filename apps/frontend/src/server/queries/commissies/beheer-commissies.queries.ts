'use server';
import 'server-only';
import { db, schema } from '@salvemundi/db';
import { and, eq, isNotNull, sql } from 'drizzle-orm';

/**
 * PURE QUERIES: No auth and No headers() calls.
 * Safe to use in both Server Component renders and Server Actions.
 */

export type Committee = typeof schema.committees.$inferSelect;

export interface CommitteeMember {
    directusMembershipId?: number;
    entraId: string;
    displayName: string;
    email: string;
    isLeader: boolean;
}

export async function getCommittees(): Promise<Committee[]> {
    return await db.select().from(schema.committees).orderBy(schema.committees.name);
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

    return rows.map((r) => ({
        directusMembershipId: r.directus_membership_id,
        entraId: r.entra_id || r.user_id,
        displayName: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email || '',
        email: r.email || '',
        isLeader: Boolean(r.is_leader)
    }));
}

export async function countUniqueCommitteeMembers(): Promise<number> {
    const result = await db.select({
        count: sql<number>`count(distinct ${schema.committee_members.user_id})`
    })
    .from(schema.committee_members)
    .innerJoin(schema.committees, eq(schema.committee_members.committee_id, schema.committees.id))
    .where(
        and(
            isNotNull(schema.committee_members.user_id),
            eq(schema.committees.is_visible, true)
        )
    );

    return Number(result[0]?.count || 0);
}
