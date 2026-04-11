'use server';

import 'server-only';
import { 
    isUserInEventCommittee, 
    isUserAttendanceOfficer,
    fetchPubCrawlTicketByQrToken,
    fetchPubCrawlTicketsByEvent,
    fetchUserCommittees,
    fetchEventSignupByQrToken,
    fetchEventSignupsWithCheckInStatus,
    type EventSignup,
    type PubCrawlTicket
} from './qr-db.utils';
import { getSystemDirectus } from '@/lib/directus';
import { updateItem, readItems } from '@directus/sdk';
import { isSuperAdmin } from '@/lib/auth';

/**
 * Attendance Logic
 */
export async function updateSignupWithQRToken(signupId: number, token: string) {
    try {
        await getSystemDirectus().request(updateItem('event_signups', signupId, {
            qr_token: token
        }));
    } catch (err) {
        throw err;
    }
}

export async function checkInParticipant(qrToken: string) {
    try {
        const signup = await fetchEventSignupByQrToken(qrToken);

        if (!signup) {
            return { success: false, message: 'Ongeldige QR code. Deze QR code is niet gevonden.' };
        }

        if (signup.checked_in) {
            return { success: false, message: `Deze persoon is al ingecheckt op ${new Date(signup.checked_in_at!).toLocaleString('nl-NL')}.`, signup };
        }

        // Write: Sync to Directus (Shadow Write)
        const now = new Date().toISOString();
        await getSystemDirectus().request(updateItem('event_signups', signup.id, {
            checked_in: true, 
            checked_in_at: now
        }));

        const updated: EventSignup = {
            ...signup,
            checked_in: true,
            checked_in_at: now
        };
        
        return { success: true, message: 'Succesvol ingecheckt!', signup: updated };
    } catch (err) {
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

export async function getEventSignupsWithCheckIn(eventId: number | string) {
    try {
        return await fetchEventSignupsWithCheckInStatus(eventId);
    } catch (err) {
        return [];
    }
}

export async function isUserAuthorizedForAttendance(userId: string, eventId: number | string) {
    try {
        // 1. Super Admin check via SQL (faster)
        const userCommittees = await fetchUserCommittees(userId);
        if (isSuperAdmin(userCommittees)) return true;

        // 2. Performance check: Is user an attendance officer or in the committee?
        const [isOfficer, isInCommittee] = await Promise.all([
            isUserAttendanceOfficer(userId, eventId),
            isUserInEventCommittee(userId, eventId)
        ]);

        return isOfficer || isInCommittee;
    } catch (err) {
        return false;
    }
}

// ===== PUB CRAWL / KROEGENTOCHT FUNCTIONS =====

export async function updatePubCrawlSignupWithQRToken(signupId: number, token: string) {
    try {
        await getSystemDirectus().request(updateItem('pub_crawl_signups', signupId, {
            qr_token: token
        }));
    } catch (err) {
        throw err;
    }
}

export async function checkInPubCrawlParticipant(qrToken: string) {
    try {
        const ticket = await fetchPubCrawlTicketByQrToken(qrToken);

        if (!ticket) {
            return { success: false, message: 'Ongeldige QR code. Ticket niet gevonden.' };
        }

        if (ticket.checked_in) {
            const time = ticket.checked_in_at ? new Date(ticket.checked_in_at).toLocaleString('nl-NL') : 'eerder';
            return { success: false, message: `${ticket.name} is al ingecheckt om ${time}.`, ticket };
        }

        const now = new Date().toISOString();
        await getSystemDirectus().request(updateItem('pub_crawl_tickets', ticket.id, {
            checked_in: true,
            checked_in_at: now
        }));

        const updated: PubCrawlTicket = {
            ...ticket,
            checked_in: true,
            checked_in_at: now
        };

        return {
            success: true,
            message: `Welkom ${updated.name}!`,
            ticket: updated
        };
    } catch (err) {
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

export async function getPubCrawlSignupsWithCheckIn(eventId: number | string) {
    try {
        return await fetchPubCrawlTicketsByEvent(eventId);
    } catch (err) {
        return [];
    }
}

export async function isUserAuthorizedForPubCrawlAttendance(userId: string) {
    try {
        const userCommittees = await fetchUserCommittees(userId);
        return userCommittees.length > 0;
    } catch (err) {
        return false;
    }
}
