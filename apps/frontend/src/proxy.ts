import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { PUBLIC_ROUTES } from '@/lib/routes';
import { auth } from '@/server/auth/auth';

// In-memory cache for feature flags
let cachedDisabledRoutes: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Haalt de lijst met uitgeschakelde routes op vanuit de Directus feature_flags collectie met caching.
 */
async function getDisabledRoutes(): Promise<string[]> {
    const now = Date.now();
    
    // Retourneer cache indien nog geldig
    if (cachedDisabledRoutes && (now - cacheTimestamp < CACHE_TTL)) {
        return cachedDisabledRoutes;
    }

    try {
        const directusUrl = process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';
        const token = process.env.DIRECTUS_STATIC_TOKEN;
        
        if (!token) {
            console.warn('[Proxy] DIRECTUS_STATIC_TOKEN ontbreekt, feature flags kunnen niet worden geladen.');
            return cachedDisabledRoutes || [];
        }

        // Haal alle feature flags op die NIET actief zijn
        const url = `${directusUrl}/items/feature_flags?filter[is_active][_eq]=false&fields=route_match`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            cache: 'no-store', // We beheren zelf de in-memory cache
        });

        if (!res.ok) {
           console.error(`[Proxy] Kon feature flags niet ophalen: ${res.status} ${res.statusText}`);
           return cachedDisabledRoutes || [];
        }

        const data = await res.json();
        
        if (data && Array.isArray(data.data)) {
            type FeatureFlag = { route_match?: string | null };
            const routes = (data.data as FeatureFlag[])
                .map((flag) => flag.route_match)
                .filter((route): route is string => Boolean(route));
            
            // Update cache
            cachedDisabledRoutes = routes;
            cacheTimestamp = now;
            return routes;
        }

        return cachedDisabledRoutes || [];
    } catch (error) {
        console.error('[Proxy] Fout tijdens laden van feature flags:', error);
        return cachedDisabledRoutes || [];
    }
}

export async function proxy(request: NextRequest) {
    // Forceer Next.js om de proxy voor elk verzoek te draaien zonder cache
    const response = NextResponse.next();
    response.headers.set('x-middleware-cache', 'no-cache');
    
    const { pathname } = request.nextUrl;

    // 1. Check op uitgeschakelde routes (Feature Flags)
    const disabledRoutes = await getDisabledRoutes();
    const isDisabled = disabledRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (isDisabled) {
        return NextResponse.rewrite(new URL('/404', request.url));
    }

    // 2. Auth gating (Public vs. Secure)
    const isPublicRoute = PUBLIC_ROUTES.some((route: string) => pathname === route || pathname.startsWith(`${route}/`));

    if (!isPublicRoute) {
        try {
            // Core Better Auth session check via API
            const session = await auth.api.getSession({
                headers: request.headers
            });

            if (!session) {
                console.log(`[Proxy] Geen sessie voor beveiligde route: ${pathname}, doorsturen naar 404`);
                return NextResponse.rewrite(new URL('/404', request.url));
            }
        } catch (error) {
            console.error(`[Proxy] Critical error tijdens getSession voor ${pathname}:`, error);
            return NextResponse.rewrite(new URL('/404', request.url));
        }
    }

    return NextResponse.next();
}

// Config to explicitly match routes and exclude assets, common in Next.js 16 proxy setups
export const config = {
    matcher: [
        /*
         * Match all requests except:
         * 1. /api (API routes)
         * 2. /_next (Next.js internals)
         * 3. Specific public folders (fonts, img)
         * 4. Static files (favicon.ico, robots.txt)
         */
        '/((?!api|_next/static|_next/image|fonts|img|favicon.ico|robots.txt).*)',
    ],
};

export default proxy;
