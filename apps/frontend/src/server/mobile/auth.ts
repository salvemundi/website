import 'server-only';
import { auth } from '@/server/auth/auth';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { pool } from '@/lib/database/db';
import { getRedis } from '@/server/auth/redis-client';
import { MobileError, mobileResponse, readMobileJSON } from './http';
import { MOBILE_CALLBACK, hashMobileToken, newOpaqueCode, validChallenge, verifyPKCE, validBrowserFlowCookie } from './security';
import { createMobileSession, requireMobileUser } from './session';
import { rateLimit } from '@/server/utils/ratelimit';
import { getSessionColumns } from './session-columns';

interface LoginFlow { challenge: string; state: string; redirectURI: string; browserNonceHash: string }
interface LoginGrant extends LoginFlow { userId: string }
function publicOrigin(): string {
    const origin = new URL(process.env.BETTER_AUTH_URL || 'https://acc.salvemundi.nl').origin;
    const url = new URL(origin);
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (origin !== 'https://acc.salvemundi.nl' && !local) {
        throw new MobileError('configuration_error', 'Ongeldige acceptatieconfiguratie.', 503);
    }
    return origin;
}
async function limitLogin() {
    if (!(await rateLimit('mobile-auth', 20, 300)).success) throw new MobileError('rate_limited', 'Probeer het over enkele minuten opnieuw.', 429);
}
export async function startMobileLogin(request: Request) {
    await limitLogin();
    const url = new URL(request.url);
    const challenge = url.searchParams.get('code_challenge') || '';
    const state = url.searchParams.get('state') || '';
    const redirectURI = url.searchParams.get('redirect_uri') || '';
    if (!validChallenge(challenge) || !/^[A-Za-z0-9_-]{32,128}$/.test(state) || redirectURI !== MOBILE_CALLBACK) {
        throw new MobileError('invalid_request', 'Ongeldig inlogverzoek.');
    }
    const flowId = newOpaqueCode();
    const browserNonce = newOpaqueCode();
    const redis = await getRedis();
    await redis.set(`mobile:login:${flowId}`, JSON.stringify({ challenge, state, redirectURI, browserNonceHash: hashMobileToken(browserNonce) }), 'EX', 300);
    const browserHeaders = new Headers();
    // Microsoft login must not inherit app Authorization or website impersonation state.
    const cookies = request.headers.get('cookie');
    if (cookies) browserHeaders.set('cookie', cookies.split(';').filter(c => !c.trim().startsWith('directus_impersonation_token=')).join(';'));
    const login = await auth.api.signInSocial({
        body: { provider: 'microsoft', callbackURL: `${publicOrigin()}/api/mobile/v1/auth/complete?flow=${flowId}` },
        headers: browserHeaders, asResponse: true
    });
    if (!login.ok) throw new MobileError('login_failed', 'Microsoft aanmelden is niet beschikbaar.', 503);
    const body = await login.json() as { url?: string };
    if (!body.url || new URL(body.url).hostname !== 'login.microsoftonline.com') throw new MobileError('login_failed', 'Microsoft aanmelden is niet beschikbaar.', 503);
    const response = new Response(null, { status: 302, headers: { Location: body.url, 'Cache-Control': 'no-store' } });
    for (const cookie of login.headers.getSetCookie()) response.headers.append('Set-Cookie', cookie);
    response.headers.append('Set-Cookie', `sm_mobile_flow=${flowId}.${browserNonce}; HttpOnly; SameSite=Lax; Path=/api/mobile/v1/auth; Max-Age=300${publicOrigin().startsWith('https:') ? '; Secure' : ''}`);
    return response;
}
export async function completeMobileLogin(request: Request) {
    const flowId = new URL(request.url).searchParams.get('flow') || '';
    if (!validChallenge(flowId)) throw new MobileError('invalid_request', 'Ongeldige aanmeldsessie.');
    const redis = await getRedis();
    const raw = await redis.get(`mobile:login:${flowId}`);
    if (!raw) throw new MobileError('login_expired', 'Aanmeldsessie verlopen. Begin opnieuw.', 401);
    const flow = JSON.parse(raw) as LoginFlow;
    const browserHeaders = new Headers();
    const cookieHeader = request.headers.get('cookie') || '';
    const flowCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('sm_mobile_flow='))?.slice('sm_mobile_flow='.length) || '';
    if (!validBrowserFlowCookie(flowCookie, flowId, flow.browserNonceHash)) throw new MobileError('unauthorized', 'Aanmeldsessie hoort bij een andere browser.', 401);
    browserHeaders.set('cookie', cookieHeader.split(';').filter(c => !c.trim().startsWith('directus_impersonation_token=')).join(';'));
    const session = await getEnrichedSession(browserHeaders);
    if (!session || !session.user.id || !session.session.id) throw new MobileError('unauthorized', 'Aanmelden mislukt.', 401);
    // Re-check the real session in PostgreSQL; never trust a cached/impersonated user alone.
    const columns = await getSessionColumns();
    const verified = await pool.query<{ user_id: string }>(`
        SELECT s.${columns.userId} AS user_id FROM auth_sessions s JOIN directus_users u ON CAST(u.id AS TEXT)=CAST(s.${columns.userId} AS TEXT)
        WHERE s.id=$1 AND s.${columns.userId}=$2 AND s.${columns.expiresAt} > NOW() AND u.status='active' AND s.id NOT LIKE 'mobile:%'
    `, [session.session.id, session.user.id]);
    if (!verified.rows[0]) throw new MobileError('unauthorized', 'Aanmelden mislukt.', 401);
    if (await redis.getdel(`mobile:login:${flowId}`) !== raw) throw new MobileError('login_expired', 'Aanmeldsessie is al gebruikt.', 401);
    const code = newOpaqueCode();
    await redis.set(`mobile:grant:${hashMobileToken(code)}`, JSON.stringify({ ...flow, userId: verified.rows[0].user_id }), 'EX', 60);
    const redirect = new URL(MOBILE_CALLBACK);
    redirect.searchParams.set('code', code);
    redirect.searchParams.set('state', flow.state);
    return new Response(null, { status: 302, headers: { Location: redirect.toString(), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': `sm_mobile_flow=; HttpOnly; SameSite=Lax; Path=/api/mobile/v1/auth; Max-Age=0${publicOrigin().startsWith('https:') ? '; Secure' : ''}` } });
}
export async function exchangeMobileLogin(request: Request) {
    await limitLogin();
    const body = await readMobileJSON(request);
    if (typeof body.code !== 'string' || !validChallenge(body.code) || typeof body.code_verifier !== 'string' || body.redirect_uri !== MOBILE_CALLBACK) {
        throw new MobileError('invalid_request', 'Ongeldig inlogverzoek.');
    }
    const redis = await getRedis();
    const raw = await redis.getdel(`mobile:grant:${hashMobileToken(body.code)}`);
    if (!raw) throw new MobileError('login_expired', 'Aanmeldcode verlopen of gebruikt.', 401);
    const grant = JSON.parse(raw) as LoginGrant;
    if (grant.redirectURI !== body.redirect_uri || !verifyPKCE(body.code_verifier, grant.challenge)) throw new MobileError('unauthorized', 'Ongeldige aanmeldcode.', 401);
    return mobileResponse(await createMobileSession(grant.userId, request));
}
export async function logoutMobileSession(request: Request) {
    const user = await requireMobileUser(request);
    const columns = await getSessionColumns();
    await pool.query(`DELETE FROM auth_sessions WHERE id=$1 AND ${columns.userId}=$2`, [user.sessionId, user.id]);
    const { removeMobileDevicesForSession } = await import('./notifications');
    await removeMobileDevicesForSession(user.id, user.sessionId);
    return mobileResponse({ success: true });
}
