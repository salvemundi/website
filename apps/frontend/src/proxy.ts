import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { PUBLIC_ROUTES } from '@/lib/routes';
import { getRedis } from '@/server/auth/redis-client';
import { getDisabledRoutes, FLAGS_CACHE_KEY } from '@/lib/feature-flags';


/**
 * Direct Provider Proxy (V7)
 */
async function proxy(request: NextRequest) {
    const { pathname, origin } = request.nextUrl;
    const nonce = btoa(crypto.randomUUID()).substring(0, 16);

    const withSecurity = (res: NextResponse) => {
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || '';
        const cspHeader = `
            default-src 'self';
            script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${origin.includes('localhost') ? "'unsafe-eval'" : ""};
            style-src 'self' 'unsafe-inline';
            img-src 'self' blob: data: ${directusUrl} https://*.tile.openstreetmap.org https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com;
            font-src 'self' data:;
            connect-src 'self' ${directusUrl} https://login.microsoftonline.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://nominatim.openstreetmap.org;
            frame-src 'self' https://login.microsoftonline.com;
            worker-src 'self' blob:;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            ${origin.includes('localhost') ? '' : 'upgrade-insecure-requests;'}
        `.replace(/\s{2,}/g, ' ').trim();

        res.headers.set('Content-Security-Policy', cspHeader);
        res.headers.set('x-nonce', nonce);
        return res;
    };

    const nextWithNonce = () => {
        // Avoid cloning the request body for POST requests to prevent TypeError in Node.js Proxy
        if (request.method === 'POST') {
            return withSecurity(NextResponse.next());
        }

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-nonce', nonce);
        return withSecurity(NextResponse.next({
            request: { headers: requestHeaders }
        }));
    };

    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (internalToken && request.headers.get('authorization') === `Bearer ${internalToken}`) {
        return nextWithNonce();
    }
    if (pathname === '/api/finance/webhook/mollie' || pathname.startsWith('/api/auth/')) {
        return nextWithNonce();
    }

    const disabledRoutes = await getDisabledRoutes();
    if (disabledRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
        console.warn(`[Proxy] BLOCKED: Route ${pathname} is disabled. Rewriting to /404`);
        return withSecurity(NextResponse.rewrite(new URL('/404', request.url)));
    }

    const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`));
    if (!isPublic) {
        try {
            const sessionToken = request.cookies.get('better-auth.session-token')?.value;
            let hasSession = false;

            if (sessionToken) {
                const redis = await getRedis();
                const cached = await redis.get(`session:${sessionToken}`);
                if (cached) {
                    const sessionData = JSON.parse(cached);
                    if (sessionData && sessionData.user) {
                        hasSession = true;
                    }
                }
            }

            if (!hasSession) {
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

                hasSession = sessionRes.ok && sessionRes.status !== 204;
                if (hasSession) {
                    const text = await sessionRes.text();
                    if (text === 'null' || !text) hasSession = false;
                    
                    if (hasSession) {
                        const response = nextWithNonce();
                        sessionRes.headers.forEach((value, key) => {
                            if (key.toLowerCase() === 'set-cookie') {
                                response.headers.append('set-cookie', value);
                            }
                        });
                        return response;
                    }
                }
            }

            if (!hasSession) {
                const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
                const authRedirectUrl = new URL(`/?needLogin=true&callbackURL=${callbackUrl}`, request.url);
                return withSecurity(NextResponse.redirect(authRedirectUrl));
            }

            return nextWithNonce();
        } catch (error) {
            console.error('[Proxy] Auth gating critical error:', error);
            return withSecurity(NextResponse.rewrite(new URL('/404', request.url)));
        }
    }

    return nextWithNonce();
}

export const config = {
    // Exclude API routes, static files, images, etc.
    matcher: ['/((?!_next/static|_next/image|fonts|img|api/assets|favicon.ico|robots.txt|.well-known).*)'],
};

export default proxy;
