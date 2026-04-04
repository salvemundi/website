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
    console.log(`[DB-DIRECT-FETCH] AllPubCrawlEvents`);
    try {
        const res = await query(
            `SELECT * FROM pub_crawl_events ORDER BY date DESC LIMIT 100`,
            []
        );

        const items = (res.rows || []).map(raw => ({
            ...raw,
            price: 1, // Defaulting as seen in actions
            max_tickets_per_person: 10, // Defaulting as seen in actions
            show: raw.show !== false, // Default to true
        }));

        const parsed = z.array(pubCrawlEventSchema).safeParse(items);
        if (!parsed.success) {
            console.error('[KroegDbUtils#fetchPubCrawlEventsDb] Zod validation failed:', parsed.error.flatten().fieldErrors);
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
    console.log(`[DB-DIRECT-FETCH] PubCrawlSignups eventId: ${eventId}`);
    try {
        // Fetch signups
        const signupRes = await query(
            `SELECT * FROM pub_crawl_signups 
             WHERE pub_crawl_event_id = $1 
             ORDER BY id DESC LIMIT 1000`,
            [eventId]
        );

        if (signupRes.rowCount === 0) return [];

        const signupIds = signupRes.rows.map(r => r.id);

        // Fetch all tickets for these signups to populate participants
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

        // We don't strictly validate with pubCrawlSignupSchema here because of the extra 'participants' field,
        // but we can ensure the base fields match.
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
    console.log(`[DB-DIRECT-FETCH] PubCrawlSignupById id: ${signupId}`);
    try {
        const res = await query(
            `SELECT * FROM pub_crawl_signups WHERE id = $1 LIMIT 1`,
            [signupId]
        );

        if (res.rowCount === 0) return null;

        const signup = res.rows[0];

        // Fetch tickets
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
    console.log(`[DB-DIRECT-FETCH] PubCrawlTickets eventId: ${eventId}`);
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
