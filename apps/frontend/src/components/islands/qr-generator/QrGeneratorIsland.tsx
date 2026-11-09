'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Switch } from '@/shared/ui/Switch';
import { safeConsoleError } from '@/server/utils/logger';

// Foutcorrectie staat altijd op het hoogste niveau (30%), zodat het logo zoveel mogelijk ruimte krijgt en de code scanbaar blijft.
const ERROR_LEVEL = 'H';
const DEFAULT_MODULES = 33;
const OWL_CROP_RATIO = 0.74;
const MIN_LOGO_PERCENT = 15;
const MAX_LOGO_PERCENT = 60;
// Maximaal deel van het oppervlak dat het logo mag bedekken bij niveau H (met veiligheidsmarge).
const LOGO_AREA_CAP = 0.22;
const MARGIN_MODULES = 4;

type LogoVariant = 'full' | 'owl';
type LogoStyle = 'kleur' | 'eenkleurig';

const LOGO_SOURCES = {
    kleur: '/img/qr/logo-kleur.png',
    paars: '/img/qr/logo-paars.png',
    wit: '/img/qr/logo-wit.png',
} as const;

// Huisstijlkleuren uit de Salve Mundi brand guide.
const BRAND = {
    donkerPaars: '#5A3761',
    lichtPaars: '#936695',
    witPaars: '#F0F1F9',
    donkerBlauw: '#132A40',
} as const;

// Lichte modus: donker op licht. Donkere modus: licht logo op donkere achtergrond (brand guide).
const COLOR_PRESETS: { label: string; fg: string; bg: string }[] = [
    { label: 'Lichte modus', fg: BRAND.donkerPaars, bg: BRAND.witPaars },
    { label: 'Donkere modus', fg: BRAND.witPaars, bg: BRAND.donkerBlauw },
    { label: 'Donker blauw', fg: BRAND.donkerBlauw, bg: BRAND.witPaars },
    { label: 'Licht paars', fg: BRAND.lichtPaars, bg: BRAND.witPaars },
];

const DEFAULT_FG: string = BRAND.donkerPaars;
const DEFAULT_BG: string = BRAND.witPaars;
const DEFAULT_SIZE = 512;
const DEFAULT_LOGO_PERCENT = 40;
const DEFAULT_TEXT = 'https://salvemundi.nl';

function luminance(hex: string): number {
    const n = parseInt(hex.slice(1), 16);
    const channel = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrastRatio(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

function maxLogoPercentFor(ratio: number): number {
    return Math.max(MIN_LOGO_PERCENT, Math.min(MAX_LOGO_PERCENT, Math.floor(Math.sqrt(LOGO_AREA_CAP / ratio) * 100)));
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Logo laden mislukt'));
        img.src = src;
    });
}

// Snijdt het logo op de zichtbare pixels (geen lege rand), zodat er zo min mogelijk van de code wordt weggehaald.
async function prepareLogo(src: string, variant: LogoVariant): Promise<{ src: string; ratio: number }> {
    const img = await loadImage(src);
    const srcH = variant === 'owl' ? Math.round(img.naturalHeight * OWL_CROP_RATIO) : img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = srcH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas niet beschikbaar');
    ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, 0, 0, canvas.width, canvas.height);

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > 16) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) throw new Error('Logo is leeg');

    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const out = document.createElement('canvas');
    out.width = cw;
    out.height = ch;
    const octx = out.getContext('2d');
    if (!octx) throw new Error('Canvas niet beschikbaar');
    octx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
    return { src: out.toDataURL('image/png'), ratio: ch / cw };
}

// Kiest een logobreedte in hele modules (gecentreerd op het raster), zodat er zo weinig mogelijk lege ruimte rond het logo overblijft.
function snapLogo(modules: number, targetModules: number, ratio: number): { wMod: number; hMod: number } {
    const base = Math.round(targetModules);
    let best = { wMod: Math.max(3, base), hMod: Math.max(3, base) * ratio, score: Infinity };
    for (let w = Math.max(3, base - 3); w <= base + 3; w++) {
        if ((modules - w) % 2 !== 0) continue;
        const h = w * ratio;
        const y = modules / 2 - h / 2;
        const slack = Math.ceil(h + y - Math.floor(y)) - h;
        const score = slack + 0.08 * Math.abs(w - targetModules);
        if (score < best.score) best = { wMod: w, hMod: h, score };
    }
    return { wMod: best.wMod, hMod: best.hMod };
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function QrGeneratorIsland() {
    const [text, setText] = useState(DEFAULT_TEXT);
    const [fgColor, setFgColor] = useState(DEFAULT_FG);
    const [bgColor, setBgColor] = useState(DEFAULT_BG);
    const [size, setSize] = useState(DEFAULT_SIZE);
    const [showLogo, setShowLogo] = useState(true);
    const [logoPercent, setLogoPercent] = useState(DEFAULT_LOGO_PERCENT);
    const [logoVariant, setLogoVariant] = useState<LogoVariant>('owl');
    const [logoStyle, setLogoStyle] = useState<LogoStyle>('kleur');
    const [preparedLogo, setPreparedLogo] = useState<{ src: string; ratio: number } | null>(null);
    const [margin, setMargin] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgWrapRef = useRef<HTMLDivElement>(null);

    const value = text.trim();
    const darkBackground = luminance(bgColor) < 0.4;

    // Op een donkere achtergrond is het logo altijd wit, op een lichte achtergrond kleur of eenkleurig paars (brand guide).
    const logoSource = darkBackground
        ? LOGO_SOURCES.wit
        : logoStyle === 'kleur' ? LOGO_SOURCES.kleur : LOGO_SOURCES.paars;

    useEffect(() => {
        let cancelled = false;
        prepareLogo(logoSource, logoVariant)
            .then((result) => { if (!cancelled) setPreparedLogo(result); })
            .catch((err: unknown) => safeConsoleError('[QrGeneratorIsland.tsx][prepareLogo] ', err));
        return () => { cancelled = true; };
    }, [logoSource, logoVariant]);

    // Aantal modules (blokjes) per zijde, nodig om het logo precies op het raster uit te lijnen.
    const modules = useMemo(() => {
        try {
            return QRCode.create(value || ' ', { errorCorrectionLevel: ERROR_LEVEL }).modules.size;
        } catch {
            return DEFAULT_MODULES;
        }
    }, [value]);

    const logoRatio = preparedLogo?.ratio ?? 0.5;
    const maxLogoPercent = maxLogoPercentFor(logoRatio);
    const effectiveLogoPercent = Math.min(Math.max(logoPercent, MIN_LOGO_PERCENT), maxLogoPercent);

    const imageSettings = useMemo(() => {
        if (!showLogo || !preparedLogo) return undefined;
        const totalModules = modules + (margin ? MARGIN_MODULES * 2 : 0);
        const modulePx = size / totalModules;
        const { wMod, hMod } = snapLogo(modules, (effectiveLogoPercent / 100) * totalModules, preparedLogo.ratio);
        return {
            src: preparedLogo.src,
            width: wMod * modulePx,
            height: hMod * modulePx,
            excavate: true,
        };
    }, [showLogo, preparedLogo, modules, margin, size, effectiveLogoPercent]);

    const lowContrast = contrastRatio(fgColor, bgColor) < 3;
    const inverted = !lowContrast && luminance(fgColor) > luminance(bgColor);

    const applyPreset = (preset: { fg: string; bg: string }) => {
        setFgColor(preset.fg);
        setBgColor(preset.bg);
    };

    const resetToDefaults = () => {
        setFgColor(DEFAULT_FG);
        setBgColor(DEFAULT_BG);
        setSize(DEFAULT_SIZE);
        setMargin(true);
        setShowLogo(true);
        setLogoVariant('owl');
        setLogoStyle('kleur');
        setLogoPercent(DEFAULT_LOGO_PERCENT);
    };

    const downloadPng = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => { if (blob) saveBlob(blob, 'salve-mundi-qr.png'); }, 'image/png');
    }, []);

    const downloadSvg = useCallback(() => {
        const svg = svgWrapRef.current?.querySelector('svg');
        if (!svg) return;
        const source = new XMLSerializer().serializeToString(svg);
        saveBlob(new Blob([source], { type: 'image/svg+xml' }), 'salve-mundi-qr.svg');
    }, []);

    const copyImage = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setError(null);
        canvas.toBlob((blob) => {
            if (!blob) return;
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch((err: unknown) => {
                    safeConsoleError('[QrGeneratorIsland.tsx][copy] ', err);
                    setError('Kopiëren naar het klembord is niet gelukt. Download de afbeelding in plaats daarvan.');
                });
        }, 'image/png');
    }, []);

    const qrProps = { value: value || ' ', size, fgColor, bgColor, level: ERROR_LEVEL, marginSize: margin ? MARGIN_MODULES : 0, imageSettings } as const;

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <section className="squircle-lg space-y-5 bg-bg-card p-fluid-md shadow-lg dark:border dark:border-white/10" aria-label="Instellingen">
                <FormField label="Link of tekst" required>
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="https://salvemundi.nl"
                        maxLength={1000}
                    />
                </FormField>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-text-main">Huisstijlkleuren</span>
                        <button type="button" onClick={resetToDefaults} className="form-button inline-flex items-center gap-1.5 rounded-xl bg-bg-soft px-3 py-1.5 text-xs font-bold text-text-main transition hover:bg-black/5 dark:hover:bg-white/10">
                            <RotateCcw className="size-3.5" /> Standaard Salve Mundi
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => {
                            const active = preset.fg.toLowerCase() === fgColor.toLowerCase() && preset.bg.toLowerCase() === bgColor.toLowerCase();
                            return (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => applyPreset(preset)}
                                    aria-pressed={active}
                                    className={`form-button inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold text-text-main transition ${active ? 'border-theme-purple bg-theme-purple/10' : 'border-transparent bg-bg-soft hover:bg-black/5 dark:hover:bg-white/10'}`}
                                >
                                    <span className="relative inline-block size-6 overflow-hidden rounded-full border border-black/10" style={{ backgroundColor: preset.bg }} aria-hidden="true">
                                        <span className="absolute inset-1.5 rounded-full" style={{ backgroundColor: preset.fg }} />
                                    </span>
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Voorgrondkleur">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line no-restricted-syntax -- kleurkiezer, form-input is voor tekstvelden */}
                            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} aria-label="Voorgrondkleur kiezen" className="size-12 shrink-0 cursor-pointer rounded-xl border-none bg-transparent p-0" />
                            <span className="font-mono text-sm text-text-muted">{fgColor.toUpperCase()}</span>
                        </div>
                    </FormField>
                    <FormField label="Achtergrondkleur">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line no-restricted-syntax -- kleurkiezer, form-input is voor tekstvelden */}
                            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} aria-label="Achtergrondkleur kiezen" className="size-12 shrink-0 cursor-pointer rounded-xl border-none bg-transparent p-0" />
                            <span className="font-mono text-sm text-text-muted">{bgColor.toUpperCase()}</span>
                        </div>
                    </FormField>
                </div>

                <div>
                    <label htmlFor="qr-size" className="mb-2 block text-sm font-bold text-text-main">Grootte: {size} × {size} px</label>
                    {/* eslint-disable-next-line no-restricted-syntax -- schuifregelaar, form-input is voor tekstvelden */}
                    <input id="qr-size" type="range" min={200} max={1200} step={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-(--color-theme-purple,#a4539b)" />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-text-main">Rand rondom de code</span>
                    <Switch checked={margin} onChange={setMargin} ariaLabel="Rand rondom de code" />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-text-main">Salve Mundi logo in het midden</span>
                    <Switch checked={showLogo} onChange={setShowLogo} ariaLabel="Logo in het midden" />
                </div>

                {showLogo && (
                    <>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="qr-logo-variant" className="mb-2 block text-sm font-bold text-text-main">Logo</label>
                                <select id="qr-logo-variant" value={logoVariant} onChange={(e) => setLogoVariant(e.target.value as LogoVariant)} className="form-input">
                                    <option value="owl">Alleen uil (beter leesbaar)</option>
                                    <option value="full">Volledig logo met tekst</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="qr-logo-style" className="mb-2 block text-sm font-bold text-text-main">Logokleur</label>
                                <select id="qr-logo-style" value={logoStyle} onChange={(e) => setLogoStyle(e.target.value as LogoStyle)} disabled={darkBackground} className="form-input">
                                    <option value="kleur">Kleur (twee tinten paars)</option>
                                    <option value="eenkleurig">Eenkleurig paars</option>
                                </select>
                            </div>
                        </div>
                        {darkBackground && <p className="-mt-3 text-xs text-text-muted">Op een donkere achtergrond wordt automatisch het witte logo gebruikt.</p>}
                        <div>
                            <label htmlFor="qr-logo-size" className="mb-2 block text-sm font-bold text-text-main">Logo grootte: {effectiveLogoPercent}% van de code</label>
                            {/* eslint-disable-next-line no-restricted-syntax -- schuifregelaar, form-input is voor tekstvelden */}
                            <input id="qr-logo-size" type="range" min={MIN_LOGO_PERCENT} max={maxLogoPercent} value={effectiveLogoPercent} onChange={(e) => setLogoPercent(Number(e.target.value))} className="w-full accent-(--color-theme-purple,#a4539b)" />
                            <p className="mt-1 text-xs text-text-muted">De foutcorrectie staat altijd op het hoogste niveau. De maximale logogrootte zorgt dat de code scanbaar blijft.</p>
                        </div>
                    </>
                )}

                {/* Vaste hoogte, zodat de pagina niet verspringt als de melding verschijnt of verdwijnt. */}
                <div className="min-h-16" role="status" aria-live="polite">
                    {lowContrast && (
                        <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                            Het contrast tussen voorgrond en achtergrond is te laag, de code kan dan niet gescand worden.
                        </p>
                    )}
                    {inverted && (
                        <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                            Licht op donker wordt niet door alle QR-scanners herkend. Test de code met een telefoon voordat je hem gebruikt.
                        </p>
                    )}
                </div>
            </section>

            <section className="squircle-lg flex flex-col items-center gap-4 bg-bg-card p-fluid-md shadow-lg lg:sticky lg:top-24 lg:self-start dark:border dark:border-white/10" aria-label="Voorbeeld">
                {value ? (
                    <>
                        <QRCodeCanvas ref={canvasRef} {...qrProps} style={{ width: '100%', height: 'auto', maxWidth: '20rem' }} className="rounded-xl" />
                        <div ref={svgWrapRef} className="hidden" aria-hidden="true">
                            <QRCodeSVG {...qrProps} />
                        </div>
                        <div className="flex w-full flex-wrap justify-center gap-2">
                            <button type="button" onClick={downloadPng} className="form-button inline-flex items-center gap-2 rounded-xl bg-theme-purple px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
                                <Download className="size-4" /> PNG
                            </button>
                            <button type="button" onClick={downloadSvg} className="form-button inline-flex items-center gap-2 rounded-xl bg-theme-purple px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
                                <Download className="size-4" /> SVG
                            </button>
                            <button type="button" onClick={copyImage} className="form-button inline-flex items-center gap-2 rounded-xl bg-bg-soft px-4 py-2.5 text-sm font-bold text-text-main transition hover:bg-black/5 dark:hover:bg-white/10">
                                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Gekopieerd' : 'Kopieer'}
                            </button>
                        </div>
                        {error && <p className="text-theme-error text-center text-sm" role="alert">{error}</p>}
                    </>
                ) : (
                    <p className="py-16 text-center text-text-muted">Vul een link of tekst in om een QR-code te maken.</p>
                )}
            </section>
        </div>
    );
}
