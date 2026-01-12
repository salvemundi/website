import { NextRequest, NextResponse } from 'next/server';

const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

async function proxyRequest(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> },
    method: string
) {
    const params = await context.params;
    const path = params.path.join('/');
    const url = new URL(request.url);
    const traceId = request.headers.get('X-Trace-Id') || `proxy-${Math.random().toString(36).substring(7)}`;

    // Target: http://payment-api:3002/api/payments/create (for example)
    // Incoming path is 'create' (because file is in api/payments folder)
    // So we append path to base
    const targetUrl = `${PAYMENT_API_URL}/api/payments/${path}${url.search}`;

    console.warn(`[Payment Proxy][${traceId}] ${method} /${path} -> ${targetUrl}`);

    try {
        const headers: HeadersInit = {
            'Content-Type': request.headers.get('Content-Type') || 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'X-Trace-Id': traceId
        };

        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        if (method !== 'GET' && method !== 'HEAD') {
            const body = await request.json().catch(() => null);
            if (body) {
                fetchOptions.body = JSON.stringify(body);
            }
        }

        const response = await fetch(targetUrl, fetchOptions);

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }

        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error(`[Payment Proxy][${traceId}] Failed:`, error.message);
        return NextResponse.json(
            { error: 'Payment Proxy Error', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'GET'); }
export async function POST(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'POST'); }
export async function PATCH(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'PATCH'); }
export async function DELETE(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'DELETE'); }
