import { audienceOf, type Config } from '../config.js';

export function resourceMetadataUrl(cfg: Pick<Config, 'MCP_PUBLIC_URL'>): string {
    return new URL('/.well-known/oauth-protected-resource', cfg.MCP_PUBLIC_URL).toString();
}

/** RFC 9728 protected resource metadata (Entra ID is de autorisatieserver). */
export function protectedResourceMetadata(cfg: Pick<Config, 'MCP_PUBLIC_URL' | 'MCP_ENTRA_TENANT_ID' | 'MCP_ENTRA_CLIENT_ID' | 'MCP_REQUIRED_SCOPE'>) {
    const aud = audienceOf(cfg)[0];
    return {
        resource: new URL('/mcp', cfg.MCP_PUBLIC_URL).toString(),
        authorization_servers: [`https://login.microsoftonline.com/${cfg.MCP_ENTRA_TENANT_ID}/v2.0`],
        scopes_supported: [`${aud}/${cfg.MCP_REQUIRED_SCOPE}`],
        bearer_methods_supported: ['header'],
    };
}
