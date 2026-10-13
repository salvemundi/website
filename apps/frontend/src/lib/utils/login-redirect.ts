import { ROUTES } from '@/lib/config/routes';

const LOGIN_PARAMS = ['needLogin', 'callbackURL'];

/**
 * Only allow same-site relative paths to prevent open redirects.
 */
function isSafeRelativePath(value: string): boolean {
    try {
        const base = new URL('https://same-site.invalid');
        return value.startsWith('/') && new URL(value, base).origin === base.origin;
    } catch {
        return false;
    }
}

/**
 * Determines where the user is sent after logging in.
 * An explicit callbackURL (e.g. from ?callbackURL=) takes precedence, otherwise the current page.
 * Falls back on the homepage or when the value is unsafe.
 */
export function getLoginCallbackURL(explicit?: string | null, fallback: string = ROUTES.MEMBERSHIP): string {
    if (explicit) {
        return isSafeRelativePath(explicit) ? explicit : fallback;
    }

    if (typeof window === 'undefined') return fallback;

    const { pathname, search } = window.location;
    if (pathname === ROUTES.HOME || pathname.startsWith('/api/auth')) return fallback;

    const params = new URLSearchParams(search);
    LOGIN_PARAMS.forEach(param => params.delete(param));
    const query = params.toString();

    return query ? `${pathname}?${query}` : pathname;
}
