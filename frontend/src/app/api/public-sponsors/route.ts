import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const directusToken = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;

        if (!directusToken) {
            console.error('[public-sponsors] Directus API key not configured');
            return NextResponse.json({ error: 'Directus API key not configured' }, { status: 500 });
        }

        // Include `dark_bg` so the frontend can honor per-sponsor background preference
        const url = `${directusUrl}/items/sponsors?fields=sponsor_id,image,website_url,dark_bg&sort=sponsor_id&limit=-1`;

        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Accept': 'application/json'
            },
            next: {
                revalidate: 3600, // 1 uur cache, sponsors veranderen weinig
                tags: ['sponsors'],
            }
        });


        if (!resp.ok) {
            const text = await resp.text().catch(() => null);
            console.error('[public-sponsors] Directus response error', { status: resp.status, body: text });
            return NextResponse.json({ error: 'Failed to fetch sponsors from Directus' }, { status: resp.status });
        }

        const json = await resp.json().catch(() => null);
        // Return the Directus data array directly
        return NextResponse.json(json?.data ?? []);
    } catch (err: any) {
        console.error('[public-sponsors] Error fetching sponsors', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
