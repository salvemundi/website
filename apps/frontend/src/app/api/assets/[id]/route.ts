import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Proxy route voor Directus assets.
 * Hiermee kunnen we afbeeldingen ophalen via de interne Directus URL (v7-core-directus)
 * met de DIRECTUS_STATIC_TOKEN, zonder dat de Public rol in Directus rechten nodig heeft.
 */

// Strikte validatie: de ID móét een UUID zijn om Path Traversal / LFI te voorkomen.
const assetIdSchema = z.string().uuid();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Valideer de ID
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
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return new NextResponse(null, { status: res.status });
        }

        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        const buffer = await res.arrayBuffer();

        if (buffer.byteLength === 0) {
            return new NextResponse(null, { status: 404 });
        }

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        return new NextResponse(null, { status: 500 });
    }
}
