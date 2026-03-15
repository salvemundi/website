'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, subMonths } from 'date-fns';

import CalendarView from "./CalendarView";
import FeaturedEvent from "./FeaturedEvent";
import DayDetails from "./DayDetails";
import EventList from "./EventList";
import type { Activiteit } from '@salvemundi/validations';

interface ActivitiesProviderIslandProps {
    events: Activiteit[];
}

export default function ActivitiesProviderIsland({ events }: ActivitiesProviderIslandProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('grid');
    const [showPastActivities, setShowPastActivities] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const filteredEvents = useMemo(() => {
        let filtered = events;
        if (!showPastActivities) {
            const now = new Date();
            filtered = filtered.filter(event => {
                const eventDate = event.datum_start;
                // De server actions sturen nu ISO strings (datum_start) of YYYY-MM-DD (event_date)
                // Als we een ISO string hebben, gebruiken we die direct.
                // Als we een event_time hebben, combineren we die alleen met de YYYY-MM-DD variant.
                let eventDateTime;
                if (event.event_time && eventDate.length <= 10) {
                    eventDateTime = new Date(`${eventDate}T${event.event_time}`);
                } else {
                    eventDateTime = new Date(eventDate);
                }
                return eventDateTime >= now;
            });
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
            return aDateTime - bDateTime;
        });
    }, [events, showPastActivities]);

    const upcomingEvent = useMemo(() => {
        const now = new Date();
        return events
            .filter(e => {
                const eventDateTime = e.event_time
                    ? new Date(`${e.datum_start}T${e.event_time}`)
                    : new Date(e.datum_start);
                return eventDateTime >= now;
            })
            .sort((a, b) => {
                const aDateTime = a.event_time
                    ? new Date(`${a.datum_start}T${a.event_time}`).getTime()
                    : new Date(a.datum_start).getTime();
                const bDateTime = b.event_time
                    ? new Date(`${b.datum_start}T${b.event_time}`).getTime()
                    : new Date(b.datum_start).getTime();
                return aDateTime - bDateTime;
            })[0];
    }, [events]);

    const handleShowDetails = useCallback((activity: Activiteit) => {
        router.push(`/activiteiten/${activity.id}`);
    }, [router]);

    useEffect(() => {
        const status = searchParams.get('payment_status');
        const eventId = searchParams.get('event_id');

        if (status === 'success' && eventId) {
            router.replace(`/activiteiten/${eventId}`);
        }
    }, [searchParams, router]);

    return (
        <div className="relative w-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h2 className="text-3xl font-bold text-[var(--theme-purple)] dark:text-[var(--text-main)]">
                    {showPastActivities ? 'Alle Activiteiten' : 'Komende Activiteiten'}
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={async () => {
                            const calendarUrl = 'https://api.salvemundi.nl/calendar';
                            try {
                                const resp = await fetch(calendarUrl, { cache: 'no-store' });
                                if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
                                const blob = await resp.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'salve-mundi.ics';
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                            } catch (err) {
                                console.warn('Calendar sync failed, falling back to webcal/open:', err);
                                try {
                                    const webcalUrl = calendarUrl.replace(/^https?:/, 'webcal:');
                                    window.location.href = webcalUrl;
                                } catch {
                                    window.open(calendarUrl, '_blank');
                                }
                            }
                        }}
                        className="px-4 py-2 text-sm font-semibold bg-[var(--bg-card)] text-[var(--theme-purple)] dark:text-[var(--text-main)] rounded-lg hover:bg-[var(--theme-purple)]/5 transition-colors shadow-sm flex items-center gap-2 border border-[var(--border-color)]"
                    >
                        📅 Sync Agenda
                    </button>

                    <button
                        onClick={() => setShowPastActivities(!showPastActivities)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all border ${showPastActivities
                            ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] border-[var(--theme-purple)]/20 shadow-sm'
                            : 'bg-[var(--bg-card)] text-[var(--theme-purple)] border-[var(--border-color)] hover:bg-[var(--theme-purple)]/5'
                            }`}
                    >
                        {showPastActivities ? 'Verberg Afgelopen' : 'Toon Afgelopen'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                {(selectedDay || upcomingEvent) && (
                    <aside className="lg:w-96 xl:w-[28rem] space-y-6">
                        {upcomingEvent && (
                            <FeaturedEvent
                                event={upcomingEvent}
                                onEventClick={handleShowDetails}
                            />
                        )}

                        {selectedDay && (
                            <DayDetails
                                selectedDay={selectedDay}
                                events={events}
                                onClose={() => setSelectedDay(null)}
                                onEventClick={handleShowDetails}
                            />
                        )}
                    </aside>
                )}

                <div className="flex-1 space-y-6">
                    <div className="hidden md:flex rounded-lg bg-[var(--bg-card)] overflow-hidden shadow-sm border border-[var(--border-color)]">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'list'
                                ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] shadow-sm'
                                : 'text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/5'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                                Lijst
                            </span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'grid'
                                ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] shadow-sm'
                                : 'text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/5'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="8" height="8" rx="1" ry="1" />
                                    <rect x="13" y="3" width="8" height="8" rx="1" ry="1" />
                                    <rect x="3" y="13" width="8" height="8" rx="1" ry="1" />
                                    <rect x="13" y="13" width="8" height="8" rx="1" ry="1" />
                                </svg>
                                Kaarten
                            </span>
                        </button>

                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'calendar'
                                ? 'bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] shadow-sm'
                                : 'text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/5'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Kalender
                            </span>
                        </button>
                    </div>

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
