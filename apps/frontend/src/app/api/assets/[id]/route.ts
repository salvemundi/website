import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchWithRetry } from '@/lib/directus/directus';

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        console.log(`[AssetProxy] Fetching: ${url}`);
        const res = await fetchWithRetry(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error(`[AssetProxy] Directus error for ${id}: ${res.status}`);
            return new NextResponse(null, { status: res.status });
        }

        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        
        // Use arrayBuffer() instead of streaming body to resolve Node.js TransformStream bug
        // (TypeError: controller[kState].transformAlgorithm is not a function)
        const arrayBuffer = await res.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
            console.warn(`[AssetProxy] Empty buffer for ${id}`);
            return new NextResponse(null, { status: 404 });
        }

        return new NextResponse(Buffer.from(arrayBuffer), {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        console.error(`[AssetProxy] Critical error fetching ${id}:`, error.message);
        return new NextResponse(null, { status: 500 });
    } finally {
        clearTimeout(timeoutId);
    }
}
