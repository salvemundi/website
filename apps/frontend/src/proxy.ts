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
        // Surface-level Better Auth check
        // If not authenticated, redirect to login
    }

    return NextResponse.next();
}
