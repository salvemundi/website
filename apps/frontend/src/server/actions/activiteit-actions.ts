'use server';

import { activiteitenSchema, type Activiteit, eventSignupFormSchema, type EventSignupForm, type DbTrip, EVENT_FIELDS, EVENT_SIGNUP_FIELDS, TRANSACTION_FIELDS, PUB_CRAWL_SIGNUP_FIELDS, eventSignupSchema, type DbTransaction, type DbEventSignup, type DbPubCrawlSignup, type DbTripSignup } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag, unstable_noStore as noStore } from 'next/cache';
import { cache } from 'react';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, deleteItem } from '@directus/sdk';
import { 
    getActivitiesInternal, 
    getActivityByIdInternal,
    getActivitySignupsInternal 
} from "@/server/queries/admin-event.queries";
import { logAdminAction } from './audit.actions';
import { 
    createEventSignupDb, 
    deleteEventSignupDb,
    fetchEventSignupByIdDb,
    fetchUserEventSignupsDb
} from './event-db.utils';
import { 
    fetchPubCrawlSignupByIdDb,
    fetchUserPubCrawlSignupsDb
} from './kroegentocht-db.utils';
import { 
    getFinanceServiceUrl, 
    getInternalHeaders, 
    fetchWithTimeout, 
    checkAdminAccess 
} from './activiteit-utils';

/**
 * Fetches all published activities directly from the database (SQL-first).
 * Enriches each activity with 'is_signed_up' status if userId is provided.
 */
export const getActivities = cache(async (userId?: string): Promise<(Activiteit & { is_signed_up?: boolean })[]> => {
    try {
        const activities = await getActivitiesInternal(true);
        
        if (!userId) return activities;

        // Fetch user signups for these activities
        const userSignups = await fetchUserEventSignupsDb(userId);
        const signedUpEventIds = new Set(userSignups.map(s => s.event_id.id));

        // Also check Pub Crawl signups
        const pubCrawlSignups = await fetchUserPubCrawlSignupsDb(userId);
        const signedUpPubCrawlIds = new Set(pubCrawlSignups.map(s => s.pub_crawl_event_id.id));

        return activities.map(activity => ({
            ...activity,
            is_signed_up: signedUpEventIds.has(activity.id) || (activity as any).type === 'pub_crawl' && signedUpPubCrawlIds.has(activity.id)
        }));
    } catch (error) {
        console.error('[Activities] getActivities failed:', error);
        return [];
    }
});

/**
 * Fetches a single activity by ID directly from the database (SQL-first).
 */
export const getActivityById = cache(async (id: string): Promise<Activiteit | null> => {
    try {
        return await getActivityByIdInternal(id);
    } catch (error) {
        console.error(`[Activities] getActivityById failed for ${id}:`, error);
        return null;
    }
});

/**
 * Fetches all signups for a specific activity (Admin only).
 */
export async function getActivitySignups(eventId: string) {
    const session = await checkAdminAccess();
    if (!session) return [];
    
    try {
        return await getActivitySignupsInternal(eventId);
    } catch (error) {
        console.error(`[Activities] getActivitySignups failed for ${eventId}:`, error);
        return [];
    }
}

/**
 * Sign up for an activity (Directus Event).
 * Handles both members (linked via directus_relations) and guests.
 */
export async function signupForActivity(data: EventSignupForm) {
    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('event-signup', 10, 600); // 10 pogingen per 10 min
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het over een kwartier opnieuw.' };
    }

    const parsed = eventSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    if (parsed.data.website) {
        return { success: false, error: 'Spam detected' };
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

        const user = session?.user;
        const isMember = user?.membership_status === 'active';
        const price = (isMember ? activity.price_members : activity.price_non_members) ?? 0;

        // Extra check for existing signups (Guest by email or Member by ID)
        // This acts as a primary check before the DB constraint catches it
        const { query } = await import('@/lib/db');
        const existingCheck = await query(
            `SELECT id FROM event_signups 
             WHERE event_id = $1 AND (participant_email = $2 OR (directus_relations IS NOT NULL AND directus_relations = $3))
             AND payment_status != 'failed' LIMIT 1`,
            [parsed.data.event_id, parsed.data.email, userId || null]
        );

        if (existingCheck.rows.length > 0) {
            return { success: false, error: 'U bent al aangemeld voor deze activiteit.' };
        }

        const qrToken = `r-${parsed.data.event_id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const directus = getSystemDirectus();
        
        const payload: any = {
            event_id: parsed.data.event_id,
            participant_name: parsed.data.name,
            participant_email: parsed.data.email,
            participant_phone: parsed.data.phoneNumber,
            payment_status: (price ?? 0) > 0 ? 'open' : 'paid',
            qr_token: qrToken,
            directus_relations: userId || null,
        };

        const signupId = await createEventSignupDb(payload);
        if (!signupId) throw new Error('Could not write to database');

        // Sync back to Directus - now awaited for data integrity
        try {
            await directus.request(createItem('event_signups', { ...payload, id: signupId }));
        } catch (err) {
            console.error('[Activities] Directus sync error:', err);
            // Cleanup DB if sync fails
            await deleteEventSignupDb(signupId);
            await logAdminAction('activity_signup_rollback', 'ERROR', { id: signupId, error: String(err), action: 'rollback_delete' });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Inschrijving niet voltooid.' };
        }

        revalidateTag(`event_signups_${parsed.data.event_id}`, 'default');

        if ((price ?? 0) > 0) {
            const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
            const paymentRes = await fetchWithTimeout(financeUrl, {
                method: 'POST',
                headers: getInternalHeaders(),
                body: JSON.stringify({
                    amount: price,
                    description: `Signup: ${activity.titel}`,
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
            
            console.error('[Activities] Payment service error:', paymentData);
            try {
                await deleteEventSignupDb(signupId);
                getSystemDirectus().request(deleteItem('event_signups', signupId)).catch(() => {});
            } catch (cleanupErr) {
                console.error(`[Activities] Cleanup failed for ${signupId}:`, cleanupErr);
            }

            return { success: false, error: 'Could not create payment for this signup.' };
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
    } catch (error: any) {
        console.error('[Activities] Signup error:', error);
        
        // Postgres Code 23505: Unique Violation
        if (error.code === '23505') {
            return { success: false, error: 'U bent al aangemeld voor deze activiteit.' };
        }
        
        return { success: false, error: 'Er is een fout opgetreden bij de inschrijving.' };
    }
}

/**
 * Fetches the status of a specific signup (Event, Pub Crawl, Trip, or Membership).
 * Uses SQL-first approach for registration data and Finance Service for payment verification.
 */
export async function getSignupStatus(id?: string, transactionId?: string, cacheBuster?: string) {
    noStore();
    
    // 1. Finance Service Verification (Source of Truth for Payments)
    let paymentStatus = 'open';
    const financeId = transactionId || id;
    
    if (financeId) {
        try {
            const FINANCE_SERVICE_URL = getFinanceServiceUrl() || 'http://finance-service:3001';
            const finRes = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${financeId}`, { cache: 'no-store' });
            if (finRes.ok) {
                const finData = await finRes.json();
                paymentStatus = finData.payment_status || 'open';
            }
        } catch (err) {
            console.error('[Activities] Finance status check failed:', err);
        }
    }

    try {
        // 2. Direct Registration Lookup (Numeric ID provided in URL)
        if (id && /^\d+$/.test(id)) {
            const signupId = parseInt(id);
            
            const eventSignup = await fetchEventSignupByIdDb(signupId);
            if (eventSignup) {
                return { status: eventSignup.payment_status === 'paid' ? 'paid' : paymentStatus, signup: eventSignup };
            }

            const krotoSignup = await fetchPubCrawlSignupByIdDb(signupId);
            if (krotoSignup) {
                krotoSignup.amount_tickets = krotoSignup.tickets?.length || 1;
                krotoSignup.event_id = { name: krotoSignup.pub_crawl_event_id?.name || 'Pub Crawl' };
                return { status: krotoSignup.payment_status === 'paid' ? 'paid' : paymentStatus, signup: krotoSignup };
            }
        }

        // 3. Fallback to Transaction Lookup (token/transactionId provided)
        if (transactionId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId);
            const filter: any = { _or: [] };
            if (isUuid) {
                filter._or.push({ access_token: { _eq: transactionId } });
                filter._or.push({ mollie_id: { _eq: transactionId } });
            } else if (/^\d+$/.test(transactionId)) {
                filter._or.push({ id: { _eq: parseInt(transactionId) } });
            } else {
                filter._or.push({ mollie_id: { _eq: transactionId } });
            }

            const transactions = await getSystemDirectus().request(readItems('transactions', {
                fields: TRANSACTION_FIELDS as any,
                filter,
                limit: 1,
                params: { t: Date.now().toString() }
            })) as unknown as DbTransaction[];

            const trans = transactions?.[0];
            if (!trans) return { status: paymentStatus === 'paid' ? 'paid' : 'error' };

            const productType = trans.product_type;
            const regId = typeof trans.registration === 'object' ? trans.registration?.id : trans.registration;
            const krotoId = typeof trans.pub_crawl_signup === 'object' ? trans.pub_crawl_signup?.id : trans.pub_crawl_signup;

            if (productType === 'event_signup' && regId) {
                const signup = await fetchEventSignupByIdDb(Number(regId));
                return { status: signup?.payment_status === 'paid' ? 'paid' : paymentStatus, signup, transaction: trans };
            } else if (productType === 'pub_crawl_signup' && krotoId) {
                const signup = await fetchPubCrawlSignupByIdDb(Number(krotoId));
                if (signup) {
                    signup.amount_tickets = signup.tickets?.length || 1;
                    signup.event_id = { name: signup.pub_crawl_event_id?.name || 'Pub Crawl' };
                }
                return { status: signup?.payment_status === 'paid' ? 'paid' : paymentStatus, signup, transaction: trans };
            } else if (productType === 'membership') {
                return { status: paymentStatus, transaction: trans, isMembership: true };
            }
        }

        // 4. Manual Verification / Detail Lookup (Requires Login)
        if (id && /^\d+$/.test(id)) {
            const session = await auth.api.getSession({ headers: await headers() });
            const userId = session?.user?.id;
            const user = session?.user as any;
            const isAdmin = user?.role === 'admin' || user?.role === '06e78cf9-f9c3-4f9e-a86d-1907de634567'; 
            const signupId = parseInt(id);

            const signup = await fetchEventSignupByIdDb(signupId);
            if (signup) {
                const isOwner = userId && signup.directus_relations === userId;
                if (isAdmin || isOwner) {
                    return { status: signup.payment_status || paymentStatus, signup };
                }
                return { status: 'unauthorized' };
            }

            const krotoSignup = await fetchPubCrawlSignupByIdDb(signupId);
            if (krotoSignup) {
                const isOwner = userId && krotoSignup.directus_relations === userId;
                if (isAdmin || isOwner) {
                    krotoSignup.amount_tickets = krotoSignup.tickets?.length || 1;
                    krotoSignup.event_id = { name: krotoSignup.pub_crawl_event_id?.name || 'Pub Crawl' };
                    return { status: krotoSignup.payment_status || paymentStatus, signup: krotoSignup };
                }
                return { status: 'unauthorized' };
            }
        }

        return { status: paymentStatus };
    } catch (error) {
        console.error('[Activities] getSignupStatus failed:', error);
        return { status: 'error' };
    }
}

/**
 * Fetches the tickets (signups) for the current logged-in user (SQL-First).
 */
export async function getMyTickets() {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) return [];

    try {
        // 1. Fetch event signups (SQL)
        const eventSignups = await fetchUserEventSignupsDb(userId);

        // 2. Fetch pub crawl signups (SQL)
        const pubCrawlSignups = await fetchUserPubCrawlSignupsDb(userId);

        // 3. Fetch trip signups (Legacy Directus for now)
        const tripSignups = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { directus_relations: { _eq: userId } },
            fields: ['id', 'status', 'created_at', 'first_name', 'last_name', { trip_id: ['id', 'name', 'event_date'] }] as any,
            sort: ['-created_at']
        })) as unknown as DbTripSignup[];

        const formattedPubCrawl = pubCrawlSignups.map(s => ({
            ...s,
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
                    name: trip?.name,
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
        console.error('[Activities] getMyTickets failed:', error);
        return [];
    }
}
