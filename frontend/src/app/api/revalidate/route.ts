import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Webhook endpoint voor Directus om on-demand cache invalidation te triggeren
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { tag, tags, path, paths } = body;

        const revalidatedTags: string[] = [];
        const revalidatedPaths: string[] = [];

        // Tag-based revalidation: invalideer alle pages die deze collection data gebruiken
        if (tag) {
            revalidateTag(tag);
            revalidatedTags.push(tag);
            console.log('[revalidate] Revalidated tag:', tag);
        }

        if (Array.isArray(tags)) {
            tags.forEach((t) => {
                if (typeof t === 'string') {
                    revalidateTag(t);
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
