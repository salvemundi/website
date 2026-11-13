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

async function authorize(client_id: string, over: Record<string, string> = {}) {
    return app.inject({
        method: 'GET',
        url: '/authorize' + query({ client_id, redirect_uri: CLAUDE_CB, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', state: 'client-state', scope: 'x', resource: `https://${HOST}/mcp`, ...over }),
        headers,
    });
}
async function login() {
    const client_id = (await register()).json<{ client_id: string }>().client_id;
    const entraState = loc(await authorize(client_id)).searchParams.get('state')!;
    const back = await app.inject({ method: 'GET', url: '/oauth/callback' + query({ code: 'entra-code', state: entraState }), headers });
    const code = loc(back).searchParams.get('code')!;
    return { client_id, code, back };
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
        expect((await app.inject({ method: 'POST', url: '/register', headers, payload: {} })).statusCode).toBe(400);
    });

    it('stuurt /authorize door naar Entra met het echte client-ID, eigen callback, vaste scope en zonder resource', async () => {
        const { client_id } = (await register()).json<{ client_id: string }>();
        const res = await authorize(client_id);
        expect(res.statusCode).toBe(302);
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
        expect(res.json()).toMatchObject({ access_token: 'entra-at', token_type: 'Bearer', refresh_token: 'entra-rt', expires_in: 3599 });

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
        expect((await token({ ...good, client_id: 'garbage' })).statusCode).toBe(400);
        expect(entraFetch).not.toHaveBeenCalled();
    });

    it('verloopt: een state/code ouder dan de TTL wordt geweigerd', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        const client_id = (await register()).json<{ client_id: string }>().client_id;
        const st = loc(await authorize(client_id)).searchParams.get('state')!;
        vi.setSystemTime(Date.now() + 11 * 60 * 1000);
        expect((await app.inject({ method: 'GET', url: '/oauth/callback' + query({ code: 'c', state: st }), headers })).statusCode).toBe(400);

        vi.setSystemTime(Date.now());
        const fresh = loc(await authorize(client_id)).searchParams.get('state')!;
        const code = loc(await app.inject({ method: 'GET', url: '/oauth/callback' + query({ code: 'c', state: fresh }), headers })).searchParams.get('code')!;
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
        entraFetch.mockRejectedValueOnce(new Error('network'));
        const down = await token({ grant_type: 'refresh_token', refresh_token: 'rt', client_id });
        expect(down.statusCode).toBe(503);
    });

    it('ondersteunt refresh_token via Entra met het server-side secret', async () => {
        const { client_id } = await login();
        entraFetch.mockImplementationOnce(() => entraOk({ refresh_token: 'entra-rt-2' }));
        const res = await token({ grant_type: 'refresh_token', refresh_token: 'entra-rt', client_id });
        expect(res.statusCode).toBe(200);
        expect(res.json<{ refresh_token: string }>().refresh_token).toBe('entra-rt-2');
        const sent = new URLSearchParams(String((entraFetch.mock.calls[0]![1] as RequestInit).body));
        expect(sent.get('grant_type')).toBe('refresh_token');
        expect(sent.get('client_secret')).toBe(baseEnv.MCP_ENTRA_CLIENT_SECRET);
        expect((await token({ grant_type: 'refresh_token', refresh_token: 'x', client_id: 'garbage' })).statusCode).toBe(400);
    });

    it('stuurt een Entra-fout (bv. access_denied) als foutredirect met de client-state', async () => {
        const client_id = (await register()).json<{ client_id: string }>().client_id;
        const st = loc(await authorize(client_id)).searchParams.get('state')!;
        const res = await app.inject({ method: 'GET', url: '/oauth/callback' + query({ error: 'access_denied', state: st }), headers });
        expect(loc(res).searchParams.get('error')).toBe('access_denied');
        expect(loc(res).searchParams.get('state')).toBe('client-state');
        expect((await app.inject({ method: 'GET', url: '/oauth/callback' + query({ code: 'c', state: 'forged' }), headers })).statusCode).toBe(400);
    });

    it('valideert de Host op alle OAuth-routes', async () => {
        const evil = { host: 'evil.example' };
        expect((await app.inject({ method: 'POST', url: '/register', headers: evil, payload: { redirect_uris: [CLAUDE_CB] } })).statusCode).toBe(403);
        expect((await app.inject({ method: 'GET', url: '/authorize', headers: evil })).statusCode).toBe(403);
        expect((await app.inject({ method: 'GET', url: '/oauth/callback', headers: evil })).statusCode).toBe(403);
        expect((await token({ grant_type: 'refresh_token', refresh_token: 'x', client_id: 'y' }, evil)).statusCode).toBe(403);
    });
});
