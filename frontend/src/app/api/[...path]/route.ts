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

    const targetUrl = `${DIRECTUS_URL}/${path}${url.search}`;
    console.warn(`[Directus Proxy] GET ${path} -> ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
            },
        });

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

    const targetUrl = `${DIRECTUS_URL}/${path}`;
    console.warn(`[Directus Proxy] POST ${path} -> ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[Directus Proxy] POST ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Directus Proxy Error', details: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const body = await request.json().catch(() => null);

    const targetUrl = `${DIRECTUS_URL}/${path}`;
    console.warn(`[Directus Proxy] PATCH ${path} -> ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[Directus Proxy] PATCH ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Directus Proxy Error', details: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const url = new URL(request.url);
    const targetUrl = `${DIRECTUS_URL}/${path}${url.search}`;
    console.warn(`[Directus Proxy] DELETE ${path} -> ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[Directus Proxy] DELETE ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Directus Proxy Error', details: error.message }, { status: 500 });
    }
}
