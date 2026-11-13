import JSZip from 'jszip';
import mammoth from 'mammoth';
import { extractText as pdfText, getDocumentProxy } from 'unpdf';

/** Bestand kan niet (veilig) naar tekst worden omgezet; de melding is bedoeld voor de gebruiker en bevat geen inhoud. */
export class FileUnreadableError extends Error {}

const TEXT_TYPES = new Set(['txt', 'md', 'csv']);
const WORD_TYPES = new Set(['docx', 'dotx']);
const SLIDE_TYPES = new Set(['pptx', 'potx']);
const PDF_TYPES = new Set(['pdf']);
const MAX_PDF_PAGES = 100;
const PDF_TIMEOUT_MS = 20_000;
const MAX_ZIP_ENTRIES = 2000;
const MAX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;

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

const tidy = (t: string) => t.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

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
async function extractSlides(data: Buffer): Promise<string> {
    if (zipUncompressedSize(data) > MAX_UNCOMPRESSED_BYTES) throw new FileUnreadableError('De presentatie is te groot om veilig te lezen.');
    try {
        const zip = await JSZip.loadAsync(data);
        const slides = Object.keys(zip.files)
            .map((n) => ({ n, nr: Number(/^ppt\/slides\/slide(\d{1,4})\.xml$/.exec(n)?.[1] ?? NaN) }))
            .filter((s) => Number.isFinite(s.nr))
            .sort((a, b) => a.nr - b.nr);
        const out: string[] = [];
        for (const { n, nr } of slides) {
            const xml = (await zip.file(n)?.async('string')) ?? '';
            const paragraphs = xml.split('</a:p>').map((p) => [...p.matchAll(/<a:t(?: [^>]*)?>([^<]*)<\/a:t>/g)].map((m) => decodeXml(m[1])).join('')).filter((t) => t.trim());
            if (paragraphs.length) out.push(`[Dia ${nr}]\n${paragraphs.join('\n')}`);
        }
        return tidy(out.join('\n\n'));
    } catch (e) {
        if (e instanceof FileUnreadableError) throw e;
        throw new FileUnreadableError('De presentatie kon niet worden gelezen.');
    }
}

async function extractPdf(data: Buffer): Promise<string> {
    let timer: NodeJS.Timeout | undefined;
    try {
        const run = async () => {
            // pdf.js neemt de buffer over: geef een kopie.
            const pdf = await getDocumentProxy(new Uint8Array(data));
            const { text } = await pdfText(pdf, { mergePages: false });
            const pages = text.slice(0, MAX_PDF_PAGES).map((t, i) => (t.trim() ? `[Pagina ${i + 1}]\n${t.trim()}` : ''));
            if (text.length > MAX_PDF_PAGES) pages.push(`[Let op: alleen de eerste ${MAX_PDF_PAGES} van ${text.length} pagina's zijn gelezen.]`);
            return tidy(pages.filter(Boolean).join('\n\n'));
        };
        const timeout = new Promise<never>((_r, rej) => { timer = setTimeout(() => rej(new FileUnreadableError('De pdf is te complex om binnen de tijd te lezen.')), PDF_TIMEOUT_MS); });
        return await Promise.race([run(), timeout]);
    } catch (e) {
        if (e instanceof FileUnreadableError) throw e;
        throw new FileUnreadableError('De pdf kon niet worden gelezen (beschadigd of beveiligd).');
    } finally {
        clearTimeout(timer);
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
    if (zipUncompressedSize(data) > MAX_UNCOMPRESSED_BYTES) throw new FileUnreadableError('Het Word-document is te groot om veilig te lezen.');
    try {
        const { value } = await mammoth.extractRawText({ buffer: data });
        return tidy(value);
    } catch {
        throw new FileUnreadableError('Het Word-document kon niet worden gelezen.');
    }
}
