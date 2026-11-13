import mammoth from 'mammoth';

/** Bestand kan niet (veilig) naar tekst worden omgezet; de melding is bedoeld voor de gebruiker en bevat geen inhoud. */
export class FileUnreadableError extends Error {}

const TEXT_TYPES = new Set(['txt', 'md', 'csv']);
const WORD_TYPES = new Set(['docx', 'dotx']);
const MAX_ZIP_ENTRIES = 2000;
const MAX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;

export const extensionOf = (name: string): string => (name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '');
export const isReadable = (name: string): boolean => WORD_TYPES.has(extensionOf(name)) || TEXT_TYPES.has(extensionOf(name));

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

/** Letterlijke tekst uit een bestand (alleen Word en platte tekst). Gooit FileUnreadableError als dat niet kan. */
export async function extractText(name: string, data: Buffer): Promise<string> {
    const ext = extensionOf(name);
    if (TEXT_TYPES.has(ext)) {
        try {
            return tidy(new TextDecoder('utf-8', { fatal: true }).decode(data));
        } catch {
            throw new FileUnreadableError('Het tekstbestand is niet UTF-8 en kan niet worden gelezen.');
        }
    }
    if (!WORD_TYPES.has(ext)) throw new FileUnreadableError(`Bestandstype .${ext || '?'} wordt niet ondersteund (alleen Word en tekst).`);
    if (zipUncompressedSize(data) > MAX_UNCOMPRESSED_BYTES) throw new FileUnreadableError('Het Word-document is te groot om veilig te lezen.');
    try {
        const { value } = await mammoth.extractRawText({ buffer: data });
        return tidy(value);
    } catch {
        throw new FileUnreadableError('Het Word-document kon niet worden gelezen.');
    }
}
