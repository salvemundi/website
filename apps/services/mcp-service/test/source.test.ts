import { describe, expect, it } from 'vitest';
import type { UserContext } from '../src/auth/jwt.js';
import { AccessDeniedError, createGraphReader, resolveGraphUrl, SourceUnavailableError, type GraphReader } from '../src/graph/client.js';
import { createGraphBijbelSources, htmlToText } from '../src/graph/source.js';
import { baseEnv, config } from './helpers.js';

const SITE = 'contoso.sharepoint.com,aaa,bbb';
const id = (n: number) => `3f2b8a52-7c1e-4f6a-9d0b-1a2b3c4d5e${String(n).padStart(2, '0')}`;
const meta = (n: number, level: string | null, path: string) => ({
    id: id(n), title: `P${n}`, webUrl: `https://contoso.sharepoint.com${path}`, lastModifiedDateTime: '2026-10-01T00:00:00Z',
    ...(level ? { publishingState: { level } } : {}),
});
const detail = (m: ReturnType<typeof meta>, html: string) => ({ ...m, canvasLayout: { horizontalSections: [{ columns: [{ webparts: [{ innerHtml: html }] }] }] } });
const HTML = '<h2>Kop</h2><p>Tekst &amp; meer</p><script>alert(1)</script>';

const listing = [
    meta(1, 'published', '/sites/bijbel/SitePages/a.aspx'),
    meta(2, 'draft', '/sites/bijbel/SitePages/b.aspx'),
    meta(3, 'published', '/sites/prive/SitePages/c.aspx'),
    meta(4, null, '/sites/bijbel/SitePages/d.aspx'), // ontbrekende publishingState = niet gepubliceerd
];

function fakeGraph(items = listing) {
    const g = {
        calls: [] as { url: string; token: string }[],
        mode: 'ok' as 'ok' | 'down' | 'denied',
        draftNow: false,
        get(u: string, token: string) {
            g.calls.push({ url: u, token });
            if (g.mode === 'down') return Promise.reject(new SourceUnavailableError('down'));
            if (g.mode === 'denied') return Promise.reject(new AccessDeniedError('403'));
            if (u.includes('?$select')) return Promise.resolve({ value: items });
            const m = items.find((x) => u.includes(x.id))!;
            return Promise.resolve(detail(g.draftNow ? { ...m, publishingState: { level: 'draft' } } : m, HTML));
        },
    } satisfies GraphReader & Record<string, unknown>;
    return g;
}

const user = (key: string): UserContext => ({ key, token: `user-token-${key}`, scopes: ['bijbel.read'] });
const exchange = (t: string) => Promise.resolve(`graph-for-${t}`);
const opts = (over: Record<string, unknown> = {}) => ({ siteId: SITE, pathPrefix: '/sites/bijbel/', ttlMs: 1000, maxStaleMs: 5000, exchange, ...over });

describe('bron: alleen gepubliceerde, toegestane inhoud', () => {
    it('sluit concepten, pagina\'s zonder publicatiestatus en pagina\'s buiten het pad uit en haalt die niet op', async () => {
        const g = fakeGraph();
        const src = createGraphBijbelSources(g, opts())(user('u1'));
        expect((await src.list()).pages.map((p) => p.id)).toEqual([id(1)]);
        const snap = await src.searchSet(50);
        expect(snap.pages.map((p) => p.id)).toEqual([id(1)]);
        expect(snap.pages[0]?.secties[0]).toMatchObject({ titel: 'Kop', tekst: 'Kop\nTekst & meer' });
        for (const n of [2, 3, 4]) expect(g.calls.some((c) => c.url.includes(id(n)))).toBe(false);
        expect(await src.read(id(2))).toBeNull();
        expect(await src.read(id(4))).toBeNull();
    });

    it('controleert publicatiestatus opnieuw op de detailrespons (concept geworden = niet leesbaar)', async () => {
        const g = fakeGraph();
        g.draftNow = true;
        const src = createGraphBijbelSources(g, opts())(user('u1'));
        expect(await src.read(id(1))).toBeNull();
    });

    it('gebruikt het OBO-Graph-token van de gebruiker, nooit het gebruikerstoken zelf', async () => {
        const g = fakeGraph();
        await createGraphBijbelSources(g, opts())(user('u1')).list();
        expect(g.calls.every((c) => c.token === 'graph-for-user-token-u1')).toBe(true);
    });

    it('begrenst het zoekbereik tot max pagina\'s en rapporteert het totaal', async () => {
        const items = Array.from({ length: 7 }, (_, i) => meta(i + 10, 'published', `/sites/bijbel/SitePages/p${i}.aspx`));
        const s = await createGraphBijbelSources(fakeGraph(items), opts())(user('u1')).searchSet(3);
        expect(s.pages).toHaveLength(3);
        expect(s.totaal).toBe(7);
    });

    it('cache is per gebruiker: een andere gebruiker krijgt geen gecachete inhoud van iemand anders', async () => {
        const g = fakeGraph();
        const f = createGraphBijbelSources(g, opts());
        await f(user('u1')).list();
        const n = g.calls.length;
        await f(user('u1')).list(); // zelfde gebruiker: cache
        expect(g.calls.length).toBe(n);
        await f(user('u2')).list(); // andere gebruiker: eigen Graph-aanroep met eigen token
        expect(g.calls.length).toBe(n + 1);
        expect(g.calls.at(-1)?.token).toBe('graph-for-user-token-u2');
    });

    it('cache: actueel binnen TTL, gemarkeerd als stale bij storing, fout na max-stale', async () => {
        const g = fakeGraph();
        let t = 0;
        const f = createGraphBijbelSources(g, opts({ now: () => t }));
        expect((await f(user('u1')).list()).stale).toBe(false);
        g.mode = 'down';
        t = 500;
        expect((await f(user('u1')).list()).stale).toBe(false);
        t = 3000;
        expect((await f(user('u1')).list()).stale).toBe(true);
        t = 9000;
        await expect(f(user('u1')).list()).rejects.toThrow();
    });

    it('bij 403 wordt de cache gewist en nooit stale data geleverd (geen bredere rechten, geen oude inhoud)', async () => {
        const g = fakeGraph();
        let t = 0;
        const f = createGraphBijbelSources(g, opts({ now: () => t }));
        await f(user('u1')).list();
        g.mode = 'denied';
        t = 3000;
        await expect(f(user('u1')).list()).rejects.toThrow(AccessDeniedError);
        g.mode = 'down';
        await expect(f(user('u1')).list()).rejects.toThrow(); // cache is weg, dus ook geen stale
    });

    it('htmlToText verwijdert tags/scripts en behoudt tekst', () => {
        expect(htmlToText('<p>a&nbsp;b</p><style>x{}</style><p>c</p>')).toBe('a b\nc');
    });
});

describe('Graph-client: alleen GET naar vaste, gevalideerde URL\'s', () => {
    it('accepteert alleen sites/pages-paden en Graph-nextLinks', () => {
        expect(resolveGraphUrl(`/sites/${SITE}/pages/microsoft.graph.sitePage?$top=100`).origin).toBe('https://graph.microsoft.com');
        for (const bad of [
            '/users', '/me/messages', `/sites/${SITE}/drive/root/children`, `/sites/${SITE}/drive/items/x/permissions`, `/sites/${SITE}/pages/../../users`, '//evil.example/sites/x/pages',
            'https://evil.example/v1.0/sites/x/pages', 'http://graph.microsoft.com/v1.0/sites/x/pages', 'https://graph.microsoft.com/v1.0/users',
            'https://user@graph.microsoft.com/v1.0/sites/x/pages', `/sites/${SITE}/pages?$x=<script>`,
        ]) {
            expect(() => resolveGraphUrl(bad), bad).toThrow();
        }
    });

    it('doet uitsluitend GET zonder redirects; 403 wordt AccessDenied en lekt geen token', async () => {
        const seen: { method?: string; redirect?: string; url: string }[] = [];
        const f = ((url: URL, init: RequestInit) => {
            seen.push({ method: init.method, redirect: init.redirect, url: url.toString() });
            return Promise.resolve(new Response('nope', { status: 403 }));
        }) as unknown as typeof fetch;
        const g = createGraphReader({ timeoutMs: 1000 }, f);
        await expect(g.get(`/sites/${SITE}/pages`, 'topsecret-token')).rejects.toThrow(AccessDeniedError);
        expect(seen).toEqual([{ method: 'GET', redirect: 'error', url: `https://graph.microsoft.com/v1.0/sites/${SITE}/pages` }]);
        await expect(g.get('/users', 'topsecret-token')).rejects.not.toThrow(/topsecret/);
        const f500 = (() => Promise.resolve(new Response('x', { status: 500 }))) as unknown as typeof fetch;
        await expect(createGraphReader({ timeoutMs: 1000 }, f500).get(`/sites/${SITE}/pages`, 't')).rejects.toThrow(SourceUnavailableError);
    });
});

describe('configuratie en omgevingsscheiding', () => {
    it('faalt zonder verplichte waarden en lekt geen secrets in de fout', () => {
        expect(() => config({ MCP_ENTRA_TENANT_ID: undefined })).toThrow(/MCP_ENTRA_TENANT_ID/);
        try {
            config({ MCP_SHAREPOINT_SITE_ID: 'x', MCP_ENTRA_CLIENT_SECRET: '' });
        } catch (e) {
            expect(String(e)).not.toContain(baseEnv.MCP_ENTRA_CLIENT_SECRET);
        }
        expect(() => config({ MCP_PUBLIC_URL: 'http://mcp.example.nl' })).toThrow();
    });
    it('schrijven kan niet worden ingeschakeld: BIJBEL_WRITE_ENABLED=true blokkeert het opstarten', () => {
        expect(config().BIJBEL_WRITE_ENABLED).toBe('false');
        expect(() => config({ BIJBEL_WRITE_ENABLED: 'true' })).toThrow(/alleen-lezen/);
        expect(() => config({ BIJBEL_WRITE_ENABLED: '1' })).toThrow();
    });
    it('acceptance en productie krijgen volledig eigen waarden (geen impliciete defaults voor secrets/site/tenant/app)', () => {
        const acc = config();
        const prod = config({ APP_ENV: 'prod', MCP_PUBLIC_URL: 'https://mcp.example.nl', MCP_SHAREPOINT_SITE_ID: 'contoso.sharepoint.com,ccc,ddd', MCP_ENTRA_CLIENT_ID: '44444444-4444-4444-8444-444444444444' });
        expect(acc.MCP_SHAREPOINT_SITE_ID).not.toBe(prod.MCP_SHAREPOINT_SITE_ID);
        expect(acc.MCP_ENTRA_CLIENT_ID).not.toEqual(prod.MCP_ENTRA_CLIENT_ID);
        for (const k of ['MCP_ENTRA_TENANT_ID', 'MCP_ENTRA_CLIENT_ID', 'MCP_ENTRA_CLIENT_SECRET', 'MCP_SHAREPOINT_SITE_ID', 'MCP_PUBLIC_URL']) {
            expect(() => config({ [k]: undefined }), k).toThrow();
        }
    });
});
