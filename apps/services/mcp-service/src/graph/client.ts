import { OnBehalfOfCredential } from '@azure/identity';

const GRAPH_ORIGIN = 'https://graph.microsoft.com';
const GRAPH_BASE = `${GRAPH_ORIGIN}/v1.0`;

export interface GraphReader {
    /** Alleen GET, met het (OBO-)Graph-token van de aangemelde gebruiker. Pad is relatief aan /v1.0 en wordt strikt gevalideerd. */
    get(pathOrNextLink: string, accessToken: string): Promise<unknown>;
}

/** Wisselt het gebruikerstoken om voor een Graph-token (On-Behalf-Of). */
export type TokenExchanger = (userToken: string) => Promise<string>;

export class SourceUnavailableError extends Error {}
/** Graph/Entra weigert de combinatie app + gebruiker (401/403, OBO-fout). Nooit automatisch met bredere rechten herproberen. */
export class AccessDeniedError extends Error {}

const SITE_ID = /^[A-Za-z0-9.,-]+$/;
const PAGE_ID = /^[0-9a-fA-F-]{36}$/;
const SAFE_QUERY = /^[A-Za-z0-9$=&,_.%/ -]*$/;

export function resolveGraphUrl(input: string): URL {
    if (input.startsWith('/')) {
        const [path = '', query = ''] = input.split('?', 2);
        const parts = path.split('/');
        if (parts.length < 4) throw new Error('Pad niet toegestaan');
        const [, root, site, pages, ...rest] = parts;
        const restOk =
            rest.length === 0 ||
            (rest.length === 1 && (rest[0] === 'microsoft.graph.sitePage' || PAGE_ID.test(rest[0] ?? ''))) ||
            (rest.length === 2 && PAGE_ID.test(rest[0] ?? '') && rest[1] === 'microsoft.graph.sitePage');
        if (root !== 'sites' || !SITE_ID.test(site) || pages !== 'pages' || !restOk || !SAFE_QUERY.test(query)) {
            throw new Error('Pad niet toegestaan');
        }
        return new URL(GRAPH_BASE + input);
    }
    // Alleen @odata.nextLink van Graph zelf, binnen dezelfde sites/pages-ruimte.
    const url = new URL(input);
    if (url.origin !== GRAPH_ORIGIN || !url.pathname.startsWith('/v1.0/sites/') || url.username || url.password) {
        throw new Error('URL niet toegestaan');
    }
    return url;
}

export function createOboExchanger(opts: { tenantId: string; clientId: string; clientSecret: string }): TokenExchanger {
    return async (userToken) => {
        try {
            const credential = new OnBehalfOfCredential({
                tenantId: opts.tenantId,
                clientId: opts.clientId,
                clientSecret: opts.clientSecret,
                userAssertionToken: userToken,
            });
            return (await credential.getToken('https://graph.microsoft.com/.default')).token;
        } catch (e) {
            // Entra weigert (consent/toegang) vs. netwerkprobleem: alleen eerste telt als "geen toegang". Geen details doorgeven.
            throw (e as Error).name === 'AuthenticationError' ? new AccessDeniedError('OBO geweigerd') : new SourceUnavailableError('OBO niet bereikbaar');
        }
    };
}

export function createGraphReader(opts: { timeoutMs: number }, fetchImpl: typeof fetch = fetch): GraphReader {
    return {
        async get(pathOrNextLink, accessToken) {
            const url = resolveGraphUrl(pathOrNextLink);
            try {
                const res = await fetchImpl(url, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
                    redirect: 'error',
                    signal: AbortSignal.timeout(opts.timeoutMs),
                });
                if (res.status === 401 || res.status === 403) throw new AccessDeniedError(`Graph status ${res.status}`);
                if (!res.ok) throw new SourceUnavailableError(`Graph status ${res.status}`);
                return (await res.json()) as unknown;
            } catch (e) {
                if (e instanceof SourceUnavailableError || e instanceof AccessDeniedError) throw e;
                throw new SourceUnavailableError('Graph niet bereikbaar');
            }
        },
    };
}
