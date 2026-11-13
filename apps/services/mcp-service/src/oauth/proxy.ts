import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Config } from '../config.js';
import { createSealer } from './seal.js';

/**
 * OAuth-voorportaal voor Entra. Entra ondersteunt geen dynamic client registration, dus MCP-clients (Claude)
 * zouden zelf een client-ID/secret nodig hebben. Deze dienst geeft clients een eigen, stateless registratie
 * en wisselt codes uitsluitend server-side in met het echte Entra-secret. Entra-tokens worden ongewijzigd
 * doorgegeven, zodat de bestaande tokenvalidatie en On-Behalf-Of-flow gelijk blijven.
 *
 * Geen opslag: client_id, state en authorization code zijn versleutelde, geauthenticeerde blobs (zie seal.ts).
 * Autorisatie blijft bij Entra: gebruikerstoewijzing, consent en site-rechten zijn onveranderd.
 */

const STATE_TTL_MS = 10 * 60 * 1000;
const CODE_TTL_MS = 2 * 60 * 1000;
const PKCE = /^[A-Za-z0-9\-._~]{43,128}$/;

interface ClientBlob { ru: string[]; iat: number }
interface StateBlob { cid: string; ru: string; cc: string; st?: string; exp: number }
interface CodeBlob { ec: string; cid: string; ru: string; cc: string; exp: number }

const sha256url = (s: string) => createHash('sha256').update(s).digest('base64url');

const isLoopback = (u: URL) => u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);

export function registerOAuthRoutes(app: FastifyInstance, config: Config, fetchFn: typeof fetch = fetch): void {
    const base = new URL(config.MCP_PUBLIC_URL).origin;
    const publicHost = new URL(base).host;
    const callbackUrl = `${base}/oauth/callback`;
    const entra = `https://login.microsoftonline.com/${config.MCP_ENTRA_TENANT_ID}/oauth2/v2.0`;
    const scope = `api://${config.MCP_ENTRA_CLIENT_ID}/${config.MCP_REQUIRED_SCOPE}`;
    const sealer = createSealer(config.MCP_ENTRA_CLIENT_SECRET);

    const redirectAllowed = (raw: string): boolean => {
        if (raw.length > 512) return false;
        let u: URL;
        try { u = new URL(raw); } catch { return false; }
        if (u.hash) return false;
        return config.MCP_ALLOWED_REDIRECT_URIS.includes(raw) || isLoopback(u);
    };

    const noStore = (reply: FastifyReply) => reply.header('Cache-Control', 'no-store').header('Pragma', 'no-cache');
    const hostOk = (host: string | undefined) => host === publicHost;

    const redirectTo = (reply: FastifyReply, ru: string, params: Record<string, string | undefined>) => {
        const u = new URL(ru);
        for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, v);
        return noStore(reply).redirect(u.toString(), 302);
    };

    app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_req, body, done) => {
        done(null, Object.fromEntries(new URLSearchParams(body as string)));
    });

    app.get('/.well-known/oauth-authorization-server', () => ({
        issuer: base,
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        registration_endpoint: `${base}/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
        scopes_supported: [config.MCP_REQUIRED_SCOPE],
    }));

    // Dynamic client registration (RFC 7591): stateless; de toegestane redirect-URI's zitten in het client_id.
    const registerSchema = z.object({ redirect_uris: z.array(z.string()).min(1).max(5) });
    app.post('/register', async (req, reply) => {
        if (!hostOk(req.headers.host)) return reply.code(403).send({ error: 'forbidden_host' });
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success || !parsed.data.redirect_uris.every(redirectAllowed)) {
            return noStore(reply).code(400).send({ error: 'invalid_redirect_uri' });
        }
        const redirect_uris = parsed.data.redirect_uris;
        const client_id = sealer.seal('client', { ru: redirect_uris, iat: Date.now() } satisfies ClientBlob);
        return noStore(reply).code(201).send({
            client_id,
            redirect_uris,
            token_endpoint_auth_method: 'none',
            grant_types: ['authorization_code', 'refresh_token'],
            response_types: ['code'],
        });
    });

    const authorizeSchema = z.object({
        client_id: z.string().max(2048),
        redirect_uri: z.string().max(512),
        response_type: z.literal('code'),
        code_challenge: z.string().regex(PKCE),
        code_challenge_method: z.literal('S256'),
        state: z.string().max(512).optional(),
    });
    app.get('/authorize', async (req, reply) => {
        if (!hostOk(req.headers.host)) return reply.code(403).send({ error: 'forbidden_host' });
        const q = (req.query ?? {}) as Record<string, string | undefined>;
        // Eerst client en redirect_uri valideren: bij een fout nooit doorsturen naar een onbekend adres.
        const client = q.client_id ? sealer.open<ClientBlob>('client', q.client_id) : null;
        if (!client || !q.redirect_uri || !client.ru.includes(q.redirect_uri) || !redirectAllowed(q.redirect_uri)) {
            return noStore(reply).code(400).send({ error: 'invalid_request' });
        }
        const parsed = authorizeSchema.safeParse(q);
        if (!parsed.success) return redirectTo(reply, q.redirect_uri, { error: 'invalid_request', state: q.state?.slice(0, 512) });
        const p = parsed.data;
        const state = sealer.seal('state', { cid: p.client_id, ru: p.redirect_uri, cc: p.code_challenge, st: p.state, exp: Date.now() + STATE_TTL_MS } satisfies StateBlob);
        const url = new URL(`${entra}/authorize`);
        url.search = new URLSearchParams({
            client_id: config.MCP_ENTRA_CLIENT_ID,
            response_type: 'code',
            redirect_uri: callbackUrl,
            response_mode: 'query',
            scope: `${scope} offline_access`,
            state,
        }).toString();
        return noStore(reply).redirect(url.toString(), 302);
    });

    app.get('/oauth/callback', async (req, reply) => {
        if (!hostOk(req.headers.host)) return reply.code(403).send({ error: 'forbidden_host' });
        const q = (req.query ?? {}) as Record<string, string | undefined>;
        const st = q.state ? sealer.open<StateBlob>('state', q.state) : null;
        if (!st || st.exp < Date.now()) return noStore(reply).code(400).send({ error: 'invalid_state' });
        if (q.error || !q.code) {
            req.log.warn({ error: q.error?.slice(0, 64) }, 'entra authorization failed');
            return redirectTo(reply, st.ru, { error: q.error === 'access_denied' ? 'access_denied' : 'server_error', state: st.st });
        }
        const code = sealer.seal('code', { ec: q.code, cid: st.cid, ru: st.ru, cc: st.cc, exp: Date.now() + CODE_TTL_MS } satisfies CodeBlob);
        return redirectTo(reply, st.ru, { code, state: st.st });
    });

    const tokenSchema = z.discriminatedUnion('grant_type', [
        z.object({
            grant_type: z.literal('authorization_code'),
            code: z.string().max(8192),
            redirect_uri: z.string().max(512),
            client_id: z.string().max(2048),
            code_verifier: z.string().regex(PKCE),
        }),
        z.object({ grant_type: z.literal('refresh_token'), refresh_token: z.string().max(8192), client_id: z.string().max(2048) }),
    ]);
    const invalid = (reply: FastifyReply, error: string) => noStore(reply).code(400).send({ error });

    app.post('/token', async (req, reply) => {
        if (!hostOk(req.headers.host)) return reply.code(403).send({ error: 'forbidden_host' });
        const parsed = tokenSchema.safeParse(req.body);
        if (!parsed.success) return invalid(reply, 'invalid_request');
        const p = parsed.data;
        if (!sealer.open<ClientBlob>('client', p.client_id)) return invalid(reply, 'invalid_client');

        const form: Record<string, string> = { client_id: config.MCP_ENTRA_CLIENT_ID, client_secret: config.MCP_ENTRA_CLIENT_SECRET, scope: `${scope} offline_access` };
        if (p.grant_type === 'authorization_code') {
            const c = sealer.open<CodeBlob>('code', p.code);
            if (!c || c.exp < Date.now() || c.cid !== p.client_id || c.ru !== p.redirect_uri || sha256url(p.code_verifier) !== c.cc) {
                return invalid(reply, 'invalid_grant');
            }
            Object.assign(form, { grant_type: 'authorization_code', code: c.ec, redirect_uri: callbackUrl });
        } else {
            Object.assign(form, { grant_type: 'refresh_token', refresh_token: p.refresh_token });
        }

        let res: Response;
        try {
            res = await fetchFn(`${entra}/token`, {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(form),
                signal: AbortSignal.timeout(config.MCP_REQUEST_TIMEOUT_MS),
                redirect: 'error',
            });
        } catch (e) {
            req.log.error({ name: (e as Error).name }, 'entra token request failed');
            return noStore(reply).code(503).send({ error: 'temporarily_unavailable' });
        }
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok || typeof body.access_token !== 'string') {
            // Alleen de Entra-foutcode loggen, nooit de body (kan token- of gebruikersgegevens bevatten).
            req.log.warn({ status: res.status, error: typeof body.error === 'string' ? body.error.slice(0, 64) : undefined, codes: Array.isArray(body.error_codes) ? body.error_codes.slice(0, 3) : undefined }, 'entra token exchange rejected');
            return invalid(reply, 'invalid_grant');
        }
        return noStore(reply).send({
            access_token: body.access_token,
            token_type: 'Bearer',
            expires_in: typeof body.expires_in === 'number' ? body.expires_in : 3600,
            ...(typeof body.refresh_token === 'string' ? { refresh_token: body.refresh_token } : {}),
            scope: config.MCP_REQUIRED_SCOPE,
        });
    });
}
