'use server';

import { cookies } from 'next/headers';
import { safeConsoleError } from '@/server/utils/logger';
import {
    TICKET_COOKIE_MAX_AGE,
    TICKET_COOKIE_NAME,
    decodeTicketCookie,
    encodeTicketCookie,
    fetchSignupTicketInfo,
    isPaidSignupForToken
} from '@/server/internal/kroegentocht/kroegentocht-ticket-access.utils';

export interface MyKroegTickets {
    signupId: number;
    eventName: string;
    whatsappUrl: string | null;
    pdfUrl: string;
    names: string[];
}

function toPublic(info: NonNullable<Awaited<ReturnType<typeof fetchSignupTicketInfo>>>): MyKroegTickets {
    return {
        signupId: info.signupId,
        eventName: info.eventName,
        whatsappUrl: info.whatsappUrl,
        pdfUrl: `/api/kroegentocht/tickets/${info.signupId}`,
        names: info.tickets.map((t) => `${t.name} ${t.initial ? `${t.initial}.` : ''}`.trim())
    };
}

/**
 * Wordt aangeroepen op de bevestigingspagina. Als de inschrijving betaald is en het token
 * klopt, wordt de inschrijving 14 dagen in een ondertekende cookie onthouden en krijgt de
 * bezoeker de WhatsApp-link en de PDF-link terug.
 */
export async function claimKroegentochtTickets(
    signupId: number,
    token: string
): Promise<{ status: 'ok'; tickets: MyKroegTickets } | { status: 'pending' | 'invalid' }> {
    try {
        if (!(await isPaidSignupForToken(signupId, token))) {
            return { status: 'pending' };
        }
        const info = await fetchSignupTicketInfo(signupId);
        if (!info) return { status: 'pending' };

        const jar = await cookies();
        const existing = decodeTicketCookie(jar.get(TICKET_COOKIE_NAME)?.value);
        jar.set(TICKET_COOKIE_NAME, encodeTicketCookie([...existing, signupId]), {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: TICKET_COOKIE_MAX_AGE
        });

        return { status: 'ok', tickets: toPublic(info) };
    } catch (error: unknown) {
        safeConsoleError('[kroegentocht-tickets.actions.ts][claimKroegentochtTickets]', error);
        return { status: 'invalid' };
    }
}

/** Inschrijvingen die in de cookie van deze bezoeker staan (max. 14 dagen oud). */
export async function getMyKroegentochtTickets(): Promise<MyKroegTickets[]> {
    try {
        const jar = await cookies();
        const ids = decodeTicketCookie(jar.get(TICKET_COOKIE_NAME)?.value);
        const infos = await Promise.all(ids.map((id) => fetchSignupTicketInfo(id)));
        return infos.filter((i): i is NonNullable<typeof i> => i !== null).map(toPublic).reverse();
    } catch (error: unknown) {
        safeConsoleError('[kroegentocht-tickets.actions.ts][getMyKroegentochtTickets]', error);
        return [];
    }
}
