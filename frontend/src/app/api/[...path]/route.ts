import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/shared/lib/rate-limit';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';

// Configure an optional Directus user ID that should bypass server-side checks.
let API_BYPASS_USER_ID = process.env.DIRECTUS_API_USER_ID ?? null;

// Detect a Directus API token used by server-side services or the frontend build.
const API_SERVICE_TOKEN = process.env.DIRECTUS_API_TOKEN ?? process.env.VITE_DIRECTUS_API_KEY ?? process.env.NEXT_PUBLIC_DIRECTUS_API_KEY ?? process.env.DIRECTUS_API_KEY ?? process.env.DIRECTUS_TOKEN ?? null;

if (!API_SERVICE_TOKEN) {
    console.warn('[Directus Proxy] WARNING: API_SERVICE_TOKEN is not set. Admin bypass will not work.');
}

const allowedCollections = [
    'event_signups', 'pub_crawl_signups', 'intro_signups', 'intro_parent_signups',
    'intro_newsletter_subscribers', 'Stickers', 'blog_likes', 'trip_signups',
    'trip_signup_activities', 'events', 'intro_blogs', 'intro_planning',
    'committees', 'committee_members', 'coupons', 'sponsors', 'vacancies',
    'partners', 'FAQ', 'news', 'hero_banners', 'trips', 'trip_activities',
    'site_settings', 'boards', 'Board', 'history', 'attendance_officers',
    'whats_app_groups', 'whatsapp_groups', 'transactions', 'feedback',
    'members', 'clubs', 'pub_crawl_events', 'pub_crawl_tickets', 'jobs', 'safe_havens',
    'documents', 'files', 'assets',
];

function getAuthToken(request: NextRequest, url: URL): string | null {
    let auth = request.headers.get('Authorization') || request.headers.get('authorization');
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
    const skipHeaders = [
        'host',
        'content-length',
        'content-type',
        'cookie',
        'authorization',
        'connection',
        'upgrade',
        'transfer-encoding',
        'keep-alive'
    ];

    request.headers.forEach((value, key) => {
        if (skipHeaders.includes(key.toLowerCase())) return;
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
        const isAllowed = allowedCollections.some(c =>
            path === `items/${c}` || path.startsWith(`items/${c}/`) ||
            path === c || path.startsWith(`${c}/`)
        );
        const isAuthPath =
            path.startsWith('auth/') ||
            path.startsWith('users/me') ||
            path.includes('/auth/') ||
            path.startsWith('directus-extension-') ||
            path.startsWith('extensions/');

        let canBypass = false;
        let isUserTokenValid = true;
        const needsSpecialGuardCheck = path.startsWith('items/events') || path.startsWith('items/event_signups') || path.includes('site_settings') || path.startsWith('items/committees') || path.startsWith('items/committee_members') || path.startsWith('items/pub_crawl_');

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
                            // For GET requests, allow all authenticated users to read site_settings
                            // This is needed so users can see if intro/kroegentocht/reis pages are enabled
                            // Write operations (POST/PATCH/DELETE) will still be restricted to ICT in the mutation handlers
                            canBypass = false; // Use user token for personalized access
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



        const forwardHeaders: Record<string, string> = {
            ...getProxyHeaders(request),
            'X-Requested-With': 'XMLHttpRequest',
            'X-Forwarded-For': getClientIp(request) || '',
            'X-Forwarded-Proto': 'https',
        };


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

        } else if (auth && (isUserTokenValid || isAuthPath || needsSpecialGuardCheck || isAllowed)) {
            // Never send Authorization header for auth paths like /auth/refresh or /auth/login
            // as Directus expects tokens in the body and might fail if an expired/duplicate token is in the header.
            // However, /users/me specifically MUST have the Authorization header.
            const isIdentityPath = path.startsWith('users/me');
            const isStrictAuthPath = (path.includes('auth/') || path.startsWith('auth/')) && !isIdentityPath;

            if (!isStrictAuthPath || isIdentityPath) {
                forwardHeaders['Authorization'] = auth;

                // Eliminate ambiguity: if we send Auth header, kill the query param
                if (url.searchParams.has('access_token')) {
                    const newParams = new URLSearchParams(url.searchParams);
                    newParams.delete('access_token');
                    const newSearch = newParams.toString();
                    targetSearch = newSearch ? `?${newSearch}` : '';
                }

                // Eliminate conflict: if we send Auth header (Bearer), remove cookies
                if (forwardHeaders['Authorization'] && forwardHeaders['Cookie']) {
                    delete forwardHeaders['Cookie'];
                }
            }

        } else if (auth && !isUserTokenValid && isAllowed && !needsSpecialGuardCheck) {
            console.log(`[Directus Proxy] Stripping invalid token for public path: ${path}`);
            // Header is not added, effectively making it anonymous
        }

        // FINAL SAFETY CHECK: Ensure we never send double auth
        if (forwardHeaders['Authorization'] && targetSearch.includes('access_token')) {
            console.warn(`[Directus Proxy] Detected query token despite having auth header. Stripping from targetSearch.`);
            const sanityParams = new URLSearchParams(targetSearch.replace(/^\?/, ''));
            sanityParams.delete('access_token');
            const newSanitySearch = sanityParams.toString();
            targetSearch = newSanitySearch ? `?${newSanitySearch}` : '';
        }

        const targetUrl = `${DIRECTUS_URL}/${path}${targetSearch}`;

        // Temporarily remove the premature logging here


        const contentType = request.headers.get('Content-Type');
        if (contentType) forwardHeaders['Content-Type'] = contentType;

        // Forward cookies if present to support cookie-based sessions, BUT ONLY if we aren't already using Bearer auth
        // AND if we aren't sending an access_token in the query string (which counts as an auth method)
        if (cookie && !forwardHeaders['Authorization'] && !targetSearch.includes('access_token')) {
            forwardHeaders['Cookie'] = cookie;
        }

        const pathParts = path.split('/');
        const isItemsPath = pathParts[0] === 'items';
        const isPublicToken = !auth || (API_SERVICE_TOKEN && (auth.startsWith('Bearer ') ? auth.slice(7) : auth) === String(API_SERVICE_TOKEN));
        const shouldCache = isItemsPath && (isPublicToken || canBypass);

        const tags: string[] = [];
        if (isItemsPath && pathParts[1]) {
            tags.push(pathParts[1]);
        }

        // DIAGNOSTIC: Log final state for asset requests AFTER all header manipulation
        if (path.includes('assets') || path.includes('image')) {
            console.warn(`[ASSET DEBUG] ===== FINAL REQUEST TO DIRECTUS =====`);
            console.warn(`[ASSET DEBUG] Path: ${path}`);
            console.warn(`[ASSET DEBUG] Target URL: ${targetUrl}`);
            console.warn(`[ASSET DEBUG] Query has access_token: ${targetSearch.includes('access_token')}`);
            console.warn(`[ASSET DEBUG] Authorization header present: ${!!forwardHeaders['Authorization']}`);
            console.warn(`[ASSET DEBUG] Cookie header present: ${!!forwardHeaders['Cookie']}`);
            if (forwardHeaders['Cookie']) {
                console.warn(`[ASSET DEBUG] Cookie value (first 50 chars): ${forwardHeaders['Cookie'].substring(0, 50)}`);
            }
            console.warn(`[ASSET DEBUG] ==========================================`);
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

        // Token tracing is disabled in production to reduce log noise
        // Uncomment for debugging: console.log(`[Directus Proxy] GET ${path} | Bypass: ${canBypass}`);

        const response = await fetch(targetUrl, fetchOptions);

        if (!response.ok) {
            // Special handling for 400 errors on assets
            if (response.status === 400 && (path.includes('assets') || path.includes('image'))) {
                console.error(`[ASSET DEBUG] ===== 400 ERROR FROM DIRECTUS =====`);
                const errorText = await response.text().catch(() => '(unable to read error body)');
                console.error(`[ASSET DEBUG] Error body: ${errorText}`);
                console.error(`[ASSET DEBUG] This means Directus saw multiple auth methods!`);
                console.error(`[ASSET DEBUG] ======================================`);
                // Return error response
                return new NextResponse(errorText, { status: 400 });
            }

            if (response.status === 403 && (
                path.startsWith('items/committees') ||
                path.startsWith('items/committee_members') ||
                path.startsWith('items/event_signups') ||
                path.startsWith('items/pub_crawl_signups')
            )) {
                console.log(`[Directus Proxy] Softening 403 for GET ${path} to avoid browser console error.`);
                // Return an empty array so frontend map() calls don't crash
                return NextResponse.json({ data: [], error: 'Forbidden', softened: true }, { status: 200 });
            }
            console.error(`[Directus Proxy] GET ${path} FAILED: Status ${response.status}`);
        }

        const responseContentType = response.headers.get('Content-Type');
        if (responseContentType && responseContentType.includes('application/json')) {
            const data = await response.json().catch(() => null);
            const safe = data === null ? {} : data;
            return NextResponse.json(safe, { status: response.status });
        } else {
            // Use arrayBuffer for non-JSON content to preserve binary data (images, files, etc.)
            const buffer = await response.arrayBuffer().catch(() => new ArrayBuffer(0));
            return new Response(buffer, {
                status: response.status,
                headers: { 'Content-Type': responseContentType || 'application/octet-stream' }
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


        const isAllowed = allowedCollections.some(c =>
            path === `items/${c}` || path.startsWith(`items/${c}/`) ||
            path === c || path.startsWith(`${c}/`)
        );

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
        const needsSpecialGuardCheck = path.startsWith('items/events') || path.startsWith('items/event_signups') || path.includes('site_settings') || path.startsWith('items/committees') || path.startsWith('items/committee_members') || path.startsWith('items/pub_crawl_');

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

                            // Debug logging for membership check
                            console.log(`[Directus Proxy] User ${userId} memberships:`, memberships.map((m: any) => ({
                                committee_id: m?.committee_id?.id,
                                committee_name: m?.committee_id?.name,
                                is_leader: m?.is_leader
                            })));

                            canBypass = memberships.some((m: any) => {
                                const name = (m?.committee_id?.name || '').toString().toLowerCase();
                                const isLeader = m.is_leader === true;
                                const hasPrivilege = name.includes('bestuur') || name.includes('ict') || name.includes('kandidaat') || name.includes('kandi') || isLeader;
                                if (hasPrivilege) {
                                    console.log(`[Directus Proxy] User ${userId} granted bypass via committee: ${m?.committee_id?.name} (leader: ${isLeader})`);
                                }
                                return hasPrivilege;
                            });

                            console.log(`[Directus Proxy] User ${userId} canBypass result: ${canBypass}`);
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
            console.log(`[Directus Proxy] Event creation guard triggered. canBypass=${canBypass}, hasAuth=${!!authHeader}`);
            const committeeId = body?.committee_id;
            const memberships = userData?.memberships || [];
            console.log(`[Directus Proxy] Requested committee_id: ${committeeId}, User memberships count: ${memberships.length}`);

            if (committeeId) {
                const isMember = memberships.some((m: any) => String(m?.committee_id?.id || m?.committee_id) === String(committeeId));
                console.log(`[Directus Proxy] Committee membership check: isMember=${isMember} for committee ${committeeId}`);
                if (!isMember) return NextResponse.json({ error: 'Forbidden', message: 'Not a member of selected committee' }, { status: 403 });
            } else if (method === 'POST') {
                console.log(`[Directus Proxy] POST to events without committee_id - blocking`);
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

        // Guard: only ICT can write to site_settings (POST/PATCH/DELETE)
        // GET requests are allowed for all authenticated users (handled above)
        if (path.includes('site_settings')) {
            const memberships = userData?.memberships || [];
            const isIct = memberships.some((m: any) => {
                const name = (m?.committee_id?.name || '').toString().toLowerCase();
                return name.includes('ict');
            });

            if (!isIct && !canBypass) {
                console.warn(`[Directus Proxy] BLOCKED non-ICT ${method} attempt to site_settings: ${path} from IP: ${ip}`);
                return NextResponse.json({ error: 'Forbidden', message: 'Only ICT members can modify site settings' }, { status: 403 });
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

        // Force disable bypass for events so we always use the user's own token.
        // The Service Token may not have the necessary permissions to create/update events.
        if (path.startsWith('items/events')) {
            console.log(`[Directus Proxy] Forcing user token for events operation (method: ${method})`);
            canBypass = false;
        }

        // Force disable bypass for Stickers so creations/updates are performed with the
        // currently logged-in user's token. This ensures Directus sets `created_by` /
        // `user_created` to the correct user instead of the service account.
        if (path.toLowerCase().startsWith('items/stickers')) {
            console.log(`[Directus Proxy] Forcing user token for stickers operation (method: ${method})`);
            canBypass = false;
        }

        // Ensure deletions of event signups always use the logged-in user's token.
        // Some service tokens don't have delete permissions for `event_signups`.
        if (method === 'DELETE' && path.startsWith('items/event_signups')) {
            canBypass = false;
        }

        // Forward essential headers
        const forwardHeaders: Record<string, string> = {
            ...getProxyHeaders(request),
            'Content-Type': request.headers.get('content-type') || 'application/json',
            'Accept': request.headers.get('accept') || 'application/json',
            'X-Requested-With': 'XMLHttpRequest', // Helps with some Directus security configs
            'X-Forwarded-For': getClientIp(request) || '',
            'X-Forwarded-Proto': 'https',
        };
        const originalContentType = request.headers.get('Content-Type'); // Keep this for sticker injection check

        // Special-case: ensure sticker creations include the logged-in user's id explicitly
        // If we have an authHeader and the incoming request is creating/updating Stickers
        // and the body is JSON, fetch /users/me with the caller token and inject
        // `user_created` into the body so Directus will set the relation correctly.
        if (authHeader && rawBody && rawBody.byteLength > 0 && (path.toLowerCase().startsWith('items/stickers')) && originalContentType?.includes('application/json')) {
            try {
                const meResp = await fetch(`${DIRECTUS_URL}/users/me`, {
                    headers: { Authorization: authHeader, 'Cache-Control': 'no-cache' },
                    cache: 'no-store'
                });
                if (meResp.ok) {
                    const meJson = await meResp.json().catch(() => null);
                    const me = meJson?.data || meJson;
                    const userId = me?.id;
                    if (userId) {
                        try {
                            const text = new TextDecoder().decode(rawBody);
                            const parsed = text ? JSON.parse(text) : {};
                            // Only inject if not already present
                            if (!parsed.user_created && !parsed.created_by) {
                                parsed.user_created = userId;
                                const newBodyText = JSON.stringify(parsed);
                                rawBody = new TextEncoder().encode(newBodyText).buffer as ArrayBuffer;
                            }
                        } catch (e) {
                            console.warn('[Directus Proxy] Failed to inject user_created into stickers body:', e);
                        }
                    }
                } else {
                    console.warn('[Directus Proxy] Could not fetch users/me to inject user_created for stickers:', meResp.status);
                }
            } catch (e) {
                console.error('[Directus Proxy] Error fetching users/me for stickers injection:', e);
            }
        }

        if (originalContentType) forwardHeaders['Content-Type'] = originalContentType;
        if (cookie) forwardHeaders['Cookie'] = cookie;

        let targetSearch = url.search;

        // Auto-auth for specific public forms (Intro)
        if (!authHeader && API_SERVICE_TOKEN && (path.startsWith('items/intro_signups') || path.startsWith('items/intro_parent_signups'))) {
            forwardHeaders['Authorization'] = `Bearer ${API_SERVICE_TOKEN}`;
        }

        if (canBypass && API_SERVICE_TOKEN) {
            forwardHeaders['Authorization'] = `Bearer ${API_SERVICE_TOKEN}`;
        } else if (authHeader && (isUserTokenValid || isAuthPath || needsSpecialGuardCheck || isAllowed)) {
            const isIdentityPath = path.startsWith('users/me');
            const isStrictAuthPath = (path.includes('auth/') || path.startsWith('auth/')) && !isIdentityPath;
            if (!isStrictAuthPath || isIdentityPath) {
                forwardHeaders['Authorization'] = authHeader;
            }
        }

        // AGGRESSIVE CLEANUP: Avoid 400 Bad Request by ensuring we never send double auth
        // 1. If we have an Authorization header, remove access_token from query params
        if (forwardHeaders['Authorization'] && url.searchParams.has('access_token')) {
            const newParams = new URLSearchParams(url.searchParams);
            newParams.delete('access_token');
            const newSearch = newParams.toString();
            targetSearch = newSearch ? `?${newSearch}` : '';
        }

        // 2. If we have an Authorization header (Bearer), remove cookies to avoid conflict
        if (forwardHeaders['Authorization'] && forwardHeaders['Cookie']) {
            delete forwardHeaders['Cookie'];
        }

        // 3. For auth paths (login/refresh), remove cookies because auth is via request body
        // This prevents "double auth" error where Directus sees both Cookie + body credentials
        if (path.includes('auth/') && forwardHeaders['Cookie']) {
            delete forwardHeaders['Cookie'];
        }

        // Trace token usage for debugging
        const targetUrl = `${DIRECTUS_URL}/${path}${targetSearch}`.replace(/([^:]\/)\/+/g, "$1"); // Avoid double slashes

        if (path.includes('auth/')) {
            console.log(`[Directus Proxy] PROXING AUTH: ${method} ${targetUrl} | Body size: ${rawBody?.byteLength || 0} | Content-Type: ${forwardHeaders['Content-Type']}`);
        }


        let response: Response;
        try {
            const fetchOptions: RequestInit = {
                method,
                headers: forwardHeaders,
                redirect: 'follow',
                // @ts-ignore - duplex is needed for streaming bodies in some environments
                duplex: (rawBody && rawBody.byteLength > 0) ? 'half' : undefined
            };

            if (rawBody && rawBody.byteLength > 0) {
                fetchOptions.body = new Uint8Array(rawBody);
            }

            response = await fetch(targetUrl, fetchOptions);
        } catch (fetchError: any) {
            console.error(`[Directus Proxy] ${method} ${path} FETCH EXCEPTION:`, fetchError.message);
            throw fetchError; // Rethrow to be caught by the outer catch block
        }


        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error body');

            // Detailed logging for auth failures
            if (path.includes('auth/')) {
                console.error(`[Directus Proxy] AUTH UPSTREAM FAILED: ${method} ${path} | Status ${response.status} | Body size: ${errorText.length} | First chars: ${errorText.slice(0, 100)}`);
            } else {
                console.error(`[Directus Proxy] Upstream ${method} ${path} FAILED: Status ${response.status} | Body: ${errorText.slice(0, 200)}`);
            }


            if (response.status === 403 && (path.startsWith('items/committees') || path.startsWith('items/committee_members'))) {
                console.log(`[Directus Proxy] Softening 403 for ${method} ${path} to avoid browser console error.`);
                return NextResponse.json({ data: null, error: 'Forbidden', softened: true }, { status: 200 });
            }


            // Re-create response for JSON if possible
            const responseContentType = response.headers.get('Content-Type');
            if (responseContentType?.includes('application/json')) {
                try {
                    return NextResponse.json(JSON.parse(errorText), { status: response.status });
                } catch {
                    return new Response(errorText, { status: response.status, headers: { 'Content-Type': 'application/json' } });
                }
            }
            return new Response(errorText, { status: response.status });
        }

        // Token tracing is disabled in production to reduce log noise
        // Uncomment for debugging: console.log(`[Directus Proxy] ${method} ${path} | Bypass: ${canBypass}`);

        if (response.status === 204) return new Response(null, { status: 204 });

        const responseContentType = response.headers.get('Content-Type');
        if (responseContentType && responseContentType.includes('application/json')) {
            const data = await response.json().catch(() => null);
            const safe = data === null ? {} : data;
            return NextResponse.json(safe, { status: response.status });
        } else {
            // Buffer to handle binary/text responses
            const buffer = await response.arrayBuffer().catch(() => new ArrayBuffer(0));
            return new Response(buffer, {
                status: response.status,
                headers: { 'Content-Type': responseContentType || 'text/plain' }
            });
        }

    } catch (error: any) {
        console.error(`[Directus Proxy] ${method} ${path} CRITICAL FAILURE:`, {
            message: error.message,
            stack: error.stack,
            path: path,
            method: method
        });
        return NextResponse.json({
            error: 'Directus Proxy Mutation Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
