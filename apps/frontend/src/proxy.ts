import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
    '/',
    '/lidmaatschap',
    '/vereniging',
    '/vereniging/oud-besturen',
    '/activiteiten',
    '/kroegentocht',
    '/intro',
    '/reis'
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Logic to allow public routes or redirect unauthenticated users to login
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (!isPublicRoute) {
        // Core Better Auth session check via cookie
        const sessionToken = request.cookies.get('better-auth.session-token');

        if (!sessionToken) {
            // Forced SSO Redirect: Sends user directly to Microsoft Login
            const callbackUrl = encodeURIComponent(request.url);
            const loginUrl = new URL(`/api/auth/login/social/microsoft?callbackURL=${callbackUrl}`, request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Config to explicitly match routes and exclude assets, common in Next.js 16 proxy setups
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

export default proxy;

