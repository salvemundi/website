import { query } from '@/lib/database';
import { buildUpdateQuery } from '@/lib/database/query-builder';
import { type DbEventSignup } from '@salvemundi/validations/directus/schema';

type QueryParam = string | number | boolean | object | null | undefined;

export type EnrichedEvent = {
    id: number;
    name: string;
    event_date?: string;
    description?: string;
    image?: string;
    contact?: string;
    location?: string;
};

export type EnrichedEventSignup = DbEventSignup & {
    event_id: EnrichedEvent;
};

// --- Strict database row typing ---
interface DbJoinedEventSignupRow extends Omit<DbEventSignup, 'event_id'> {
    event_id: number;
    event_name: string;
    event_date: string | Date | null;
    description: string | null;
    image: string | null;
    contact: string | null;
}
// ----------------------------------

/**
 * Event Operations
 */

export async function deleteEventDb(id: number): Promise<boolean> {
    try {
        const { rowCount } = await query(`DELETE FROM events WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    } catch (error: unknown) {
        console.error(`[EventDb] Failed to update event ${id}:`, error);
        return false;
    }
}

/**
 * Event Signup Operations
 */

export async function createEventSignupDb(data: Partial<DbEventSignup>): Promise<number | null> {
    try {
        const sql = `
            INSERT INTO event_signups (
                event_id, participant_name, participant_email, participant_phone,
                payment_status, qr_token, directus_relations, checked_in, checked_in_at,
                is_member
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) RETURNING id
        `;

        const params: QueryParam[] = [
            data.event_id,
            data.participant_name || null,
            data.participant_email || null,
            data.participant_phone || null,
            data.payment_status || 'open',
            data.qr_token || null,
            data.directus_relations || null,
            data.checked_in ? true : false,
            data.checked_in_at || null,
            data.is_member ? true : false
        ];

        const { rows } = await query(sql, params);
        return (rows[0] as { id?: number })?.id || null;
    } catch (error: unknown) {
        console.error('[EventDb] Failed to create event:', error);
        return null;
    }
}

export async function updateEventSignupDb(id: number, data: Partial<DbEventSignup>): Promise<boolean> {
    try {
        const allowedFields = ['payment_status', 'checked_in', 'checked_in_at', 'participant_name', 'participant_email', 'participant_phone', 'is_member'];
        const builder = buildUpdateQuery('event_signups', id, data, allowedFields);

        if (!builder) return true;

        const { rows } = await query(builder.sql, builder.params as QueryParam[]);
        return rows.length > 0;
    } catch (error: unknown) {
        console.error(`[EventDb] Failed to update event signup ${id}:`, error);
        return false;
    }
}

export async function deleteEventSignupDb(id: number): Promise<boolean> {
    try {
        const { rowCount } = await query(`DELETE FROM event_signups WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    } catch (error: unknown) {
        console.error(`[EventDb] Failed to update event ${id}:`, error);
        return false;
    }
}

/**
 * Fetches multiple event signups for a user (consistent with fetchUserEventSignupsDb)
 */
export async function fetchUserEventSignupsDb(email: string): Promise<EnrichedEventSignup[]> {
    try {
        const sql = `
            SELECT es.*, e.name as event_name, e.event_date, e.description, e.image, e.contact
            FROM event_signups es
            JOIN events e ON es.event_id = e.id
            WHERE LOWER(es.participant_email) = LOWER($1)
            ORDER BY e.event_date DESC
        `;
        const { rows } = await query(sql, [email]);
        const { toLocalISOString } = await import('@/lib/utils/date-utils');

        return (rows as DbJoinedEventSignupRow[]).map((row) => ({
            ...row,
            created_at: toLocalISOString(row.created_at),
            checked_in_at: toLocalISOString(row.checked_in_at),
            event_id: {
                id: row.event_id,
                name: row.event_name,
                event_date: toLocalISOString(row.event_date) ?? undefined,
                description: row.description ?? undefined,
                image: row.image ?? undefined,
                contact: row.contact ?? undefined
            }
        })) as unknown as EnrichedEventSignup[];
    } catch (error: unknown) {
        console.error('[EventDb] Failed to fetch user signups:', error);
        return [];
    }
}

/**
 * Fetches a single event signup by ID with event details.
 */
export async function fetchEventSignupByIdDb(id: number): Promise<EnrichedEventSignup | null> {
    try {
        const sql = `
            SELECT es.*, e.name as event_name, e.event_date, e.description, e.image, e.contact
            FROM event_signups es
            JOIN events e ON es.event_id = e.id
            WHERE es.id = $1
            LIMIT 1
        `;
        const { rows } = await query(sql, [id]);
        if (rows.length === 0) return null;

        const row = rows[0] as DbJoinedEventSignupRow;
        const { toLocalISOString } = await import('@/lib/utils/date-utils');
        return {
            ...row,
            created_at: toLocalISOString(row.created_at),
            checked_in_at: toLocalISOString(row.checked_in_at),
            event_id: {
                id: row.event_id,
                name: row.event_name,
                event_date: toLocalISOString(row.event_date) ?? undefined,
                description: row.description ?? undefined,
                image: row.image ?? undefined,
                contact: row.contact ?? undefined
            }
        } as unknown as EnrichedEventSignup;
    } catch (error: unknown) {
        console.error('[EventDb] Failed to fetch event signup:', error);
        return null;
    }
}