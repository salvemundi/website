'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, subMonths } from 'date-fns';

import CalendarView from "./CalendarView";
import DayDetails from "./DayDetails";
import EventList from "./EventList";
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { slugify } from "@/shared/lib/utils/slug";

interface ActivitiesProviderIslandProps {
    events?: (Activiteit & { is_signed_up?: boolean })[];
    serverTime?: string;
}

export default function ActivitiesProviderIsland({
    events: initialEvents = [],
    serverTime
}: ActivitiesProviderIslandProps) {
    const router = useRouter();
    const [events] = useState<(Activiteit & { is_signed_up?: boolean })[]>(initialEvents);
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
    const [showPastActivities, setShowPastActivities] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(serverTime ? new Date(serverTime) : new Date());

    const upcomingEvent = useMemo(() => {
        const now = serverTime ? new Date(serverTime) : new Date();
        return events
            .filter(e => {
                const eventDate = e.datum_start;
                const eventDateTime = (e.event_time && eventDate.length <= 10)
                    ? new Date(`${eventDate}T${e.event_time}`)
                    : new Date(eventDate);
                return eventDateTime >= now;
            })
            .sort((a, b) => {
                const aDate = a.datum_start;
                const bDate = b.datum_start;
                const aDateTime = (a.event_time && aDate.length <= 10)
                    ? new Date(`${aDate}T${a.event_time}`).getTime()
                    : new Date(aDate).getTime();
                const bDateTime = (b.event_time && bDate.length <= 10)
                    ? new Date(`${bDate}T${b.event_time}`).getTime()
                    : new Date(bDate).getTime();
                return aDateTime - bDateTime;
            })[0];
    }, [events, serverTime]);

    const filteredEvents = useMemo(() => {
        let filtered = events;
        if (!showPastActivities) {
            const now = serverTime ? new Date(serverTime) : new Date();
            filtered = filtered.filter(event => {
                const eventDate = event.datum_start;
                let eventDateTime;
                if (event.event_time && eventDate.length <= 10) {
                    eventDateTime = new Date(`${eventDate}T${event.event_time}`);
                } else {
                    eventDateTime = new Date(eventDate);
                }
                return eventDateTime >= now;
            });
        }

        // Deduplicate: remove the featured upcoming event from the list (Legacy logic)
        // We disable this if it's the only event to avoid the "Geen activiteiten gevonden" confusion.
        if (upcomingEvent && !showPastActivities && filtered.length > 1) {
            filtered = filtered.filter(e => e.id !== upcomingEvent.id);
        }

        return filtered.sort((a, b) => {
            const aDate = a.datum_start;
            const bDate = b.datum_start;
            
            const aDateTime = (a.event_time && aDate.length <= 10)
                ? new Date(`${aDate}T${a.event_time}`).getTime()
                : new Date(aDate).getTime();
            const bDateTime = (b.event_time && bDate.length <= 10)
                ? new Date(`${bDate}T${b.event_time}`).getTime()
                : new Date(bDate).getTime();
            return showPastActivities ? bDateTime - aDateTime : aDateTime - bDateTime;
        });
    }, [events, showPastActivities, serverTime, upcomingEvent]);

    const handleShowDetails = useCallback((activity: Activiteit) => {
        router.push(`/activiteiten/${activity.id}-${slugify(activity.titel || '')}`);
    }, [router]);

    useEffect(() => {
        const status = searchParams.get('payment_status');
        const eventId = searchParams.get('event_id');

        if (status === 'success' && eventId) {
            const event = events.find(e => e.id.toString() === eventId.toString());
            const slugPart = event ? `-${slugify(event.titel || '')}` : '';
            router.replace(`/activiteiten/${eventId}${slugPart}`);
        }
    }, [searchParams, router, events]);

    return (
        <div className="relative w-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-[var(--theme-purple)] dark:text-[var(--text-main)]">
                            {showPastActivities ? 'Alle Activiteiten' : 'Komende Activiteiten'}
                        </h2>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex rounded-lg bg-[var(--bg-card)] overflow-hidden shadow-sm border border-[var(--border-color)]">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'list'
                                        ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] shadow-sm'
                                        : 'text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/5'
                                        }`}
                                >
                                    Lijst
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'grid'
                                        ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] shadow-sm'
                                        : 'text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/5'
                                        }`}
                                >
                                    Kaarten
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'calendar'
                                        ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] shadow-sm'
                                        : 'text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/5'
                                        }`}
                                >
                                    Kalender
                                </button>
                            </div>

                            <button
                                onClick={() => setShowPastActivities(!showPastActivities)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all border w-[160px] text-center ${showPastActivities
                                    ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] border-[var(--theme-purple)]/20 shadow-sm'
                                    : 'bg-[var(--bg-card)] text-[var(--theme-purple)] border-[var(--border-color)] hover:bg-[var(--theme-purple)]/5'
                                    }`}
                            >
                                {showPastActivities ? 'Verberg Afgelopen' : 'Toon Afgelopen'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                        {selectedDay && (
                            <aside className="lg:w-96 xl:w-[28rem] space-y-6">
                                <DayDetails
                                    selectedDay={selectedDay}
                                    activities={events}
                                    onClose={() => setSelectedDay(null)}
                                    onEventClick={handleShowDetails}
                                />
                            </aside>
                        )}

                        <div className="flex-1 space-y-6">
                            {viewMode === 'calendar' && (
                                <>
                                    <div className="hidden lg:block">
                                        <CalendarView
                                            currentDate={currentDate}
                                            events={filteredEvents}
                                            selectedDay={selectedDay}
                                            onSelectDay={setSelectedDay}
                                            onEventClick={handleShowDetails}
                                            onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
                                            onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
                                            onGoToDate={(d: Date) => setCurrentDate(d)}
                                        />
                                    </div>
                                    <div className="lg:hidden">
                                        <EventList
                                            events={filteredEvents}
                                            onEventClick={handleShowDetails}
                                        />
                                    </div>
                                </>
                            )}

                            {viewMode === 'list' && (
                                <EventList
                                    events={filteredEvents}
                                    onEventClick={handleShowDetails}
                                />
                            )}

                            {viewMode === 'grid' && (
                                <EventList
                                    events={filteredEvents}
                                    onEventClick={handleShowDetails}
                                    variant="grid"
                                />
                            )}
                        </div>
                    </div>
        </div>
    );
}
