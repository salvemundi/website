'use client';

import { Box, Image, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from '@/components/ui/Link';
import { toBlob } from 'html-to-image';
import { X, Share2, Download, RotateCcw, Pause } from 'lucide-react';
import { type SamuWrappedStats } from '@/lib/wrapped/samu-wrapped.types';
import { BEELDMERK, buildWrappedSlides, WrappedShareCard } from './wrapped-slides';
import { safeConsoleError } from '@/server/utils/logger';

const SLIDE_DURATION_MS = 7000;
const HOLD_THRESHOLD_MS = 220;
const SWIPE_THRESHOLD_PX = 50;

interface Props {
    stats: SamuWrappedStats;
}

export default function SamuWrappedIsland({ stats }: Props) {
    const slides = useMemo(() => {
        const built = buildWrappedSlides(stats);
        built.push({ id: 'summary', section: 'Delen', theme: 'dark', content: null });
        return built;
    }, [stats]);

    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);

    const cardRef = useRef<HTMLDivElement>(null);
    const pointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heldRef = useRef(false);

    const lastIndex = slides.length - 1;
    const isLast = index === lastIndex;
    const current = slides[index];

    const next = useCallback(() => setIndex((i) => Math.min(i + 1, lastIndex)), [lastIndex]);
    const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

    // Scrollen van de pagina blokkeren terwijl Wrapped open is
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    // Toetsenbord (desktop)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'p') setPaused((p) => !p);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [next, prev]);

    // Pauzeren als de app naar de achtergrond gaat
    useEffect(() => {
        const onVisibility = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        pointerRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        heldRef.current = false;
        holdTimer.current = setTimeout(() => {
            heldRef.current = true;
            setPaused(true);
        }, HOLD_THRESHOLD_MS);
    };

    const endPointer = (e: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        const start = pointerRef.current;
        pointerRef.current = null;

        if (heldRef.current) {
            heldRef.current = false;
            setPaused(false);
            return;
        }
        if (!start || cancelled) return;

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) next(); else prev();
            return;
        }
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            const width = e.currentTarget.getBoundingClientRect().width;
            if (e.clientX < width * 0.3) prev(); else next();
        }
    };

    const fileName = `samu-wrapped-${stats.year}.png`;
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);

    /**
     * Rendert de deelkaart naar PNG.
     * - toBlob i.p.v. toPng + fetch(dataUrl): de CSP (connect-src) blokkeert fetch naar data:-URL's.
     * - Safari mist bij de eerste render soms fonts; daarom twee keer renderen.
     * - Lukt het inbedden van fonts niet, dan nog een poging zonder fonts.
     */
    const renderImage = useCallback(async (): Promise<Blob | null> => {
        const node = cardRef.current;
        if (!node) return null;
        const options = { pixelRatio: 3, cacheBust: true };
        try {
            await toBlob(node, options);
            return await toBlob(node, options);
        } catch (error) {
            safeConsoleError('[SamuWrappedIsland.tsx][renderImage] retry zonder fonts', error);
            return toBlob(node, { ...options, skipFonts: true });
        }
    }, []);

    // Vooraf renderen zodra de laatste slide zichtbaar is (na de in-animatie), zodat "Delen"
    // direct binnen de klik kan gebeuren; iOS weigert navigator.share na een lange await.
    useEffect(() => {
        if (!isLast) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            renderImage()
                .then((blob) => { if (!cancelled) setImageBlob(blob); })
                .catch((error: unknown) => safeConsoleError('[SamuWrappedIsland.tsx][prerender]', error));
        }, 1200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [isLast, renderImage]);

    const getBlob = async (): Promise<Blob | null> => imageBlob ?? (await renderImage());

    const handleShare = async () => {
        setShareError(null);
        try {
            const blob = imageBlob;
            if (blob) {
                // Geen await vóór share: de klik-activatie moet behouden blijven
                await shareOrDownload(blob);
                return;
            }
            setSharing(true);
            const rendered = await renderImage();
            if (!rendered) throw new Error('Render mislukt');
            setImageBlob(rendered);
            await shareOrDownload(rendered);
        } catch (error) {
            // AbortError = gebruiker sloot het deelmenu zelf
            if (error instanceof DOMException && error.name === 'AbortError') return;
            safeConsoleError('[SamuWrappedIsland.tsx][handleShare]', error);
            setShareError('Delen lukte niet. Probeer het nog eens of gebruik Opslaan.');
        } finally {
            setSharing(false);
        }
    };

    const shareOrDownload = async (blob: Blob) => {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Mijn Samu Wrapped ${stats.year}`,
                text: `Mijn Samu Wrapped ${stats.year}: ${stats.persona.title}`
            });
        } else {
            downloadBlob(blob, fileName);
        }
    };

    const handleDownload = async () => {
        setShareError(null);
        setSharing(!imageBlob);
        try {
            const blob = await getBlob();
            if (!blob) throw new Error('Render mislukt');
            downloadBlob(blob, fileName);
        } catch (error) {
            safeConsoleError('[SamuWrappedIsland.tsx][handleDownload]', error);
            setShareError('Opslaan lukte niet. Probeer het nog eens.');
        } finally {
            setSharing(false);
        }
    };

    const pageNumber = String(index + 1).padStart(2, '0');
    const pageTotal = String(slides.length).padStart(2, '0');

    return (
        <Box mod={{ 'wrapped-screen': true }} role="dialog" aria-modal="true" aria-label={`Samu Wrapped ${stats.year}`}>
            {/* Op desktop een kader op telefoonformaat, op mobiel volledig scherm */}
            <Box mod={{ 'wrapped-frame': true, 'wrapped-theme': current.theme }}>
                {/* Kop: voortgang, beeldmerk + "Salve Mundi", sluiten */}
                <Box mod={{ 'wrapped-top': true }}>
                    <Box mod={{ 'wrapped-progress': true }} aria-hidden>
                        {slides.map((s, i) => (
                            <Box key={s.id} mod={{ 'wrapped-segment': true }}>
                                {i < index && <Box mod={{ 'wrapped-fill': true }} />}
                                {i === index && (
                                    <Box
                                        key={`${s.id}-${index}`}
                                        mod={{ 'wrapped-fill': true }}
                                        style={isLast ? undefined : {
                                            animation: `wrapped-progress ${SLIDE_DURATION_MS}ms linear forwards`,
                                            animationPlayState: paused ? 'paused' : 'running'
                                        }}
                                        onAnimationEnd={next}
                                    />
                                )}
                            </Box>
                        ))}
                    </Box>
                    <Box mod={{ 'wrapped-header': true }}>
                        <Box mod={{ 'wrapped-brand': true }}>
                            <Box mod={{ 'wrapped-brand-mark': true }}>
                                <Image src={BEELDMERK[current.theme]} alt="" fit="contain" h="100%" w="auto" />
                            </Box>
                            <Box component="span">Salve Mundi</Box>
                        </Box>
                        <Box mod={{ 'wrapped-header-actions': true }}>
                            {paused && <Pause size={16} aria-label="Gepauzeerd" />}
                            <Link href="/profiel" aria-label="Sluiten" data-wrapped-close="">
                                <X size={24} />
                            </Link>
                        </Box>
                    </Box>
                </Box>

                {isLast ? (
                    <Box mod={{ 'wrapped-summary': true }}>
                        <Box mod={{ 'wrapped-rise': true }}>
                            <Box component="p" mod={{ 'wrapped-kicker': true }}>Dat was je jaar</Box>
                            <Box component="h2" mod={{ 'wrapped-title': true }}>Deel je Wrapped</Box>
                        </Box>
                        <Box mod={{ 'wrapped-rise': true }} style={{ animationDelay: '100ms' }}>
                            {/* ref op een niet-geanimeerd element: html-to-image kopieert anders de in-animatie (lege afbeelding) */}
                            <Box ref={cardRef}>
                                <WrappedShareCard stats={stats} />
                            </Box>
                        </Box>
                        <Box mod={{ 'wrapped-actions': true, 'wrapped-rise': true }} style={{ animationDelay: '250ms' }}>
                            <UnstyledButton mod={{ 'wrapped-btn': 'primary' }} onClick={() => void handleShare()} disabled={sharing}>
                                <Share2 size={18} /> Delen
                            </UnstyledButton>
                            <UnstyledButton mod={{ 'wrapped-btn': 'ghost' }} onClick={() => void handleDownload()} disabled={sharing}>
                                <Download size={18} /> Opslaan
                            </UnstyledButton>
                        </Box>
                        {shareError && <Box component="p" mod={{ 'wrapped-error': true }} role="alert">{shareError}</Box>}
                        <Box mod={{ 'wrapped-links': true }}>
                            <UnstyledButton mod={{ 'wrapped-link': true }} onClick={() => setIndex(0)}>
                                <RotateCcw size={14} /> Opnieuw bekijken
                            </UnstyledButton>
                            <Link href="/profiel" data-wrapped-link="">Terug naar profiel</Link>
                        </Box>
                    </Box>
                ) : (
                    <Box
                        mod={{ 'wrapped-stage': true }}
                        onPointerDown={onPointerDown}
                        onPointerUp={(e) => endPointer(e)}
                        onPointerCancel={(e) => endPointer(e, true)}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <Box key={current.id} aria-live="polite">
                            {current.content}
                        </Box>
                    </Box>
                )}

                {/* Voettekst zoals in de brandguide: haarlijn, sectie links, paginanummer rechts */}
                <Box mod={{ 'wrapped-footer': true }}>
                    <Box component="span">{index + 1}.0 {current.section}</Box>
                    <Box component="span">{pageNumber} / {pageTotal}</Box>
                </Box>

                {/* Toegankelijke navigatieknoppen voor toetsenbord/screenreaders */}
                <VisuallyHidden>
                    <UnstyledButton onClick={prev} disabled={index === 0}>Vorige</UnstyledButton>
                    <UnstyledButton onClick={next} disabled={isLast}>Volgende</UnstyledButton>
                    <UnstyledButton onClick={() => setPaused((p) => !p)}>{paused ? 'Afspelen' : 'Pauzeren'}</UnstyledButton>
                </VisuallyHidden>
            </Box>
        </Box>
    );
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    // Firefox vereist dat de link in het document staat
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
