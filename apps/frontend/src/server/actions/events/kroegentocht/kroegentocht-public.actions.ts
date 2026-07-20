'use server';

import {
    type PubCrawlTicket,
    pubCrawlEventSchema,
    pubCrawlTicketSchema,
    pubCrawlSignupSchema
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { z } from 'zod';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { unstable_cache as cacheTag } from 'next/cache';

import { safeConsoleError } from '@/server/utils/logger';
import { createPubCrawlSignupDb, deletePubCrawlSignupDb } from '@/server/internal/kroegentocht/kroegentocht-signup-db.utils';
import { createPubCrawlTicketsDb, deletePubCrawlTicketsBySignupIdDb } from '@/server/internal/kroegentocht/kroegentocht-ticket-db.utils';
import { fetchPubCrawlEventsDb } from '@/server/internal/kroegentocht/kroegentocht-event-db.utils';;
import { db, schema } from '@salvemundi/db';
import { eq, and, desc, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

const getFinanceServiceUrl = () =>
    process.env.FINANCE_SERVICE_URL;

const getInternalHeaders = () => {
    const token = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = 10000, ...fetchOptions } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export async function getKroegentochtEvent() {
    return await cacheTag(
        async () => {
            const { toLocalISOString } = await import('@/lib/utils/date-utils');
            const today = toLocalISOString(new Date()) as string;

            const events = await fetchPubCrawlEventsDb();
            const nearestEvents = [...events].sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
            });

            const event = nearestEvents.find((e) => (e.date ?? '') >= today);

            if (!event) {
                return null;
            }

            if (!event.email) event.email = 'feest@salvemundi.nl';
            event.price = 1;
            event.max_tickets_per_person = 10;

            const parsed = pubCrawlEventSchema.safeParse(event);
            if (!parsed.success) {
                safeConsoleError('[kroegentocht.actions.ts][getKroegentochtEvent] Validation failed:', parsed.error.format());
                return null;
            }
            return parsed.data;
        },
        ['kroegentocht-active-event'],
        {
            tags: ['kroegentocht-event', 'kroegentocht-events'],
            revalidate: 3600
        }
    )();
}

export async function getKroegentochtTickets(email: string): Promise<PubCrawlTicket[]> {
    try {
        const rows = await db.select({
            id: schema.pub_crawl_tickets.id,
            signup_id: schema.pub_crawl_tickets.signup_id,
            name: schema.pub_crawl_tickets.name,
            initial: schema.pub_crawl_tickets.initial,
            qr_token: schema.pub_crawl_tickets.qr_token,
            event_name: schema.pub_crawl_events.name
        })
        .from(schema.pub_crawl_tickets)
        .innerJoin(schema.pub_crawl_signups, eq(schema.pub_crawl_tickets.signup_id, schema.pub_crawl_signups.id))
        .innerJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
        .where(
            and(
                eq(schema.pub_crawl_signups.email, email),
                eq(schema.pub_crawl_signups.payment_status, 'paid')
            )
        );

        const items = rows.map((t) => ({
            ...t,
            id: String(t.id),
            signup_id: {
                pub_crawl_event_id: {
                    name: t.event_name || ''
                }
            }
        }));

        const parsed = items.map((t) => pubCrawlTicketSchema.safeParse(t).data).filter((t): t is PubCrawlTicket => !!t);
        return parsed;
    } catch (error: unknown) {
        safeConsoleError(`[kroegentocht.actions.ts][getKroegentochtTickets] Failed to fetch tickets:`, error);
        throw new Error('Kon tickets niet ophalen');
    }
}

export async function initiateKroegentochtPayment(formData: unknown) {
    const { checkRateLimit } = await import('@/server/utils/ratelimit');
    const rateLimitResult = await checkRateLimit('kroegentocht-signup', 15, 600, 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het over een kwartier opnieuw.');
    if (!rateLimitResult.success) return rateLimitResult;

    const parsed = pubCrawlSignupSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
    }

    if (parsed.data.website) {
        return { success: false, error: 'Spam gedetecteerd.' };
    }

    try {
        const events = await fetchPubCrawlEventsDb();
        const eventData = events.find((e) => e.id === Number(parsed.data.pub_crawl_event_id));

        if (!eventData) {
            return { success: false, error: 'Kroegentocht niet gevonden' };
        }

        const price = 1;

        const session = await getEnrichedSession();
        const userId = session?.user.id;

        const signupId = await createPubCrawlSignupDb({
            name: parsed.data.name,
            email: parsed.data.email,
            association: parsed.data.association,
            amount_tickets: parsed.data.amount_tickets,
            name_initials: parsed.data.name_initials,
            pub_crawl_event_id: Number(parsed.data.pub_crawl_event_id),
            payment_status: 'open',
            directus_relations: userId || null
        });

        const ticketsTable: { name: string; initial: string; qr_token: string }[] = [];
        let participantsData: { name: string, initial: string }[] = [];

        try {
            const parsedInitials = JSON.parse(parsed.data.name_initials) as unknown;
            participantsData = Array.isArray(parsedInitials)
                ? (parsedInitials as { name: string; initial: string }[])
                : [(parsedInitials as { name: string; initial: string })];
        } catch (error: unknown) {
            safeConsoleError('[kroegentocht.actions.ts][initiateKroegentochtPayment] Failed to parse participants data:', error);
            participantsData = [];
        }

        for (let i = 0; i < parsed.data.amount_tickets; i++) {
            const p = participantsData[i] as { name: string; initial: string } | undefined;
            ticketsTable.push({
                name: p?.name || parsed.data.name,
                initial: (p?.initial || p?.name || parsed.data.name).substring(0, 1).toUpperCase(),
                qr_token: crypto.randomUUID()
            });
        }
        await createPubCrawlTicketsDb(signupId, ticketsTable);



        const financeUrl = `${getFinanceServiceUrl()}/api/finance/create`;
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

        const paymentData = (await paymentRes.json()) as { checkoutUrl?: string } | null | undefined;
        if (paymentRes.ok && paymentData && paymentData.checkoutUrl) {
            return { success: true, checkoutUrl: paymentData.checkoutUrl };
        }

        try {
            await deletePubCrawlTicketsBySignupIdDb(signupId);
            await deletePubCrawlSignupDb(signupId);
        } catch (error: unknown) {
            safeConsoleError(`[kroegentocht.actions.ts][initiateKroegentochtPayment] Failed to delete signup ${signupId}:`, error);
        }

        return { success: false, error: 'Failed to initiate payment. Please try again later.' };
    } catch (error: unknown) {
        safeConsoleError('[kroegentocht.actions.ts][initiateKroegentochtPayment] Failed to initiate payment:', error);
        return { success: false, error: 'An internal error occurred.' };
    }
}

export async function getKroegentochtWhatsAppLink(
    signupId?: number,
    token?: string
): Promise<{ success: boolean; url: string | null; error?: string }> {
    try {
        const whatsAppUrlResponseSchema = z.object({
            whatsapp_community_url: z.string().url().nullable().optional()
        });

        const session = await getEnrichedSession();
        if (session?.user.id) {
            const activeEvents = await db.select({
                id: schema.pub_crawl_events.id
            }).from(schema.pub_crawl_events)
            .orderBy(desc(schema.pub_crawl_events.date))
            .limit(1);

            if (activeEvents.length > 0) {
                const eventId = activeEvents[0].id;

                const registration = await db.select({
                    payment_status: schema.pub_crawl_signups.payment_status,
                    whatsapp_community_url: schema.pub_crawl_events.whatsapp_community_url
                })
                .from(schema.pub_crawl_signups)
                .innerJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
                .where(
                    and(
                        eq(schema.pub_crawl_signups.directus_relations, session.user.id),
                        eq(schema.pub_crawl_signups.pub_crawl_event_id, eventId),
                        eq(schema.pub_crawl_signups.payment_status, 'paid')
                    )
                )
                .limit(1);

                if (registration.length > 0) {
                    const validatedData = whatsAppUrlResponseSchema.parse({
                        whatsapp_community_url: registration[0].whatsapp_community_url
                    });
                    return {
                        success: true,
                        url: validatedData.whatsapp_community_url ?? null
                    };
                }
            }
        }

        if (signupId && token) {
            // This query involves a complex multi-table join with OR conditions on access_token/mollie_id
            // across two different transaction join paths. Raw SQL is more appropriate here.
            const t2 = alias(schema.transactions, 't2');
            const guestCheck = await db.select({
                payment_status: schema.pub_crawl_signups.payment_status,
                whatsapp_community_url: schema.pub_crawl_events.whatsapp_community_url
            })
            .from(schema.pub_crawl_signups)
            .innerJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
            .leftJoin(schema.transactions, eq(schema.transactions.pub_crawl_signup, schema.pub_crawl_signups.id))
            .leftJoin(schema.pub_crawl_signups_transactions, eq(schema.pub_crawl_signups_transactions.pub_crawl_signups_id, schema.pub_crawl_signups.id))
            .leftJoin(t2, eq(schema.pub_crawl_signups_transactions.transactions_id, t2.id))
            .where(
                and(
                    eq(schema.pub_crawl_signups.id, signupId),
                    eq(schema.pub_crawl_signups.payment_status, 'paid'),
                    or(
                        eq(schema.transactions.access_token, token),
                        eq(schema.transactions.mollie_id, token),
                        eq(t2.access_token, token),
                        eq(t2.mollie_id, token)
                    )
                )
            )
            .limit(1);

            if (guestCheck.length > 0) {
                const validatedData = whatsAppUrlResponseSchema.parse({
                    whatsapp_community_url: guestCheck[0].whatsapp_community_url
                });
                return {
                    success: true,
                    url: validatedData.whatsapp_community_url ?? null
                };
            }
        }

        return { success: false, url: null, error: 'NO_PAID_REGISTRATION' };
    } catch (error: unknown) {
        safeConsoleError('[kroegentocht.actions.ts][getKroegentochtWhatsAppLink] Failed to securely check registration or fetch community link', error);
        return { success: false, url: null, error: 'INTERNAL_SERVER_ERROR' };
    }
}
