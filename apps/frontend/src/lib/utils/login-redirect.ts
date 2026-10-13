import { ROUTES } from '@/lib/config/routes';

const LOGIN_PARAMS = ['needLogin', 'callbackURL'];

/**
 * Only allow same-site relative paths to prevent open redirects.
 */
function isSafeRelativePath(value: string): boolean {
    return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

/**
 * Bepaalt waar de gebruiker na het inloggen naartoe gestuurd wordt.
 * Een expliciete callbackURL (bijv. uit ?callbackURL=) gaat voor, anders de huidige pagina.
 * Op de homepage of bij een onveilige waarde wordt de fallback gebruikt.
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
