import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { PUBLIC_ROUTES } from '@/lib/routes';

// In-memory cache voor feature flags — Edge runtime ondersteunt geen Redis.
let cachedDisabledRoutes: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconden

/**
 * Haalt de lijst met uitgeschakelde routes op vanuit de Directus feature_flags collectie.
 * Gebruikt fetch om Edge-compatible te blijven.
 */
async function getDisabledRoutes(): Promise<string[]> {
    const now = Date.now();
    if (cachedDisabledRoutes && (now - cacheTimestamp < CACHE_TTL)) {
        return cachedDisabledRoutes;
    }

    try {
        const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
        const token = process.env.DIRECTUS_STATIC_TOKEN;

        if (!token) return cachedDisabledRoutes || [];

        const url = `${directusUrl}/items/feature_flags?filter[is_active][_eq]=false&fields=route_match`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(10000), // V7: voorkomt Eternal Skeletons
        });

        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.data)) {
                const routes = data.data.map((f: any) => f.route_match).filter(Boolean);
                cachedDisabledRoutes = routes;
                cacheTimestamp = now;
                return routes;
            }
        }
    } catch (e) {
        console.error('[Proxy] Feature flags error:', e);
    }
    return cachedDisabledRoutes || [];
}

/**
 * Direct Provider Proxy (V7)
 * Beheert toegang tot routes en voert de naadloze "Direct Provider" flow uit.
 */
export async function proxy(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const { pathname, origin } = request.nextUrl;

    // Helper om CSP en Nonce toe te voegen aan een response
    const withSecurity = (res: NextResponse) => {
        const cspHeader = `
            default-src 'self';
            script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
            style-src 'self' 'unsafe-inline';
            img-src 'self' blob: data: https://admin.salvemundi.nl https://acc.salvemundi.nl https://salvemundi.nl;
            font-src 'self';
            connect-src 'self' https://admin.salvemundi.nl https://acc.salvemundi.nl https://login.microsoftonline.com;
            frame-src 'self' https://login.microsoftonline.com;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            upgrade-insecure-requests;
        `.replace(/\s{2,}/g, ' ').trim();

        res.headers.set('Content-Security-Policy', cspHeader);
        res.headers.set('x-nonce', nonce);
        return res;
    };

    // Helper voor NextResponse.next met doorgegeven headers
    const nextWithNonce = () => {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-nonce', nonce);
        return withSecurity(NextResponse.next({
            request: { headers: requestHeaders }
        }));
    };

    // 1. Whitelist & System checks
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (internalToken && request.headers.get('authorization') === `Bearer ${internalToken}`) {
        return nextWithNonce();
    }
    if (pathname === '/api/finance/webhook/mollie' || pathname.startsWith('/api/auth/')) {
        return nextWithNonce();
    }

    // 2. Feature Flags
    const disabledRoutes = await getDisabledRoutes();
    if (disabledRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
        return withSecurity(NextResponse.rewrite(new URL('/404', request.url)));
    }

    // 3. Auth Gating
    const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`));
    if (!isPublic) {
        try {
            const internalBase = process.env.NEXT_APP_INTERNAL_URL || origin;
            const sessionUrl = new URL('/api/auth/get-session', internalBase);
            const sessionRes = await fetch(sessionUrl, {
                headers: {
                    cookie: request.headers.get('cookie') || '',
                    'x-better-auth-origin': origin,
                    'x-forwarded-host': request.nextUrl.host,
                    'x-forwarded-proto': request.nextUrl.protocol.replace(':', '')
                },
                signal: AbortSignal.timeout(10000),
            });

            let hasSession = sessionRes.ok && sessionRes.status !== 204;
            if (hasSession) {
                const text = await sessionRes.text();
                if (text === 'null' || !text) hasSession = false;
            }

            if (!hasSession) {
                const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
                const microsoftAuthUrl = new URL(
                    `/api/auth/login/social?provider=microsoft&callbackURL=${callbackUrl}`,
                    request.url
                );
                console.log(`[Proxy] No session for ${pathname}, redirecting to Microsoft.`);
                return withSecurity(NextResponse.redirect(microsoftAuthUrl));
            }

            // Sessie is geldig! Cookies overzetten.
            const response = nextWithNonce();
            sessionRes.headers.forEach((value, key) => {
                if (key.toLowerCase() === 'set-cookie') {
                    response.headers.append('set-cookie', value);
                }
            });
            return response;
        } catch (error) {
            console.error('[Proxy] Auth gating critical error:', error);
            return withSecurity(NextResponse.rewrite(new URL('/404', request.url)));
        }
    }

    return nextWithNonce();
}

/**
 * V7 Security: Versterkt de Content Security Policy (CSP) door 'unsafe-inline' te verwijderen.
 * Gebruikt dynamic nonces voor zowel scripts als styles om XSS kwetsbaarheden te dichten.
 */
function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    
    // De CSP string — 'unsafe-inline' is hier verwijderd voor script-src.
    // Voor style-src houden we het tijdelijk even aan vanwege de vele inline 'style' attributes in React componenten.
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https://admin.salvemundi.nl https://acc.salvemundi.nl https://salvemundi.nl;
        font-src 'self';
        connect-src 'self' https://admin.salvemundi.nl https://acc.salvemundi.nl https://login.microsoftonline.com;
        frame-src 'self' https://login.microsoftonline.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    // 1. Maak een nieuwe response met de nonce in de REQUEST headers zodat Server Components erbij kunnen
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    const newResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // 2. Kopieer de cookies en andere headers van de originele response naar de nieuwe
    response.headers.forEach((value, key) => {
        newResponse.headers.append(key, value);
    });

    // 3. Zet de daadwerkelijke CSP header en x-nonce voor de browser/app
    newResponse.headers.set('x-nonce', nonce);
    newResponse.headers.set('Content-Security-Policy', cspHeader);

    return newResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|fonts|img|api/assets|favicon.ico|robots.txt|.well-known).*)'],
};

export default proxy;
