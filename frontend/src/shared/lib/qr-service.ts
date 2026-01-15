import QRCode from 'qrcode';
import { directusFetch } from './directus';

interface AttendanceOfficer {
    directus_users_id?: string | number | null;
}

// Generate a stable token for a signup
export function generateQRToken(signupId: number, eventId: number) {
    const rand = Math.random().toString(36).substring(2, 15);
    const time = Date.now().toString(36);
    return `r-${signupId}-${eventId}-${time}-${rand}`;
}

export async function generateQRCode(data: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 1,
            width: 250,
            color: { dark: '#7B2CBF', light: '#F5F5DC' }
        });
        return dataUrl;
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw new Error('Failed to generate QR code');
    }
}

export async function updateSignupWithQRToken(signupId: number, token: string) {
    try {
        // Use the API service token to update the QR token field, bypassing user-level authorization checks.
        // This is necessary because the QR token is set automatically during signup creation,
        // and the user may not have permission to edit their own signup record.
        const apiKey = process.env.NEXT_PUBLIC_DIRECTUS_API_KEY || '';
        console.log('[updateSignupWithQRToken] Using API key, length:', apiKey.length, 'signupId:', signupId);
        await directusFetch(`/items/event_signups/${signupId}`, {
            method: 'PATCH',
            body: JSON.stringify({ qr_token: token }),
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });
        console.log('[updateSignupWithQRToken] Successfully updated QR token for signup', signupId);
    } catch (err) {
        console.error('Error updating signup with QR token:', err);
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

        const updated = await directusFetch(`/items/event_signups/${signup.id}?fields=id,event_id.*,directus_relations.*,checked_in,checked_in_at,participant_name,participant_email,participant_phone`);
        return { success: true, message: 'Succesvol ingecheckt!', signup: updated };
    } catch (err) {
        console.error('Error checking in participant:', err);
        return { success: false, message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.' };
    }
}

export async function getEventSignupsWithCheckIn(eventId: number) {
    try {
        const list = await directusFetch<any[]>(`/items/event_signups?filter[event_id][_eq]=${eventId}&fields=id,event_id,directus_relations.*,checked_in,checked_in_at,created_at,participant_name,participant_email,participant_phone,qr_token&sort=checked_in_at,-created_at`);
        return list || [];
    } catch (err) {
        console.error('Error fetching event signups:', err);
        return [];
    }
}

export async function isUserAuthorizedForAttendance(userId: string, eventId: number) {
    try {
        // Check event attendance_officers relation first
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
        console.error('Error checking attendance authorization:', err);
        return false;
    }
}

export default {
    generateQRToken,
    generateQRCode,
    updateSignupWithQRToken,
    checkInParticipant,
    getEventSignupsWithCheckIn,
    isUserAuthorizedForAttendance,
};
