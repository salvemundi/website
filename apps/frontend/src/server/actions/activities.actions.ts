'use server';

import { activiteitenSchema, type Activiteit, eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { cache } from 'react';

import { getSystemDirectus, getUserDirectus } from '@/lib/directus';
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
    
    const user = session.user as any;
    const permissions = user.committees || [];
    const { isSuperAdmin } = await import('@/lib/auth-utils');
    if (!isSuperAdmin(permissions)) return null;
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
                'id', 'name', 'description', 'location', 'event_date', 'event_date_end', 
                'image', 'status', 'price_members', 'price_non_members', 'only_members', 
                'registration_deadline', 'contact', 'event_time', 'event_time_end',
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
        const items = await getSystemDirectus().request((readItems('events', {
            fields: [
                'id', 'name', 'description', 'location', 'event_date', 'event_date_end', 
                'image', 'status', 'price_members', 'price_non_members', 'only_members', 
                'registration_deadline', 'contact', 'event_time', 'event_time_end',
                { committee_id: ['id', 'name'] }
            ] as any,
            filter: { id: { _eq: id } as any },
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
        const directus = session?.session?.token ? getUserDirectus(session.session.token) : getSystemDirectus();
        const signup = await directus.request(createItem('event_signups', {
            event_id: parsed.data.event_id,
            participant_name: parsed.data.name,
            participant_email: parsed.data.email,
            participant_phone: parsed.data.phoneNumber,
            user_id: userId || null,
            payment_status: (price ?? 0) > 0 ? 'open' : 'paid',
            qr_token: qrToken
        }));

        const signupId = signup.id;

        // Revalidate signups for this event
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
            console.error('[Activities] Payment service error:', paymentData);
            return { success: false, error: 'Er kon geen betaling worden aangemaakt voor deze inschrijving.' };
        } else {
            // Free event, trigger mail service via Redis Event Stream
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
        return await getUserDirectus(session.session.token).request(readItems('event_signups', {
            filter: { event_id: { _eq: eventId as any } },
            fields: ['id', 'participant_name', 'participant_email', 'payment_status', 'checked_in', { user_id: ['display_name' as any] }] as any
        }));
    } catch (error) {
        console.error(`[Activities] Error fetching signups for ${eventId}:`, error);
        return [];
    }
}



export async function getSignupStatus(id?: string, transactionId?: string) {
    if (transactionId) {
        try {
            const transactions = await getSystemDirectus().request(readItems('transactions', {
                fields: ['id', 'payment_status', 'registration_id', 'registration_type'],
                filter: { id: { _eq: transactionId } },
                limit: 1
            }));
            const trans = transactions?.[0];

            if (!trans) return { status: 'error' };

            if (trans.registration_type === 'event_signup') {
                const signups = await getSystemDirectus().request(readItems('event_signups', {
                    fields: ['id', 'payment_status', 'participant_name', { event_id: ['id', 'name'] }],
                    filter: { id: { _eq: trans.registration_id as any } },
                    limit: 1
                }));
                const signup = signups?.[0];
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (trans.registration_type === 'pub_crawl_signup') {
                const signups = await getSystemDirectus().request(readItems('pub_crawl_signups', {
                    fields: ['id', 'name', 'payment_status', { pub_crawl_event_id: ['name'] as any }, { tickets: ['id', 'name', 'qr_token'] as any }] as any,
                    filter: { id: { _eq: trans.registration_id as any } },
                    limit: 1
                }));
                const signup = signups?.[0];
                if (signup) {
                    (signup as any).amount_tickets = (signup as any).tickets?.length || 1;
                }
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (trans.registration_type === 'membership') {
                return { status: trans.payment_status, transaction: trans, isMembership: true };
            }
            return { status: trans.payment_status, transaction: trans };
        } catch (e) {
            console.error('[Activities] Error resolving transaction:', e);
            return { status: 'error' };
        }
    } else if (id) {
        try {
            const signups = await getSystemDirectus().request(readItems('event_signups', {
                fields: ['id', 'payment_status', 'participant_name', { event_id: ['id', 'name'] }],
                filter: { id: { _eq: id as any } },
                limit: 1
            }));
            const signup = signups?.[0];
            if (!signup) return { status: 'error' };
            return { status: (signup as any).payment_status || 'open', signup };
        } catch (e) {
            console.error('[Activities] Error fetching signup status:', e);
            return { status: 'error' };
        }
    }

    return { status: 'error' };
}

export async function getMyTickets() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

    try {
        return await getUserDirectus(session.session.token).request(readItems('event_signups', {
            filter: { 
                user_id: { _eq: session.user.id }
            },
            fields: ['id', 'payment_status', 'qr_token', { event_id: ['id', 'name', 'event_date', 'location'] }],
            sort: ['-date_created']
        }));
    } catch (error) {
        console.error('[Activities] Error fetching user tickets:', error);
        return [];
    }
}
