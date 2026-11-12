'use server';

import 'server-only';
import { revalidateTag, unstable_noStore as noStore } from 'next/cache';
import {
    type PubCrawlSignup
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { z } from 'zod';
import { fetchPubCrawlSignupsDb, fetchPubCrawlSignupByIdDb, updatePubCrawlSignupDb, deletePubCrawlSignupDb } from '@/server/internal/kroegentocht/kroegentocht-signup-db.utils';;
import { requireKroegAdmin } from './beheer-kroegentocht-event.actions';
import { safeConsoleError } from '@/server/utils/logger';

export async function getPubCrawlSignups(eventId: number): Promise<Awaited<ReturnType<typeof fetchPubCrawlSignupsDb>>> {
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

export async function getPubCrawlSignup(id: number): Promise<Awaited<ReturnType<typeof fetchPubCrawlSignupByIdDb>>> {
    await requireKroegAdmin();
    try {
        return await fetchPubCrawlSignupByIdDb(id);
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][getPubCrawlSignup] ', `Failed to fetch signup ${id}: ${typedError.message}`);
        throw new Error('Kon aanmelding niet ophalen');
    }
}

export async function deletePubCrawlSignup(id: number, eventId: number): Promise<{ success: boolean }> {
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

export async function updatePubCrawlSignup(id: number, eventId: number, data: Partial<PubCrawlSignup>): Promise<{ success: boolean }> {
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

export async function togglePubCrawlTicketCheckIn(ticketId: number, currentStatus: boolean, eventId: number): Promise<{ success: boolean; newStatus: boolean }> {
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

export async function updatePubCrawlTickets(signupId: number, eventId: number, tickets: { id: number, name: string, initial: string }[]): Promise<{ success: boolean }> {
    await requireKroegAdmin();
    try {
        const { updatePubCrawlTicketDb } = await import('@/server/internal/kroegentocht/kroegentocht-ticket-db.utils');
        const { updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht/kroegentocht-signup-db.utils');

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

export async function deletePubCrawlTicket(ticketId: number, signupId: number, eventId: number): Promise<{ success: boolean }> {
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

export async function distributePubCrawlSignups(eventId: number): Promise<{ success: boolean }> {
    await requireKroegAdmin();
    try {
        const { getPubCrawlEvent } = await import('./beheer-kroegentocht-event.actions');
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

        const { fetchPubCrawlSignupsDb, updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht/kroegentocht-signup-db.utils');
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

export async function savePubCrawlGroupsAssignment(eventId: number, assignments: { signupId: number, groupName: string | null }[]): Promise<{ success: boolean }> {
    await requireKroegAdmin();
    try {
        const { updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht/kroegentocht-signup-db.utils');
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

export async function createManualPubCrawlSignup(
    eventId: number,
    data: {
        name: string;
        email: string;
        association?: string;
        initial?: string;
        group_name?: string | null;
    }
): Promise<{ success: boolean; signupId: number }> {
    await requireKroegAdmin();

    const trimmedName = data.name.trim();
    const trimmedEmail = (data.email || '').trim();

    if (!trimmedName) {
        throw new Error('Naam is verplicht');
    }

    const rawInitial = data.initial?.trim();
    const initial = rawInitial ? rawInitial.toUpperCase() : trimmedName.charAt(0).toUpperCase();
    const nameInitials = JSON.stringify([{ name: trimmedName, initial }]);

    try {
        const { createPubCrawlSignupDb, updatePubCrawlSignupDb } = await import('@/server/internal/kroegentocht/kroegentocht-signup-db.utils');
        const { createPubCrawlTicketsDb } = await import('@/server/internal/kroegentocht/kroegentocht-ticket-db.utils');

        const signupId = await createPubCrawlSignupDb({
            name: trimmedName,
            email: trimmedEmail,
            association: data.association?.trim() || '',
            amount_tickets: 1,
            name_initials: nameInitials,
            pub_crawl_event_id: eventId,
            payment_status: 'paid',
            directus_relations: null
        });

        if (data.group_name) {
            await updatePubCrawlSignupDb(signupId, { group_name: data.group_name });
        }

        await createPubCrawlTicketsDb(signupId, [{
            name: trimmedName,
            initial,
            qr_token: crypto.randomUUID()
        }]);

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true, signupId };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[kroegentocht-signup.actions.ts][createManualPubCrawlSignup] ', typedError.message);
        throw new Error('Handmatig toevoegen mislukt');
    }
}




export async function resendPubCrawlTicketEmail(signupId: number): Promise<{ success: boolean; error?: string }> {
    await requireKroegAdmin();
    if (!Number.isSafeInteger(signupId) || signupId <= 0) {
        return { success: false, error: 'Ongeldige aanmelding' };
    }

    try {
        const signup = await db.select({
            name: schema.pub_crawl_signups.name,
            email: schema.pub_crawl_signups.email,
            paymentStatus: schema.pub_crawl_signups.payment_status,
            amountTickets: schema.pub_crawl_signups.amount_tickets,
            eventName: schema.pub_crawl_events.name,
            whatsappCommunityUrl: schema.pub_crawl_events.whatsapp_community_url
        }).from(schema.pub_crawl_signups)
            .leftJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
            .where(eq(schema.pub_crawl_signups.id, signupId)).limit(1).then(rows => rows.at(0));

        if (!signup) return { success: false, error: 'Aanmelding niet gevonden' };
        if (signup.paymentStatus !== 'paid') {
            return { success: false, error: 'Alleen betaalde aanmeldingen kunnen tickets ontvangen' };
        }
        const email = z.string().email().safeParse(signup.email?.trim());
        if (!email.success) return { success: false, error: 'De aanmelding heeft geen geldig e-mailadres' };

        // Select only email fields: ticket IDs are BigInts and cannot be serialized to JSON.
        const tickets = await db.select({
            name: schema.pub_crawl_tickets.name,
            qrToken: schema.pub_crawl_tickets.qr_token
        }).from(schema.pub_crawl_tickets).where(eq(schema.pub_crawl_tickets.signup_id, signupId));
        if (!tickets.length || tickets.length !== signup.amountTickets || tickets.some(ticket => !ticket.qrToken)) {
            return { success: false, error: 'Tickets ontbreken of zijn onvolledig. Controleer de aanmelding.' };
        }

        const mailUrl = process.env.MAIL_SERVICE_URL;
        const token = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        if (!mailUrl || !token) throw new Error('Mail service configuration missing');

        const response = await fetch(`${mailUrl}/api/mail/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({
                to: email.data,
                templateId: 'pub_crawl_ticket',
                data: {
                    firstName: (signup.name || 'Deelnemer').split(' ')[0],
                    email: email.data,
                    signupId,
                    eventName: signup.eventName || 'Kroegentocht',
                    whatsappCommunityUrl: signup.whatsappCommunityUrl,
                    totalTickets: tickets.length,
                    tickets: await Promise.all(tickets.map(async ticket => ({
                        name: ticket.name,
                        qrDataUrl: await QRCode.toDataURL(ticket.qrToken || '', {
                            errorCorrectionLevel: 'M', width: 300, margin: 2,
                            color: { dark: '#5e2b52', light: '#ffffff' }
                        })
                    })))
                }
            })
        });
        if (!response.ok) throw new Error(`Mail service returned ${response.status}`);
        return { success: true };
    } catch (error) {
        safeConsoleError('[kroegentocht-signup.actions.ts][resendPubCrawlTicketEmail]', error);
        return { success: false, error: 'Ticketmail kon niet worden klaargezet. Probeer het later opnieuw.' };
    }
}
