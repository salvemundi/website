import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Only allow in development or if a secret is provided
    const { searchParams } = new URL(request.url);
    const debugSecret = searchParams.get('secret');
    const internalSecret = process.env.INTERNAL_API_KEY;

    if (process.env.NODE_ENV === 'production' && (!debugSecret || debugSecret !== internalSecret)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiServiceToken = process.env.DIRECTUS_API_TOKEN ?? process.env.VITE_DIRECTUS_API_KEY ?? process.env.NEXT_PUBLIC_DIRECTUS_API_KEY ?? process.env.DIRECTUS_API_KEY ?? process.env.DIRECTUS_TOKEN ?? null;
    const directusUrl = process.env.DIRECTUS_URL;
    const nodeEnv = process.env.NODE_ENV;

    return NextResponse.json({
        status: 'ok',
        environment: {
            nodeEnv,
            directusUrlConfigured: !!directusUrl,
            directusUrlValue: directusUrl, // Mask this if sensitive, but usually internal URL is fine to show admins
            apiServiceTokenConfigured: !!apiServiceToken,
            apiServiceTokenLength: apiServiceToken ? apiServiceToken.length : 0,
            tokenVarFound: apiServiceToken ? 'YES' : 'NO'
        },
        timestamp: new Date().toISOString()
    });
}
