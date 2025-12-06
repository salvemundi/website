'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { useDirectusStore } from '@/shared/lib/store/directusStore';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from '@/shared/ui/icons/ChevronRight';

export default function Hero() {
    const events = useDirectusStore((state) => state.events);
    const eventsLoading = useDirectusStore((state) => state.eventsLoading);
    const loadEvents = useDirectusStore((state) => state.loadEvents);
    const heroBanners = useDirectusStore((state) => state.heroBanners);
    const loadHeroBanners = useDirectusStore((state) => state.loadHeroBanners);

    useEffect(() => {
        loadEvents?.();
        loadHeroBanners?.();
    }, [loadEvents, loadHeroBanners]);

    const nextEvent = useMemo(() => {
        if (!events?.length) return null;

        const today = new Date();
        const upcoming = [...events]
            .map((event) => ({
                event,
                date: event.event_date ? new Date(event.event_date) : null,
            }))
            .filter((candidate) => candidate.date && !Number.isNaN(candidate.date.valueOf()))
            .sort((a, b) => (a.date!.valueOf() - b.date!.valueOf()));

        return (
            upcoming.find((candidate) => candidate.date && candidate.date >= today)?.event ??
            upcoming[0]?.event ??
            null
        );
    }, [events]);



    const formatEventDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Datum volgt';
            }
            return date.toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long'
            });
        } catch (error) {
            return 'Datum volgt';
        }
    };

    const defaultBanners = [
        "/logo_purple.svg",
    ];

    const calculatedSlides = useMemo(() => {
        return heroBanners?.length > 0
            ? heroBanners.map(b => getImageUrl(b.image, { quality: 75, width: 1200, format: 'webp' }))
            : defaultBanners;
    }, [heroBanners]);

    const [localSlides, setLocalSlides] = useState<string[]>(calculatedSlides);
    const [resolvedSlides, setResolvedSlides] = useState<string[] | null>(null);
    const heroRef = useRef<HTMLElement | null>(null);

    // Client-only flag for small screens. When true we avoid mounting
    // heavy DOM-manipulating libs like Swiper so they can't mutate
    // or remove the hero subtree on mobile devices.
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 639px)');
        const update = () => setIsMobile(Boolean(mq.matches));
        update();
        // add/remove listener in a compatible way
        if (mq.addEventListener) mq.addEventListener('change', update);
        else mq.addListener(update as any);
        return () => {
            try {
                if (mq.removeEventListener) mq.removeEventListener('change', update);
                else mq.removeListener(update as any);
            } catch (e) {
                // ignore
            }
        };
    }, []);

    // Preload remote images and only switch to them when at least one loads successfully
    useEffect(() => {
        if (!heroBanners || heroBanners.length === 0) {
            // keep defaults
            setLocalSlides(defaultBanners);
            return;
        }

        let cancelled = false;
        const urls = calculatedSlides;
        let loaded = 0;
        let errored = 0;

        const imgs: HTMLImageElement[] = [];

        urls.forEach((u) => {
            const img = document.createElement('img');
            imgs.push(img);
            img.onload = () => {
                loaded += 1;
                if (!cancelled && loaded > 0) {
                    // at least one image loaded, use the remote slides
                    setLocalSlides(urls);
                }
            };
            img.onerror = () => {
                errored += 1;
                // if all errored, keep defaults
                if (!cancelled && errored === urls.length) {
                    setLocalSlides(defaultBanners);
                }
            };
            img.src = u;
        });

        return () => {
            cancelled = true;
            imgs.forEach((i) => {
                i.onload = null;
                i.onerror = null;
            });
        };
    }, [heroBanners, calculatedSlides]);

    // Capture the initial mobile fallback at first render so we don't
    // replace it later when slides are updated (prevents a visible flicker
    // where the mobile image changes after a short moment).
    const initialMobileFallback = useRef<string>((calculatedSlides && calculatedSlides[0]) || defaultBanners[0]);
    const [mobileSrc, setMobileSrc] = useState<string | null>(null);

    // Preload the preferred mobile image (prefer resolvedSlides[0], then localSlides[0])
    // and only set `mobileSrc` after the image has fully loaded. If no image loads
    // within `fallbackDelayMs`, set the initial fallback so the area isn't blank
    // forever. This prevents showing the default first and then swapping.
    useEffect(() => {
        if (!isMobile) return;

        const fallbackDelayMs = 1000; // show fallback after 1s if nothing loads
        let cancelled = false;
        let timeoutHandle: number | undefined;

        const primary = (resolvedSlides && resolvedSlides[0]) || (localSlides && localSlides[0]);
        const trySet = (candidate?: string | null) => {
            if (!candidate) return false;
            const normalized = (typeof window !== 'undefined' && typeof candidate === 'string' && candidate.startsWith('/'))
                ? `${window.location.origin}${candidate}`
                : candidate;
            if (normalized === mobileSrc) return true;
            const img = document.createElement('img');
            img.onload = () => {
                if (cancelled) return;
                setMobileSrc(normalized);
            };
            img.onerror = () => {
                // try next option if available
            };
            img.src = normalized;
            return true;
        };

        // Start attempting to load the primary candidate
        if (!trySet(primary)) {
            // primary missing; set a timeout to fallback
            timeoutHandle = window.setTimeout(() => {
                if (cancelled) return;
                const fb = initialMobileFallback.current;
                const normalized = (typeof window !== 'undefined' && typeof fb === 'string' && fb.startsWith('/'))
                    ? `${window.location.origin}${fb}`
                    : fb;
                setMobileSrc(normalized);
            }, fallbackDelayMs);
        } else {
            // we did start loading primary; as a safety, still set a fallback
            // after delay in case it never resolves
            timeoutHandle = window.setTimeout(() => {
                if (cancelled) return;
                if (!mobileSrc) {
                    const fb = initialMobileFallback.current;
                    const normalized = (typeof window !== 'undefined' && typeof fb === 'string' && fb.startsWith('/'))
                        ? `${window.location.origin}${fb}`
                        : fb;
                    setMobileSrc(normalized);
                }
            }, fallbackDelayMs);
        }

        return () => {
            cancelled = true;
            if (timeoutHandle) clearTimeout(timeoutHandle);
        };
    }, [isMobile, resolvedSlides, localSlides]);

    // Resolve absolute URLs only after client mount to avoid SSR hydration mismatch
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const resolved = localSlides.map((s) => (s && s.startsWith('/') ? `${window.location.origin}${s}` : s));
            setResolvedSlides(resolved);
        } catch (e) {
            setResolvedSlides(localSlides.slice());
        }
    }, [localSlides]);

    // (removed development-only debug logging)

    // (removed development-only debug body image)

    // (removed development-only floating portal image)

    // (removed development-only MutationObserver/overlay detection)

    const [hoverNextEvent, setHoverNextEvent] = useState(false);
    const [hoverWordLid, setHoverWordLid] = useState(false);

    return (
        <section ref={heroRef} id="home" className="relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full max-w-app mx-auto py-8 sm:py-12 md:py-16 lg:py-20 transition-colors duration-300">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full blur-3xl opacity-20 bg-theme-purple/30" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full blur-3xl opacity-20 bg-theme-purple/30" />

            {/* Move mobile fallback to be a direct child of the section so nested
                inner elements cannot accidentally cover/unmount it. */}
            {/* Mobile static image: render in-layout (not absolute) so it remains
                part of the hero content and isn't affected by outside DOM
                mutations. Hidden on sm+ to preserve desktop Swiper. */}

            <div className="relative w-full px-4 sm:px-6 ">
                <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 lg:items-center">
                    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="text-3xl font-black leading-tight sm:text-4xl  md:text-5xl lg:text-6xl text-gradient-animated pb-1">
                                <span className="block">Welkom bij</span>
                                <span className="block">Salve Mundi</span>
                            </h1>
                            <p className="text-sm leading-relaxed text-theme-muted sm:text-base md:text-lg lg:max-w-xl">
                                Dé studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd met onze diverse activiteiten en gezellige commissies.
                            </p>
                        </div>



                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            {nextEvent ? (
                                <Link
                                    href={`/activiteiten/${nextEvent.id}`}
                                    className="block w-full transition-transform hover:scale-[1.02]"
                                >
                                    <div className="inset-x-4 bottom-4 w-full sm:inset-x-6 sm:bottom-6 rounded-2xl sm:rounded-3xl bg-gradient-theme-vertical p-4 sm:p-6 shadow-lg backdrop-blur cursor-pointer flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-theme-white">
                                                Volgende evenement
                                            </p>
                                            <p className="mt-2 text-base sm:text-lg font-bold text-theme-white truncate">
                                                {nextEvent.name} • {formatEventDate(nextEvent.event_date)}
                                            </p>
                                            <p className="mt-1 text-xs sm:text-sm text-theme-white line-clamp-2">
                                                {nextEvent.description || "Kom gezellig langs bij ons volgende evenement!"}
                                            </p>
                                        </div>
                                                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white text-theme-purple flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                                                    onMouseEnter={() => setHoverNextEvent(true)}
                                                    onMouseLeave={() => setHoverNextEvent(false)}
                                                >
                                                    <ChevronRight width={20} height={20} strokeWidth={2} __active={hoverNextEvent} />
                                                </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="inset-x-4 bottom-4 w-full sm:inset-x-6 sm:bottom-6 rounded-2xl sm:rounded-3xl bg-gradient-theme-vertical p-4 sm:p-6 shadow-lg backdrop-blur">
                                    <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-theme-white">
                                        Volgende evenement
                                    </p>
                                    {eventsLoading ? (
                                        <div className="mt-2 space-y-2">
                                            <div className="h-5 sm:h-6 w-3/4 animate-pulse rounded bg-theme-purple/20"></div>
                                            <div className="h-3 sm:h-4 w-full animate-pulse rounded bg-theme-purple/20"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="mt-2 text-base sm:text-lg font-bold text-theme">
                                                Binnenkort meer activiteiten
                                            </p>
                                            <p className="mt-1 text-xs sm:text-sm text-theme-muted line-clamp-2">
                                                Check regelmatig onze agenda voor nieuwe evenementen en activiteiten.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                            <a
                                href="/lidmaatschap"
                                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-theme px-8 py-4 text-lg font-bold text-theme-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-theme-purple/30"
                                onMouseEnter={() => setHoverWordLid(true)}
                                onMouseLeave={() => setHoverWordLid(false)}
                            >
                                Word lid
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold sm:h-6 sm:w-6">
                                    <ChevronRight width={14} height={14} strokeWidth={2} __active={hoverWordLid} />
                                </span>
                            </a>
                            <a
                                href="/activiteiten"
                                className="inline-flex items-center text-theme-purple-darker justify-center gap-2 rounded-full bg-primary-100 px-5 py-2.5 text-sm font-semibold text-theme-purple shadow-sm transition hover:bg-theme-purple/5 sm:px-6 hover:scale-105 hover:shadow-xl sm:py-3"
                            >
                                Bekijk activiteiten
                            </a>
                        </div>
                    </div>




                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/80 shadow-2xl backdrop-blur-xl overflow-hidden">
                            <div className="h-[240px] sm:h-[300px] md:h-[380px] lg:h-[480px] xl:h-[540px]">
                                {/* Mobile fallback: sometimes Swiper or remote assets misbehave on small devices.
                                    Show a single static image for mobile (hidden on sm+). */}
                                {/* Mobile fallback moved to top of section; keep the inner area clean */}

                                {isMobile ? (
                                    <div className="sm:hidden w-full h-full flex items-center justify-center relative">
                                        {mobileSrc && (
                                            <Image
                                                src={mobileSrc}
                                                alt="Salve Mundi"
                                                fill
                                                priority
                                                quality={75}
                                                sizes="(max-width: 640px) 100vw, 0px"
                                                className="object-cover object-center"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <Swiper
                                        modules={[Autoplay]}
                                        autoplay={{
                                            delay: 5000,
                                            disableOnInteraction: false,
                                        }}
                                        loop={(resolvedSlides || localSlides).length > 1}
                                        allowTouchMove={(resolvedSlides || localSlides).length > 1}
                                        className="hidden sm:block h-full w-full"
                                    >
                                        {(resolvedSlides || localSlides).map((src, index) => (
                                            <SwiperSlide key={index}>
                                                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-card)]/0 relative">
                                                    <Image
                                                        src={src}
                                                        alt="Salve Mundi sfeerimpressie"
                                                        fill
                                                        priority={index === 0}
                                                        quality={75}
                                                        sizes="(min-width: 640px) 50vw, 0px"
                                                        className="object-cover object-center"
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                )}
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

