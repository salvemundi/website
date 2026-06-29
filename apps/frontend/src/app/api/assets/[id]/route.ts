import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logInternalError } from '@/server/utils/logger';

export const runtime = 'nodejs';

const assetIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok || res.status < 500) return res;
        } catch (error) {
            if (i === retries - 1) throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
    }
    throw new Error('Fetch failed after retries');
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const validated = assetIdSchema.safeParse(id);

    if (!validated.success) {
        return new NextResponse('Invalid Asset ID', { status: 400 });
    }

    const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
    const token = process.env.DIRECTUS_STATIC_TOKEN;

    if (!token) {
        return new NextResponse('DIRECTUS_STATIC_TOKEN missing', { status: 500 });
    }

    const { search } = new URL(request.url);
    const url = `${directusUrl}/assets/${id}${search}`;

    try {
        const res = await fetchWithRetry(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) {
            logInternalError(`[route.ts][GET] Asset Route Error: ${res.status}`, { id });
            return new Response(`Asset fetch failed with status: ${res.status}`, {
                status: res.status,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await res.arrayBuffer();

        return new Response(arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logInternalError(`[route.ts][GET] Critical asset fetch error: ${errorMessage}`, { id });
        return new Response(`Critical asset fetch error: ${errorMessage}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}