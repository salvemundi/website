import 'server-only';
import { access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { OWL_CROP_RATIO, buildSalveMundiQr, findOpaqueBounds, type LogoRgba } from '@/lib/qr/qr-render';

let cachedLogoPromise: Promise<LogoRgba> | null = null;

async function resolveLogoPath(): Promise<string> {
    for (const rel of ['public/img/qr/logo-kleur.png', 'apps/frontend/public/img/qr/logo-kleur.png']) {
        const candidate = path.join(process.cwd(), rel);
        try {
            await access(candidate);
            return candidate;
        } catch {
            continue;
        }
    }
    throw new Error('QR-logo niet gevonden in public/img/qr/logo-kleur.png');
}

async function loadServerLogo(): Promise<LogoRgba> {
    const logoPath = await resolveLogoPath();
    const meta = await sharp(logoPath).metadata();
    if (!meta.width || !meta.height) throw new Error('Ongeldig QR-logo');

    const { data, info } = await sharp(logoPath)
        .extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * OWL_CROP_RATIO) })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const bounds = findOpaqueBounds(data, info.width, info.height);
    if (!bounds) throw new Error('QR-logo is leeg');

    const trimmed = await sharp(logoPath)
        .extract({ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    return { width: trimmed.info.width, height: trimmed.info.height, data: trimmed.data };
}

function getServerLogo(): Promise<LogoRgba> {
    if (!cachedLogoPromise) {
        cachedLogoPromise = loadServerLogo().catch((error: unknown) => {
            cachedLogoPromise = null;
            throw error;
        });
    }
    return cachedLogoPromise;
}

export async function renderTicketQrPng(value: string, size = 440): Promise<Buffer> {
    const logo = await getServerLogo();
    const { svg } = buildSalveMundiQr(value, logo, { size });
    return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}
