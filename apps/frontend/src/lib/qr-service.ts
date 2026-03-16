import QRCode from 'qrcode';
import { directusFetch } from './directus';
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';
import { normalizeCommitteeName } from './committee-utils';

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
        await directusFetch(`/items/event_signups/${signupId}`, {
            method: 'PATCH',
            body: JSON.stringify({ qr_token: token }),
        });
    } catch (err) {
        throw err;
    }
}

export async function checkInParticipant(qrToken: string) {
    try {
        const signups = await directusFetch<any[]>(`/items/event_signups?filter[qr_token][_eq]=${encodeURIComponent(qrToken)}&fields=id,event_id.*,directus_relations.*,checked_in,checked_in_at,qr_token,participant_name,participant_email,participant_phone`);
        if (!signups || signups.length === 0) {
            return { success: false, message: 'Ongeldige QR code. Deze QR code is niet gevonden.' };
        }

        const signup = signups[0];
        if (signup.checked_in) {
            return { success: false, message: `Deze persoon is al ingecheckt op ${new Date(signup.checked_in_at).toLocaleString('nl-NL')}.`, signup };
        }

        await directusFetch(`/items/event_signups/${signup.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ checked_in: true, checked_in_at: new Date().toISOString() })
        });

        const updated = await directusFetch<any>(`/items/event_signups/${signup.id}?fields=id,event_id.*,directus_relations.*,checked_in,checked_in_at,participant_name,participant_email,participant_phone`);
        return { success: true, message: 'Succesvol ingecheckt!', signup: updated };
    } catch (err) {
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

export async function getEventSignupsWithCheckIn(eventId: number | string) {
    try {
        const list = await directusFetch<any[]>(`/items/event_signups?filter[event_id][_eq]=${eventId}&fields=id,event_id,directus_relations.*,checked_in,checked_in_at,created_at,participant_name,participant_email,participant_phone,qr_token&sort=checked_in_at,-created_at`);
        return list || [];
    } catch (err) {
        return [];
    }
}

export async function isUserAuthorizedForAttendance(userId: string, eventId: number | string) {
    try {
        const userCommittees = await directusFetch<any[]>(`/items/committee_members?filter[user_id][_eq]=${userId}&fields=committee_id.name`);
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

        const event = await directusFetch<any>(`/items/events/${eventId}?fields=committee_id,attendance_officers.directus_users_id`);
        if (!event) return false;

        if (event.attendance_officers && Array.isArray(event.attendance_officers)) {
            const found = event.attendance_officers.some((a: AttendanceOfficer) => String(a.directus_users_id) === String(userId));
            if (found) return true;
        }

        if (event.committee_id) {
            const members = await directusFetch<any[]>(`/items/committee_members?filter[committee_id][_eq]=${event.committee_id}&filter[user_id][_eq]=${userId}&fields=id`);
            if (members && members.length > 0) return true;
        }

        return false;
    } catch (err) {
        return false;
    }
}

// ===== PUB CRAWL / KROEGENTOCHT FUNCTIONS =====

export async function updatePubCrawlSignupWithQRToken(signupId: number | string, token: string) {
    try {
        await directusFetch(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}/${signupId}`, {
            method: 'PATCH',
            body: JSON.stringify({ qr_token: token }),
        });
    } catch (err) {
        throw err;
    }
}

export async function checkInPubCrawlParticipant(qrToken: string) {
    try {
        const tickets = await directusFetch<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}?filter[${FIELDS.TICKETS.QR_TOKEN}][_eq]=${encodeURIComponent(qrToken)}&fields=*,${FIELDS.TICKETS.SIGNUP_ID}.*`);

        if (!tickets || tickets.length === 0) {
            return { success: false, message: 'Ongeldige QR code. Ticket niet gevonden.' };
        }

        const ticket = tickets[0];
        const signup = ticket[FIELDS.TICKETS.SIGNUP_ID];

        if (ticket[FIELDS.TICKETS.CHECKED_IN]) {
            const time = ticket[FIELDS.TICKETS.CHECKED_IN_AT] ? new Date(ticket[FIELDS.TICKETS.CHECKED_IN_AT]).toLocaleString('nl-NL') : 'eerder';
            return { success: false, message: `${ticket[FIELDS.TICKETS.NAME]} is al ingecheckt om ${time}.`, signup };
        }

        await directusFetch(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}/${ticket.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                [FIELDS.TICKETS.CHECKED_IN]: true,
                [FIELDS.TICKETS.CHECKED_IN_AT]: new Date().toISOString()
            })
        });

        const updatedTicket = await directusFetch<any>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}/${ticket.id}?fields=*,${FIELDS.TICKETS.SIGNUP_ID}.*`);

        return {
            success: true,
            message: `Welkom ${updatedTicket[FIELDS.TICKETS.NAME]}!`,
            signup: updatedTicket[FIELDS.TICKETS.SIGNUP_ID]
        };
    } catch (err) {
        console.error(err);
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

export async function getPubCrawlSignupsWithCheckIn(eventId: number | string) {
    try {
        const list = await directusFetch<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}?filter[${FIELDS.TICKETS.SIGNUP_ID}][${FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID}][_eq]=${eventId}&fields=*,${FIELDS.TICKETS.SIGNUP_ID}.*&sort=-created_at`);
        return list || [];
    } catch (err) {
        console.error('Error fetching pub crawl signups with check-in:', err);
        return [];
    }
}

export async function isUserAuthorizedForPubCrawlAttendance(userId: string) {
    try {
        const committees = await directusFetch<any[]>(`/items/committee_members?filter[user_id][_eq]=${userId}&fields=id`);
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
