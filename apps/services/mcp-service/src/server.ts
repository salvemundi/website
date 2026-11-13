import { buildApp } from './app.js';
import { createVerifier } from './auth/jwt.js';
import { audienceOf, loadConfig } from './config.js';
import { createGraphDownloader, createGraphReader, createOboExchanger } from './graph/client.js';
import { createGraphFileSources } from './graph/files.js';
import { createGraphBijbelSources } from './graph/source.js';
import { safeConsoleError } from './utils/logger.js';

const start = async () => {
    try {
        const config = loadConfig();
        const verifier = createVerifier({
            tenantId: config.MCP_ENTRA_TENANT_ID,
            audience: audienceOf(config),
            requiredScope: config.MCP_REQUIRED_SCOPE,
        });
        const graph = createGraphReader({ timeoutMs: config.MCP_REQUEST_TIMEOUT_MS });
        const exchange = createOboExchanger({
            tenantId: config.MCP_ENTRA_TENANT_ID,
            clientId: config.MCP_ENTRA_CLIENT_ID,
            clientSecret: config.MCP_ENTRA_CLIENT_SECRET,
        });
        const sourceFor = createGraphBijbelSources(graph, {
            siteId: config.MCP_SHAREPOINT_SITE_ID,
            pathPrefix: config.MCP_ALLOWED_PATH_PREFIX,
            ttlMs: config.MCP_CACHE_TTL_SECONDS * 1000,
            maxStaleMs: config.MCP_MAX_STALE_SECONDS * 1000,
            exchange,
        });
        const filesFor = createGraphFileSources(graph, {
            siteId: config.MCP_SHAREPOINT_SITE_ID,
            rootPath: config.MCP_FILES_PATH,
            ttlMs: config.MCP_CACHE_TTL_SECONDS * 1000,
            maxFileBytes: config.MCP_MAX_FILE_BYTES,
            exchange,
            download: createGraphDownloader({ timeoutMs: config.MCP_REQUEST_TIMEOUT_MS }),
        });
        const app = await buildApp({ config, verifier, sourceFor, filesFor });
        await app.listen({ port: config.PORT, host: '0.0.0.0' });
    } catch (error) {
        safeConsoleError('[server.ts][start] ', error);
        process.exit(1);
    }
};

void start();
