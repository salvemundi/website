import { generateKeyPair } from 'jose';
import { describe, expect, it } from 'vitest';
import { HOST, TENANT, makeApp, page, rpc, sourceOf, token } from './helpers.js';

const app = await makeApp(sourceOf([page()]));

describe('authenticatie en autorisatie', () => {
    it('weigert verzoeken zonder token (401 + resource_metadata)', async () => {
        const res = await rpc(app, 'tools/list', {}, { tok: null });
        expect(res.statusCode).toBe(401);
        expect(res.headers['www-authenticate']).toContain(`resource_metadata="https://${HOST}/.well-known/oauth-protected-resource"`);
    });
    it('weigert rommel, verkeerde audience, verkeerde issuer, verlopen en vreemd ondertekende tokens', async () => {
        const other = await generateKeyPair('RS256');
        for (const tok of [
            'not-a-jwt',
            await token({}, { aud: 'api://39a7165e-8a84-473b-9986-4ab84099dee6' }),
            await token({}, { iss: `https://login.microsoftonline.com/${TENANT.replace('1', '3')}/v2.0` }),
            await token({}, { exp: '-1m' }),
            await token({}, { key: other.privateKey }),
        ]) {
            expect((await rpc(app, 'tools/list', {}, { tok })).statusCode).toBe(401);
        }
    });
    it('weigert onvoldoende rechten (scope ontbreekt) met 403', async () => {
        const res = await rpc(app, 'tools/list', {}, { tok: await token({ scp: 'User.Read' }) });
        expect(res.statusCode).toBe(403);
        expect(res.headers['www-authenticate']).toContain('insufficient_scope');
    });
    it('accepteert alleen gedelegeerde tokens (scp); een app-only rol zonder gebruiker wordt geweigerd', async () => {
        expect((await rpc(app, 'tools/list', {}, { tok: await token({ scp: undefined, roles: ['bijbel.read'] }) })).statusCode).toBe(403);
        expect((await rpc(app, 'tools/list', {})).statusCode).toBe(200);
    });
    it('valideert Host en Origin', async () => {
        expect((await rpc(app, 'tools/list', {}, { headers: { host: 'evil.example' } })).statusCode).toBe(403);
        expect((await rpc(app, 'tools/list', {}, { headers: { origin: 'https://evil.example' } })).statusCode).toBe(403);
        expect((await rpc(app, 'tools/list', {}, { headers: { origin: 'https://claude.ai' } })).statusCode).toBe(200);
    });
    it('biedt geen andere routes/methoden: GET/DELETE /mcp 405, rest 404', async () => {
        expect((await app.inject({ method: 'GET', url: '/mcp', headers: { host: HOST } })).statusCode).toBe(405);
        expect((await app.inject({ method: 'DELETE', url: '/mcp', headers: { host: HOST } })).statusCode).toBe(405);
        for (const m of ['PUT', 'PATCH', 'DELETE', 'POST'] as const) {
            expect((await app.inject({ method: m, url: '/admin', headers: { host: HOST } })).statusCode).toBe(404);
        }
    });
    it('/health is open maar bevat geen details; metadata wijst naar Entra', async () => {
        const h = await app.inject({ method: 'GET', url: '/health' });
        expect(h.json()).toEqual({ status: 'ok' });
        const m = await app.inject({ method: 'GET', url: '/.well-known/oauth-protected-resource' });
        expect(m.json<{ authorization_servers: string[] }>().authorization_servers).toEqual([`https://login.microsoftonline.com/${TENANT}/v2.0`]);
    });
});
