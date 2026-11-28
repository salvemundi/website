import { inflateRawSync } from 'node:zlib';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { getDocumentProxy } from 'unpdf';

/** Bestand kan niet (veilig) naar tekst worden omgezet; de melding is bedoeld voor de gebruiker en bevat geen inhoud. */
export class FileUnreadableError extends Error {}

const TEXT_TYPES = new Set(['txt', 'md', 'csv']);
const WORD_TYPES = new Set(['docx', 'dotx']);
const SLIDE_TYPES = new Set(['pptx', 'potx']);
const PDF_TYPES = new Set(['pdf']);
const MAX_PDF_PAGES = 100;
// Ruim binnen MCP_REQUEST_TIMEOUT_MS (default 15 s); de lus stopt echt bij de deadline (geen werk op de achtergrond).
const PDF_TIMEOUT_MS = 10_000;
const MAX_ZIP_ENTRIES = 2000;
const MAX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;
// Bovengrens voor geëxtraheerde tekst (tekens): begrenst geheugen in de cache en de kosten van nabewerking.
export const MAX_TEXT_CHARS = 1_000_000;

export const extensionOf = (name: string): string => (name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '');
export const isReadable = (name: string): boolean => [WORD_TYPES, TEXT_TYPES, SLIDE_TYPES, PDF_TYPES].some((t) => t.has(extensionOf(name)));

/**
 * Som van de uitgepakte groottes uit de zip-centrale directory, zonder uit te pakken (bescherming tegen zip-bommen
 * in een container met beperkt geheugen). Onbekende/ZIP64-structuren tellen als ongeldig.
 */
export function zipUncompressedSize(buf: Buffer): number {
    const min = Math.max(0, buf.length - 22 - 0xffff);
    let eocd = -1;
    for (let i = buf.length - 22; i >= min; i--) {
        if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new FileUnreadableError('Het bestand is geen geldig Word-document.');
    const entries = buf.readUInt16LE(eocd + 10);
    let off = buf.readUInt32LE(eocd + 16);
    if (entries > MAX_ZIP_ENTRIES || entries === 0xffff || off === 0xffffffff) throw new FileUnreadableError('Het Word-document is te complex om veilig te lezen.');
    let total = 0;
    for (let n = 0; n < entries; n++) {
        if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) throw new FileUnreadableError('Het bestand is geen geldig Word-document.');
        const size = buf.readUInt32LE(off + 24);
        if (size === 0xffffffff) throw new FileUnreadableError('Het Word-document is te complex om veilig te lezen.');
        total += size;
        off += 46 + buf.readUInt16LE(off + 28) + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32);
    }
    return total;
}

/**
 * Controleert een zip vóór JSZip/mammoth: de opgegeven groottes (centrale directory) moeten kloppen met wat er echt
 * uitgepakt wordt. Een zip die over zijn groottes liegt, zou anders JSZip/mammoth onbegrensd laten uitpakken.
 * Elke entry wordt met een harde uitvoerlimiet (opgegeven grootte) uitgepakt; alleen stored/deflate, geen encryptie.
 */
export function assertSafeZip(buf: Buffer, label: string): void {
    if (zipUncompressedSize(buf) > MAX_UNCOMPRESSED_BYTES) throw new FileUnreadableError(`${label} is te groot om veilig te lezen.`);
    const invalid = () => new FileUnreadableError(`${label} kon niet veilig worden gelezen.`);
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
        if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    const entries = buf.readUInt16LE(eocd + 10);
    let off = buf.readUInt32LE(eocd + 16);
    for (let n = 0; n < entries; n++) {
        const flags = buf.readUInt16LE(off + 8);
        const method = buf.readUInt16LE(off + 10);
        const compSize = buf.readUInt32LE(off + 20);
        const size = buf.readUInt32LE(off + 24);
        const local = buf.readUInt32LE(off + 42);
        off += 46 + buf.readUInt16LE(off + 28) + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32);
        if (flags & 0x1) throw invalid(); // versleuteld
        if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw invalid();
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        if (start + compSize > buf.length) throw invalid();
        const data = buf.subarray(start, start + compSize);
        if (method === 0) {
            if (compSize !== size) throw invalid();
            continue;
        }
        if (method !== 8) throw invalid();
        if (size === 0 && compSize === 0) continue; // lege deflate-entry: niets uit te pakken
        let out: Buffer;
        try {
            out = inflateRawSync(data, { maxOutputLength: Math.max(1, size) });
        } catch {
            throw invalid(); // o.a. ERR_BUFFER_TOO_LARGE: pakt groter uit dan opgegeven
        }
        if (out.length !== size) throw invalid();
    }
}

/**
 * Normaliseert regeleinden en witruimte. Lineair (geen regex met backtracking over lange spatiereeksen) en begrensd op
 * MAX_TEXT_CHARS, zodat een bestand met extreem lange regels de (single-threaded) dienst niet kan blokkeren.
 */
function tidy(t: string): string {
    const cut = t.length > MAX_TEXT_CHARS;
    const out = t
        .slice(0, MAX_TEXT_CHARS)
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((l) => l.replace(/[ \t]+$/, ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return cut ? `${out}\n\n[Let op: de tekst is afgekapt na ${MAX_TEXT_CHARS} tekens.]` : out;
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodeXml = (s: string) =>
    s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_m, g: string) => {
        if (g.startsWith('#')) {
            const code = g.charAt(1).toLowerCase() === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
            return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
        }
        return XML_ENTITIES[g.toLowerCase()] ?? '';
    });

/** Tekst per dia uit een PowerPoint (alleen tekstvakken; geen afbeeldingen, grafieken of notities). */
/** Tekst van alle <a:t>-runs in één alinea; lineaire scan (een regex met [^>]* is kwadratisch op invoer zonder '>'). */
function slideRuns(p: string): string {
    let out = '';
    let i = 0;
    while ((i = p.indexOf('<a:t', i)) !== -1) {
        const c = p.charAt(i + 4);
        if (c !== ' ' && c !== '>') { i += 4; continue; }
        const gt = p.indexOf('>', i);
        if (gt < 0) break;
        const end = p.indexOf('</a:t>', gt);
        if (end < 0) break;
        const inner = p.slice(gt + 1, end);
        if (inner.includes('<')) { i = gt + 1; continue; }
        out += decodeXml(inner);
        i = end + 6;
    }
    return out;
}

async function extractSlides(data: Buffer): Promise<string> {
    assertSafeZip(data, 'De presentatie');
    try {
        const zip = await JSZip.loadAsync(data);
        const slides = Object.keys(zip.files)
            .map((n) => ({ n, nr: Number(/^ppt\/slides\/slide(\d{1,4})\.xml$/.exec(n)?.[1] ?? NaN) }))
            .filter((s) => Number.isFinite(s.nr))
            .sort((a, b) => a.nr - b.nr);
        const out: string[] = [];
        for (const { n, nr } of slides) {
            const xml = (await zip.file(n)?.async('string')) ?? '';
            const paragraphs = xml.split('</a:p>').map(slideRuns).filter((t) => t.trim());
            if (paragraphs.length) out.push(`[Dia ${nr}]\n${paragraphs.join('\n')}`);
        }
        return tidy(out.join('\n\n'));
    } catch (e) {
        if (e instanceof FileUnreadableError) throw e;
        throw new FileUnreadableError('De presentatie kon niet worden gelezen.');
    }
}

/**
 * Pagina voor pagina (max. MAX_PDF_PAGES), met een deadline die tussen pagina's wordt gecontroleerd en een harde
 * time-out als vangnet. unpdf's extractText verwerkt altijd álle pagina's parallel en zou na een time-out doorlopen.
 */
async function extractPdf(data: Buffer, now: () => number = Date.now): Promise<string> {
    const deadline = now() + PDF_TIMEOUT_MS;
    const tooSlow = () => new FileUnreadableError('De pdf is te complex om binnen de tijd te lezen.');
    let timer: NodeJS.Timeout | undefined;
    let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;
    try {
        const run = async () => {
            // pdf.js neemt de buffer over: geef een kopie.
            pdf = await getDocumentProxy(new Uint8Array(data));
            const total = pdf.numPages;
            const pages: string[] = [];
            for (let nr = 1; nr <= Math.min(total, MAX_PDF_PAGES); nr++) {
                if (now() > deadline) throw tooSlow();
                const page = await pdf.getPage(nr);
                const content = await page.getTextContent();
                page.cleanup();
                const t = content.items.map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : '') : '')).join('').trim();
                if (t) pages.push(`[Pagina ${nr}]\n${t}`);
            }
            if (total > MAX_PDF_PAGES) pages.push(`[Let op: alleen de eerste ${MAX_PDF_PAGES} van ${total} pagina's zijn gelezen.]`);
            return tidy(pages.join('\n\n'));
        };
        const timeout = new Promise<never>((_r, rej) => { timer = setTimeout(() => rej(tooSlow()), PDF_TIMEOUT_MS + 2000); });
        return await Promise.race([run(), timeout]);
    } catch (e) {
        if (e instanceof FileUnreadableError) throw e;
        throw new FileUnreadableError('De pdf kon niet worden gelezen (beschadigd of beveiligd).');
    } finally {
        clearTimeout(timer);
        // Altijd opruimen, ook na een time-out: stopt verdere verwerking en geeft geheugen vrij.
        void pdf?.loadingTask.destroy().catch(() => undefined);
    }
}

/** Letterlijke tekst uit een bestand (Word, PowerPoint, pdf en platte tekst). Gooit FileUnreadableError als dat niet kan. */
export async function extractText(name: string, data: Buffer): Promise<string> {
    const ext = extensionOf(name);
    if (TEXT_TYPES.has(ext)) {
        try {
            return tidy(new TextDecoder('utf-8', { fatal: true }).decode(data));
        } catch {
            throw new FileUnreadableError('Het tekstbestand is niet UTF-8 en kan niet worden gelezen.');
        }
    }
    if (SLIDE_TYPES.has(ext)) return extractSlides(data);
    if (PDF_TYPES.has(ext)) return extractPdf(data);
    if (!WORD_TYPES.has(ext)) throw new FileUnreadableError(`Bestandstype .${ext || '?'} wordt niet ondersteund (alleen Word, PowerPoint, pdf en tekst).`);
    assertSafeZip(data, 'Het Word-document');
    try {
        const { value } = await mammoth.extractRawText({ buffer: data });
        return tidy(value);
    } catch {
        throw new FileUnreadableError('Het Word-document kon niet worden gelezen.');
    }
}
