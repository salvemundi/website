'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/widgets/page-header/ui/PageHeader";
import CalendarView from "@/entities/activity/ui/CalendarView";
import FeaturedEvent from "@/entities/activity/ui/FeaturedEvent";
import DayDetails from "@/entities/activity/ui/DayDetails";
import EventList from "@/entities/activity/ui/EventList";
import { useSalvemundiEvents } from "@/shared/lib/hooks/useSalvemundiApi";
import { addMonths, subMonths } from 'date-fns';
import FlipClock from "@/shared/ui/FlipClock";
import { ActivityCardSkeleton } from '@/shared/ui/skeletons';

import { Suspense } from 'react';

function ActivitiesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: events = [], isLoading, error } = useSalvemundiEvents();

    // State
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
    const [showPastActivities, setShowPastActivities] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Calendar Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter events
    const filteredEvents = useMemo(() => {
        let filtered = events;
        if (!showPastActivities) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            filtered = filtered.filter(event => new Date(event.event_date) >= now);
        }
        return filtered.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    }, [events, showPastActivities]);

    const upcomingEvent = useMemo(() => {
        const now = new Date();
        return events
            .filter(e => new Date(e.event_date) >= now)
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0];
    }, [events]);

    // Handlers
    const handleShowDetails = useCallback((activity: any) => {
        router.push(`/activiteiten/${activity.id}`);
    }, [router]);

    // Handle Payment Status from URL
    useEffect(() => {
        const status = searchParams.get('payment_status');
        const eventId = searchParams.get('event_id');

        if (status === 'success' && eventId) {
            // Redirect to the detail page for success message
            router.replace(`/activiteiten/${eventId}`);
        }
    }, [searchParams, router]);

    return (
        <div className="">
            <PageHeader
                title="ACTIVITEITEN"
                backgroundImage="/img/backgrounds/activity-banner.jpg"
                backgroundPosition="center 75%"
                /* apply a subtle blur to the banner image */
                imageFilter={`brightness(0.65)`}
                variant="centered"
                titleClassName="text-theme-purple dark:text-theme-white text-3xl sm:text-4xl md:text-6xl drop-shadow-sm"
                description={
                    <p className="mx-auto text-center text-lg sm:text-xl text-theme-purple dark:text-theme-white max-w-3xl mt-4 font-medium drop-shadow-sm">
                        Bekijk alle evenementen, trainingen en feesten van Salve Mundi.
                    </p>
                }
            >
                {upcomingEvent && viewMode !== 'grid' && (
                    <div className="rounded-3xl shadow-xl px-8 pb-4 bg-gradient-to-br 
                        from-theme-gradient-light-start 
                        via-theme-gradient-light-start 
                        to-theme-gradient-light-end 
                        dark:from-theme-gradient-dark-start 
                        dark:via-theme-gradient-dark-start 
                        dark:to-theme-gradient-dark-end">
                        <FlipClock targetDate={upcomingEvent.event_date} title={upcomingEvent.name} href={`/activiteiten/${upcomingEvent.id}`} />
                    </div>
                )}
            </PageHeader>

            <div className="w-full px-4 sm:px-8 mb-6 text-center">
                <p className="text-sm text-theme-purple dark:text-theme-white">
                    Lees de <a href="/reisvoorwaarden.pdf" target="_blank" rel="noopener noreferrer" className="underline font-semibold">reisvoorwaarden</a> voordat je boekt.
                </p>
            </div>

            <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                <div className="relative w-full flex flex-col">

                    {/* Controls & Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-theme-purple dark:text-theme-white">
                            {showPastActivities ? 'Alle Activiteiten' : 'Komende Activiteiten'}
                        </h2>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Calendar Sync Button */}
                            <button
                                onClick={async () => {
                                    const calendarUrl = 'https://api.salvemundi.nl/calendar';

                                    try {
                                        // Try to fetch the ICS content and trigger a download. This
                                        // works reliably from browsers and avoids relying on the
                                        // webcal: scheme which may not be supported in all clients.
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
                                        // If fetch fails (CORS, network, or webcal-only endpoint),
                                        // fall back to attempting to open the webcal: URL. Some
                                        // calendar apps expect webcal:// to subscribe directly.
                                        console.warn('Calendar sync failed, falling back to webcal/open:', err);
                                        // Attempt webcal scheme first
                                        try {
                                            const webcalUrl = calendarUrl.replace(/^https?:/, 'webcal:');
                                            window.location.href = webcalUrl;
                                        } catch (e) {
                                            // As a last resort open the HTTPS URL in a new tab
                                            window.open(calendarUrl, '_blank');
                                        }
                                    }
                                }}
                                className="px-4 py-2 text-sm font-semibold bg-white dark:bg-surface-dark text-samu dark:text-white rounded-lg hover:bg-oranje/5 dark:hover:bg-white/5 transition-colors  shadow-sm flex items-center gap-2"
                            >
                                📅 Sync Agenda
                            </button>

                            {/* Past Activities Toggle */}
                            <button
                                onClick={() => setShowPastActivities(!showPastActivities)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all  ${showPastActivities
                                    ? 'bg-gradient-primary text-white shadow-md'
                                    : 'bg-white dark:bg-surface-dark text-samu dark:text-white hover:bg-oranje/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                {showPastActivities ? 'Verberg Afgelopen' : 'Toon Afgelopen'}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

                        {/* Sidebar (Visible on Desktop) */}
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

                        {/* Main View Area */}
                        <div className="flex-1 space-y-6">
                            {/* View Mode Toggles - Hidden on mobile */}
                            <div className="hidden md:flex rounded-lg  bg-white dark:bg-surface-dark overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list'
                                        ? 'bg-gradient-primary text-white shadow-md'
                                        : 'text-samu dark:text-white hover:bg-oranje/5 dark:hover:bg-white/5'
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
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'grid'
                                        ? 'bg-gradient-primary text-white shadow-md'
                                        : 'text-samu dark:text-white hover:bg-oranje/5 dark:hover:bg-white/5'
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
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'calendar'
                                        ? 'bg-gradient-primary text-white shadow-md'
                                        : 'text-samu dark:text-white hover:bg-oranje/5 dark:hover:bg-white/5'
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

                            {error && (
                                <div className="rounded-3xl  bg-red-50 dark:bg-red-900/20 px-5 py-4 text-sm text-red-600 dark:text-red-400 shadow-sm">
                                    Er is een fout opgetreden bij het laden van de activiteiten.
                                </div>
                            )}

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <ActivityCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Calendar View */}
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
                                            {/* Mobile Fallback for Calendar is List */}
                                            <div className="lg:hidden">
                                                <EventList
                                                    events={filteredEvents}
                                                    onEventClick={handleShowDetails}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* List View */}
                                    {viewMode === 'list' && (
                                        <EventList
                                            events={filteredEvents}
                                            onEventClick={handleShowDetails}
                                        />
                                    )}

                                    {/* Grid / Card View */}
                                    {viewMode === 'grid' && (
                                        <EventList
                                            events={filteredEvents}
                                            onEventClick={handleShowDetails}
                                            variant="grid"
                                        />
                                    )}


                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ActivitiesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-paars text-xl font-semibold">Laden...</div>
            </div>
        }>
            <ActivitiesContent />
        </Suspense>
    );
}
