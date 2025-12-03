'use client';

import { useEffect, useMemo } from 'react';
import { CalendarClock, CalendarDays } from 'lucide-react';
import { useDirectusStore } from '@/lib/store/directusStore';
import EventCard from '../ui/EventCard';

export default function EventsSection() {
    const events = useDirectusStore((state) => state.events);
    const eventsLoading = useDirectusStore((state) => state.eventsLoading);
    const eventsError = useDirectusStore((state) => state.eventsError);
    const loadEvents = useDirectusStore((state) => state.loadEvents);

    useEffect(() => {
        loadEvents?.();
    }, [loadEvents]);

    const displayEvents = useMemo(() => {
        const today = new Date();
        return (events ?? [])
            .filter((event) => {
                const eventDate = new Date(event.event_date);
                return eventDate >= today;
            })
            .sort((a, b) => {
                const aDate = new Date(a.event_date).valueOf();
                const bDate = new Date(b.event_date).valueOf();
                return aDate - bDate;
            })
            .slice(0, 4);
    }, [events]);

    const renderDate = (date: string) => {
        try {
            const parsedDate = new Date(date);
            if (Number.isNaN(parsedDate.valueOf())) {
                return date;
            }
            return parsedDate.toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return 'Datum volgt';
        }
    };

    const skeletonItems = Array.from({ length: 4 });

    return (
        <section id="kalender" className="px-6 pb-24">
            <div className="mx-auto max-w-app">
                <div className="flex flex-col gap-6 rounded-xl bg-gradient-primary px-10 py-12 shadow-xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                                <CalendarClock className="h-3 w-3" /> Agenda
                            </p>
                            <h2 className="text-3xl font-black text-white sm:text-4xl">
                                Aankomende evenementen
                            </h2>
                            <p className="max-w-xl text-sm text-white/90">
                                Van feesten tot studiesessies, van sportactiviteiten tot commissie-evenementen. Kies jouw moment om mee te doen!
                            </p>
                        </div>
                        <a
                            href="/activiteiten"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white dark:bg-surface-dark px-5 py-2 text-sm font-semibold text-oranje shadow-sm transition hover:bg-oranje/5 dark:hover:bg-white/5"
                        >
                            <CalendarDays className="h-4 w-4" /> Alle activiteiten
                        </a>
                    </div>

                    {eventsError && (
                        <p className="rounded-2xl bg-oranje/5 px-4 py-3 text-sm text-oranje">
                            {eventsError}
                        </p>
                    )}

                    {eventsLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {skeletonItems.map((_, index) => (
                                <div
                                    key={`event-skeleton-${index}`}
                                    className="h-40 rounded-[1.75rem] bg-oranje/5/50 shadow-inner"
                                >
                                    <div className="h-full animate-pulse rounded-[1.75rem] bg-oranje/10/40" />
                                </div>
                            ))}
                        </div>
                    ) : displayEvents.length === 0 && !eventsError ? (
                        <div className="rounded-3xl bg-white/70 dark:bg-surface-dark/70 p-10 text-center text-sm text-secondary">
                            Nog geen aankomende evenementen. Check later opnieuw!
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {displayEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    title={event.name}
                                    category={event.committee_name || 'Salve Mundi'}
                                    date={renderDate(event.event_date)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
