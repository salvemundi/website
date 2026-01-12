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
    console.log(`[Directus Proxy] GET ${path} -> ${targetUrl}`);

    try {
        const forwardHeaders: Record<string, string> = {};
        const auth = request.headers.get('Authorization');
        if (auth) forwardHeaders['Authorization'] = auth;

        const contentType = request.headers.get('Content-Type');
        if (contentType) forwardHeaders['Content-Type'] = contentType;

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: forwardHeaders,
        });

        const respContentType = response.headers.get('content-type') || '';

        // If the response is JSON, parse and return JSON.
        if (respContentType.includes('application/json')) {
            const data = await response.json().catch(() => null);
            return NextResponse.json(data, { status: response.status });
        }

        // For binary/content responses (images, files), stream the body back.
        const body = response.body;
        const headers: Record<string, string> = {};
        if (respContentType) headers['Content-Type'] = respContentType;
        const forwarded = new NextResponse(body, { status: response.status, headers });
        return forwarded;
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
    console.log(`[Directus Proxy] POST ${path} -> ${targetUrl}`);

    try {
        const forwardHeaders: Record<string, string> = {};
        const auth = request.headers.get('Authorization');
        if (auth) forwardHeaders['Authorization'] = auth;

        // Default to JSON content-type for POST when body is present
        forwardHeaders['Content-Type'] = 'application/json';

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: forwardHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        const respContentType = response.headers.get('content-type') || '';
        if (respContentType.includes('application/json')) {
            const data = await response.json().catch(() => null);
            return NextResponse.json(data, { status: response.status });
        }

        const bodyStream = response.body;
        const headers: Record<string, string> = {};
        if (respContentType) headers['Content-Type'] = respContentType;
        return new NextResponse(bodyStream, { status: response.status, headers });
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

    try {
        const forwardHeaders: Record<string, string> = {};
        const auth = request.headers.get('Authorization');
        if (auth) forwardHeaders['Authorization'] = auth;
        forwardHeaders['Content-Type'] = 'application/json';

        const response = await fetch(targetUrl, {
            method: 'PATCH',
            headers: forwardHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        const respContentType = response.headers.get('content-type') || '';
        if (respContentType.includes('application/json')) {
            const data = await response.json().catch(() => null);
            return NextResponse.json(data, { status: response.status });
        }

        const bodyStream = response.body;
        const headers: Record<string, string> = {};
        if (respContentType) headers['Content-Type'] = respContentType;
        return new NextResponse(bodyStream, { status: response.status, headers });
    } catch (error: any) {
        return NextResponse.json({ error: 'Directus Proxy Error' }, { status: 500 });
    }
}
