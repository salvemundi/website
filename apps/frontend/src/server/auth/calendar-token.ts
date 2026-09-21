import crypto from 'node:crypto';

const CALENDAR_SECRET = process.env.BETTER_AUTH_SECRET || process.env.DIRECTUS_SECRET || 'salve-mundi-ics-calendar-default-secret';

/**
 * Generates a secure, persistent calendar token for a given user email.
 * This allows external calendar crawlers (Google Calendar, Apple Calendar)
 * to sync personalized member feeds without browser cookies.
 */
export function generateCalendarToken(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    const signature = crypto
        .createHmac('sha256', CALENDAR_SECRET)
        .update(normalizedEmail)
        .digest('base64url');
    const payload = Buffer.from(normalizedEmail).toString('base64url');
    return `${payload}.${signature}`;
}

/**
 * Verifies a calendar token and returns the associated email if valid.
 */
export function verifyCalendarToken(token: string): { email: string } | null {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    try {
        const email = Buffer.from(payload, 'base64url').toString('utf8');
        const expectedSignature = crypto
            .createHmac('sha256', CALENDAR_SECRET)
            .update(email)
            .digest('base64url');

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSignature);

        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
            return { email };
        }
        return null;
    } catch {
        return null;
    }
}
