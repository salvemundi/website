import { NextRequest, NextResponse } from 'next/server';

const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const url = new URL(request.url);
    const correlationId = Math.random().toString(36).substring(7);

    console.log(`[Admin Proxy][${correlationId}] GET /${path}`);
    console.log(`[Admin Proxy][${correlationId}] Target: ${PAYMENT_API_URL}/api/admin/${path}${url.search}`);

    try {
        const authHeader = request.headers.get('Authorization');
        console.log('[API Proxy] Auth Header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING');

        const response = await fetch(`${PAYMENT_API_URL}/api/admin/${path}${url.search}`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader || '',
                'Content-Type': 'application/json',
            },
        });

        console.log('[API Proxy] Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('[API Proxy] Failed to parse upstream response as JSON:', e.message);
            return NextResponse.json(
                { error: 'Upstream returned invalid response', status: response.status },
                { status: response.status === 200 ? 502 : response.status }
            );
        }

        console.log('[API Proxy] Response data:', data);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[API Proxy] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy request', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const body = await request.json().catch(() => null);

    console.log('[API Proxy] POST Request:', {
        path,
        hasAuthHeader: !!request.headers.get('Authorization'),
        hasBody: !!body,
        targetURL: `${PAYMENT_API_URL}/api/admin/${path}`
    });

    try {
        const authHeader = request.headers.get('Authorization');
        console.log('[API Proxy] Auth Header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING');

        const response = await fetch(`${PAYMENT_API_URL}/api/admin/${path}`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader || '',
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        console.log('[API Proxy] Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('[API Proxy] Failed to parse upstream response as JSON:', e.message);
            return NextResponse.json(
                { error: 'Upstream returned invalid response', status: response.status },
                { status: response.status === 200 ? 502 : response.status }
            );
        }

        console.log('[API Proxy] Response data:', data);
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[API Proxy] POST error:', error);
        return NextResponse.json(
            { error: 'Failed to proxy request', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
