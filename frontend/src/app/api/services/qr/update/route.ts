import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { signupId, token } = await request.json();

        if (!signupId || !token) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';
        const directusToken = process.env.DIRECTUS_API_TOKEN || process.env.DIRECTUS_API_KEY;

        if (!directusToken) {
            console.error('❌ Directus API token not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Fetch current signup to ensure it exists and check strict security rules
        const fetchResponse = await fetch(`${directusUrl.replace(/\/$/, '')}/items/event_signups/${signupId}?fields=id,qr_token`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!fetchResponse.ok) {
            return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
        }

        const currentSignup = await fetchResponse.json();
        const signupData = currentSignup.data;

        // Security: Prevent overwriting existing tokens to avoid attacks resetting valid tickets
        if (signupData.qr_token) {
            console.warn(`[Security] Attempt to overwrite existing QR token for signup ${signupId} blocked.`);
            return NextResponse.json({ error: 'QR Token already exists', code: 'TOKEN_EXISTS' }, { status: 403 });
        }

        // 2. Update with new token
        const updateResponse = await fetch(`${directusUrl.replace(/\/$/, '')}/items/event_signups/${signupId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ qr_token: token })
        });

        if (!updateResponse.ok) {
            const errBody = await updateResponse.text();
            console.error('Directus Update Error:', errBody);
            throw new Error('Failed to update Directus');
        }

        const updateData = await updateResponse.json();
        return NextResponse.json({ success: true, data: updateData.data });

    } catch (error: any) {
        console.error('QR Update Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
