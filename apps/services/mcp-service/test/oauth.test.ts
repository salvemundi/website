import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLIENT_ID, HOST, TENANT, baseEnv, makeApp, page, sourceOf } from './helpers.js';

const CLAUDE_CB = 'https://claude.ai/api/mcp/auth_callback';
const verifier = 'v'.repeat(50);
const challenge = createHash('sha256').update(verifier).digest('base64url');
const headers = { host: HOST };

const entraFetch = vi.fn<typeof fetch>();
const app = await makeApp(sourceOf([page()]), {}, entraFetch);

const entraOk = (extra: Record<string, unknown> = {}) =>
    Promise.resolve(new Response(JSON.stringify({ access_token: 'entra-at', refresh_token: 'entra-rt', expires_in: 3599, ...extra }), { status: 200 }));

async function register(redirect_uris: string[] = [CLAUDE_CB]) {
    return app.inject({ method: 'POST', url: '/register', headers, payload: { redirect_uris } });
}
const query = (o: Record<string, string>) => '?' + new URLSearchParams(o).toString();
const loc = (res: { headers: Record<string, unknown> }) => new URL(String(res.headers.location));

const authorizeUrl = (client_id: string, over: Record<string, string> = {}) =>
    '/authorize' + query({ client_id, redirect_uri: CLAUDE_CB, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', state: 'client-state', scope: 'x', resource: `https://${HOST}/mcp`, ...over });
/** Cookie van de laatst getoonde toestemmingspagina (zoals de browser hem bewaart). */
let cookie = '';
const consentPage = (client_id: string, over: Record<string, string> = {}) => app.inject({ method: 'GET', url: authorizeUrl(client_id, over), headers });
const stateOf = (html: string) => /name="state" value="([^"]+)"/.exec(html)![1]!;
const approve = (state: string, keuze = 'ja', h: Record<string, string> = {}) =>
    app.inject({ method: 'POST', url: '/authorize', headers: { ...headers, cookie, origin: `https://${HOST}`, 'content-type': 'application/x-www-form-urlencoded', ...h }, payload: new URLSearchParams({ state, keuze }).toString() });
/** Zoals een gebruiker: toestemmingspagina tonen en op Doorgaan klikken. Fouten vóór de pagina komen direct terug. */
async function authorize(client_id: string, over: Record<string, string> = {}) {
    const page = await consentPage(client_id, over);
    if (page.statusCode !== 200) return page;
    cookie = String(page.headers['set-cookie']).split(';')[0]!;
    return approve(stateOf(page.body));
}
const callback = (q: Record<string, string>, c = cookie) => app.inject({ method: 'GET', url: '/oauth/callback' + query(q), headers: { ...headers, cookie: c } });
async function login() {
    const client_id = (await register()).json<{ client_id: string }>().client_id;
    const entraState = loc(await authorize(client_id)).searchParams.get('state')!;
    const back = await callback({ code: 'entra-code', state: entraState });
    const code = loc(back).searchParams.get('code')!;
    return { client_id, code, back };
}
async function refreshTokenFor(client_id: string): Promise<string> {
    const page = await consentPage(client_id);
    cookie = String(page.headers['set-cookie']).split(';')[0]!;
    const st = stateOf(page.body);
    const code = loc(await callback({ code: 'entra-code', state: st })).searchParams.get('code')!;
    entraFetch.mockImplementationOnce(() => entraOk());
    return (await token({ grant_type: 'authorization_code', code, redirect_uri: CLAUDE_CB, client_id, code_verifier: verifier })).json<{ refresh_token: string }>().refresh_token;
}
const token = (payload: Record<string, string>, h: Record<string, string> = headers) =>
    app.inject({ method: 'POST', url: '/token', headers: { ...h, 'content-type': 'application/x-www-form-urlencoded' }, payload: new URLSearchParams(payload).toString() });

afterEach(() => {
    entraFetch.mockReset();
    vi.useRealTimers();
});

describe('OAuth-voorportaal', () => {
    it('publiceert autorisatieserver-metadata met DCR en alleen PKCE S256', async () => {
        const m = (await app.inject({ method: 'GET', url: '/.well-known/oauth-authorization-server' })).json<Record<string, unknown>>();
        expect(m).toMatchObject({
            issuer: `https://${HOST}`,
            authorization_endpoint: `https://${HOST}/authorize`,
            token_endpoint: `https://${HOST}/token`,
            registration_endpoint: `https://${HOST}/register`,
            code_challenge_methods_supported: ['S256'],
            token_endpoint_auth_methods_supported: ['none'],
        });
    });

    it('registreert alleen toegestane redirect-URI’s (Claude en loopback), geen secret in het antwoord', async () => {
        const ok = await register([CLAUDE_CB, 'http://localhost:6274/callback']);
        expect(ok.statusCode).toBe(201);
        expect(JSON.stringify(ok.json())).not.toContain(baseEnv.MCP_ENTRA_CLIENT_SECRET);
        for (const bad of ['https://evil.example/cb', 'http://evil.example/cb', 'javascript:alert(1)', 'https://claude.ai/api/mcp/auth_callback#x', 'http://localhost.evil.example/cb']) {
            expect((await register([CLAUDE_CB, bad])).statusCode).toBe(400);
        }
        expect((await register(['https://chatgpt.com/connector_platform_oauth_redirect'])).statusCode).toBe(201);
        expect((await register(['https://chatgpt.com/connector/oauth/abc_123-X'])).statusCode).toBe(201);
        for (const bad of ['https://chatgpt.com/connector/oauth/abc/../x', 'https://chatgpt.com/connector/oauth/abc?x=1', 'https://chatgpt.com.evil.example/connector/oauth/abc']) {
            expect((await register([bad])).statusCode).toBe(400);
        }
        expect((await app.inject({ method: 'POST', url: '/register', headers, payload: {} })).statusCode).toBe(400);
        expect((await app.inject({ method: 'GET', url: '/.well-known/openid-configuration' })).statusCode).toBe(200);
    });

    it('stuurt /authorize door naar Entra met het echte client-ID, eigen callback, vaste scope en zonder resource', async () => {
        const { client_id } = (await register()).json<{ client_id: string }>();
        const res = await authorize(client_id);
        expect(res.statusCode).toBe(303);
        const u = loc(res);
        expect(u.origin + u.pathname).toBe(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`);
        expect(u.searchParams.get('client_id')).toBe(CLIENT_ID);
        expect(u.searchParams.get('redirect_uri')).toBe(`https://${HOST}/oauth/callback`);
        expect(u.searchParams.get('scope')).toBe(`api://${CLIENT_ID}/bijbel.read offline_access`);
        expect(u.searchParams.has('resource')).toBe(false);
        expect(u.searchParams.get('state')).toBeTruthy();
        expect(u.searchParams.get('state')).not.toContain('client-state');
    });

    it('stuurt bij onbekende client of niet-geregistreerde redirect nooit door (400)', async () => {
        const { client_id } = (await register()).json<{ client_id: string }>();
        expect((await authorize('garbage')).statusCode).toBe(400);
        expect((await authorize(client_id, { redirect_uri: 'https://evil.example/cb' })).statusCode).toBe(400);
        expect((await app.inject({ method: 'GET', url: '/authorize', headers })).statusCode).toBe(400);
    });

    it('eist PKCE S256: ontbrekende/zwakke challenge geeft een foutredirect naar de geregistreerde redirect', async () => {
        const { client_id } = (await register()).json<{ client_id: string }>();
        for (const over of [{ code_challenge: '' }, { code_challenge_method: 'plain' }, { response_type: 'token' }]) {
            const res = await authorize(client_id, over);
            expect(res.statusCode).toBe(302);
            expect(loc(res).origin + loc(res).pathname).toBe(CLAUDE_CB);
            expect(loc(res).searchParams.get('error')).toBe('invalid_request');
        }
    });

    it('doorloopt de volledige flow: callback -> eigen code -> token met Entra secret server-side', async () => {
        const { client_id, code, back } = await login();
        expect(back.statusCode).toBe(302);
        expect(loc(back).searchParams.get('state')).toBe('client-state');
        expect(code).not.toContain('entra-code');

        entraFetch.mockImplementationOnce(() => entraOk());
        const res = await token({ grant_type: 'authorization_code', code, redirect_uri: CLAUDE_CB, client_id, code_verifier: verifier });
        expect(res.statusCode).toBe(200);
        expect(res.headers['cache-control']).toBe('no-store');
        expect(res.json()).toMatchObject({ access_token: 'entra-at', token_type: 'Bearer', expires_in: 3599 });
        expect(res.json<{ refresh_token: string }>().refresh_token).toMatch(/^[A-Za-z0-9_-]{40,}$/);

        const [url, init] = entraFetch.mock.calls[0]!;
        expect(String(url)).toBe(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`);
        const sent = new URLSearchParams(String((init as RequestInit).body));
        expect(sent.get('client_secret')).toBe(baseEnv.MCP_ENTRA_CLIENT_SECRET);
        expect(sent.get('code')).toBe('entra-code');
        expect(sent.get('redirect_uri')).toBe(`https://${HOST}/oauth/callback`);
        expect((init as RequestInit).redirect).toBe('error');
        expect(res.body).not.toContain(baseEnv.MCP_ENTRA_CLIENT_SECRET);
    });

    it('weigert verkeerde verifier, redirect_uri, client of geknoeide code zonder Entra aan te roepen', async () => {
        const { client_id, code } = await login();
        const other = (await register(['http://localhost:1/cb'])).json<{ client_id: string }>().client_id;
        const good = { grant_type: 'authorization_code', code, redirect_uri: CLAUDE_CB, client_id, code_verifier: verifier };
        for (const bad of [
            { ...good, code_verifier: 'w'.repeat(50) },
            { ...good, redirect_uri: 'http://localhost:1/cb' },
            { ...good, client_id: other },
            { ...good, code: code.slice(0, -2) + 'AA' },
            { ...good, code: 'garbage' },
        ]) {
            const res = await token(bad);
            expect(res.statusCode).toBe(400);
            expect(res.json<{ error: string }>().error).toMatch(/invalid_grant|invalid_client|invalid_request/);
        }
        expect((await token({ ...good, client_id: 'garbage' })).statusCode).toBe(401);
        expect(entraFetch).not.toHaveBeenCalled();
    });

    it('verloopt: een state/code ouder dan de TTL wordt geweigerd', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        const client_id = (await register()).json<{ client_id: string }>().client_id;
        const st = loc(await authorize(client_id)).searchParams.get('state')!;
        vi.setSystemTime(Date.now() + 11 * 60 * 1000);
        expect((await callback({ code: 'c', state: st })).statusCode).toBe(400);

        vi.setSystemTime(Date.now());
        const fresh = loc(await authorize(client_id)).searchParams.get('state')!;
        const code = loc(await callback({ code: 'c', state: fresh })).searchParams.get('code')!;
        vi.setSystemTime(Date.now() + 3 * 60 * 1000);
        expect((await token({ grant_type: 'authorization_code', code, redirect_uri: CLAUDE_CB, client_id, code_verifier: verifier })).statusCode).toBe(400);
        expect(entraFetch).not.toHaveBeenCalled();
    });

    it('geeft Entra-fouten door als generieke invalid_grant zonder details te lekken', async () => {
        const { client_id, code } = await login();
        entraFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'AADSTS70008 geheim-detail' }), { status: 400 }));
        const res = await token({ grant_type: 'authorization_code', code, redirect_uri: CLAUDE_CB, client_id, code_verifier: verifier });
        expect(res.statusCode).toBe(400);
        expect(res.json()).toEqual({ error: 'invalid_grant' });
        const rt = await refreshTokenFor(client_id);
        entraFetch.mockRejectedValueOnce(new Error('network'));
        expect((await token({ grant_type: 'refresh_token', refresh_token: rt, client_id })).statusCode).toBe(503);
        // Storing/throttling bij Entra: 503 (opnieuw proberen), niet invalid_grant (dan gooit de client het token weg).
        for (const status of [500, 503, 429]) {
            entraFetch.mockResolvedValueOnce(new Response('{}', { status }));
            const res = await token({ grant_type: 'refresh_token', refresh_token: rt, client_id });
            expect(res.statusCode).toBe(503);
            expect(res.json()).toEqual({ error: 'temporarily_unavailable' });
        }
    });

    it('ondersteunt refresh_token via Entra met het server-side secret; het token is gebonden aan de client', async () => {
        const { client_id } = await login();
        const rt = await refreshTokenFor(client_id);
        expect(rt).not.toContain('entra-rt');
        entraFetch.mockImplementationOnce(() => entraOk({ refresh_token: 'entra-rt-2' }));
        const res = await token({ grant_type: 'refresh_token', refresh_token: rt, client_id });
        expect(res.statusCode).toBe(200);
        const next = res.json<{ refresh_token: string }>().refresh_token;
        expect(next).not.toContain('entra-rt-2');
        const sent = new URLSearchParams(String((entraFetch.mock.calls.at(-1)![1] as RequestInit).body));
        expect(sent.get('grant_type')).toBe('refresh_token');
        expect(sent.get('refresh_token')).toBe('entra-rt');
        expect(sent.get('client_secret')).toBe(baseEnv.MCP_ENTRA_CLIENT_SECRET);
        entraFetch.mockReset();
        // Kaal Entra-token, token van een andere client, of onbekende client: geweigerd zonder Entra aan te roepen.
        const other = (await register()).json<{ client_id: string }>().client_id;
        expect((await token({ grant_type: 'refresh_token', refresh_token: 'entra-rt', client_id })).statusCode).toBe(400);
        expect((await token({ grant_type: 'refresh_token', refresh_token: next, client_id: other })).json()).toEqual({ error: 'invalid_grant' });
        expect((await token({ grant_type: 'refresh_token', refresh_token: next, client_id: 'garbage' })).statusCode).toBe(401);
        expect(entraFetch).not.toHaveBeenCalled();
    });

    it('toont een toestemmingspagina met de client, zonder framing, en bindt de flow aan deze browser', async () => {
        const { client_id } = (await register()).json<{ client_id: string }>();
        const page = await consentPage(client_id);
        expect(page.statusCode).toBe(200);
        expect(page.headers['content-type']).toContain('text/html');
        expect(page.body).toContain('Claude');
        expect(page.body).toContain('claude.ai');
        expect(page.body).toContain('zelf');
        expect(page.headers['x-frame-options']).toBe('DENY');
        expect(String(page.headers['content-security-policy'])).toContain("frame-ancestors 'none'");
        const setCookie = String(page.headers['set-cookie']);
        expect(setCookie).toMatch(/^__Host-samu_mcp_[A-Za-z0-9_-]{12}=[A-Za-z0-9_-]+; Path=\/;/);
        expect(setCookie).not.toContain('Domain');
        expect(page.headers['referrer-policy']).toBe('same-origin');
        expect(String(page.headers['content-security-policy'])).not.toContain('form-action');
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toContain('Secure');
        expect(setCookie).toContain('SameSite=Lax');
        expect(page.body).not.toContain('client-state');
        cookie = setCookie.split(';')[0]!;
        const state = stateOf(page.body);
        // Zonder (of met andere) cookie: geweigerd. Dit blokkeert een doorgestuurde link die de toestemming overslaat.
        expect((await approve(state, 'ja', { cookie: '' })).statusCode).toBe(400);
        expect((await approve(state, 'ja', { cookie: cookie.replace(/=.*/, '=ander') })).statusCode).toBe(400);
        expect((await approve(state, 'ja', { origin: 'https://evil.example' })).statusCode).toBe(403);
        // Browsers sturen bij sommige privacy-instellingen `Origin: null`: toegestaan, de nonce-cookie beschermt.
        expect((await approve(state, 'ja', { origin: 'null' })).statusCode).toBe(303);
        expect((await callback({ code: 'c', state }, '')).statusCode).toBe(400);
        // Annuleren: foutredirect naar de client met zijn state.
        const deny = await approve(state, 'nee');
        expect(loc(deny).origin + loc(deny).pathname).toBe(CLAUDE_CB);
        expect(loc(deny).searchParams.get('error')).toBe('access_denied');
        expect(loc(deny).searchParams.get('state')).toBe('client-state');
    });

    it('twee koppelingen tegelijk in één browser breken elkaar niet (cookie per flow)', async () => {
        const { client_id } = (await register()).json<{ client_id: string }>();
        const p1 = await consentPage(client_id);
        const p2 = await consentPage(client_id);
        const c1 = String(p1.headers['set-cookie']).split(';')[0]!;
        const c2 = String(p2.headers['set-cookie']).split(';')[0]!;
        expect(c1.split('=')[0]).not.toBe(c2.split('=')[0]);
        const jar = `${c1}; ${c2}`;
        expect((await approve(stateOf(p1.body), 'ja', { cookie: jar })).statusCode).toBe(303);
        expect((await approve(stateOf(p2.body), 'ja', { cookie: jar })).statusCode).toBe(303);
        expect((await approve(stateOf(p1.body), 'ja', { cookie: c2 })).statusCode).toBe(400);
    });

    it('weigert een resource-parameter die niet deze MCP-server is (RFC 8707)', async () => {
        const { client_id } = (await register()).json<{ client_id: string }>();
        const bad = await consentPage(client_id, { resource: 'https://andere-dienst.example/mcp' });
        expect(loc(bad).searchParams.get('error')).toBe('invalid_target');
        expect((await consentPage(client_id, { resource: `https://${HOST}/mcp/` })).statusCode).toBe(200);
        expect((await consentPage(client_id, { resource: `https://${HOST}` })).statusCode).toBe(200);
        expect((await consentPage(client_id, { resource: `https://${HOST}:443/mcp` })).statusCode).toBe(200);
        for (const bad of [`https://${HOST}/andere`, `http://${HOST}/mcp`, `https://${HOST}.evil.example/mcp`, 'geen-url']) {
            expect(loc(await consentPage(client_id, { resource: bad })).searchParams.get('error')).toBe('invalid_target');
        }
    });

    it('stuurt een Entra-fout (bv. access_denied) als foutredirect met de client-state', async () => {
        const client_id = (await register()).json<{ client_id: string }>().client_id;
        const st = loc(await authorize(client_id)).searchParams.get('state')!;
        const res = await callback({ error: 'access_denied', state: st });
        expect(loc(res).searchParams.get('error')).toBe('access_denied');
        expect(loc(res).searchParams.get('state')).toBe('client-state');
        expect((await callback({ code: 'c', state: 'forged' })).statusCode).toBe(400);
    });

    it('valideert de Host op alle OAuth-routes', async () => {
        const evil = { host: 'evil.example' };
        expect((await app.inject({ method: 'POST', url: '/register', headers: evil, payload: { redirect_uris: [CLAUDE_CB] } })).statusCode).toBe(403);
        expect((await app.inject({ method: 'GET', url: '/authorize', headers: evil })).statusCode).toBe(403);
        expect((await app.inject({ method: 'GET', url: '/oauth/callback', headers: evil })).statusCode).toBe(403);
        expect((await token({ grant_type: 'refresh_token', refresh_token: 'x', client_id: 'y' }, evil)).statusCode).toBe(403);
    });
});
