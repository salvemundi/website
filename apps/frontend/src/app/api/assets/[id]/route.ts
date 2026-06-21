import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchWithRetry } from '@/lib/directus/directus';
import { logInternalError } from '@/server/utils/logger';

export const runtime = 'nodejs';

const assetIdSchema = z.string().uuid();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const validated = assetIdSchema.safeParse(id);

    if (!validated.success) {
        return new NextResponse('Invalid Asset ID', { status: 400 });
    }

    const directusUrl = process.env.DIRECTUS_SERVICE_URL;
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
            return new Response(null, { status: res.status });
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
        return new Response(null, { status: 500 });
    }
}
