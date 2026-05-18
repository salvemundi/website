import 'server-only';
import { query } from '@/lib/database';
import { type PubCrawlSignup, type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';
import {
    type DbPubCrawlSignupRow,
    type DbPubCrawlTicketRow,
    type JoinedSignupRow,
    type EnrichedPubCrawlSignup,
    type QueryParam
} from './types';
import { safeConsoleError } from '@/server/utils/logger';

export async function fetchPubCrawlSignupsDb(eventId: number): Promise<(PubCrawlSignup & { participants: { name: string, initial: string }[] })[]> {
    const signupRes = await query<DbPubCrawlSignupRow>(
        `SELECT * FROM pub_crawl_signups WHERE pub_crawl_event_id = $1 ORDER BY id DESC LIMIT 1000`,
        [eventId]
    );

    return signupRes.rows.map(raw => {
        let participants: { name: string, initial: string }[] = [];

        if (raw.name_initials) {
            if (Array.isArray(raw.name_initials)) {
                participants = raw.name_initials as { name: string, initial: string }[];
            } else if (typeof raw.name_initials === 'string') {
                try {
                    const parsed = JSON.parse(raw.name_initials) as unknown;
                    participants = Array.isArray(parsed) ? (parsed as { name: string, initial: string }[]) : [(parsed as { name: string, initial: string })];
                } catch (_error: unknown) {
                }
            }
        }

        return {
            ...raw,
            participants
        };
    }) as unknown as (PubCrawlSignup & { participants: { name: string, initial: string }[] })[];
}

export async function fetchPubCrawlSignupByIdDb(signupId: number): Promise<EnrichedPubCrawlSignup | null> {
    const res = await query<JoinedSignupRow>(
        `SELECT s.*, e.name as event_name, e.date as event_date, e.description as event_description, e.image as event_image
         FROM pub_crawl_signups s
         JOIN pub_crawl_events e ON s.pub_crawl_event_id = e.id
         WHERE s.id = $1 
         LIMIT 1`,
        [signupId]
    );

    if (res.rowCount === 0) return null;

    const signup = res.rows[0];
    const ticketRes = await query<DbPubCrawlTicketRow>(
        `SELECT * FROM pub_crawl_tickets WHERE signup_id = $1 ORDER BY id ASC`,
        [signupId]
    );

    let participants: { name: string, initial: string }[] = [];
    if (signup.name_initials) {
        if (Array.isArray(signup.name_initials)) {
            participants = signup.name_initials as { name: string, initial: string }[];
        } else if (typeof signup.name_initials === 'string') {
            try {
                const parsed = JSON.parse(signup.name_initials) as unknown;
                participants = Array.isArray(parsed) ? (parsed as { name: string, initial: string }[]) : [(parsed as { name: string, initial: string })];
            } catch (error: unknown) {
                safeConsoleError(`[signup-db.utils.ts][fetchPubCrawlSignupByIdDb] Error parsing name_initials:`, error);
            }
        }
    }

    const tickets: PubCrawlTicket[] = ticketRes.rows.map((t, i) => {
        const p = participants.find((_, idx) => idx === i);
        return {
            id: t.id,
            signup_id: t.signup_id,
            qr_token: t.qr_token,
            checked_in: !!t.checked_in,
            checked_in_at: t.checked_in_at ? String(t.checked_in_at) : null,
            name: p?.name || t.name,
            initial: p?.initial || t.initial
        };
    });

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return {
        ...signup,
        pub_crawl_event_id: {
            id: signup.pub_crawl_event_id,
            name: signup.event_name,
            date: toLocalISOString(signup.event_date) ?? undefined,
            description: signup.event_description ?? undefined,
            image: signup.event_image ?? undefined
        },
        tickets
    } as unknown as EnrichedPubCrawlSignup;
}

export async function fetchUserPubCrawlSignupsDb(email: string): Promise<EnrichedPubCrawlSignup[]> {
    try {
        const res = await query<JoinedSignupRow>(
            `SELECT s.*, e.name as event_name, e.date as event_date, e.description as event_description, e.image as event_image
             FROM pub_crawl_signups s
             JOIN pub_crawl_events e ON s.pub_crawl_event_id = e.id
             WHERE LOWER(s.email) = LOWER($1)
             ORDER BY s.created_at DESC`,
            [email]
        );
        const { toLocalISOString } = await import('@/lib/utils/date-utils');
        return res.rows.map(row => ({
            ...row,
            pub_crawl_event_id: {
                id: row.pub_crawl_event_id,
                name: row.event_name,
                date: toLocalISOString(row.event_date) ?? undefined,
                description: row.event_description ?? undefined,
                image: row.event_image ?? undefined
            }
        })) as unknown as EnrichedPubCrawlSignup[];
    } catch (_error: unknown) {
        return [];
    }
}

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
        const res = await query<{ id: number }>(
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
    } catch (error: unknown) {
        throw error;
    }
}

export async function updatePubCrawlSignupDb(id: number, data: Partial<PubCrawlSignup>): Promise<void> {
    const keys = Object.keys(data);
    if (keys.length === 0) return;

    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data) as QueryParam[];

    await query<never>(
        `UPDATE pub_crawl_signups SET ${setClauses} WHERE id = $1`,
        [id, ...values]
    );
}

export async function deletePubCrawlSignupDb(id: number): Promise<void> {
    await query<never>(`DELETE FROM pub_crawl_signups WHERE id = $1`, [id]);
}