'use server';

import 'server-only';
import { revalidateTag, unstable_noStore as noStore } from 'next/cache';
import {
    type PubCrawlSignup
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
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
        return sqlSignups;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][getPubCrawlSignups] ', `Failed to fetch signups: ${typedError.message}`);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getPubCrawlSignup(id: number) {
    await requireKroegAdmin();
    try {
        return await fetchPubCrawlSignupByIdDb(id);
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][getPubCrawlSignup] ', `Failed to fetch signup ${id}: ${typedError.message}`);
        throw new Error('Kon aanmelding niet ophalen');
    }
}

export async function deletePubCrawlSignup(id: number, eventId: number) {
    await requireKroegAdmin();
    try {
        await deletePubCrawlSignupDb(id);
        revalidateTag(`signups-${eventId}`, 'max');

        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][deletePubCrawlSignup] ', `Failed to delete signup ${id}: ${typedError.message}`);
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

        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][updatePubCrawlSignup] ', `Failed to update signup ${id}: ${typedError.message}`);
        throw new Error('Bijwerken mislukt');
    }
}

export async function togglePubCrawlTicketCheckIn(ticketId: number, currentStatus: boolean, eventId: number) {
    await requireKroegAdmin();
    const newStatus = !currentStatus;
    const now = newStatus ? new Date().toISOString() : null;

    try {
        await db.update(schema.pub_crawl_tickets).set({
            checked_in: newStatus,
            checked_in_at: now
        }).where(eq(schema.pub_crawl_tickets.id, BigInt(ticketId)));

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true, newStatus };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][togglePubCrawlTicketCheckIn] ', `Failed to toggle check-in ${ticketId}: ${typedError.message}`);
        throw new Error('Inchecken mislukt');
    }
}

export async function updatePubCrawlTickets(signupId: number, eventId: number, tickets: { id: number, name: string, initial: string }[]) {
    await requireKroegAdmin();
    try {
        const { updatePubCrawlTicketDb, updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht-db.utils');

        for (const ticket of tickets) {
            await updatePubCrawlTicketDb(ticket.id, { name: ticket.name, initial: ticket.initial });
        }

        const nameInitials = JSON.stringify(tickets.map(t => ({ name: t.name, initial: t.initial })));
        await updatePubCrawlSignupDb(signupId, { name_initials: nameInitials });

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][updatePubCrawlTickets] ', `updatePubCrawlTickets failed: ${typedError.message}`);
        throw new Error('Bijwerken tickets mislukt');
    }
}

export async function deletePubCrawlTicket(ticketId: number, signupId: number, eventId: number) {
    await requireKroegAdmin();
    try {
        await db.delete(schema.pub_crawl_tickets).where(eq(schema.pub_crawl_tickets.id, BigInt(ticketId)));

        const remainingTickets = await db.select({
            name: schema.pub_crawl_tickets.name,
            initial: schema.pub_crawl_tickets.initial
        }).from(schema.pub_crawl_tickets)
        .where(eq(schema.pub_crawl_tickets.signup_id, signupId));

        const amountTickets = remainingTickets.length;
        const nameInitials = JSON.stringify(remainingTickets.map(t => ({ name: t.name, initial: t.initial })));

        await db.update(schema.pub_crawl_signups).set({
            amount_tickets: amountTickets,
            name_initials: nameInitials
        }).where(eq(schema.pub_crawl_signups.id, signupId));

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][deletePubCrawlTicket] ', `Failed to delete ticket: ${typedError.message}`);
        throw new Error('Verwijderen ticket mislukt');
    }
}

export async function distributePubCrawlSignups(eventId: number) {
    await requireKroegAdmin();
    try {
        const { getPubCrawlEvent } = await import('./kroegentocht-event.actions');
        const event = await getPubCrawlEvent(eventId);
        const eventGroups = ((event.groups || []) as unknown[]);
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
        safeConsoleError('[kroegentocht-signup.actions.ts][distributePubCrawlSignups] ', `Error: ${typedError.message}`);
        throw typedError;
    }
}

export async function savePubCrawlGroupsAssignment(eventId: number, assignments: { signupId: number, groupName: string | null }[]) {
    await requireKroegAdmin();
    try {
        const { updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht-db.utils');
        for (const item of assignments) {
            await updatePubCrawlSignupDb(item.signupId, { group_name: item.groupName });
        }
        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][savePubCrawlGroupsAssignment] ', `Error: ${typedError.message}`);
        throw typedError;
    }
}



