import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';
import type { UserContext } from '../src/auth/jwt.js';
import { AccessDeniedError, createGraphDownloader, FileTooLargeError, resolveGraphUrl, SourceUnavailableError, type FileDownloader, type GraphReader } from '../src/graph/client.js';
import { extractText, FileUnreadableError, zipUncompressedSize } from '../src/graph/extract.js';
import { createGraphFileSources, FolderNotFoundError } from '../src/graph/files.js';
import { callTool, makeApp, page, rpc, sourceOf } from './helpers.js';

const SITE = 'contoso.sharepoint.com,aaa,bbb';
const user = (key: string): UserContext => ({ key, token: `user-token-${key}`, scopes: ['bijbel.read'] });

async function docx(text: string, extra: Record<string, string | Buffer> = {}): Promise<Buffer> {
    const z = new JSZip();
    z.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    z.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    z.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p><w:p><w:r><w:t>Tweede alinea</w:t></w:r></w:p></w:body></w:document>`);
    for (const [k, v] of Object.entries(extra)) z.file(k, v);
    return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

describe('Graph-pad voor bestanden', () => {
    it('staat alleen leesroutes in de documentbibliotheek toe', () => {
        for (const ok of [
            `/sites/${SITE}/drive/root:/Sjablonen`,
            `/sites/${SITE}/drive/root:/Sjablonen/Sub%20map`,
            `/sites/${SITE}/drive/items/01ABC!x_y-z`,
            `/sites/${SITE}/drive/items/01ABC/children?$select=id,name&$top=200`,
            `/sites/${SITE}/drive/items/01ABC/content`,
            `/sites/${SITE}/drive/root`,
            `/sites/${SITE}/lists?$select=id,displayName,name,list&$top=200`,
            `/sites/${SITE}/lists/9b1e3c52-aaaa-4bbb-8ccc-0123456789ab/drive/root:/Sub`,
            `/sites/${SITE}/lists/9b1e3c52-aaaa-4bbb-8ccc-0123456789ab/drive/items/01A/children`,
        ]) expect(() => resolveGraphUrl(ok), ok).not.toThrow();
        for (const bad of [
            `/sites/${SITE}/drive/root:/..`,
            `/sites/${SITE}/drive/root:/%2E%2E/x`,
            `/sites/${SITE}/drive/root:/a%2Fb`,
            `/sites/${SITE}/drive/root:`,
            `/sites/${SITE}/drive/items/01ABC/permissions`,
            `/sites/${SITE}/drive/items/01ABC/children?$filter=x;y`,
            `/sites/${SITE}/drive/items/..`,
            `/sites/${SITE}/drives/x`,
            `/sites/${SITE}/lists/abc/drive/root`,
            `/sites/${SITE}/lists/9b1e3c52-aaaa-4bbb-8ccc-0123456789ab/items`,
            `/sites/${SITE}/lists/9b1e3c52-aaaa-4bbb-8ccc-0123456789ab/drive/items/01A/permissions`,
            `/sites/${SITE}/lists/9b1e3c52-aaaa-4bbb-8ccc-0123456789ab/drive/root:/..`,
        ]) expect(() => resolveGraphUrl(bad), bad).toThrow();
    });
});

describe('tekstextractie', () => {
    it('leest Word als letterlijke tekst', async () => {
        const t = await extractText('Sjabloon.docx', await docx('Eerste alinea'));
        expect(t).toBe('Eerste alinea\n\nTweede alinea');
        expect(await extractText('Sjabloon.dotx', await docx('Sjabloon'))).toContain('Tweede alinea');
    });
    it('leest tekstbestanden en weigert niet-UTF-8 en onbekende types', async () => {
        expect(await extractText('a.md', Buffer.from('# Kop\r\n\r\n\r\n\r\ntekst'))).toBe('# Kop\n\ntekst');
        await expect(extractText('a.txt', Buffer.from([0xff, 0xfe, 0x00]))).rejects.toBeInstanceOf(FileUnreadableError);
        await expect(extractText('a.psd', Buffer.from('8BPS'))).rejects.toThrow(/niet ondersteund/);
        await expect(extractText('a.xlsx', Buffer.from('x'))).rejects.toBeInstanceOf(FileUnreadableError);
    });
    it('weigert ongeldige zips en zip-bommen voordat er iets wordt uitgepakt', async () => {
        await expect(extractText('a.docx', Buffer.from('dit is geen zip'))).rejects.toBeInstanceOf(FileUnreadableError);
        const bomb = await docx('x', { 'word/media/groot.bin': Buffer.alloc(40 * 1024 * 1024) });
        expect(bomb.length).toBeLessThan(1024 * 1024);
        expect(zipUncompressedSize(bomb)).toBeGreaterThan(30 * 1024 * 1024);
        await expect(extractText('a.docx', bomb)).rejects.toThrow(/te groot/);
    });
});

describe('downloader', () => {
    const body = (b: string) => new Response(new Blob([b]).stream(), { status: 200 });
    it('volgt de voorgetekende link zonder Graph-token en alleen op SharePoint', async () => {
        const f = vi.fn<typeof fetch>()
            .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://contoso.sharepoint.com/_layouts/15/download.aspx?tempauth=abc' } }))
            .mockResolvedValueOnce(body('inhoud'));
        const buf = await createGraphDownloader({ timeoutMs: 1000 }, f).download(`/sites/${SITE}/drive/items/01A/content`, 'graph-token', 100);
        expect(buf.toString()).toBe('inhoud');
        expect((f.mock.calls[0]![1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer graph-token' });
        expect((f.mock.calls[1]![1] as RequestInit).headers).toBeUndefined();
        expect((f.mock.calls[1]![1] as RequestInit).redirect).toBe('error');
    });
    it('weigert andere hosts, te grote bestanden, toegangsfouten en andere paden', async () => {
        const dl = (f: typeof fetch) => createGraphDownloader({ timeoutMs: 1000 }, f);
        const path = `/sites/${SITE}/drive/items/01A/content`;
        const evil = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://evil.example/x' } }));
        await expect(dl(evil).download(path, 't', 100)).rejects.toBeInstanceOf(SourceUnavailableError);
        expect(evil).toHaveBeenCalledTimes(1);
        const big = vi.fn<typeof fetch>().mockResolvedValueOnce(body('x'.repeat(50)));
        await expect(dl(big).download(path, 't', 10)).rejects.toBeInstanceOf(FileTooLargeError);
        const denied = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 403 }));
        await expect(dl(denied).download(path, 't', 10)).rejects.toBeInstanceOf(AccessDeniedError);
        await expect(dl(vi.fn()).download(`/sites/${SITE}/drive/items/01A`, 't', 10)).rejects.toThrow();
    });
});

const item = (id: string, name: string, kind: 'file' | 'folder', size = 100) => ({
    id, name, size, lastModifiedDateTime: '2026-10-01T00:00:00Z', webUrl: `https://contoso.sharepoint.com/sites/bijbel/Shared%20Documents/Sjablonen/${name}`, [kind]: {},
});

const LIB = '9b1e3c52-aaaa-4bbb-8ccc-0123456789ab';

function fakeGraph(mode: 'ok' | 'nofolder' | 'denied' | 'library' = 'ok') {
    const g = {
        calls: [] as string[],
        mode,
        get(u: string) {
            g.calls.push(u);
            if (g.mode === 'denied') return Promise.reject(new AccessDeniedError('403'));
            if (u.includes('/lists?')) {
                const libs = [{ id: LIB.toUpperCase(), displayName: 'Sjablonen', name: 'Sjablonen', list: { template: 'documentLibrary' } }, { id: 'ffffffff-aaaa-4bbb-8ccc-0123456789ab', displayName: 'Sjablonen', list: { template: 'genericList' } }];
                return Promise.resolve({ value: g.mode === 'library' ? libs : [{ id: 'ffffffff-aaaa-4bbb-8ccc-0123456789ab', displayName: 'Documenten', list: { template: 'documentLibrary' } }] });
            }
            if (u.endsWith('/drive/root') || u.includes('/drive/root:/')) return g.mode === 'nofolder' ? Promise.reject(new SourceUnavailableError('Graph status 404')) : Promise.resolve(item('ROOT', 'Sjablonen', 'folder'));
            if (u.includes('/items/ROOT/children')) return Promise.resolve({ value: [item('F1', 'Brief.docx', 'file'), item('D1', 'Sub', 'folder'), item('F2', 'Tabel.xlsx', 'file'), item('F3', 'Groot.docx', 'file', 99_000_000)] });
            if (u.includes('/items/D1/children')) return Promise.resolve({ value: [item('F4', 'Notitie.txt', 'file')] });
            return Promise.reject(new Error('onverwacht pad ' + u));
        },
    } satisfies GraphReader & Record<string, unknown>;
    return g;
}
const fakeDownload = (content: Record<string, Buffer>) => ({ calls: [] as string[], download: vi.fn((path: string) => { const id = /items\/([^/]+)\/content/.exec(path)![1]!; return Promise.resolve(content[id] ?? Buffer.alloc(0)); }) }) satisfies FileDownloader & Record<string, unknown>;

async function setup(mode: 'ok' | 'nofolder' | 'denied' | 'library' = 'ok') {
    const graph = fakeGraph(mode);
    const dl = fakeDownload({ F1: await docx('Geachte lid'), F4: Buffer.from('notitie tekst') });
    const exchange = vi.fn((t: string) => Promise.resolve(`graph-for-${t}`));
    const filesFor = createGraphFileSources(graph, { siteId: SITE, rootPath: '/Sjablonen', ttlMs: 60_000, maxFileBytes: 1_000_000, maxDownloadBytes: 100_000, exchange, download: dl });
    return { graph, dl, exchange, filesFor };
}

describe('bestandsbron', () => {
    it('lijst bestanden recursief met leesbaarheid en geeft de root met gecodeerd pad op', async () => {
        const { graph, filesFor } = await setup();
        const snap = await filesFor(user('a')).list();
        expect(snap.files.map((f) => [f.pad, f.leesbaar])).toEqual([['Brief.docx', true], ['Groot.docx', true], ['Sub/Notitie.txt', true], ['Tabel.xlsx', false]]);
        expect(graph.calls[1]).toBe(`/sites/${SITE}/drive/root:/Sjablonen`);
        expect(graph.calls.every((c) => !/permissions|\/drives\//.test(c))).toBe(true);
    });
    it('gebruikt een documentbibliotheek met de naam van de map en leest daaruit', async () => {
        const { graph, dl, filesFor } = await setup('library');
        const src = filesFor(user('a'));
        expect((await src.list()).files).toHaveLength(4);
        expect(graph.calls.filter((c) => !c.includes('/lists?'))[0]).toBe(`/sites/${SITE}/lists/${LIB}/drive/root`);
        expect(graph.calls.some((c) => c.includes('/drive/root:/Sjablonen'))).toBe(false);
        expect((await src.read('F1'))?.tekst).toContain('Geachte lid');
        expect(dl.download.mock.calls[0]![0]).toBe(`/sites/${SITE}/lists/${LIB}/drive/items/F1/content`);
    });
    it('valt terug op een map in de standaardbibliotheek als er geen bibliotheek met die naam is', async () => {
        const { graph, filesFor } = await setup('ok');
        await filesFor(user('a')).list();
        expect(graph.calls[1]).toBe(`/sites/${SITE}/drive/root:/Sjablonen`);
    });
    it('leest alleen bestanden uit de lijst; onbekend ID, niet-ondersteund type en te groot geven geen download', async () => {
        const { dl, filesFor } = await setup();
        const src = filesFor(user('a'));
        expect((await src.read('F1'))?.tekst).toBe('Geachte lid\n\nTweede alinea');
        expect((await src.read('F4'))?.tekst).toBe('notitie tekst');
        expect(await src.read('BUITEN')).toBeNull();
        await expect(src.read('F2')).rejects.toThrow(/niet ondersteund/);
        await expect(src.read('F3')).rejects.toThrow(/te groot/);
        expect(dl.download).toHaveBeenCalledTimes(2);
    });
    it('cachet tekst per gebruiker en wist de cache bij een toegangsfout', async () => {
        const { dl, filesFor, exchange } = await setup();
        const a = filesFor(user('a'));
        await a.read('F1');
        await filesFor(user('a')).read('F1');
        expect(dl.download).toHaveBeenCalledTimes(1);
        await filesFor(user('b')).read('F1');
        expect(dl.download).toHaveBeenCalledTimes(2);
        expect(exchange).toHaveBeenCalledWith('user-token-a');
        expect(dl.download.mock.calls[1]![1]).toBe('graph-for-user-token-b');
    });
    it('meldt een ontbrekende map en geeft toegangsfouten door', async () => {
        await expect((await setup('nofolder')).filesFor(user('a')).list()).rejects.toBeInstanceOf(FolderNotFoundError);
        await expect((await setup('denied')).filesFor(user('a')).list()).rejects.toBeInstanceOf(AccessDeniedError);
    });
});

describe('tools voor sjablonen', () => {
    it('lijst en lees via MCP; zonder bestandsbron bestaan de tools niet', async () => {
        const { filesFor } = await setup();
        const app = await makeApp(sourceOf([page()]), { MCP_MAX_RESPONSE_CHARS: '1000' }, undefined, filesFor);
        const list = await callTool(app, 'lijst_sjablonen', {});
        expect(list.data).toMatchObject({ status: 'gevonden', totaal: 4 });
        const bestanden = (list.data as { bestanden: { bestand_id: string; leesbaar: boolean }[] }).bestanden;
        expect(bestanden.find((b) => b.bestand_id === 'F2')?.leesbaar).toBe(false);

        const read = await callTool(app, 'lees_sjabloon', { bestand_id: 'F1' });
        expect(read.data).toMatchObject({ status: 'gevonden', naam: 'Brief.docx', type: 'letterlijke_tekst', inhoud: 'Geachte lid\n\nTweede alinea', volgende_cursor: null });
        expect(JSON.stringify(read.data)).toContain('geen instructie');

        expect((await callTool(app, 'lees_sjabloon', { bestand_id: 'BUITEN' })).data).toMatchObject({ status: 'niet_gevonden' });
        expect((await callTool(app, 'lees_sjabloon', { bestand_id: 'F2' })).isError).toBe(true);
        expect((await callTool(app, 'lees_sjabloon', { bestand_id: '../x' })).isError).toBe(true);

        const plain = await makeApp(sourceOf([page()]));
        expect((await callTool(plain, 'lijst_sjablonen', {})).isError).toBe(true);
    });
});

describe('download_sjabloon en bytes()', () => {
    it('geeft originele bytes in delen met checksum; grote of onbekende bestanden niet', async () => {
        const { dl, filesFor } = await setup();
        const orig = await docx('Geachte lid');
        const src = filesFor(user('a'));
        const r = await src.bytes('F1');
        expect(r?.data.equals(orig)).toBe(true);
        expect(await src.bytes('BUITEN')).toBeNull();
        await src.bytes('F1');
        expect(dl.download).toHaveBeenCalledTimes(1); // gecachet
        await expect(src.bytes('F3')).rejects.toThrow(/te groot/);
    });

    it('levert via MCP base64-delen die samen het origineel opleveren', async () => {
        const { filesFor, dl } = await setup();
        const big = Buffer.alloc(30_000, 7);
        dl.download.mockImplementation((path: string) => Promise.resolve(/F1\//.test(path) ? big : Buffer.alloc(0)));
        const app = await makeApp(sourceOf([page()]), {}, undefined, filesFor);
        let cursor: string | undefined;
        let b64 = '';
        let parts = 0;
        let sha = '';
        do {
            const r = await callTool(app, 'download_sjabloon', { bestand_id: 'F1', ...(cursor ? { cursor } : {}) });
            const d = r.data as { base64: string; volgende_cursor: string | null; sha256_totaal: string; deel: { van: number } };
            expect(r.isError).toBe(false);
            b64 += d.base64;
            sha = d.sha256_totaal;
            parts++;
            cursor = d.volgende_cursor ?? undefined;
        } while (cursor);
        expect(parts).toBe(3);
        const joined = Buffer.from(b64, 'base64');
        expect(joined.equals(big)).toBe(true);
        expect(createHash('sha256').update(joined).digest('hex')).toBe(sha);

        expect((await callTool(app, 'download_sjabloon', { bestand_id: 'F1', cursor: '5' })).data).toMatchObject({ status: 'niet_gevonden' });
        expect((await callTool(app, 'download_sjabloon', { bestand_id: 'BUITEN' })).data).toMatchObject({ status: 'niet_gevonden' });
        expect((await callTool(app, 'download_sjabloon', { bestand_id: 'F3' })).isError).toBe(true);
        expect((await callTool(app, 'download_sjabloon', { bestand_id: '../x' })).isError).toBe(true);
    });
});

describe('prompts', () => {
    it('biedt werkwijzen aan; vul_sjabloon_in alleen met bestandsbron', async () => {
        const { filesFor } = await setup();
        const withFiles = await makeApp(sourceOf([page()]), {}, undefined, filesFor);
        const list = (await rpc(withFiles, 'prompts/list', {})).json<{ result: { prompts: { name: string }[] } }>();
        expect(list.result.prompts.map((p) => p.name).sort()).toEqual(['beantwoord_vraag', 'controleer_tegen_bijbel', 'vul_sjabloon_in']);
        const got = (await rpc(withFiles, 'prompts/get', { name: 'vul_sjabloon_in', arguments: { sjabloon: 'Brief', gegevens: 'Naam: Jan' } })).json<{ result: { messages: { content: { text: string } }[] } }>();
        expect(got.result.messages[0]!.content.text).toContain('lijst_sjablonen');
        expect(got.result.messages[0]!.content.text).toContain('Naam: Jan');

        const plain = await makeApp(sourceOf([page()]));
        const l2 = (await rpc(plain, 'prompts/list', {})).json<{ result: { prompts: { name: string }[] } }>();
        expect(l2.result.prompts.map((p) => p.name).sort()).toEqual(['beantwoord_vraag', 'controleer_tegen_bijbel']);
        const q = (await rpc(plain, 'prompts/get', { name: 'beantwoord_vraag', arguments: { vraag: 'Mag je alcohol drinken?' } })).json<{ result: { messages: { content: { text: string } }[] } }>();
        expect(q.result.messages[0]!.content.text).toContain('Mag je alcohol drinken?');
    });
});

function tinyPdf(lines: string[]): Buffer {
    const stream = `BT /F1 12 Tf 72 720 Td ${lines.map((l, i) => `${i ? '0 -20 Td ' : ''}(${l}) Tj`).join(' ')} ET`;
    const objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    let out = '%PDF-1.4\n';
    const offsets: number[] = [];
    objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(out, 'latin1');
}

async function pptx(slides: string[][]): Promise<Buffer> {
    const z = new JSZip();
    z.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    slides.forEach((paras, i) => z.file(`ppt/slides/slide${i + 1}.xml`, `<p:sld xmlns:a="x" xmlns:p="y"><p:cSld><p:spTree>${paras.map((t) => `<p:sp><p:txBody><a:p><a:r><a:t>${t}</a:t></a:r></a:p></p:txBody></p:sp>`).join('')}</p:spTree></p:cSld></p:sld>`));
    z.file('ppt/slides/slide10.xml', '<a:p><a:r><a:t>Tiende</a:t></a:r></a:p>');
    return z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

describe('pdf en powerpoint', () => {
    it('leest tekst per dia in slidevolgorde en decodeert XML-entiteiten', async () => {
        const t = await extractText('Slide Template.pptx', await pptx([['Welkom &amp; hallo', 'Tweede regel'], ['Dia twee &lt;ok&gt;']]));
        expect(t).toBe('[Dia 1]\nWelkom & hallo\nTweede regel\n\n[Dia 2]\nDia twee <ok>\n\n[Dia 10]\nTiende');
    });
    it('weigert een kapotte presentatie met een nette melding', async () => {
        await expect(extractText('x.pptx', Buffer.from('geen zip'))).rejects.toBeInstanceOf(FileUnreadableError);
    });
    it('leest de tekstlaag van een pdf met paginanummers', async () => {
        const t = await extractText('NDA.pdf', tinyPdf(['Geheimhouding tussen partijen', 'Tweede regel']));
        expect(t).toContain('[Pagina 1]');
        expect(t).toContain('Geheimhouding tussen partijen');
    });
    it('weigert een ongeldige pdf met een nette melding', async () => {
        await expect(extractText('x.pdf', Buffer.from('%PDF-1.4 kapot'))).rejects.toBeInstanceOf(FileUnreadableError);
    });
});
