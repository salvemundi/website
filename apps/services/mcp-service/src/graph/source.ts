import { z } from 'zod';
import type { UserContext } from '../auth/jwt.js';
import { AccessDeniedError, type GraphReader, SourceUnavailableError, type TokenExchanger } from './client.js';

export interface BijbelSection { nummer: number; titel: string | null; tekst: string }
export interface PageMeta { id: string; titel: string; url: string; gewijzigd: string | null }
export interface BijbelPage extends PageMeta { secties: BijbelSection[] }
export interface Freshness { fetchedAt: Date; stale: boolean }
export interface BijbelSource {
    /** Metadata van alle toegestane (gepubliceerde, binnen pad) pagina's. */
    list(): Promise<{ pages: PageMeta[] } & Freshness>;
    /** Eén pagina; null als het ID niet in de allowlist staat of niet (meer) gepubliceerd is. */
    read(id: string): Promise<({ page: BijbelPage } & Freshness) | null>;
    /** Inhoud van de eerste `max` toegestane pagina's (zoekbereik); `totaal` = aantal toegestane pagina's. */
    searchSet(max: number): Promise<{ pages: BijbelPage[]; totaal: number } & Freshness>;
}
export type SourceFactory = (user: UserContext) => BijbelSource;

const MAX_LIST = 500;
const PAGE_CONCURRENCY = 5;
const MAX_USERS = 20;
const GONE = 'Pagina niet (meer) beschikbaar';

const PUBLISHED = z.object({ level: z.string() }).nullish();
const listSchema = z.object({
    value: z.array(
        z.object({
            id: z.uuid(),
            title: z.string().nullish(),
            webUrl: z.url(),
            lastModifiedDateTime: z.string().nullish(),
            publishingState: PUBLISHED,
        }),
    ),
    '@odata.nextLink': z.string().optional(),
});

const webPartSchema = z.object({ innerHtml: z.string().nullish() }).loose();
const detailSchema = z.object({
    id: z.uuid(),
    title: z.string().nullish(),
    webUrl: z.url(),
    lastModifiedDateTime: z.string().nullish(),
    publishingState: PUBLISHED,
    canvasLayout: z
        .object({
            horizontalSections: z
                .array(z.object({ columns: z.array(z.object({ webparts: z.array(webPartSchema).nullish() })).nullish() }))
                .nullish(),
        })
        .nullish(),
});

const ENTITIES = new Map([['&amp;', '&'], ['&lt;', '<'], ['&gt;', '>'], ['&quot;', '"'], ['&#39;', "'"], ['&nbsp;', ' ']]);

/** Deterministische HTML→tekst: verwijdert tags en script/style, behoudt de tekst letterlijk. */
export function htmlToText(html: string): string {
    return html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/<\/(p|div|li|h[1-6]|tr)>|<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (m) => ENTITIES.get(m) ?? m)
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n')
        .trim();
}

function firstHeading(html: string): string | null {
    const m = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(html);
    return m?.[1] ? htmlToText(m[1]) || null : null;
}

export interface SourceOptions {
    siteId: string;
    pathPrefix: string;
    ttlMs: number;
    maxStaleMs: number;
    exchange: TokenExchanger;
    now?: () => number;
}

interface Entry<T> { data: T; at: number }
interface UserCache { metas?: Entry<PageMeta[]>; pages: Map<string, Entry<BijbelPage>> }

const isGone = (e: unknown) => e instanceof SourceUnavailableError && e.message === GONE;

/**
 * Bron per aangemelde gebruiker (OBO): de Graph-rechten van de gebruiker zijn bepalend en de cache is per gebruiker
 * gescheiden. Alleen gepubliceerde pagina's binnen het padvoorvoegsel worden teruggegeven (fail-closed: ontbrekende
 * publishingState = niet gepubliceerd). Bij 401/403 wordt de cache van die gebruiker gewist en nooit stale data geleverd.
 */
export function createGraphBijbelSources(graph: GraphReader, opts: SourceOptions): SourceFactory {
    const now = opts.now ?? Date.now;
    const caches = new Map<string, UserCache>();

    const cacheFor = (key: string): UserCache => {
        let c = caches.get(key);
        if (c) caches.delete(key); // LRU: opnieuw achteraan
        c ??= { pages: new Map() };
        caches.set(key, c);
        while (caches.size > MAX_USERS) caches.delete(caches.keys().next().value as string);
        return c;
    };

    const allowed = (webUrl: string, level: string | undefined) => level === 'published' && new URL(webUrl).pathname.startsWith(opts.pathPrefix);

    return (user) => {
        const cache = cacheFor(user.key);
        let graphToken: Promise<string> | undefined;
        const get = async (path: string) => {
            graphToken ??= opts.exchange(user.token);
            return graph.get(path, await graphToken);
        };

        /** Vers binnen TTL; anders ophalen; bij storing (niet bij toegangsfout) beperkt stale. */
        async function cached<T>(entry: Entry<T> | undefined, fetcher: () => Promise<T>, store: (e: Entry<T>) => void) {
            if (entry && now() - entry.at <= opts.ttlMs) return { data: entry.data, at: entry.at, stale: false };
            try {
                const e = { data: await fetcher(), at: now() };
                store(e);
                return { data: e.data, at: e.at, stale: false };
            } catch (err) {
                if (err instanceof AccessDeniedError) {
                    cache.metas = undefined;
                    cache.pages.clear();
                    throw err;
                }
                if (isGone(err)) throw err;
                if (entry && now() - entry.at <= opts.maxStaleMs) return { data: entry.data, at: entry.at, stale: true };
                throw err instanceof SourceUnavailableError ? err : new SourceUnavailableError('Bron onbeschikbaar');
            }
        }

        async function fetchMetas(): Promise<PageMeta[]> {
            const out: PageMeta[] = [];
            let seen = 0;
            let next: string | undefined = `/sites/${opts.siteId}/pages/microsoft.graph.sitePage?$select=id,title,webUrl,lastModifiedDateTime,publishingState&$top=100`;
            while (next && seen < MAX_LIST) {
                const parsed: z.infer<typeof listSchema> = listSchema.parse(await get(next));
                seen += parsed.value.length;
                for (const m of parsed.value) {
                    if (allowed(m.webUrl, m.publishingState?.level)) {
                        out.push({ id: m.id.toLowerCase(), titel: m.title ?? '(zonder titel)', url: m.webUrl, gewijzigd: m.lastModifiedDateTime ?? null });
                    }
                }
                next = parsed['@odata.nextLink'];
            }
            return out;
        }

        async function fetchPage(meta: PageMeta): Promise<BijbelPage> {
            const d = detailSchema.parse(await get(`/sites/${opts.siteId}/pages/${meta.id}/microsoft.graph.sitePage?$expand=canvasLayout`));
            // Opnieuw controleren op de detailrespons: concept geworden of verplaatst sinds de lijst = niet leesbaar.
            if (d.id.toLowerCase() !== meta.id || !allowed(d.webUrl, d.publishingState?.level)) throw new SourceUnavailableError(GONE);
            const secties: BijbelSection[] = [];
            for (const sec of d.canvasLayout?.horizontalSections ?? []) {
                const html = (sec.columns ?? []).flatMap((c) => c.webparts ?? []).map((w) => w.innerHtml ?? '').join('\n');
                const tekst = htmlToText(html);
                if (tekst) secties.push({ nummer: secties.length + 1, titel: firstHeading(html), tekst });
            }
            return { id: meta.id, titel: d.title ?? '(zonder titel)', url: d.webUrl, gewijzigd: d.lastModifiedDateTime ?? null, secties };
        }

        const metas = () => cached(cache.metas, fetchMetas, (e) => (cache.metas = e));

        async function pageOf(meta: PageMeta) {
            const r = await cached(cache.pages.get(meta.id), () => fetchPage(meta), (e) => cache.pages.set(meta.id, e));
            return { page: r.data, at: r.at, stale: r.stale };
        }

        return {
            async list() {
                const m = await metas();
                return { pages: m.data, fetchedAt: new Date(m.at), stale: m.stale };
            },
            async read(id) {
                const m = await metas();
                const meta = m.data.find((p) => p.id === id.toLowerCase());
                if (!meta) return null;
                try {
                    const r = await pageOf(meta);
                    return { page: r.page, stale: r.stale || m.stale, fetchedAt: new Date(Math.min(r.at, m.at)) };
                } catch (e) {
                    if (isGone(e)) return null;
                    throw e;
                }
            },
            async searchSet(max) {
                const m = await metas();
                const subset = m.data.slice(0, max);
                const pages: BijbelPage[] = [];
                let stale = m.stale;
                let oldest = m.at;
                for (let i = 0; i < subset.length; i += PAGE_CONCURRENCY) {
                    const batch = await Promise.all(
                        subset.slice(i, i + PAGE_CONCURRENCY).map((meta) =>
                            pageOf(meta).catch((e: unknown) => {
                                if (isGone(e)) return null;
                                throw e;
                            }),
                        ),
                    );
                    for (const r of batch) {
                        if (!r) continue;
                        pages.push(r.page);
                        stale ||= r.stale;
                        oldest = Math.min(oldest, r.at);
                    }
                }
                return { pages, totaal: m.data.length, fetchedAt: new Date(oldest), stale };
            },
        };
    };
}
