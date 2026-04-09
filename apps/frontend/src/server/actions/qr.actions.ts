'use server';

import 'server-only';
import { getSystemDirectus } from '@/lib/directus';
import { readItem, readItems, updateItem } from '@directus/sdk';
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';
import { isSuperAdmin } from '@/lib/auth-utils';

interface AttendanceOfficer {
    directus_users_id?: string | number | null;
}

/**
 * Attendance Logic
 */
export async function updateSignupWithQRToken(signupId: number | string, token: string) {
    try {
        await getSystemDirectus().request(updateItem('event_signups', signupId as any, {
            qr_token: token
        }));
    } catch (err) {
        throw err;
    }
}

export async function checkInParticipant(qrToken: string) {
    try {
        const signups = await getSystemDirectus().request<any[]>(readItems('event_signups', {
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

        await getSystemDirectus().request(updateItem('event_signups', signup.id, {
            checked_in: true, 
            checked_in_at: new Date().toISOString() 
        }));

        const updated = await getSystemDirectus().request<any>(readItem('event_signups', signup.id, {
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
        const list = await getSystemDirectus().request<any[]>(readItems('event_signups', {
            filter: { event_id: { _eq: eventId as any } },
            fields: ['id' as any, 'event_id' as any, 'checked_in' as any, 'checked_in_at' as any, 'created_at' as any, 'participant_name' as any, 'participant_email' as any, 'participant_phone' as any, 'qr_token' as any],
            sort: ['checked_in_at', '-created_at'] as any
        }));
        return list || [];
    } catch (err) {
        console.error('[QRService] getEventSignupsWithCheckIn error:', err);
        return [];
    }
}

export async function isUserAuthorizedForAttendance(userId: string, eventId: number | string) {
    try {
        const userCommittees = await getSystemDirectus().request<any[]>(readItems('committee_members', {
            filter: { user_id: { _eq: userId } },
            fields: [{ committee_id: ['name'] }] as any
        }));
        
        if (isSuperAdmin(userCommittees)) return true;

        const eventData = await getSystemDirectus().request<any>(readItem('events', eventId as any, {
            fields: ['committee_id' as any, 'attendance_officers' as any]
        }));
        if (!eventData) return false;

        if (eventData.attendance_officers && Array.isArray(eventData.attendance_officers)) {
            const found = eventData.attendance_officers.some((a: AttendanceOfficer) => String(a.directus_users_id) === String(userId));
            if (found) return true;
        }

        if (eventData.committee_id) {
            const commId = typeof eventData.committee_id === 'object' ? eventData.committee_id.id : eventData.committee_id;
            const members = await getSystemDirectus().request<any[]>(readItems('committee_members', {
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
        await getSystemDirectus().request(updateItem(COLLECTIONS.PUB_CRAWL_SIGNUPS as any, signupId as any, {
            qr_token: token
        }));
    } catch (err) {
        throw err;
    }
}

export async function checkInPubCrawlParticipant(qrToken: string) {
    try {
        const tickets = await getSystemDirectus().request<any[]>(readItems(COLLECTIONS.PUB_CRAWL_TICKETS as any, {
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

        await getSystemDirectus().request(updateItem(COLLECTIONS.PUB_CRAWL_TICKETS as any, ticket.id, {
            [FIELDS.TICKETS.CHECKED_IN]: true,
            [FIELDS.TICKETS.CHECKED_IN_AT]: new Date().toISOString()
        }));

        const updatedTicket = await getSystemDirectus().request<any>(readItem(COLLECTIONS.PUB_CRAWL_TICKETS as any, ticket.id, {
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
        const list = await getSystemDirectus().request<any[]>(readItems(COLLECTIONS.PUB_CRAWL_TICKETS as any, {
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
        const committees = await getSystemDirectus().request<any[]>(readItems('committee_members', {
            filter: { user_id: { _eq: userId } },
            fields: ['id']
        }));
        return committees && committees.length > 0;
    } catch (err) {
        return false;
    }
}
