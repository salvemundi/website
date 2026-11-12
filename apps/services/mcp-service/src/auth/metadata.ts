import type { Config } from '../config.js';

export function resourceMetadataUrl(cfg: Pick<Config, 'MCP_PUBLIC_URL'>): string {
    return new URL('/.well-known/oauth-protected-resource', cfg.MCP_PUBLIC_URL).toString();
}

/** RFC 9728 protected resource metadata (Entra ID is de autorisatieserver). */
export function protectedResourceMetadata(cfg: Pick<Config, 'MCP_PUBLIC_URL' | 'MCP_ENTRA_TENANT_ID' | 'MCP_ENTRA_CLIENT_ID' | 'MCP_REQUIRED_SCOPE'>) {
    const resource = new URL('/mcp', cfg.MCP_PUBLIC_URL).toString();
    return {
        resource,
        authorization_servers: [`https://login.microsoftonline.com/${cfg.MCP_ENTRA_TENANT_ID}/v2.0`],
        // Entra v2 weigert een `resource`-parameter die niet bij de scope hoort (AADSTS9010010). MCP-clients sturen
        // `resource` mee, dus de scope moet onder dezelfde identifier vallen: de Application ID URI van de app is
        // de resource-URL (bv. https://mcp-acc.salvemundi.nl/mcp). Tokens hebben als aud het client-ID (zie audienceOf).
        scopes_supported: [`${resource}/${cfg.MCP_REQUIRED_SCOPE}`],
        bearer_methods_supported: ['header'],
    };
}
