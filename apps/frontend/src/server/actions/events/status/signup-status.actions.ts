'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { db, schema } from '@salvemundi/db';
import { eq, or, type SQL } from 'drizzle-orm';
import { fetchEventSignupByIdDb } from '@/server/internal/activiteiten/activiteiten-db.utils';
import { fetchPubCrawlSignupByIdDb } from '@/server/internal/kroegentocht/kroegentocht-signup-db.utils';;
import { fetchTripSignupByIdDb } from '@/server/internal/reis/reis-signup-db.utils';;
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteiten/activiteiten.utils';
import { type PubCrawlSignup } from '@salvemundi/validations/directus/schema';
import { type PaymentStatus, type SignupStatusResult } from './types';
import { safeConsoleError } from '@/server/utils/logger';
import { canAccess } from '@/shared/lib/permissions';

interface FinanceStatusResponse {
    payment_status?: PaymentStatus;
    product_type?: string;
    signup_id?: number | string;
    registration?: number | string;
    trip_signup?: number | string;
    pub_crawl_signup?: number | string;
}

/**
 * Resolves the payment and registration status for a given identifier.
 */
export async function getSignupStatus(
    id?: string,
    transactionId?: string
): Promise<SignupStatusResult> {
    noStore();

    try {
        const financeId = transactionId || id;

        if (financeId && !/^[a-zA-Z0-9\-_.]+$/.test(String(financeId))) {
            return { status: 'error', errorType: 'INVALID_ID' };
        }

        let paymentStatus: PaymentStatus = 'open';

        if (financeId) {
            const FINANCE_SERVICE_URL = getFinanceServiceUrl() || process.env.INTERNAL_FINANCE_URL || 'http://finance-service:3001';
            const finRes = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${financeId}`, {
                headers: getInternalHeaders(),
                cache: 'no-store',
                signal: AbortSignal.timeout(5000)
            });

            if (finRes.ok) {
                const finData = await finRes.json() as FinanceStatusResponse;
                paymentStatus = finData.payment_status || 'open';
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
                return { status: status as PaymentStatus, signup: krotoSignup as unknown as PubCrawlSignup };
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
                const trans = await financeRes.json() as FinanceStatusResponse;
                return {
                    status: (trans.payment_status || 'open') as PaymentStatus,
                    isMembership: trans.product_type === 'membership',
                    signup: { id: trans.signup_id || trans.registration || trans.trip_signup || trans.pub_crawl_signup || null }
                };
            }

            const conditions: SQL[] = [
                eq(schema.transactions.mollie_id, String(financeId))
            ];
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(financeId));
            if (isUuid) {
                conditions.push(eq(schema.transactions.access_token, String(financeId)));
            }
            if (id && /^\d+$/.test(String(id))) {
                conditions.push(eq(schema.transactions.registration, parseInt(String(id))));
            }

            const transRows = await db.select({
                payment_status: schema.transactions.payment_status,
                product_type: schema.transactions.product_type,
                registration: schema.transactions.registration
            }).from(schema.transactions)
            .where(or(...conditions))
            .limit(1);

            if (transRows.length > 0) {
                const trans = transRows[0];
                return {
                    status: (trans.payment_status || 'open') as PaymentStatus,
                    isMembership: trans.product_type === 'membership',
                    signup: { id: trans.registration || null }
                };
            }
        }

        if (typeof id === 'string' && /^\d+$/.test(id) && typeof transactionId === 'string') {
            const signup = await fetchEventSignupByIdDb(parseInt(id));
            if (signup && signup.qr_token === transactionId) {
                return {
                    status: (signup.payment_status as PaymentStatus),
                    signup
                };
            }
        }

        if (typeof id === 'string' && /^\d+$/.test(id)) {
            const signupId = parseInt(id);
            const session = await getEnrichedSession();
            const user = session?.user;
            const isCommitteeAdmin = canAccess(user?.committees, 'commissies');

            const signup = await fetchEventSignupByIdDb(signupId);
            if (signup) {
                const isOwner = user?.id && signup.directus_relations === user.id;
                if (isCommitteeAdmin || isOwner) {
                    return { status: (signup.payment_status as PaymentStatus), signup };
                }
                return { status: 'unauthorized' };
            }

            const krotoSignup = await fetchPubCrawlSignupByIdDb(signupId);
            if (krotoSignup) {
                const isOwner = user?.id && krotoSignup.directus_relations === user.id;
                if (isCommitteeAdmin || isOwner) {
                    return { status: (krotoSignup.payment_status as PaymentStatus), signup: krotoSignup as unknown as PubCrawlSignup };
                }
                return { status: 'unauthorized' };
            }

            const tripSignup = await fetchTripSignupByIdDb(signupId);
            if (tripSignup) {
                const isOwner = user?.id && tripSignup.directus_relations === user.id;
                if (isCommitteeAdmin || isOwner) {
                    const status = (tripSignup.deposit_paid || tripSignup.full_payment_paid) ? 'paid' : paymentStatus;
                    return { status: status as PaymentStatus, signup: tripSignup, isTrip: true };
                }
                return { status: 'unauthorized' };
            }
        }

        return { status: paymentStatus };
    } catch (error) {
        safeConsoleError('[signup-status.actions.ts][getSignupStatus] Failed to resolve status:', error);
        return { status: 'error' };
    }
}
