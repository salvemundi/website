'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from '@/shared/ui/icons/ChevronRight';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { Event, HeroBanner } from '@/shared/model/types/directus';
import { getImageUrl } from '@/shared/lib/api/salvemundi';


interface HeroClientProps {
    heroBanners: HeroBanner[];
    nextEvent: Event | null;
}

export default function HeroClient({ heroBanners, nextEvent }: HeroClientProps) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [hoverWordLid, setHoverWordLid] = useState(false);
    const [hoverNextEvent, setHoverNextEvent] = useState(false);

    // Refs for GSAP animations
    const heroRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const eventCardRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // GSAP Animations
    useEffect(() => {
        if (!heroRef.current || !isMounted) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            if (titleRef.current) {
                const spans = titleRef.current.querySelectorAll('span');
                spans.forEach((span) => {
                    const text = span.textContent || '';
                    span.innerHTML = '';
                    text.split('').forEach((char) => {
                        const charSpan = document.createElement('span');
                        charSpan.textContent = char === ' ' ? '\u00A0' : char;
                        span.appendChild(charSpan);
                    });
                });

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

            if (descriptionRef.current) {
                tl.from(descriptionRef.current, {
                    opacity: 0,
                    y: 30,
                    duration: 0.8,
                }, 0.6);
            }

            if (eventCardRef.current) {
                tl.from(eventCardRef.current, {
                    opacity: 0,
                    y: 30,
                    duration: 0.8,
                }, 0.8);
            }

            if (buttonsRef.current) {
                const buttons = buttonsRef.current.querySelectorAll('a');
                tl.from(buttons, {
                    opacity: 0,
                    y: 20,
                    duration: 0.6,
                    stagger: 0.1,
                }, 1.0);
            }

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

    const defaultBanners = ["/logo_purple.svg"];

    const calculatedSlides = useMemo(() => {
        return heroBanners?.length > 0
            ? heroBanners.map(b => getImageUrl(b.image))
            : defaultBanners;
    }, [heroBanners]);

    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 639px)');
        const applyUpdate = (e?: MediaQueryListEvent) => setIsMobile(Boolean(e ? e.matches : mq.matches));
        applyUpdate();
        const onChange = (e: MediaQueryListEvent) => applyUpdate(e);
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
        return () => {
            try {
                if (mq.removeEventListener) mq.removeEventListener('change', onChange);
                else mq.removeListener(onChange as unknown as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
            } catch (e) { }
        };
    }, []);

    const mobileSrc = calculatedSlides[0] || defaultBanners[0];
    const showMembershipLink = !authLoading && !isAuthenticated;

    return (
        <section ref={heroRef} id="home" className="relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full min-h-[450px] md:min-h-[500px] py-4 sm:py-8 lg:py-12 transition-colors duration-300">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="relative w-full px-0">
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20 md:items-center">
                        <div className="space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                <h1 ref={titleRef} className="text-gradient-animated text-2xl font-black leading-tight sm:text-3xl md:text-5xl lg:text-6xl pb-1">
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
                                            <p className="mt-2 text-base sm:text-lg font-bold text-theme-purple dark:text-theme-white">
                                                Binnenkort meer activiteiten
                                            </p>
                                            <p className="mt-1 text-xs sm:text-sm text-theme-text-muted dark:text-theme-text-muted line-clamp-2">
                                                Check regelmatig onze agenda voor nieuwe evenementen en activiteiten.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 sm:gap-4 min-w-0">
                            <div ref={imageRef} className="relative w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/80 shadow-2xl backdrop-blur-xl overflow-hidden">
                                <div className="h-[240px] sm:h-[280px] md:h-[350px] lg:h-[480px] xl:h-[540px]">
                                    {isMobile ? (
                                        <div className="sm:hidden w-full h-full flex items-center justify-center relative">
                                            <Image
                                                src={mobileSrc}
                                                alt="Salve Mundi"
                                                fill
                                                priority
                                                unoptimized={true}
                                                fetchPriority="high"
                                                sizes="(max-width: 640px) 100vw, 0px"
                                                className="object-cover object-center"
                                            />
                                        </div>
                                    ) : (
                                        <Swiper
                                            modules={[Autoplay]}
                                            autoplay={{
                                                delay: 5000,
                                                disableOnInteraction: false,
                                            }}
                                            loop={calculatedSlides.length > 1}
                                            allowTouchMove={calculatedSlides.length > 1}
                                            className="hidden sm:block h-full w-full"
                                        >
                                            {calculatedSlides.map((src, index) => (
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
