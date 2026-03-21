import QRCode from 'qrcode';
import { directus, directusRequest } from './directus';
import { readItem, readItems, updateItem } from '@directus/sdk';
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';
import { normalizeCommitteeName } from './committee-utils';
import { isSuperAdmin } from './auth-utils';

interface AttendanceOfficer {
    directus_users_id?: string | number | null;
}

/**
 * Generate a stable token for a signup.
 * Legacy Prefix: r-
 */
export function generateQRToken(signupId: number | string, eventId: number | string) {
    const rand = Math.random().toString(36).substring(2, 15);
    const time = Date.now().toString(36);
    return `r-${signupId}-${eventId}-${time}-${rand}`;
}

/**
 * Generates a QR Code as DataURL.
 */
export async function generateQRCode(data: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 1,
            width: 300,
            color: { dark: '#7B2CBF', light: '#FFFFFF' }
        });
        return dataUrl;
    } catch (err) {
        console.error('Failed to generate QR code:', err);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Legacy Attendance Logic (adapted for V7 fetch)
 */
export async function updateSignupWithQRToken(signupId: number | string, token: string) {
    try {
        await directusRequest(updateItem('event_signups', signupId as any, {
            qr_token: token
        }));
    } catch (err) {
        throw err;
    }
}

export async function checkInParticipant(qrToken: string) {
    try {
        const signups = await directusRequest<any[]>(readItems('event_signups', {
            filter: { qr_token: { _eq: qrToken } },
            fields: ['id', { event_id: ['*'] as any }, 'checked_in', 'checked_in_at', 'qr_token', 'participant_name' as any, 'participant_email' as any, 'participant_phone' as any]
        }));

        if (!signups || signups.length === 0) {
            return { success: false, message: 'Ongeldige QR code. Deze QR code is niet gevonden.' };
        }

        const signup = signups[0];
        if (signup.checked_in) {
            return { success: false, message: `Deze persoon is al ingecheckt op ${new Date(signup.checked_in_at!).toLocaleString('nl-NL')}.`, signup };
        }

        await directusRequest(updateItem('event_signups', signup.id, {
            checked_in: true, 
            checked_in_at: new Date().toISOString() 
        }));

        const updated = await directusRequest<any>(readItem('event_signups', signup.id, {
            fields: ['id' as any, { event_id: ['*'] as any }, 'checked_in' as any, 'checked_in_at' as any, 'participant_name' as any, 'participant_email' as any, 'participant_phone' as any]
        }));
        
        return { success: true, message: 'Succesvol ingecheckt!', signup: updated };
    } catch (err) {
        console.error('[QRService] Check-in error:', err);
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

export async function getEventSignupsWithCheckIn(eventId: number | string) {
    try {
        const list = await directusRequest<any[]>(readItems('event_signups', {
            filter: { event_id: { _eq: eventId as any } },
            fields: ['id' as any, 'event_id' as any, 'checked_in' as any, 'checked_in_at' as any, 'date_created' as any, 'participant_name' as any, 'participant_email' as any, 'participant_phone' as any, 'qr_token' as any],
            sort: ['checked_in_at', '-date_created'] as any
        }));
        return list || [];
    } catch (err) {
        console.error('[QRService] getEventSignupsWithCheckIn error:', err);
        return [];
    }
}

export async function isUserAuthorizedForAttendance(userId: string, eventId: number | string) {
    try {
        const userCommittees = await directusRequest<any[]>(readItems('committee_members', {
            filter: { user_id: { _eq: userId } },
            fields: [{ committee_id: ['name'] }] as any
        }));
        
        if (isSuperAdmin(userCommittees)) return true;

        const eventData = await directusRequest<any>(readItem('events', eventId as any, {
            fields: ['committee_id' as any, 'attendance_officers' as any]
        }));
        if (!eventData) return false;

        if (eventData.attendance_officers && Array.isArray(eventData.attendance_officers)) {
            const found = eventData.attendance_officers.some((a: AttendanceOfficer) => String(a.directus_users_id) === String(userId));
            if (found) return true;
        }

        if (eventData.committee_id) {
            const commId = typeof eventData.committee_id === 'object' ? eventData.committee_id.id : eventData.committee_id;
            const members = await directusRequest<any[]>(readItems('committee_members', {
                filter: { 
                    committee_id: { _eq: commId as any },
                    user_id: { _eq: userId }
                },
                fields: ['id']
            }));
            if (members && members.length > 0) return true;
        }

        return false;
    } catch (err) {
        console.error('[QRService] isUserAuthorizedForAttendance error:', err);
        return false;
    }
}

// ===== PUB CRAWL / KROEGENTOCHT FUNCTIONS =====

export async function updatePubCrawlSignupWithQRToken(signupId: number | string, token: string) {
    try {
        await directusRequest(updateItem(COLLECTIONS.PUB_CRAWL_SIGNUPS as any, signupId as any, {
            qr_token: token
        }));
    } catch (err) {
        throw err;
    }
}

export async function checkInPubCrawlParticipant(qrToken: string) {
    try {
        const tickets = await directusRequest<any[]>(readItems(COLLECTIONS.PUB_CRAWL_TICKETS as any, {
            filter: { [FIELDS.TICKETS.QR_TOKEN]: { _eq: qrToken } },
            fields: ['*', { [FIELDS.TICKETS.SIGNUP_ID]: ['*'] }] as any
        }));

        if (!tickets || tickets.length === 0) {
            return { success: false, message: 'Ongeldige QR code. Ticket niet gevonden.' };
        }

        const ticket = tickets[0] as any;
        const signup = ticket[FIELDS.TICKETS.SIGNUP_ID];

        if (ticket[FIELDS.TICKETS.CHECKED_IN]) {
            const time = ticket[FIELDS.TICKETS.CHECKED_IN_AT] ? new Date(ticket[FIELDS.TICKETS.CHECKED_IN_AT]).toLocaleString('nl-NL') : 'eerder';
            return { success: false, message: `${ticket[FIELDS.TICKETS.NAME]} is al ingecheckt om ${time}.`, signup };
        }

        await directusRequest(updateItem(COLLECTIONS.PUB_CRAWL_TICKETS as any, ticket.id, {
            [FIELDS.TICKETS.CHECKED_IN]: true,
            [FIELDS.TICKETS.CHECKED_IN_AT]: new Date().toISOString()
        }));

        const updatedTicket = await directusRequest<any>(readItem(COLLECTIONS.PUB_CRAWL_TICKETS as any, ticket.id, {
            fields: ['*', { [FIELDS.TICKETS.SIGNUP_ID]: ['*'] }] as any
        })) as any;

        return {
            success: true,
            message: `Welkom ${updatedTicket[FIELDS.TICKETS.NAME]}!`,
            signup: updatedTicket[FIELDS.TICKETS.SIGNUP_ID]
        };
    } catch (err) {
        console.error('[QRService] checkInPubCrawlParticipant error:', err);
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

export async function getPubCrawlSignupsWithCheckIn(eventId: number | string) {
    try {
        const list = await directusRequest<any[]>(readItems(COLLECTIONS.PUB_CRAWL_TICKETS as any, {
            filter: { [FIELDS.TICKETS.SIGNUP_ID]: { [FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID]: { _eq: eventId } } } as any,
            fields: ['*', { [FIELDS.TICKETS.SIGNUP_ID]: ['*'] }] as any,
            sort: ['-created_at'] as any
        }));
        return list || [];
    } catch (err) {
        console.error('[QRService] getPubCrawlSignupsWithCheckIn error:', err);
        return [];
    }
}

export async function isUserAuthorizedForPubCrawlAttendance(userId: string) {
    try {
        const committees = await directusRequest<any[]>(readItems('committee_members', {
            filter: { user_id: { _eq: userId } },
            fields: ['id']
        }));
        return committees && committees.length > 0;
    } catch (err) {
        return false;
    }
}

const qrService = {
    generateQRToken,
    generateQRCode,
    updateSignupWithQRToken,
    checkInParticipant,
    getEventSignupsWithCheckIn,
    isUserAuthorizedForAttendance,
    // Pub Crawl functions
    updatePubCrawlSignupWithQRToken,
    checkInPubCrawlParticipant,
    getPubCrawlSignupsWithCheckIn,
    isUserAuthorizedForPubCrawlAttendance,
};

export default qrService;
