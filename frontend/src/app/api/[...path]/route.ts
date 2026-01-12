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

        // Server-side permission guard: only allow creating events for committees
        // that the authenticated user is member of.
        if (path.startsWith('items/events')) {
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            // get current user id
            const meResp = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: auth } });
            if (!meResp.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const meJson = await meResp.json().catch(() => null);
            const userId = meJson?.data?.id;

            const committeeId = body?.committee_id ?? null;
            if (committeeId) {
                const memberCheckUrl = `${DIRECTUS_URL}/items/committee_members?filter[committee_id][_eq]=${encodeURIComponent(committeeId)}&filter[user_id][_eq]=${encodeURIComponent(userId)}&limit=1`;
                const memberResp = await fetch(memberCheckUrl, { headers: { Authorization: auth } });
                const memberJson = await memberResp.json().catch(() => null);
                const isMember = Array.isArray(memberJson?.data) && memberJson.data.length > 0;
                if (!isMember) {
                    return NextResponse.json({ error: 'Forbidden', message: 'Not a member of selected committee' }, { status: 403 });
                }
            } else {
                // If no committee specified, deny to be safe
                return NextResponse.json({ error: 'Forbidden', message: 'Committee required' }, { status: 403 });
            }
        }

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

        // Server-side permission guard for updating events
        if (path.startsWith('items/events')) {
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            // get current user id
            const meResp = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: auth } });
            if (!meResp.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const meJson = await meResp.json().catch(() => null);
            const userId = meJson?.data?.id;

            // Extract event id from path: items/events/{id}
            const parts = path.split('/');
            const eventId = parts.length >= 3 ? parts[2] : null;

            // Determine committee_id to check: prefer body.committee_id if provided, otherwise fetch existing event
            let committeeId = body?.committee_id ?? null;
            if (!committeeId && eventId) {
                const evResp = await fetch(`${DIRECTUS_URL}/items/events/${encodeURIComponent(eventId)}?fields=committee_id`, { headers: { Authorization: auth } });
                if (!evResp.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
                const evJson = await evResp.json().catch(() => null);
                committeeId = evJson?.data?.committee_id ?? null;
            }

            if (committeeId) {
                const memberCheckUrl = `${DIRECTUS_URL}/items/committee_members?filter[committee_id][_eq]=${encodeURIComponent(committeeId)}&filter[user_id][_eq]=${encodeURIComponent(userId)}&limit=1`;
                const memberResp = await fetch(memberCheckUrl, { headers: { Authorization: auth } });
                const memberJson = await memberResp.json().catch(() => null);
                const isMember = Array.isArray(memberJson?.data) && memberJson.data.length > 0;
                if (!isMember) {
                    return NextResponse.json({ error: 'Forbidden', message: 'Not a member of committee for this event' }, { status: 403 });
                }
            } else {
                return NextResponse.json({ error: 'Forbidden', message: 'Committee for event not found' }, { status: 403 });
            }
        }

        // Server-side guard: editing event_signups requires attendance authorization
        if (path.startsWith('items/event_signups')) {
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            // Extract signup id from path: items/event_signups/{id}
            const parts = path.split('/');
            const signupId = parts.length >= 3 ? parts[2] : null;
            if (!signupId) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

            // Fetch signup to get event_id
            const signupResp = await fetch(`${DIRECTUS_URL}/items/event_signups/${encodeURIComponent(signupId)}?fields=event_id`, { headers: { Authorization: auth } });
            if (!signupResp.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            const signupJson = await signupResp.json().catch(() => null);
            const eventId = signupJson?.data?.event_id ?? null;
            if (!eventId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            // Check if user is attendance officer or committee member
            const eventResp = await fetch(`${DIRECTUS_URL}/items/events/${encodeURIComponent(eventId)}?fields=committee_id,attendance_officers.directus_users_id`, { headers: { Authorization: auth } });
            if (!eventResp.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            const eventJson = await eventResp.json().catch(() => null);
            const attendanceOfficers = eventJson?.data?.attendance_officers || [];
            const committeeId = eventJson?.data?.committee_id ?? null;
            const meResp2 = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: auth } });
            const meJson2 = await meResp2.json().catch(() => null);
            const userId = meJson2?.data?.id;

            const isOfficer = Array.isArray(attendanceOfficers) && attendanceOfficers.some((a: any) => String(a.directus_users_id) === String(userId));
            let isMember = false;
            if (committeeId) {
                const memberResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[committee_id][_eq]=${encodeURIComponent(committeeId)}&filter[user_id][_eq]=${encodeURIComponent(userId)}&limit=1`, { headers: { Authorization: auth } });
                const memberJson = await memberResp.json().catch(() => null);
                isMember = Array.isArray(memberJson?.data) && memberJson.data.length > 0;
            }

            if (!(isOfficer || isMember)) {
                return NextResponse.json({ error: 'Forbidden', message: 'Not authorized to edit signups for this event' }, { status: 403 });
            }
        }

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
