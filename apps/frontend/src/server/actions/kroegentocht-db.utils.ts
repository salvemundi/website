'use server';

import 'server-only';
import { query } from '@/lib/database';
import { 
    pubCrawlEventSchema, 
    pubCrawlSignupSchema, 
    pubCrawlTicketSchema,
    type PubCrawlEvent, 
    type PubCrawlSignup,
    type PubCrawlTicket
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { z } from 'zod';

/**
 * Fetches all pub crawl events.
 */
export async function fetchPubCrawlEventsDb(): Promise<PubCrawlEvent[]> {
    try {
        const res = await query(
            `SELECT * FROM pub_crawl_events ORDER BY date DESC LIMIT 100`,
            []
        );

        const items = (res.rows || []).map(raw => ({
            ...raw,
            date: raw.date instanceof Date ? raw.date.toISOString().split('T')[0] : raw.date,
            price: 1,
            max_tickets_per_person: 10,
            show: raw.show !== false,
        }));

        const parsed = z.array(pubCrawlEventSchema).safeParse(items);
        if (!parsed.success) return items as any;

        return parsed.data;
    } catch (error: any) {
        
        return [];
    }
}

/**
 * Fetches signups for a specific event.
 */
export async function fetchPubCrawlSignupsDb(eventId: number): Promise<(PubCrawlSignup & { participants: { name: string, initial: string }[] })[]> {
    try {
        const signupRes = await query(
            `SELECT * FROM pub_crawl_signups WHERE pub_crawl_event_id = $1 ORDER BY id DESC LIMIT 1000`,
            [eventId]
        );

        if (signupRes.rowCount === 0) return [];

        const signupIds = signupRes.rows.map(r => r.id);
        const ticketRes = await query(
            `SELECT signup_id, name, initial FROM pub_crawl_tickets WHERE signup_id = ANY($1::int[])`,
            [signupIds]
        );

        const ticketsBySignup = (ticketRes.rows || []).reduce((acc: any, t) => {
            if (!acc[t.signup_id]) acc[t.signup_id] = [];
            acc[t.signup_id].push({ name: t.name, initial: t.initial });
            return acc;
        }, {});

        return signupRes.rows.map(raw => ({
            ...raw,
            participants: ticketsBySignup[raw.id] || []
        })) as any;
    } catch (error: any) {
        
        return [];
    }
}

/**
 * Fetches a single signup by ID with event details.
 */
export async function fetchPubCrawlSignupByIdDb(signupId: number): Promise<any | null> {
    try {
        const res = await query(
            `SELECT s.*, e.name as event_name, e.date as event_date, e.description as event_description, e.image as event_image
             FROM pub_crawl_signups s
             JOIN pub_crawl_events e ON s.pub_crawl_event_id = e.id
             WHERE s.id = $1 
             LIMIT 1`,
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
            pub_crawl_event_id: {
                id: signup.pub_crawl_event_id,
                name: signup.event_name,
                date: signup.event_date,
                description: signup.event_description,
                image: signup.event_image
            },
            tickets: ticketRes.rows || []
        };
    } catch (error: any) {
        
        return null;
    }
}

/**
 * Fetches all tickets for a specific event.
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
    } catch (error: any) {
        
        return [];
    }
}

/**
 * Gets the total number of tickets sold for a specific event.
 */
export async function getPubCrawlTicketCountDb(eventId: number): Promise<number> {
    try {
        const res = await query(
            `SELECT SUM(amount_tickets) as total FROM pub_crawl_signups 
             WHERE pub_crawl_event_id = $1 AND payment_status = 'paid'`,
            [eventId]
        );
        return parseInt(res.rows[0]?.total || '0', 10);
    } catch (error: any) {
        
        return 0;
    }
}

/**
 * Fetches signups for a specific user.
 */
export async function fetchUserPubCrawlSignupsDb(email: string): Promise<any[]> {
    try {
        const res = await query(
            `SELECT s.*, e.name as event_name, e.date as event_date, e.description as event_description, e.image as event_image
             FROM pub_crawl_signups s
             JOIN pub_crawl_events e ON s.pub_crawl_event_id = e.id
             WHERE s.email = $1
             ORDER BY s.created_at DESC`,
            [email]
        );
        return (res.rows || []).map(row => ({
            ...row,
            pub_crawl_event_id: {
                id: row.pub_crawl_event_id,
                name: row.event_name,
                date: row.event_date,
                description: row.event_description,
                image: row.event_image
            }
        }));
    } catch (error: any) {
        
        return [];
    }
}

/**
 * Creates a new pub crawl signup.
 */
export async function createPubCrawlSignupDb(data: {
    name: string;
    email: string;
    association?: string;
    amount_tickets: number;
    name_initials?: string;
    pub_crawl_event_id: number;
    payment_status?: string;
    directus_relations?: string | null;
}): Promise<number> {
    try {
        const res = await query(
            `INSERT INTO pub_crawl_signups 
             (name, email, association, amount_tickets, name_initials, pub_crawl_event_id, payment_status, directus_relations, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             RETURNING id`,
            [
                data.name,
                data.email,
                data.association ?? null,
                data.amount_tickets,
                data.name_initials ?? null,
                data.pub_crawl_event_id,
                data.payment_status ?? 'open',
                data.directus_relations ?? null,
            ]
        );

        const id = res.rows[0]?.id;
        if (!id) throw new Error('Insert failed');
        return id;
    } catch (error: any) {
        
        throw error;
    }
}

/**
 * Creates multiple tickets in a single batch.
 */
export async function createPubCrawlTicketsDb(signupId: number, tickets: { name: string, initial: string, qr_token: string }[]): Promise<void> {
    if (tickets.length === 0) return;

    try {
        const values: any[] = [];
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
    } catch (error: any) {
        
        throw error;
    }
}

export async function deletePubCrawlTicketsBySignupIdDb(signupId: number): Promise<void> {
    await query(`DELETE FROM pub_crawl_tickets WHERE signup_id = $1`, [signupId]);
}

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

export async function deletePubCrawlSignupDb(id: number): Promise<void> {
    await query(`DELETE FROM pub_crawl_signups WHERE id = $1`, [id]);
}
