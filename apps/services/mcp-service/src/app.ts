import { finished } from 'node:stream';
import rateLimit from '@fastify/rate-limit';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import Fastify, { type FastifyInstance } from 'fastify';
import { AuthError, type TokenVerifier, type UserContext } from './auth/jwt.js';
import { protectedResourceMetadata, resourceMetadataUrl } from './auth/metadata.js';
import type { Config } from './config.js';
import type { FileSourceFactory } from './graph/files.js';
import type { SourceFactory } from './graph/source.js';
import { registerOAuthRoutes } from './oauth/proxy.js';
import { Slots } from './slots.js';
import { createMcpServer } from './tools/index.js';

export interface Deps { config: Config; verifier: TokenVerifier; sourceFor: SourceFactory; filesFor?: FileSourceFactory; logger?: boolean; fetchFn?: typeof fetch }

export async function buildApp({ config, verifier, sourceFor, filesFor, logger = true, fetchFn }: Deps): Promise<FastifyInstance> {
    const app = Fastify({
        // Geen querystring in de logs: /oauth/callback?code=… bevat een Entra-autorisatiecode. Geen headers (tokens/cookies).
        logger: logger
            ? { serializers: { req: (r: { method: string; url: string; ip?: string }) => ({ method: r.method, url: r.url.split('?')[0], remoteAddress: r.ip }) } }
            : false,
        trustProxy: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10'],
        bodyLimit: 64 * 1024,
        requestTimeout: config.MCP_REQUEST_TIMEOUT_MS,
        connectionTimeout: config.MCP_REQUEST_TIMEOUT_MS,
    });

    const publicHost = new URL(config.MCP_PUBLIC_URL).host;
    const slots = new Slots(config.MCP_MAX_CONCURRENT, 100);
    const userSlots = new Map<string, Slots>();

    app.setErrorHandler((err, req, reply) => {
        const e = err as { statusCode?: number; code?: string; name?: string };
        req.log.error({ code: e.code, name: e.name }, 'request failed');
        const status = e.statusCode;
        void reply.code(status && status >= 400 && status < 500 ? status : 500).send({ error: status === 429 ? 'rate_limited' : 'request_failed' });
    });

    await app.register(rateLimit, {
        max: config.MCP_IP_RATE_LIMIT_PER_MINUTE,
        timeWindow: '1 minute',
        allowList: (req) => req.url === '/health',
    });
    // Per gebruiker, pas na tokenvalidatie: de sleutel komt uit het gevalideerde token, niet uit de client.
    const userLimit = app.createRateLimit({
        max: config.MCP_RATE_LIMIT_PER_MINUTE,
        timeWindow: '1 minute',
        keyGenerator: (req) => `user:${(req as unknown as { user: UserContext }).user.key}`,
    });

    app.get('/health', { logLevel: 'silent' }, () => ({ status: 'ok' }));
    app.get('/.well-known/oauth-protected-resource', () => protectedResourceMetadata(config));
    app.get('/.well-known/oauth-protected-resource/mcp', () => protectedResourceMetadata(config));
    registerOAuthRoutes(app, config, fetchFn);

    // MCP gebruikt POST ook voor leesoperaties; read-only wordt afgedwongen op tool- en bronniveau.
    app.route({
        method: 'POST',
        url: '/mcp',
        preHandler: async (req, reply) => {
            if (req.headers.host !== publicHost) return reply.code(403).send({ error: 'forbidden_host' });
            const origin = req.headers.origin;
            if (origin && !config.MCP_ALLOWED_ORIGINS.includes(origin)) return reply.code(403).send({ error: 'forbidden_origin' });

            const m = /^Bearer ([A-Za-z0-9\-._~+/]+=*)$/.exec(req.headers.authorization ?? '');
            try {
                if (!m?.[1]) throw new AuthError(401, 'invalid_token');
                (req as unknown as { user: UserContext }).user = await verifier.verify(m[1]);
            } catch (e) {
                const err = e instanceof AuthError ? e : new AuthError(401, 'invalid_token');
                const hdr = `Bearer resource_metadata="${resourceMetadataUrl(config)}", scope="${config.MCP_REQUIRED_SCOPE}"` + (err.code === 'insufficient_scope' ? ', error="insufficient_scope"' : err.code === 'forbidden' ? '' : m ? ', error="invalid_token"' : '');
                return reply.code(err.status).header('WWW-Authenticate', hdr).send({ error: err.code });
            }
            const limit = await userLimit(req);
            if (!limit.isAllowed && limit.isExceeded) {
                return reply.code(429).header('Retry-After', String(limit.ttlInSeconds)).send({ error: 'rate_limited' });
            }
        },
        handler: async (req, reply) => {
            // Client al weg (bv. geannuleerd tijdens de tokencontrole): niets meer doen.
            if (reply.raw.destroyed || req.raw.socket.destroyed) return reply.hijack();
            const user = (req as unknown as { user: UserContext }).user;
            const mine = userSlots.get(user.key) ?? new Slots(config.MCP_MAX_CONCURRENT_PER_USER, 20);
            userSlots.set(user.key, mine);
            const releaseUser = () => {
                mine.release();
                if (mine.idle) userSlots.delete(user.key);
            };
            if (!(await mine.acquire(config.MCP_QUEUE_WAIT_MS))) {
                if (mine.idle) userSlots.delete(user.key);
                return reply.code(503).header('Retry-After', '2').send({ error: 'busy' });
            }
            if (!(await slots.acquire(config.MCP_QUEUE_WAIT_MS))) {
                releaseUser();
                return reply.code(503).header('Retry-After', '2').send({ error: 'busy' });
            }
            let released = false;
            const release = () => {
                if (released) return;
                released = true;
                slots.release();
                releaseUser();
            };
            // Tijdens het wachten afgebroken: plek direct teruggeven. (De waarde kan tijdens de awaits hierboven veranderen;
            // TypeScript vernauwt hem ten onrechte op basis van de eerste controle.)
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (reply.raw.destroyed || req.raw.socket.destroyed) {
                release();
                return reply.hijack();
            }
            let server: ReturnType<typeof createMcpServer> | undefined;
            let transport: StreamableHTTPServerTransport | undefined;
            reply.hijack();
            // finished() vuurt ook als de stream al gesloten is, en precies één keer: de plekken kunnen niet lekken.
            finished(reply.raw, () => {
                release();
                void transport?.close();
                void server?.close();
            });
            try {
                // Stateless: per verzoek een eigen server+transport, geen sessiedata.
                server = createMcpServer(sourceFor(user), config, filesFor?.(user));
                transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
                await server.connect(transport);
                await transport.handleRequest(req.raw, reply.raw, req.body);
            } catch (e) {
                req.log.error({ name: (e as Error).name }, 'mcp failed');
                if (!reply.raw.headersSent) {
                    reply.raw.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'request_failed' }));
                }
            }
        },
    });

    for (const method of ['GET', 'DELETE'] as const) {
        app.route({ method, url: '/mcp', handler: (_req, reply) => reply.code(405).header('Allow', 'POST').send({ error: 'method_not_allowed' }) });
    }

    return app;
}
