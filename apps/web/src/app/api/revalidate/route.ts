import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        const secret = process.env.SERVICE_SECRET;

        // Check authorization header or query parameter
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('secret');

        if (!secret || token !== secret) {
            console.warn('[Webhook] Unauthorized revalidation attempt');
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await request.json();
        const rawCollection = payload.collection;

        if (rawCollection) {
            // Map 'directus_files' system collection to our 'assets' tag
            const targetTag = rawCollection === 'directus_files' ? 'assets' : rawCollection;

            revalidateTag(targetTag);
            console.log(`[Webhook] Successfully revalidated tag: ${targetTag} (triggered by ${rawCollection})`);

            return NextResponse.json({ revalidated: true, tag: targetTag, now: Date.now() });
        }

        return NextResponse.json({ message: 'No collection specified in payload' }, { status: 400 });
    } catch (err: any) {
        console.error('[Webhook] Error parsing revalidation request:', err.message);
        return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
    }
}
