import { NextResponse } from 'next/server';

// GET /api/blog-liked?userId=...
// Returns { likedBlogIds: number[] }
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';
        const directusToken = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;
        if (!directusToken) return NextResponse.json({ error: 'Directus API key not configured' }, { status: 500 });

        const likesCollection = `${directusUrl.replace(/\/$/, '')}/items/intro_blog_likes`;

        // Try fetching by 'user' relation field first, then 'user_id'
        const tryUrls = [
            `${likesCollection}?filter[user][_eq]=${encodeURIComponent(userId)}&fields=blog` ,
            `${likesCollection}?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=blog`
        ];

        let liked: any[] = [];
        for (const u of tryUrls) {
            const resp = await fetch(u, { headers: { 'Authorization': `Bearer ${directusToken}` } });
            if (!resp.ok) continue;
            const data = await resp.json().catch(() => null);
            if (Array.isArray(data?.data)) {
                liked = data.data;
                break;
            }
        }

        const ids = liked.map(l => (l.blog && typeof l.blog === 'object' ? l.blog.id : l.blog)).filter(Boolean);
        return NextResponse.json({ likedBlogIds: ids });
    } catch (err: any) {
        console.error('Error in /api/blog-liked', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
