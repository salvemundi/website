import { z } from 'zod';
import { query } from '@/lib/database';
import { type Committee, committeeSchema } from '@salvemundi/validations/schema/committees.zod';

export const eventSignupSchema = z.object({
    id: z.number(),
    event_id: z.number(),
    participant_name: z.string().nullable().optional(),
    participant_email: z.string().nullable().optional(),
    participant_phone: z.string().nullable().optional(),
    checked_in: z.boolean().default(false),
    checked_in_at: z.string().nullable().optional(),
    qr_token: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
});

export const pubCrawlTicketSchema = z.object({
    id: z.number(),
    signup_id: z.number(),
    name: z.string(),
    qr_token: z.string().nullable().optional(),
    checked_in: z.boolean().default(false),
    checked_in_at: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
});

export type EventSignup = z.infer<typeof eventSignupSchema>;
export type PubCrawlTicket = z.infer<typeof pubCrawlTicketSchema>;

/**
 * Fetches all committees for a user.
 */
export async function fetchUserCommittees(userId: string): Promise<Committee[]> {
    const { rows } = await query(
        `SELECT c.id, c.name, c.image, c.is_visible, c.short_description, c.description, c.email
         FROM committees c
         JOIN committee_members cm ON cm.committee_id = c.id
         WHERE cm.user_id = $1`,
        [userId]
    );

    const parsed = committeeSchema.array().safeParse(rows ?? []);
    if (!parsed.success) {
        
        return [];
    }

    return parsed.data;
}

/**
 * Fetches an event signup by its QR token using a fast SQL query.
 */
export async function fetchEventSignupByQrToken(qrToken: string): Promise<EventSignup | null> {
    const { rows } = await query(
        'SELECT id, event_id, participant_name, participant_email, participant_phone, checked_in, checked_in_at, qr_token FROM event_signups WHERE qr_token = $1 LIMIT 1',
        [qrToken]
    );

    if (!rows || rows.length === 0) return null;

    const parsed = eventSignupSchema.safeParse(rows[0]);
    if (!parsed.success) {
        
        return null;
    }

    return parsed.data;
}

/**
 * Fetches all signups for an event with check-in status.
 */
export async function fetchEventSignupsWithCheckInStatus(eventId: number | string): Promise<EventSignup[]> {
    const { rows } = await query(
        `SELECT id, event_id, participant_name, participant_email, participant_phone, checked_in, checked_in_at, created_at, qr_token 
         FROM event_signups 
         WHERE event_id = $1 
         ORDER BY checked_in_at DESC, created_at DESC`,
        [eventId]
    );

    const parsed = eventSignupSchema.array().safeParse(rows ?? []);
    if (!parsed.success) {
        
        return [];
    }

    return parsed.data;
}

/**
 * Checks if a user is a member of the committee that owns the event.
 */
export async function isUserInEventCommittee(userId: string, eventId: number | string): Promise<boolean> {
    const { rows } = await query(
        `SELECT cm.id 
         FROM committee_members cm
         JOIN events e ON e.committee_id = cm.committee_id
         WHERE cm.user_id = $1 AND e.id = $2`,
        [userId, eventId]
    );
    return rows.length > 0;
}

/**
 * Checks if a user is an attendance officer for an event.
 * Note: attendance_officers is a M2M table in Directus.
 */
export async function isUserAttendanceOfficer(userId: string, eventId: number | string): Promise<boolean> {
    const { rows } = await query(
        `SELECT id FROM events_directus_users 
         WHERE events_id = $1 AND directus_users_id = $2`,
        [eventId, userId]
    );
    return rows.length > 0;
}

/**
 * Fetches a Pub Crawl ticket by its QR token.
 */
export async function fetchPubCrawlTicketByQrToken(qrToken: string): Promise<PubCrawlTicket | null> {
    const { rows } = await query(
        'SELECT id, signup_id, name, qr_token, checked_in, checked_in_at FROM pub_crawl_tickets WHERE qr_token = $1 LIMIT 1',
        [qrToken]
    );

    if (!rows || rows.length === 0) return null;

    const parsed = pubCrawlTicketSchema.safeParse(rows[0]);
    if (!parsed.success) {
        
        return null;
    }

    return parsed.data;
}

/**
 * Fetches all tickets for a Pub Crawl event.
 */
export async function fetchPubCrawlTicketsByEvent(eventId: number | string): Promise<PubCrawlTicket[]> {
    const { rows } = await query(
        `SELECT t.id, t.signup_id, t.name, t.qr_token, t.checked_in, t.checked_in_at, t.created_at 
         FROM pub_crawl_tickets t
         JOIN pub_crawl_signups s ON s.id = t.signup_id
         WHERE s.pub_crawl_event_id = $1
         ORDER BY t.created_at DESC`,
        [eventId]
    );

    const parsed = pubCrawlTicketSchema.array().safeParse(rows ?? []);
    if (!parsed.success) {
        
        return [];
    }

    return parsed.data;
}
