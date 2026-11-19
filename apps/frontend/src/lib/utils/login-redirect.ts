import { ROUTES } from '@/lib/config/routes';

const LOGIN_PARAMS = ['needLogin', 'callbackURL'];

const SAFE_PATH_REGEX = /^\/[\w\-.+/@]*$/;
const SAFE_QUERY_REGEX = /^[\w\-.+/=&%@]*$/;

/**
 * Only allow same-site relative paths that Better Auth accepts (also prevents open redirects).
 * Mirrors Better Auth's relative callbackURL check (better-auth/src/auth/trusted-origins.ts).
 */
function isSafeRelativePath(value: string): boolean {
    const lower = value.toLowerCase();
    if (!lower.startsWith('/') || lower.startsWith('//') || lower.startsWith('/\\') || lower.startsWith('/%2f') || lower.startsWith('/%5c')) {
        return false;
    }

    const queryIndex = value.indexOf('?');
    const path = queryIndex === -1 ? value : value.slice(0, queryIndex);
    if (!SAFE_PATH_REGEX.test(path)) return false;

    if (queryIndex === -1) return true;
    const query = value.slice(queryIndex + 1);
    return SAFE_QUERY_REGEX.test(query);
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
