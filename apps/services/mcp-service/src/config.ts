import { z } from 'zod';

const csv = z
    .string()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean));

const schema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3005),
    APP_ENV: z.string().default('unknown'),
    MCP_PUBLIC_URL: z.url().refine((u) => u.startsWith('https://') || u.startsWith('http://localhost'), 'MCP_PUBLIC_URL moet https zijn'),
    MCP_ENTRA_TENANT_ID: z.uuid(),
    // Identiteit van DEZE dienst (resource-app + OBO-client). Moet een eigen, alleen-lezen app zijn; zie README.
    MCP_ENTRA_CLIENT_ID: z.uuid(),
    MCP_ENTRA_CLIENT_SECRET: z.string().min(1),
    // Schrijven bestaat niet in deze dienst; een afwijkende waarde blokkeert het opstarten (fail-closed).
    BIJBEL_WRITE_ENABLED: z.string().default('false').refine((v) => v === 'false', 'BIJBEL_WRITE_ENABLED moet false zijn: deze dienst is alleen-lezen'),
    MCP_REQUIRED_SCOPE: z.string().min(1).default('bijbel.read'),
    MCP_SHAREPOINT_SITE_ID: z.string().regex(/^[A-Za-z0-9.,-]{3,200}$/, 'ongeldig site-ID'),
    MCP_ALLOWED_PATH_PREFIX: z.string().regex(/^\/[A-Za-z0-9\-_./]*$/).default('/'),
    MCP_ALLOWED_ORIGINS: csv,
    MCP_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
    MCP_MAX_STALE_SECONDS: z.coerce.number().int().min(0).max(86400).default(3600),
    MCP_MAX_RESPONSE_CHARS: z.coerce.number().int().min(1000).max(50000).default(8000),
    MCP_MAX_SEARCH_PAGES: z.coerce.number().int().min(1).max(50).default(50),
    MCP_MAX_RESULTS: z.coerce.number().int().min(1).max(25).default(10),
    MCP_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10000).default(60),
    MCP_MAX_CONCURRENT: z.coerce.number().int().min(1).max(100).default(8),
    MCP_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
});

/** Een OBO-token voor deze dienst heeft als audience de app-ID-URI of het client-ID van de eigen app. */
export const audienceOf = (c: Pick<Config, 'MCP_ENTRA_CLIENT_ID'>): string[] => [`api://${c.MCP_ENTRA_CLIENT_ID}`, c.MCP_ENTRA_CLIENT_ID];

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
    const parsed = schema.safeParse(env);
    if (!parsed.success) {
        // Alleen veldnamen/redenen, nooit waarden (secrets).
        const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Ongeldige MCP-configuratie: ${issues}`);
    }
    return parsed.data;
}
