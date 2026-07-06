import { db, schema } from '@salvemundi/db';
import { eq, sql } from 'drizzle-orm';
import { safeConsoleError } from '../utils/logger.js';

export class DbService {
    static async getUserById(id: string) {
        const rows = await db.select().from(schema.directus_users).where(eq(schema.directus_users.id, id)).limit(1);
        return rows[0] || null;
    }

    static async getUserByEntraId(entraId: string) {
        const rows = await db.select().from(schema.directus_users).where(eq(schema.directus_users.entra_id, entraId)).limit(1);
        return rows[0] || null;
    }

    static async getUserByEmail(email: string) {
        const rows = await db.select()
            .from(schema.directus_users)
            .where(sql`LOWER(${schema.directus_users.email}) = ${email.toLowerCase()}`)
            .limit(1);
        return rows[0] || null;
    }

    static async updateUser(id: string, data: Partial<typeof schema.directus_users.$inferInsert>) {
        const result = await db.update(schema.directus_users)
            .set(data)
            .where(eq(schema.directus_users.id, id))
            .returning();
        return result[0];
    }

    static async createUser(data: typeof schema.directus_users.$inferInsert) {
        const result = await db.insert(schema.directus_users)
            .values(data)
            .returning();
        return result[0];
    }

    static async getCommitteeByAzureId(azureGroupId: string) {
        const rows = await db.select().from(schema.committees).where(eq(schema.committees.azure_group_id, azureGroupId)).limit(1);
        return rows[0] || null;
    }

    static async getAllCommittees() {
        return await db.select().from(schema.committees);
    }

    static async getCommitteeByName(name: string) {
        const rows = await db.select().from(schema.committees).where(eq(schema.committees.name, name)).limit(1);
        return rows[0] || null;
    }

    static async createCommittee(name: string) {
        const result = await db.insert(schema.committees).values({ name }).returning();
        return result[0];
    }

    static async getCommitteeMembers(userId: string) {
        return await db.select().from(schema.committee_members).where(eq(schema.committee_members.user_id, userId));
    }

    static async addMemberToCommittee(userId: string, committeeId: number, isLeader: boolean) {
        const result = await db.insert(schema.committee_members).values({
            user_id: userId,
            committee_id: committeeId,
            is_leader: isLeader,
            is_visible: true
        }).returning();
        return result[0];
    }

    static async updateCommitteeMember(id: number, data: Partial<typeof schema.committee_members.$inferInsert>) {
        const result = await db.update(schema.committee_members)
            .set(data)
            .where(eq(schema.committee_members.id, id))
            .returning();
        return result[0];
    }

    static async removeMemberFromCommittee(id: number) {
        await db.delete(schema.committee_members).where(eq(schema.committee_members.id, id));
    }

    static async getAllCommitteeMembers() {
        return await db.select().from(schema.committee_members);
    }

    static async getAllUsers() {
        return await db.select().from(schema.directus_users);
    }

    static async getUpcomingEvents(daysAhead: number) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysAhead);
        const dateStr = targetDate.toISOString().split('T')[0];

        return await db.select()
            .from(schema.events)
            .where(eq(schema.events.event_date, dateStr));
    }

    static async getPaidEventSignups(eventId: number) {
        return await db.select()
            .from(schema.event_signups)
            .where(
                sql`${schema.event_signups.event_id} = ${eventId} AND ${schema.event_signups.payment_status} = 'paid'`
            );
    }

    static async isFlagActive(key: string): Promise<boolean> {
        try {
            const rows = await db.select({ is_active: schema.feature_flags.is_active })
                .from(schema.feature_flags)
                .where(eq(schema.feature_flags.route_match, key))
                .limit(1);
            return rows[0] ? !!rows[0].is_active : false;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            safeConsoleError(`[db.service.ts][isFlagActive] Error checking flag ${key}:`, message);
            return false;
        }
    }
}
