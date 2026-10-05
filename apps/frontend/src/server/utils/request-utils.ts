import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';


/**
 * Resolves the public-facing origin for a Next.js route handler request,
 * correctly handling reverse-proxy environments (e.g. Coolify, Nginx).
 *
 * Priority:
 *   1. x-forwarded-host + x-forwarded-proto (set by the proxy)
 *   2. Host header (non-local)
 *   3. PUBLIC_URL env var
 *   4. request.nextUrl.origin (Next.js internal fallback)
 */
export function resolveRequestOrigin(request: NextRequest): string {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`;
    }

    const host = request.headers.get('host');
    if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
        const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
        return `${proto}://${host}`;
    }

    if (process.env.PUBLIC_URL) {
        return process.env.PUBLIC_URL.replace(/\/$/, '');
    }

    return request.nextUrl.origin;
}

export async function resolveActionOrigin(): Promise<string> {
    const headerList = await headers();
    const forwardedHost = headerList.get('x-forwarded-host');
    const forwardedProto = headerList.get('x-forwarded-proto') || 'https';
    if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`;
    }

    const host = headerList.get('host');
    if (host) {
        const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
        const proto = headerList.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
        return `${proto}://${host}`;
    }

    if (process.env.PUBLIC_URL) {
        return process.env.PUBLIC_URL.replace(/\/$/, '');
    }

    return 'https://salvemundi.nl';
}