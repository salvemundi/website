import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, desc, asc, ilike } from 'drizzle-orm';
import { type PubCrawlSignup, type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';
import { type EnrichedPubCrawlSignup } from './kroegentocht-types';
import { safeConsoleError } from '@/server/utils/logger';

export async function fetchPubCrawlSignupsDb(eventId: number): Promise<(PubCrawlSignup & { participants: { name: string, initial: string }[] })[]> {
    const rows = await db.select().from(schema.pub_crawl_signups).where(eq(schema.pub_crawl_signups.pub_crawl_event_id, eventId)).orderBy(desc(schema.pub_crawl_signups.id)).limit(1000);

    return rows.map(raw => {
        let participants: { name: string, initial: string }[] = [];

        if (raw.name_initials) {
            if (Array.isArray(raw.name_initials)) {
                participants = raw.name_initials as { name: string, initial: string }[];
            } else if (typeof raw.name_initials === 'string') {
                try {
                    const parsed = JSON.parse(raw.name_initials) as unknown;
                    participants = Array.isArray(parsed) ? (parsed as { name: string, initial: string }[]) : [(parsed as { name: string, initial: string })];
                } catch (error) {
                    safeConsoleError('[signup-db.utils.ts][fetchPubCrawlSignupsDb] JSON parse error', error);
                }
            } else if (typeof raw.name_initials === 'object') {
                participants = [(raw.name_initials as { name: string, initial: string })];
            }
        }

        return {
            ...raw,
            id: Number(raw.id),
            participants
        };
    }) as unknown as (PubCrawlSignup & { participants: { name: string, initial: string }[] })[];
}

export async function fetchPubCrawlSignupByIdDb(signupId: number): Promise<EnrichedPubCrawlSignup | null> {
    const rows = await db.select({
        s: schema.pub_crawl_signups,
        e: schema.pub_crawl_events
    }).from(schema.pub_crawl_signups)
      .innerJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
      .where(eq(schema.pub_crawl_signups.id, signupId))
      .limit(1);

    if (rows.length === 0) return null;

    const signup = rows[0].s;
    const event = rows[0].e;
    
    const ticketRows = await db.select().from(schema.pub_crawl_tickets).where(eq(schema.pub_crawl_tickets.signup_id, Number(signup.id))).orderBy(asc(schema.pub_crawl_tickets.id));

    let participants: { name: string, initial: string }[] = [];
    if (signup.name_initials) {
        if (Array.isArray(signup.name_initials)) {
            participants = signup.name_initials as { name: string, initial: string }[];
        } else if (typeof signup.name_initials === 'string') {
            try {
                const parsed = JSON.parse(signup.name_initials) as unknown;
                participants = Array.isArray(parsed) ? (parsed as { name: string, initial: string }[]) : [(parsed as { name: string, initial: string })];
            } catch (error) {
                safeConsoleError('[signup-db.utils.ts][fetchPubCrawlSignupByIdDb] Error parsing name_initials:', error);
            }
        } else if (typeof signup.name_initials === 'object') {
            participants = [(signup.name_initials as { name: string, initial: string })];
        }
    }

    const tickets: PubCrawlTicket[] = ticketRows.map((t, i) => {
        const p = participants.find((_, idx) => idx === i);
        return {
            id: Number(t.id),
            signup_id: t.signup_id ?? 0,
            qr_token: t.qr_token || '',
            checked_in: !!t.checked_in,
            checked_in_at: t.checked_in_at ? String(t.checked_in_at) : null,
            created_at: t.created_at ? String(t.created_at) : null,
            updated_at: t.updated_at ? String(t.updated_at) : null,
            name: p?.name || t.name || '',
            initial: p?.initial || t.initial || ''
        };
    });

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return {
        ...signup,
        id: Number(signup.id),
        pub_crawl_event_id: {
            id: event.id,
            name: event.name,
            date: event.date ? toLocalISOString(event.date) : undefined,
            description: event.description ?? undefined,
            image: event.image ?? undefined
        },
        tickets
    } as unknown as EnrichedPubCrawlSignup;
}

export async function fetchUserPubCrawlSignupsDb(email: string): Promise<EnrichedPubCrawlSignup[]> {
    const rows = await db.select({
        s: schema.pub_crawl_signups,
        e: schema.pub_crawl_events
    }).from(schema.pub_crawl_signups)
      .innerJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
      .where(ilike(schema.pub_crawl_signups.email, email))
      .orderBy(desc(schema.pub_crawl_signups.created_at));

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return rows.map(row => ({
        ...row.s,
        id: Number(row.s.id),
        pub_crawl_event_id: {
            id: row.e.id,
            name: row.e.name,
            date: row.e.date ? toLocalISOString(row.e.date) : undefined,
            description: row.e.description ?? undefined,
            image: row.e.image ?? undefined
        }
    })) as unknown as EnrichedPubCrawlSignup[];
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
    const result = await db.insert(schema.pub_crawl_signups).values({
        ...data,
        name_initials: data.name_initials ?? null,
        created_at: new Date().toISOString()
    }).returning({ id: schema.pub_crawl_signups.id });

    const id = result[0]?.id;
    if (!id) throw new Error('Insert failed');
    return Number(id);
}

export async function updatePubCrawlSignupDb(id: number, data: Partial<PubCrawlSignup>): Promise<void> {
    if (Object.keys(data).length === 0) return;
    await db.update(schema.pub_crawl_signups).set(data as NonNullable<unknown>).where(eq(schema.pub_crawl_signups.id, id));
}

export async function deletePubCrawlSignupDb(id: number): Promise<void> {
    await db.delete(schema.pub_crawl_signups).where(eq(schema.pub_crawl_signups.id, id));
}


