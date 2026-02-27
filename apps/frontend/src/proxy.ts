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
        // Placeholder: Surface-level Better Auth check
        const sessionToken = request.cookies.get('better-auth.session-token');

        if (!sessionToken) {
            // Redirect to login if no session token is found
            const loginUrl = new URL('/api/auth/signin', request.url);
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

