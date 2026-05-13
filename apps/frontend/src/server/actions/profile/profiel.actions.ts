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
import { fetchUserEventSignupsDb } from '@/server/internal/event-db.utils';
import { fetchUserPubCrawlSignupsDb } from '@/server/internal/kroegentocht-db.utils';
import { type z } from 'zod';

/**
 * Helper to safely parse an array of items. 
 * If the whole array fails, it attempts to parse item by item to recover valid data.
 */
function safeParseArray<T>(schema: z.ZodType<T>, data: unknown[], context: string): T[] {
    const parsed = schema.array().safeParse(data);
    if (parsed.success) return parsed.data;

    console.error(`[${context}] Validation failed, attempting recovery:`, parsed.error);

    // Fallback: Parse item by item and filter out invalid ones
    return data.map(item => {
        const itemParsed = schema.safeParse(item);
        if (itemParsed.success) return itemParsed.data;
        console.warn(`[${context}] Skipping invalid item:`, itemParsed.error);
        return null;
    }).filter((item): item is T => item !== null);
}

export async function getUserEventSignups(): Promise<EventSignup[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const email = user?.email;
    if (!email) return [];

    const registrations = await fetchUserEventSignupsDb(email);
    // Ensure all registrations have an ID before parsing
    const validRegistrations = registrations.filter(r => r.id !== null);
    return safeParseArray(eventSignupSchema, validRegistrations, 'ProfielActions:EventSignups');
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
        // Handle potentially missing or incorrect nested objects in JSONB columns
        registration: (r.registration && typeof r.registration === 'object' && 'id' in r.registration) ? r.registration : null,
        pub_crawl_signup: (r.pub_crawl_signup && typeof r.pub_crawl_signup === 'object' && 'id' in r.pub_crawl_signup) ? r.pub_crawl_signup : null,
        trip_signup: (r.trip_signup && typeof r.trip_signup === 'object' && 'id' in r.trip_signup) ? r.trip_signup : null
    }));

    return safeParseArray(transactionSchema, mappedRows, 'ProfielActions:Transactions');
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

    return safeParseArray(whatsappGroupSchema, res.rows, 'ProfielActions:WhatsAppGroups');
}


