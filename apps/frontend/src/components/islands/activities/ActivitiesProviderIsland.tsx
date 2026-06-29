'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Eye, EyeOff, LayoutGrid, List, Calendar as CalendarIcon } from "lucide-react";

import CalendarView from "./CalendarView";
import DayDetails from "./DayDetails";
import EventList from "./EventList";
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { slugify } from "@/shared/lib/utils/slug";
import { getActivityUrl } from "@/shared/lib/utils/activity";
import { isEventPast } from "@/shared/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface ActivitiesProviderIslandProps {
    events?: (Activiteit & { is_signed_up?: boolean })[];
    serverTime?: string;
    initialViewMode?: 'list' | 'grid' | 'calendar';
}

export default function ActivitiesProviderIsland({
    events: initialEvents = [],
    serverTime,
    initialViewMode = 'list'
}: ActivitiesProviderIslandProps) {
    const router = useRouter();
    const [events] = useState<(Activiteit & { is_signed_up?: boolean })[]>(initialEvents);
    const searchParams = useSearchParams();

    const [viewMode, setViewModeState] = useState<'list' | 'grid' | 'calendar'>(initialViewMode);

    const setViewMode = useCallback((mode: 'list' | 'grid' | 'calendar') => {
        setViewModeState(mode);
        document.cookie = `activities_view_mode=${mode}; path=/; max-age=31536000; SameSite=Lax`;
    }, []);
    const [showPastActivities, setShowPastActivities] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(serverTime ? new Date(serverTime) : new Date());

    const filteredEvents = useMemo(() => {
        const now = serverTime ? new Date(serverTime) : new Date();
        let filtered = events;

        if (!showPastActivities) {
            filtered = filtered.filter(event => {
                return !isEventPast(
                    event.event_date_end || event.event_date,
                    event.event_time_end || event.event_time,
                    !!event.event_time_end,
                    now
                );
            });
        }

        return filtered.sort((a, b) => {
            const isAPast = isEventPast(
                a.event_date_end || a.event_date,
                a.event_time_end || a.event_time,
                !!a.event_time_end,
                now
            );
            const isBPast = isEventPast(
                b.event_date_end || b.event_date,
                b.event_time_end || b.event_time,
                !!b.event_time_end,
                now
            );

            if (isAPast !== isBPast) return isAPast ? 1 : -1;

            const getEventTime = (event: Activiteit) => {
                const date = event.event_date;
                return (event.event_time && date.length <= 10)
                    ? new Date(`${date}T${event.event_time}`).getTime()
                    : new Date(date).getTime();
            };

            const aTime = getEventTime(a);
            const bTime = getEventTime(b);

            if (!isAPast) {
                return aTime - bTime;
            } else {
                return bTime - aTime;
            }
        });
    }, [events, showPastActivities, serverTime]);

    const handleShowDetails = useCallback((activity: Activiteit) => {
        router.push(getActivityUrl({ name: activity.name || '', custom_url: activity.custom_url }));
    }, [router]);

    useEffect(() => {
        const status = searchParams.get('payment_status');
        const eventId = searchParams.get('event_id');

        if (status === 'success' && eventId) {
            const event = events.find(e => e.id.toString() === eventId.toString());
            const slug = event ? slugify(event.name || '') : eventId;
            router.replace(`/activiteiten/${slug}`);
        }
    }, [searchParams, router, events]);

    return (
        <div className="relative w-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 min-w-0">
                <div className="space-y-1">
                    <h2 className="text-3xl md:text-4xl font-black text-theme-purple tracking-tight">
                        {showPastActivities ? 'Alle Activiteiten' : 'Komende Activiteiten'}
                    </h2>
                    <p className="text-sm font-medium text-text-muted opacity-70">
                        {filteredEvents.length} {filteredEvents.length === 1 ? 'activiteit' : 'activiteiten'} zichtbaar
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex p-1 rounded-xl bg-bg-card border border-border-color/30 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                viewMode === 'list'
                                    ? "bg-theme-purple text-white shadow-md shadow-theme-purple/20"
                                    : "text-theme-purple hover:bg-theme-purple/5"
                            )}
                        >
                            <List className="h-4 w-4" />
                            <span>Lijst</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                viewMode === 'grid'
                                    ? "bg-theme-purple text-white shadow-md shadow-theme-purple/20"
                                    : "text-theme-purple hover:bg-theme-purple/5"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span>Kaarten</span>
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                viewMode === 'calendar'
                                    ? "bg-theme-purple text-white shadow-md shadow-theme-purple/20"
                                    : "text-theme-purple hover:bg-theme-purple/5"
                            )}
                        >
                            <CalendarIcon className="h-4 w-4" />
                            <span>Kalender</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setShowPastActivities(!showPastActivities)}
                        className={cn(
                            "group relative inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest",
                            showPastActivities
                                ? "bg-theme-purple text-white border-theme-purple shadow-lg shadow-theme-purple/20"
                                : "bg-bg-card text-theme-purple border-border-color/30 hover:border-theme-purple/30 hover:bg-theme-purple/5"
                        )}
                    >
                        {/* Grid container to prevent layout shifting */}
                        <span className="grid grid-cols-1 grid-rows-1">
                            <span className={cn(
                                "col-start-1 row-start-1 transition-opacity duration-200",
                                showPastActivities ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}>
                                Verberg afgelopen
                            </span>
                            <span className={cn(
                                "col-start-1 row-start-1 transition-opacity duration-200",
                                !showPastActivities ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}>
                                Toon afgelopen
                            </span>
                        </span>
                        <div className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center transition-colors shrink-0",
                            showPastActivities ? "bg-white/20 text-white" : "bg-theme-purple/10 text-theme-purple group-hover:bg-theme-purple group-hover:text-white"
                        )}>
                            {showPastActivities ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                {selectedDay && (
                    <aside className="lg:w-96 xl:w-md space-y-6">
                        <DayDetails
                            selectedDay={selectedDay}
                            activities={events}
                            onClose={() => setSelectedDay(null)}
                            onEventClick={handleShowDetails}
                        />
                    </aside>
                )}

                <div className="flex-1 min-w-0 space-y-6">
                    {viewMode === 'calendar' && (
                        <>
                            <div className="hidden lg:block">
                                <CalendarView
                                    currentDate={currentDate}
                                    events={filteredEvents}
                                    selectedDay={selectedDay}
                                    onSelectDay={setSelectedDay}
                                    onEventClick={handleShowDetails}
                                    onPrevMonth={() => {
                                        const d = new Date(currentDate);
                                        d.setMonth(d.getMonth() - 1);
                                        setCurrentDate(d);
                                    }}
                                    onNextMonth={() => {
                                        const d = new Date(currentDate);
                                        d.setMonth(d.getMonth() + 1);
                                        setCurrentDate(d);
                                    }}
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
                            serverTime={serverTime}
                        />
                    )}

                    {viewMode === 'grid' && (
                        <EventList
                            events={filteredEvents}
                            onEventClick={handleShowDetails}
                            variant="grid"
                            serverTime={serverTime}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
