import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/shared/lib/rate-limit';

const DIRECTUS_URL = 'https://admin.salvemundi.nl';

// Configure an optional Directus user ID that should bypass server-side checks.
let API_BYPASS_USER_ID = process.env.DIRECTUS_API_USER_ID ?? null;

// Detect a Directus API token used by server-side services or the frontend build.
const API_SERVICE_TOKEN = process.env.DIRECTUS_API_TOKEN ?? process.env.VITE_DIRECTUS_API_KEY ?? process.env.NEXT_PUBLIC_DIRECTUS_API_KEY ?? process.env.DIRECTUS_API_KEY ?? process.env.DIRECTUS_TOKEN ?? null;

if (!API_SERVICE_TOKEN) {
    console.warn('[Directus Proxy] WARNING: API_SERVICE_TOKEN is not set. Admin bypass will not work.');
} else {
    console.log('[Directus Proxy] API_SERVICE_TOKEN is configured.');
}

const allowedCollections = [
    'event_signups', 'pub_crawl_signups', 'intro_signups', 'intro_parent_signups',
    'intro_newsletter_subscribers', 'Stickers', 'blog_likes', 'trip_signups',
    'trip_signup_activities', 'events', 'intro_blogs', 'intro_planning',
    'committees', 'committee_members', 'coupons', 'sponsors', 'vacancies',
    'partners', 'FAQ', 'news', 'hero_banners', 'trips', 'trip_activities',
    'site_settings', 'boards', 'Board', 'history', 'attendance_officers',
    'whats_app_groups', 'whatsapp_groups', 'transactions', 'feedback',
    'members', 'clubs', 'pub_crawl_events', 'jobs', 'safe_havens',
    'documents', 'files', 'assets',
];

function getAuthToken(request: NextRequest, url: URL): string | null {
    let auth = request.headers.get('Authorization');
    if (!auth && url.searchParams.has('access_token')) {
        auth = `Bearer ${url.searchParams.get('access_token')}`;
    }
    return auth;
}

async function isApiBypass(auth: string | null, options?: { cookie?: string | null }) {
    if (!auth && !options?.cookie) return false;

    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : auth;

    // 1. Immediate match with service token (fastest)
    if (API_SERVICE_TOKEN && token === String(API_SERVICE_TOKEN)) {
        return true;
    }

    // 2. Check if it matches a previously discovered bypass user ID
    if (API_BYPASS_USER_ID) {
        try {
            const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
            if (auth) headers['Authorization'] = auth;
            if (options?.cookie) headers['Cookie'] = options.cookie;

            const meResp = await fetch(`${DIRECTUS_URL}/users/me`, {
                headers,
                cache: 'no-store'
            });
            if (!meResp.ok) return false;
            const meJson = await meResp.json().catch(() => null);
            return String(meJson?.data?.id) === String(API_BYPASS_USER_ID);
        } catch {
            return false;
        }
    }

    // 3. One-time discovery of the service user's ID
    if (API_SERVICE_TOKEN) {
        try {
            const svcResp = await fetch(`${DIRECTUS_URL}/users/me`, {
                headers: { Authorization: `Bearer ${API_SERVICE_TOKEN}` },
                cache: 'no-store'
            });
            if (svcResp.ok) {
                const svcJson = await svcResp.json().catch(() => null);
                const svcUserId = svcJson?.data?.id;
                if (svcUserId) {
                    API_BYPASS_USER_ID = String(svcUserId);
                    // Now check if current caller matches this ID
                    const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
                    if (auth) headers['Authorization'] = auth;
                    if (options?.cookie) headers['Cookie'] = options.cookie;

                    const meResp = await fetch(`${DIRECTUS_URL}/users/me`, {
                        headers,
                        cache: 'no-store'
                    });
                    if (!meResp.ok) return false;
                    const meJson = await meResp.json().catch(() => null);
                    return String(meJson?.data?.id) === String(API_BYPASS_USER_ID);
                }
            }
        } catch {
            return false;
        }
    }

    return false;
}

function getProxyHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        if (['host', 'content-length', 'content-type', 'cookie', 'authorization'].includes(key.toLowerCase())) return;
        headers[key] = value;
    });
    return headers;
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const url = new URL(request.url);
    const auth = getAuthToken(request, url);

    try {
        const isAllowed = allowedCollections.some(c => path === `items/${c}` || path.startsWith(`items/${c}/`));
        const isAuthPath =
            path.startsWith('auth/') ||
            path.startsWith('users/me') ||
            path.includes('/auth/') ||
            path.startsWith('directus-extension-') ||
            path.startsWith('extensions/');

        let canBypass = false;
        let isUserTokenValid = true;
        const needsSpecialGuardCheck = path.startsWith('items/events') || path.startsWith('items/event_signups') || path.includes('site_settings') || path.startsWith('items/committees') || path.startsWith('items/committee_members');

        const cookie = request.headers.get('Cookie');
        if ((auth || cookie) && (!isAllowed && !isAuthPath || needsSpecialGuardCheck)) {
            const bypassOptions = cookie ? { cookie } : undefined;
            canBypass = await isApiBypass(auth, bypassOptions);
            // Removed verbose console check log

            if (!canBypass) {
                try {
                    const cookieHeader = request.headers.get('Cookie') || '';
                    const headers = getProxyHeaders(request);
                    headers['Cache-Control'] = 'no-cache';

                    if (auth) headers['Authorization'] = auth;
                    if (cookieHeader) headers['Cookie'] = cookieHeader;

                    const meResp = await fetch(`${DIRECTUS_URL}/users/me`, {
                        headers,
                        cache: 'no-store'
                    });
                    if (meResp.ok) {
                        const userData = await meResp.json().catch(() => null);
                        const userId = userData?.data?.id;

                        const membershipsResp = await fetch(
                            `${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.name,is_leader&limit=-1`,
                            { headers, cache: 'no-store' }
                        );
                        const membershipsJson = await membershipsResp.json().catch(() => ({}));
                        const memberships = Array.isArray(membershipsJson?.data) ? membershipsJson.data : [];

                        const isGeneralPrivileged = memberships.some((m: any) => {
                            const name = (m?.committee_id?.name || '').toString().toLowerCase();
                            const isLeader = m.is_leader === true;
                            return name.includes('bestuur') || name.includes('ict') || name.includes('kandidaat') || name.includes('kandi') || isLeader;
                        });

                        if (path.includes('site_settings')) {
                            const isIct = memberships.some((m: any) => (m?.committee_id?.name || '').toString().toLowerCase().includes('ict'));

                            if (!isIct) {
                                console.warn(`[Directus Proxy] BLOCKED Access to site_settings for non-ICT user ${userId}`);
                                return NextResponse.json({ error: 'Forbidden', message: 'Only ICT allowed' }, { status: 403 });
                            }

                            // Authorized
                            console.log(`[Directus Proxy] Access granted to site_settings for ICT user ${userId}. Using USER TOKEN.`);
                            canBypass = false;
                        } else {
                            canBypass = isGeneralPrivileged;
                        }
                    } else if (meResp.status === 401 || meResp.status === 403) {
                        console.warn(`[Directus Proxy] GET /users/me failed: ${meResp.status}. Marking token as invalid.`);
                        isUserTokenValid = false;
                    } else {
                        console.warn(`[Directus Proxy] GET /users/me failed: ${meResp.status}`);
                    }
                } catch (e) {
                    console.error('[Directus Proxy] GET auth check failed:', e);
                }
            }
        }



        const forwardHeaders = getProxyHeaders(request);

        let targetSearch = url.search;

        if (canBypass && API_SERVICE_TOKEN) {
            forwardHeaders['Authorization'] = `Bearer ${API_SERVICE_TOKEN}`;
            // If we are bypassing, and original request had access_token in URL, remove it so Directus uses our Service Token header
            if (url.searchParams.has('access_token')) {
                const newParams = new URLSearchParams(url.searchParams);
                newParams.delete('access_token');
                const newSearch = newParams.toString();
                targetSearch = newSearch ? `?${newSearch}` : '';
            }

        } else if (auth && (isUserTokenValid || isAuthPath)) {
            forwardHeaders['Authorization'] = auth;

        } else if (auth && !isUserTokenValid && isAllowed) {
            console.log(`[Directus Proxy] Stripping invalid token for public path: ${path}`);
            // Header is not added, effectively making it anonymous
        }

        const targetUrl = `${DIRECTUS_URL}/${path}${targetSearch}`;

        const contentType = request.headers.get('Content-Type');
        if (contentType) forwardHeaders['Content-Type'] = contentType;

        // Forward cookies if present to support cookie-based sessions
        if (cookie) forwardHeaders['Cookie'] = cookie;

        const pathParts = path.split('/');
        const isItemsPath = pathParts[0] === 'items';
        const isPublicToken = !auth || (API_SERVICE_TOKEN && (auth.startsWith('Bearer ') ? auth.slice(7) : auth) === String(API_SERVICE_TOKEN));
        const shouldCache = isItemsPath && (isPublicToken || canBypass);

        const tags: string[] = [];
        if (isItemsPath && pathParts[1]) {
            tags.push(pathParts[1]);
        }

        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: forwardHeaders,
        };

        if (shouldCache) {
            (fetchOptions as any).next = {
                revalidate: 120,
                tags: tags.length > 0 ? tags : undefined,
            };
        } else {
            (fetchOptions as any).cache = 'no-store';
        }

        // Trace token usage for debugging
        const usedToken = forwardHeaders['Authorization'] || 'none';
        const tokenType = (canBypass && API_SERVICE_TOKEN) ? 'SERVICE TOKEN' : 'USER TOKEN';
        const maskedToken = usedToken.length > 10 ? `...${usedToken.slice(-4)}` : usedToken;
        console.log(`[Directus Proxy] GET ${path} | Bypass: ${canBypass} | Forwarding: ${tokenType} (${maskedToken})`);

        const response = await fetch(targetUrl, fetchOptions);

        if (!response.ok) {
            if (response.status === 403 && (path.startsWith('items/committees') || path.startsWith('items/committee_members'))) {
                console.log(`[Directus Proxy] Softening 403 for GET ${path} to avoid browser console error.`);
                return NextResponse.json({ data: null, error: 'Forbidden', softened: true }, { status: 200 });
            }
            console.error(`[Directus Proxy] GET ${path} FAILED: Status ${response.status}`);
        }

        const responseContentType = response.headers.get('Content-Type');
        if (responseContentType && responseContentType.includes('application/json')) {
            const data = await response.json().catch(() => null);
            const safe = data === null ? {} : data;
            return NextResponse.json(safe, { status: response.status });
        } else {
            const text = await response.text().catch(() => '');
            return new Response(text, {
                status: response.status,
                headers: { 'Content-Type': responseContentType || 'text/plain' }
            });
        }

    } catch (error: any) {
        console.error(`[Directus Proxy] GET ${path} critical failure loop/exception:`, error);
        return NextResponse.json({
            error: 'Directus Proxy GET Error',
            message: error.message,
            path: path
        }, { status: 500 });
    }
}

async function handleMutation(
    method: 'POST' | 'PATCH' | 'DELETE',
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const path = params.path.join('/');
    const url = new URL(request.url);
    const authHeader = getAuthToken(request, url);

    let body: any = null;
    let rawBody: ArrayBuffer | null = null;
    if (method !== 'DELETE') {
        try {
            rawBody = await request.arrayBuffer();
            if (rawBody && rawBody.byteLength > 0) {
                const contentType = request.headers.get('Content-Type') || '';
                if (contentType.includes('application/json')) {
                    try {
                        const text = new TextDecoder().decode(rawBody);
                        body = JSON.parse(text);
                    } catch (parseError: any) {
                        console.warn(`[Directus Proxy] ${method} ${path} | JSON parse failed:`, parseError.message);
                        // Not fatal, we still have rawBody
                    }
                }
            }
        } catch (readError: any) {
            console.error(`[Directus Proxy] ${method} ${path} | Failed to read request body:`, readError.message);
        }
    }

    try {
        const ip = getClientIp(request);
        // Slightly higher limit for mutations during bursts
        if (isRateLimited(`proxy_write_${ip}`, { windowMs: 60 * 1000, max: 20 })) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }


        const isAllowed = allowedCollections.some(c => path === `items/${c}` || path.startsWith(`items/${c}/`));
        const isAuthPath =
            path.startsWith('auth/') ||
            path.startsWith('users/me') ||
            path.includes('/auth/') ||
            path.startsWith('directus-extension-') ||
            path.startsWith('extensions/');

        let canBypass = false;
        let isUserTokenValid = true;
        let userData: any = null;

        // Optimization: skip expensive checks if path is already authorized by rule
        const needsAccessCheck = !isAllowed && !isAuthPath;
        const needsSpecialGuardCheck = path.startsWith('items/events') || path.startsWith('items/event_signups') || path.includes('site_settings') || path.startsWith('items/committees') || path.startsWith('items/committee_members');

        const cookie = request.headers.get('Cookie');
        if ((authHeader || cookie) && (needsAccessCheck || needsSpecialGuardCheck)) {
            // First check if it's the known bypass token
            canBypass = await isApiBypass(authHeader, { cookie: request.headers.get('Cookie') });

            if (!canBypass) {
                // Fetch user data once for all subsequent checks
                try {
                    const cookieHeader = request.headers.get('Cookie') || '';
                    const headers = getProxyHeaders(request);
                    headers['Cache-Control'] = 'no-cache';

                    if (authHeader) headers['Authorization'] = authHeader;
                    if (cookieHeader) headers['Cookie'] = cookieHeader;

                    const meResp = await fetch(`${DIRECTUS_URL}/users/me`, {
                        headers,
                        cache: 'no-store'
                    });
                    if (meResp.ok) {
                        const meJson = await meResp.json().catch(() => null);
                        userData = meJson?.data || meJson;
                        const userId = userData?.id;

                        if (userId) {
                            // Check memberships for admin/leader status
                            const membershipsResp = await fetch(
                                `${DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&fields=committee_id.id,committee_id.name,is_leader&limit=-1`,
                                { headers, cache: 'no-store' }
                            );
                            const membershipsJson = await membershipsResp.json().catch(() => ({}));
                            const memberships = Array.isArray(membershipsJson?.data) ? membershipsJson.data : [];

                            userData.memberships = memberships;
                            canBypass = memberships.some((m: any) => {
                                const name = (m?.committee_id?.name || '').toString().toLowerCase();
                                const isLeader = m.is_leader === true;
                                return name.includes('bestuur') || name.includes('ict') || name.includes('kandidaat') || name.includes('kandi') || isLeader;
                            });
                        }
                    } else if (meResp.status === 401 || meResp.status === 403) {
                        console.warn(`[Directus Proxy] MUTATION /users/me failed: ${meResp.status}. Marking token as invalid.`);
                        isUserTokenValid = false;
                    }
                } catch (e) {
                    console.error('[Directus Proxy] Access check failed:', e);
                }
            }
        }

        if (!isAllowed && !isAuthPath && !canBypass) {
            console.warn(`[Directus Proxy] BLOCKED ${method} attempt to unauthorized path: ${path} from IP: ${ip}`);
            return NextResponse.json({ error: 'Forbidden', message: 'Unauthorized path' }, { status: 403 });
        }

        // Special Guards
        if (path.startsWith('items/events') && authHeader && !canBypass) {
            const committeeId = body?.committee_id;
            const memberships = userData?.memberships || [];
            if (committeeId) {
                const isMember = memberships.some((m: any) => String(m?.committee_id?.id || m?.committee_id) === String(committeeId));
                if (!isMember) return NextResponse.json({ error: 'Forbidden', message: 'Not a member of selected committee' }, { status: 403 });
            } else if (method === 'POST') {
                return NextResponse.json({ error: 'Forbidden', message: 'Committee required' }, { status: 403 });
            }
        }

        // Strict Guard: only ICT can touch authorized_tokens
        if (path.includes('site_settings') && body && 'authorized_tokens' in body) {
            const memberships = userData?.memberships || [];
            const isIct = memberships.some((m: any) => {
                const name = (m?.committee_id?.name || '').toString().toLowerCase();
                return name.includes('ict');
            });

            if (!isIct && !canBypass) {
                // Not ICT and not even a basic leader/bestuur? Definitely blocked.
                return NextResponse.json({ error: 'Forbidden', message: 'Only ICT allowed to modify permissions' }, { status: 403 });
            }

            // If they HAVE canBypass (e.g. Bestuur) but are NOT ICT, we still block this specific field
            if (!isIct) {
                console.warn(`[Directus Proxy] BLOCKED Bestuur/Leader attempt to modify authorized_tokens field on path: ${path} from IP: ${ip}`);
                return NextResponse.json({ error: 'Forbidden', message: 'Only ICT members can modify authorization tokens' }, { status: 403 });
            }
        }

        // Spam Guard for Signups
        if (method === 'POST' && (path === 'items/event_signups' || path === 'items/pub_crawl_signups' || path === 'items/intro_signups')) {
            const signup = body || {};
            const name = signup.participant_name || signup.name || signup.first_name || '';
            const email = signup.participant_email || signup.email || '';
            if (!name || !email || String(name).toLowerCase().includes('http')) {
                return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
            }
        }

        // Force disable bypass for site_settings so we always use the user's own token.
        // The Service Token usually does not have permissions to modify site settings.
        if (path.includes('site_settings')) {
            canBypass = false;
        }

        // Ensure deletions of event signups always use the logged-in user's token.
        // Some service tokens don't have delete permissions for `event_signups`.
        if (method === 'DELETE' && path.startsWith('items/event_signups')) {
            canBypass = false;
        }

        // Prepare outgoing request
        const forwardHeaders = getProxyHeaders(request);

        let targetSearch = url.search;

        if (canBypass && API_SERVICE_TOKEN) {
            forwardHeaders['Authorization'] = `Bearer ${API_SERVICE_TOKEN}`;
            // If we are bypassing, and original request had access_token in URL, remove it so Directus uses our Service Token header
            if (url.searchParams.has('access_token')) {
                const newParams = new URLSearchParams(url.searchParams);
                newParams.delete('access_token');
                const newSearch = newParams.toString();
                targetSearch = newSearch ? `?${newSearch}` : '';
            }
        } else if (authHeader && (isUserTokenValid || isAuthPath)) {
            forwardHeaders['Authorization'] = authHeader;
        } else if (authHeader && !isUserTokenValid && isAllowed) {
            console.log(`[Directus Proxy] Stripping invalid token for public mutation: ${path}`);
            // Header is not added
        }

        const targetUrl = `${DIRECTUS_URL}/${path}${targetSearch}`;

        const originalContentType = request.headers.get('Content-Type');
        if (originalContentType) forwardHeaders['Content-Type'] = originalContentType;
        if (cookie) forwardHeaders['Cookie'] = cookie;

        // Auto-auth for specific public forms (Intro)
        if (!authHeader && API_SERVICE_TOKEN && (path.startsWith('items/intro_signups') || path.startsWith('items/intro_parent_signups'))) {
            forwardHeaders['Authorization'] = `Bearer ${API_SERVICE_TOKEN}`;
        }

        // DEBUG: Log everything for auth/refresh if it's failing
        if (path.includes('auth/')) {
            console.log(`[Directus Proxy] PROXING AUTH: ${method} ${targetUrl} | Headers: ${JSON.stringify(Object.keys(forwardHeaders))} | Body size: ${rawBody?.byteLength || 0}`);
        }

        const response = await fetch(targetUrl, {
            method,
            headers: forwardHeaders,
            body: rawBody && rawBody.byteLength > 0 ? new Uint8Array(rawBody) : undefined,
            redirect: 'follow'
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error body');
            console.error(`[Directus Proxy] Upstream ${method} ${path} FAILED: Status ${response.status} | Body: ${errorText.slice(0, 200)}`);

            if (response.status === 403 && (path.startsWith('items/committees') || path.startsWith('items/committee_members'))) {
                console.log(`[Directus Proxy] Softening 403 for ${method} ${path} to avoid browser console error.`);
                return NextResponse.json({ data: null, error: 'Forbidden', softened: true }, { status: 200 });
            }

            // Re-create response for JSON if possible
            if (response.headers.get('Content-Type')?.includes('application/json')) {
                try {
                    return NextResponse.json(JSON.parse(errorText), { status: response.status });
                } catch {
                    return new Response(errorText, { status: response.status, headers: { 'Content-Type': 'application/json' } });
                }
            }
            return new Response(errorText, { status: response.status });
        }

        // Trace token usage for debugging
        const usedToken = forwardHeaders['Authorization'] || 'none';
        const tokenType = (canBypass && API_SERVICE_TOKEN) ? 'SERVICE TOKEN' : 'USER TOKEN';
        const maskedToken = usedToken.length > 10 ? `...${usedToken.slice(-4)}` : usedToken;
        console.log(`[Directus Proxy] ${method} ${path} | Bypass: ${canBypass} | Forwarding: ${tokenType} (${maskedToken})`);

        if (response.status === 204) return new Response(null, { status: 204 });

        const responseContentType = response.headers.get('Content-Type');
        if (responseContentType && responseContentType.includes('application/json')) {
            const data = await response.json().catch(() => null);
            const safe = data === null ? {} : data;
            return NextResponse.json(safe, { status: response.status });
        } else {
            const text = await response.text().catch(() => '');
            return new Response(text, {
                status: response.status,
                headers: { 'Content-Type': responseContentType || 'text/plain' }
            });
        }

    } catch (error: any) {
        console.error(`[Directus Proxy] ${method} ${path} critical failure loop/exception:`, error);
        return NextResponse.json({
            error: 'Directus Proxy Mutation Error',
            message: error.message,
            path: path,
            method
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleMutation('POST', request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleMutation('PATCH', request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleMutation('DELETE', request, context);
}
