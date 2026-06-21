'use server';

import {
    type Transaction,
    type WhatsAppGroup,
    type EventSignup,
    eventSignupSchema,
    transactionSchema,
    whatsappGroupSchema
} from '@salvemundi/validations/schema/profiel.zod';
import {
    enrichedPubCrawlSignupSchema,
    type EnrichedPubCrawlSignup
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { query } from '@/lib/database';
import { fetchUserEventSignupsDb } from '@/server/internal/event-db.utils';
import { fetchUserPubCrawlSignupsDb } from '@/server/internal/kroegentocht-db.utils';
import { safeConsoleError } from '@/server/utils/logger';
import { type z } from 'zod';

interface TransactionRow {
    id: string;
    user_id: string | null;
    email: string | null;
    created_at: string | Date;
    date_created: string | Date;
    registration: unknown;
    pub_crawl_signup: unknown;
    trip_signup: unknown;
    [key: string]: unknown;
}

interface WhatsAppGroupRow {
    id: number;
    name: string;
    invite_link: string;
    is_active: boolean;
}

function safeParseArray<T>(schema: z.Schema<T>, data: unknown[], context: string): T[] {
    const parsed = schema.array().safeParse(data);
    if (parsed.success) return parsed.data;

    safeConsoleError(`[profiel.actions.ts][safeParseArray] [Profiel Actions][safeParseArray][${context}] Data miste verplichte velden:`, {
            issues: parsed.error.issues,
            receivedData: data
        });
    return [];
}

const isValidRelation = (val: unknown): val is { id: unknown } => {
    return !!val && typeof val === 'object' && 'id' in val;
};

export async function getUserEventSignups(): Promise<EventSignup[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const email = user?.email;
    if (!email) return [];

    const registrations = await fetchUserEventSignupsDb(email);
    const validRegistrations = registrations;
    return safeParseArray(eventSignupSchema, validRegistrations, 'ProfielActions:EventSignups');
}

export async function getUserPubCrawlSignups(): Promise<EnrichedPubCrawlSignup[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const email = user?.email;
    if (!email) return [];

    const signups = await fetchUserPubCrawlSignupsDb(email);
    return safeParseArray<EnrichedPubCrawlSignup>(enrichedPubCrawlSignupSchema, signups, 'ProfielActions:PubCrawlSignups');
}

export async function getUserTransactions(): Promise<Transaction[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const targetUserId = user?.id;
    if (!targetUserId) return [];

    const res = await query<TransactionRow>(
        `SELECT * FROM transactions 
         WHERE user_id = $1 OR email = $2
         ORDER BY created_at DESC`,
        [targetUserId, user.email]
    );

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    const mappedRows = res.rows.map(r => ({
        ...r,
        created_at: toLocalISOString(r.created_at),
        date_created: toLocalISOString(r.date_created),
        registration: isValidRelation(r.registration) ? r.registration : null,
        pub_crawl_signup: isValidRelation(r.pub_crawl_signup) ? r.pub_crawl_signup : null,
        trip_signup: isValidRelation(r.trip_signup) ? r.trip_signup : null
    }));

    return safeParseArray(transactionSchema, mappedRows, 'ProfielActions:Transactions');
}

export async function getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    const session = await getEnrichedSession();
    if (!session?.user) return [];

    const res = await query<WhatsAppGroupRow>(
        `SELECT id, name, invite_link, is_active 
         FROM whatsapp_groups 
         WHERE is_active = true 
         ORDER BY id ASC`
    );

    return safeParseArray(whatsappGroupSchema, res.rows, 'ProfielActions:WhatsAppGroups');
}