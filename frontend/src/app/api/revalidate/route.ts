import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/shared/lib/rate-limit';


// Webhook endpoint voor Directus om on-demand cache invalidation te triggeren
export async function POST(request: NextRequest) {
    try {
        // 1. Rate Limiting
        const ip = getClientIp(request);
        if (isRateLimited(`revalidate_${ip}`, { windowMs: 60 * 1000, max: 10 })) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // 2. Secret Verification
        // Use either headers or a URL search param
        const secret = process.env.INTERNAL_API_SECRET;
        const incomingSecret = request.headers.get('x-internal-api-secret') || request.nextUrl.searchParams.get('token');

        if (secret && incomingSecret !== secret) {
            console.warn('[revalidate] Unauthorized attempt from IP:', ip);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));

        const { tag, tags, path, paths } = body;

        const revalidatedTags: string[] = [];
        const revalidatedPaths: string[] = [];

        // Tag-based revalidation: invalideer alle pages die deze collection data gebruiken
        // Next.js 16 vereist tweede parameter: "max" = stale-while-revalidate strategie
        if (tag) {
            revalidateTag(tag, 'max');
            revalidatedTags.push(tag);
            console.log('[revalidate] Revalidated tag:', tag);
        }

        if (Array.isArray(tags)) {
            tags.forEach((t) => {
                if (typeof t === 'string') {
                    revalidateTag(t, 'max');
                    revalidatedTags.push(t);
                }
            });
            console.log('[revalidate] Revalidated tags:', tags);
        }

        // Path-based revalidation: voor specifieke pages waar tag-based niet precies genoeg is
        if (path) {
            revalidatePath(path, 'page');
            revalidatedPaths.push(path);
            console.log('[revalidate] Revalidated path:', path);
        }

        if (Array.isArray(paths)) {
            paths.forEach((p) => {
                if (typeof p === 'string') {
                    revalidatePath(p, 'page');
                    revalidatedPaths.push(p);
                }
            });
            console.log('[revalidate] Revalidated paths:', paths);
        }

        if (revalidatedTags.length === 0 && revalidatedPaths.length === 0) {
            return NextResponse.json({ error: 'No tags or paths provided' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            revalidated: { tags: revalidatedTags, paths: revalidatedPaths },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[revalidate] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Revalidation endpoint is ready',
    });
}
