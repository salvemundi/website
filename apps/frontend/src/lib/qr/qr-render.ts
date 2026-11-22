import QRCode from 'qrcode';
import { BRAND_COLORS } from '@/lib/config/theme';

export type QrLogoStyle = 'kleur' | 'eenkleurig';
export type QrDetailLevel = 'laag' | 'midden' | 'hoog';

export interface QrMatrix {
    size: number;
    version: number;
    data: Uint8Array;
    reserved: Uint8Array;
    dark: (row: number, col: number) => boolean;
}

export interface QrSvgOptions {
    matrix: QrMatrix;
    margin: number;
    size: number;
    fg: string;
    bg: string;
    colors?: (string | null)[] | null;
}

export interface LogoRgba {
    width: number;
    height: number;
    data: Uint8Array | Uint8ClampedArray;
}

export interface SalveMundiQrOptions {
    fg?: string;
    bg?: string;
    size?: number;
    margin?: number;
    detail?: QrDetailLevel;
    showLogo?: boolean;
    logoPercent?: number;
    logoRecolor?: string | null;
}

export interface SalveMundiQrResult {
    svg: string;
    effectivePercent: number | null;
}

export const OWL_CROP_RATIO = 0.74;
export const QR_MARGIN_MODULES = 4;
export const QR_MIN_LOGO_PERCENT = 15;
export const QR_DEFAULT_LOGO_PERCENT = 70;

export const QR_DETAIL_VERSIONS: Record<QrDetailLevel, number | null> = {
    laag: null,
    midden: 10,
    hoog: 14,
};

export const QR_TICKET_DEFAULTS: Required<SalveMundiQrOptions> = {
    fg: BRAND_COLORS.darkBase,
    bg: BRAND_COLORS.lightSurface,
    size: 400,
    margin: QR_MARGIN_MODULES,
    detail: 'midden',
    showLogo: true,
    logoPercent: QR_DEFAULT_LOGO_PERCENT,
    logoRecolor: null,
};

const FINDER = 7;
const DOT_RADIUS = 0.38;
const LOGO_DOT_RADIUS = 0.5;
const PLAIN_DOT_RADIUS = 0.42;
const BLOCKS_H = [1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81];
const EC_TOTAL_H = [17, 28, 44, 64, 88, 112, 130, 156, 192, 224, 264, 308, 352, 384, 432, 480, 532, 588, 650, 700, 750, 816, 900, 960, 1050, 1110, 1200, 1260, 1350, 1440, 1530, 1620, 1710, 1800, 1890, 1980, 2100, 2220, 2310, 2430];
const SAFE_CAPACITY = 0.7;

export function findOpaqueBounds(
    data: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
): { x: number; y: number; width: number; height: number } | null {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if ((data.at((y * width + x) * 4 + 3) ?? 0) > 16) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) return null;
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function buildMatrix(value: string, minVersion: number | null): QrMatrix {
    const text = value || ' ';
    let qr: ReturnType<typeof QRCode.create>;
    try {
        qr = minVersion
            ? QRCode.create(text, { errorCorrectionLevel: 'H', version: minVersion })
            : QRCode.create(text, { errorCorrectionLevel: 'H' });
    } catch {
        qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
    }
    const { modules, version } = qr;
    return makeMatrix(modules.size, version, modules.data, modules.reservedBit);
}

function makeMatrix(size: number, version: number, data: Uint8Array, reserved: Uint8Array): QrMatrix {
    return { size, version, data, reserved, dark: (row, col) => data.at(row * size + col) === 1 };
}

function buildLayout(matrix: QrMatrix) {
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
        if (n < total * 8) codewordOf.set([Math.floor(n / 8)], idx);
    });
    return { codewordOf, blockOf, correctable: Math.floor(ecPerBlock / 2) };
}

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

    const perBlock = new Map<number, number>();
    for (const cw of damaged) {
        const b = layout.blockOf.at(cw);
        if (b !== undefined) perBlock.set(b, (perBlock.get(b) ?? 0) + 1);
    }
    if (Array.from(perBlock.values()).some((count) => count > layout.correctable * SAFE_CAPACITY)) return null;

    const flipSet = new Set(flips);
    const data = matrix.data.map((value, idx) => (flipSet.has(idx) ? 1 : value));
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

export function svgToDataUri(svg: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function sampleLogoFromRgba(
    logo: LogoRgba,
    modules: number,
    percent: number,
    recolor: string | null = null,
): (string | null)[] {
    const ratio = logo.height / logo.width;
    const lw = (percent / 100) * modules;
    const lh = lw * ratio;
    const x0 = (modules - lw) / 2;
    const y0 = (modules - lh) / 2;
    const sample = 4;

    const result: (string | null)[] = [];
    for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
            if (isFinderZone(modules, row, col)) {
                result.push(null);
                continue;
            }
            let alpha = 0;
            let r = 0;
            let g = 0;
            let b = 0;
            for (let dy = 0; dy < sample; dy++) {
                const uy = Math.floor(((row + (dy + 0.5) / sample - y0) / lh) * logo.height);
                if (uy < 0 || uy >= logo.height) continue;
                for (let dx = 0; dx < sample; dx++) {
                    const ux = Math.floor(((col + (dx + 0.5) / sample - x0) / lw) * logo.width);
                    if (ux < 0 || ux >= logo.width) continue;
                    const offset = (uy * logo.width + ux) * 4;
                    const a = (logo.data.at(offset + 3) ?? 0) / 255;
                    alpha += a;
                    r += (logo.data.at(offset) ?? 0) * a;
                    g += (logo.data.at(offset + 1) ?? 0) * a;
                    b += (logo.data.at(offset + 2) ?? 0) * a;
                }
            }
            if (alpha / (sample * sample) < 0.5) {
                result.push(null);
            } else if (recolor) {
                result.push(recolor);
            } else {
                const toHex = (v: number) => Math.round(v / alpha).toString(16).padStart(2, '0');
                result.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
            }
        }
    }
    return result;
}

export function buildSalveMundiQr(
    value: string,
    logo: LogoRgba | null,
    options: SalveMundiQrOptions = {},
): SalveMundiQrResult {
    const fg = options.fg ?? QR_TICKET_DEFAULTS.fg;
    const bg = options.bg ?? QR_TICKET_DEFAULTS.bg;
    const size = options.size ?? QR_TICKET_DEFAULTS.size;
    const margin = options.margin ?? QR_TICKET_DEFAULTS.margin;
    const detail = options.detail ?? QR_TICKET_DEFAULTS.detail;
    const showLogo = options.showLogo ?? QR_TICKET_DEFAULTS.showLogo;
    const logoPercent = options.logoPercent ?? QR_TICKET_DEFAULTS.logoPercent;
    const logoRecolor = options.logoRecolor ?? QR_TICKET_DEFAULTS.logoRecolor;

    const minVersion = detail === 'laag' ? QR_DETAIL_VERSIONS.laag : detail === 'hoog' ? QR_DETAIL_VERSIONS.hoog : QR_DETAIL_VERSIONS.midden;
    const matrix = buildMatrix(value, minVersion);
    const base = { margin, size, fg, bg };

    if (showLogo && logo) {
        for (let pct = logoPercent; pct >= QR_MIN_LOGO_PERCENT; pct--) {
            const colors = sampleLogoFromRgba(logo, matrix.size, pct, logoRecolor);
            const forced = forceModules(matrix, colors);
            if (forced) {
                return { svg: buildSvg({ ...base, matrix: forced, colors }), effectivePercent: pct };
            }
        }
    }

    return { svg: buildSvg({ ...base, matrix, colors: null }), effectivePercent: showLogo ? null : logoPercent };
}
