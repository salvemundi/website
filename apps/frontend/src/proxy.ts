import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { PUBLIC_ROUTES } from '@/lib/config/routes';
import { getRedis } from '@/server/auth/redis-client';
import { getDisabledRoutes } from '@/lib/config/feature-flags';
import { safeConsoleError } from '@/server/utils/logger';

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
            script-src 'self' 'unsafe-inline' ${origin.includes('localhost') ? "'unsafe-eval'" : ""};
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
        `.replace(/\s+/g, ' ').trim();

        res.headers.set('Content-Security-Policy', cspHeader);
        res.headers.set('x-nonce', nonce);
        res.headers.set('X-Content-Type-Options', 'nosniff');
        res.headers.set('X-Frame-Options', 'DENY');
        res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

        if (!origin.includes('localhost')) {
            res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        }

        return res;
    };

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'unknown');

    const nextWithNonce = () => {
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
        const isPrefetch = request.headers.get('x-next-prefetch') === '1' || request.headers.get('purpose') === 'prefetch';
        const isDataRequest = pathname.includes('/_next/data/');
        const isRscRequest = request.headers.has('x-next-rsc');

        const requestHeaders = new Headers(request.headers);
        requestHeaders.delete('x-trusted-ip');
        requestHeaders.set('x-trusted-ip', clientIp);
        requestHeaders.set('x-nonce', nonce);

        if (isMutation || isPrefetch || isDataRequest || isRscRequest) {
            return withSecurity(NextResponse.next());
        }

        try {
            return withSecurity(NextResponse.next({
                request: { headers: requestHeaders }
            }));
        } catch (error) {
            safeConsoleError('[Proxy] Failed to inject request headers:', error);
            return withSecurity(NextResponse.next());
        }
    };

    const publicUrl = process.env.PUBLIC_URL || origin;
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (internalToken && request.headers.get('authorization') === `Bearer ${internalToken}`) {
        return nextWithNonce();
    }
    if (pathname === '/api/finance/webhook/mollie' || pathname.startsWith('/api/auth/')) {
        return nextWithNonce();
    }

    const disabledRoutes = await getDisabledRoutes();
    if (disabledRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
        return withSecurity(NextResponse.rewrite(new URL('/404', request.url)));
    }

    const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`));

    if (!isPublic) {
        try {
            const rawCookie = request.headers.get('cookie') || '';

            const sessionTokenRaw = request.cookies.get('better-auth.session_token')?.value ||
                request.cookies.get('better-auth.session-token')?.value ||
                request.cookies.get('__Secure-better-auth.session_token')?.value ||
                request.cookies.get('__Secure-better-auth.session-token')?.value ||
                rawCookie.split('better-auth.session_token=')[1]?.split(';')[0]?.trim() ||
                rawCookie.split('better-auth.session-token=')[1]?.split(';')[0]?.trim();

            const testTokenRaw = request.cookies.get('directus_test_token')?.value ||
                rawCookie.split('directus_test_token=')[1]?.split(';')[0]?.trim();

            const hasTestToken = !!testTokenRaw;
            const sessionToken = sessionTokenRaw?.split('.')[0];

            let hasSession = false;

            if (sessionToken && !hasTestToken) {
                const redis = await getRedis();
                const cached = await redis.get(`session:${sessionToken}`);
                if (cached) {
                    try {
                        const sessionData = JSON.parse(cached);
                        if (sessionData && (sessionData.user || (sessionData.response && sessionData.response.user))) {
                            hasSession = true;
                        }
                    } catch (parseErr) {
                        safeConsoleError('[Proxy] Failed to parse Redis session cache:', parseErr)
                    }
                }
            }

            if (!hasSession) {
                const host = request.headers.get('host') || 'localhost:3000';
                const internalBase = process.env.NEXT_APP_INTERNAL_URL || origin;
                const sessionUrl = new URL('/api/auth/get-session', internalBase);

                try {
                    const sessionRes = await fetch(sessionUrl, {
                        headers: {
                            'cookie': rawCookie,
                            'user-agent': request.headers.get('user-agent') || 'NextJS-Proxy',
                            'accept': 'application/json',
                            'origin': publicUrl,
                            'referer': request.headers.get('referer') || publicUrl,
                            'host': host,
                            'x-better-auth-origin': publicUrl,
                            'x-forwarded-host': host,
                            'x-forwarded-proto': origin.startsWith('https') ? 'https' : 'http',
                            'x-forwarded-for': request.headers.get('x-forwarded-for') || clientIp,
                            'x-real-ip': clientIp
                        },
                        cache: 'no-store',
                        signal: AbortSignal.timeout(10000)
                    });

                    if (sessionRes.ok && sessionRes.status !== 204) {
                        const text = await sessionRes.text();

                        if (text && text !== 'null' && text !== '{}') {
                            try {
                                let sessionData = JSON.parse(text);
                                if (sessionData && 'response' in sessionData) {
                                    sessionData = sessionData.response;
                                }

                                if (sessionData && sessionData.user) {
                                    hasSession = true;

                                    if (request.nextUrl.searchParams.has('needLogin')) {
                                        const cleanUrl = new URL(request.url);
                                        cleanUrl.searchParams.delete('needLogin');
                                        cleanUrl.searchParams.delete('callbackURL');
                                        const response = NextResponse.redirect(cleanUrl);
                                        sessionRes.headers.forEach((value, key) => {
                                            if (key.toLowerCase() === 'set-cookie') {
                                                response.headers.append('set-cookie', value);
                                            }
                                        });
                                        return withSecurity(response);
                                    }

                                    const response = nextWithNonce();
                                    sessionRes.headers.forEach((value, key) => {
                                        if (key.toLowerCase() === 'set-cookie') {
                                            response.headers.append('set-cookie', value);
                                        }
                                    });
                                    return response;
                                }
                            } catch (parseErr) {
                                safeConsoleError('[Proxy] Failed to parse session text response:', parseErr);
                            }
                        }
                    }
                } catch (fetchError) {
                    safeConsoleError('[Proxy] Fetch error retrieving session from internal API:', fetchError);
                }
            }

            if (hasSession) {
                if (request.nextUrl.searchParams.has('needLogin')) {
                    const cleanUrl = new URL(request.url);
                    cleanUrl.searchParams.delete('needLogin');
                    cleanUrl.searchParams.delete('callbackURL');
                    return withSecurity(NextResponse.redirect(cleanUrl));
                }
                return nextWithNonce();
            }

            const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
            const authRedirectUrl = new URL(`/?needLogin=true&callbackURL=${callbackUrl}`, publicUrl);
            return withSecurity(NextResponse.redirect(authRedirectUrl));

        } catch (error) {
            safeConsoleError('[Proxy] Critical error during auth check:', error);
            return withSecurity(NextResponse.rewrite(new URL('/404', request.url)));
        }
    }

    return nextWithNonce();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|fonts|img|favicon.ico|robots.txt|.well-known|sw.js|manifest.json|manifest.webmanifest|workbox-|logo.svg|icons/|api/assets|api/auth).*)']
};

export { proxy };