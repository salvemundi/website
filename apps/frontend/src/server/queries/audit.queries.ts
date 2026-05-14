import 'server-only';
import { query } from '@/lib/database';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';
import { safeConsoleError } from '@/server/utils/logger';

export interface SystemLog {
    id: string;
    type: string;
    status: string;
    payload: Record<string, unknown>;
    created_at: string;
}

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
    payload: string | Record<string, unknown>;
    created_at: string | Date;
}

interface CountRow {
    total: number;
}

export async function getPendingSignupsInternal(): Promise<PendingSignup[]> {
    try {
        // Memberships (Transactions) — only type that needs manual approval
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
        safeConsoleError('[AuditQueries] Failed to fetch pending signups:', error);
        return [];
    }
}

export async function getSystemLogsInternal(limit: number = 50, source: 'admin' | 'system' = 'admin'): Promise<{ logs: SystemLog[]; totalCount: number }> {
    try {
        const filter = source === 'admin'
            ? "WHERE type NOT LIKE 'system_%'"
            : "WHERE type LIKE 'system_%'";

        const [logsResult, countResult] = await Promise.all([
            query(`SELECT * FROM system_logs ${filter} ORDER BY created_at DESC LIMIT $1`, [limit]),
            query(`SELECT COUNT(*)::int AS total FROM system_logs ${filter}`)
        ]);

        const logs: SystemLog[] = (logsResult.rows as SystemLogRow[]).map((r: SystemLogRow) => {
            let parsedPayload: Record<string, unknown> = {};

            if (typeof r.payload === 'string') {
                try {
                    parsedPayload = JSON.parse(r.payload) as Record<string, unknown>;
                } catch (_parseError) {
                    parsedPayload = { error: 'Invalid JSON payload string' };
                }
            } else if (r.payload && typeof r.payload === 'object') {
                parsedPayload = r.payload as Record<string, unknown>;
            }

            return {
                id: r.id,
                type: r.type,
                status: r.status,
                created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
                payload: parsedPayload
            };
        });

        const countRows = countResult.rows as CountRow[];
        const totalCount = countRows[0]?.total ?? 0;

        return { logs, totalCount };
    } catch (error: unknown) {
        safeConsoleError('[AuditQueries] Failed to fetch system logs:', error);
        return { logs: [], totalCount: 0 };
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
        safeConsoleError('[AuditQueries] Failed to insert system log:', error);
    }
}