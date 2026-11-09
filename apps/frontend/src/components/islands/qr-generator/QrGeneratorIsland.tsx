'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Switch } from '@/shared/ui/Switch';
import { safeConsoleError } from '@/server/utils/logger';

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

const LOGO_SRC = '/img/Logo.png';
const LOGO_RENDER_WIDTH = 640;
const OWL_CROP_RATIO = 0.74;
const MIN_LOGO_PERCENT = 15;
const MAX_LOGO_PERCENT = 60;

type LogoVariant = 'full' | 'owl';

// Maximaal deel van het oppervlak dat het logo mag bedekken per foutcorrectieniveau (met veiligheidsmarge).
function areaCap(level: ErrorLevel): number {
    switch (level) {
        case 'L': return 0.05;
        case 'M': return 0.1;
        case 'Q': return 0.17;
        default: return 0.22;
    }
}
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

const LEVELS: { value: ErrorLevel; label: string }[] = [
    { value: 'L', label: 'Laag (7%)' },
    { value: 'M', label: 'Gemiddeld (15%)' },
    { value: 'Q', label: 'Hoog (25%)' },
    { value: 'H', label: 'Zeer hoog (30%)' },
];

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

// Het logo mag nooit te veel van de code bedekken: de maximale breedte hangt af van de foutcorrectie.
function maxLogoPercentFor(level: ErrorLevel, ratio: number): number {
    return Math.max(MIN_LOGO_PERCENT, Math.min(MAX_LOGO_PERCENT, Math.floor(Math.sqrt(areaCap(level) / ratio) * 100)));
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Logo laden mislukt'));
        img.src = src;
    });
}

// Tint het logo in de voorgrondkleur en zet het op een afgeronde plaat in de achtergrondkleur.
async function composeLogo(logoSrc: string, variant: LogoVariant, fg: string, bg: string): Promise<{ src: string; ratio: number }> {
    const img = await loadImage(logoSrc);
    const cropH = variant === 'owl' ? Math.round(img.naturalHeight * OWL_CROP_RATIO) : img.naturalHeight;
    const logoW = LOGO_RENDER_WIDTH;
    const logoH = Math.round(logoW * (cropH / img.naturalWidth));
    const pad = Math.round(logoW * 0.08);

    const tint = document.createElement('canvas');
    tint.width = logoW;
    tint.height = logoH;
    const tctx = tint.getContext('2d');
    if (!tctx) throw new Error('Canvas niet beschikbaar');
    tctx.drawImage(img, 0, 0, img.naturalWidth, cropH, 0, 0, logoW, logoH);
    tctx.globalCompositeOperation = 'source-in';
    tctx.fillStyle = fg;
    tctx.fillRect(0, 0, logoW, logoH);

    const plate = document.createElement('canvas');
    plate.width = logoW + pad * 2;
    plate.height = logoH + pad * 2;
    const pctx = plate.getContext('2d');
    if (!pctx) throw new Error('Canvas niet beschikbaar');
    pctx.fillStyle = bg;
    pctx.beginPath();
    pctx.roundRect(0, 0, plate.width, plate.height, pad * 1.6);
    pctx.fill();
    pctx.drawImage(tint, pad, pad);

    return { src: plate.toDataURL('image/png'), ratio: plate.height / plate.width };
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
    const [composedLogo, setComposedLogo] = useState<{ src: string; ratio: number } | null>(null);
    const [level, setLevel] = useState<ErrorLevel>('H');
    const [margin, setMargin] = useState(true);
    const [logoData, setLogoData] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgWrapRef = useRef<HTMLDivElement>(null);

    // Logo als data-URI, zodat het ook in de gedownloade SVG zit en het canvas niet "tainted" raakt.
    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch(LOGO_SRC);
                const blob = await res.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (!cancelled && typeof reader.result === 'string') setLogoData(reader.result);
                };
                reader.readAsDataURL(blob);
            } catch (err: unknown) {
                safeConsoleError('[QrGeneratorIsland.tsx][logo] ', err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const value = text.trim();
    useEffect(() => {
        if (!logoData) return;
        let cancelled = false;
        composeLogo(logoData, logoVariant, fgColor, bgColor)
            .then((result) => { if (!cancelled) setComposedLogo(result); })
            .catch((err: unknown) => safeConsoleError('[QrGeneratorIsland.tsx][composeLogo] ', err));
        return () => { cancelled = true; };
    }, [logoData, logoVariant, fgColor, bgColor]);

    const logoRatio = composedLogo?.ratio ?? 0.7;
    const maxLogoPercent = maxLogoPercentFor(level, logoRatio);
    const effectiveLogoPercent = Math.min(Math.max(logoPercent, MIN_LOGO_PERCENT), maxLogoPercent);
    const logoWidth = Math.round(size * (effectiveLogoPercent / 100));
    const imageSettings = useMemo(() => (showLogo && composedLogo ? {
        src: composedLogo.src,
        width: logoWidth,
        height: Math.round(logoWidth * composedLogo.ratio),
        excavate: true,
    } : undefined), [showLogo, composedLogo, logoWidth]);

    const lowContrast = contrastRatio(fgColor, bgColor) < 3;
    const inverted = !lowContrast && luminance(fgColor) > luminance(bgColor);

    const handleLevel = (next: ErrorLevel) => {
        // Houd de getoonde logogrootte vast: alleen verkleinen als de nieuwe foutcorrectie dat vereist, nooit vanzelf vergroten.
        setLogoPercent(Math.min(effectiveLogoPercent, maxLogoPercentFor(next, logoRatio)));
        setLevel(next);
    };

    const applyPreset = (preset: { fg: string; bg: string }) => {
        setFgColor(preset.fg);
        setBgColor(preset.bg);
    };

    const resetToDefaults = () => {
        setFgColor(DEFAULT_FG);
        setBgColor(DEFAULT_BG);
        setSize(DEFAULT_SIZE);
        setLevel('H');
        setMargin(true);
        setShowLogo(true);
        setLogoVariant('owl');
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

    const qrProps = { value: value || ' ', size, fgColor, bgColor, level, marginSize: margin ? 4 : 0, imageSettings };

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

                <div>
                    <label htmlFor="qr-level" className="mb-2 block text-sm font-bold text-text-main">Foutcorrectie</label>
                    <select id="qr-level" value={level} onChange={(e) => handleLevel(e.target.value as ErrorLevel)} className="form-input">
                        {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
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
                        <div>
                            <label htmlFor="qr-logo-variant" className="mb-2 block text-sm font-bold text-text-main">Logo</label>
                            <select id="qr-logo-variant" value={logoVariant} onChange={(e) => setLogoVariant(e.target.value as LogoVariant)} className="form-input">
                                <option value="owl">Alleen uil (beter leesbaar)</option>
                                <option value="full">Volledig logo met tekst</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="qr-logo-size" className="mb-2 block text-sm font-bold text-text-main">Logo grootte: {effectiveLogoPercent}% van de code</label>
                            {/* eslint-disable-next-line no-restricted-syntax -- schuifregelaar, form-input is voor tekstvelden */}
                            <input id="qr-logo-size" type="range" min={MIN_LOGO_PERCENT} max={maxLogoPercent} value={effectiveLogoPercent} onChange={(e) => setLogoPercent(Number(e.target.value))} className="w-full accent-(--color-theme-purple,#a4539b)" />
                            <p className="mt-1 text-xs text-text-muted">De maximale grootte past zich aan op de foutcorrectie, zodat de code scanbaar blijft.</p>
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
