'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/widgets/page-header/ui/PageHeader";
import CalendarView from "@/entities/activity/ui/CalendarView";
import FeaturedEvent from "@/entities/activity/ui/FeaturedEvent";
import DayDetails from "@/entities/activity/ui/DayDetails";
import EventList from "@/entities/activity/ui/EventList";
import { useSalvemundiEvents } from "@/shared/lib/hooks/useSalvemundiApi";
import { getImageUrl } from "@/shared/lib/api/salvemundi";
import { addMonths, subMonths } from 'date-fns';
import { isEventPast } from '@/shared/lib/utils/date';
import ActiviteitCard from "@/entities/activity/ui/ActiviteitCard";
import FlipClock from "@/shared/ui/FlipClock";
import { ActivityCardSkeleton } from '@/shared/ui/skeletons';

import { Suspense } from 'react';

function ActivitiesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: events = [], isLoading, error } = useSalvemundiEvents();

    // State
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('calendar');
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
                variant="split"
                description={
                    <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mt-4">
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


            <main className="relative flex flex-col items-center overflow-hidden pb-24">
                <div className="relative flex w-full max-w-app flex-col px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">

                    {/* Controls & Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-samu dark:text-white">
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

                            {/* View Mode Toggles */}
                            <div className="flex rounded-lg  bg-white dark:bg-surface-dark overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'grid'
                                        ? 'bg-gradient-primary text-white shadow-md'
                                        : 'bg-white dark:bg-surface-dark text-samu dark:text-white hover:bg-oranje/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    Raster
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all  ${viewMode === 'list'
                                        ? 'bg-gradient-primary text-white shadow-md'
                                        : 'bg-white dark:bg-surface-dark text-samu dark:text-white hover:bg-oranje/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    Lijst
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${viewMode === 'calendar'
                                        ? 'bg-gradient-primary text-white shadow-md'
                                        : 'bg-white dark:bg-surface-dark text-samu dark:text-white hover:bg-oranje/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    Kalender
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

                        {/* Sidebar (Visible on Desktop) */}
                        {(viewMode !== 'grid' || selectedDay) && (
                            <aside className="lg:w-96 xl:w-[28rem] space-y-6">
                                {viewMode !== 'grid' && (
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

                                    {/* Grid View */}
                                    {viewMode === 'grid' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-loaded">
                                            {filteredEvents.map((event, index) => (
                                                <div key={event.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                                                <ActiviteitCard
                                                    title={event.name}
                                                    description={event.description}
                                                    date={event.event_date}
                                                    price={event.price}
                                                    image={getImageUrl(event.image)}
                                                    isPast={isEventPast(event.event_date)}
                                                    variant="grid"
                                                    committeeName={event.committee_name}
                                                    onShowDetails={() => handleShowDetails(event)}
                                                    onSignup={() => handleShowDetails(event)}
                                                />
                                                </div>
                                            ))}
                                        </div>
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
