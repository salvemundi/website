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
const LIST_ID = /^[0-9a-fA-F-]{36}$/;
const ITEM_ID = /^[A-Za-z0-9!_-]{1,128}$/;
const PATH_SEGMENT = /^[A-Za-z0-9%_~.-]{1,200}$/;

/** Een mappad-segment mag na decoderen geen padtraversal of scheidingstekens bevatten. */
function safeSegment(seg: string): boolean {
    if (!PATH_SEGMENT.test(seg)) return false;
    try {
        const d = decodeURIComponent(seg);
        return d !== '.' && d !== '..' && !/[/\\:]/.test(d);
    } catch {
        return false;
    }
}

/** Alleen leesroutes in de standaard documentbibliotheek van de site: root:/<map>, items/{id}[/children|/content]. */
function driveRestOk(rest: string[]): boolean {
    if (rest.length === 1 && rest[0] === 'root') return true;
    if (rest[0] === 'root:') return rest.length >= 2 && rest.length <= 9 && rest.slice(1).every(safeSegment);
    if (rest[0] !== 'items' || !ITEM_ID.test(rest[1] ?? '')) return false;
    return rest.length === 2 || (rest.length === 3 && (rest[2] === 'children' || rest[2] === 'content'));
}

export function resolveGraphUrl(input: string): URL {
    if (input.startsWith('/')) {
        const [path = '', query = ''] = input.split('?', 2);
        const parts = path.split('/');
        if (parts.length < 4) throw new Error('Pad niet toegestaan');
        const [, root, site, pages, ...rest] = parts;
        if (pages === 'drive') {
            if (root !== 'sites' || !SITE_ID.test(site) || !driveRestOk(rest) || !SAFE_QUERY.test(query)) throw new Error('Pad niet toegestaan');
            return new URL(GRAPH_BASE + input);
        }
        if (pages === 'lists') {
            // Documentbibliotheken van de site: alleen de lijst zelf en <lijst>/drive/<leesroutes>.
            const listsOk = rest.length === 0 || (LIST_ID.test(rest[0] ?? '') && rest[1] === 'drive' && driveRestOk(rest.slice(2)));
            if (root !== 'sites' || !SITE_ID.test(site) || !listsOk || !SAFE_QUERY.test(query)) throw new Error('Pad niet toegestaan');
            return new URL(GRAPH_BASE + input);
        }
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

export interface FileDownloader {
    /** GET .../items/{id}/content met het Graph-token; volgt de (voorgetekende) downloadlink zonder token en kapt af op maxBytes. */
    download(contentPath: string, accessToken: string, maxBytes: number): Promise<Buffer>;
}

export class FileTooLargeError extends Error {}

const DOWNLOAD_HOST = /\.sharepoint(-df)?\.com$/;

export function createGraphDownloader(opts: { timeoutMs: number }, fetchImpl: typeof fetch = fetch): FileDownloader {
    return {
        async download(contentPath, accessToken, maxBytes) {
            const url = resolveGraphUrl(contentPath);
            if (!url.pathname.endsWith('/content')) throw new Error('Pad niet toegestaan');
            try {
                const first = await fetchImpl(url, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    redirect: 'manual',
                    signal: AbortSignal.timeout(opts.timeoutMs),
                });
                if (first.status === 401 || first.status === 403) throw new AccessDeniedError(`Graph status ${first.status}`);
                let res = first;
                if (first.status >= 300 && first.status < 400) {
                    // Voorgetekende downloadlink: alleen https op SharePoint, nooit het Graph-token meesturen.
                    const loc = new URL(first.headers.get('location') ?? '', url);
                    if (loc.protocol !== 'https:' || !DOWNLOAD_HOST.test(loc.hostname) || loc.username || loc.password) throw new SourceUnavailableError('Downloadlink niet toegestaan');
                    res = await fetchImpl(loc, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(opts.timeoutMs) });
                }
                if (res.status === 401 || res.status === 403) throw new AccessDeniedError(`Download status ${res.status}`);
                if (!res.ok || !res.body) throw new SourceUnavailableError(`Download status ${res.status}`);
                if (Number(res.headers.get('content-length') ?? 0) > maxBytes) throw new FileTooLargeError('Bestand te groot');
                const chunks: Buffer[] = [];
                let total = 0;
                for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
                    total += chunk.byteLength;
                    if (total > maxBytes) throw new FileTooLargeError('Bestand te groot');
                    chunks.push(Buffer.from(chunk));
                }
                return Buffer.concat(chunks);
            } catch (e) {
                if (e instanceof SourceUnavailableError || e instanceof AccessDeniedError || e instanceof FileTooLargeError) throw e;
                throw new SourceUnavailableError('Download niet bereikbaar');
            }
        },
    };
}
