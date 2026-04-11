import QRCode from 'qrcode';

/**
 * Generate a stable token for a signup.
 * QR Token Prefix: r-
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
        
        throw new Error('Failed to generate QR code');
    }
}

// Default export removed to follow named-export standard.
