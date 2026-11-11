import { exportJWK, generateKeyPair, SignJWT, type CryptoKey } from 'jose';
import { buildApp } from '../src/app.js';
import { createVerifier } from '../src/auth/jwt.js';
import { audienceOf, loadConfig, type Config } from '../src/config.js';
import type { BijbelPage, BijbelSource } from '../src/graph/source.js';

export const TENANT = '11111111-1111-4111-8111-111111111111';
export const CLIENT_ID = '22222222-2222-4222-8222-222222222222';
export const AUD = `api://${CLIENT_ID}`;
export const HOST = 'mcp.acc.example.nl';

export const baseEnv: NodeJS.ProcessEnv = {
    APP_ENV: 'acc',
    MCP_PUBLIC_URL: `https://${HOST}`,
    MCP_ENTRA_TENANT_ID: TENANT,
    MCP_ENTRA_CLIENT_ID: CLIENT_ID,
    MCP_ENTRA_CLIENT_SECRET: 'super-secret-value',
    MCP_SHAREPOINT_SITE_ID: 'contoso.sharepoint.com,aaa,bbb',
    MCP_ALLOWED_ORIGINS: 'https://claude.ai',
};

export const config = (over: NodeJS.ProcessEnv = {}): Config => loadConfig({ ...baseEnv, ...over });

let keys: Awaited<ReturnType<typeof generateKeyPair>> | undefined;
export async function getKeys() {
    keys ??= await generateKeyPair('RS256');
    return keys;
}

export async function token(claims: Record<string, unknown> = {}, o: { iss?: string; aud?: string; exp?: string; key?: CryptoKey } = {}) {
    const { privateKey } = await getKeys();
    return new SignJWT({ scp: 'bijbel.read', oid: 'oid-1', ...claims })
        .setProtectedHeader({ alg: 'RS256' })
        .setSubject('user-1')
        .setIssuer(o.iss ?? `https://login.microsoftonline.com/${TENANT}/v2.0`)
        .setAudience(o.aud ?? AUD)
        .setIssuedAt()
        .setExpirationTime(o.exp ?? '5m')
        .sign(o.key ?? privateKey);
}

export const page = (over: Partial<BijbelPage> = {}): BijbelPage => ({
    id: '3f2b8a52-7c1e-4f6a-9d0b-1a2b3c4d5e6f',
    titel: 'Introweek regels',
    url: 'https://contoso.sharepoint.com/sites/bijbel/SitePages/Introweek.aspx',
    gewijzigd: '2026-10-01T10:00:00Z',
    secties: [
        { nummer: 1, titel: 'Alcohol', tekst: 'Tijdens de introweek is alcohol toegestaan vanaf 18 jaar.\nDrink met mate.' },
        { nummer: 2, titel: 'Kamp', tekst: 'Het kamp duurt drie dagen.' },
    ],
    ...over,
});

const FETCHED = new Date('2026-11-01T12:00:00Z');
export const sourceOf = (pages: BijbelPage[], stale = false): BijbelSource => ({
    list: () => Promise.resolve({ pages: pages.map(({ secties: _s, ...m }) => m), fetchedAt: FETCHED, stale }),
    read: (id) => {
        const p = pages.find((x) => x.id === id.toLowerCase());
        return Promise.resolve(p ? { page: p, fetchedAt: FETCHED, stale } : null);
    },
    searchSet: (max) => Promise.resolve({ pages: pages.slice(0, max), totaal: pages.length, fetchedAt: FETCHED, stale }),
});

export async function makeApp(source: BijbelSource, over: NodeJS.ProcessEnv = {}) {
    const { publicKey } = await getKeys();
    const cfg = config(over);
    const verifier = createVerifier({
        tenantId: cfg.MCP_ENTRA_TENANT_ID,
        audience: audienceOf(cfg),
        requiredScope: cfg.MCP_REQUIRED_SCOPE,
        keyResolver: () => Promise.resolve(publicKey),
    });
    return buildApp({ config: cfg, verifier, sourceFor: () => source, logger: false });
}

export type App = Awaited<ReturnType<typeof makeApp>>;

export async function rpc(app: App, method: string, params: unknown, o: { tok?: string | null; headers?: Record<string, string> } = {}) {
    const tok = o.tok === undefined ? await token() : o.tok;
    return app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
            host: HOST,
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
            ...(tok ? { authorization: `Bearer ${tok}` } : {}),
            ...o.headers,
        },
        payload: { jsonrpc: '2.0', id: 1, method, params },
    });
}

function parse(text: string | undefined): Record<string, unknown> | null {
    try {
        return text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
        return null; // bv. validatiefout van de SDK als platte tekst
    }
}

export async function callTool(app: App, name: string, args: unknown) {
    const res = await rpc(app, 'tools/call', { name, arguments: args });
    const body = res.json<{ result?: { content: { text: string }[]; isError?: boolean }; error?: unknown }>();
    const text = body.result?.content[0]?.text;
    return { status: res.statusCode, isError: body.result?.isError === true, rpcError: body.error, data: parse(text) };
}

export { exportJWK };
