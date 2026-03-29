'use server';

import { 
    activiteitenSchema, 
    type Activiteit, 
    EVENT_FIELDS, 
    EVENT_SIGNUP_FIELDS, 
    TRANSACTION_FIELDS, 
    PUB_CRAWL_SIGNUP_FIELDS, 
    type DbTransaction,
    type DbEventSignup
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { cache } from 'react';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { checkAdminAccess } from './activiteit-utils';

export const getActivities = cache(async (): Promise<Activiteit[]> => {
    try {
        const events = await getSystemDirectus().request(readItems('events', {
            fields: [
                ...EVENT_FIELDS,
                { committee_id: ['name'] }
            ] as unknown /* TODO: REVIEW-ANY */, // Cast required for nested fields support in Directus SDK
            filter: { status: { _eq: 'published' } },
            limit: -1
        }));

        const mappedData = events.map((item) => ({
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            registration_deadline: item.registration_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
            committee_name: typeof item.committee_id === 'object' ? (item.committee_id as unknown /* TODO: REVIEW-ANY */)?.name || null : null,
        }));

        const parsed = activiteitenSchema.safeParse(mappedData);
        if (!parsed.success) {
            console.error('[Activities] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[Activities] Fetch failed:', error);
        return [];
    }
});

export const getActivityById = cache(async (id: string): Promise<Activiteit | null> => {
    try {
        const items = await getSystemDirectus().request((readItems('events', {
            fields: [
                ...EVENT_FIELDS,
                { committee_id: ['id', 'name'] }
            ] as unknown /* TODO: REVIEW-ANY */, // Cast required for nested fields support in Directus SDK
            filter: { id: { _eq: id } },
            limit: 1
        })));
        
        const item = items?.[0];
        if (!item) return null;

        const mapped = {
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            registration_deadline: item.registration_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
            committee_name: typeof item.committee_id === 'object' ? (item.committee_id as unknown /* TODO: REVIEW-ANY */)?.name || null : null,
        };

        const parsed = activiteitenSchema.element.safeParse(mapped);
        return parsed.success ? parsed.data : null;
    } catch (error) {
        console.error('[Activities] Fetch by ID failed:', error);
        return null;
    }
});

export async function getActivitySignups(eventId: string) {
    const session = await checkAdminAccess();
    if (!session) return [];
    
    try {
        return await getSystemDirectus().request(readItems('event_signups', {
            filter: { event_id: { _eq: eventId } },
            fields: EVENT_SIGNUP_FIELDS as unknown /* TODO: REVIEW-ANY */
        })) as unknown as DbEventSignup[];
    } catch (error) {
        console.error(`[Activities] Error fetching signups for ${eventId}:`, error);
        return [];
    }
}

export async function getSignupStatus(id?: string, transactionId?: string) {
    if (transactionId) {
        try {
            const transactions = await getSystemDirectus().request(readItems('transactions', {
                fields: TRANSACTION_FIELDS,
                filter: { id: { _eq: transactionId } },
                limit: 1
            })) as unknown as DbTransaction[]; // Forced cast to satisfy compiler overlap checks with SDK return type
            
            const trans = transactions?.[0];

            if (!trans) return { status: 'error' };

            // Use explicit comparison with product_type, which is now correctly recognized via DbTransaction
            if (trans.product_type === 'event_signup') {
                const signups = await getSystemDirectus().request(readItems('event_signups', {
                    fields: ['id', 'payment_status', 'participant_name', { event_id: ['id', 'name'] }] as unknown /* TODO: REVIEW-ANY */,
                    filter: { id: { _eq: trans.registration } },
                    limit: 1
                }));
                const signup = signups?.[0];
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (trans.product_type === 'pub_crawl_signup') {
                const signups = await getSystemDirectus().request(readItems('pub_crawl_signups', {
                    fields: [...PUB_CRAWL_SIGNUP_FIELDS, { pub_crawl_event_id: ['name'] }, { tickets: ['id', 'name', 'qr_token'] }] as unknown /* TODO: REVIEW-ANY */,
                    filter: { id: { _eq: trans.pub_crawl_signup } },
                    limit: 1
                }));
                const signup = signups?.[0];
                if (signup) {
                    // Inject ticket count for the UI overview
                    (signup as { amount_tickets?: number }).amount_tickets = (signup as { tickets?: unknown[] }).tickets?.length || 1;
                }
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (trans.product_type === 'membership') {
                return { status: trans.payment_status, transaction: trans, isMembership: true };
            } else if (trans.product_type === 'trip_signup') {
                return { status: trans.payment_status, transaction: trans, isTrip: true };
            }
            return { status: trans.payment_status, transaction: trans };
        } catch (e) {
            console.error('[Activities] Error resolving transaction:', e);
            return { status: 'error' };
        }
    } else if (id) {
        try {
            const signups = await getSystemDirectus().request(readItems('event_signups', {
                fields: [...EVENT_SIGNUP_FIELDS, { event_id: ['id', 'name'] }] as unknown /* TODO: REVIEW-ANY */,
                filter: { id: { _eq: id } },
                limit: 1
            }));
            const signup = signups?.[0];
            if (!signup) return { status: 'error' };
            return { status: signup.payment_status || 'open', signup };
        } catch (e) {
            console.error('[Activities] Error fetching signup status:', e);
            return { status: 'error' };
        }
    }

    return { status: 'error' };
}

export async function getMyTickets() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) return [];

    try {
        const query = {
            filter: {
                directus_relations: {
                    _eq: userId
                }
            },
            fields: [...EVENT_SIGNUP_FIELDS, { event_id: ['id', 'name', 'event_date', 'location'] }] as unknown /* TODO: REVIEW-ANY */,
            sort: ['-created_at']
        };
        
        // Explicitly cast query to any to bypass SDK internal tuple-widening issues with spread constants
        return await getSystemDirectus().request(readItems('event_signups', query as unknown /* TODO: REVIEW-ANY */)) as unknown as DbEventSignup[];
    } catch (error) {
        console.error('[Activities] Error fetching user tickets:', error);
        return [];
    }
}
