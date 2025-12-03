'use client';

import { useEffect, useMemo } from 'react';
import { Users, Calendar, PartyPopper } from 'lucide-react';
import { useDirectusStore } from '@/lib/store/directusStore';
import { getImageUrl } from '@/lib/api/salvemundi';

const STATS = [
    {
        title: '500+',
        description: 'Actieve studenten',
        icon: Users,
    },
    {
        title: '50+',
        description: 'Evenementen per jaar',
        icon: Calendar,
    },
    {
        title: '15+',
        description: 'Actieve commissies',
        icon: PartyPopper,
    },
];

export default function Hero() {
    const events = useDirectusStore((state) => state.events);
    const eventsLoading = useDirectusStore((state) => state.eventsLoading);
    const loadEvents = useDirectusStore((state) => state.loadEvents);

    useEffect(() => {
        loadEvents?.();
    }, [loadEvents]);

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

    const heroImage = useMemo(() => {
        if (nextEvent?.image) {
            return getImageUrl(nextEvent.image);
        }
        return '/img/backgrounds/homepage-banner.jpg';
    }, [nextEvent]);

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

    return (
        <section id="home" className="relative bg-background dark:bg-background-darker justify-self-center overflow-hidden w-full h-screen max-w-app py-8 sm:py-12 md:py-16 lg:py-20 transition-colors duration-300">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full blur-3xl opacity-20 bg-oranje/30 dark:bg-oranje/10" />
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full blur-3xl opacity-20 bg-oranje/30 dark:bg-oranje/10" />

            <div className="relative w-full px-4 sm:px-6 ">
                <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 lg:items-center">
                    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-primary bg-clip-text text-transparent pb-1">
                                <span className="block">Welkom bij</span>
                                <span className="block">Salve Mundi</span>
                            </h1>
                            <p className="text-sm leading-relaxed text-secondary sm:text-base md:text-lg lg:max-w-xl">
                                Dé studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd met onze diverse activiteiten en gezellige commissies.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                            <a
                                href="/lidmaatschap"
                                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-primary px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-oranje/30"
                            >
                                Word lid
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold sm:h-6 sm:w-6">
                                    →
                                </span>
                            </a>
                            <a
                                href="/activiteiten"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-white dark:bg-surface-dark px-5 py-2.5 text-sm font-semibold text-oranje shadow-sm transition hover:bg-oranje/5 dark:hover:bg-white/5 sm:px-6 sm:py-3"
                            >
                                Bekijk activiteiten
                            </a>
                        </div>

                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            {STATS.map((stat) => (
                                <article
                                    key={stat.title}
                                    className="group relative overflow-hidden flex-1 min-w-full sm:min-w-[calc(50%-0.5rem)] lg:min-w-[280px] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-xl sm:hover:shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-primary opacity-90" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-background/20 to-transparent dark:bg-gradient-to-tr dark:from-ink-dark-black dark:via-ink-dark-primary/50 dark:to-transparent" />
                                    <span className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-oranje/70 dark:bg-ink-dark-primary transition duration-500 group-hover:scale-125 z-0" />
                                    <div className="relative flex items-start gap-2 sm:gap-3 z-10">
                                        <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 text-white">
                                            <stat.icon className=" h-4 w-4 sm:h-5 sm:w-5" />
                                        </span>
                                        <div className="space-y-1 sm:space-y-2">
                                            <h3 className="text-base sm:text-lg font-semibold text-white">{stat.title}</h3>
                                            <p className="text-xs sm:text-sm text-white">{stat.description}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex justify-center lg:justify-end">
                        <div className="absolute -left-10 top-6 h-24 w-24 rounded-full bg-gradient-to-br from-red-200 to-red-400 blur-2xl lg:block opacity-50" />
                        <div className="relative w-full max-w-md lg:max-w-none rounded-2xl sm:rounded-[3.5rem] bg-white/80 dark:bg-surface-dark/80 shadow-2xl backdrop-blur-xl overflow-hidden">
                            <img
                                src={heroImage}
                                alt="Salve Mundi evenement"
                                className="w-full h-[240px] sm:h-[300px] md:h-[380px] lg:h-[480px] xl:h-[540px] object-cover"
                            />
                            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-surface-dark/90 p-4 sm:p-6 shadow-lg backdrop-blur">
                                <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-oranje">
                                    Volgende evenement
                                </p>
                                {eventsLoading ? (
                                    <div className="mt-2 space-y-2">
                                        <div className="h-5 sm:h-6 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="h-3 sm:h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                                    </div>
                                ) : nextEvent ? (
                                    <>
                                        <p className="mt-2 text-base sm:text-lg font-bold text-p">
                                            {nextEvent.name} • {formatEventDate(nextEvent.event_date)}
                                        </p>
                                        <p className="mt-1 text-xs sm:text-sm text-secondary line-clamp-2">
                                            {nextEvent.description || "Kom gezellig langs bij ons volgende evenement!"}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="mt-2 text-base sm:text-lg font-bold text-p">
                                            Binnenkort meer activiteiten
                                        </p>
                                        <p className="mt-1 text-xs sm:text-sm text-secondary line-clamp-2">
                                            Check regelmatig onze agenda voor nieuwe evenementen en activiteiten.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
