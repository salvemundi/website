import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.INTERNAL_DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus:8055';
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://identity:8000';
const SERVICE_SECRET = process.env.SERVICE_SECRET || '';

async function checkAdmin(req: NextRequest) {
    const auth = req.headers.get('Authorization');
    if (!auth) return false;

    // Check if SERVICE_SECRET is set
    if (!SERVICE_SECRET) {
        console.error('SERVICE_SECRET is not set in environment variables');
        return false;
    }

    try {
        const res = await fetch(`${DIRECTUS_URL}/users/me`, {
            headers: { Authorization: auth },
            cache: 'no-store'
        });
        return res.ok;
    } catch (e) {
        console.error('Auth check failed:', e);
        return false;
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await context.params;

    if (!await checkAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const res = await fetch(`${IDENTITY_SERVICE_URL}/api/membership/groups/${groupId}/members`, {
            headers: { 'x-internal-api-secret': SERVICE_SECRET },
            cache: 'no-store'
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`Identity Service GET /groups/${groupId}/members failed:`, err);
            return NextResponse.json({ error: 'Failed to fetch members' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await context.params;

    if (!await checkAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const res = await fetch(`${IDENTITY_SERVICE_URL}/api/membership/groups/${groupId}/members`, {
            method: 'POST',
            headers: {
                'x-internal-api-secret': SERVICE_SECRET,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            return NextResponse.json(err, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
