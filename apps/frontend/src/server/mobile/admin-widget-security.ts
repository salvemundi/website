import { createHash, randomBytes } from 'node:crypto';

export const widgetCredentialLifetimeSeconds = 7 * 24 * 60 * 60;
export const widgetSummaryLifetimeMilliseconds = 15 * 60 * 1000;
export function newAdminWidgetToken(): string { return `smw_${randomBytes(32).toString('base64url')}`; }
export function isAdminWidgetToken(token: string): boolean { return /^smw_[A-Za-z0-9_-]{43}$/.test(token); }
export function adminWidgetTokenKey(token: string): string {
    return `mobile:admin-widget:${createHash('sha256').update(token).digest('hex')}`;
}
export function isCurrentWidgetActivity(startsAt: string | null | undefined, endsAt: string | null | undefined, now: Date): boolean {
    const end = endsAt || startsAt;
    if (!end) return true;
    const date = new Date(end);
    if (!Number.isFinite(date.getTime())) return false;
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
    const day = (value: Date) => {
        const parts = formatter.formatToParts(value);
        return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value || '').join('-');
    };
    // Keep events throughout their final Amsterdam calendar day, including check-in time.
    return day(date) >= day(now);
}
export interface AdminWidgetGrant { userId: string; sessionId: string; expiresAt: string }
export function parseAdminWidgetGrant(value: string | null): AdminWidgetGrant | null {
    if (!value) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object' || !('userId' in parsed) || !('sessionId' in parsed) || !('expiresAt' in parsed)) return null;
        const { userId, sessionId, expiresAt } = parsed;
        if (typeof userId !== 'string' || !userId || typeof sessionId !== 'string' || !/^mobile:[a-f0-9-]{36}$/.test(sessionId)
            || typeof expiresAt !== 'string' || !Number.isFinite(Date.parse(expiresAt))) return null;
        return { userId, sessionId, expiresAt };
    } catch { return null; }
}
