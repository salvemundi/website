import { z } from 'zod';
import type { UserContext } from '../auth/jwt.js';
import { AccessDeniedError, FileTooLargeError, type FileDownloader, type GraphReader, SourceUnavailableError, type TokenExchanger } from './client.js';
import { extractText, extensionOf, FileUnreadableError, isReadable } from './extract.js';
import type { Freshness } from './source.js';

export interface FileMeta { id: string; naam: string; pad: string; type: string; grootte: number; gewijzigd: string | null; url: string | null; leesbaar: boolean }
export interface FileSource {
    /** Alle bestanden onder de geconfigureerde map (recursief, beperkt in diepte en aantal). */
    list(): Promise<{ files: FileMeta[]; truncated: boolean } & Freshness>;
    /** Letterlijke tekst van één bestand; null als het ID niet in de allowlist (de map) staat. */
    read(id: string): Promise<({ file: FileMeta; tekst: string } & Freshness) | null>;
    /** Originele bytes van één bestand (ongewijzigd, niet geparsed); null als het ID niet in de map staat. */
    bytes(id: string): Promise<({ file: FileMeta; data: Buffer } & Freshness) | null>;
}
export type FileSourceFactory = (user: UserContext) => FileSource;

/** De geconfigureerde map bestaat niet of is niet zichtbaar voor deze gebruiker. */
export class FolderNotFoundError extends Error {}

const MAX_DEPTH = 3;
const MAX_ITEMS = 300;
const MAX_USERS = 20;
const MAX_TEXTS = 10;
const SELECT = '$select=id,name,size,lastModifiedDateTime,webUrl,file,folder&$top=200';

const listsSchema = z.object({
    value: z.array(z.object({ id: z.uuid(), displayName: z.string().nullish(), name: z.string().nullish(), list: z.object({ template: z.string().nullish() }).loose().nullish() })),
    '@odata.nextLink': z.string().optional(),
});

const itemSchema = z.object({
    id: z.string(),
    name: z.string(),
    size: z.number().nullish(),
    lastModifiedDateTime: z.string().nullish(),
    webUrl: z.url().nullish(),
    file: z.object({}).loose().nullish(),
    folder: z.object({}).loose().nullish(),
});
const childrenSchema = z.object({ value: z.array(itemSchema), '@odata.nextLink': z.string().optional() });

export interface FileSourceOptions {
    siteId: string;
    /** Map in de standaard documentbibliotheek, bv. "/Sjablonen". */
    rootPath: string;
    ttlMs: number;
    maxFileBytes: number;
    /** Maximale grootte voor ruwe downloads (download_sjabloon). */
    maxDownloadBytes: number;
    exchange: TokenExchanger;
    download: FileDownloader;
    now?: () => number;
}

interface UserCache { base?: string; files?: { data: { files: FileMeta[]; truncated: boolean }; at: number }; texts: Map<string, { tekst: string; at: number }>; raw: Map<string, { data: Buffer; at: number }> }

/**
 * Bestanden per aangemelde gebruiker (OBO): de Graph-rechten van de gebruiker zijn bepalend. Alleen bestanden die in de
 * lijst onder de geconfigureerde map staan zijn leesbaar; Word, PowerPoint, pdf en platte tekst worden omgezet. Alleen GET.
 */
export function createGraphFileSources(graph: GraphReader, opts: FileSourceOptions): FileSourceFactory {
    const now = opts.now ?? Date.now;
    const caches = new Map<string, UserCache>();
    const rootSegments = opts.rootPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');

    const cacheFor = (key: string): UserCache => {
        let c = caches.get(key);
        if (c) caches.delete(key);
        c ??= { texts: new Map(), raw: new Map() };
        caches.set(key, c);
        while (caches.size > MAX_USERS) caches.delete(caches.keys().next().value as string);
        return c;
    };

    return (user) => {
        const cache = cacheFor(user.key);
        let graphToken: Promise<string> | undefined;
        const token = () => (graphToken ??= opts.exchange(user.token));
        const get = async (path: string) => graph.get(path, await token());
        const reset = () => { cache.files = undefined; cache.base = undefined; cache.texts.clear(); cache.raw.clear(); };

        /**
         * `/Sjablonen/Sub`: bestaat er een documentbibliotheek met de naam van het eerste segment, dan is dat de bibliotheek
         * (rest = map daarin). Anders is het een map in de standaardbibliotheek van de site.
         */
        async function resolveBase(): Promise<{ base: string; folder: string }> {
            const [first = '', ...rest] = opts.rootPath.split('/').filter(Boolean);
            let next: string | undefined = `/sites/${opts.siteId}/lists?$select=id,displayName,name,list&$top=200`;
            for (let i = 0; next && i < 5; i++) {
                const page: z.infer<typeof listsSchema> = listsSchema.parse(await get(next));
                const lib = page.value.find((l) => l.list?.template === 'documentLibrary' && [l.displayName, l.name].some((n) => n?.toLowerCase() === first.toLowerCase()));
                if (lib) return { base: `/sites/${opts.siteId}/lists/${lib.id.toLowerCase()}/drive`, folder: rest.map(encodeURIComponent).join('/') };
                next = page['@odata.nextLink'];
            }
            return { base: `/sites/${opts.siteId}/drive`, folder: rootSegments };
        }

        async function fetchFiles() {
            const { base, folder } = await resolveBase();
            cache.base = base;
            let root: z.infer<typeof itemSchema>;
            try {
                root = itemSchema.parse(await get(folder ? `${base}/root:/${folder}` : `${base}/root`));
            } catch (e) {
                if (e instanceof SourceUnavailableError && e.message === 'Graph status 404') throw new FolderNotFoundError('Map niet gevonden');
                throw e;
            }
            if (!root.folder) throw new FolderNotFoundError('Pad is geen map');
            const files: FileMeta[] = [];
            let truncated = false;
            const queue: { id: string; path: string; depth: number }[] = [{ id: root.id, path: '', depth: 0 }];
            for (const dir of queue) {
                if (truncated) break;
                let next: string | undefined = `${base}/items/${dir.id}/children?${SELECT}`;
                while (next && !truncated) {
                    const page: z.infer<typeof childrenSchema> = childrenSchema.parse(await get(next));
                    for (const it of page.value) {
                        const pad = dir.path ? `${dir.path}/${it.name}` : it.name;
                        if (it.folder) {
                            if (dir.depth + 1 < MAX_DEPTH) queue.push({ id: it.id, path: pad, depth: dir.depth + 1 });
                            else truncated = true;
                        } else if (it.file) {
                            if (files.length >= MAX_ITEMS) { truncated = true; break; }
                            files.push({
                                id: it.id, naam: it.name, pad, type: extensionOf(it.name), grootte: it.size ?? 0,
                                gewijzigd: it.lastModifiedDateTime ?? null, url: it.webUrl ?? null, leesbaar: isReadable(it.name),
                            });
                        }
                    }
                    next = page['@odata.nextLink'];
                }
            }
            files.sort((a, b) => a.pad.localeCompare(b.pad) || a.id.localeCompare(b.id));
            return { files, truncated };
        }

        async function guardedGraph<T>(fn: () => Promise<T>): Promise<T> {
            try {
                return await fn();
            } catch (e) {
                if (e instanceof AccessDeniedError) reset();
                throw e;
            }
        }

        async function files() {
            if (cache.files && now() - cache.files.at <= opts.ttlMs) return { ...cache.files.data, at: cache.files.at };
            const data = await guardedGraph(fetchFiles);
            cache.files = { data, at: now() };
            return { ...data, at: cache.files.at };
        }

        return {
            async list() {
                const f = await files();
                return { files: f.files, truncated: f.truncated, fetchedAt: new Date(f.at), stale: false };
            },
            async bytes(id) {
                const f = await files();
                const file = f.files.find((x) => x.id === id);
                if (!file) return null;
                if (file.grootte > opts.maxDownloadBytes) throw new FileUnreadableError(`Het bestand is te groot om te downloaden (maximaal ${Math.floor(opts.maxDownloadBytes / 1024)} KB).`);
                const key = `${file.id}:${file.gewijzigd ?? ''}`;
                const hit = cache.raw.get(key);
                if (hit && now() - hit.at <= opts.ttlMs) return { file, data: hit.data, fetchedAt: new Date(hit.at), stale: false };
                let data: Buffer;
                try {
                    data = await guardedGraph(async () => opts.download.download(`${cache.base ?? `/sites/${opts.siteId}/drive`}/items/${file.id}/content`, await token(), opts.maxDownloadBytes));
                } catch (e) {
                    if (e instanceof FileTooLargeError) throw new FileUnreadableError('Het bestand is te groot om te downloaden.');
                    throw e;
                }
                cache.raw.delete(key);
                cache.raw.set(key, { data, at: now() });
                while (cache.raw.size > 3) cache.raw.delete(cache.raw.keys().next().value as string);
                return { file, data, fetchedAt: new Date(now()), stale: false };
            },
            async read(id) {
                const f = await files();
                const file = f.files.find((x) => x.id === id);
                if (!file) return null;
                if (!file.leesbaar) throw new FileUnreadableError(`Bestandstype .${file.type || '?'} wordt niet ondersteund (alleen Word, PowerPoint, pdf en tekst).`);
                if (file.grootte > opts.maxFileBytes) throw new FileUnreadableError('Het bestand is te groot om te lezen.');
                const key = `${file.id}:${file.gewijzigd ?? ''}`;
                const hit = cache.texts.get(key);
                if (hit && now() - hit.at <= opts.ttlMs) return { file, tekst: hit.tekst, fetchedAt: new Date(hit.at), stale: false };
                let tekst: string;
                try {
                    const data = await guardedGraph(async () => opts.download.download(`${cache.base ?? `/sites/${opts.siteId}/drive`}/items/${file.id}/content`, await token(), opts.maxFileBytes));
                    tekst = await extractText(file.naam, data);
                } catch (e) {
                    if (e instanceof FileTooLargeError) throw new FileUnreadableError('Het bestand is te groot om te lezen.');
                    throw e;
                }
                cache.texts.delete(key);
                cache.texts.set(key, { tekst, at: now() });
                while (cache.texts.size > MAX_TEXTS) cache.texts.delete(cache.texts.keys().next().value as string);
                return { file, tekst, fetchedAt: new Date(now()), stale: false };
            },
        };
    };
}
