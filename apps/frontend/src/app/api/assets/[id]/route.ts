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

    try {
        const res = await fetchWithRetry(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            signal: AbortSignal.timeout(15000), // 15s timeout
        });

        if (!res.ok) {
            return new NextResponse(null, { status: res.status });
        }

        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        
        // STREAMING: In plaats van de hele buffer in het geheugen te laden (.arrayBuffer()),
        // streamen we de body direct door naar de client. Dit is sneller en voorkomt "half-loading".
        return new NextResponse(res.body, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // Assets in Directus zijn immutable bij ID
            },
        });
    } catch (error: any) {
        console.error(`[AssetProxy] Error fetching ${id}:`, error.message);
        return new NextResponse(null, { status: 500 });
    }
}
