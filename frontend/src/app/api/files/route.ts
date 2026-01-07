import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const directusBase = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');

    // Prefer client-supplied Authorization header, fall back to server API key if configured
    const clientAuth = request.headers.get('authorization');
    const serverKey = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;
    const authHeader = clientAuth || (serverKey ? `Bearer ${serverKey}` : undefined);

    const contentType = request.headers.get('content-type') || undefined;

    const body = await request.arrayBuffer();

    const proxied = await fetch(`${directusBase}/files`, {
      method: 'POST',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
      body,
    });

    const text = await proxied.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch (e) { json = text; }

    return NextResponse.json(json, { status: proxied.status });
  } catch (err: any) {
    console.error('[api/files] proxy error', err);
    return NextResponse.json({ error: 'Proxy to Directus /files failed', details: err?.message || String(err) }, { status: 500 });
  }
}
