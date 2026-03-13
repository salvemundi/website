import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { PUBLIC_ROUTES } from '@/lib/routes';

/**
 * Haalt de lijst met uitgeschakelde routes op vanuit de Directus feature_flags collectie.
 */
async function getDisabledRoutes(): Promise<string[]> {
    try {
        const directusUrl = process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';
        const token = process.env.DIRECTUS_STATIC_TOKEN;
        
        if (!token) {
            console.warn('[Proxy] DIRECTUS_STATIC_TOKEN ontbreekt, feature flags kunnen niet worden geladen.');
            return [];
        }

        // Haal alle feature flags op die NIET actief zijn
        // We voegen een timestamp toe als cache-buster en gebruiken cache: 'no-store'
        // omdat we in de Proxy altijd de meest actuele status willen hebben.
        const url = `${directusUrl}/items/feature_flags?filter[is_active][_eq]=false&fields=route_match`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
           console.error(`[Proxy] Kon feature flags niet ophalen: ${res.status} ${res.statusText}`);
           return [];
        }

        const data = await res.json();
        
        // Zorg ervoor dat data in juiste formaat is
        if (data && Array.isArray(data.data)) {
            // Transformeer [{ route_match: "/kroegentocht" }] naar ["/kroegentocht"]
            return data.data.map((flag: any) => flag.route_match).filter(Boolean);
        }

        return [];
    } catch (error) {
        console.error('[Proxy] Fout tijdens laden van dynamische feature flags, fallback naar leeg:', error);
        return [];
    }
}

export async function proxy(request: NextRequest) {
    // Forceer Next.js om de proxy voor elk verzoek te draaien zonder cache
    const response = NextResponse.next();
    response.headers.set('x-middleware-cache', 'no-cache');
    
    const { pathname } = request.nextUrl;

    // 1. Check op uitgeschakelde routes (Feature Flags) - Nu voorbereid op dynamische data
    const disabledRoutes = await getDisabledRoutes();
    const isDisabled = disabledRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (isDisabled) {
        // Interne rewrite naar een route die niet bestaat; Next.js pakt automatisch onze not-found.tsx
        return NextResponse.rewrite(new URL('/404', request.url));
    }

    // 2. Auth gating (Public vs. Secure)
    const isPublicRoute = PUBLIC_ROUTES.some((route: string) => pathname === route || pathname.startsWith(`${route}/`));

    if (!isPublicRoute) {
        // Core Better Auth session check via cookie
        const sessionToken = request.cookies.get('better-auth.session-token');

        if (!sessionToken) {
            // Better Auth Redirect: Sends user to the API endpoint that triggers Microsoft Entra ID Login
            // Met Better Auth is het endpoint `/api/auth/sign-in/microsoft` niet `/social/microsoft` (tenzij expliciet gedefinieerd).
            // We behouden de callbackURL om na het inloggen de bezoeker terug te sturen
            const callbackUrl = encodeURIComponent(request.url);
            const loginUrl = new URL(`/api/auth/sign-in/microsoft?callbackURL=${callbackUrl}`, request.url);
            return NextResponse.redirect(loginUrl);
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

