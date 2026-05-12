'use server';

import { 
    type Transaction,
    type WhatsAppGroup,
    type EventSignup,
    eventSignupSchema,
    transactionSchema,
    whatsappGroupSchema
} from '@salvemundi/validations/schema/profiel.zod';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';


import { getEnrichedSession } from '@/server/auth/auth-utils';

import { query } from '@/lib/database';
import { fetchUserPubCrawlSignupsDb } from './kroegentocht-db.utils';
import { fetchUserEventSignupsDb } from './event-db.utils';


export async function getUserEventSignups(): Promise<EventSignup[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const email = user?.email;
    if (!email) return [];

    const registrations = await fetchUserEventSignupsDb(email);
    // Ensure all registrations have an ID before parsing
    const validRegistrations = registrations.filter(r => r.id !== null);
    const parsed = eventSignupSchema.array().safeParse(validRegistrations);

    if (!parsed.success) {
        console.error('[ProfielActions] Failed to parse event signups:', parsed.error);
        throw new Error(`Failed to parse event signups: ${parsed.error.message}`);
    }

    return parsed.data;
}


export async function getUserPubCrawlSignups(): Promise<PubCrawlSignup[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const email = user?.email;
    if (!email) return [];

    return await fetchUserPubCrawlSignupsDb(email);
}


export async function getUserTransactions(): Promise<Transaction[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const targetUserId = user?.id;
    if (!targetUserId) return [];

    const res = await query(
        `SELECT * FROM transactions 
         WHERE user_id = $1 OR email = $2
         ORDER BY created_at DESC`,
        [targetUserId, user?.email || null]
    );

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    const mappedRows = res.rows.map(r => ({
        ...r,
        created_at: toLocalISOString(r.created_at),
        date_created: toLocalISOString(r.date_created),
        // SQL returns IDs (numbers) but Zod expects expanded objects.
        // Since the UI doesn't use these fields, we set them to null if they are just IDs.
        registration: typeof r.registration === 'object' ? r.registration : null,
        pub_crawl_signup: typeof r.pub_crawl_signup === 'object' ? r.pub_crawl_signup : null,
        trip_signup: typeof r.trip_signup === 'object' ? r.trip_signup : null
    }));

    const parsed = transactionSchema.array().safeParse(mappedRows);

    if (!parsed.success) {
        throw new Error(`Failed to parse transactions: ${parsed.error.message}`);
    }

    return parsed.data;
}


export async function getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    const session = await getEnrichedSession();
    if (!session?.user) return [];

    const res = await query(
        `SELECT id, name, invite_link, is_active 
         FROM whatsapp_groups 
         WHERE is_active = true 
         ORDER BY id ASC`
    );

    const parsed = whatsappGroupSchema.array().safeParse(res.rows);

    if (!parsed.success) {
        throw new Error(`Failed to parse WhatsApp groups: ${parsed.error.message}`);
    }

    return parsed.data;
}

