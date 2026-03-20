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

const getFinanceServiceUrl = () =>
    process.env.INTERNAL_FINANCE_URL;

const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL;

const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

const getDirectusHeaders = () => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

/**
 * Helper voor Fetch met timeout
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
    const directusUrl = getDirectusUrl();
    const today = new Date().toISOString().split('T')[0];
    const url = `${directusUrl}/items/pub_crawl_events?filter[date][_gte]=${today}&sort=date&limit=1`;

    try {
        const res = await fetchWithTimeout(url, {
            headers: getDirectusHeaders(),
            next: { tags: ['kroegentocht-event'], revalidate: 3600 }
        });

        if (!res.ok) return null;
        const json = await res.json();
        const data = json.data?.[0];

        if (!data) return null;

        const parsed = pubCrawlEventSchema.safeParse(data);
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
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/pub_crawl_tickets?filter[signup_id][email][_eq]=${encodeURIComponent(email)}&filter[signup_id][payment_status][_eq]=paid&fields=*,signup_id.pub_crawl_event_id.name`;

    try {
        const res = await fetchWithTimeout(url, {
            headers: getDirectusHeaders(),
            next: { tags: [`tickets-${email}`] }
        });

        if (!res.ok) return [];
        const json = await res.json();
        const data = json.data || [];

        // Map Directus relation names if needed, but for now we follow the schema
        const parsed = data.map((t: any) => pubCrawlTicketSchema.safeParse(t).data).filter(Boolean);
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
        // 2. Dubbele check op ticket limiet
        const directusUrl = getDirectusUrl();
        const checkUrl = `${directusUrl}/items/pub_crawl_signups?filter[email][_eq]=${encodeURIComponent(parsed.data.email)}&filter[pub_crawl_event_id][_eq]=${parsed.data.pub_crawl_event_id}&filter[payment_status][_eq]=paid&fields=amount_tickets`;
        const checkRes = await fetchWithTimeout(checkUrl, { headers: getDirectusHeaders() });
        const checkJson = await checkRes.json();
        const existingCount = (checkJson.data || []).reduce((sum: number, s: any) => sum + (s.amount_tickets || 0), 0);

        if (existingCount + parsed.data.amount_tickets > 10) {
            return { success: false, error: `Je hebt al ${existingCount} tickets. Maximaal 10 per persoon/groep.` };
        }

        // 3. Signup aanmaken (V7 pattern: Signup record eerst zodat Mollie een ID heeft)
        const signupUrl = `${directusUrl}/items/pub_crawl_signups`;
        const signupRes = await fetchWithTimeout(signupUrl, {
            method: 'POST',
            headers: getDirectusHeaders(),
            body: JSON.stringify({
                ...parsed.data,
                payment_status: 'open'
            })
        });

        if (!signupRes.ok) throw new Error('Kon inschrijving niet aanmaken in Directus');
        const signupJson = await signupRes.json();
        const signupId = signupJson.data.id;

        // 4. Betaling initiëren via Finance Service
        const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
        const paymentRes = await fetchWithTimeout(financeUrl, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount: parsed.data.amount_tickets * 1.00, // 1 euro per ticket
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
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/pub_crawl_signups/${signupId}?fields=*,pub_crawl_event_id.name`;

    try {
        const res = await fetchWithTimeout(url, {
            headers: getDirectusHeaders(),
            next: { revalidate: 0 }
        });

        if (!res.ok) return { status: 'error' };
        const json = await res.json();
        const signup = json.data;

        if (signup?.payment_status === 'paid') {
            revalidateTag(`tickets-${signup.email}`, 'default');
            return { status: 'paid', signup };
        } else if (['failed', 'canceled', 'expired'].includes(signup?.payment_status)) {
            return { status: 'failed' };
        }

        return { status: 'open' };
    } catch (error) {
        console.error('[kroegentocht.actions#getStatus] Error:', error);
        return { status: 'error' };
    }
}


