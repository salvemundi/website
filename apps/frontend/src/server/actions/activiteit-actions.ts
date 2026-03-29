'use server';

import { activiteitenSchema, type Activiteit, eventSignupFormSchema, type EventSignupForm, type DbTrip, EVENT_FIELDS, EVENT_SIGNUP_FIELDS, TRANSACTION_FIELDS, PUB_CRAWL_SIGNUP_FIELDS, eventSignupSchema, type DbTransaction, type DbEventSignup, type DbPubCrawlSignup, type DbTripSignup } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag, unstable_noStore as noStore } from 'next/cache';
import { cache } from 'react';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, updateItem } from '@directus/sdk';

const getFinanceServiceUrl = () =>
    process.env.FINANCE_SERVICE_URL;

const getMailServiceUrl = () =>
    process.env.MAIL_SERVICE_URL;

const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    });
}

async function checkAdminAccess() {
    const session = await getSession();
    if (!session || !session.user) return null;
    
    // Check if user has admin access based on committees or specific role
    const user = session.user as any; // Better-auth user object doesn't have all Directus fields typed yet
    const committees = user.committees || [];
    const { isSuperAdmin } = await import('@/lib/auth-utils');
    if (!isSuperAdmin(committees)) return null;
    return session;
}

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = 10000, ...fetchOptions } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export const getActivities = cache(async (): Promise<Activiteit[]> => {
    try {
        const events = await getSystemDirectus().request(readItems('events', {
            fields: [
                ...EVENT_FIELDS,
                { committee_id: ['name'] }
            ] as any,
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
            committee_name: typeof item.committee_id === 'object' ? (item.committee_id as any)?.name || null : null,
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
        const items = await getSystemDirectus().request(readItems('events', {
            fields: [
                ...EVENT_FIELDS,
                { committee_id: ['id', 'name'] }
            ] as any,
            filter: { id: { _eq: id } },
            limit: 1
        })) as any[];
        
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
            committee_name: typeof item.committee_id === 'object' ? (item.committee_id as any)?.name || null : null,
        };

        const parsed = activiteitenSchema.element.safeParse(mapped);
        return parsed.success ? parsed.data : null;
    } catch (error) {
        console.error('[Activities] Fetch by ID failed:', error);
        return null;
    }
});

export async function signupForActivity(data: EventSignupForm) {
    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('event-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel verzoeken. Probeer het over 5 minuten opnieuw.' };
    }

    const parsed = eventSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    if (parsed.data.website) {
        return { success: false, error: 'Spam gedetecteerd' };
    }

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        const userId = session?.user?.id;

        const activity = await getActivityById(String(parsed.data.event_id));
        if (!activity) return { success: false, error: 'Activiteit niet gevonden' };

        if (activity.only_members && !userId) {
            return { success: false, error: 'Deze activiteit is alleen voor leden.' };
        }

        const user = session?.user as any;
        const isMember = user?.membership_status === 'active';
        const price = (isMember ? activity.price_members : activity.price_non_members) ?? 0;

        const qrToken = `r-${parsed.data.event_id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const directus = getSystemDirectus();
        const payload: any = {
            event_id: parsed.data.event_id,
            participant_name: parsed.data.name,
            participant_email: parsed.data.email,
            participant_phone: parsed.data.phoneNumber,
            payment_status: (price ?? 0) > 0 ? 'open' : 'paid',
            qr_token: qrToken,
            // directus_relations removed: now linking via transactions
        };

        const signupResponse = await directus.request(createItem('event_signups', payload));

        const { id: signupId } = eventSignupSchema.pick({ id: true }).parse(signupResponse);

        revalidateTag(`event_signups_${parsed.data.event_id}`, 'default');

        if ((price ?? 0) > 0) {
            const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
            const paymentRes = await fetchWithTimeout(financeUrl, {
                method: 'POST',
                headers: getInternalHeaders(),
                body: JSON.stringify({
                    amount: price,
                    description: `Inschrijving: ${activity.titel}`,
                    registrationId: signupId,
                    registrationType: 'event_signup',
                    email: parsed.data.email,
                    firstName: parsed.data.name,
                    isContribution: false,
                    redirectUrl: `${process.env.PUBLIC_URL}/activiteiten/bevestiging?id=${signupId}`
                })
            });
            const paymentData = await paymentRes.json();
            if (paymentRes.ok && paymentData.checkoutUrl) {
                return { success: true, checkoutUrl: paymentData.checkoutUrl };
            }
            
            // Cleanup on Failure
            console.error('[Activities] Payment service error:', paymentData);
            try {
                const { deleteItem } = await import('@directus/sdk');
                await getSystemDirectus().request(deleteItem('event_signups', signupId));
                console.log(`[Activities] Cleaned up failed signup ${signupId}`);
            } catch (cleanupErr) {
                console.error(`[Activities] Cleanup failed for ${signupId}:`, cleanupErr);
            }

            return { success: false, error: 'Er kon geen betaling worden aangemaakt voor deze inschrijving.' };
        } else {
            const { getRedis } = await import('@/server/auth/redis-client');
            const redis = await getRedis();
            
            const eventPayload = {
                event: 'ACTIVITY_SIGNUP_SUCCESS',
                timestamp: new Date().toISOString(),
                email: parsed.data.email,
                name: parsed.data.name,
                eventName: activity.titel,
                eventDate: activity.datum_start,
                signupId: signupId
            };

            await redis.xadd('v7:events', '*', 'payload', JSON.stringify(eventPayload));
            
            return { success: true, message: 'Inschrijving geslaagd!' };
        }
    } catch (error) {
        console.error('[Activities] Signup error:', error);
        return { success: false, error: 'Er is een fout opgetreden bij de inschrijving.' };
    }
}

export async function getActivitySignups(eventId: string) {
    const session = await checkAdminAccess();
    if (!session) return [];
    
    try {
        return await getSystemDirectus().request(readItems('event_signups', {
            filter: { event_id: { _eq: eventId } },
            fields: EVENT_SIGNUP_FIELDS
        }));
    } catch (error) {
        console.error(`[Activities] Error fetching signups for ${eventId}:`, error);
        return [];
    }
}

export async function getSignupStatus(id?: string, transactionId?: string, cacheBuster?: string) {
    noStore(); // Block Next.js server action caching
    if (transactionId) {
        try {
            // Find transaction by either database ID or our secure access_token (token t)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId);
            const isNumeric = /^\d+$/.test(transactionId);

            const filter: any = { _or: [] };
            if (isUuid) {
                filter._or.push({ access_token: { _eq: transactionId } });
                filter._or.push({ mollie_id: { _eq: transactionId } });
            }
            if (isNumeric) {
                filter._or.push({ id: { _eq: parseInt(transactionId) } });
            }
            
            // If neither matches (e.g. short text), at least try mollie_id if it doesn't crash
            if (filter._or.length === 0) {
                filter._or.push({ mollie_id: { _eq: transactionId } });
            }

            const transactions = await getSystemDirectus().request(readItems('transactions', {
                fields: TRANSACTION_FIELDS as any,
                filter,
                limit: 1,
                params: { t: Date.now().toString() }
            })) as unknown as DbTransaction[];

            const trans = transactions?.[0];

            if (!trans) return { status: 'error' };

            const productType = trans.product_type;

            if (productType === 'event_signup') {
                // Extract ID from nested registration object if returned as such
                const signupId = typeof trans.registration === 'object' ? trans.registration?.id : trans.registration;
                if (!signupId) return { status: 'error' };

                const signups = await getSystemDirectus().request(readItems('event_signups', {
                    fields: ['id', 'payment_status', 'participant_name', { event_id: ['id', 'name'] }] as any,
                    filter: { id: { _eq: signupId } },
                    limit: 1
                })) as unknown as DbEventSignup[];
                const signup = signups?.[0];
                const status = signup?.payment_status === 'paid' ? 'paid' : trans.payment_status;
                console.log(`[Activities] Signup status for transaction ${transactionId}: ${status}`);
                return { status, signup, transaction: trans };
            } else if (productType === 'pub_crawl_signup') {
                const signupId = typeof trans.pub_crawl_signup === 'object' ? trans.pub_crawl_signup?.id : trans.pub_crawl_signup;
                if (!signupId) return { status: 'error' };

                const signups = await getSystemDirectus().request(readItems('pub_crawl_signups', {
                    fields: [...PUB_CRAWL_SIGNUP_FIELDS, { pub_crawl_event_id: ['name'] }, { tickets: ['id', 'name', 'qr_token'] }] as any,
                    filter: { id: { _eq: signupId } },
                    limit: 1
                })) as unknown as DbPubCrawlSignup[];
                const signup = signups?.[0];
                if (signup) {
                    (signup as any).amount_tickets = signup.tickets?.length || 1;
                }
                console.log(`[Activities] Signup status for pub crawl transaction ${transactionId}: ${trans.payment_status}`);
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (productType === 'membership') {
                console.log(`[Activities] Membership status for transaction ${transactionId}: ${trans.payment_status}`);
                return { status: trans.payment_status, transaction: trans, isMembership: true };
            } else if (productType === 'trip_signup') {
                const signupId = typeof trans.trip_signup === 'object' ? trans.trip_signup?.id : trans.trip_signup;
                if (!signupId) return { status: 'error' };

                const signups = await getSystemDirectus().request(readItems('trip_signups', {
                    fields: ['id', 'status', 'first_name', 'last_name', { trip_id: ['id', 'name'] }] as any,
                    filter: { id: { _eq: signupId } },
                    limit: 1
                })) as unknown as DbTripSignup[];
                const signup = signups?.[0];
                if (signup) {
                    // Map trip_id.name to event_id.name for UI consistency in ConfirmationIsland
                    (signup as any).event_id = { name: (signup as any).trip_id?.name || 'Reis' };
                }
                console.log(`[Activities] Trip status for transaction ${transactionId}: ${trans.payment_status}`);
                return { status: trans.payment_status, signup, transaction: trans, isTrip: true };
            }
            console.log(`[Activities] Generic status for transaction ${transactionId}: ${trans.payment_status}`);
            return { status: trans.payment_status, transaction: trans };
        } catch (e) {
            console.error('[Activities] Error resolving transaction:', e);
            return { status: 'error' };
        }
    } else if (id) {
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            const userId = session?.user?.id;
            const user = session?.user as any;
            const isAdmin = user?.role === 'admin' || user?.role === '06e78cf9-f9c3-4f9e-a86d-1907de634567'; 

            // 1. Try event_signups first
            const signups = await getSystemDirectus().request(readItems('event_signups', {
                fields: [...EVENT_SIGNUP_FIELDS, 'directus_relations', { event_id: ['id', 'name'] }] as any,
                filter: { id: { _eq: id } },
                limit: 1
            })) as unknown as DbEventSignup[];
            
            if (signups && signups.length > 0) {
                const signup = signups[0];
                
                // Security check
                const isOwner = userId && signup.directus_relations === userId;
                if (!isAdmin && !isOwner) {
                    console.warn(`[Activities] Unauthorized access attempt to event signup ${id} by user ${userId}`);
                    return { status: 'unauthorized' };
                }

                console.log(`[Activities] Signup status for ID ${id} (event): ${signup.payment_status}`);
                return { status: signup.payment_status || 'open', signup };
            }

            // 2. Try pub_crawl_signups as fallback
            const pubCrawlSignups = await getSystemDirectus().request(readItems('pub_crawl_signups', {
                fields: [...PUB_CRAWL_SIGNUP_FIELDS, 'directus_relations', { pub_crawl_event_id: ['id', 'name'] }, { tickets: ['id', 'name', 'qr_token'] }] as any,
                filter: { id: { _eq: id } },
                limit: 1
            })) as unknown as DbPubCrawlSignup[];

            if (pubCrawlSignups && pubCrawlSignups.length > 0) {
                const signup = pubCrawlSignups[0];
                
                // Security check
                const isOwner = userId && signup.directus_relations === userId;
                if (!isAdmin && !isOwner) {
                    console.warn(`[Activities] Unauthorized access attempt to pub crawl signup ${id} by user ${userId}`);
                    return { status: 'unauthorized' };
                }

                if (signup) {
                    (signup as any).amount_tickets = signup.tickets?.length || 1;
                }
                console.log(`[Activities] Signup status for ID ${id} (pub crawl): ${signup.payment_status}`);
                return { status: signup.payment_status || 'open', signup };
            }
            
            console.warn(`[Activities] Signup ID ${id} not found in any collection.`);
            return { status: 'error' };
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
        const directus = getSystemDirectus();

        // 1. Fetch event signups
        const eventSignups = await directus.request(readItems('event_signups', {
            filter: { directus_relations: { _eq: userId } },
            fields: [...EVENT_SIGNUP_FIELDS, { event_id: ['id', 'name', 'event_date', 'location'] }] as any,
            sort: ['-created_at']
        })) as unknown as DbEventSignup[];

        // 2. Fetch pub crawl signups
        const pubCrawlSignups = await directus.request(readItems('pub_crawl_signups', {
            filter: { directus_relations: { _eq: userId } },
            fields: [...PUB_CRAWL_SIGNUP_FIELDS, { pub_crawl_event_id: ['id', 'name', 'event_date', 'location'] }, { tickets: ['id', 'name', 'qr_token'] }] as any,
            sort: ['-created_at']
        })) as unknown as DbPubCrawlSignup[];

        // 3. Fetch trip signups
        const tripSignups = await directus.request(readItems('trip_signups', {
            filter: { directus_relations: { _eq: userId } },
            fields: ['id', 'status', 'created_at', 'first_name', 'last_name', { trip_id: ['id', 'name', 'event_date'] }] as any,
            sort: ['-created_at']
        })) as unknown as DbTripSignup[];

        // 4. Formatter/Mapper to make them consistent for the UI
        const formattedPubCrawl = pubCrawlSignups.map(s => ({
            ...s,
            id: s.id,
            event_id: s.pub_crawl_event_id,
            type: 'pub_crawl'
        }));

        const formattedEvents = eventSignups.map(s => ({
            ...s,
            type: 'event'
        }));

        const formattedTrips = tripSignups.map(s => {
            const trip = s.trip_id as DbTrip | undefined;
            return {
                ...s,
                event_id: { 
                    id: trip?.id, 
                    name: trip?.name, // Use 'name' from DbTrip
                    event_date: trip?.event_date 
                },
                type: 'trip'
            };
        });

        return [...formattedEvents, ...formattedPubCrawl, ...formattedTrips].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    } catch (error) {
        console.error('[Activities] Error fetching user tickets:', error);
        return [];
    }
}
