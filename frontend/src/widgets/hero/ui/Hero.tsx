'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { useDirectusStore } from '@/shared/lib/store/directusStore';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from '@/shared/ui/icons/ChevronRight';
import { useAuth } from '@/features/auth/providers/auth-provider';


export default function Hero() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const events = useDirectusStore((state) => state.events);
    const eventsLoading = useDirectusStore((state) => state.eventsLoading);
    const loadEvents = useDirectusStore((state) => state.loadEvents);
    const heroBanners = useDirectusStore((state) => state.heroBanners);
    const loadHeroBanners = useDirectusStore((state) => state.loadHeroBanners);
    const [hoverWordLid, setHoverWordLid] = useState(false);
    const [hoverNextEvent, setHoverNextEvent] = useState(false);

    // Refs for GSAP animations
    const heroRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const eventCardRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadEvents?.();
        loadHeroBanners?.();
    }, [loadEvents, loadHeroBanners]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // GSAP Animations
    useEffect(() => {
        if (!heroRef.current || !isMounted) return;

        const ctx = gsap.context(() => {
            // Timeline for hero entrance
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Animate title with character-by-character reveal
            if (titleRef.current) {
                const spans = titleRef.current.querySelectorAll('span');

                // Split each span into individual characters
                spans.forEach((span) => {
                    const text = span.textContent || '';
                    span.innerHTML = ''; // Clear the span

                    // Create a character span for each letter
                    text.split('').forEach((char) => {
                        const charSpan = document.createElement('span');
                        charSpan.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space
                        span.appendChild(charSpan);
                    });
                });

                // Now animate all character spans with stagger
                const allChars = titleRef.current.querySelectorAll('span span');
                tl.from(allChars, {
                    opacity: 0,
                    y: 20,
                    rotationX: -90,
                    transformOrigin: '50% 50%',
                    duration: 0.6,
                    stagger: 0.03,
                    ease: 'back.out(1.7)',
                }, 0.2);
            }

            // Animate description
            if (descriptionRef.current) {
                tl.from(descriptionRef.current, {
                    opacity: 0,
                    y: 30,
                    duration: 0.8,
                }, 0.6);
            }

            // Animate event card
            if (eventCardRef.current) {
                tl.from(eventCardRef.current, {
                    opacity: 0,
                    y: 30,
                    duration: 0.8,
                }, 0.8);
            }

            // Animate buttons
            if (buttonsRef.current) {
                const buttons = buttonsRef.current.querySelectorAll('a');
                tl.from(buttons, {
                    opacity: 0,
                    y: 20,
                    duration: 0.6,
                    stagger: 0.1,
                }, 1.0);
            }

            // Animate image container
            if (imageRef.current) {
                tl.from(imageRef.current, {
                    opacity: 0,
                    scale: 0.95,
                    duration: 1,
                }, 0.4);
            }

        }, heroRef);

        return () => ctx.revert();
    }, [isMounted]);


    const nextEvent = useMemo(() => {
        if (!events?.length) return null;

        const now = new Date();
        const upcoming = [...events]
            .map((event) => ({
                event,
                raw: event.event_date,
                date: event.event_date ? new Date(event.event_date) : null,
            }))
            .filter((candidate) => candidate.date && !Number.isNaN(candidate.date.valueOf()))
            .sort((a, b) => (a.date!.valueOf() - b.date!.valueOf()));

        // Prefer the first event whose datetime (or end-of-day for date-only) is >= now
        const found = upcoming.find((candidate) => {
            const { raw, date } = candidate as { raw: string; date: Date };
            if (!date) return false;
            const hasTime = /T|\d:\d{2}/.test(String(raw));
            if (hasTime) return date >= now;
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            return endOfDay >= now;
        });

        return found?.event ?? upcoming[0]?.event ?? null;
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
            ? heroBanners.map(b => getImageUrl(b.image))
            : defaultBanners;
    }, [heroBanners]);

    const [localSlides, setLocalSlides] = useState<string[]>(calculatedSlides);
    const [resolvedSlides, setResolvedSlides] = useState<string[] | null>(null);

    // Client-only flag for small screens. When true we avoid mounting
    // heavy DOM-manipulating libs like Swiper so they can't mutate
    // or remove the hero subtree on mobile devices.
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 639px)');
        const applyUpdate = (e?: MediaQueryListEvent) => setIsMobile(Boolean(e ? e.matches : mq.matches));
        applyUpdate();
        const onChange = (e: MediaQueryListEvent) => applyUpdate(e);
        // add/remove listener in a compatible way
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
        return () => {
            try {
                if (mq.removeEventListener) mq.removeEventListener('change', onChange);
                else mq.removeListener(onChange as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
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

    // Use the first available slide immediately for mobile, with fallback to default
    const mobileSrc = useMemo(() => {
        if (!isMobile) return null;
        const primary = (resolvedSlides && resolvedSlides[0]) || (localSlides && localSlides[0]) || defaultBanners[0];
        // Normalize to absolute URL if needed for consistency
        if (typeof window !== 'undefined' && typeof primary === 'string' && primary.startsWith('/')) {
            return `${window.location.origin}${primary}`;
        }
        return primary;
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





    // Show membership link if not authenticated (and auth is done loading)
    const showMembershipLink = !authLoading && !isAuthenticated;

    // Only apply a min-height on medium+ screens so mobile won't force a
    // large empty area. On md+ we ensure the hero fills the viewport minus the header.
    return (
        <section ref={heroRef} id="home" className="relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full min-h-[450px] md:min-h-[500px] py-4 sm:py-8 lg:py-12 transition-colors duration-300">

            {/* Mobile-only fallback image (shows ONLY on very small screens, for robustness)
                This ensures even if Swiper fails or images don't load, we have a visual.
                Hidden on sm+ where Swiper takes over fully. This is embedded as 
                part of the hero content and isn't affected by outside DOM
                mutations. Hidden on sm+ to preserve desktop Swiper. */}

            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="relative w-full px-0">
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20 md:items-center">
                        <div className="space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                <h1 ref={titleRef} className="text-gradient-animated text-2xl font-black leading-tight sm:text-3xl md:text-5xl lg:text-6xl pb-1" style={{ fontWeight: 950, WebkitTextStroke: '0.5px currentColor' }}>
                                    <span>Studievereniging</span>
                                    <br />
                                    <span className="inline-block w-full">Salve Mundi</span>
                                </h1>
                                <p ref={descriptionRef} className="text-xs leading-relaxed text-theme-muted sm:text-sm md:text-lg lg:max-w-xl">
                                    Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd met onze diverse activiteiten en gezellige commissies.
                                </p>
                            </div>



                            <div className="w-full max-w-full">
                                <div className="flex flex-wrap gap-3 sm:gap-4 min-h-[100px]">
                                    {authLoading ? (
                                        <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/10 p-4 sm:p-6 shadow-lg backdrop-blur min-h-[90px] sm:min-h-[100px] animate-pulse border border-theme-purple/10">
                                            <div className="h-4 w-24 bg-theme-purple/10 rounded mb-3"></div>
                                            <div className="h-6 w-3/4 bg-theme-purple/10 rounded mb-2"></div>
                                            <div className="h-4 w-1/2 bg-theme-purple/10 rounded"></div>
                                        </div>
                                    ) : showMembershipLink ? (
                                        <Link
                                            href="/lidmaatschap"
                                            className="block w-full transition-transform hover:scale-[1.02] group/lid"
                                        >
                                            <div className="w-full max-w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur cursor-pointer flex items-center justify-between gap-3 sm:gap-4 min-h-[90px] sm:min-h-[100px] overflow-hidden">
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <p className="text-[0.6rem] sm:text-xs font-semibold uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60">
                                                        Word lid
                                                    </p>
                                                    <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg font-bold text-theme-purple dark:text-theme-white truncate">
                                                        Sluit je aan bij Salve Mundi
                                                    </p>
                                                    <p className="mt-0.5 sm:mt-1 text-[0.7rem] sm:text-xs md:text-sm text-theme-text-muted dark:text-theme-text-muted line-clamp-2">
                                                        Ontdek alle voordelen van een lidmaatschap!
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-theme-purple/10 dark:bg-white/10 text-theme-purple dark:text-theme-white flex items-center justify-center shadow-md transition-all group-hover/lid:bg-gradient-theme group-hover/lid:text-white"
                                                    onMouseEnter={() => setHoverWordLid(true)}
                                                    onMouseLeave={() => setHoverWordLid(false)}
                                                >
                                                    <ChevronRight width={20} height={20} strokeWidth={2} __active={hoverWordLid} />
                                                </div>
                                            </div>
                                        </Link>
                                    ) : nextEvent ? (
                                        <Link
                                            href={`/activiteiten/${nextEvent.id}`}
                                            className="block w-full transition-transform hover:scale-[1.02] group/event"
                                        >
                                            <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 sm:p-6 shadow-lg backdrop-blur cursor-pointer flex items-center justify-between gap-4 min-h-[90px] sm:min-h-[100px]">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-theme-purple/60 dark:text-theme-white/60">
                                                        Volgende evenement
                                                    </p>
                                                    <p className="mt-2 text-base sm:text-lg font-bold text-theme-purple dark:text-theme-white truncate">
                                                        {nextEvent.name} • {formatEventDate(nextEvent.event_date)}
                                                    </p>
                                                    <p className="mt-1 text-xs sm:text-sm text-theme-text-muted dark:text-theme-text-muted line-clamp-2">
                                                        {nextEvent.description || "Kom gezellig langs bij ons volgende evenement!"}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-theme-purple/10 dark:bg-white/10 text-theme-purple dark:text-theme-white flex items-center justify-center shadow-md transition-all group-hover/event:bg-gradient-theme group-hover/event:text-white"
                                                    onMouseEnter={() => setHoverNextEvent(true)}
                                                    onMouseLeave={() => setHoverNextEvent(false)}
                                                >
                                                    <ChevronRight width={20} height={20} strokeWidth={2} __active={hoverNextEvent} />
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 sm:p-6 shadow-lg backdrop-blur min-h-[90px] sm:min-h-[100px]">
                                            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-theme-purple/60 dark:text-theme-white/60">
                                                Volgende evenement
                                            </p>
                                            {eventsLoading ? (
                                                <div className="mt-2 space-y-2">
                                                    <div className="h-5 sm:h-6 w-3/4 animate-pulse rounded bg-theme-purple/10"></div>
                                                    <div className="h-3 sm:h-4 w-full animate-pulse rounded bg-theme-purple/10"></div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="mt-2 text-base sm:text-lg font-bold text-theme-purple dark:text-theme-white">
                                                        Binnenkort meer activiteiten
                                                    </p>
                                                    <p className="mt-1 text-xs sm:text-sm text-theme-text-muted dark:text-theme-text-muted line-clamp-2">
                                                        Check regelmatig onze agenda voor nieuwe evenementen en activiteiten.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>




                        <div className="flex flex-wrap gap-3 sm:gap-4 min-w-0">
                            <div ref={imageRef} className="relative w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/80 shadow-2xl backdrop-blur-xl overflow-hidden">
                                <div className="h-[240px] sm:h-[280px] md:h-[350px] lg:h-[480px] xl:h-[540px]">
                                    {/* Mobile fallback: sometimes Swiper or remote assets misbehave on small devices.
                                        Show a single static image for mobile (hidden on sm+). */}
                                    {/* Mobile fallback moved to top of section; keep the inner area clean */}

                                    {isMobile ? (
                                        <div className="sm:hidden w-full h-full flex items-center justify-center relative">
                                            {mobileSrc ? (
                                                <Image
                                                    src={mobileSrc}
                                                    alt="Salve Mundi"
                                                    fill
                                                    priority
                                                    unoptimized={true}
                                                    sizes="(max-width: 640px) 100vw, 0px"
                                                    className="object-cover object-center"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-theme">
                                                    <div className="text-white text-center">
                                                        <div className="text-4xl font-bold">Salve Mundi</div>
                                                    </div>
                                                </div>
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
                                                            unoptimized={true}
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
            </div>
        </section>
    );
}

