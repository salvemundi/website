'use server';

import { fetchDirectus, mutateDirectus, buildQuery } from '@/shared/lib/server-directus';
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';
import { normalizeCommitteeName } from '@/shared/lib/committee-utils';

/**
 * Update an event signup with a QR token.
 */
export async function updateSignupWithQRTokenAction(signupId: number, token: string) {
    try {
        await mutateDirectus(`/items/event_signups/${signupId}`, 'PATCH', { qr_token: token });
        return { success: true };
    } catch (error: any) {
        console.error(`[AttendanceAction] updateSignupWithQRTokenAction(${signupId}) error:`, error);
        return { success: false, error: 'Failed to update QR token' };
    }
}

/**
 * Check in a participant for a regular event.
 */
export async function checkInParticipantAction(qrToken: string) {
    try {
        const query = buildQuery({
            filter: { qr_token: { _eq: qrToken } },
            fields: 'id,event_id.*,directus_relations.*,checked_in,checked_in_at,qr_token,participant_name,participant_email,participant_phone'
        });
        const signups = await fetchDirectus<any[]>(`/items/event_signups?${query}`, 0);

        if (!signups || signups.length === 0) {
            return { success: false, message: 'Ongeldige QR code. Deze QR code is niet gevonden.' };
        }

        const signup = signups[0];
        if (signup.checked_in) {
            return {
                success: false,
                message: `Deze persoon is al ingecheckt op ${new Date(signup.checked_in_at).toLocaleString('nl-NL')}.`,
                signup
            };
        }

        const updated = await mutateDirectus(`/items/event_signups/${signup.id}`, 'PATCH', {
            checked_in: true,
            checked_in_at: new Date().toISOString()
        });

        return { success: true, message: 'Succesvol ingecheckt!', signup: updated };
    } catch (error) {
        console.error('[AttendanceAction] checkInParticipantAction error:', error);
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

/**
 * Get all signups for an event with their check-in status.
 */
export async function getEventSignupsWithCheckInAction(eventId: number) {
    try {
        const query = buildQuery({
            filter: { event_id: { _eq: eventId } },
            fields: 'id,event_id,directus_relations.*,checked_in,checked_in_at,created_at,participant_name,participant_email,participant_phone,qr_token',
            sort: 'checked_in_at,-created_at'
        });
        const list = await fetchDirectus<any[]>(`/items/event_signups?${query}`, 0);
        return list || [];
    } catch (error) {
        console.error(`[AttendanceAction] getEventSignupsWithCheckInAction(${eventId}) error:`, error);
        return [];
    }
}

/**
 * Check if a user is authorized to perform check-ins for an event.
 */
export async function isUserAuthorizedForAttendanceAction(userId: string, eventId: number) {
    try {
        // Check if user is in Bestuur or ICT committee (they have global access)
        const commQuery = buildQuery({
            filter: { user_id: { _eq: userId } },
            fields: 'committee_id.name'
        });
        const userCommittees = await fetchDirectus<any[]>(`/items/committee_members?${commQuery}`, 0);

        if (userCommittees && userCommittees.length > 0) {
            const committeeNames = userCommittees.map((c: any) => {
                if (!c?.committee_id?.name) return '';
                return normalizeCommitteeName(c.committee_id.name);
            });

            const hasGlobalAccess = committeeNames.some((name: string) =>
                name.includes('bestuur') || name.includes('ict')
            );
            if (hasGlobalAccess) return true;
        }

        // Check event attendance_officers relation
        const eventQuery = buildQuery({
            fields: 'committee_id,attendance_officers.directus_users_id'
        });
        const event = await fetchDirectus<any>(`/items/events/${eventId}?${eventQuery}`, 0);
        if (!event) return false;

        if (event.attendance_officers && Array.isArray(event.attendance_officers)) {
            const found = event.attendance_officers.some((a: any) => String(a.directus_users_id) === String(userId));
            if (found) return true;
        }

        if (event.committee_id) {
            const memberQuery = buildQuery({
                filter: {
                    committee_id: { _eq: event.committee_id },
                    user_id: { _eq: userId }
                },
                fields: 'id'
            });
            const members = await fetchDirectus<any[]>(`/items/committee_members?${memberQuery}`, 0);
            if (members && members.length > 0) return true;
        }

        return false;
    } catch (error) {
        console.error(`[AttendanceAction] isUserAuthorizedForAttendanceAction(${userId}, ${eventId}) error:`, error);
        return false;
    }
}

/**
 * Toggle check-in status for an event signup.
 */
export async function toggleCheckInAction(signupId: number | string, isCheckedIn: boolean) {
    try {
        const checkedInAt = isCheckedIn ? new Date().toISOString() : null;
        return await mutateDirectus(`/items/event_signups/${signupId}`, 'PATCH', {
            checked_in: isCheckedIn,
            checked_in_at: checkedInAt
        });
    } catch (error) {
        console.error(`[AttendanceAction] toggleCheckInAction(${signupId}) error:`, error);
        throw error;
    }
}

// ===== PUB CRAWL / KROEGENTOCHT ACTIONS =====

/**
 * Update a pub crawl signup with a QR token.
 */
export async function updatePubCrawlSignupWithQRTokenAction(signupId: number, token: string) {
    try {
        await mutateDirectus(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}/${signupId}`, 'PATCH', { qr_token: token });
        return { success: true };
    } catch (error) {
        console.error(`[AttendanceAction] updatePubCrawlSignupWithQRTokenAction(${signupId}) error:`, error);
        return { success: false, error: 'Failed to update QR token' };
    }
}

/**
 * Check in a pub crawl participant using a ticket QR token.
 */
export async function checkInPubCrawlParticipantAction(qrToken: string) {
    try {
        const query = buildQuery({
            filter: { [FIELDS.TICKETS.QR_TOKEN]: { _eq: qrToken } },
            fields: `*,${FIELDS.TICKETS.SIGNUP_ID}.*`
        });
        const tickets = await fetchDirectus<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}?${query}`, 0);

        if (!tickets || tickets.length === 0) {
            return { success: false, message: 'Ongeldige QR code. Ticket niet gevonden.' };
        }

        const ticket = tickets[0];
        const signup = ticket[FIELDS.TICKETS.SIGNUP_ID];

        if (ticket[FIELDS.TICKETS.CHECKED_IN]) {
            const time = ticket[FIELDS.TICKETS.CHECKED_IN_AT] ? new Date(ticket[FIELDS.TICKETS.CHECKED_IN_AT]).toLocaleString('nl-NL') : 'eerder';
            return { success: false, message: `${ticket[FIELDS.TICKETS.NAME]} is al ingecheckt om ${time}.`, signup };
        }

        const updatedTicketResult = await mutateDirectus<any>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}/${ticket.id}`, 'PATCH', {
            [FIELDS.TICKETS.CHECKED_IN]: true,
            [FIELDS.TICKETS.CHECKED_IN_AT]: new Date().toISOString()
        });

        const updatedTicket = updatedTicketResult as any;

        return {
            success: true,
            message: `Welkom ${updatedTicket[FIELDS.TICKETS.NAME]}!`,
            signup: updatedTicket[FIELDS.TICKETS.SIGNUP_ID]
        };
    } catch (error) {
        console.error('[AttendanceAction] checkInPubCrawlParticipantAction error:', error);
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

/**
 * Get all pub crawl signups with check-in status for an event.
 */
export async function getPubCrawlSignupsWithCheckInAction(eventId: number) {
    try {
        const query = buildQuery({
            filter: { [FIELDS.TICKETS.SIGNUP_ID]: { [FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID]: { _eq: eventId } } },
            fields: `*,${FIELDS.TICKETS.SIGNUP_ID}.*`,
            sort: '-created_at'
        });
        const list = await fetchDirectus<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}?${query}`, 0);
        return list || [];
    } catch (error) {
        console.error(`[AttendanceAction] getPubCrawlSignupsWithCheckInAction(${eventId}) error:`, error);
        return [];
    }
}

/**
 * Check if a user is authorized for pub crawl attendance.
 */
export async function isUserAuthorizedForPubCrawlAttendanceAction(userId: string) {
    try {
        const query = buildQuery({
            filter: { user_id: { _eq: userId } },
            fields: 'id'
        });
        const committees = await fetchDirectus<any[]>(`/items/committee_members?${query}`, 0);
        return committees && committees.length > 0;
    } catch (error) {
        console.error(`[AttendanceAction] isUserAuthorizedForPubCrawlAttendanceAction(${userId}) error:`, error);
        return false;
    }
}

/**
 * Fetch a pub crawl event by ID.
 */
export async function getPubCrawlEventByIdAction(id: number | string) {
    try {
        const query = buildQuery({
            fields: 'id,name,image'
        });
        return await fetchDirectus<any>(`/items/pub_crawl_events/${id}?${query}`, 0);
    } catch (error) {
        console.error(`[AttendanceAction] getPubCrawlEventByIdAction(${id}) error:`, error);
        return null;
    }
}

/**
 * Toggle check-in status for a pub crawl ticket.
 */
export async function togglePubCrawlTicketCheckInAction(ticketId: number | string, isCheckedIn: boolean) {
    try {
        const checkedInAt = isCheckedIn ? new Date().toISOString() : null;
        return await mutateDirectus(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}/${ticketId}`, 'PATCH', {
            [FIELDS.TICKETS.CHECKED_IN]: isCheckedIn,
            [FIELDS.TICKETS.CHECKED_IN_AT]: checkedInAt
        });
    } catch (error) {
        console.error(`[AttendanceAction] togglePubCrawlTicketCheckInAction(${ticketId}) error:`, error);
        throw error;
    }
}
