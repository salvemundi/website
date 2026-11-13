import rateLimit from '@fastify/rate-limit';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import Fastify, { type FastifyInstance } from 'fastify';
import { AuthError, type TokenVerifier, type UserContext } from './auth/jwt.js';
import { protectedResourceMetadata, resourceMetadataUrl } from './auth/metadata.js';
import type { Config } from './config.js';
import type { SourceFactory } from './graph/source.js';
import { registerOAuthRoutes } from './oauth/proxy.js';
import { createMcpServer } from './tools/index.js';

export interface Deps { config: Config; verifier: TokenVerifier; sourceFor: SourceFactory; logger?: boolean; fetchFn?: typeof fetch }

export async function buildApp({ config, verifier, sourceFor, logger = true, fetchFn }: Deps): Promise<FastifyInstance> {
    const app = Fastify({
        logger: logger ? { redact: ['req.headers.authorization', 'req.headers.cookie'] } : false,
        trustProxy: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10'],
        bodyLimit: 64 * 1024,
        requestTimeout: config.MCP_REQUEST_TIMEOUT_MS,
        connectionTimeout: config.MCP_REQUEST_TIMEOUT_MS,
    });

    const publicHost = new URL(config.MCP_PUBLIC_URL).host;
    let inFlight = 0;

    app.setErrorHandler((err, req, reply) => {
        const e = err as { statusCode?: number; code?: string; name?: string };
        req.log.error({ code: e.code, name: e.name }, 'request failed');
        const status = e.statusCode;
        void reply.code(status && status >= 400 && status < 500 ? status : 500).send({ error: status === 429 ? 'rate_limited' : 'request_failed' });
    });

    await app.register(rateLimit, {
        max: config.MCP_RATE_LIMIT_PER_MINUTE,
        timeWindow: '1 minute',
        allowList: (req) => req.url === '/health',
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
                const hdr = `Bearer resource_metadata="${resourceMetadataUrl(config)}"` + (err.status === 403 ? `, error="insufficient_scope", scope="${config.MCP_REQUIRED_SCOPE}"` : m ? ', error="invalid_token"' : '');
                return reply.code(err.status).header('WWW-Authenticate', hdr).send({ error: err.code });
            }
        },
        handler: async (req, reply) => {
            if (inFlight >= config.MCP_MAX_CONCURRENT) return reply.code(503).header('Retry-After', '2').send({ error: 'busy' });
            inFlight++;
            // Stateless: per verzoek een eigen server+transport, geen sessiedata.
            const server = createMcpServer(sourceFor((req as unknown as { user: UserContext }).user), config);
            const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
            reply.hijack();
            reply.raw.on('close', () => {
                inFlight--;
                void transport.close();
                void server.close();
            });
            try {
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
