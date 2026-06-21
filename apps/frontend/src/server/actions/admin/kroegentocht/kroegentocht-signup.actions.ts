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
        const openSignupIds = sqlSignups.filter(s => s.payment_status === 'open' && s.id !== undefined).map(s => Number(s.id));

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
                        updatePubCrawlSignupDb(Number(signup.id), { payment_status: latestStatus as 'open' | 'paid' | 'failed' | 'canceled' | 'expired' }).catch((syncError) => {
                            const typedSyncError = syncError instanceof Error ? syncError : new Error(String(syncError));
                            safeConsoleError('kroegentocht-signup.actions.ts][getPubCrawlSignups]', `Failed to update signup payment status: ${typedSyncError.message}`);
                        });
                    }
                }
            } catch (syncCheckError) {
                const typedSyncCheckError = syncCheckError instanceof Error ? syncCheckError : new Error(String(syncCheckError));
                safeConsoleError('kroegentocht-signup.actions.ts][getPubCrawlSignups]', `Directus sync check failed: ${typedSyncCheckError.message}`);
            }
        }

        return sqlSignups;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][getPubCrawlSignups]', `Failed to fetch signups: ${typedError.message}`);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getPubCrawlSignup(id: number) {
    await requireKroegAdmin();
    try {
        return await fetchPubCrawlSignupByIdDb(id);
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][getPubCrawlSignup]', `Failed to fetch signup ${id}: ${typedError.message}`);
        throw new Error('Kon aanmelding niet ophalen');
    }
}

export async function deletePubCrawlSignup(id: number, eventId: number) {
    await requireKroegAdmin();
    try {
        await deletePubCrawlSignupDb(id);
        revalidateTag(`signups-${eventId}`, 'max');

        getSystemDirectus().request(deleteItem('pub_crawl_signups', id)).catch((deleteError) => {
            const typedDeleteError = deleteError instanceof Error ? deleteError : new Error(String(deleteError));
            safeConsoleError('kroegentocht-signup.actions.ts][deletePubCrawlSignup]', `Failed to delete signup ${id}: ${typedDeleteError.message}`);
        });

        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][deletePubCrawlSignup]', `Failed to delete signup ${id}: ${typedError.message}`);
        throw new Error('Verwijderen mislukt');
    }
}

export async function updatePubCrawlSignup(id: number, eventId: number, data: Partial<PubCrawlSignup>) {
    await requireKroegAdmin();

    const allowedFields = ['payment_status', 'association', 'name', 'email', 'group_name'];
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        throw new Error('Geen geldige velden om bij te werken');
    }

    try {
        await updatePubCrawlSignupDb(id, filteredData);
        revalidateTag(`signups-${eventId}`, 'max');

        getSystemDirectus().request(updateItem('pub_crawl_signups', id, filteredData)).catch((updateError) => {
            const typedUpdateError = updateError instanceof Error ? updateError : new Error(String(updateError));
            safeConsoleError('kroegentocht-signup.actions.ts][updatePubCrawlSignup]', `Failed to update signup ${id}: ${typedUpdateError.message}`);
        });

        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][updatePubCrawlSignup]', `Failed to update signup ${id}: ${typedError.message}`);
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
        })).catch((ticketError) => {
            const typedTicketError = ticketError instanceof Error ? ticketError : new Error(String(ticketError));
            safeConsoleError('kroegentocht-signup.actions.ts][togglePubCrawlTicketCheckIn]', `Failed to update ticket ${ticketId}: ${typedTicketError.message}`);
        });

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true, newStatus };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][togglePubCrawlTicketCheckIn]', `Failed to toggle check-in ${ticketId}: ${typedError.message}`);
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
            })).catch((ticketError) => {
                const typedTicketError = ticketError instanceof Error ? ticketError : new Error(String(ticketError));
                safeConsoleError('kroegentocht-signup.actions.ts][updatePubCrawlTickets]', `Failed to update ticket ${ticket.id}: ${typedTicketError.message}`);
            });
        }

        const nameInitials = JSON.stringify(tickets.map(t => ({ name: t.name, initial: t.initial })));
        await updatePubCrawlSignupDb(signupId, { name_initials: nameInitials });

        getSystemDirectus().request(updateItem('pub_crawl_signups', signupId, {
            name_initials: nameInitials
        })).catch((signupError) => {
            const typedSignupError = signupError instanceof Error ? signupError : new Error(String(signupError));
            safeConsoleError('kroegentocht-signup.actions.ts][updatePubCrawlTickets]', `Failed to update signup ${signupId}: ${typedSignupError.message}`);
        });

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][updatePubCrawlTickets]', `updatePubCrawlTickets failed: ${typedError.message}`);
        throw new Error('Bijwerken tickets mislukt');
    }
}

export async function deletePubCrawlTicket(ticketId: number, signupId: number, eventId: number) {
    await requireKroegAdmin();
    try {
        await query('DELETE FROM pub_crawl_tickets WHERE id = $1', [ticketId]);
        getSystemDirectus().request(deleteItem('pub_crawl_tickets', ticketId)).catch((ticketError) => {
            const typedTicketError = ticketError instanceof Error ? ticketError : new Error(String(ticketError));
            safeConsoleError('kroegentocht-signup.actions.ts][deletePubCrawlTicket]', `Failed to delete ticket ${ticketId}: ${typedTicketError.message}`);
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
        })).catch((signupError) => {
            const typedSignupError = signupError instanceof Error ? signupError : new Error(String(signupError));
            safeConsoleError('kroegentocht-signup.actions.ts][deletePubCrawlTicket]', `Failed to update signup ${signupId}: ${typedSignupError.message}`);
        });

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][deletePubCrawlTicket]', `Failed to delete ticket: ${typedError.message}`);
        throw new Error('Verwijderen ticket mislukt');
    }
}

export async function distributePubCrawlSignups(eventId: number) {
    await requireKroegAdmin();
    try {
        const { getPubCrawlEvent } = await import('./kroegentocht-event.actions');
        const event = await getPubCrawlEvent(eventId);
        const eventGroups = event.groups || [];
        const groups: string[] = eventGroups.map((g: unknown): string => {
            if (typeof g === 'string') return g;
            if (g && typeof g === 'object' && 'name' in g) {
                return String((g as { name: unknown }).name || '');
            }
            return '';
        }).filter((name): name is string => name !== '');
        if (groups.length === 0) {
            throw new Error('Geen groepen gedefinieerd voor dit event. Voeg eerst groepen toe in de event details.');
        }

        const { fetchPubCrawlSignupsDb, updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht-db.utils');
        const signups = await fetchPubCrawlSignupsDb(eventId);
        const paidSignups = signups.filter(s => s.payment_status === 'paid');

        if (paidSignups.length === 0) {
            throw new Error('Geen betaalde aanmeldingen gevonden om te verdelen.');
        }

        const groupTicketCounts = new Map<string, number>(groups.map(g => [g, 0]));
        const sortedSignups = [...paidSignups].sort((a, b) => b.amount_tickets - a.amount_tickets);

        for (const signup of sortedSignups) {
            if (!signup.id) continue;

            let bestGroup = groups[0];
            let minTickets = Infinity;

            for (const group of groups) {
                const count = groupTicketCounts.get(group) || 0;
                if (count < minTickets) {
                    minTickets = count;
                    bestGroup = group;
                }
            }

            await updatePubCrawlSignupDb(Number(signup.id), { group_name: bestGroup });
            groupTicketCounts.set(bestGroup, minTickets + signup.amount_tickets);
        }

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][distributePubCrawlSignups]', `Error: ${typedError.message}`);
        throw typedError;
    }
}

export async function savePubCrawlGroupsAssignment(eventId: number, assignments: { signupId: number, groupName: string | null }[]) {
    await requireKroegAdmin();
    try {
        const { updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht-db.utils');
        for (const item of assignments) {
            await updatePubCrawlSignupDb(item.signupId, { group_name: item.groupName });
            getSystemDirectus().request(updateItem('pub_crawl_signups', item.signupId, {
                group_name: item.groupName
            })).catch(() => {});
        }
        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('kroegentocht-signup.actions.ts][savePubCrawlGroupsAssignment]', `Error: ${typedError.message}`);
        throw typedError;
    }
}