'use server';

import {
    pubCrawlEventSchema,
    pubCrawlSignupSchema,
    pubCrawlTicketSchema,
    type PubCrawlEvent,
    type PubCrawlSignup,
    type PubCrawlTicket
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

import { directusRequest } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

const getFinanceServiceUrl = () =>
    process.env.INTERNAL_FINANCE_URL;

const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

/**
 * Helper voor Fetch met timeout (for Finance Service)
 */
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

/**
 * Haalt het eerstvolgende Kroegentocht evenement op.
 */
export async function getKroegentochtEvent(): Promise<PubCrawlEvent | null> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const data = await directusRequest(readItems('pub_crawl_events', {
            filter: { date: { _gte: today } },
            sort: ['date'],
            limit: 1
        }));

        const event = data?.[0];
        if (!event) return null;

        const parsed = pubCrawlEventSchema.safeParse(event);
        return parsed.success ? parsed.data : null;
    } catch (error) {
        console.error('[kroegentocht.actions#getEvent] Error:', error);
        return null;
    }
}

/**
 * Haalt de betaalde tickets op voor een specifiek e-mailadres.
 */
export async function getKroegentochtTickets(email: string): Promise<PubCrawlTicket[]> {
    try {
        const data = await directusRequest(readItems('pub_crawl_tickets', {
            filter: {
                signup_id: {
                    email: { _eq: email },
                    payment_status: { _eq: 'paid' }
                } as any
            },
            fields: ['*', { signup_id: [{ pub_crawl_event_id: ['name'] }] }] as any
        }));

        const parsed = (data || []).map((t: any) => pubCrawlTicketSchema.safeParse(t).data).filter(Boolean);
        return parsed as PubCrawlTicket[];
    } catch (error) {
        console.error('[kroegentocht.actions#getTickets] Error:', error);
        return [];
    }
}

/**
 * Start een inschrijving en betaling voor de Kroegentocht.
 */
export async function initiateKroegentochtPayment(formData: any) {
    // 1. Validatie
    const parsed = pubCrawlSignupSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    try {
        // 2. Dynamische prijs en limiet ophalen
        const event = await directusRequest(readItems('pub_crawl_events', {
            filter: { id: { _eq: parsed.data.pub_crawl_event_id } },
            limit: 1
        }));
        
        const eventData = event?.[0];
        if (!eventData) {
            return { success: false, error: 'Evenement niet gevonden' };
        }

        const price = Number(eventData.price || 1.00);
        const maxPerPerson = Number(eventData.max_tickets_per_person || 10);

        // 3. Dubbele check op ticket limiet
        const existingSignups = await directusRequest(readItems('pub_crawl_signups', {
            filter: {
                email: { _eq: parsed.data.email },
                pub_crawl_event_id: { _eq: parsed.data.pub_crawl_event_id },
                payment_status: { _eq: 'paid' }
            },
            fields: ['amount_tickets']
        }));
        
        const existingCount = (existingSignups || []).reduce((sum: number, s: any) => sum + (s.amount_tickets || 0), 0);

        if (existingCount + parsed.data.amount_tickets > maxPerPerson) {
            return { success: false, error: `Je hebt al ${existingCount} tickets. Maximaal ${maxPerPerson} per persoon/groep.` };
        }

        // 4. Signup aanmaken
        const signup = await directusRequest(createItem('pub_crawl_signups', {
            ...parsed.data,
            payment_status: 'open'
        }));
        
        const signupId = signup.id;

        // 5. Betaling initiëren via Finance Service
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

        return { success: false, error: paymentData.error || 'Fout bij aanmaken betaling' };

    } catch (error) {
        console.error('[kroegentocht.actions#initiatePayment] Error:', error);
        return { success: false, error: 'Er is een interne fout opgetreden' };
    }
}

/**
 * Checkt de status van een inschrijving.
 */
export async function getKroegentochtStatus(signupId: string) {
    try {
        const data = await directusRequest(readItems('pub_crawl_signups', {
            filter: { id: { _eq: signupId as any } },
            fields: ['*', { pub_crawl_event_id: ['name'] }] as any,
            limit: 1
        }));

        const signup = data?.[0];
        if (!signup) return { status: 'error' };

        if (signup.payment_status === 'paid') {
            revalidateTag(`tickets-${signup.email}`);
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



