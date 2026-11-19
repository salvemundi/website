import type { Config } from '../config.js';

export function resourceMetadataUrl(cfg: Pick<Config, 'MCP_PUBLIC_URL'>): string {
    return new URL('/.well-known/oauth-protected-resource', cfg.MCP_PUBLIC_URL).toString();
}

/**
 * RFC 9728 protected resource metadata. Deze dienst is zelf de autorisatieserver richting clients (OAuth-voorportaal
 * voor Entra, zie oauth/proxy.ts), zodat clients geen Entra client-ID/secret hoeven te kennen.
 */
export function protectedResourceMetadata(cfg: Pick<Config, 'MCP_PUBLIC_URL' | 'MCP_REQUIRED_SCOPE'>) {
    return {
        resource: new URL('/mcp', cfg.MCP_PUBLIC_URL).toString(),
        authorization_servers: [new URL(cfg.MCP_PUBLIC_URL).origin],
        scopes_supported: [cfg.MCP_REQUIRED_SCOPE],
        bearer_methods_supported: ['header'],
    };
}
