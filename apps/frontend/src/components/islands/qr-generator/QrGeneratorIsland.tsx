'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Switch } from '@/shared/ui/Switch';
import { safeConsoleError } from '@/server/utils/logger';

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

const LOGO_SRC = '/img/Logo.png';
const LOGO_RATIO = 491 / 808;
const DEFAULT_FG = '#5a3a66';
const DEFAULT_BG = '#ffffff';
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
    const [size, setSize] = useState(512);
    const [showLogo, setShowLogo] = useState(true);
    const [logoPercent, setLogoPercent] = useState(24);
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
    const logoWidth = Math.round(size * (logoPercent / 100));
    const imageSettings = useMemo(() => (showLogo && logoData ? {
        src: logoData,
        width: logoWidth,
        height: Math.round(logoWidth * LOGO_RATIO),
        excavate: true,
    } : undefined), [showLogo, logoData, logoWidth]);

    const lowContrast = contrastRatio(fgColor, bgColor) < 3 || luminance(fgColor) > luminance(bgColor);
    const logoTooBigForLevel = showLogo && ((level === 'L' && logoPercent > 15) || (level === 'M' && logoPercent > 20) || (level === 'Q' && logoPercent > 25) || logoPercent > 30);

    const handleLevel = (next: ErrorLevel) => setLevel(next);

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
                    <div>
                        <label htmlFor="qr-logo-size" className="mb-2 block text-sm font-bold text-text-main">Logo grootte: {logoPercent}% van de code</label>
                        {/* eslint-disable-next-line no-restricted-syntax -- schuifregelaar, form-input is voor tekstvelden */}
                        <input id="qr-logo-size" type="range" min={10} max={35} value={logoPercent} onChange={(e) => setLogoPercent(Number(e.target.value))} className="w-full accent-(--color-theme-purple,#a4539b)" />
                    </div>
                )}

                {(lowContrast || logoTooBigForLevel) && (
                    <ul className="space-y-1 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300" role="status">
                        {lowContrast && <li>De voorgrond moet donkerder zijn dan de achtergrond met voldoende contrast, anders kan de code niet gescand worden.</li>}
                        {logoTooBigForLevel && <li>Het logo is te groot voor deze foutcorrectie. Kies een hogere foutcorrectie of een kleiner logo.</li>}
                    </ul>
                )}
            </section>

            <section className="squircle-lg flex flex-col items-center gap-4 bg-bg-card p-fluid-md shadow-lg dark:border dark:border-white/10" aria-label="Voorbeeld">
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
