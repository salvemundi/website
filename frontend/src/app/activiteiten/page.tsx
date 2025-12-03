'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/providers/auth-provider";
import PageHeader from "@/shared/components/ui/PageHeader";
import ActiviteitDetailModal from "@/shared/components/activities/ActiviteitDetailModal";
import CalendarView from "@/shared/components/activities/CalendarView";
import FeaturedEvent from "@/shared/components/activities/FeaturedEvent";
import DayDetails from "@/shared/components/activities/DayDetails";
import EventList from "@/shared/components/activities/EventList";
import { useSalvemundiEvents } from "@/hooks/useSalvemundiApi";
import { eventsApi, getImageUrl } from "@/lib/api/salvemundi";
import { sendEventSignupEmail } from "@/lib/services/email-service";
import { addMonths, subMonths } from 'date-fns';
import ActiviteitCard from "@/shared/components/activities/ActiviteitCard";

const buildCommitteeEmail = (name?: string | null) => {
    if (!name) return undefined;
    const normalized = name.toLowerCase();
    if (normalized.includes('feest')) return 'feest@salvemundi.nl';
    if (normalized.includes('activiteit')) return 'activiteiten@salvemundi.nl';
    if (normalized.includes('studie')) return 'studie@salvemundi.nl';

    const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/commissie|committee/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    if (!slug) return undefined;
    return `${slug}@salvemundi.nl`;
};

import { Suspense } from 'react';

function ActivitiesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { data: events = [], isLoading, error, refetch } = useSalvemundiEvents();

    // State
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('calendar');
    const [showPastActivities, setShowPastActivities] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Calendar Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Filter events
    const filteredEvents = useMemo(() => {
        let filtered = events;
        if (!showPastActivities) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            filtered = filtered.filter(event => new Date(event.event_date) >= now);
        }
        return filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    }, [events, showPastActivities]);

    const upcomingEvent = useMemo(() => {
        const now = new Date();
        return events
            .filter(e => new Date(e.event_date) >= now)
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0];
    }, [events]);

    // Handlers
    const handleShowDetails = useCallback((activity: any) => {
        setSelectedActivity(activity);
        setIsDetailModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsDetailModalOpen(false);
        setSelectedActivity(null);
    }, []);

    const handleSignup = async (data: { activity: any; email: string; name: string; phoneNumber: string }) => {
        // ... (Existing signup logic preserved)
        const { activity, email, name, phoneNumber } = data;
        const price = Number(activity.price) || 0;

        try {
            if (price > 0) {
                // Paid event flow
                const payload = {
                    amount: price,
                    description: `Ticket: ${activity.title}`,
                    redirectUrl: `${window.location.origin}/activiteiten?payment_status=success&event_id=${activity.id}`,
                    metadata: {
                        eventId: activity.id,
                        userId: user?.id,
                        email,
                        name,
                        phoneNumber,
                        type: 'event_signup'
                    }
                };

                const response = await fetch('/api/payments/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();
                if (response.ok && result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else {
                    throw new Error(result.error || 'Betaling starten mislukt');
                }
            } else {
                // Free event flow
                await eventsApi.createSignup({
                    event_id: activity.id,
                    email,
                    name,
                    phone_number: phoneNumber,
                });

                // Send confirmation email
                try {
                    await sendEventSignupEmail({
                        recipientEmail: email,
                        recipientName: name,
                        eventName: activity.title,
                        eventDate: activity.date || activity.event_date,
                        eventPrice: 0,
                        phoneNumber: phoneNumber,
                        userName: name,
                        committeeName: activity.committee_name || 'Salve Mundi',
                        committeeEmail: activity.committee_email || buildCommitteeEmail(activity.committee_name),
                        contactName: activity.contact_name,
                        contactPhone: activity.contact_phone,
                    });
                } catch (emailErr) {
                    console.error('Failed to send confirmation email:', emailErr);
                }

                alert('Je bent succesvol ingeschreven! Controleer je e-mail voor de bevestiging.');
                handleCloseModal();
                refetch();
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            throw new Error(err.message || 'Er is een fout opgetreden bij het inschrijven.');
        }
    };

    // Handle Payment Status from URL
    useEffect(() => {
        const status = searchParams.get('payment_status');
        const eventId = searchParams.get('event_id');

        if (status === 'success' && eventId) {
            const event = events.find(e => e.id === Number(eventId));
            if (event) {
                setSelectedActivity(event);
                setIsDetailModalOpen(true);
                // Ideally we would show a success message here or pass a prop to the modal
                // For now, the modal will show "Je bent ingeschreven" if the backend updated correctly
                // or we can rely on the user seeing the modal open.
                // To be more robust, we could pass a "justSignedUp" flag.
            }
            // Clean URL
            router.replace('/activiteiten');
        }
    }, [searchParams, events, router]);

    return (
        <div className="">
            <PageHeader
                title="ACTIVITEITEN"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
            >
                <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                    Bekijk alle evenementen, trainingen en feesten van Salve Mundi.
                </p>
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
                                onClick={() => {
                                    const calendarUrl = 'https://api.salvemundi.nl/calendar';
                                    const webcalUrl = calendarUrl.replace(/^https?:/, 'webcal:');
                                    window.location.href = webcalUrl;
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
                        <aside className="lg:w-96 xl:w-[28rem] space-y-6">
                            <FeaturedEvent
                                event={upcomingEvent}
                                onEventClick={handleShowDetails}
                            />

                            {selectedDay && (
                                <DayDetails
                                    selectedDay={selectedDay}
                                    events={events}
                                    onClose={() => setSelectedDay(null)}
                                    onEventClick={handleShowDetails}
                                />
                            )}
                        </aside>

                        {/* Main View Area */}
                        <div className="flex-1 space-y-6">
                            {error && (
                                <div className="rounded-3xl  bg-red-50 dark:bg-red-900/20 px-5 py-4 text-sm text-red-600 dark:text-red-400 shadow-sm">
                                    Er is een fout opgetreden bij het laden van de activiteiten.
                                </div>
                            )}

                            {isLoading ? (
                                <div className="flex items-center justify-center rounded-3xl  bg-white/70 dark:bg-surface-dark/70 p-16 shadow-sm">
                                    <div className="text-center">
                                        <div className="h-12 w-12 animate-spin rounded-full  mx-auto"></div>
                                        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-ink-muted">
                                            Activiteiten worden geladen...
                                        </p>
                                    </div>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {filteredEvents.map(event => (
                                                <ActiviteitCard
                                                    key={event.id}
                                                    title={event.name}
                                                    description={event.description}
                                                    date={event.event_date}
                                                    price={event.price}
                                                    image={getImageUrl(event.image)}
                                                    isPast={new Date(event.event_date) < new Date()}
                                                    variant="grid"
                                                    committeeName={event.committee_name}
                                                    onShowDetails={() => handleShowDetails(event)}
                                                    onSignup={() => handleShowDetails(event)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Detail Modal */}
            {selectedActivity && (
                <ActiviteitDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseModal}
                    activity={{
                        ...selectedActivity,
                        title: selectedActivity.name,
                        date: selectedActivity.event_date,
                    }}
                    isPast={new Date(selectedActivity.event_date) < new Date()}
                    onSignup={handleSignup}
                />
            )}
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
