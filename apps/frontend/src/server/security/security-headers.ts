import { type NextResponse } from 'next/server';

export interface SecurityHeaderEntry {
    readonly name: string;
    readonly value: string;
}

export interface SecurityHeaderOptions {
    nonce: string;
    origin: string;
}

export function generateCspNonce(): string {
    return btoa(crypto.randomUUID()).substring(0, 16);
}

export function buildContentSecurityPolicy(options: SecurityHeaderOptions): string {
    const isLocalhost = options.origin.includes('localhost');

    return `
        default-src 'self';
        script-src 'self' 'nonce-${options.nonce}' https://static.cloudflareinsights.com ${isLocalhost ? "'unsafe-eval'" : ""};
        style-src-elem 'self' 'unsafe-inline';
        style-src-attr 'unsafe-inline';
        img-src 'self' blob: data: https://*.tile.openstreetmap.org https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com;
        media-src 'self' blob: data:;
        font-src 'self' data:;
        connect-src 'self' https://login.microsoftonline.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://nominatim.openstreetmap.org https://cloudflareinsights.com;
        frame-src 'self' https://login.microsoftonline.com;
        worker-src 'self' blob:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        ${isLocalhost ? '' : 'upgrade-insecure-requests;'}
    `.replace(/\s+/g, ' ').trim();
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): SecurityHeaderEntry[] {
    const headers: SecurityHeaderEntry[] = [
        { name: 'Content-Security-Policy', value: buildContentSecurityPolicy(options) },
        { name: 'x-nonce', value: options.nonce },
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'X-Frame-Options', value: 'DENY' },
        { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];

    if (!options.origin.includes('localhost')) {
        headers.push({
            name: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
        });
    }

    return headers;
}

export function applySecurityHeaders(response: NextResponse, options: SecurityHeaderOptions): NextResponse {
    for (const header of buildSecurityHeaders(options)) {
        response.headers.set(header.name, header.value);
    }
    return response;
}
