import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { PUBLIC_ROUTES } from '@/lib/routes';

/**
 * Haalt de lijst met uitgeschakelde routes op.
 * VOORBEREIDING: In de toekomst wordt dit gekoppeld aan een Admin Dashboard API,
 * een Edge Config (Vercel) of een snelle Key-Value store (Redis).
 */
async function getDisabledRoutes(): Promise<string[]> {
    try {
        // HIER KOMT LATER DE DYNAMISCHE FETCH:
        // const res = await fetch(process.env.ADMIN_CONFIG_URL, { next: { revalidate: 60 } });
        // const config = await res.json();
        // return config.disabledRoutes;

        // Voor nu: Statische fallback die we later in de Admin kunnen overschrijven
        return [];
    } catch (error) {
        console.error('[Proxy] Kon dynamische config niet laden, fallback naar leeg:', error);
        return [];
    }
}

export async function proxy(request: NextRequest) {
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
            // Forced SSO Redirect: Sends user directly to Microsoft Login
            const callbackUrl = encodeURIComponent(request.url);
            const loginUrl = new URL(`/api/auth/sign-in/social/microsoft?callbackURL=${callbackUrl}`, request.url);
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

