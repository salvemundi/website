'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
import NextImage from 'next/image';
import { BRAND_COLORS } from '@/lib/config/theme';
import {
    Alert,
    Button,
    Card,
    ColorInput,
    ColorSwatch,
    Grid,
    GridCol,
    Group,
    NativeSelect,
    SimpleGrid,
    Slider,
    Stack,
    Switch,
    Text,
    TextInput,
} from '@mantine/core';
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

const BRAND = {
    donkerPaars: BRAND_COLORS.purple,
    lichtPaars: BRAND_COLORS.lightPurple,
    witPaars: BRAND_COLORS.lightBase,
    donker: BRAND_COLORS.darkBase,
} as const;

const COLOR_PRESETS: { label: string; fg: string; bg: string }[] = [
    { label: 'Lichte modus', fg: BRAND.donker, bg: BRAND.witPaars },
    { label: 'Donkere modus', fg: BRAND.witPaars, bg: BRAND.donker },
    { label: 'Donker paars', fg: BRAND.donkerPaars, bg: BRAND.witPaars },
];

const DETAIL_OPTIONS: { value: string; label: string; version: number | null }[] = [
    { value: 'laag', label: 'Laag (snel te scannen)', version: null },
    { value: 'midden', label: 'Gemiddeld', version: 10 },
    { value: 'hoog', label: 'Hoog (meeste detail)', version: 14 },
];

const DEFAULT_FG: string = BRAND.donker;
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
        <Grid gap="lg" align="flex-start">
            <GridCol span={{ base: 12, lg: 7 }}>
                <Card>
                    <Stack gap="lg">
                        <TextInput
                            label="Link of tekst"
                            required
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="https://salvemundi.nl"
                            maxLength={1000}
                        />

                        <Stack gap="xs">
                            <Group justify="space-between">
                                <Text size="sm" fw={700}>Huisstijlkleuren</Text>
                                <Button
                                    type="button"
                                    variant="default"
                                    size="xs"
                                    onClick={resetToDefaults}
                                    leftSection={<RotateCcw size={14} />}
                                >
                                    Standaard Salve Mundi
                                </Button>
                            </Group>
                            <Group gap="xs" wrap="wrap">
                                {COLOR_PRESETS.map((preset) => {
                                    const active =
                                        preset.fg.toLowerCase() === fgColor.toLowerCase() &&
                                        preset.bg.toLowerCase() === bgColor.toLowerCase();
                                    return (
                                        <Button
                                            key={preset.label}
                                            type="button"
                                            variant={active ? 'filled' : 'default'}
                                            size="xs"
                                            onClick={() => applyPreset(preset)}
                                            aria-pressed={active}
                                            leftSection={<ColorSwatch color={preset.fg} size={14} />}
                                        >
                                            {preset.label}
                                        </Button>
                                    );
                                })}
                            </Group>
                        </Stack>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <ColorInput
                                label="Kleur van de code"
                                value={fgColor}
                                onChange={setFgColor}
                                swatches={[BRAND.donker, BRAND.donkerPaars, BRAND.lichtPaars, BRAND.witPaars]}
                            />
                            <ColorInput
                                label="Achtergrondkleur"
                                value={bgColor}
                                onChange={setBgColor}
                                swatches={[BRAND.witPaars, BRAND.donker, BRAND.donkerPaars, '#FFFFFF']}
                            />
                        </SimpleGrid>

                        <Stack gap="xs">
                            <Text size="sm" fw={700}>Grootte: {size} × {size} px</Text>
                            <Slider
                                min={300}
                                max={1600}
                                step={20}
                                value={size}
                                onChange={setSize}
                                aria-label="Grootte van de QR-code"
                            />
                        </Stack>

                        <NativeSelect
                            label="Detail van het logo"
                            description="Meer detail maakt de uil scherper, maar de blokjes worden kleiner. Scan de code altijd even na."
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            data={DETAIL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                        />

                        <Group justify="space-between">
                            <Text size="sm" fw={700}>Rand rondom de code</Text>
                            <Switch checked={margin} onChange={(e) => setMargin(e.currentTarget.checked)} aria-label="Rand rondom de code" />
                        </Group>

                        <Group justify="space-between">
                            <Text size="sm" fw={700}>Salve Mundi uil in de code</Text>
                            <Switch checked={showLogo} onChange={(e) => setShowLogo(e.currentTarget.checked)} aria-label="Uil in de code" />
                        </Group>

                        {showLogo && (
                            <>
                                <NativeSelect
                                    label="Kleur van de uil"
                                    description={darkBackground ? 'Op een donkere achtergrond gebruikt de uil automatisch licht paars.' : undefined}
                                    value={logoStyle}
                                    onChange={(e) => setLogoStyle(e.target.value as LogoStyle)}
                                    disabled={darkBackground}
                                    data={[
                                        { value: 'kleur', label: 'Kleur (twee tinten paars)' },
                                        { value: 'eenkleurig', label: 'Eenkleurig paars' },
                                    ]}
                                />

                                <Stack gap="xs">
                                    <Text size="sm" fw={700}>Grootte van de uil: {logoPercent}%</Text>
                                    <Slider
                                        min={MIN_LOGO_PERCENT}
                                        max={MAX_LOGO_PERCENT}
                                        value={logoPercent}
                                        onChange={setLogoPercent}
                                        aria-label="Grootte van de uil"
                                    />
                                    <Text size="xs" c="dimmed">
                                        {effectivePercent !== null && effectivePercent < logoPercent
                                            ? `De uil is verkleind naar ${effectivePercent}%: groter past niet meer binnen de foutcorrectie. Kies meer detail of een kortere tekst voor een grotere uil.`
                                            : 'De foutcorrectie staat altijd op het hoogste niveau. De uil bestaat uit blokjes van de code zelf, die door de foutcorrectie worden hersteld.'}
                                    </Text>
                                </Stack>
                            </>
                        )}

                        {lowContrast && (
                            <Alert color="accent">
                                Het contrast tussen de code en de achtergrond is te laag, de code kan dan niet gescand worden.
                            </Alert>
                        )}
                        {inverted && (
                            <Alert color="accent">
                                Licht op donker wordt niet door alle QR-scanners herkend. Test de code met een telefoon voordat je hem gebruikt.
                            </Alert>
                        )}
                    </Stack>
                </Card>
            </GridCol>

            <GridCol span={{ base: 12, lg: 5 }}>
                <Card pos="sticky" top={96}>
                    <Stack align="center" gap="md">
                        {value ? (
                            <>
                                <NextImage
                                    src={svgUri}
                                    alt={`QR-code voor ${value}`}
                                    width={320}
                                    height={320}
                                    unoptimized
                                    style={{ width: '100%', maxWidth: 320, height: 'auto', borderRadius: 'var(--mantine-radius-md)' }}
                                />
                                <Group justify="center" gap="xs" wrap="wrap">
                                    <Button type="button" size="sm" onClick={downloadPng} leftSection={<Download size={16} />}>
                                        PNG
                                    </Button>
                                    <Button type="button" size="sm" onClick={downloadSvg} leftSection={<Download size={16} />}>
                                        SVG
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={copyImage}
                                        leftSection={copied ? <Check size={16} /> : <Copy size={16} />}
                                    >
                                        {copied ? 'Gekopieerd' : 'Kopieer'}
                                    </Button>
                                </Group>
                                {error && <Alert color="error">{error}</Alert>}
                            </>
                        ) : (
                            <Text c="dimmed" ta="center" py="xl">
                                Vul een link of tekst in om een QR-code te maken.
                            </Text>
                        )}
                    </Stack>
                </Card>
            </GridCol>
        </Grid>
    );
}
