import crypto from 'node:crypto';

function getCalendarSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET || process.env.DIRECTUS_SECRET || process.env.INTERNAL_SERVICE_TOKEN;
    if (!secret || secret.length < 16) {
        throw new Error('[calendar-token] Server authentication secret is missing or insufficient in environment variables.');
    }
    return secret;
}

export function generateCalendarToken(email: string): string {
    if (!email || typeof email !== 'string') return '';
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const secret = getCalendarSecret();
        const signature = crypto
            .createHmac('sha256', secret)
            .update(normalizedEmail)
            .digest('base64url');
        const payload = Buffer.from(normalizedEmail, 'utf8').toString('base64url');
        return `${payload}.${signature}`;
    } catch {
        return '';
    }
}

export function verifyCalendarToken(token: string): { email: string } | null {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature || signature.length !== 43) return null;

    try {
        const email = Buffer.from(payload, 'base64url').toString('utf8');
        if (!email || email.length > 254 || !email.includes('@')) return null;

        const secret = getCalendarSecret();
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(email.trim().toLowerCase())
            .digest('base64url');

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSignature);

        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
            return { email: email.trim().toLowerCase() };
        }
        return null;
    } catch {
        return null;
    }
}
