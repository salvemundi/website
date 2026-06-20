import 'server-only';
import { z } from 'zod';
import { query } from '@/lib/database';
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

interface TransactionRow {
    mollie_id: string;
    created_at: string | Date;
    email: string;
    first_name: string;
    last_name: string;
    product_name: string;
    amount: string | null;
    payment_status: string;
    approval_status: string;
    user_id: string | null;
}

interface SystemLogRow {
    id: string;
    type: string;
    status: string;
    payload: string | { [key: string]: unknown };
    created_at: string | Date;
    acknowledged_at: string | Date | null;
}

interface CountRow {
    total: number;
}

export async function getPendingSignupsInternal(): Promise<PendingSignup[]> {
    try {
        const membershipSql = `
            SELECT mollie_id, created_at, email, first_name, last_name, product_name, amount, payment_status, approval_status, user_id
            FROM transactions
            WHERE product_type = 'membership'
            AND payment_status = 'paid'
            AND approval_status = 'pending'
            ORDER BY created_at DESC
        `;
        const { rows } = await query(membershipSql);
        const memberships = rows as TransactionRow[];

        const result: PendingSignup[] = memberships.map((s: TransactionRow) => ({
            id: s.mollie_id,
            created_at: s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at),
            email: s.email,
            first_name: s.first_name,
            last_name: s.last_name,
            product_name: s.product_name,
            amount: parseFloat(s.amount ?? '0'),
            approval_status: 'pending' as const,
            payment_status: s.payment_status,
            type: s.user_id ? 'membership_renewal' as const : 'membership_new' as const
        }));

        return result;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('audit.queries.ts][getPendingSignupsInternal]', `Failed to fetch pending signups: ${typedError.message}`);
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

        const filter = source === 'admin'
            ? `WHERE type LIKE 'admin_%' OR type = ANY($1)`
            : `WHERE type NOT LIKE 'admin_%' AND NOT (type = ANY($1))`;

        const logsFilter = source === 'admin'
            ? `WHERE type LIKE 'admin_%' OR type = ANY($2)`
            : `WHERE type NOT LIKE 'admin_%' AND NOT (type = ANY($2))`;

        const [logsResult, countResult] = await Promise.all([
            query(`SELECT * FROM system_logs ${logsFilter} ORDER BY created_at DESC LIMIT $1`, [limit, legacyAdminTypes]),
            query(`SELECT COUNT(*)::int AS total FROM system_logs ${filter}`, [legacyAdminTypes])
        ]);

        const logs: SystemLog[] = (logsResult.rows as SystemLogRow[]).map((r: SystemLogRow) => {
            let parsedPayload: z.infer<typeof SystemLogSchema>['payload'] = {};

            if (typeof r.payload === 'string') {
                try {
                    parsedPayload = JSON.parse(r.payload) as z.infer<typeof SystemLogSchema>['payload'];
                } catch (parseError) {
                    safeConsoleError('audit.queries.ts][getSystemLogsInternal]', parseError);
                    parsedPayload = { error: 'Invalid JSON payload string' };
                }
            } else {
                parsedPayload = r.payload as z.infer<typeof SystemLogSchema>['payload'];
            }

            return SystemLogSchema.parse({
                id: r.id,
                type: r.type,
                status: r.status,
                created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
                acknowledged_at: r.acknowledged_at ? (r.acknowledged_at instanceof Date ? r.acknowledged_at.toISOString() : String(r.acknowledged_at)) : null,
                payload: parsedPayload
            });
        });

        const countRows = countResult.rows as CountRow[];
        const totalCount = countRows[0]?.total ?? 0;

        return { logs, totalCount };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('audit.queries.ts][getSystemLogsInternal]', `Failed to fetch system logs: ${typedError.message}`);
        throw error;
    }
}

export async function insertSystemLogInternal(data: {
    type: string,
    status: string,
    payload: unknown
}): Promise<void> {
    try {
        let payloadStr = JSON.stringify(data.payload);

        if (payloadStr.length > 20000) {
            payloadStr = JSON.stringify({
                error: 'Payload truncated due to size limit',
                original_type: data.type,
                truncated: true
            });
        }

        const sql = `
            INSERT INTO system_logs (type, status, payload, created_at)
            VALUES ($1, $2, $3, NOW())
        `;
        await query(sql, [data.type, data.status, payloadStr]);
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('audit.queries.ts][insertSystemLogInternal]', `Failed to insert system log: ${typedError.message}`);
    }
}

export async function getIdNameLookupInternal(): Promise<Record<string, string>> {
    try {
        const sql = `
            SELECT 'committee_' || id::text AS key, name FROM committees
            UNION ALL
            SELECT 'event_' || id::text AS key, name FROM events
            UNION ALL
            SELECT 'trip_' || id::text AS key, name FROM trips
            UNION ALL
            SELECT 'user_' || id::text AS key, COALESCE(NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''), email)::text AS name FROM directus_users
        `;
        const { rows } = await query(sql);
        const lookup: Record<string, string> = {};
        for (const row of rows as { key: string; name: string }[]) {
            lookup[row.key] = row.name;
        }
        return lookup;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('audit.queries.ts][getIdNameLookupInternal]', `Failed to fetch ID name lookup: ${typedError.message}`);
        return {};
    }
}