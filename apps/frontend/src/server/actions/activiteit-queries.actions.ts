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

import { 
    getActivitiesInternal, 
    getActivityByIdInternal, 
    getActivitySignupsInternal 
} from '@/server/queries/admin-event.queries';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { checkAdminAccess } from './activiteit-utils';

export const getActivities = cache(async (): Promise<Activiteit[]> => {
    return getActivitiesInternal(true); // Public view, only published
});

export const getActivityById = cache(async (id: string): Promise<Activiteit | null> => {
    return getActivityByIdInternal(id);
});

export async function getActivitySignups(eventId: string) {
    const session = await checkAdminAccess();
    if (!session) return [];
    return getActivitySignupsInternal(eventId) as any;
}

export async function getSignupStatus(id?: string, transactionId?: string) {
    if (transactionId) {
        try {
            const transactions = await getSystemDirectus().request(readItems('transactions', {
                fields: TRANSACTION_FIELDS as any,
                filter: { id: { _eq: transactionId } },
                limit: 1
            })) as unknown as DbTransaction[]; // Forced cast to satisfy compiler overlap checks with SDK return type
            
            const trans = transactions?.[0];

            if (!trans) return { status: 'error' };

            // Use explicit comparison with product_type, which is now correctly recognized via DbTransaction
            if (trans.product_type === 'event_signup') {
                const signups = await getSystemDirectus().request(readItems('event_signups', {
                    fields: ['id', 'payment_status', 'participant_name', { event_id: ['id', 'name'] }] as any,
                    filter: { id: { _eq: trans.registration } },
                    limit: 1
                }));
                const signup = signups?.[0];
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (trans.product_type === 'pub_crawl_signup') {
                const signups = await getSystemDirectus().request(readItems('pub_crawl_signups', {
                    fields: [...PUB_CRAWL_SIGNUP_FIELDS, { pub_crawl_event_id: ['name'] }, { tickets: ['id', 'name', 'qr_token'] }] as any,
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
                fields: [...EVENT_SIGNUP_FIELDS, { event_id: ['id', 'name'] }] as any,
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
        const directus = getSystemDirectus();
        
        // Fetch transactions for this user to identify signups
        const transactions = await directus.request(readItems('transactions', {
            filter: { user_id: { _eq: userId } },
            fields: ['id', 'registration', 'pub_crawl_signup'] as any,
            limit: -1
        }));

        const registrationIds = transactions.map(tx => tx.registration).filter(Boolean);
        if (registrationIds.length === 0) return [];

        const signupRes = await getSystemDirectus().request(readItems('event_signups', {
            filter: {
                id: { _in: registrationIds },
                payment_status: { _eq: 'paid' }
            },
            fields: [...EVENT_SIGNUP_FIELDS, { event_id: ['id', 'name', 'event_date', 'location'] }] as any,
            sort: ['-created_at']
        })) as unknown as DbEventSignup[];

        return signupRes;
    } catch (error) {
        console.error('[Activities] getMyTickets failed:', error);
        return [];
    }
}
