'use server';

import {
    type PubCrawlTicket,
    type PubCrawlEvent,
    pubCrawlEventSchema,
    pubCrawlTicketSchema,
    pubCrawlSignupSchema,
    PUB_CRAWL_EVENT_FIELDS,
    PUB_CRAWL_SIGNUP_FIELDS,
    PUB_CRAWL_TICKET_FIELDS,
    EVENT_FIELDS
} from '@salvemundi/validations';
const EVENT_ID_FIELDS = ['id'] as const;
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

const getFinanceServiceUrl = () =>
    process.env.FINANCE_SERVICE_URL;

const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

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

export async function getKroegentochtEvent(): Promise<PubCrawlEvent | null> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const data = await getSystemDirectus().request(readItems('pub_crawl_events', {
            filter: { date: { _gte: today } },
            sort: ['date'],
            limit: 1,
            fields: [...PUB_CRAWL_EVENT_FIELDS]
        }));

        const event = data?.[0] as any;
        if (!event) return null;

        // Hardcode price and tickets per user request
        event.price = 1;
        event.max_tickets_per_person = 10;

        const parsed = pubCrawlEventSchema.safeParse(event);
        return parsed.success ? parsed.data : null;
    } catch (error) {
        console.error('[kroegentocht.actions#getEvent] Error:', error);
        return null;
    }
}

export async function getKroegentochtTickets(email: string): Promise<PubCrawlTicket[]> {
    try {
        const data = await getSystemDirectus().request(readItems('pub_crawl_tickets', {
            filter: {
                signup_id: {
                    email: { _eq: email },
                    payment_status: { _eq: 'paid' }
                } as any
            },
            fields: [
                ...PUB_CRAWL_TICKET_FIELDS,
                { signup_id: [{ pub_crawl_event_id: ['name'] }] }
            ] as any
        }));

        const parsed = (data || []).map((t: any) => pubCrawlTicketSchema.safeParse(t).data).filter(Boolean);
        return parsed as PubCrawlTicket[];
    } catch (error) {
        console.error('[kroegentocht.actions#getTickets] Error:', error);
        return [];
    }
}

export async function initiateKroegentochtPayment(formData: any) {
    const parsed = pubCrawlSignupSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    try {
        const event = await getSystemDirectus().request(readItems('pub_crawl_events', {
            filter: { id: { _eq: parsed.data.pub_crawl_event_id as any } },
            limit: 1,
            fields: [...EVENT_ID_FIELDS]
        }));
        
        const eventData = event?.[0];
        if (!eventData) {
            return { success: false, error: 'Evenement niet gevonden' };
        }

        const price = 1;
        const maxPerPerson = 10;

        const existingSignups = await getSystemDirectus().request(readItems('pub_crawl_signups', {
            filter: {
                email: { _eq: parsed.data.email },
                pub_crawl_event_id: { _eq: parsed.data.pub_crawl_event_id },
                payment_status: { _eq: 'paid' }
            },
            fields: ['amount_tickets' as any]
        }));
        
        const existingCount = (existingSignups || []).reduce((sum: number, s: any) => sum + (s.amount_tickets || 0), 0);

        if (existingCount + parsed.data.amount_tickets > maxPerPerson) {
            return { success: false, error: `Je hebt al ${existingCount} tickets. Maximaal ${maxPerPerson} per persoon/groep.` };
        }

        // 4. Create signup
        const { id: _, ...signupData } = parsed.data;
        const signup = await getSystemDirectus().request(createItem('pub_crawl_signups', {
            ...signupData,
            pub_crawl_event_id: parsed.data.pub_crawl_event_id as any,
            payment_status: 'open'
        }));
        
        const signupId = Number(signup.id);

        // 5. Initiate payment via Finance Service
        const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
        const paymentRes = await fetchWithTimeout(financeUrl, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount: parsed.data.amount_tickets * price,
                description: `Kroegentocht Tickets (${parsed.data.amount_tickets}x)`,
                registrationId: signupId,
                registrationType: 'pub_crawl_signup',
                email: parsed.data.email,
                firstName: parsed.data.name, 
                isContribution: false,
                redirectUrl: `${process.env.PUBLIC_URL}/kroegentocht/bevestiging?id=${signupId}`
            })
        });

        const paymentData = await paymentRes.json();
        if (paymentRes.ok && paymentData.checkoutUrl) {
            return { success: true, checkoutUrl: paymentData.checkoutUrl };
        }
 
        console.error('[kroegentocht.actions#initiatePayment] Payment service error:', paymentData);
        return { success: false, error: 'Het aanmaken van de betaling is mislukt. Probeer het later opnieuw.' };

    } catch (error) {
        console.error('[kroegentocht.actions#initiatePayment] Error:', error);
        return { success: false, error: 'Er is een interne fout opgetreden' };
    }
}

export async function getKroegentochtStatus(signupId: string) {
    try {
        const data = await getSystemDirectus().request(readItems('pub_crawl_signups', {
            filter: { id: { _eq: signupId as any } },
            fields: [
                ...PUB_CRAWL_SIGNUP_FIELDS,
                { pub_crawl_event_id: ['name'] }
            ] as any,
            limit: 1
        }));

        const signup = data?.[0];
        if (!signup) return { status: 'error' };

        if (signup.payment_status === 'paid') {
            revalidateTag(`tickets-${signup.email}`, 'default');
            return { status: 'paid', signup };
        } else if (['failed', 'canceled', 'expired'].includes(signup.payment_status)) {
            return { status: 'failed' };
        }

        return { status: 'open' };
    } catch (error) {
        console.error('[kroegentocht.actions#getStatus] Error:', error);
        return { status: 'error' };
    }
}



