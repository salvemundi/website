import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/shared/lib/rate-limit';


const DIRECTUS_URL = 'https://admin.salvemundi.nl';

// Configure an optional Directus user ID that should bypass server-side checks.
// Set via environment: DIRECTUS_API_USER_ID
let API_BYPASS_USER_ID = process.env.DIRECTUS_API_USER_ID ?? null;

// Detect a Directus API token used by server-side services or the frontend build.
// Common envs: DIRECTUS_API_TOKEN (server), VITE_DIRECTUS_API_KEY (frontend build), NEXT_PUBLIC_DIRECTUS_API_KEY (Next.js)
const API_SERVICE_TOKEN = process.env.DIRECTUS_API_TOKEN ?? process.env.VITE_DIRECTUS_API_KEY ?? process.env.NEXT_PUBLIC_DIRECTUS_API_KEY ?? null;

async function isApiBypass(auth: string | null) {
    if (!auth) {
        console.log('[isApiBypass] No auth header provided');
        return false;
    }
    // If the incoming Authorization header exactly matches the configured
    // service token, bypass immediately (this is the common website API token).
    if (API_SERVICE_TOKEN) {
        const normalized = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        const matches = normalized === String(API_SERVICE_TOKEN);
        console.log('[isApiBypass] Token comparison:', {
            hasServiceToken: !!API_SERVICE_TOKEN,
            serviceTokenLength: API_SERVICE_TOKEN?.length,
            incomingTokenLength: normalized.length,
            matches
        });
        if (matches) return true;
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

    const targetUrl = `${DIRECTUS_URL}/${path}${url.search}`;
    console.warn(`[Directus Proxy] GET ${path} -> ${targetUrl}`);

    try {
        const forwardHeaders: Record<string, string> = {};
        const auth = request.headers.get('Authorization');
        if (auth) forwardHeaders['Authorization'] = auth;

        const contentType = request.headers.get('Content-Type');
        if (contentType) forwardHeaders['Content-Type'] = contentType;

        // Determine if this request should be cached
        // 1. Must be under /items/ (public data)
        // 2. Must either have no Auth header OR use the public service token
        const pathParts = path.split('/');
        const isItemsPath = pathParts[0] === 'items';
        const isPublicToken = !auth || (API_SERVICE_TOKEN && (auth.startsWith('Bearer ') ? auth.slice(7) : auth) === String(API_SERVICE_TOKEN));
        const shouldCache = isItemsPath && isPublicToken;

        const tags: string[] = [];
        if (isItemsPath && pathParts[1]) {
            tags.push(pathParts[1]);
        }

        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: forwardHeaders,
        };

        // Alleen caching toepassen voor publieke data
        // Dit voorkomt dat user-specifieke data (zoals /users/me or /items/event_signups) 
        // in de globale server cache terecht komt.
        if (shouldCache) {
            (fetchOptions as any).next = {
                revalidate: 120,
                tags: tags.length > 0 ? tags : undefined,
            };
        } else {
            // Forceer geen cache voor private/user data
            (fetchOptions as any).cache = 'no-store';
        }

        const response = await fetch(targetUrl, fetchOptions);

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
        // 1. Rate Limiting for writes
        const ip = getClientIp(request);
        if (isRateLimited(`proxy_write_${ip}`, { windowMs: 60 * 1000, max: 10 })) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // 2. Path Whitelisting (Security Guard)
        // Only allow POST to specific public-facing collections via the proxy.
        // Internal collections (directus_*) should never be accessible here.
        const allowedCollections = [
            'event_signups',
            'pub_crawl_signups',
            'intro_signups',
            'intro_parent_signups',
            'intro_newsletter_subscribers',
            'Stickers',
            'blog_likes',
            'trip_signups',
            'trip_signup_activities',
            'events',
            'intro_blogs',
            'intro_planning',
            'committees',
            'committee_members',
            'coupons',
            'sponsors',
            'vacancies',
            'partners',
            'FAQ',
            'news',
            'hero_banners',
            'trips',
            'trip_activities',
            'site_settings',
            'boards',
            'history',
            'attendance_officers',
            'whats_app_groups',
            'transactions',
            'feedback',
        ];

        const isAllowed = allowedCollections.some(c => path === `items/${c}` || path.startsWith(`items/${c}/`));
        // Special case: login/auth/refresh should be allowed
        const isAuthPath = path.startsWith('auth/') || path === 'users/me';

        let canBypass = false;
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
            canBypass = await isApiBypass(authHeader);
            // If they are not a system-level bypass, check if they are an admin
            if (!canBypass) {
                try {
                    const meResp = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: authHeader } });
                    if (meResp.ok) {
                        const meJson = await meResp.json().catch(() => null);
                        const userId = meJson?.data?.id;
                        const membershipsResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.name&limit=-1`, { headers: { Authorization: authHeader } });
                        const membershipsJson = await membershipsResp.json().catch(() => null);
                        const memberships = Array.isArray(membershipsJson?.data) ? membershipsJson.data : [];
                        canBypass = memberships.some((m: any) => {
                            const name = (m?.committee_id?.name || '').toString().toLowerCase();
                            return name === 'bestuur' || name === 'ict';
                        });
                    }
                } catch {
                    canBypass = false;
                }
            }
        }

        if (!isAllowed && !isAuthPath && !canBypass) {
            console.warn(`[Directus Proxy] BLOCKED POST attempt to unauthorized path: ${path} from IP: ${ip}`);
            return NextResponse.json({ error: 'Forbidden', message: 'Unauthorized path' }, { status: 403 });
        }

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

                // Get user's committees once for both membership and privilege checks
                const membershipsResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.id,committee_id.name&limit=-1`, { headers: { Authorization: auth } });
                const membershipsJson = await membershipsResp.json().catch(() => null);
                const memberships = Array.isArray(membershipsJson?.data) ? membershipsJson.data : [];

                const isPrivileged = memberships.some((m: any) => {
                    const name = (m?.committee_id?.name || '').toString().toLowerCase();
                    return name === 'bestuur' || name === 'ict';
                });

                if (!isPrivileged) {
                    const committeeId = body?.committee_id ?? null;
                    if (committeeId) {
                        const isMember = memberships.some((m: any) => {
                            const mId = m?.committee_id?.id ?? m?.committee_id;
                            return String(mId) === String(committeeId);
                        });
                        if (!isMember) {
                            return NextResponse.json({ error: 'Forbidden', message: 'Not a member of selected committee' }, { status: 403 });
                        }
                    } else {
                        // If no committee specified and not privileged, deny
                        return NextResponse.json({ error: 'Forbidden', message: 'Committee required' }, { status: 403 });
                    }
                }
            }
        }

        // Server-side Spam & Mandatory Field Guard for Signups
        // This prevents bots from hitting the API directly and skipping frontend validation
        if (path === 'items/event_signups' || path === 'items/pub_crawl_signups' || path === 'items/intro_signups') {
            const signup = body || {};

            // 1. Check for missing mandatory fields (common in API-only bots)
            const name = signup.participant_name || signup.name || signup.first_name || '';
            const email = signup.participant_email || signup.email || '';
            const phone = signup.participant_phone || signup.phone_number || signup.phone || '';

            if (!name || !email) {
                console.error(`[Spam Guard] Rejected signup for ${path}: Missing name or email`);
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            // phone is mandatory for events and intro
            if ((path === 'items/event_signups' || path === 'items/intro_signups') && !phone) {
                console.error(`[Spam Guard] Rejected signup for ${path}: Missing phone number`);
                return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
            }

            // 2. Content-based spam detection (URLs in name field)
            const nameStr = String(name).toLowerCase();
            if (nameStr.includes('http://') || nameStr.includes('https://') || nameStr.includes('www.')) {
                console.error(`[Spam Guard] Rejected signup for ${path}: URL detected in name "${name}"`);
                return NextResponse.json({ error: 'Invalid input (Spam detected)' }, { status: 400 });
            }
        }


        // Default to JSON content-type for POST when body is present
        forwardHeaders['Content-Type'] = 'application/json';

        // If the client didn't provide an Authorization header, allow certain
        // safe collection writes (intro signups) to be performed using the
        // server-side API service token so forms can submit without exposing
        // the service token to the browser. We only enable this for the
        // specific intro signup collections to limit blast radius.
        let outgoingAuth = request.headers.get('Authorization') || '';
        if (!outgoingAuth && API_SERVICE_TOKEN) {
            const isIntroSignup = path.startsWith('items/intro_signups') || path.startsWith('items/intro_parent_signups');
            if (isIntroSignup) {
                outgoingAuth = `Bearer ${API_SERVICE_TOKEN}`;
            }
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': outgoingAuth,
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
        // 1. Rate Limiting for writes
        const ip = getClientIp(request);
        if (isRateLimited(`proxy_write_${ip}`, { windowMs: 60 * 1000, max: 10 })) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // 2. Path Whitelisting
        const allowedCollections = [
            'event_signups',
            'pub_crawl_signups',
            'intro_signups',
            'intro_parent_signups',
            'Stickers',
            'trip_signups',
            'events',
            'intro_blogs',
            'intro_planning',
            'site_settings',
            'committees',
            'committee_members',
            'coupons',
            'sponsors',
            'vacancies',
            'partners',
            'FAQ',
            'news',
            'hero_banners',
            'trips',
            'trip_activities',
            'boards',
            'history',
            'attendance_officers',
            'whats_app_groups',
            'transactions',
        ];

        const isAllowed = allowedCollections.some(c => path === `items/${c}` || path.startsWith(`items/${c}/`));
        const isUserSelfUpdate = path === 'users/me';

        let canBypass = false;
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
            canBypass = await isApiBypass(authHeader);
            if (!canBypass) {
                try {
                    const meResp = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: authHeader } });
                    if (meResp.ok) {
                        const meJson = await meResp.json().catch(() => null);
                        const userId = meJson?.data?.id;
                        const membershipsResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.name&limit=-1`, { headers: { Authorization: authHeader } });
                        const membershipsJson = await membershipsResp.json().catch(() => null);
                        const memberships = Array.isArray(membershipsJson?.data) ? membershipsJson.data : [];
                        canBypass = memberships.some((m: any) => {
                            const name = (m?.committee_id?.name || '').toString().toLowerCase();
                            return name === 'bestuur' || name === 'ict';
                        });
                    }
                } catch {
                    canBypass = false;
                }
            }
        }

        if (!isAllowed && !isUserSelfUpdate && !canBypass) {
            console.warn(`[Directus Proxy] BLOCKED PATCH attempt to unauthorized path: ${path} from IP: ${ip}`);
            return NextResponse.json({ error: 'Forbidden', message: 'Unauthorized path' }, { status: 403 });
        }


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

                // Get user's committees once
                const membershipsResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.id,committee_id.name&limit=-1`, { headers: { Authorization: auth } });
                const membershipsJson = await membershipsResp.json().catch(() => null);
                const memberships = Array.isArray(membershipsJson?.data) ? membershipsJson.data : [];

                const isPrivileged = memberships.some((m: any) => {
                    const name = (m?.committee_id?.name || '').toString().toLowerCase();
                    return name === 'bestuur' || name === 'ict';
                });

                if (!isPrivileged) {
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
                        const isMember = memberships.some((m: any) => {
                            const mId = m?.committee_id?.id ?? m?.committee_id;
                            return String(mId) === String(committeeId);
                        });
                        if (!isMember) {
                            return NextResponse.json({ error: 'Forbidden', message: 'Not a member of committee for this event' }, { status: 403 });
                        }
                    } else {
                        return NextResponse.json({ error: 'Forbidden', message: 'Committee for event not found' }, { status: 403 });
                    }
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
        // 1. Rate Limiting
        const ip = getClientIp(request);
        if (isRateLimited(`proxy_write_${ip}`, { windowMs: 60 * 1000, max: 10 })) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // 2. Path Whitelisting
        const allowedCollections = [
            'event_signups',
            'pub_crawl_signups',
            'Stickers',
            'trip_signups',
            'trip_signup_activities',
            'events',
            'intro_signups',
            'intro_parent_signups',
            'intro_blogs',
            'intro_planning',
            'committees',
            'committee_members',
            'coupons',
            'news',
            'hero_banners',
            'trips',
            'trip_activities',
            'boards',
            'history',
            'attendance_officers',
        ];

        const isAllowed = allowedCollections.some(c => path === `items/${c}` || path.startsWith(`items/${c}/`));

        let canBypass = false;
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
            canBypass = await isApiBypass(authHeader);
            if (!canBypass) {
                try {
                    const meResp = await fetch(`${DIRECTUS_URL}/users/me`, { headers: { Authorization: authHeader } });
                    if (meResp.ok) {
                        const meJson = await meResp.json().catch(() => null);
                        const userId = meJson?.data?.id;
                        const membershipsResp = await fetch(`${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.name&limit=-1`, { headers: { Authorization: authHeader } });
                        const membershipsJson = await membershipsResp.json().catch(() => null);
                        const memberships = Array.isArray(membershipsJson?.data) ? membershipsJson.data : [];
                        canBypass = memberships.some((m: any) => {
                            const name = (m?.committee_id?.name || '').toString().toLowerCase();
                            return name === 'bestuur' || name === 'ict';
                        });
                    }
                } catch {
                    canBypass = false;
                }
            }
        }

        if (!isAllowed && !canBypass) {
            console.warn(`[Directus Proxy] BLOCKED DELETE attempt to unauthorized path: ${path} from IP: ${ip}`);
            return NextResponse.json({ error: 'Forbidden', message: 'Unauthorized path' }, { status: 403 });
        }

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
