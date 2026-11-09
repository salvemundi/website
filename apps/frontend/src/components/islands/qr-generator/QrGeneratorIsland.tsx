'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Switch } from '@/shared/ui/Switch';
import { safeConsoleError } from '@/server/utils/logger';
import { buildMatrix, buildSvg, forceModules, sampleLogoColors } from './qr-render';

const OWL_CROP_RATIO = 0.74;
const MIN_LOGO_PERCENT = 30;
const FLOOR_LOGO_PERCENT = 15;
const MAX_LOGO_PERCENT = 85;
const MARGIN_MODULES = 4;

type LogoStyle = 'kleur' | 'eenkleurig';

interface PreparedLogo {
    canvas: HTMLCanvasElement;
    ratio: number;
}

const LOGO_SOURCES = {
    kleur: '/img/qr/logo-kleur.png',
    paars: '/img/qr/logo-paars.png',
} as const;

// Huisstijlkleuren uit de Salve Mundi brand guide.
const BRAND = {
    donkerPaars: '#5A3761',
    lichtPaars: '#936695',
    witPaars: '#F0F1F9',
    donkerBlauw: '#132A40',
} as const;

// Lichte modus: donkere code op licht. Donkere modus: lichte code op de donkere huisstijlkleur.
const COLOR_PRESETS: { label: string; fg: string; bg: string }[] = [
    { label: 'Lichte modus', fg: BRAND.donkerBlauw, bg: BRAND.witPaars },
    { label: 'Donkere modus', fg: BRAND.witPaars, bg: BRAND.donkerBlauw },
    { label: 'Donker paars', fg: BRAND.donkerPaars, bg: BRAND.witPaars },
];

// Meer modules = meer detail in het logo. Het aantal wordt vanzelf hoger als de tekst dat nodig heeft.
const DETAIL_OPTIONS: { value: string; label: string; version: number | null }[] = [
    { value: 'laag', label: 'Laag (snel te scannen)', version: null },
    { value: 'midden', label: 'Gemiddeld', version: 10 },
    { value: 'hoog', label: 'Hoog (meeste detail)', version: 14 },
];

const DEFAULT_FG: string = BRAND.donkerBlauw;
const DEFAULT_BG: string = BRAND.witPaars;
const DEFAULT_SIZE = 600;
const DEFAULT_LOGO_PERCENT = 70;
const DEFAULT_DETAIL = 'midden';
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

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Afbeelding laden mislukt'));
        img.src = src;
    });
}

// Alleen de uil (zonder tekst), bijgesneden op de zichtbare pixels.
async function prepareLogo(src: string): Promise<PreparedLogo> {
    const img = await loadImage(src);
    const srcH = Math.round(img.naturalHeight * OWL_CROP_RATIO);
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
    return { canvas: out, ratio: ch / cw };
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const svgToDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export default function QrGeneratorIsland() {
    const [text, setText] = useState(DEFAULT_TEXT);
    const [fgColor, setFgColor] = useState(DEFAULT_FG);
    const [bgColor, setBgColor] = useState(DEFAULT_BG);
    const [size, setSize] = useState(DEFAULT_SIZE);
    const [margin, setMargin] = useState(true);
    const [showLogo, setShowLogo] = useState(true);
    const [logoPercent, setLogoPercent] = useState(DEFAULT_LOGO_PERCENT);
    const [logoStyle, setLogoStyle] = useState<LogoStyle>('kleur');
    const [detail, setDetail] = useState(DEFAULT_DETAIL);
    const [preparedLogo, setPreparedLogo] = useState<PreparedLogo | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const value = text.trim();
    const darkBackground = luminance(bgColor) < 0.4;

    // Op een donkere achtergrond krijgt het logo één lichte huisstijlkleur, anders zijn de kleuren uit het logo zelf.
    const logoSource = logoStyle === 'kleur' && !darkBackground ? LOGO_SOURCES.kleur : LOGO_SOURCES.paars;
    const logoRecolor = darkBackground ? BRAND.lichtPaars : null;

    useEffect(() => {
        let cancelled = false;
        prepareLogo(logoSource)
            .then((result) => { if (!cancelled) setPreparedLogo(result); })
            .catch((err: unknown) => safeConsoleError('[QrGeneratorIsland.tsx][prepareLogo] ', err));
        return () => { cancelled = true; };
    }, [logoSource]);

    const minVersion = DETAIL_OPTIONS.find((o) => o.value === detail)?.version ?? null;
    const matrix = useMemo(() => buildMatrix(value, minVersion), [value, minVersion]);

    // De uil wordt als gevulde vorm in de blokjes getekend. De foutcorrectie herstelt de aangepaste blokjes, zolang de uil niet te groot is.
    // Is de gekozen grootte te veel voor de code, dan nemen we de grootste die nog veilig past.
    const { svg, effectivePercent } = useMemo(() => {
        const base = { margin: margin ? MARGIN_MODULES : 0, size, fg: fgColor, bg: bgColor };
        if (showLogo && preparedLogo) {
            for (let pct = logoPercent; pct >= FLOOR_LOGO_PERCENT; pct--) {
                const colors = sampleLogoColors(preparedLogo.canvas, preparedLogo.ratio, matrix.size, pct, logoRecolor);
                const forced = forceModules(matrix, colors);
                if (forced) return { svg: buildSvg({ ...base, matrix: forced, colors }), effectivePercent: pct };
            }
        }
        return { svg: buildSvg({ ...base, matrix, colors: null }), effectivePercent: showLogo ? null : logoPercent };
    }, [matrix, margin, size, fgColor, bgColor, showLogo, preparedLogo, logoPercent, logoRecolor]);

    const svgUri = useMemo(() => svgToDataUri(svg), [svg]);

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
        setLogoStyle('kleur');
        setLogoPercent(DEFAULT_LOGO_PERCENT);
        setDetail(DEFAULT_DETAIL);
    };

    const renderPng = useCallback(async (): Promise<Blob | null> => {
        const img = await loadImage(svgUri);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, size, size);
        return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    }, [svgUri, size]);

    const downloadPng = useCallback(() => {
        void renderPng().then((blob) => { if (blob) saveBlob(blob, 'salve-mundi-qr.png'); });
    }, [renderPng]);

    const downloadSvg = useCallback(() => {
        saveBlob(new Blob([svg], { type: 'image/svg+xml' }), 'salve-mundi-qr.svg');
    }, [svg]);

    const copyImage = useCallback(() => {
        setError(null);
        void renderPng()
            .then((blob) => {
                if (!blob) throw new Error('Geen afbeelding');
                return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            })
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch((err: unknown) => {
                safeConsoleError('[QrGeneratorIsland.tsx][copy] ', err);
                setError('Kopiëren naar het klembord is niet gelukt. Download de afbeelding in plaats daarvan.');
            });
    }, [renderPng]);

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
                    <FormField label="Kleur van de code">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line no-restricted-syntax -- kleurkiezer, form-input is voor tekstvelden */}
                            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} aria-label="Kleur van de code kiezen" className="size-12 shrink-0 cursor-pointer rounded-xl border-none bg-transparent p-0" />
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
                    <input id="qr-size" type="range" min={300} max={1600} step={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-(--color-theme-purple,#a4539b)" />
                </div>

                <div>
                    <label htmlFor="qr-detail" className="mb-2 block text-sm font-bold text-text-main">Detail van het logo</label>
                    <select id="qr-detail" value={detail} onChange={(e) => setDetail(e.target.value)} className="form-input">
                        {DETAIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-text-muted">Meer detail maakt de uil scherper, maar de blokjes worden kleiner. Scan de code altijd even na.</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-text-main">Rand rondom de code</span>
                    <Switch checked={margin} onChange={setMargin} ariaLabel="Rand rondom de code" />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-text-main">Salve Mundi uil in de code</span>
                    <Switch checked={showLogo} onChange={setShowLogo} ariaLabel="Uil in de code" />
                </div>

                {showLogo && (
                    <>
                        <div>
                            <label htmlFor="qr-logo-style" className="mb-2 block text-sm font-bold text-text-main">Kleur van de uil</label>
                            <select id="qr-logo-style" value={logoStyle} onChange={(e) => setLogoStyle(e.target.value as LogoStyle)} disabled={darkBackground} className="form-input">
                                <option value="kleur">Kleur (twee tinten paars)</option>
                                <option value="eenkleurig">Eenkleurig paars</option>
                            </select>
                            {darkBackground && <p className="mt-1 text-xs text-text-muted">Op een donkere achtergrond gebruikt de uil automatisch licht paars.</p>}
                        </div>
                        <div>
                            <label htmlFor="qr-logo-size" className="mb-2 block text-sm font-bold text-text-main">Grootte van de uil: {logoPercent}%</label>
                            {/* eslint-disable-next-line no-restricted-syntax -- schuifregelaar, form-input is voor tekstvelden */}
                            <input id="qr-logo-size" type="range" min={MIN_LOGO_PERCENT} max={MAX_LOGO_PERCENT} value={logoPercent} onChange={(e) => setLogoPercent(Number(e.target.value))} className="w-full accent-(--color-theme-purple,#a4539b)" />
                            <p className="mt-1 text-xs text-text-muted">
                                {effectivePercent !== null && effectivePercent < logoPercent
                                    ? `De uil is verkleind naar ${effectivePercent}%: groter past niet meer binnen de foutcorrectie. Kies meer detail of een kortere tekst voor een grotere uil.`
                                    : 'De foutcorrectie staat altijd op het hoogste niveau. De uil bestaat uit blokjes van de code zelf, die door de foutcorrectie worden hersteld.'}
                            </p>
                        </div>
                    </>
                )}

                {/* Vaste hoogte, zodat de pagina niet verspringt als de melding verschijnt of verdwijnt. */}
                <div className="min-h-16" role="status" aria-live="polite">
                    {lowContrast && (
                        <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                            Het contrast tussen de code en de achtergrond is te laag, de code kan dan niet gescand worden.
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
                        {/* eslint-disable-next-line @next/next/no-img-element -- gegenereerde SVG als data-URI, next/image is hier niet geschikt */}
                        <img src={svgUri} alt={`QR-code voor ${value}`} className="h-auto w-full max-w-80 rounded-xl" width={size} height={size} />
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
