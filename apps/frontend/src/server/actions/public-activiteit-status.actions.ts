'use server';

import { auth } from '@/server/auth/auth';
import { type EnrichedUser } from '@/types/auth';
import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';

import { query } from '@/lib/database';
import { fetchEventSignupByIdDb, fetchUserEventSignupsDb } from './event-db.utils';
import { fetchPubCrawlSignupByIdDb, fetchUserPubCrawlSignupsDb } from './kroegentocht-db.utils';
import { fetchTripSignupByIdDb } from './reis-db.utils';
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from './activiteit-utils';

import { 
    type DbEventSignup, 
    type DbPubCrawlSignup, 
    type DbTripSignup
} from '@salvemundi/validations/directus/schema';

export type PaymentStatus = 'paid' | 'open' | 'failed' | 'canceled' | 'expired' | 'error' | 'unauthorized';

export interface SignupStatusResult {
    status: PaymentStatus;
    signup?: DbEventSignup | DbPubCrawlSignup | DbTripSignup;
    isMembership?: boolean;
    isTrip?: boolean;
    errorType?: string;
}

/**
 * Resolves the payment and registration status for a given identifier.
 */
export async function getSignupStatus(
    id?: string, 
    transactionId?: string, 
    cacheBuster?: string
): Promise<SignupStatusResult> {
    noStore();
    
    const financeId = transactionId || id;
    
    if (financeId && !/^[a-zA-Z0-9\-_.]+$/.test(String(financeId))) {
        return { status: 'error', errorType: 'INVALID_ID' };
    }

    let paymentStatus: PaymentStatus = 'open';
    
    if (financeId) {
        try {
            const FINANCE_SERVICE_URL = getFinanceServiceUrl() || process.env.INTERNAL_FINANCE_URL || 'http://finance-service:3001';
            const finRes = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${financeId}`, { 
                cache: 'no-store',
                signal: AbortSignal.timeout(5000)
            });
            
            if (finRes.ok) {
                const finData = await finRes.json();
                paymentStatus = (finData.payment_status as PaymentStatus) || 'open';
            }
        } catch {}
    }

    try {
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
                return { status: status as PaymentStatus, signup: krotoSignup as unknown as DbPubCrawlSignup };
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

        if (financeId) {
            const financeUrl = `${getFinanceServiceUrl()}/api/finance/status/${financeId}`;
            try {
                const financeRes = await fetchWithTimeout(financeUrl, {
                    headers: getInternalHeaders()
                });
                
                if (financeRes.ok) {
                    const trans = await financeRes.json();
                    return { 
                        status: trans.payment_status as PaymentStatus, 
                        isMembership: trans.product_type === 'membership',
                        signup: { id: trans.signup_id || trans.registration || trans.trip_signup || trans.pub_crawl_signup }
                    };
                }
            } catch (err) {
                console.error('[SignupStatus] Finance service live check failed:', err);
            }

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
                return { 
                    status: trans.payment_status as PaymentStatus, 
                    isMembership: trans.product_type === 'membership',
                    signup: { id: trans.registration || trans.trip_signup || trans.pub_crawl_signup }
                };
            }
        }

        if (typeof id === 'string' && /^\d+$/.test(id) && typeof transactionId === 'string') {
            const signup = await fetchEventSignupByIdDb(parseInt(id));
            if (signup && signup.qr_token === transactionId) {
                return { 
                    status: (signup.payment_status as PaymentStatus) || 'paid', 
                    signup 
                };
            }
        }

        if (typeof id === 'string' && /^\d+$/.test(id)) {
            const signupId = parseInt(id);
            const session = await auth.api.getSession({ headers: await headers() });
            const user = session?.user as unknown as EnrichedUser | undefined;
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
                    return { status: (krotoSignup.payment_status as PaymentStatus) || paymentStatus, signup: krotoSignup as unknown as DbPubCrawlSignup };
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
    } catch {
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
        const eventSignups = await fetchUserEventSignupsDb(email).catch(() => []);
        const pubCrawlSignups = await fetchUserPubCrawlSignupsDb(email).catch(() => []);

        const tripSignupsResult = await query(`
            SELECT ts.id, ts.status, ts.created_at, ts.first_name, ts.last_name,
                   t.id as trip_id, t.name as trip_name, t.event_date as trip_event_date
            FROM trip_signups ts
            LEFT JOIN trips t ON ts.trip_id = t.id
            WHERE LOWER(ts.email) = LOWER($1)
            ORDER BY ts.created_at DESC
        `, [email]).catch(() => ({ rows: [] }));
        const tripSignups = tripSignupsResult.rows;

        const formattedPubCrawl = pubCrawlSignups.map(s => ({
            ...s,
            date_created: s.created_at,
            type: 'pub_crawl'
        }));

        const formattedEvents = eventSignups.map(s => ({
            ...s,
            date_created: s.created_at,
            type: 'event'
        }));

        const formattedTrips = tripSignups.map(s => {
            return {
                ...s,
                date_created: s.created_at,
                event_id: { 
                    id: s.trip_id, 
                    name: s.trip_name,
                    event_date: s.trip_event_date 
                },
                type: 'trip'
            };
        });

        return [...formattedEvents, ...formattedPubCrawl, ...formattedTrips].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    } catch {
        return [];
    }
}

/**
 * Re-initiates the payment process for an existing signup.
 */
export async function retryActivityPayment(signupId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        const currentUser = session?.user as unknown as EnrichedUser;
        
        const signupRes = await query(
            `SELECT es.*, e.name as event_name, e.price_members, e.price_non_members 
             FROM event_signups es 
             JOIN events e ON es.event_id = e.id 
             WHERE es.id = $1`, 
            [signupId]
        );

        if (signupRes.rows.length === 0) {
            return { success: false, error: "Aanmelding niet gevonden." };
        }

        const signup = signupRes.rows[0];

        const isAdmin = currentUser?.isAdmin || currentUser?.isICT;
        const isParticipant = currentUser?.email === signup.participant_email;
        
        if (!isAdmin && !isParticipant) {
            return { success: false, error: "Unauthorized" };
        }

        if (signup.payment_status === 'paid') {
            return { success: false, error: "Deze aanmelding is al betaald." };
        }
        
        const isMember = currentUser?.membership_status === 'active';
        const price = (isMember ? signup.price_members : signup.price_non_members) ?? 0;

        if (price <= 0) {
            return { success: false, error: "Deze activiteit is gratis." };
        }

        const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
        const paymentRes = await fetchWithTimeout(financeUrl, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount: price,
                description: `Retry Signup: ${signup.event_name}`,
                registrationId: signup.id,
                registrationType: 'event_signup',
                email: signup.participant_email,
                firstName: signup.participant_name,
                phoneNumber: signup.participant_phone,
                userId: currentUser?.id,
                isContribution: false,
                redirectUrl: `${process.env.PUBLIC_URL}/activiteiten/bevestiging?id=${signup.id}`
            })
        });

        const paymentData = await paymentRes.json();
        if (paymentRes.ok && paymentData.checkoutUrl) {
            return { success: true, checkoutUrl: paymentData.checkoutUrl };
        }

        return { success: false, error: "Kon geen nieuwe betaling aanmaken. Probeer het later opnieuw." };

    } catch (err) {
        console.error("[Retry Payment Error]", err);
        return { success: false, error: "Er is een serverfout opgetreden." };
    }
}
