'use client';

import React, { useEffect, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { useDirectusStore } from '@/shared/lib/store/directusStore';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
        getImageUrl('banner_1.jpg'),
        getImageUrl('banner_2.jpg'),
        getImageUrl('banner_3.jpg'),
    ];

    const slides = heroBanners?.length > 0
        ? heroBanners.map(b => getImageUrl(b.image))
        : defaultBanners;

    return (
        <section id="home" className="relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full h-screen max-w-app py-8 sm:py-12 md:py-16 lg:py-20 transition-colors duration-300">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full blur-3xl opacity-20 bg-theme-purple/30" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full blur-3xl opacity-20 bg-theme-purple/30" />

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
                                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white text-theme-purple flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                                            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
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
                            >
                                Word lid
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold sm:h-6 sm:w-6">
                                    →
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
                                <Swiper
                                    modules={[Autoplay]}
                                    autoplay={{
                                        delay: 5000,
                                        disableOnInteraction: false,
                                    }}
                                    loop={true}
                                    allowTouchMove={false}
                                    className="h-full w-full"
                                >
                                    {slides.map((src, index) => (
                                        <SwiperSlide key={index}>
                                            <img
                                                src={src}
                                                alt="Salve Mundi sfeerimpressie"
                                                className="w-full h-full object-cover"
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

