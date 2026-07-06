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
import { db, schema } from '@salvemundi/db';
import { eq, or, desc } from 'drizzle-orm';
import { fetchUserEventSignupsDb } from '@/server/internal/activiteiten/activiteiten-db.utils';
import { fetchUserPubCrawlSignupsDb } from '@/server/internal/kroegentocht/kroegentocht-signup-db.utils';;
import { safeConsoleError } from '@/server/utils/logger';
import { type z } from 'zod';

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

    const res = await db.select().from(schema.transactions)
        .where(
            or(
                eq(schema.transactions.user_id, targetUserId),
                eq(schema.transactions.email, user.email)
            )
        )
        .orderBy(desc(schema.transactions.created_at));

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    const mappedRows = res.map(r => ({
        ...r,
        created_at: toLocalISOString(r.created_at),
        date_created: toLocalISOString(r.created_at),
        registration: isValidRelation(r.registration) ? r.registration : null,
        pub_crawl_signup: isValidRelation(r.pub_crawl_signup) ? r.pub_crawl_signup : null,
        trip_signup: isValidRelation(r.trip_signup) ? r.trip_signup : null
    }));

    return safeParseArray(transactionSchema, mappedRows, 'ProfielActions:Transactions');
}

export async function getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    const session = await getEnrichedSession();
    if (!session?.user) return [];

    const rows = await db.select({
        id: schema.whatsapp_groups.id,
        name: schema.whatsapp_groups.name,
        invite_link: schema.whatsapp_groups.invite_link,
        is_active: schema.whatsapp_groups.is_active
    }).from(schema.whatsapp_groups)
    .where(eq(schema.whatsapp_groups.is_active, true));

    return safeParseArray(whatsappGroupSchema, rows, 'ProfielActions:WhatsAppGroups');
}