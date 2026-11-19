import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PUBLIC_ROUTES } from '@/lib/config/routes';
import { getDisabledRoutes } from '@/lib/config/feature-flags';
import { safeConsoleError } from '@/server/utils/logger';
import { applySecurityHeaders, generateCspNonce } from '@/server/security/security-headers';
import { sessionService } from '@/server/security/SessionService';

function appendSetCookies(response: NextResponse, setCookieHeaders: readonly string[]): NextResponse {
    for (const cookieHeader of setCookieHeaders) {
        response.headers.append('set-cookie', cookieHeader);
    }
    return response;
}

async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname, origin } = request.nextUrl;
    const nonce = generateCspNonce();

    const withSecurity = (res: NextResponse): NextResponse => applySecurityHeaders(res, { nonce, origin });

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',').at(0)?.trim() || 'unknown' : (request.headers.get('x-real-ip') || 'unknown');

    const nextWithNonce = (forceForward = false): NextResponse => {
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
        const isPrefetch = request.headers.get('x-next-prefetch') === '1' || request.headers.get('purpose') === 'prefetch';
        const isDataRequest = pathname.includes('/_next/data/');
        const isRscRequest = request.headers.has('x-next-rsc');

        const requestHeaders = new Headers(request.headers);
        requestHeaders.delete('x-trusted-ip');
        requestHeaders.set('x-trusted-ip', clientIp);
        requestHeaders.set('x-nonce', nonce);

        if (!forceForward && (isMutation || isPrefetch || isDataRequest || isRscRequest)) {
            return withSecurity(NextResponse.next());
        }

        try {
            return withSecurity(NextResponse.next({
                request: { headers: requestHeaders }
            }));
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[proxy.ts][proxy] ', `Failed to inject request headers: ${typedError.message}`);
            return withSecurity(NextResponse.next());
        }
    };

    const publicUrl = origin;
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

    if (internalToken && request.headers.get('authorization') === `Bearer ${internalToken}`) {
        return nextWithNonce();
    }

    if (pathname === '/api/mobile/v1' || pathname.startsWith('/api/mobile/v1/') || pathname === '/.well-known/apple-app-site-association') {
        if (process.env.ENV_NAME !== 'acc' || process.env.MOBILE_API_ENABLED !== 'true') {
            return withSecurity(NextResponse.json({ error: { code: 'not_found', message: 'Niet gevonden.' } }, { status: 404 }));
        }
        return nextWithNonce(true);
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
            const { hasSession, setCookieHeaders } = await sessionService.resolveProxySession(request, {
                clientIp,
                publicUrl
            });

            if (hasSession) {
                if (request.nextUrl.searchParams.has('needLogin')) {
                    const cleanUrl = new URL(request.url);
                    cleanUrl.searchParams.delete('needLogin');
                    cleanUrl.searchParams.delete('callbackURL');
                    return withSecurity(appendSetCookies(NextResponse.redirect(cleanUrl), setCookieHeaders));
                }
                return appendSetCookies(nextWithNonce(), setCookieHeaders);
            }

            const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
            const authRedirectUrl = new URL(`/?needLogin=true&callbackURL=${callbackUrl}`, publicUrl);
            return withSecurity(NextResponse.redirect(authRedirectUrl));
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[proxy.ts][proxy] ', `Critical error during auth check: ${typedError.message}`);
            return withSecurity(NextResponse.rewrite(new URL('/404', request.url)));
        }
    }

    return nextWithNonce();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|fonts|map|img|favicon.ico|robots.txt|sw.js|manifest.webmanifest|api/assets).*)']
};

export { proxy };
