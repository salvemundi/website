import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    const authHeader = request.headers.get('authorization');

    if (!token || authHeader !== `Bearer ${token}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = payload as { tag?: string; tags?: string[] };
    const tags = [
        ...(body.tag ? [body.tag] : []),
        ...(Array.isArray(body.tags) ? body.tags : []),
    ].filter((t): t is string => typeof t === 'string' && t.length > 0);

    if (tags.length === 0) {
        return NextResponse.json({ error: 'Missing tag(s)' }, { status: 400 });
    }

    for (const tag of tags) {
        revalidateTag(tag, 'default');
    }

    return NextResponse.json({ success: true, tags });
}
