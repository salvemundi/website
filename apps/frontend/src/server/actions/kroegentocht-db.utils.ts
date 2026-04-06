'use server';

import 'server-only';
import { query } from '@/lib/db';
import { 
    pubCrawlEventSchema, 
    pubCrawlSignupSchema, 
    pubCrawlTicketSchema,
    type PubCrawlEvent, 
    type PubCrawlSignup,
    type PubCrawlTicket
} from '@salvemundi/validations';
import { z } from 'zod';

/**
 * Fetches all pub crawl events directly from the database to bypass caching.
 */
export async function fetchPubCrawlEventsDb(): Promise<PubCrawlEvent[]> {
    try {
        const res = await query(
            `SELECT * FROM pub_crawl_events ORDER BY date DESC LIMIT 100`,
            []
        );

        const items = (res.rows || []).map(raw => ({
            ...raw,
            price: 1,
            max_tickets_per_person: 10,
            show: raw.show !== false,
        }));

        const parsed = z.array(pubCrawlEventSchema).safeParse(items);
        if (!parsed.success) {
            return items as any as PubCrawlEvent[];
        }

        return parsed.data;
    } catch (error) {
        console.error('[KroegDbUtils#fetchPubCrawlEventsDb] Error:', error);
        return [];
    }
}

/**
 * Fetches all signups for a specific event directly from the database.
 */
export async function fetchPubCrawlSignupsDb(eventId: number): Promise<(PubCrawlSignup & { participants: { name: string, initial: string }[] })[]> {
    try {
        const signupRes = await query(
            `SELECT * FROM pub_crawl_signups 
             WHERE pub_crawl_event_id = $1 
             ORDER BY id DESC LIMIT 1000`,
            [eventId]
        );

        if (signupRes.rowCount === 0) return [];

        const signupIds = signupRes.rows.map(r => r.id);

        const ticketRes = await query(
            `SELECT signup_id, name, initial FROM pub_crawl_tickets 
             WHERE signup_id = ANY($1::int[])`,
            [signupIds]
        );

        const ticketsBySignup = (ticketRes.rows || []).reduce((acc: any, t) => {
            if (!acc[t.signup_id]) acc[t.signup_id] = [];
            acc[t.signup_id].push({ name: t.name, initial: t.initial });
            return acc;
        }, {});

        const items = signupRes.rows.map(raw => ({
            ...raw,
            participants: ticketsBySignup[raw.id] || []
        }));

        return items as any;
    } catch (error) {
        console.error('[KroegDbUtils#fetchPubCrawlSignupsDb] Error:', error);
        return [];
    }
}

/**
 * Fetches a single signup by ID directly from the database.
 */
export async function fetchPubCrawlSignupByIdDb(signupId: number): Promise<any | null> {
    try {
        const res = await query(
            `SELECT * FROM pub_crawl_signups WHERE id = $1 LIMIT 1`,
            [signupId]
        );

        if (res.rowCount === 0) return null;

        const signup = res.rows[0];

        const ticketRes = await query(
            `SELECT * FROM pub_crawl_tickets WHERE signup_id = $1 ORDER BY id ASC`,
            [signupId]
        );

        return {
            ...signup,
            tickets: ticketRes.rows || []
        };
    } catch (error) {
        console.error('[KroegDbUtils#fetchPubCrawlSignupByIdDb] Error:', error);
        return null;
    }
}

/**
 * Fetches all tickets for a specific event to get total counts.
 */
export async function fetchPubCrawlTicketsDb(eventId: number): Promise<PubCrawlTicket[]> {
    try {
        const res = await query(
            `SELECT t.* FROM pub_crawl_tickets t
             JOIN pub_crawl_signups s ON t.signup_id = s.id
             WHERE s.pub_crawl_event_id = $1`,
            [eventId]
        );

        return res.rows || [];
    } catch (error) {
        console.error('[KroegDbUtils#fetchPubCrawlTicketsDb] Error:', error);
        return [];
    }
}

/**
 * Creates a new pub crawl signup directly in the database.
 * Returns the created signup ID.
 */
export async function createPubCrawlSignupDb(data: {
    name: string;
    email: string;
    association?: string;
    amount_tickets: number;
    name_initials?: string;
    pub_crawl_event_id: number;
    payment_status?: string;
}): Promise<number> {
    const res = await query(
        `INSERT INTO pub_crawl_signups 
         (name, email, association, amount_tickets, name_initials, pub_crawl_event_id, payment_status, date_created)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
            data.name,
            data.email,
            data.association ?? null,
            data.amount_tickets,
            data.name_initials ?? null,
            data.pub_crawl_event_id,
            data.payment_status ?? 'open',
        ]
    );

    const id = res.rows[0]?.id;
    if (!id) throw new Error('Failed to create pub crawl signup in database');
    return id;
}

/**
 * Updates a pub crawl signup directly in the database.
 */
export async function updatePubCrawlSignupDb(id: number, data: Record<string, any>): Promise<void> {
    const keys = Object.keys(data);
    if (keys.length === 0) return;

    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = keys.map(k => data[k]);

    await query(
        `UPDATE pub_crawl_signups SET ${setClauses} WHERE id = $1`,
        [id, ...values]
    );
}

/**
 * Deletes a pub crawl signup directly from the database.
 */
export async function deletePubCrawlSignupDb(id: number): Promise<void> {
    await query(`DELETE FROM pub_crawl_signups WHERE id = $1`, [id]);
}
