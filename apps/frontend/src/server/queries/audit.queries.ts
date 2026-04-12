import { query } from '@/lib/database';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';

/**
 * SQL-First queries for Audit and Logging.
 * Bypasses Directus API for immediate consistency and better performance.
 */

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
        const { rows: memberships } = await query(membershipSql);

        const result: PendingSignup[] = memberships.map(s => ({
            id: s.mollie_id,
            created_at: s.created_at instanceof Date ? s.created_at.toISOString() : s.created_at,
            email: s.email,
            first_name: s.first_name,
            last_name: s.last_name,
            product_name: s.product_name,
            amount: parseFloat(s.amount || '0'),
            approval_status: 'pending' as const,
            payment_status: s.payment_status,
            type: s.user_id ? 'membership_renewal' as const : 'membership_new' as const
        }));

        return result;
    } catch (error) {
        console.error('[AuditQueries] Failed to fetch pending signups:', error);
        return [];
    }
}

export async function getSystemLogsInternal(limit: number = 50): Promise<{ logs: any[]; totalCount: number }> {
    try {
        const [logsResult, countResult] = await Promise.all([
            query(`SELECT * FROM system_logs ORDER BY created_at DESC LIMIT $1`, [limit]),
            query(`SELECT COUNT(*)::int AS total FROM system_logs`)
        ]);
        
        const logs = logsResult.rows.map(r => ({
            ...r,
            created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
            payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload
        }));

        return { logs, totalCount: countResult.rows[0]?.total ?? 0 };
    } catch (error) {
        console.error('[AuditQueries] Failed to fetch system logs:', error);
        return { logs: [], totalCount: 0 };
    }
}

export async function insertSystemLogInternal(data: {
    type: string,
    status: string,
    payload: any
}): Promise<void> {
    try {
        const sql = `
            INSERT INTO system_logs (type, status, payload, created_at)
            VALUES ($1, $2, $3, NOW())
        `;
        await query(sql, [data.type, data.status, JSON.stringify(data.payload)]);
    } catch (error) {
        console.error('[AuditQueries] Failed to insert system log:', error);
    }
}
