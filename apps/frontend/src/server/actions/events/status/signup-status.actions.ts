'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type EnrichedUser } from '@/types/auth';
import { query } from '@/lib/database';
import { fetchEventSignupByIdDb } from '@/server/internal/event-db.utils';
import { fetchPubCrawlSignupByIdDb } from '@/server/internal/kroegentocht-db.utils';
import { fetchTripSignupByIdDb } from '@/server/internal/reis-db.utils';
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteit-utils';
import { type DbPubCrawlSignup } from '@salvemundi/validations/directus/schema';
import { type PaymentStatus, type SignupStatusResult } from './types';

/**
 * Resolves the payment and registration status for a given identifier.
 */
export async function getSignupStatus(
    id?: string,
    transactionId?: string
): Promise<SignupStatusResult> {
    noStore();

    const financeId = transactionId || id;

    if (financeId && !/^[a-zA-Z0-9\-_.]+$/.test(String(financeId))) {
        return { status: 'error', errorType: 'INVALID_ID' };
    }

    let paymentStatus: PaymentStatus = 'open';

    if (financeId) {
        const FINANCE_SERVICE_URL = getFinanceServiceUrl() || process.env.INTERNAL_FINANCE_URL || 'http://finance-service:3001';
        const finRes = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${financeId}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000)
        });

        if (finRes.ok) {
            const finData = await finRes.json();
            paymentStatus = (finData.payment_status as PaymentStatus) || 'open';
        }
    }

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
        const session = await getEnrichedSession();
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
}
