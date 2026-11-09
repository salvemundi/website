import QRCode from 'qrcode';

export interface QrMatrix {
    size: number;
    version: number;
    /** Huidige waarde per module (rij * size + kolom), 1 = donker. */
    data: Uint8Array;
    /** 1 = functiemodule (zoekpatronen, timing, formaatinfo), die mag niet veranderen. */
    reserved: Uint8Array;
    dark: (row: number, col: number) => boolean;
}

export interface QrSvgOptions {
    matrix: QrMatrix;
    margin: number;
    size: number;
    fg: string;
    bg: string;
    /** Kleur per module (rij * size + kolom) vanuit het logo, of null/undefined voor de voorgrondkleur. */
    colors?: (string | null)[] | null;
}

const FINDER = 7;
const DOT_RADIUS = 0.38;
const LOGO_DOT_RADIUS = 0.5;
const PLAIN_DOT_RADIUS = 0.42;

/** Foutcorrectie is altijd niveau H (30%). `minVersion` maakt het raster fijner zodat het logo meer detail krijgt. */
export function buildMatrix(value: string, minVersion: number | null): QrMatrix {
    const text = value || ' ';
    let qr: ReturnType<typeof QRCode.create>;
    try {
        qr = minVersion ? QRCode.create(text, { errorCorrectionLevel: 'H', version: minVersion }) : QRCode.create(text, { errorCorrectionLevel: 'H' });
    } catch {
        qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
    }
    const { modules, version } = qr;
    return makeMatrix(modules.size, version, modules.data, modules.reservedBit);
}

function makeMatrix(size: number, version: number, data: Uint8Array, reserved: Uint8Array): QrMatrix {
    return { size, version, data, reserved, dark: (row, col) => data.at(row * size + col) === 1 };
}

// Foutcorrectie-structuur voor niveau H: aantal blokken en totaal aantal EC-codewoorden per versie (1 t/m 40).
const BLOCKS_H = [1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81];
const EC_TOTAL_H = [17, 28, 44, 64, 88, 112, 130, 156, 192, 224, 264, 308, 352, 384, 432, 480, 532, 588, 650, 700, 750, 816, 900, 960, 1050, 1110, 1200, 1260, 1350, 1440, 1530, 1620, 1710, 1800, 1890, 1980, 2100, 2220, 2310, 2430];
// Aandeel van de correctiecapaciteit dat we maximaal gebruiken, de rest is veiligheidsmarge voor slechte scans.
const SAFE_CAPACITY = 0.7;

interface Layout {
    /** Codewoord-index per module, of -1 voor functiemodules en restbits. */
    codewordOf: Int32Array;
    /** Blok waar elk codewoord bij hoort (na interleaving). */
    blockOf: number[];
    blocks: number;
    /** Aantal codewoordfouten dat per blok gecorrigeerd kan worden. */
    correctable: number;
}

/** Zet elke datamodule om naar het codewoord waar hij in zit (zigzagvolgorde uit de QR-specificatie). */
function buildLayout(matrix: QrMatrix): Layout | null {
    const { size, reserved, version } = matrix;
    const codewordOf = new Int32Array(size * size).fill(-1);
    const order: number[] = [];
    let direction = -1;
    let row = size - 1;
    for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        for (;;) {
            for (let c = 0; c < 2; c++) {
                const idx = row * size + col - c;
                if (reserved.at(idx) !== 1) order.push(idx);
            }
            row += direction;
            if (row < 0 || row >= size) {
                row -= direction;
                direction = -direction;
                break;
            }
        }
    }

    const total = Math.floor(order.length / 8);
    const blocks = BLOCKS_H.at(version - 1);
    const ecTotal = EC_TOTAL_H.at(version - 1);
    if (!blocks || !ecTotal) return null;

    const ecPerBlock = ecTotal / blocks;
    const dataTotal = total - ecTotal;
    const group2 = total % blocks;
    const dataLen: number[] = [];
    for (let b = 0; b < blocks; b++) dataLen.push(Math.floor(dataTotal / blocks) + (b >= blocks - group2 ? 1 : 0));

    const blockOf: number[] = [];
    for (let i = 0; i < Math.max(...dataLen); i++) {
        for (let b = 0; b < blocks; b++) if (i < (dataLen.at(b) ?? 0)) blockOf.push(b);
    }
    for (let i = 0; i < ecPerBlock; i++) {
        for (let b = 0; b < blocks; b++) blockOf.push(b);
    }
    if (blockOf.length !== total) return null;

    order.forEach((idx, n) => {
        if (n < total * 8) codewordOf[idx] = Math.floor(n / 8);
    });
    return { codewordOf, blockOf, blocks, correctable: Math.floor(ecPerBlock / 2) };
}

/**
 * Maakt alle gewenste modules donker, zolang de foutcorrectie dat aankan. Geeft de aangepaste matrix terug,
 * of null als het logo daarvoor te groot is. Het aangepaste gebied telt als "beschadigde" codewoorden, die de foutcorrectie herstelt.
 */
export function forceModules(matrix: QrMatrix, wanted: (string | null)[]): QrMatrix | null {
    const layout = buildLayout(matrix);
    if (!layout) return null;

    const flips: number[] = [];
    const damaged = new Set<number>();
    for (let idx = 0; idx < matrix.data.length; idx++) {
        if (!wanted.at(idx) || matrix.data.at(idx) === 1 || matrix.reserved.at(idx) === 1) continue;
        flips.push(idx);
        const cw = layout.codewordOf.at(idx) ?? -1;
        if (cw >= 0) damaged.add(cw);
    }

    const perBlock = new Array<number>(layout.blocks).fill(0);
    for (const cw of damaged) {
        const b = layout.blockOf.at(cw);
        if (b !== undefined) perBlock[b] = (perBlock.at(b) ?? 0) + 1;
    }
    if (perBlock.some((count) => count > layout.correctable * SAFE_CAPACITY)) return null;

    const data = new Uint8Array(matrix.data);
    for (const idx of flips) data[idx] = 1;
    return makeMatrix(matrix.size, matrix.version, data, matrix.reserved);
}

export function isFinderZone(size: number, row: number, col: number): boolean {
    return (row < FINDER && col < FINDER) || (row < FINDER && col >= size - FINDER) || (row >= size - FINDER && col < FINDER);
}

function n(value: number): string {
    return value.toFixed(3).replace(/\.?0+$/, '');
}

function circlePath(cx: number, cy: number, r: number): string {
    return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`;
}

function finderMarkup(x: number, y: number, color: string): string {
    return `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.8" fill="none" stroke="${color}" stroke-width="1"/>`
        + `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9" fill="${color}"/>`;
}

export function buildSvg({ matrix, margin, size, fg, bg, colors }: QrSvgOptions): string {
    const total = matrix.size + margin * 2;
    const paths = new Map<string, string>();

    for (let row = 0; row < matrix.size; row++) {
        for (let col = 0; col < matrix.size; col++) {
            if (!matrix.dark(row, col) || isFinderZone(matrix.size, row, col)) continue;
            const logoColor = colors?.at(row * matrix.size + col) ?? null;
            const color = logoColor ?? fg;
            const radius = logoColor ? LOGO_DOT_RADIUS : colors ? DOT_RADIUS : PLAIN_DOT_RADIUS;
            paths.set(color, (paths.get(color) ?? '') + circlePath(col + 0.5, row + 0.5, radius));
        }
    }

    const dots = Array.from(paths, ([color, d]) => `<path d="${d}" fill="${color}"/>`).join('');
    const finders = finderMarkup(0, 0, fg) + finderMarkup(matrix.size - FINDER, 0, fg) + finderMarkup(0, matrix.size - FINDER, fg);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}">`
        + `<rect width="${total}" height="${total}" fill="${bg}"/>`
        + `<g transform="translate(${margin} ${margin})">${dots}${finders}</g></svg>`;
}

/**
 * Bepaalt per module welke logokleur erin zit. Modules die voor minstens de helft onder het logo vallen krijgen de kleur van het logo.
 * De data zelf wordt niet aangepast, dus de code blijft geldig.
 */
export function sampleLogoColors(logo: CanvasImageSource, ratio: number, modules: number, percent: number, recolor: string | null): (string | null)[] {
    const sample = 4;
    const side = modules * sample;
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Array<string | null>(modules * modules).fill(null);

    const lw = (percent / 100) * modules;
    const lh = lw * ratio;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logo, ((modules - lw) / 2) * sample, ((modules - lh) / 2) * sample, lw * sample, lh * sample);
    const { data } = ctx.getImageData(0, 0, side, side);

    const result: (string | null)[] = new Array<string | null>(modules * modules).fill(null);
    for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
            let alpha = 0;
            let r = 0;
            let g = 0;
            let b = 0;
            for (let dy = 0; dy < sample; dy++) {
                for (let dx = 0; dx < sample; dx++) {
                    const i = ((row * sample + dy) * side + col * sample + dx) * 4;
                    const a = data[i + 3] / 255;
                    alpha += a;
                    r += data[i] * a;
                    g += data[i + 1] * a;
                    b += data[i + 2] * a;
                }
            }
            const coverage = alpha / (sample * sample);
            if (coverage < 0.5 || isFinderZone(modules, row, col)) continue;
            if (recolor) {
                result[row * modules + col] = recolor;
            } else {
                const toHex = (v: number) => Math.round(v / alpha).toString(16).padStart(2, '0');
                result[row * modules + col] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            }
        }
    }
    return result;
}
