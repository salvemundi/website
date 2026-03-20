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
    const { pathname, origin } = request.nextUrl;

    // 1. Whitelist & System checks (Bypass proxy for auth and internal tokens)
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (internalToken && request.headers.get('authorization') === `Bearer ${internalToken}`) {
        return NextResponse.next();
    }
    if (pathname === '/api/finance/webhook/mollie' || pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }

    // 2. Feature Flags
    const disabledRoutes = await getDisabledRoutes();
    if (disabledRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
        return NextResponse.rewrite(new URL('/404', request.url));
    }

    // 3. Auth Gating (Direct Redirect naar Microsoft)
    const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`));
    if (!isPublic) {
        try {
            // Check sessie via fetch (Edge-safe) naar interne API
            const internalBase = process.env.NEXT_APP_INTERNAL_URL || origin;
            const sessionUrl = new URL('/api/auth/get-session', internalBase);
            const sessionRes = await fetch(sessionUrl, {
                headers: { 
                    cookie: request.headers.get('cookie') || '',
                    'x-better-auth-origin': origin,
                    'x-forwarded-host': request.nextUrl.host,
                    'x-forwarded-proto': request.nextUrl.protocol.replace(':', '')
                },
                signal: AbortSignal.timeout(10000), // V7: voorkomt Eternal Skeletons
            });

            // Handle cases where session exists (200 OK) vs non-existent (204 or body "null")
            let hasSession = sessionRes.ok && sessionRes.status !== 204;
            if (hasSession) {
                const text = await sessionRes.text();
                // Sommige Better Auth responses geven "null" als string terug bij missing session
                if (text === 'null' || !text) {
                    hasSession = false;
                }
            }

            if (!hasSession) {
                // GEEN sessie: Redirect DIRECT naar Microsoft Sign-in (Direct Provider Flow)
                // Behoud volledige URL inclusief query parameters na redirect
                const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
                const microsoftAuthUrl = new URL(
                    `/api/auth/login/social?provider=microsoft&callbackURL=${callbackUrl}`, 
                    request.url
                );
                
                console.log(`[Proxy] No session for ${pathname}, redirecting to Microsoft.`);
                return NextResponse.redirect(microsoftAuthUrl);
            }
        } catch (error) {
            console.error('[Proxy] Auth gating critical error:', error);
            return NextResponse.rewrite(new URL('/404', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|fonts|img|api/assets|favicon.ico|robots.txt|.well-known).*)'],
};

export default proxy;
