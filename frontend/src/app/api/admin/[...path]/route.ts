import { NextRequest, NextResponse } from 'next/server';

const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';
const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://admin-api:3005';

async function proxyRequest(request: NextRequest, path: string, method: string) {
    const url = new URL(request.url);
    const correlationId = Math.random().toString(36).substring(7);

    // Bifurcate routing: payment-settings goes to payment-api, rest to dedicated admin-api
    const targetBase = path === 'payment-settings' ? PAYMENT_API_URL : ADMIN_API_URL;
    const targetURL = `${targetBase}/api/admin/${path}${url.search}`;

    console.log(`[Admin Proxy][${correlationId}] ${method} /${path} -> ${targetURL}`);

    try {
        const authHeader = request.headers.get('Authorization');
        const body = method !== 'GET' && method !== 'HEAD' ? await request.json().catch(() => null) : undefined;

        const response = await fetch(targetURL, {
            method,
            headers: {
                'Authorization': authHeader || '',
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        console.log(`[Admin Proxy][${correlationId}] Upstream Status: ${response.status}`);

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error(`[Admin Proxy][${correlationId}] JSON Parse Error`);
            return NextResponse.json(
                { error: 'Upstream returned invalid response' },
                { status: response.status === 200 ? 502 : response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[Admin Proxy][${correlationId}] Error:`, error);
        return NextResponse.json(
            { error: 'Failed to proxy request', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'), 'GET');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'), 'POST');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'), 'PATCH');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'), 'DELETE');
}
