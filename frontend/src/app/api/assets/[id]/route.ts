import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const id = params.id;
        const directusBase = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');

        // Prefer client-supplied Authorization header, then access_token query param, fall back to server API key
        const reqUrl = new URL(request.url);
        let clientAuth = request.headers.get('authorization');
        if (!clientAuth && reqUrl.searchParams.has('access_token')) {
            clientAuth = `Bearer ${reqUrl.searchParams.get('access_token')}`;
        }

        const serverKey = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;
        const authHeader = clientAuth || (serverKey ? `Bearer ${serverKey}` : undefined);


        // Preserve query string (e.g., width/quality/access_token)
        const search = reqUrl.search || '';


        const target = `${directusBase}/assets/${encodeURIComponent(id)}${search}`;

        const proxied = await fetch(target, {
            method: 'GET',
            headers: {
                ...(authHeader ? { Authorization: authHeader } : {})
            },
            cache: 'no-store' // Ensure we don't cache assets on the server side
        });

        // Stream bytes back to the client, preserving content-type
        const buffer = await proxied.arrayBuffer();
        const headers: Record<string, string> = {};
        proxied.headers.forEach((v, k) => (headers[k] = v));

        return new Response(buffer, { status: proxied.status, headers });
    } catch (err: any) {
        console.error('[api/assets] proxy error', err);
        return NextResponse.json({ error: 'Proxy to Directus /assets failed', details: err?.message || String(err) }, { status: 500 });
    }
}
