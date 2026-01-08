import { NextRequest, NextResponse } from 'next/server';

// POST /api/blog-unlike
// Body: { blogId: number, userId: string }
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { blogId, userId } = body || {};
        if (!blogId || !userId) {
            return NextResponse.json({ error: 'Missing blogId or userId' }, { status: 400 });
        }

        const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';
        const directusToken = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;

        if (!directusToken) {
            return NextResponse.json({ error: 'Directus API key not configured' }, { status: 500 });
        }

        const likesCollection = `${directusUrl.replace(/\/$/, '')}/items/intro_blog_likes`;

        // Find like record for this user and blog. Try both possible user field names.
        let existing: any = null;
        const tryChecks = [
            `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&filter[user][_eq]=${encodeURIComponent(userId)}&limit=1`,
            `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&filter[user_id][_eq]=${encodeURIComponent(userId)}&limit=1`
        ];

        for (const url of tryChecks) {
            const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${directusToken}` } });
            if (!resp.ok) continue;
            const d = await resp.json().catch(() => null);
            if (Array.isArray(d?.data) && d.data.length > 0) {
                existing = d.data[0];
                break;
            }
        }

        if (!existing) {
            // nothing to delete
            const countUrl = `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&limit=0&meta=filter_count`;
            const countResp = await fetch(countUrl, { headers: { 'Authorization': `Bearer ${directusToken}` } });
            const countData = countResp.ok ? await countResp.json().catch(() => null) : null;
            const count = countData?.meta?.filter_count ?? null;
            return NextResponse.json({ success: true, deleted: false, likes: count });
        }

        // Delete the like record
        const deleteUrl = `${likesCollection}/${encodeURIComponent(existing.id)}`;
        const delResp = await fetch(deleteUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${directusToken}` } });
        if (!delResp.ok) {
            return NextResponse.json({ error: 'Failed to delete like' }, { status: 502 });
        }

        // Recount
        const countUrl = `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&limit=0&meta=filter_count`;
        const countResp = await fetch(countUrl, { headers: { 'Authorization': `Bearer ${directusToken}` } });
        const countData = countResp.ok ? await countResp.json().catch(() => null) : null;
        const count = countData?.meta?.filter_count ?? null;

        // Patch intro_blogs.likes (best effort)
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
        } catch (e) {}

        return NextResponse.json({ success: true, deleted: true, likes: count });
    } catch (err: any) {
        console.error('Error in /api/blog-unlike', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
