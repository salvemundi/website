'use server';

import {
    type PubCrawlTicket,
    type PubCrawlEvent,
    pubCrawlEventSchema,
    pubCrawlTicketSchema,
    pubCrawlSignupSchema,
    pubCrawlSignupFormSchema,
    type PubCrawlSignupForm
} from '@salvemundi/validations/schema/pub-crawl.zod';
import {
    PUB_CRAWL_EVENT_FIELDS,
    PUB_CRAWL_SIGNUP_FIELDS,
    PUB_CRAWL_TICKET_FIELDS,
    EVENT_FIELDS
} from '@salvemundi/validations/directus/fields';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag, unstable_cache as cacheTag } from 'next/cache';
import { cache } from 'react';
import { logAdminAction } from './audit.actions';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';
import {
    createPubCrawlSignupDb,
    deletePubCrawlSignupDb,
    getPubCrawlTicketCountDb,
    createPubCrawlTicketsDb,
    deletePubCrawlTicketsBySignupIdDb,
    fetchPubCrawlSignupByIdDb,
    fetchPubCrawlEventsDb
} from './kroegentocht-db.utils';
import { query } from '@/lib/database';
import crypto from 'crypto';

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

export const getKroegentochtEvent = cache(async (): Promise<PubCrawlEvent | null> => {
    return await cacheTag(
        async () => {
            const today = new Date().toISOString().split('T')[0];

            try {
                const events = await fetchPubCrawlEventsDb();
                // Sort ascending to find the nearest upcoming event
                const nearestEvents = [...events].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateA - dateB;
                });

                const event = nearestEvents.find((e: any) => e.date >= today);

                if (!event) {

                    return null;
                }

                // Apply defaults/overrides
                if (!event.email) event.email = 'feest@salvemundi.nl';
                event.price = 1;
                event.max_tickets_per_person = 10;

                const parsed = pubCrawlEventSchema.safeParse(event);
                if (!parsed.success) {

                    return null;
                }
                return parsed.data;
            } catch (error: any) {

                return null;
            }
        },
        ['kroegentocht-active-event'],
        {
            tags: ['kroegentocht-event', 'kroegentocht-events'],
            revalidate: 3600 // 1 hour backup revalidation
        }
    )();
});

export async function getKroegentochtTickets(email: string): Promise<PubCrawlTicket[]> {
    try {
        const res = await query(
            `SELECT t.*, e.name as event_name 
             FROM pub_crawl_tickets t
             JOIN pub_crawl_signups s ON t.signup_id = s.id
             JOIN pub_crawl_events e ON s.pub_crawl_event_id = e.id
             WHERE s.email = $1 AND s.payment_status = 'paid'`,
            [email]
        );

        const items = (res.rows || []).map((t: any) => ({
            ...t,
            signup_id: {
                pub_crawl_event_id: {
                    name: t.event_name
                }
            }
        }));

        const parsed = items.map((t: any) => pubCrawlTicketSchema.safeParse(t).data).filter(Boolean);
        return parsed as PubCrawlTicket[];
    } catch (error: any) {

        return [];
    }
}

export async function initiateKroegentochtPayment(formData: any) {
    const { rateLimit } = await import('../utils/ratelimit');
    const { success: rateLimitSuccess } = await rateLimit('kroegentocht-signup', 15, 600); // 15 pogingen per 10 min
    if (!rateLimitSuccess) {
        return { success: false, error: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het over een kwartier opnieuw.' };
    }

    const parsed = pubCrawlSignupSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    if (parsed.data.website) {
        return { success: false, error: 'Spam gedetecteerd.' };
    }

    try {
        const events = await fetchPubCrawlEventsDb();
        const eventData = events.find((e: any) => e.id === Number(parsed.data.pub_crawl_event_id));

        if (!eventData) {
            return { success: false, error: 'Kroegentocht niet gevonden' };
        }

        const price = 1;
        const maxPerPerson = 10;

        // Validate existing ticket count - SQL-first for accuracy during peaks
        const existingCount = await getPubCrawlTicketCountDb(Number(parsed.data.pub_crawl_event_id));

        if (existingCount + parsed.data.amount_tickets > maxPerPerson) {
            return { success: false, error: `Je hebt al ${existingCount} tickets. Maximaal ${maxPerPerson} per persoon/groep.` };
        }

        const session = await auth.api.getSession({ headers: await headers() });
        const userId = session?.user?.id;

        const signupId = await createPubCrawlSignupDb({
            name: parsed.data.name,
            email: parsed.data.email,
            association: parsed.data.association,
            amount_tickets: parsed.data.amount_tickets,
            name_initials: parsed.data.name_initials,
            pub_crawl_event_id: Number(parsed.data.pub_crawl_event_id),
            payment_status: 'open',
            directus_relations: userId || null,
        });

        const ticketsTable = [];
        const names = (parsed.data.name_initials || '').split(',').map(n => n.trim()).filter(Boolean);

        for (let i = 0; i < parsed.data.amount_tickets; i++) {
            ticketsTable.push({
                name: names[i] || parsed.data.name,
                initial: (names[i] || parsed.data.name).substring(0, 1).toUpperCase(),
                qr_token: crypto.randomUUID()
            });
        }
        await createPubCrawlTicketsDb(signupId, ticketsTable);

        // Sync to Directus - now with Fallback to Upsert
        const syncPayload = {
            id: signupId,
            name: parsed.data.name,
            email: parsed.data.email,
            association: parsed.data.association,
            amount_tickets: parsed.data.amount_tickets,
            name_initials: parsed.data.name_initials,
            pub_crawl_event_id: Number(parsed.data.pub_crawl_event_id) as any,
            payment_status: 'open',
            directus_relations: userId || null,
        };

        try {
            await getSystemDirectus().request(createItem('pub_crawl_signups', syncPayload));
        } catch (err: any) {
            const errorMsg = String(err?.message || '');
            if (errorMsg.includes('unique') || (err?.errors && JSON.stringify(err.errors).includes('unique'))) {

                try {
                    await getSystemDirectus().request(updateItem('pub_crawl_signups', signupId, syncPayload));
                } catch (updateErr) {

                    // Rollback both if even update fails
                    await deletePubCrawlTicketsBySignupIdDb(signupId);
                    await deletePubCrawlSignupDb(signupId);
                    return { success: false, error: 'Synchronisatie met CMS mislukt (collision fallback failed).' };
                }
            } else {

                // Cleanup DB if sync fails for other reasons
                await deletePubCrawlTicketsBySignupIdDb(signupId);
                await deletePubCrawlSignupDb(signupId);
                await logAdminAction('kroegentocht_signup_rollback', 'ERROR', { id: signupId, error: String(err), action: 'rollback_delete' });
                return { success: false, error: 'Synchronisatie met CMS mislukt. Inschrijving niet voltooid.' };
            }
        }

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
                redirectUrl: `${process.env.PUBLIC_URL}/kroegentocht/bevestiging?id=${signupId}`,
                webhookUrl: `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`
            })
        });

        const paymentData = await paymentRes.json();
        if (paymentRes.ok && paymentData.checkoutUrl) {
            return { success: true, checkoutUrl: paymentData.checkoutUrl };
        }

        try {
            await deletePubCrawlTicketsBySignupIdDb(signupId);
            await deletePubCrawlSignupDb(signupId);
            getSystemDirectus().request(deleteItem('pub_crawl_signups', signupId)).catch(() => { });
        } catch (cleanupErr: any) {
        }

        return { success: false, error: 'Failed to initiate payment. Please try again later.' };

    } catch (error: any) {

        return { success: false, error: 'An internal error occurred.' };
    }
}

export async function getKroegentochtStatus(signupId: string) {
    try {
        const signup = await fetchPubCrawlSignupByIdDb(parseInt(signupId, 10));
        if (!signup) return { status: 'error' };

        if (signup.payment_status === 'paid') {
            revalidateTag(`tickets-${signup.email}`, 'default');
            return { status: 'paid', signup };
        } else if (['failed', 'canceled', 'expired'].includes(signup.payment_status)) {
            return { status: 'failed' };
        }

        return { status: 'open' };
    } catch (error: any) {

        return { status: 'error' };
    }
}



