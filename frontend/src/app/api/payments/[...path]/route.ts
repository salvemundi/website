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

    const targetUrl = `${PAYMENT_API_URL}/api/payments/${path}${url.search}`;
    console.warn(`[Payment Proxy][${traceId}] ${method} /${path} -> ${targetUrl}`);

    try {
        const headers: HeadersInit = {
            'Authorization': request.headers.get('Authorization') || '',
            'X-Trace-Id': traceId,
            'X-Environment': process.env.NODE_ENV || 'development'
        };

        // Forward important content headers
        if (request.headers.get('Content-Type')) {
            headers['Content-Type'] = request.headers.get('Content-Type')!;
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        if (method !== 'GET' && method !== 'HEAD') {
            // Read body as ArrayBuffer to handle both JSON and Form Data (Mollie)
            const arrayBuffer = await request.arrayBuffer().catch(() => null);
            if (arrayBuffer && arrayBuffer.byteLength > 0) {
                fetchOptions.body = arrayBuffer;
            }
        }

        const response = await fetch(targetUrl, fetchOptions);

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }

        // Return raw response to support non-JSON responses if needed, but usually APIs return JSON.
        // However, if the backend returns text (like Mollie webhook response often is just 200 OK text),
        // we should probably just stream it back or try text().
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        } else {
            const text = await response.text();
            return new Response(text, { status: response.status, headers: { 'Content-Type': contentType || 'text/plain' } });
        }

    } catch (error: any) {
        console.error(`[Payment Proxy][${traceId}] Failed to fetch ${targetUrl}:`, error.message);
        if (error.stack) console.error(error.stack);
        return NextResponse.json(
            { error: 'Payment Proxy Error', details: error.message, target: targetUrl },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'GET'); }
export async function POST(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'POST'); }
export async function PATCH(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'PATCH'); }
export async function DELETE(req: NextRequest, ctx: any) { return proxyRequest(req, ctx, 'DELETE'); }
