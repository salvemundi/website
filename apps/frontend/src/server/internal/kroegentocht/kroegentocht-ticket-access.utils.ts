import 'server-only';
import crypto from 'crypto';
import { db, schema } from '@salvemundi/db';
import { and, asc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

/**
 * Toegang tot kroegentocht-tickets voor gasten (zonder account).
 *
 * Na een geslaagde betaling krijgt de bezoeker een ondertekende cookie met de
 * inschrijvings-id's waarvoor hij de tickets/WhatsApp-link mag zien. De cookie is
 * 14 dagen geldig en httpOnly, en kan niet worden vervalst zonder BETTER_AUTH_SECRET.
 */

export const TICKET_COOKIE_NAME = 'kroeg_tickets';
export const TICKET_COOKIE_MAX_AGE = 14 * 24 * 60 * 60; // 14 dagen in seconden
const MAX_SIGNUPS_IN_COOKIE = 10;

function getSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('BETTER_AUTH_SECRET ontbreekt');
    return secret;
}

function sign(payload: string): string {
    return crypto.createHmac('sha256', getSecret()).update(`kroeg-tickets:${payload}`).digest('base64url');
}

interface TicketCookiePayload {
    ids: number[];
    exp: number; // unix seconden
}

export function encodeTicketCookie(ids: number[]): string {
    const payload: TicketCookiePayload = {
        ids: [...new Set(ids)].slice(-MAX_SIGNUPS_IN_COOKIE),
        exp: Math.floor(Date.now() / 1000) + TICKET_COOKIE_MAX_AGE
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${body}.${sign(body)}`;
}

/** Geeft de inschrijvings-id's uit een geldige, niet-verlopen cookie terug (anders []). */
export function decodeTicketCookie(value: string | undefined): number[] {
    if (!value) return [];
    const [body, signature] = value.split('.');
    if (!body || !signature) return [];
    const expected = sign(body);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return [];
    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Partial<TicketCookiePayload>;
        if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return [];
        return Array.isArray(payload.ids) ? payload.ids.filter((n): n is number => Number.isInteger(n) && n > 0) : [];
    } catch {
        return [];
    }
}

/** Controleert of een betaalde inschrijving hoort bij het betaaltoken uit de bevestigings-URL. */
export async function isPaidSignupForToken(signupId: number, token: string): Promise<boolean> {
    if (!Number.isInteger(signupId) || signupId <= 0 || !token) return false;
    const t2 = alias(schema.transactions, 't2');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
    const rows = await db.select({ id: schema.pub_crawl_signups.id })
        .from(schema.pub_crawl_signups)
        .leftJoin(schema.transactions, eq(schema.transactions.pub_crawl_signup, schema.pub_crawl_signups.id))
        .leftJoin(schema.pub_crawl_signups_transactions, eq(schema.pub_crawl_signups_transactions.pub_crawl_signups_id, schema.pub_crawl_signups.id))
        .leftJoin(t2, eq(schema.pub_crawl_signups_transactions.transactions_id, t2.id))
        .where(and(
            eq(schema.pub_crawl_signups.id, signupId),
            eq(schema.pub_crawl_signups.payment_status, 'paid'),
            // access_token is een uuid-kolom: alleen vergelijken als het token een uuid is,
            // anders crasht de query op een Mollie-id (tr_...).
            isUuid
                ? or(eq(schema.transactions.access_token, token), eq(t2.access_token, token))
                : or(eq(schema.transactions.mollie_id, token), eq(t2.mollie_id, token))
        ))
        .limit(1);
    return rows.length > 0;
}

export interface SignupTicketInfo {
    signupId: number;
    eventId: number;
    eventName: string;
    eventDate: string | null;
    whatsappUrl: string | null;
    tickets: { id: number; name: string; initial: string; qrToken: string; checkedIn: boolean }[];
}

/** Haalt een betaalde inschrijving met event-info en tickets op (null als niet betaald/niet gevonden). */
export async function fetchSignupTicketInfo(signupId: number): Promise<SignupTicketInfo | null> {
    const row = (await db.select({
        id: schema.pub_crawl_signups.id,
        status: schema.pub_crawl_signups.payment_status,
        eventId: schema.pub_crawl_events.id,
        eventName: schema.pub_crawl_events.name,
        eventDate: schema.pub_crawl_events.date,
        whatsappUrl: schema.pub_crawl_events.whatsapp_community_url
    })
        .from(schema.pub_crawl_signups)
        .innerJoin(schema.pub_crawl_events, eq(schema.pub_crawl_signups.pub_crawl_event_id, schema.pub_crawl_events.id))
        .where(eq(schema.pub_crawl_signups.id, signupId))
        .limit(1)).at(0);
    if (!row || row.status !== 'paid') return null;

    const tickets = await db.select().from(schema.pub_crawl_tickets)
        .where(eq(schema.pub_crawl_tickets.signup_id, signupId))
        .orderBy(asc(schema.pub_crawl_tickets.id));

    return {
        signupId,
        eventId: row.eventId,
        eventName: row.eventName,
        eventDate: row.eventDate,
        whatsappUrl: row.whatsappUrl || null,
        tickets: tickets
            .filter((t) => !!t.qr_token)
            .map((t) => ({
                id: Number(t.id),
                name: t.name ?? '',
                initial: t.initial ?? '',
                qrToken: t.qr_token ?? '',
                checkedIn: !!t.checked_in
            }))
    };
}
