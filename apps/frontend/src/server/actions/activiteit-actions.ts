'use server';

import { activitySchema as activiteitenSchema, type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { eventSignupSchema } from '@salvemundi/validations/schema/profiel.zod';
import { 
    EVENT_FIELDS, 
    EVENT_SIGNUP_FIELDS, 
    TRANSACTION_FIELDS, 
    PUB_CRAWL_SIGNUP_FIELDS 
} from '@salvemundi/validations/directus/fields';
import { 
    type DbTransaction, 
    type DbEventSignup, 
    type DbPubCrawlSignup, 
    type DbTripSignup,
    type DbTrip 
} from '@salvemundi/validations/directus/schema';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag, unstable_noStore as noStore } from 'next/cache';
import { cache } from 'react';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, deleteItem } from '@directus/sdk';
import { 
    getActivitiesInternal, 
    getActivityByIdInternal,
    getActivityBySlugInternal,
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
import { fetchTripSignupByIdDb } from './reis-db.utils';
import { 
    getFinanceServiceUrl, 
    getInternalHeaders, 
    fetchWithTimeout, 
    checkAdminAccess
} from './activiteit-utils';
import { query } from '@/lib/database';

/**
 * Fetches all published activities directly from the database (SQL-first).
 * Enriches each activity with 'is_signed_up' status if userId is provided.
 */
export const getActivities = cache(async (email?: string): Promise<(Activiteit & { is_signed_up?: boolean })[]> => {
    const activities = await getActivitiesInternal(true);
    
    if (!email) return activities;

    try {
        // Fetch user signups for these activities by email
        const userSignups = await fetchUserEventSignupsDb(email);
        const signedUpEventIds = new Set(userSignups.map(s => Number(s.event_id.id)));

        // Also check Pub Crawl signups by email
        const pubCrawlSignups = await fetchUserPubCrawlSignupsDb(email);
        const signedUpPubCrawlIds = new Set(pubCrawlSignups.map(s => Number(s.pub_crawl_event_id.id)));

        return activities.map(activity => ({
            ...activity,
            is_signed_up: signedUpEventIds.has(Number(activity.id)) || ((activity as unknown as { type?: string }).type === 'pub_crawl' && signedUpPubCrawlIds.has(Number(activity.id)))
        }));
    } catch (error) {
        // User signup fetch failure is non-critical for the list view, log and return activities without signup status
        console.error('[Error] Failed to fetch user signups for activities:', error);
        return activities;
    }
});

/**
 * Fetches a single activity by ID directly from the database (SQL-first).
 */
export const getActivityById = cache(async (id: string): Promise<Activiteit | null> => {
    // If ID is in format "841-website-launch", extract the numeric part
    const cleanId = id.includes('-') ? id.split('-')[0] : id;
    if (!/^\d+$/.test(cleanId)) return null;
    return await getActivityByIdInternal(cleanId);
});

/**
 * Fetches a single activity by custom URL slug or numeric ID.
 */
export const getActivityBySlug = cache(async (slug: string): Promise<Activiteit | null> => {
    return await getActivityBySlugInternal(slug);
});

/**
 * Checks if a user is already signed up for an activity (By email).
 */
export async function checkUserSignupStatus(eventId: number, email: string) {
    try {
        const { query } = await import('@/lib/database');
        const res = await query(
            `SELECT id, qr_token, payment_status FROM event_signups 
             WHERE event_id = $1 AND participant_email = $2 
             AND payment_status != 'failed' LIMIT 1`,
            [eventId, email]
        );
        if (res.rows.length > 0) {
            return { 
                isSignedUp: true, 
                qrToken: res.rows[0].qr_token, 
                paymentStatus: res.rows[0].payment_status 
            };
        }
        return { isSignedUp: false };
    } catch (error) {
        return { isSignedUp: false };
    }
}

/**
 * Fetches all signups for a specific activity (Admin only).
 */
export async function getActivitySignups(eventId: string) {
    const session = await checkAdminAccess();
    if (!session) return [];
    
    try {
        return await getActivitySignupsInternal(eventId);
    } catch (error) {
        
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
        // Extra check for existing signups (By email)
        const { query } = await import('@/lib/database');
        const existingCheck = await query(
            `SELECT id FROM event_signups 
             WHERE event_id = $1 AND LOWER(participant_email) = LOWER($2)
             AND payment_status != 'failed' LIMIT 1`,
            [parsed.data.event_id, parsed.data.email]
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

        // Note: Directus and our SQL query share the same database table.
        // We revalidate to ensure Next.js cache stays in sync with the primary DB.
        revalidateTag(`event_signups_${parsed.data.event_id}`, 'max');

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
            
            
            try {
                await deleteEventSignupDb(signupId);
                getSystemDirectus().request(deleteItem('event_signups', signupId)).catch(() => {});
            } catch (cleanupErr) {
                
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
                signupId: signupId,
                qrToken: qrToken,
                accessToken: qrToken // Use qrToken as temporary access token for free events
            };

            await redis.xadd('v7:events', '*', 'payload', JSON.stringify(eventPayload));
            
            return { 
                success: true, 
                message: 'Inschrijving geslaagd!',
                signupId: signupId,
                qrToken: qrToken
            };
        }
    } catch (error: any) {
        
        
        // Postgres Code 23505: Unique Violation
        if (error.code === '23505') {
            return { success: false, error: 'U bent al aangemeld voor deze activiteit.' };
        }
        
        return { success: false, error: 'Er is een fout opgetreden bij de inschrijving.' };
    }
}

export type PaymentStatus = 'paid' | 'open' | 'failed' | 'canceled' | 'expired' | 'error' | 'unauthorized';

export interface SignupStatusResult {
    status: PaymentStatus;
    signup?: DbEventSignup | DbPubCrawlSignup | DbTripSignup | unknown;
    isMembership?: boolean;
    isTrip?: boolean;
    errorType?: string;
}

/**
 * Resolves the payment and registration status for a given identifier.
 * Primarily uses the Finance Service for live payment status and 
 * falls back to the local database for descriptive registration data.
 */
export async function getSignupStatus(
    id?: string, 
    transactionId?: string, 
    cacheBuster?: string
): Promise<SignupStatusResult> {
    noStore();
    
    // Determine the identifier to check against the Finance Service
    const financeId = transactionId || id;
    let paymentStatus: PaymentStatus = 'open';
    
    if (financeId) {
        try {
            const FINANCE_SERVICE_URL = getFinanceServiceUrl() || process.env.INTERNAL_FINANCE_URL || 'http://finance-service:3001';
            const finRes = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${financeId}`, { 
                cache: 'no-store',
                signal: AbortSignal.timeout(5000) // Don't hang the poll forever
            });
            
            if (finRes.ok) {
                const finData = await finRes.json();
                paymentStatus = (finData.payment_status as PaymentStatus) || 'open';
            } else {
                
            }
        } catch (err) {
            
        }
    }

    try {
        // Direct registration lookup by numeric database ID
        if (typeof id === 'string' && /^\d+$/.test(id)) {
            const signupId = parseInt(id);
            
            const eventSignup = await fetchEventSignupByIdDb(signupId);
            if (eventSignup) {
                const status = eventSignup.payment_status !== 'open' ? eventSignup.payment_status : paymentStatus;
                return { status: status as PaymentStatus, signup: eventSignup };
            }

            const krotoSignup = await fetchPubCrawlSignupByIdDb(signupId);
            if (krotoSignup) {
                const status = krotoSignup.payment_status !== 'open' ? krotoSignup.payment_status : paymentStatus;
                return { status: status as PaymentStatus, signup: krotoSignup };
            }

            const tripSignup = await fetchTripSignupByIdDb(signupId);
            if (tripSignup) {
                const status = (tripSignup.deposit_paid || tripSignup.full_payment_paid) ? 'paid' : paymentStatus;
                return { 
                    status: status as PaymentStatus, 
                    signup: tripSignup,
                    isTrip: true 
                };
            }
        }

        // Broad transaction lookup using tokens or unique identifiers
        if (financeId) {
            const transRes = await query(
                `SELECT payment_status, product_type, registration 
                 FROM transactions 
                 WHERE access_token::text = $1 
                    OR mollie_id::text = $1 
                    OR registration::text = $2 
                 LIMIT 1`,
                [String(financeId), id ? String(id) : null]
            );
            
            if (transRes.rows.length > 0) {
                const trans = transRes.rows[0];
                const status = trans.payment_status !== 'open' ? trans.payment_status : paymentStatus;
                return { 
                    status: status as PaymentStatus, 
                    isMembership: trans.product_type === 'membership' 
                };
            }
        }

        // Fallback for guest-only signups (free events or non-transactional items)
        if (typeof id === 'string' && /^\d+$/.test(id) && typeof transactionId === 'string') {
            const signup = await fetchEventSignupByIdDb(parseInt(id));
            if (signup && signup.qr_token === transactionId) {
                return { 
                    status: (signup.payment_status as PaymentStatus) || 'paid', 
                    signup 
                };
            }
        }

        // Administrative verification: requires valid session and ownership/admin privileges
        if (typeof id === 'string' && /^\d+$/.test(id)) {
            const signupId = parseInt(id);
            const session = await auth.api.getSession({ headers: await headers() });
            const user = session?.user as { id: string; role?: string };
            const isAdmin = user?.role === 'admin' || user?.role === '06e78cf9-f9c3-4f9e-a86d-1907de634567'; 

            const signup = await fetchEventSignupByIdDb(signupId);
            if (signup) {
                const isOwner = user?.id && signup.directus_relations === user.id;
                if (isAdmin || isOwner) {
                    return { status: (signup.payment_status as PaymentStatus) || paymentStatus, signup };
                }
                return { status: 'unauthorized' };
            }

            const krotoSignup = await fetchPubCrawlSignupByIdDb(signupId);
            if (krotoSignup) {
                const isOwner = user?.id && krotoSignup.directus_relations === user.id;
                if (isAdmin || isOwner) {
                    return { status: (krotoSignup.payment_status as PaymentStatus) || paymentStatus, signup: krotoSignup };
                }
                return { status: 'unauthorized' };
            }

            const tripSignup = await fetchTripSignupByIdDb(signupId);
            if (tripSignup) {
                const isOwner = user?.id && tripSignup.directus_relations === user.id;
                if (isAdmin || isOwner) {
                    const status = (tripSignup.deposit_paid || tripSignup.full_payment_paid) ? 'paid' : paymentStatus;
                    return { status: status as PaymentStatus, signup: tripSignup, isTrip: true };
                }
                return { status: 'unauthorized' };
            }
        }

        return { status: paymentStatus };
    } catch (error) {
        
        return { status: 'error' };
    }
}

/**
 * Fetches the tickets (signups) for the current logged-in user.
 */
export async function getMyTickets() {
    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email;
    if (!email) return [];

    try {
        // 1. Fetch event signups (SQL by email - Case Insensitive)
        const eventSignups = await fetchUserEventSignupsDb(email).catch(err => {
            
            return [];
        });

        // 2. Fetch pub crawl signups (SQL by email - Case Insensitive)
        const pubCrawlSignups = await fetchUserPubCrawlSignupsDb(email).catch(err => {
            
            return [];
        });

        // 3. Fetch trip signups (Legacy Directus for now - by email)
        const tripSignups = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { email: { _eq: email } },
            fields: ['id', 'status', 'created_at', 'first_name', 'last_name', { trip_id: ['id', 'name', 'event_date'] }] as any,
            sort: ['-created_at']
        })).catch(err => {
            
            return [];
        }) as unknown as DbTripSignup[];

        const formattedPubCrawl = pubCrawlSignups.map(s => ({
            ...s,
            date_created: s.created_at, // Normalize for TicketListIsland
            type: 'pub_crawl'
        }));

        const formattedEvents = eventSignups.map(s => ({
            ...s,
            date_created: s.created_at, // Normalize for TicketListIsland
            type: 'event'
        }));

        const formattedTrips = tripSignups.map(s => {
            const trip = s.trip_id as DbTrip | undefined;
            return {
                ...s,
                date_created: s.created_at, // Normalize for TicketListIsland
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
        
        return [];
    }
}
