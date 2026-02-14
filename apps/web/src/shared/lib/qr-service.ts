import QRCode from 'qrcode';
import {
    updateSignupWithQRTokenAction,
    checkInParticipantAction,
    getEventSignupsWithCheckInAction,
    isUserAuthorizedForAttendanceAction,
    updatePubCrawlSignupWithQRTokenAction,
    checkInPubCrawlParticipantAction,
    getPubCrawlSignupsWithCheckInAction,
    isUserAuthorizedForPubCrawlAttendanceAction
} from '@/shared/api/attendance-actions';

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
            width: 300,
            color: { dark: '#7B2CBF', light: '#FFFFFF' }
        });
        return dataUrl;
    } catch (err) {
        // Error generating QR code
        throw new Error('Failed to generate QR code');
    }
}

export async function updateSignupWithQRToken(signupId: number, token: string) {
    try {
        if (typeof window === 'undefined') {
            await updateSignupWithQRTokenAction(signupId, token);
        } else {
            // Client-side: Call our specific proxy endpoint
            const res = await fetch('/api/services/qr/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signupId, token })
            });

            if (!res.ok) {
                const err = await res.json();
                if (err.code === 'TOKEN_EXISTS') {
                    console.warn('QR Token already exists, skipping update.');
                    return;
                }
                throw new Error(err.error || 'Failed to update QR token');
            }
        }
    } catch (err) {
        console.error('Error updating signup with QR token:', err);
        throw err;
    }
}

export async function checkInParticipant(qrToken: string) {
    return await checkInParticipantAction(qrToken);
}

export async function getEventSignupsWithCheckIn(eventId: number) {
    return await getEventSignupsWithCheckInAction(eventId);
}

export async function isUserAuthorizedForAttendance(userId: string, eventId: number) {
    return await isUserAuthorizedForAttendanceAction(userId, eventId);
}

// ===== PUB CRAWL / KROEGENTOCHT FUNCTIONS =====

export async function updatePubCrawlSignupWithQRToken(signupId: number, token: string) {
    if (typeof window === 'undefined') {
        await updatePubCrawlSignupWithQRTokenAction(signupId, token);
    } else {
        console.error('Client-side Pub Crawl QR update not implemented safely yet.');
    }
}

export async function checkInPubCrawlParticipant(qrToken: string) {
    return await checkInPubCrawlParticipantAction(qrToken);
}

export async function getPubCrawlSignupsWithCheckIn(eventId: number) {
    return await getPubCrawlSignupsWithCheckInAction(eventId);
}

export async function isUserAuthorizedForPubCrawlAttendance(userId: string) {
    return await isUserAuthorizedForPubCrawlAttendanceAction(userId);
}

export default {
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
