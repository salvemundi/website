import { query } from '@/lib/database';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';

/**
 * SQL-First queries for Audit and Logging.
 * Bypasses Directus API for immediate consistency and better performance.
 */

export async function getPendingSignupsInternal(): Promise<PendingSignup[]> {
    try {
        // 1. Memberships (Transactions)
        const membershipSql = `
            SELECT mollie_id, created_at, email, first_name, last_name, product_name, amount, payment_status, approval_status, user_id
            FROM transactions
            WHERE product_type = 'membership'
            AND payment_status = 'paid'
            AND approval_status = 'pending'
            ORDER BY created_at DESC
        `;
        const { rows: memberships } = await query(membershipSql);

        // 2. Events
        const eventSql = `
            SELECT es.*, e.name as product_name
            FROM event_signups es
            JOIN events e ON es.event_id = e.id
            WHERE es.payment_status = 'open'
            ORDER BY es.created_at DESC
        `;
        const { rows: events } = await query(eventSql);

        // 3. Pub Crawls
        const pubCrawlSql = `
            SELECT s.*, e.name as product_name
            FROM pub_crawl_signups s
            JOIN pub_crawl_events e ON s.pub_crawl_event_id = e.id
            WHERE s.payment_status = 'open'
            ORDER BY s.created_at DESC
        `;
        const { rows: pubCrawls } = await query(pubCrawlSql);

        // 4. Trips
        const tripSql = `
            SELECT s.*, e.name as product_name
            FROM trip_signups s
            JOIN trips e ON s.trip_id = e.id
            WHERE s.status = 'registered'
            ORDER BY s.created_at DESC
        `;
        const { rows: trips } = await query(tripSql);

        // Aggregate and Map to PendingSignup type
        const aggregated: PendingSignup[] = [
            ...memberships.map(s => ({
                id: s.mollie_id,
                created_at: s.created_at instanceof Date ? s.created_at.toISOString() : s.created_at,
                email: s.email,
                first_name: s.first_name,
                last_name: s.last_name,
                product_name: s.product_name,
                amount: parseFloat(s.amount || '0'),
                approval_status: 'pending' as const,
                payment_status: s.payment_status,
                type: (s.user_id ? 'membership_renewal' : 'membership_new') as any
            })),
            ...events.map(s => ({
                id: String(s.id),
                created_at: s.created_at instanceof Date ? s.created_at.toISOString() : s.created_at,
                email: s.participant_email,
                first_name: (s.participant_name || '').split(' ')[0],
                last_name: (s.participant_name || '').split(' ').slice(1).join(' '),
                product_name: s.product_name || 'Onbekend Event',
                amount: 0,
                approval_status: 'pending' as const,
                payment_status: s.payment_status,
                type: 'event' as const
            })),
            ...pubCrawls.map(s => ({
                id: String(s.id),
                created_at: s.created_at instanceof Date ? s.created_at.toISOString() : s.created_at,
                email: s.email,
                first_name: (s.name || '').split(' ')[0],
                last_name: (s.name || '').split(' ').slice(1).join(' '),
                product_name: s.product_name || 'Kroegentocht',
                amount: 0,
                approval_status: 'pending' as const,
                payment_status: s.payment_status,
                type: 'pub_crawl' as const
            })),
            ...trips.map(s => ({
                id: String(s.id),
                created_at: s.created_at instanceof Date ? s.created_at.toISOString() : s.created_at,
                email: s.email,
                first_name: s.first_name,
                last_name: s.last_name,
                product_name: s.product_name || 'Studiereis',
                amount: 0,
                approval_status: (s.approval_status || s.status) as any,
                payment_status: s.payment_status || 'open',
                type: 'trip' as const
            }))
        ];

        return aggregated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
        console.error('[AuditQueries] Failed to fetch pending signups:', error);
        return [];
    }
}

export async function getSystemLogsInternal(limit: number = 50): Promise<any[]> {
    try {
        const sql = `
            SELECT * FROM system_logs
            ORDER BY created_at DESC
            LIMIT $1
        `;
        const { rows } = await query(sql, [limit]);
        
        return rows.map(r => ({
            ...r,
            created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
            payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload
        }));
    } catch (error) {
        console.error('[AuditQueries] Failed to fetch system logs:', error);
        return [];
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
