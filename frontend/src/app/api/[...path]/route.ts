import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = 'https://admin.salvemundi.nl';

// Configure an optional Directus user ID that should bypass server-side checks.
// Set via environment: DIRECTUS_API_USER_ID
let API_BYPASS_USER_ID = process.env.DIRECTUS_API_USER_ID ?? null;

// Detect a Directus API token used by server-side services or the frontend build.
// Common envs: DIRECTUS_API_TOKEN (server), VITE_DIRECTUS_API_KEY (frontend build)
const API_SERVICE_TOKEN = process.env.DIRECTUS_API_TOKEN ?? process.env.VITE_DIRECTUS_API_KEY ?? process.env.NEXT_PUBLIC_DIRECTUS_API_KEY ?? null;

async function isApiBypass(auth: string | null) {
    if (!auth) return false;
    // If the incoming Authorization header exactly matches the configured
    // service token, bypass immediately (this is the common website API token).
    if (API_SERVICE_TOKEN) {
        const normalized = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        if (normalized === String(API_SERVICE_TOKEN)) return true;
    }

    // If a bypass user id was provided explicitly, compare by user id.
    if (API_BYPASS_USER_ID) {
        try {
            const meResp = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: auth } });
            if (!meResp.ok) return false;
            const meJson = await meResp.json().catch(() => null);
            const userId = meJson?.data?.id;
            return String(userId) === String(API_BYPASS_USER_ID);
        } catch {
            return false;
        }
    }

    // If we have a service token but no explicit bypass id, discover and cache
    // the service user's id and compare it to the caller.
    if (API_SERVICE_TOKEN) {
        try {
            const svcResp = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: `Bearer ${API_SERVICE_TOKEN}` } });
            if (svcResp.ok) {
                const svcJson = await svcResp.json().catch(() => null);
                const svcUserId = svcJson?.data?.id;
                if (svcUserId) API_BYPASS_USER_ID = String(svcUserId);
                // Now compare caller's user id
                const meResp2 = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: auth } });
                if (!meResp2.ok) return false;
                const meJson2 = await meResp2.json().catch(() => null);
                const userId2 = meJson2?.data?.id;
                return String(userId2) === String(API_BYPASS_USER_ID);
            }
        } catch {
            return false;
        }
    }

    return false;
}

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
        const forwardHeaders: Record<string, string> = {};
        const auth = request.headers.get('Authorization');
        if (auth) forwardHeaders['Authorization'] = auth;

        const contentType = request.headers.get('Content-Type');
        if (contentType) forwardHeaders['Content-Type'] = contentType;

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: forwardHeaders,
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

    const targetUrl = `${DIRECTUS_URL}/${path}`;
    console.warn(`[Directus Proxy] POST ${path} -> ${targetUrl}`);

    try {
        const forwardHeaders: Record<string, string> = {};
        const auth = request.headers.get('Authorization');
        if (auth) forwardHeaders['Authorization'] = auth;

        // Server-side permission guard: only allow creating events for committees
        // that the authenticated user is member of.
        if (path.startsWith('items/events')) {
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const bypass = await isApiBypass(auth);
            if (!bypass) {
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
                    let isMember = Array.isArray(memberJson?.data) && memberJson.data.length > 0;
                    if (!isMember) {
                        // Allow members of privileged committees (bestuur, ict) to create for any committee
                        const privResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.name&limit=-1`, { headers: { Authorization: auth } });
                        const privJson = await privResp.json().catch(() => null);
                        const memberships = Array.isArray(privJson?.data) ? privJson.data : [];
                        const privileged = memberships.some((m: any) => {
                            const name = (m?.committee_id?.name || '').toString().toLowerCase();
                            return name === 'bestuur' || name === 'ict';
                        });
                        if (!privileged) {
                            return NextResponse.json({ error: 'Forbidden', message: 'Not a member of selected committee' }, { status: 403 });
                        }
                    }
                } else {
                    // If no committee specified, deny to be safe
                    return NextResponse.json({ error: 'Forbidden', message: 'Committee required' }, { status: 403 });
                }
            }
        }

        // Default to JSON content-type for POST when body is present
        forwardHeaders['Content-Type'] = 'application/json';

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
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
        const forwardHeaders: Record<string, string> = {};
        const auth = request.headers.get('Authorization');
        if (auth) forwardHeaders['Authorization'] = auth;
        forwardHeaders['Content-Type'] = 'application/json';

        // Server-side permission guard for updating events
        if (path.startsWith('items/events')) {
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const bypass = await isApiBypass(auth);
            if (!bypass) {
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
                    let isMember = Array.isArray(memberJson?.data) && memberJson.data.length > 0;
                    if (!isMember) {
                        // Allow privileged committee members (bestuur, ict) to edit any event
                        const privResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.name&limit=-1`, { headers: { Authorization: auth } });
                        const privJson = await privResp.json().catch(() => null);
                        const memberships = Array.isArray(privJson?.data) ? privJson.data : [];
                        const privileged = memberships.some((m: any) => {
                            const name = (m?.committee_id?.name || '').toString().toLowerCase();
                            return name === 'bestuur' || name === 'ict';
                        });
                        if (!privileged) {
                            return NextResponse.json({ error: 'Forbidden', message: 'Not a member of committee for this event' }, { status: 403 });
                        }
                    }
                } else {
                    return NextResponse.json({ error: 'Forbidden', message: 'Committee for event not found' }, { status: 403 });
                }
            }
        }

        // Server-side guard: editing event_signups requires attendance authorization
        if (path.startsWith('items/event_signups')) {
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const bypass = await isApiBypass(auth);
            if (!bypass) {
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
                    // Check privileged committees for full rights
                    const privResp2 = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.name&limit=-1`, { headers: { Authorization: auth } });
                    const privJson2 = await privResp2.json().catch(() => null);
                    const memberships2 = Array.isArray(privJson2?.data) ? privJson2.data : [];
                    const privileged2 = memberships2.some((m: any) => {
                        const name = (m?.committee_id?.name || '').toString().toLowerCase();
                        return name === 'bestuur' || name === 'ict';
                    });
                    if (!(isOfficer || isMember || privileged2)) {
                        return NextResponse.json({ error: 'Forbidden', message: 'Not authorized to edit signups for this event' }, { status: 403 });
                    }
                }
            }
        }

        const response = await fetch(targetUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
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
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
            }
        });

        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[Directus Proxy] DELETE ${path} failed:`, error.message);
        return NextResponse.json({ error: 'Directus Proxy Error', details: error.message }, { status: 500 });
    }
}
