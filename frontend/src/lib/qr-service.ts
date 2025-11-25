// src/lib/qr-service.ts
import QRCode from 'qrcode';
import { directusFetch } from './directus';

/**
 * Generate a unique token for a signup based on event and signup IDs.
 */
export function generateQRToken(signupId: number, eventId: number): string {
  const random = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `${eventId}-${signupId}-${timestamp}-${random}`;
}

/**
 * Generate QR code as data URL (Base64 encoded image).
 */
export async function generateQRCode(token: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'M',
      type: 'image/png' as const,
      margin: 1,
      width: 250,
      color: {
        dark: '#7B2CBF', // Purple
        light: '#F5F5DC', // Beige
      },
    });
    console.log('QR code generated, data URL length:', qrDataUrl.length);
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Update signup with QR token in Directus.
 */
export async function updateSignupWithQRToken(signupId: number, qrToken: string): Promise<void> {
  try {
    await directusFetch(`/items/event_signups/${signupId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        qr_token: qrToken,
      }),
    });
  } catch (error) {
    console.error('Error updating signup with QR token:', error);
    throw error;
  }
}

/**
 * Check in a participant using QR token.
 */
export async function checkInParticipant(qrToken: string): Promise<{
  success: boolean;
  message: string;
  signup?: any;
}> {
  try {
    // Find signup by QR token
    const signups = await directusFetch<any[]>(
      `/items/event_signups?filter[qr_token][_eq]=${qrToken}&fields=id,event_id.*,directus_relations.*,checked_in,checked_in_at,qr_token,participant_name,participant_email,participant_phone`
    );

    if (!signups || signups.length === 0) {
      return {
        success: false,
        message: 'Ongeldige QR code. Deze QR code is niet gevonden.',
      };
    }

    const signup = signups[0];

    // Check if already checked in
    if (signup.checked_in) {
      return {
        success: false,
        message: `Deze persoon is al ingecheckt op ${new Date(signup.checked_in_at).toLocaleString('nl-NL')}.`,
        signup,
      };
    }

    // Update signup to mark as checked in
    await directusFetch(`/items/event_signups/${signup.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      }),
    });

    // Fetch updated signup
    const updatedSignup = await directusFetch<any>(
      `/items/event_signups/${signup.id}?fields=id,event_id.*,directus_relations.*,checked_in,checked_in_at,participant_name,participant_email,participant_phone`
    );

    return {
      success: true,
      message: 'Succesvol ingecheckt!',
      signup: updatedSignup,
    };
  } catch (error) {
    console.error('Error checking in participant:', error);
    return {
      success: false,
      message: 'Er is een fout opgetreden bij het inchecken. Probeer het opnieuw.',
    };
  }
}

/**
 * Get signup details by QR token (without checking in).
 */
export async function getSignupByQRToken(qrToken: string): Promise<any | null> {
  try {
    const signups = await directusFetch<any[]>(
      `/items/event_signups?filter[qr_token][_eq]=${qrToken}&fields=id,event_id.*,directus_relations.*,checked_in,checked_in_at,qr_token,participant_name,participant_email,participant_phone`
    );

    if (!signups || signups.length === 0) {
      return null;
    }

    return signups[0];
  } catch (error) {
    console.error('Error fetching signup by QR token:', error);
    return null;
  }
}

/**
 * Get all signups for an event with check-in status.
 */
export async function getEventSignupsWithCheckIn(eventId: number): Promise<any[]> {
  try {
    const signups = await directusFetch<any[]>(
      `/items/event_signups?filter[event_id][_eq]=${eventId}&fields=id,event_id,directus_relations.*,checked_in,checked_in_at,created_at,participant_name,participant_email,participant_phone,qr_token&sort=checked_in_at,-created_at`
    );
    return signups || [];
  } catch (error) {
    console.error('Error fetching event signups:', error);
    return [];
  }
}

/**
 * Check if user is authorized for attendance tracking for a specific event.
 * Authorization is granted if the user is a committee member OR a delegated officer.
 * (Vervangt de oude isUserCommitteeMember functie)
 */
export async function isUserAuthorizedForAttendance(userId: string, eventId: number): Promise<boolean> {
  try {
    // 1. Fetch event committee ID and delegated officer IDs
    const event = await directusFetch<any>(
      `/items/events/${eventId}?fields=committee_id,attendance_officers.directus_users_id`
    );
    
    if (!event) {
      return false;
    }

    // 2. Check for delegated officers (new M2M field)
    let isDelegatedOfficer = false;
    if (event.attendance_officers && Array.isArray(event.attendance_officers)) {
      isDelegatedOfficer = event.attendance_officers.some((officer: any) => 
        // Compare user ID from context with user IDs in the Directus relation
        officer.directus_users_id === userId 
      );
      if (isDelegatedOfficer) return true;
    }

    // 3. Check for committee membership (old logic)
    if (event.committee_id) {
      const members = await directusFetch<any[]>(
        `/items/committee_members?filter[committee_id][_eq]=${event.committee_id}&filter[user_id][_eq]=${userId}&fields=id`
      );

      return (members && members.length > 0) || isDelegatedOfficer;
    }
    
    // If no committee and no delegated officer, access is denied.
    return isDelegatedOfficer;

  } catch (error) {
    console.error('Error checking attendance authorization:', error);
    return false;
  }
}