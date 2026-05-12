import { query } from '@/lib/database';
import { type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';
import { type DbPubCrawlTicketRow, type QueryParam } from './types';

/**
 * Fetches all tickets for a specific event.
 */
export async function fetchPubCrawlTicketsDb(eventId: number): Promise<PubCrawlTicket[]> {
    const res = await query(
        `SELECT t.* FROM pub_crawl_tickets t
             JOIN pub_crawl_signups s ON t.signup_id = s.id
             WHERE s.pub_crawl_event_id = $1`,
        [eventId]
    );

    return (res.rows as DbPubCrawlTicketRow[]).map(t => ({
        id: t.id,
        signup_id: t.signup_id,
        name: t.name,
        initial: t.initial,
        qr_token: t.qr_token,
        checked_in: !!t.checked_in,
        checked_in_at: t.checked_in_at ? String(t.checked_in_at) : null
    }));
}

export async function getPubCrawlTicketCountDb(eventId: number): Promise<number> {
    const res = await query(
        `SELECT SUM(amount_tickets) as total FROM pub_crawl_signups 
         WHERE pub_crawl_event_id = $1 AND payment_status = 'paid'`,
        [eventId]
    );
    const totalRaw = (res.rows[0] as { total?: string | null })?.total;
    return parseInt(totalRaw || '0', 10);
}

/**
 * Gets the total number of tickets sold for a specific user (by email) for a specific event.
 */
export async function getPubCrawlTicketCountByEmailDb(eventId: number, email: string): Promise<number> {
    const res = await query(
        `SELECT SUM(amount_tickets) as total FROM pub_crawl_signups 
         WHERE pub_crawl_event_id = $1 AND LOWER(email) = LOWER($2) AND payment_status != 'failed'`,
        [eventId, email]
    );
    const totalRaw = (res.rows[0] as { total?: string | null })?.total;
    return parseInt(totalRaw || '0', 10);
}

/**
 * Creates multiple tickets in a single batch.
 */
export async function createPubCrawlTicketsDb(signupId: number, tickets: { name: string, initial: string, qr_token: string }[]): Promise<void> {
    if (tickets.length === 0) return;

    try {
        const values: QueryParam[] = [];
        const placeHolders = tickets.map((t, i) => {
            const offset = i * 4;
            values.push(signupId, t.name, t.initial, t.qr_token);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, NOW())`;
        }).join(', ');

        await query(
            `INSERT INTO pub_crawl_tickets (signup_id, name, initial, qr_token, created_at)
             VALUES ${placeHolders}`,
            values
        );
    } catch (error) {
        throw error;
    }
}

export async function deletePubCrawlTicketsBySignupIdDb(signupId: number): Promise<void> {
    await query(`DELETE FROM pub_crawl_tickets WHERE signup_id = $1`, [signupId]);
}

export async function updatePubCrawlTicketDb(id: number, data: { name: string, initial: string }): Promise<void> {
    await query(
        `UPDATE pub_crawl_tickets SET name = $1, initial = $2 WHERE id = $3`,
        [data.name, data.initial, id]
    );
}
