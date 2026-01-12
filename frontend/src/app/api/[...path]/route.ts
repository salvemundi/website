import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = 'https://admin.salvemundi.nl';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const url = new URL(request.url);

    // Explicitly ignore certain paths that should be handled by their own files
    // (Though Next.js App Router should handle this automatically by precedence)

    const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

    // Determine target based on path prefix
    let targetBaseUrl = DIRECTUS_URL;
    let serviceName = 'Directus';

    if (path.startsWith('payments')) {
        targetBaseUrl = PAYMENT_API_URL + '/api'; // Append /api because payment-api expects /api/payments
        serviceName = 'Payment API';
    } else if (path.startsWith('admin') && !path.startsWith('admin/users')) {
        // Some admin routes might go to payment API too? 
        // Based on previous next.config.ts rewrites: /api/admin/* -> Payment API
        // But let's check if we have a specific route file for admin. Yes we do!
        // So this catch-all shouldn't handle admin unless it falls through?
        // Actually, /api/admin is handled by src/app/api/admin/[...path]/route.ts
        // So this catch-all likely receives things that are NOT admin?
        // But if /api/payments/... doesn't have a specific route, it lands here.
    }

    // Fix for double /api issue if targetBaseUrl has it or not?
    // Payment API routes are like /api/payments/create.
    // Our path input is 'payments/create'.
    // If we set target to http://payment-api:3002/api, then url becomes http://payment-api:3002/api/payments/create. Correct.

    const targetUrl = `${targetBaseUrl}/${path}${url.search}`;
    console.warn(`[API Proxy] ${request.method} ${path} -> ${serviceName} (${targetUrl})`);

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
            },
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[Directus Proxy] GET ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Directus Proxy Error', details: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const body = await request.json().catch(() => null);

    const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

    let targetBaseUrl = DIRECTUS_URL;
    let serviceName = 'Directus';

    if (path.startsWith('payments')) {
        targetBaseUrl = PAYMENT_API_URL + '/api';
        serviceName = 'Payment API';
    }

    const targetUrl = `${targetBaseUrl}/${path}`;
    console.warn(`[API Proxy] POST ${path} -> ${serviceName} (${targetUrl})`);

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
                'X-Trace-Id': request.headers.get('X-Trace-Id') || '',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[API Proxy] POST ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Proxy Error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const body = await request.json().catch(() => null);

    const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

    let targetBaseUrl = DIRECTUS_URL;
    let serviceName = 'Directus';

    if (path.startsWith('payments')) {
        targetBaseUrl = PAYMENT_API_URL + '/api';
        serviceName = 'Payment API';
    }

    const targetUrl = `${targetBaseUrl}/${path}`;
    console.warn(`[API Proxy] PATCH ${path} -> ${serviceName} (${targetUrl})`);

    try {
        const response = await fetch(targetUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
                'X-Trace-Id': request.headers.get('X-Trace-Id') || '',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[API Proxy] PATCH ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Proxy Error', details: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const url = new URL(request.url);

    const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

    let targetBaseUrl = DIRECTUS_URL;
    let serviceName = 'Directus';

    if (path.startsWith('payments')) {
        targetBaseUrl = PAYMENT_API_URL + '/api';
        serviceName = 'Payment API';
    }

    const targetUrl = `${targetBaseUrl}/${path}${url.search}`;
    console.warn(`[API Proxy] DELETE ${path} -> ${serviceName} (${targetUrl})`);

    try {
        const response = await fetch(targetUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
                'X-Trace-Id': request.headers.get('X-Trace-Id') || '',
            }
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[API Proxy] DELETE ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Proxy Error', details: error.message }, { status: 500 });
    }
}
