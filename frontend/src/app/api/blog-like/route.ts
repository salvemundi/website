import { NextRequest, NextResponse } from 'next/server';

// POST /api/blog-like
// Body: { blogId: number }
// This route records a like by creating an item in the Directus collection
// `intro_blog_likes`. Ensure the collection exists with fields: blog (relation), created_at, user (optional).
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { blogId } = body || {};

        if (!blogId) {
            return NextResponse.json({ error: 'Missing blogId' }, { status: 400 });
        }
        // Require user ID for per-user like enforcement
        const { userId } = body || {};
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required to like' }, { status: 401 });
        }

        const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';
        const directusToken = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;

        if (!directusToken) {
            return NextResponse.json({ error: 'Directus API key not configured' }, { status: 500 });
        }

        const likesCollection = `${directusUrl.replace(/\/$/, '')}/items/intro_blog_likes`;

        // Check if this user already liked this blog
        const checkUrl = `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&filter[user_id][_eq]=${encodeURIComponent(userId)}&limit=1`;
        const checkResp = await fetch(checkUrl, {
            headers: { 'Authorization': `Bearer ${directusToken}` }
        });

        if (!checkResp.ok) {
            const t = await checkResp.text().catch(() => 'failed');
            console.error('Failed to check existing likes', checkResp.status, t);
            return NextResponse.json({ error: 'Failed to check existing likes' }, { status: 502 });
        }

        const checkData = await checkResp.json();
        if (Array.isArray(checkData.data) && checkData.data.length > 0) {
            // Already liked
            // Return current count
            const countUrl = `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&limit=0&meta=filter_count`;
            const countResp = await fetch(countUrl, { headers: { 'Authorization': `Bearer ${directusToken}` } });
            const countData = countResp.ok ? await countResp.json().catch(() => null) : null;
            const count = countData?.meta?.filter_count ?? null;
            return NextResponse.json({ success: true, alreadyLiked: true, likes: count });
        }

        // Create like record
        const createResp = await fetch(likesCollection, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            },
            body: JSON.stringify({ blog: blogId, user_id: userId })
        });

        if (!createResp.ok) {
            const t = await createResp.text().catch(() => 'failed');
            console.error('Failed to create like record', createResp.status, t);
            return NextResponse.json({ error: 'Failed to create like record' }, { status: 502 });
        }

        // Count likes for blog
        const countUrl = `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&limit=0&meta=filter_count`;
        const countResp = await fetch(countUrl, { headers: { 'Authorization': `Bearer ${directusToken}` } });
        const countData = countResp.ok ? await countResp.json().catch(() => null) : null;
        const count = countData?.meta?.filter_count ?? null;

        // Patch intro_blogs.likes to be in sync (best-effort)
        try {
            const blogEndpoint = `${directusUrl.replace(/\/$/, '')}/items/intro_blogs/${encodeURIComponent(blogId)}`;
            await fetch(blogEndpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${directusToken}`
                },
                body: JSON.stringify({ likes: count })
            }).catch(() => {});
        } catch (e) {
            // suppressed non-error log
        }

        return NextResponse.json({ success: true, alreadyLiked: false, likes: count });
    } catch (err: any) {
        console.error('Error in /api/blog-like', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
