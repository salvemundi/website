'use server';

import {
    type Transaction,
    type WhatsAppGroup,
    type ProfileEventSignup,
    profileEventSignupSchema,
    transactionSchema,
    whatsappGroupSchema
} from '@salvemundi/validations/schema/profiel.zod';
import {
    enrichedPubCrawlSignupSchema,
    type EnrichedPubCrawlSignup
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import { calculateMembershipStatus } from '@/lib/profile/profile-admin.utils';
import { isCommitteeGroup } from '@/shared/lib/permissions';
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

export async function getUserEventSignups(): Promise<ProfileEventSignup[]> {
    const session = await getEnrichedSession();
    const user = session?.user;

    const email = user?.email;
    if (!email) return [];

    const registrations = await fetchUserEventSignupsDb(email);
    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    const formatted = registrations.map(r => ({
        ...r,
        created_at: toLocalISOString(r.created_at),
        checked_in_at: toLocalISOString(r.checked_in_at),
        event_id: r.event ? {
            id: r.event.id,
            name: r.event.name,
            event_date: toLocalISOString(r.event.event_date),
            description: r.event.description ?? null,
            image: r.event.image ?? null,
            contact: r.event.contact ?? null
        } : null
    }));
    return safeParseArray(profileEventSignupSchema, formatted, 'ProfielActions:EventSignups');
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
    if (session.user.membership_status !== 'active') return [];

    const rows = await db.select({
        id: schema.whatsapp_groups.id,
        name: schema.whatsapp_groups.name,
        invite_link: schema.whatsapp_groups.invite_link,
        is_active: schema.whatsapp_groups.is_active
    }).from(schema.whatsapp_groups)
    .where(eq(schema.whatsapp_groups.is_active, true));

    return safeParseArray(whatsappGroupSchema, rows, 'ProfielActions:WhatsAppGroups');
}

export interface ProfileViewDTO {
    first_name: string | null;
    last_name: string | null;
    email: string;
    fontys_email: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    minecraft_username: string | null;
    avatar: string | null;
    image: string | null;
    membership_status: string | null;
    membership_expiry: string | null;
    membershipBadge: {
        text: string;
        color: 'brand-light' | 'brand-filled' | 'error';
        textColor: 'brand' | 'white';
    };
    committees: {
        id: string | number;
        name: string;
        is_leader: boolean;
    }[];
}

export async function getMyProfileView(): Promise<ProfileViewDTO | null> {
    const { user } = await checkBeheerAccess();
    if (!user) return null;

    return {
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        email: user.email,
        fontys_email: user.fontys_email ?? null,
        phone_number: user.phone_number ?? null,
        date_of_birth: user.date_of_birth ?? null,
        minecraft_username: user.minecraft_username ?? null,
        avatar: user.avatar ?? null,
        image: user.image ?? null,
        membership_status: user.membership_status ?? null,
        membership_expiry: user.membership_expiry ?? null,
        membershipBadge: calculateMembershipStatus(user),
        committees: user.committees.filter(isCommitteeGroup).map((committee) => ({
            id: committee.id,
            name: committee.name,
            is_leader: 'is_leader' in committee ? Boolean(committee.is_leader) : false
        }))
    };
}