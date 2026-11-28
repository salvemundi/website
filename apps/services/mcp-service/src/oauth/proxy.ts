import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
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
/** `cid` = hash van het client_id (houdt state/code klein); `n` = nonce die ook in een cookie van deze browser staat. */
interface StateBlob { cid: string; ru: string; cc: string; st?: string; n: string; exp: number }
interface CodeBlob { ec: string; cid: string; ru: string; cc: string; exp: number }
/** Refresh token van Entra, versleuteld en gebonden aan het client_id waarvoor het is uitgegeven. */
interface RefreshBlob { rt: string; cid: string }

const sha256url = (s: string) => createHash('sha256').update(s).digest('base64url');
const COOKIE = '__Host-samu_mcp_auth';
const sameSecret = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const readCookie = (header: string | undefined): string | undefined => {
    for (const part of (header ?? '').split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === COOKIE) return v.join('=');
    }
    return undefined;
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Herkenbare naam voor de client op de toestemmingspagina; de redirect-host staat er altijd letterlijk bij. */
function clientName(ru: string): string {
    const host = new URL(ru).hostname;
    if (host === 'claude.ai' || host === 'claude.com') return 'Claude';
    if (host === 'chatgpt.com' || host === 'platform.openai.com') return 'ChatGPT';
    if (['localhost', '127.0.0.1', '[::1]'].includes(host)) return 'een programma op je eigen computer';
    return host;
}

// ChatGPT gebruikt (ouder) een vaste host met een connector-specifiek ID in het pad.
const isChatGptConnector = (raw: string) => /^https:\/\/chatgpt\.com\/connector\/oauth\/[A-Za-z0-9_-]{1,128}$/.test(raw);

const isLoopback = (u: URL) => u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);

export function registerOAuthRoutes(app: FastifyInstance, config: Config, fetchFn: typeof fetch = fetch): void {
    const base = new URL(config.MCP_PUBLIC_URL).origin;
    const publicHost = new URL(base).host;
    const callbackUrl = `${base}/oauth/callback`;
    const entra = `https://login.microsoftonline.com/${config.MCP_ENTRA_TENANT_ID}/oauth2/v2.0`;
    const scope = `api://${config.MCP_ENTRA_CLIENT_ID}/${config.MCP_REQUIRED_SCOPE}`;
    const sealer = createSealer(config.MCP_ENTRA_CLIENT_SECRET);
    const resource = `${base}/mcp`;
    // Lagere limiet voor routes die alleen browsers van gebruikers aanroepen (niet de gedeelde servers van Claude/ChatGPT).
    const browserLimit = { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } };

    const redirectAllowed = (raw: string): boolean => {
        if (raw.length > 512) return false;
        let u: URL;
        try { u = new URL(raw); } catch { return false; }
        if (u.hash) return false;
        return config.MCP_ALLOWED_REDIRECT_URIS.includes(raw) || isLoopback(u) || isChatGptConnector(raw);
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

    const asMetadata = () => ({
        issuer: base,
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        registration_endpoint: `${base}/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
        scopes_supported: [config.MCP_REQUIRED_SCOPE],
    });
    app.get('/.well-known/oauth-authorization-server', asMetadata);
    // Sommige clients (o.a. ChatGPT) zoeken ook op de OIDC-discovery-URL.
    app.get('/.well-known/openid-configuration', asMetadata);

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
        // RFC 8707: als de client een resource noemt, moet dat deze MCP-server zijn.
        resource: z.string().max(512).optional(),
    });
    app.get('/authorize', browserLimit, async (req, reply) => {
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
        if (p.resource !== undefined && p.resource.replace(/\/$/, '') !== resource && p.resource.replace(/\/$/, '') !== base) {
            return redirectTo(reply, p.redirect_uri, { error: 'invalid_target', state: p.state });
        }
        // Toestemmingsstap (MCP security best practices, "confused deputy"): Entra is vooraf goedgekeurd en meldt
        // stil aan via SSO, dus zonder deze pagina zou een doorgestuurde /authorize-link ongemerkt een code opleveren
        // voor de connector van iemand anders. De nonce in cookie + state bindt de flow aan deze browser.
        const nonce = randomBytes(16).toString('base64url');
        const state = sealer.seal('state', { cid: sha256url(p.client_id), ru: p.redirect_uri, cc: p.code_challenge, st: p.state, n: nonce, exp: Date.now() + STATE_TTL_MS } satisfies StateBlob);
        const naam = clientName(p.redirect_uri);
        const host = new URL(p.redirect_uri).host;
        const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Samu Bijbel koppelen</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#1a1a1a}h1{font-size:1.4rem}.box{border:1px solid #ccc;border-radius:.5rem;padding:1rem;margin:1rem 0}.warn{background:#fff4e5;border-color:#f0b35b}button{font-size:1rem;padding:.6rem 1.1rem;border-radius:.4rem;border:1px solid #555;margin-right:.5rem;cursor:pointer}.go{background:#1a1a1a;color:#fff}@media(prefers-color-scheme:dark){body{background:#141414;color:#eee}.box{border-color:#444}.warn{background:#3a2a10;border-color:#8a6420}.go{background:#eee;color:#141414}}</style></head>
<body><h1>Samu Bijbel koppelen aan ${esc(naam)}</h1>
<div class="box"><strong>${esc(naam)}</strong> (<code>${esc(host)}</code>) vraagt om de Samu Bijbel namens jou te mogen <strong>lezen</strong>. Er wordt niets gewijzigd. Je meldt je daarna aan met je Salve Mundi-account.</div>
<div class="box warn">Ga alleen door als je deze koppeling <strong>zelf</strong> net hebt gestart. Heb je deze link van iemand anders gekregen, kies dan Annuleren.</div>
<form method="post" action="/authorize"><input type="hidden" name="state" value="${esc(state)}"><button class="go" name="keuze" value="ja" type="submit">Doorgaan</button><button name="keuze" value="nee" type="submit">Annuleren</button></form>
</body></html>`;
        const ruOrigin = new URL(p.redirect_uri).origin;
        return noStore(reply)
            .header('Set-Cookie', `${COOKIE}=${nonce}; Path=/; Max-Age=${STATE_TTL_MS / 1000}; Secure; HttpOnly; SameSite=Lax`)
            .header('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://login.microsoftonline.com ${ruOrigin}; frame-ancestors 'none'; base-uri 'none'`)
            .header('X-Frame-Options', 'DENY')
            .header('Referrer-Policy', 'no-referrer')
            .type('text/html; charset=utf-8')
            .send(html);
    });

    /** Opent de state alleen als hij geldig is én bij de cookie van deze browser hoort. */
    const browserState = (raw: unknown, cookieHeader: string | undefined): StateBlob | null => {
        const st = typeof raw === 'string' ? sealer.open<StateBlob>('state', raw) : null;
        const nonce = readCookie(cookieHeader);
        if (!st || st.exp < Date.now() || !nonce || !sameSecret(nonce, st.n)) return null;
        return st;
    };
    const clearCookie = (reply: FastifyReply) => reply.header('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`);
    const stateError = (reply: FastifyReply) =>
        noStore(reply).code(400).type('text/html; charset=utf-8')
            .send('<!doctype html><html lang="nl"><meta charset="utf-8"><title>Koppeling verlopen</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem"><h1>Koppeling verlopen of ongeldig</h1><p>Start het koppelen opnieuw vanuit Claude of ChatGPT, in dezelfde browser.</p></body></html>');

    app.post('/authorize', browserLimit, async (req, reply) => {
        if (!hostOk(req.headers.host)) return reply.code(403).send({ error: 'forbidden_host' });
        // Alleen vanaf onze eigen toestemmingspagina (de SameSite-cookie wordt bij cross-site POST niet meegestuurd).
        if (req.headers.origin && req.headers.origin !== base) return reply.code(403).send({ error: 'forbidden_origin' });
        const body = (req.body ?? {}) as Record<string, unknown>;
        const st = browserState(body.state, req.headers.cookie);
        if (!st) return stateError(reply);
        if (body.keuze !== 'ja') {
            clearCookie(reply);
            return redirectTo(reply, st.ru, { error: 'access_denied', state: st.st });
        }
        const url = new URL(`${entra}/authorize`);
        url.search = new URLSearchParams({
            client_id: config.MCP_ENTRA_CLIENT_ID,
            response_type: 'code',
            redirect_uri: callbackUrl,
            response_mode: 'query',
            scope: `${scope} offline_access`,
            state: body.state as string,
        }).toString();
        return noStore(reply).redirect(url.toString(), 303);
    });

    app.get('/oauth/callback', browserLimit, async (req, reply) => {
        if (!hostOk(req.headers.host)) return reply.code(403).send({ error: 'forbidden_host' });
        const q = (req.query ?? {}) as Record<string, string | undefined>;
        const st = browserState(q.state, req.headers.cookie);
        if (!st) return stateError(reply);
        clearCookie(reply);
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
        z.object({ grant_type: z.literal('refresh_token'), refresh_token: z.string().max(16384), client_id: z.string().max(2048) }),
    ]);
    const invalid = (reply: FastifyReply, error: string) => noStore(reply).code(error === 'invalid_client' ? 401 : 400).send({ error });

    app.post('/token', async (req, reply) => {
        if (!hostOk(req.headers.host)) return reply.code(403).send({ error: 'forbidden_host' });
        const parsed = tokenSchema.safeParse(req.body);
        if (!parsed.success) return invalid(reply, 'invalid_request');
        const p = parsed.data;
        if (!sealer.open<ClientBlob>('client', p.client_id)) return invalid(reply, 'invalid_client');

        const form: Record<string, string> = { client_id: config.MCP_ENTRA_CLIENT_ID, client_secret: config.MCP_ENTRA_CLIENT_SECRET, scope: `${scope} offline_access` };
        if (p.grant_type === 'authorization_code') {
            const c = sealer.open<CodeBlob>('code', p.code);
            if (!c || c.exp < Date.now() || c.cid !== sha256url(p.client_id) || c.ru !== p.redirect_uri || sha256url(p.code_verifier) !== c.cc) {
                return invalid(reply, 'invalid_grant');
            }
            Object.assign(form, { grant_type: 'authorization_code', code: c.ec, redirect_uri: callbackUrl });
        } else {
            // Alleen een refresh token dat deze dienst zelf aan dít client_id gaf; een kaal Entra-token of dat van een
            // andere client wordt geweigerd (anders zou de proxy het Entra-secret 'uitlenen' aan elk token).
            const r = sealer.open<RefreshBlob>('refresh', p.refresh_token);
            if (!r || r.cid !== sha256url(p.client_id)) return invalid(reply, 'invalid_grant');
            Object.assign(form, { grant_type: 'refresh_token', refresh_token: r.rt });
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
        if (res.status >= 500 || res.status === 429) {
            // Storing of throttling bij Entra: het refresh token is nog goed, de client moet het later opnieuw proberen.
            req.log.warn({ status: res.status }, 'entra token endpoint unavailable');
            return noStore(reply).code(503).header('Retry-After', '5').send({ error: 'temporarily_unavailable' });
        }
        if (!res.ok || typeof body.access_token !== 'string') {
            // Alleen de Entra-foutcode loggen, nooit de body (kan token- of gebruikersgegevens bevatten).
            req.log.warn({ status: res.status, error: typeof body.error === 'string' ? body.error.slice(0, 64) : undefined, codes: Array.isArray(body.error_codes) ? body.error_codes.slice(0, 3) : undefined }, 'entra token exchange rejected');
            return invalid(reply, 'invalid_grant');
        }
        return noStore(reply).send({
            access_token: body.access_token,
            token_type: 'Bearer',
            expires_in: typeof body.expires_in === 'number' ? body.expires_in : 3600,
            ...(typeof body.refresh_token === 'string' ? { refresh_token: sealer.seal('refresh', { rt: body.refresh_token, cid: sha256url(p.client_id) } satisfies RefreshBlob) } : {}),
            scope: config.MCP_REQUIRED_SCOPE,
        });
    });
}
