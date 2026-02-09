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
        const directusToken = process.env.DIRECTUS_API_TOKEN || process.env.DIRECTUS_API_KEY;

        if (!directusToken) {
            return NextResponse.json({ error: 'Directus API key not configured' }, { status: 500 });
        }

        const likesCollection = `${directusUrl.replace(/\/$/, '')}/items/intro_blog_likes`;

        // Resolve the provided user identifier to a Directus user id (if possible).
        // The frontend may send a different id (entra id or email); try to find the actual Directus user id.
        const resolveDirectusUserId = async (candidate?: string | null) => {
            if (!candidate) return null;
            try {
                // Try direct lookup by id
                const byIdUrl = `${directusUrl.replace(/\/$/, '')}/users/${encodeURIComponent(candidate)}`;
                const byIdResp = await fetch(byIdUrl, { headers: { 'Authorization': `Bearer ${directusToken}` } });
                if (byIdResp.ok) {
                    const payload = await byIdResp.json().catch(() => null);
                    const raw = payload?.data || payload;
                    if (raw?.id) return raw.id;
                }

                // Try common alternate fields (entra_id, email, fontys_email)
                const altFields = ['entra_id', 'email', 'fontys_email'];
                for (const field of altFields) {
                    const url = `${directusUrl.replace(/\/$/, '')}/users?filter[${field}][_eq]=${encodeURIComponent(candidate)}&limit=1`;
                    const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${directusToken}` } });
                    if (!resp.ok) continue;
                    const data = await resp.json().catch(() => null);
                    const rows = data?.data || data || [];
                    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.id) return rows[0].id;
                }
            } catch (e) {
                // ignore resolution errors
            }
            return null;
        };

        const resolvedUserId = await resolveDirectusUserId(userId);

        // If we can resolve a Directus user id, check for existing like by that user.
        let existingLike: any = null;
        if (resolvedUserId) {
            const checkUrl = `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&filter[user][_eq]=${encodeURIComponent(resolvedUserId)}&limit=1`;
            const checkResp = await fetch(checkUrl, { headers: { 'Authorization': `Bearer ${directusToken}` } });
            if (checkResp.ok) {
                const checkData = await checkResp.json().catch(() => null);
                if (Array.isArray(checkData?.data) && checkData.data.length > 0) existingLike = checkData.data[0];
            }
        }

        if (existingLike) {
            const countUrl = `${likesCollection}?filter[blog][_eq]=${encodeURIComponent(blogId)}&limit=0&meta=filter_count`;
            const countResp = await fetch(countUrl, { headers: { 'Authorization': `Bearer ${directusToken}` } });
            const countData = countResp.ok ? await countResp.json().catch(() => null) : null;
            const count = countData?.meta?.filter_count ?? null;
            return NextResponse.json({ success: true, alreadyLiked: true, likes: count });
        }

        // Create like record
        // Create like record using the canonical 'user' relation field where available
        let createResp = await fetch(likesCollection, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            },
            body: JSON.stringify({ blog: blogId, user: userId })
        });

        if (!createResp.ok) {
            // Inspect error - if Directus complains about invalid foreign key for the user field,
            // fallback to creating a like without attaching the user (anonymous like).
            const bodyText = await createResp.text().catch(() => '');
            let parsed: any = null;
            try { parsed = JSON.parse(bodyText); } catch (e) { parsed = null; }
            const errMsg = parsed?.errors?.[0]?.message || bodyText || '';
            console.warn('Create like failed, attempting anonymous fallback:', errMsg);

            if (/Invalid foreign key/i.test(errMsg) || /user_id/i.test(errMsg) || /user\"/i.test(errMsg)) {
                // try without user relation
                // Build candidate payloads, prefer resolvedDirectus user id when available
                const payloads: Array<Record<string, any>> = [];
                if (resolvedUserId) payloads.push({ blog: blogId, user: resolvedUserId });
                // Some installs may expect 'user_id' or 'user' or a relation object – try common shapes
                if (resolvedUserId) payloads.push({ blog: blogId, user_id: resolvedUserId });
                if (resolvedUserId) payloads.push({ blog: blogId, user: { id: resolvedUserId } });
                // Finally try anonymous like
                payloads.push({ blog: blogId });

                // Attempt payloads in order until one succeeds
                let fallbackSuccess = false;
                for (const payload of payloads) {
                    createResp = await fetch(likesCollection, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${directusToken}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (createResp.ok) {
                        fallbackSuccess = true;
                        break;
                    }
                    // otherwise continue to next payload
                }
                if (!fallbackSuccess) {
                    const t = await (createResp ? createResp.text().catch(() => 'failed') : Promise.resolve('no response'));
                    console.error('Failed to create like record (all payload attempts failed):', t);
                    return NextResponse.json({ error: 'Failed to create like record' }, { status: 502 });
                }
            } else {
                // Different error, not foreign key related
                console.error('Failed to create like record:', errMsg);
                return NextResponse.json({ error: 'Failed to create like record' }, { status: 502 });
            }
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
            }).catch(() => { });
        } catch (e) {
            // suppressed non-error log
        }

        return NextResponse.json({ success: true, alreadyLiked: false, likes: count });
    } catch (err: any) {
        console.error('Error in /api/blog-like', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
