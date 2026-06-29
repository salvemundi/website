import 'server-only';
import { z } from 'zod';
import { db, schema } from '@salvemundi/db';
import { eq, and, desc, sql, or, ilike, notIlike, inArray, notInArray } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';
import { safeConsoleError } from '@/server/utils/logger';

const SystemLogSchema = z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    payload: z.record(z.string(), z.unknown()),
    created_at: z.string(),
    acknowledged_at: z.string().nullable().optional()
});
export type SystemLog = z.infer<typeof SystemLogSchema>;

export async function getPendingSignupsInternal(): Promise<PendingSignup[]> {
    try {
        const rows = await db.select({
            mollie_id: schema.transactions.mollie_id,
            created_at: schema.transactions.created_at,
            email: schema.transactions.email,
            first_name: schema.transactions.first_name,
            last_name: schema.transactions.last_name,
            product_name: schema.transactions.product_name,
            amount: schema.transactions.amount,
            payment_status: schema.transactions.payment_status,
            approval_status: schema.transactions.approval_status,
            user_id: schema.transactions.user_id
        }).from(schema.transactions)
        .where(
            and(
                eq(schema.transactions.product_type, 'membership'),
                eq(schema.transactions.payment_status, 'paid'),
                eq(schema.transactions.approval_status, 'pending')
            )
        )
        .orderBy(desc(schema.transactions.created_at));

        const result: PendingSignup[] = rows.map((s) => ({
            id: s.mollie_id || '',
            created_at: s.created_at ? String(s.created_at) : new Date().toISOString(),
            email: s.email || '',
            first_name: s.first_name || '',
            last_name: s.last_name || '',
            product_name: s.product_name || '',
            amount: Number(s.amount ?? 0),
            approval_status: 'pending' as const,
            payment_status: s.payment_status || 'paid',
            type: s.user_id ? 'membership_renewal' as const : 'membership_new' as const
        }));

        return result;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][getPendingSignupsInternal] ', `Failed to fetch pending signups: ${typedError.message}`);
        throw error;
    }
}

export async function getSystemLogsInternal(limit: number = 50, source: 'admin' | 'system' = 'admin'): Promise<{ logs: SystemLog[]; totalCount: number }> {
    try {
        const legacyAdminTypes = [
            'impersonation_active',
            'impersonation_started',
            'impersonation_ended',
            'signup_approved',
            'signup_rejected',
            'activity_created',
            'activity_updated',
            'activity_deleted',
            'event_signup_manual_created',
            'membership_renewed',
            'member_profile_updated',
            'settings_change',
            'sticker_deleted'
        ];

        const filterCond = source === 'admin'
            ? or(ilike(schema.system_logs.type, 'admin_%'), inArray(schema.system_logs.type, legacyAdminTypes))
            : and(notIlike(schema.system_logs.type, 'admin_%'), notInArray(schema.system_logs.type, legacyAdminTypes));

        const [logsResult, countResult] = await Promise.all([
            db.select().from(schema.system_logs).where(filterCond).orderBy(desc(schema.system_logs.created_at)).limit(limit),
            db.select({ total: sql<number>`COUNT(*)` }).from(schema.system_logs).where(filterCond)
        ]);

        const logs: SystemLog[] = logsResult.map(r => {
            let parsedPayload: z.infer<typeof SystemLogSchema>['payload'] = {};

            if (typeof r.payload === 'string') {
                try {
                    parsedPayload = JSON.parse(r.payload) as z.infer<typeof SystemLogSchema>['payload'];
                } catch (parseError) {
                    safeConsoleError('[audit.queries.ts][getSystemLogsInternal] ', parseError);
                    parsedPayload = { error: 'Invalid JSON payload string' };
                }
            } else {
                parsedPayload = r.payload as z.infer<typeof SystemLogSchema>['payload'];
            }

            return SystemLogSchema.parse({
                id: r.id,
                type: r.type,
                status: r.status,
                created_at: r.created_at,
                acknowledged_at: r.acknowledged_at || null,
                payload: parsedPayload
            });
        });

        const totalCount = Number(countResult[0]?.total ?? 0);

        return { logs, totalCount };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][getSystemLogsInternal] ', `Failed to fetch system logs: ${typedError.message}`);
        throw error;
    }
}

export async function insertSystemLogInternal(data: {
    type: string,
    status: string,
    payload: unknown
}): Promise<void> {
    try {
        let payload = data.payload;
        if (JSON.stringify(payload).length > 20000) {
            payload = {
                error: 'Payload truncated due to size limit',
                original_type: data.type,
                truncated: true
            };
        }

        await db.insert(schema.system_logs).values({
            type: data.type,
            status: data.status,
            payload: payload,
            created_at: sql`NOW()`.mapWith(String)
        });
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][insertSystemLogInternal] ', `Failed to insert system log: ${typedError.message}`);
    }
}

export async function getIdNameLookupInternal(): Promise<Record<string, string>> {
    try {
        const committeesQ = db.select({
            key: sql<string>`'committee_' || ${schema.committees.id}::text`,
            name: sql<string>`COALESCE(${schema.committees.name}, '')`
        }).from(schema.committees);

        const eventsQ = db.select({
            key: sql<string>`'event_' || ${schema.events.id}::text`,
            name: sql<string>`COALESCE(${schema.events.name}, '')`
        }).from(schema.events);

        const tripsQ = db.select({
            key: sql<string>`'trip_' || ${schema.trips.id}::text`,
            name: sql<string>`COALESCE(${schema.trips.name}, '')`
        }).from(schema.trips);

        const usersQ = db.select({
            key: sql<string>`'user_' || ${schema.directus_users.id}::text`,
            name: sql<string>`COALESCE(NULLIF(TRIM(COALESCE(${schema.directus_users.first_name}, '') || ' ' || COALESCE(${schema.directus_users.last_name}, '')), ''), ${schema.directus_users.email})::text`
        }).from(schema.directus_users);

        const rows = await unionAll(committeesQ, eventsQ, tripsQ, usersQ);
        const lookup: Record<string, string> = {};
        for (const row of rows as { key: string; name: string }[]) {
            lookup[row.key] = row.name;
        }
        return lookup;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][getIdNameLookupInternal] ', `Failed to fetch ID name lookup: ${typedError.message}`);
        return {};
    }
}