'use server';

import 'server-only';
import { db, schema } from '@salvemundi/db';
import { and, eq, sql } from 'drizzle-orm';
import { unstable_noStore as noStore, revalidateTag } from 'next/cache';
import { requireKroegAdmin } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-event.actions';

const key = (eventId: number) => `kroegentocht-scanner:event:${eventId}`;

export async function getPubCrawlScanner(eventId: number) {
    noStore();
    if (!Number.isSafeInteger(eventId) || eventId < 1) return null;
    const flags = await db.select().from(schema.feature_flags).where(eq(schema.feature_flags.route_match, key(eventId))).limit(1);
    const flag = flags.at(0);
    if (!flag?.is_active) return null;
    const events = await db.select({ name: schema.pub_crawl_events.name, groups: schema.pub_crawl_events.groups }).from(schema.pub_crawl_events).where(eq(schema.pub_crawl_events.id, eventId)).limit(1);
    const event = events.at(0);
    if (!event) return null;
    const groups = (Array.isArray(event.groups) ? event.groups : []).map((group: unknown) => {
        if (typeof group === 'string') return group;
        if (group && typeof group === 'object' && 'name' in group && typeof group.name === 'string') return group.name;
        return '';
    }).filter(Boolean);
    return { name: event.name, groups };
}

export async function getPubCrawlScannerEnabled(eventId: number) {
    await requireKroegAdmin();
    return !!(await getPubCrawlScanner(eventId));
}

export async function setPubCrawlScannerEnabled(eventId: number, enabled: boolean) {
    await requireKroegAdmin();
    if (!Number.isSafeInteger(eventId) || eventId < 1 || typeof enabled !== 'boolean') throw new Error('Ongeldige instelling');
    // Serialize creation as route_match has no unique constraint.
    await db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(72831, ${eventId})`);
        const events = await tx.select({ id: schema.pub_crawl_events.id }).from(schema.pub_crawl_events).where(eq(schema.pub_crawl_events.id, eventId));
        const event = events.at(0);
        if (!event) throw new Error('Evenement niet gevonden');
        const flags = await tx.select().from(schema.feature_flags).where(eq(schema.feature_flags.route_match, key(eventId))).limit(1);
        const flag = flags.at(0);
        if (flag) await tx.update(schema.feature_flags).set({ is_active: enabled }).where(eq(schema.feature_flags.id, flag.id));
        else await tx.insert(schema.feature_flags).values({ name: `Kroegentocht scanner ${eventId}`, route_match: key(eventId), is_active: enabled });
    });
    return enabled;
}

export async function scanPubCrawlTicket(eventId: number, group: string, token: string) {
    const scanner = await getPubCrawlScanner(eventId);
    if (!scanner) return { status: 'inactive', message: 'De scanner is gedeactiveerd.' };
    if (typeof group !== 'string' || !scanner.groups.includes(group)) return { status: 'error', message: 'Kies eerst je groep.' };
    if (typeof token !== 'string' || !token.trim() || token.length > 255) return { status: 'error', message: 'Ongeldige QR-code.' };
    const tickets = schema.pub_crawl_tickets;
    const signups = schema.pub_crawl_signups;
    const rows = await db.select({ id: tickets.id, name: tickets.name, checkedIn: tickets.checked_in, group: signups.group_name, payment: signups.payment_status }).from(tickets)
        .innerJoin(signups, eq(tickets.signup_id, signups.id))
        .where(and(eq(tickets.qr_token, token.trim()), eq(signups.pub_crawl_event_id, eventId))).limit(1);
    const row = rows.at(0);
    if (!row) return { status: 'error', message: 'Geen ticket gevonden voor deze kroegentocht.' };
    if (row.payment !== 'paid') return { status: 'error', message: 'Ticket is niet betaald.' };
    const name = row.name || 'Deelnemer';
    if (row.group !== group) return { status: 'wrong-group', message: `${name}: geldig ticket, maar ${row.group ? `hoort bij groep ${row.group}` : 'nog niet ingedeeld in een groep'}. Niet ingecheckt.` };
    // Conditional update prevents two scanners from admitting the same ticket.
    const updated = await db.update(tickets).set({ checked_in: true, checked_in_at: new Date().toISOString() })
        .where(and(eq(tickets.id, row.id), sql`${tickets.checked_in} is not true`)).returning({ id: tickets.id });
    if (!updated.length) return { status: 'duplicate', message: `${name}: geldig ticket voor groep ${group}, maar al ingecheckt.` };
    revalidateTag(`signups-${eventId}`, 'max');
    return { status: 'success', message: `${name}: geldig ticket, hoort bij groep ${group}. Ingecheckt!` };
}
