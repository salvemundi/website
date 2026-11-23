'use client';

import { OWL_CROP_RATIO, buildSalveMundiQr, findOpaqueBounds, svgToDataUri, type LogoRgba } from './qr-render';

export const QR_LOGO_SOURCES = {
    kleur: '/img/qr/logo-kleur.png',
    paars: '/img/qr/logo-paars.png',
} as const;

const resolvedLogoCache = new Map<string, LogoRgba>();
const pendingLogoCache = new Map<string, Promise<LogoRgba>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Afbeelding laden mislukt'));
        img.src = src;
    });
}

export function getCachedLogo(src: string): LogoRgba | null {
    return resolvedLogoCache.get(src) ?? null;
}

async function prepareLogoFromUrl(src: string): Promise<LogoRgba> {
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = Math.round(img.naturalHeight * OWL_CROP_RATIO);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas niet beschikbaar');
    ctx.drawImage(img, 0, 0, img.naturalWidth, canvas.height, 0, 0, canvas.width, canvas.height);

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bounds = findOpaqueBounds(data, width, height);
    if (!bounds) throw new Error('Logo is leeg');

    const out = document.createElement('canvas');
    out.width = bounds.width;
    out.height = bounds.height;
    const octx = out.getContext('2d', { willReadFrequently: true });
    if (!octx) throw new Error('Canvas niet beschikbaar');
    octx.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);

    const logo: LogoRgba = { width: bounds.width, height: bounds.height, data: octx.getImageData(0, 0, bounds.width, bounds.height).data };
    resolvedLogoCache.set(src, logo);
    return logo;
}

export function loadPreparedLogo(src: string): Promise<LogoRgba> {
    const resolved = resolvedLogoCache.get(src);
    if (resolved) return Promise.resolve(resolved);
    const existing = pendingLogoCache.get(src);
    if (existing) return existing;

    const promise = prepareLogoFromUrl(src).catch((error: unknown) => {
        pendingLogoCache.delete(src);
        throw error;
    });
    pendingLogoCache.set(src, promise);
    return promise;
}

export async function generateTicketQrSvgDataUri(value: string, size = 400): Promise<string> {
    const logo = await loadPreparedLogo(QR_LOGO_SOURCES.kleur);
    return svgToDataUri(buildSalveMundiQr(value, logo, { size }).svg);
}
