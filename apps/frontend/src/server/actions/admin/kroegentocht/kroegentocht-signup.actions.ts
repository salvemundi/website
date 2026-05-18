'use server';

import 'server-only';
import { revalidateTag, unstable_noStore as noStore } from 'next/cache';
import {
    type PubCrawlSignup
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { getSystemDirectus } from "@/lib/directus";
import { query } from '@/lib/database';
import {
    readItems,
    updateItem,
    deleteItem
} from '@directus/sdk';
import {
    fetchPubCrawlSignupsDb,
    fetchPubCrawlSignupByIdDb,
    updatePubCrawlSignupDb,
    deletePubCrawlSignupDb
} from '@/server/internal/kroegentocht-db.utils';
import { requireKroegAdmin } from './kroegentocht-event.actions';
import { safeConsoleError } from '@/server/utils/logger';

export async function getPubCrawlSignups(eventId: number) {
    noStore();
    await requireKroegAdmin();
    try {
        const sqlSignups = await fetchPubCrawlSignupsDb(eventId);

        const openSignupIds = sqlSignups.filter(s => s.payment_status === 'open').map(s => s.id);

        if (openSignupIds.length > 0) {
            try {
                const directusItems = await getSystemDirectus().request(readItems('pub_crawl_signups', {
                    filter: { id: { _in: openSignupIds } },
                    fields: ['id', 'payment_status']
                })) as unknown as { id: number; payment_status: string }[];

                const directusStatusMap = new Map<number, string>(directusItems.map((item) => [item.id, item.payment_status]));

                for (const signup of sqlSignups) {
                    if (!signup.id) continue;
                    const latestStatus = directusStatusMap.get(Number(signup.id));
                    if (latestStatus && latestStatus !== signup.payment_status) {
                        (signup as { [key: string]: unknown }).payment_status = latestStatus;
                        updatePubCrawlSignupDb(Number(signup.id), { payment_status: latestStatus as 'open' | 'paid' | 'failed' | 'canceled' | 'expired' }).catch((error) => {
                            safeConsoleError('[Kroegentocht-Action][getPubCrawlSignups] Failed to update signup payment status:', error);
                        });
                    }
                }
            } catch (error) {
                safeConsoleError('[Kroegentocht-Action][getPubCrawlSignups] Directus sync check failed:', error);
            }
        }

        return sqlSignups;
    } catch (error: unknown) {
        safeConsoleError('[Kroegentocht-Action][getPubCrawlSignups] Failed to fetch signups:', error);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getPubCrawlSignup(id: number) {
    await requireKroegAdmin();
    try {
        return await fetchPubCrawlSignupByIdDb(id);
    } catch (error: unknown) {
        safeConsoleError(`[Kroegentocht-Action][getPubCrawlSignup] Failed to fetch signup ${id}:`, error);
        throw new Error('Kon aanmelding niet ophalen');
    }
}

export async function deletePubCrawlSignup(id: number, eventId: number) {
    await requireKroegAdmin();
    try {
        await deletePubCrawlSignupDb(id);
        revalidateTag(`signups-${eventId}`, 'max');

        getSystemDirectus().request(deleteItem('pub_crawl_signups', id)).catch((error) => {
            safeConsoleError(`[Kroegentocht-Action][deletePubCrawlSignup] Failed to delete signup ${id}:`, error);
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[Kroegentocht-Action][deletePubCrawlSignup] Failed to delete signup ${id}:`, error);
        throw new Error('Verwijderen mislukt');
    }
}

export async function updatePubCrawlSignup(id: number, eventId: number, data: Partial<PubCrawlSignup>) {
    await requireKroegAdmin();

    const allowedFields = ['payment_status', 'association', 'name', 'email'];
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        throw new Error('Geen geldige velden om bij te werken');
    }

    try {
        await updatePubCrawlSignupDb(id, filteredData);
        revalidateTag(`signups-${eventId}`, 'max');

        getSystemDirectus().request(updateItem('pub_crawl_signups', id, filteredData)).catch((error) => {
            safeConsoleError(`[Kroegentocht-Action][updatePubCrawlSignup] Failed to update signup ${id}:`, error);
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[Kroegentocht-Action][updatePubCrawlSignup] Failed to update signup ${id}:`, error);
        throw new Error('Bijwerken mislukt');
    }
}

export async function togglePubCrawlTicketCheckIn(ticketId: number, currentStatus: boolean, eventId: number) {
    await requireKroegAdmin();
    const newStatus = !currentStatus;
    const now = newStatus ? new Date().toISOString() : null;

    try {
        await query(
            'UPDATE pub_crawl_tickets SET checked_in = $1, checked_in_at = $2 WHERE id = $3',
            [newStatus, now, ticketId]
        );

        getSystemDirectus().request(updateItem('pub_crawl_tickets', ticketId, {
            checked_in: newStatus,
            checked_in_at: now
        })).catch((error) => {
            safeConsoleError(`[Kroegentocht-Action][togglePubCrawlTicketCheckIn] Failed to update ticket ${ticketId}:`, error);
        });

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true, newStatus };
    } catch (error: unknown) {
        safeConsoleError(`[Kroegentocht-Action][togglePubCrawlTicketCheckIn] Failed to toggle check-in ${ticketId}:`, error);
        throw new Error('Inchecken mislukt');
    }
}

export async function updatePubCrawlTickets(signupId: number, eventId: number, tickets: { id: number, name: string, initial: string }[]) {
    await requireKroegAdmin();
    try {
        const { updatePubCrawlTicketDb, updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht-db.utils');

        for (const ticket of tickets) {
            await updatePubCrawlTicketDb(ticket.id, { name: ticket.name, initial: ticket.initial });
            getSystemDirectus().request(updateItem('pub_crawl_tickets', ticket.id, {
                name: ticket.name,
                initial: ticket.initial
            })).catch((error) => {
                safeConsoleError(`[Kroegentocht-Action][updatePubCrawlTickets] Failed to update ticket ${ticket.id}:`, error);
            });
        }

        const nameInitials = JSON.stringify(tickets.map(t => ({ name: t.name, initial: t.initial })));
        await updatePubCrawlSignupDb(signupId, { name_initials: nameInitials });

        getSystemDirectus().request(updateItem('pub_crawl_signups', signupId, {
            name_initials: nameInitials
        })).catch((error) => {
            safeConsoleError(`[Kroegentocht-Action][updatePubCrawlTickets] Failed to update signup ${signupId}:`, error);
        });

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[Kroegentocht-Action] updatePubCrawlTickets failed:', error);
        throw new Error('Bijwerken tickets mislukt');
    }
}

export async function deletePubCrawlTicket(ticketId: number, signupId: number, eventId: number) {
    await requireKroegAdmin();
    try {
        await query('DELETE FROM pub_crawl_tickets WHERE id = $1', [ticketId]);
        getSystemDirectus().request(deleteItem('pub_crawl_tickets', ticketId)).catch((error) => {
            safeConsoleError(`[Kroegentocht-Action][deletePubCrawlTicket] Failed to delete ticket ${ticketId}:`, error);
        });

        const { rows: remainingTickets } = await query<{ name: string | null; initial: string | null }>(
            'SELECT name, initial FROM pub_crawl_tickets WHERE signup_id = $1 ORDER BY id ASC',
            [signupId]
        );

        const amountTickets = remainingTickets.length;
        const nameInitials = JSON.stringify(remainingTickets.map(t => ({ name: t.name, initial: t.initial })));

        await query(
            'UPDATE pub_crawl_signups SET amount_tickets = $1, name_initials = $2 WHERE id = $3',
            [amountTickets, nameInitials, signupId]
        );

        getSystemDirectus().request(updateItem('pub_crawl_signups', signupId, {
            amount_tickets: amountTickets,
            name_initials: nameInitials
        })).catch((error) => {
            safeConsoleError(`[Kroegentocht-Action][deletePubCrawlTicket] Failed to update signup ${signupId}:`, error);
        });

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[Kroegentocht-Action][deletePubCrawlTicket] Failed to delete ticket:', error);
        throw new Error('Verwijderen ticket mislukt');
    }
}
