'use client';

import { Box, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from '@/components/ui/Link';
import { toPng } from 'html-to-image';
import { X, Share2, Download, RotateCcw, Pause } from 'lucide-react';
import { type SamuWrappedStats } from '@/lib/wrapped/samu-wrapped.types';
import { buildWrappedSlides, WrappedShareCard } from './wrapped-slides';
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
        built.push({ id: 'summary', background: 'linear-gradient(180deg, #2d1933 0%, #120814 100%)', content: null });
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

    const renderImage = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
        const res = await fetch(dataUrl);
        return res.blob();
    };

    const handleShare = async () => {
        setSharing(true);
        setShareError(null);
        try {
            const blob = await renderImage();
            if (!blob) return;
            const file = new File([blob], `samu-wrapped-${stats.year}.png`, { type: 'image/png' });

            if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Mijn Samu Wrapped ${stats.year}`,
                    text: `Mijn jaar bij Salve Mundi: ${stats.persona.title} ${stats.persona.emoji}`
                });
            } else {
                downloadBlob(blob, file.name);
            }
        } catch (error) {
            // AbortError = gebruiker sloot het deelmenu zelf
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                safeConsoleError('[SamuWrappedIsland.tsx][handleShare]', error);
                setShareError('Delen lukte niet. Probeer opslaan.');
            }
        } finally {
            setSharing(false);
        }
    };

    const handleDownload = async () => {
        setSharing(true);
        setShareError(null);
        try {
            const blob = await renderImage();
            if (blob) downloadBlob(blob, `samu-wrapped-${stats.year}.png`);
        } catch (error) {
            safeConsoleError('[SamuWrappedIsland.tsx][handleDownload]', error);
            setShareError('Opslaan lukte niet.');
        } finally {
            setSharing(false);
        }
    };

    return (
        <Box mod={{ 'wrapped-screen': true }} role="dialog" aria-modal="true" aria-label={`Samu Wrapped ${stats.year}`}>
            {/* Op desktop een telefoon-formaat kader, op mobiel volledig scherm */}
            <Box mod={{ 'wrapped-frame': true }} style={{ background: current.background }}>
                <Box mod={{ 'wrapped-blobs': true }} aria-hidden>
                    <Box mod={{ 'wrapped-blob': 'a' }} />
                    <Box mod={{ 'wrapped-blob': 'b' }} />
                </Box>

                {/* Voortgang + sluiten */}
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
                        <Box component="span" mod={{ 'wrapped-label': true }}>Samu Wrapped {stats.year}</Box>
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
                        <Box mod={{ 'wrapped-summary-head': true, 'wrapped-rise': true }}>
                            <Box component="p" mod={{ 'wrapped-kicker': true }}>Dat was jouw jaar!</Box>
                            <Box component="h2" mod={{ 'wrapped-summary-title': true }}>Deel je Wrapped</Box>
                        </Box>
                        <Box ref={cardRef} mod={{ 'wrapped-pop': true }} style={{ animationDelay: '150ms' }}>
                            <WrappedShareCard stats={stats} />
                        </Box>
                        <Box mod={{ 'wrapped-actions': true, 'wrapped-rise': true }} style={{ animationDelay: '500ms' }}>
                            <UnstyledButton mod={{ 'wrapped-btn': 'primary' }} onClick={() => void handleShare()} disabled={sharing}>
                                <Share2 size={20} /> Delen
                            </UnstyledButton>
                            <UnstyledButton mod={{ 'wrapped-btn': 'ghost' }} onClick={() => void handleDownload()} disabled={sharing}>
                                <Download size={20} /> Opslaan
                            </UnstyledButton>
                        </Box>
                        {shareError && <Box component="p" mod={{ 'wrapped-error': true }} role="alert">{shareError}</Box>}
                        <Box mod={{ 'wrapped-links': true }}>
                            <UnstyledButton mod={{ 'wrapped-link': true }} onClick={() => setIndex(0)}>
                                <RotateCcw size={16} /> Opnieuw bekijken
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
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
