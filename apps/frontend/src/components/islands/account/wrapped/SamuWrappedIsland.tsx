'use client';

import { Box, Image, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import Link from '@/components/ui/Link';
import { toBlob } from 'html-to-image';
import { X, Share2, Download, RotateCcw, Pause, ChevronLeft } from 'lucide-react';
import { type SamuWrappedStats } from '@/lib/wrapped/samu-wrapped.types';
import { BEELDMERK, buildWrappedSlides, prefersReducedMotion, WrappedShareCard } from './wrapped-slides';
import { safeConsoleError } from '@/server/utils/logger';

const SLIDE_DURATION_MS = 7000;
const HOLD_THRESHOLD_MS = 220;
const SWIPE_THRESHOLD_PX = 50;
/** Duur van de openingsanimatie; de eerste slide begint pas daarna met verschijnen. */
const INTRO_MS = 1950;
const INTRO_OFFSET_MS = 1650;
/** Tijd die de kleurveeg nodig heeft; nieuwe inhoud verschijnt pas als het vlak bijna dicht is. */
const WIPE_MS = 760;
const ENTER_OFFSET_MS = 260;

type Direction = 'next' | 'prev';

interface Transition {
    id: number;
    /** Sleutel van de vertrekkende slide (de id van de overgang waarmee hij binnenkwam) */
    prevId: number;
    from: number;
    dir: Direction;
}

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
    const [navId, setNavId] = useState(0);
    const [transition, setTransition] = useState<Transition | null>(null);
    const [intro, setIntro] = useState(true);
    const [paused, setPaused] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);

    const cardRef = useRef<HTMLDivElement>(null);
    const pointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heldRef = useRef(false);
    const indexRef = useRef(0);
    const navRef = useRef(0);

    const lastIndex = slides.length - 1;
    const isLast = index === lastIndex;
    const current = slides[index];

    /** Naar een slide gaan, met een kleurveeg in de richting van de navigatie. */
    const go = useCallback((target: number) => {
        const from = indexRef.current;
        const to = Math.max(0, Math.min(target, lastIndex));
        if (to === from) return;
        const prevId = navRef.current;
        const id = prevId + 1;
        indexRef.current = to;
        navRef.current = id;
        setIndex(to);
        setNavId(id);
        setTransition(prefersReducedMotion() ? null : { id, prevId, from, dir: to > from ? 'next' : 'prev' });
    }, [lastIndex]);

    const next = useCallback(() => go(indexRef.current + 1), [go]);
    const prev = useCallback(() => go(indexRef.current - 1), [go]);

    // Overgang opruimen zodra de veeg klaar is (timer i.p.v. animationend: werkt ook als animaties uit staan)
    useEffect(() => {
        if (!transition) return;
        const timer = setTimeout(() => setTransition(null), WIPE_MS);
        return () => clearTimeout(timer);
    }, [transition]);

    // Openingsanimatie: overslaan bij "minder beweging", anders na afloop weghalen
    useEffect(() => {
        if (prefersReducedMotion()) {
            setIntro(false);
            return;
        }
        const timer = setTimeout(() => setIntro(false), INTRO_MS);
        return () => clearTimeout(timer);
    }, []);

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

    /** Tikken op een quizknop is geen navigatie. */
    const isControl = (e: ReactPointerEvent<HTMLDivElement>) =>
        e.target instanceof Element && e.target.closest('button, a') !== null;

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (isControl(e)) return;
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
        if (!start || cancelled || isControl(e)) return;

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
                text: `Mijn Samu Wrapped ${stats.year}: ${stats.badges.featured.title} ${stats.badges.featured.emoji}`
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

    const leaving = transition && !isLast && slides[transition.from].id !== 'summary' ? slides[transition.from] : null;
    const dir: Direction = transition?.dir ?? 'next';
    /** Vertraging voor de in-animaties: na de opening, na een veeg, of direct */
    const enterOffset = `${navId === 0 ? (intro ? INTRO_OFFSET_MS : 0) : ENTER_OFFSET_MS}ms`;
    const baseTheme = transition ? slides[transition.from].theme : current.theme;

    const pageNumber = String(index + 1).padStart(2, '0');
    const pageTotal = String(slides.length).padStart(2, '0');

    return (
        <Box mod={{ 'wrapped-screen': true }} role="dialog" aria-modal="true" aria-label={`Samu Wrapped ${stats.year}`}>
            {/* Op desktop een kader op telefoonformaat, op mobiel volledig scherm */}
            <Box
                mod={{ 'wrapped-frame': true, 'wrapped-theme': current.theme }}
                style={{ '--w-offset': enterOffset, '--w-intro': `${INTRO_OFFSET_MS - 250}ms` } as CSSProperties}
            >
                {/* Kleurvlakken: het vorige thema eronder, het nieuwe veegt er schuin overheen */}
                <Box mod={{ 'wrapped-base': true, 'wrapped-theme': baseTheme }} aria-hidden />
                {transition && (
                    <Box key={transition.id} mod={{ 'wrapped-wipe': transition.dir, 'wrapped-theme': current.theme }} aria-hidden>
                        <Box mod={{ 'wrapped-wipe-stripe': true }} />
                        <Box mod={{ 'wrapped-wipe-fill': true }} />
                    </Box>
                )}

                {/* Openingsanimatie: geel en paars schuiven omhoog, het beeldmerk springt in beeld. Tik om over te slaan. */}
                {intro && (
                    <Box mod={{ 'wrapped-intro': true }} onPointerDown={() => setIntro(false)} aria-hidden>
                        <Box mod={{ 'wrapped-intro-panel': 'geel' }} />
                        <Box mod={{ 'wrapped-intro-panel': 'paars' }} />
                        <Box mod={{ 'wrapped-intro-center': true }}>
                            <Box mod={{ 'wrapped-intro-mark': true }}>
                                <Image src={BEELDMERK.brand} alt="" fit="contain" h="100%" w="auto" />
                            </Box>
                            <Box mod={{ 'wrapped-intro-words': true }}>
                                <Box component="span">Samu</Box>
                                <Box component="span">Wrapped</Box>
                                <Box component="span" mod={{ 'wrapped-intro-year': true }}>{stats.year}</Box>
                            </Box>
                        </Box>
                    </Box>
                )}

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
                                        style={isLast || current.interactive ? undefined : {
                                            animation: `wrapped-progress ${SLIDE_DURATION_MS}ms linear forwards`,
                                            animationPlayState: paused || intro ? 'paused' : 'running'
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
                    <Box
                        mod={{ 'wrapped-summary': true }}
                        onPointerDown={onPointerDown}
                        onPointerUp={(e) => endPointer(e)}
                        onPointerCancel={(e) => endPointer(e, true)}
                    >
                        <Box component="h2" mod={{ 'wrapped-summary-title': true, 'wrapped-reveal': true }} style={{ animationDelay: 'var(--w-offset, 0ms)' }}>Deel je Wrapped</Box>
                        <Box mod={{ 'wrapped-rise': true }} style={{ animationDelay: 'calc(var(--w-offset, 0ms) + 120ms)' }}>
                            {/* ref op een niet-geanimeerd element: html-to-image kopieert anders de in-animatie (lege afbeelding) */}
                            <Box ref={cardRef}>
                                <WrappedShareCard stats={stats} />
                            </Box>
                        </Box>
                        <Box mod={{ 'wrapped-actions': true, 'wrapped-rise': true }} style={{ animationDelay: 'calc(var(--w-offset, 0ms) + 300ms)' }}>
                            <UnstyledButton mod={{ 'wrapped-btn': 'primary' }} onClick={() => void handleShare()} disabled={sharing}>
                                <Share2 size={18} /> Delen
                            </UnstyledButton>
                            <UnstyledButton mod={{ 'wrapped-btn': 'ghost' }} onClick={() => void handleDownload()} disabled={sharing}>
                                <Download size={18} /> Opslaan
                            </UnstyledButton>
                        </Box>
                        {shareError && <Box component="p" mod={{ 'wrapped-error': true }} role="alert">{shareError}</Box>}
                        <Box mod={{ 'wrapped-links': true }}>
                            <UnstyledButton mod={{ 'wrapped-link': true }} onClick={prev}>
                                <ChevronLeft size={14} /> Vorige
                            </UnstyledButton>
                            <UnstyledButton mod={{ 'wrapped-link': true }} onClick={() => go(0)}>
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
                        {/* Vertrekkende slide blijft even staan (zelfde key = geen remount) en schuift weg onder de veeg */}
                        {leaving && transition && (
                            <Box
                                key={`${leaving.id}-${transition.prevId}`}
                                mod={{ 'wrapped-slide': 'leaving', 'wrapped-theme': leaving.theme, 'wrapped-dir': dir }}
                                aria-hidden
                            >
                                {leaving.content}
                            </Box>
                        )}
                        <Box key={`${current.id}-${navId}`} mod={{ 'wrapped-slide': 'active' }} aria-live="polite">
                            {current.content}
                        </Box>
                    </Box>
                )}

                {/* Voettekst zoals in de brandguide (niet op de laatste slide: daar moet alles zonder scrollen passen) */}
                {!isLast && <Box mod={{ 'wrapped-footer': true }}>
                    <Box component="span">{index + 1}.0 {current.section}</Box>
                    <Box component="span">{pageNumber} / {pageTotal}</Box>
                </Box>}

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
