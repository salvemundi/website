'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import type { HeroBanner, Activiteit } from '@salvemundi/validations';
import { getImageUrl } from '@/lib/image-utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/shared/lib/utils/date';


interface HeroIslandProps {
    isLoading?: boolean;
    // Gevalideerde data vanuit de server (getHeroBanners / getUpcomingActiviteiten)
    banners?: HeroBanner[];
    activiteiten?: Activiteit[];
}


/**
 * Client Island — Belangrijkste visuele sectie van de homepage.
 * Maakt gebruik van native CSS animaties voor optimale prestaties.
 * Swiper verzorgt de slideshow-functionaliteit voor hero banners.
 */
// Auth-state via authClient.useSession() conform het NavigationHeader patroon.
export function HeroIsland({ isLoading = false, banners = [], activiteiten = [] }: HeroIslandProps) {
    const { data: session, isPending: authLoading } = authClient.useSession();
    const isAuthenticated = !!session?.user;

    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const slideUrls = useMemo(() => {
        if (!banners.length) return ['/images/placeholder-hero.jpg'];
        return banners
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((b) => getImageUrl(b.afbeelding_id, { width: 1200, height: 800, fit: 'cover' }) || '/images/placeholder-hero.jpg');
    }, [banners]);

    const nextEvent = useMemo(() => {
        if (!activiteiten.length) return null;
        const now = new Date();
        const upcoming = activiteiten
            .filter((a) => {
                const date = new Date(a.datum_start);
                if (Number.isNaN(date.valueOf())) return false;
                const hasTime = /T|\d:\d{2}/.test(a.datum_start);
                if (hasTime) return date >= now;
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                return endOfDay >= now;
            })
            .sort((a, b) => new Date(a.datum_start).valueOf() - new Date(b.datum_start).valueOf());
        return upcoming[0] ?? null;
    }, [activiteiten]);

    const showMembershipLink = !authLoading && !isAuthenticated && !isLoading;
    const isReallyLoading = isLoading || authLoading || !mounted;

    return (
        <section
            id="home"
            className={`relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full min-h-[450px] md:min-h-[500px] py-4 sm:py-8 lg:py-12 transition-colors duration-300`}
            aria-busy={isLoading}
        >
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="relative w-full px-0">
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20 md:items-center">

                        {/* ── Links: tekst + dynamische kaart ─────────────────────── */}
                        <div className="space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                {/* Titel */}
                                <h1
                                    className="text-gradient-animated text-2xl font-black leading-tight sm:text-3xl md:text-5xl lg:text-6xl pb-1 font-[950] [WebkitTextStroke:0.5px_currentColor]"
                                >
                                    <span>Studievereniging</span>
                                    <br />
                                    <span className="inline-block w-full">Salve Mundi</span>
                                </h1>

                                {/* Beschrijving */}
                                <p className="text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm md:text-lg lg:max-w-xl">
                                    Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd met onze diverse activiteiten en gezellige commissies.
                                </p>
                            </div>

                            {/* Dynamische kaart sectie */}
                            <div className="w-full max-w-full">
                                <div className="flex flex-wrap gap-3 sm:gap-4 min-h-[100px]">
                                    {/* Laden: skeleton */}
                                    {isReallyLoading && (
                                        <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/10 p-4 sm:p-6 shadow-lg backdrop-blur min-h-[90px] sm:min-h-[100px] border border-[var(--color-purple-300)]/10 space-y-3">
                                            <Skeleton className="h-3 w-24 bg-[var(--color-purple-300)]/20" />
                                            <Skeleton className="h-6 w-3/4 bg-[var(--color-purple-300)]/20" />
                                            <Skeleton className="h-4 w-1/2 bg-[var(--color-purple-300)]/20" />
                                        </div>
                                    )}

                                    {/* Niet ingelogd: Word Lid kaart */}
                                    {(!isReallyLoading && showMembershipLink) && (
                                        <Link
                                            href="/lidmaatschap"
                                            className="block w-full transition-transform hover:scale-[1.02] group/lid"
                                        >
                                            <div className="w-full max-w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur cursor-pointer flex items-center justify-between gap-3 sm:gap-4 min-h-[90px] sm:min-h-[100px] overflow-hidden">
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <p className="text-[0.6rem] sm:text-xs font-semibold uppercase tracking-wide text-[var(--color-purple-300)]/60 dark:text-white/60">
                                                        Word lid
                                                    </p>
                                                    <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg font-bold text-[var(--color-purple-300)] dark:text-white truncate">
                                                        Sluit je aan bij Salve Mundi
                                                    </p>
                                                    <p className="mt-0.5 sm:mt-1 text-[0.7rem] sm:text-xs md:text-sm text-[var(--text-muted)] line-clamp-2">
                                                        Ontdek alle voordelen van een lidmaatschap!
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[var(--color-purple-300)]/10 dark:bg-white/10 text-[var(--color-purple-300)] dark:text-white flex items-center justify-center shadow-md transition-all group-hover/lid:bg-gradient-theme group-hover/lid:text-[var(--text-main)]">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </Link>
                                    )}

                                    {/* Ingelogd + volgend evenement beschikbaar */}
                                    {(!isReallyLoading && !showMembershipLink && nextEvent) && (
                                        <Link
                                            href={(nextEvent as any).custom_url || `/activiteiten/${nextEvent.id}`}
                                            className="block w-full transition-transform hover:scale-[1.02] group/event"
                                        >
                                            <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 sm:p-6 shadow-lg backdrop-blur cursor-pointer flex items-center justify-between gap-4 min-h-[90px] sm:min-h-[100px]">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[var(--color-purple-300)]/60 dark:text-white/60">
                                                        Volgende evenement
                                                    </p>
                                                    <p className="mt-2 text-base sm:text-lg font-bold text-[var(--color-purple-300)] dark:text-white truncate">
                                                        {nextEvent.titel} • {formatDate(nextEvent.datum_start)}
                                                    </p>
                                                    <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2">
                                                        {nextEvent.beschrijving ?? 'Kom gezellig langs bij ons volgende evenement!'}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[var(--color-purple-300)]/10 dark:bg-white/10 text-[var(--color-purple-300)] dark:text-white flex items-center justify-center shadow-md transition-all group-hover/event:bg-gradient-theme group-hover/event:text-[var(--text-main)]">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </Link>
                                    )}

                                    {/* Ingelogd maar geen evenement */}
                                    {(!isReallyLoading && !showMembershipLink && !nextEvent) && (
                                        <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 sm:p-6 shadow-lg backdrop-blur min-h-[90px] sm:min-h-[100px]">
                                            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[var(--color-purple-300)]/60 dark:text-white/60">
                                                Volgende evenement
                                            </p>
                                            <p className="mt-2 text-base sm:text-lg font-bold text-[var(--color-purple-300)] dark:text-white">
                                                Binnenkort meer activiteiten
                                            </p>
                                            <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2">
                                                Check regelmatig onze agenda voor nieuwe evenementen en activiteiten.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Rechts: Swiper afbeeldingsgalerij ───────────────────── */}
                        <div className="flex flex-wrap gap-3 sm:gap-4 min-w-0">
                            <div
                                ref={imageRef}
                                className="relative w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/80 shadow-2xl backdrop-blur-xl overflow-hidden"
                            >
                                <div className="h-[240px] sm:h-[280px] md:h-[350px] lg:h-[480px] xl:h-[540px]">
                                    {/* Laden placeholder */}
                                    {isReallyLoading && (
                                        <Skeleton className="w-full h-full bg-[var(--color-purple-100)]/10" rounded="none" />
                                    )}

                                    {/* Mobiel: enkel statisch plaatje */}
                                    {!isLoading && mounted && isMobile && (
                                        <div className="sm:hidden w-full h-full relative">
                                            <Image
                                                src={slideUrls[0]}
                                                alt="Salve Mundi"
                                                fill
                                                priority
                                                unoptimized
                                                sizes="(max-width: 640px) 100vw, 0px"
                                                className="object-cover object-center"
                                            />
                                        </div>
                                    )}

                                    {/* Desktop: Swiper slideshow */}
                                    {!isLoading && mounted && !isMobile && (
                                        <Swiper
                                            modules={[Autoplay]}
                                            autoplay={{ delay: 5000, disableOnInteraction: false }}
                                            loop={slideUrls.length > 1}
                                            allowTouchMove={slideUrls.length > 1}
                                            className="hidden sm:block h-full w-full"
                                        >
                                            {slideUrls.map((src, index) => (
                                                <SwiperSlide key={index}>
                                                    <div className="w-full h-full relative">
                                                        <Image
                                                            src={src}
                                                            alt="Salve Mundi sfeerimpressie"
                                                            fill
                                                            priority={index === 0}
                                                            unoptimized
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

