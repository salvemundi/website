import { ROUTES } from '@/lib/config/routes';

const LOGIN_PARAMS = ['needLogin', 'callbackURL'];

/**
 * Mirrors Better Auth's relative callbackURL check (better-auth/src/auth/trusted-origins.ts).
 * Anything that does not match is rejected server-side with INVALID_CALLBACK_URL,
 * which would make the login button silently do nothing.
 */
const BETTER_AUTH_RELATIVE_PATH = /^\/(?!\/|\\|%2f|%5c)[\w\-.+/@]*(?:\?[\w\-.+/=&%@]*)?$/;

/**
 * Only allow same-site relative paths that Better Auth accepts (also prevents open redirects).
 */
function isSafeRelativePath(value: string): boolean {
    return BETTER_AUTH_RELATIVE_PATH.test(value);
}

/**
 * Determines where the user is sent after logging in.
 * An explicit callbackURL (e.g. from ?callbackURL=) takes precedence, otherwise the current page.
 * Falls back on the homepage or when the value would be rejected by Better Auth.
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
    const callbackURL = query ? `${pathname}?${query}` : pathname;

    if (isSafeRelativePath(callbackURL)) return callbackURL;
    // Query may contain characters Better Auth rejects; the page itself is still worth returning to.
    return isSafeRelativePath(pathname) ? pathname : fallback;
}
