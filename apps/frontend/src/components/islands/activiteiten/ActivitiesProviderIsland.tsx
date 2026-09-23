'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Eye, EyeOff, LayoutGrid, List, Calendar as CalendarIcon } from "lucide-react";

import CalendarView from "./CalendarView";
import DayDetails from "./DayDetails";
import ActiviteitList from "./ActiviteitList";
import CalendarExportButton from "./CalendarExportButton";
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { slugify } from "@/shared/lib/utils/slug";
import { getActivityUrl } from "@/shared/lib/utils/activity";
import { isEventPast } from "@/shared/lib/utils/date";
import { cn } from "@/lib/utils/cn";

interface ActivitiesProviderIslandProps {
    events?: (Activiteit & { is_signed_up?: boolean })[];
    serverTime?: string;
    initialViewMode?: 'list' | 'grid' | 'calendar';
    initialShowPast?: boolean;
    isLoggedIn?: boolean;
    calendarToken?: string | null;
}

export default function ActivitiesProviderIsland({
    events: initialEvents = [],
    serverTime,
    initialViewMode = 'list',
    initialShowPast = false,
    isLoggedIn = false,
    calendarToken = null
}: ActivitiesProviderIslandProps) {
    const router = useRouter();
    const [events] = useState<(Activiteit & { is_signed_up?: boolean })[]>(initialEvents);
    const searchParams = useSearchParams();

    const [viewMode, setViewModeState] = useState<'list' | 'grid' | 'calendar'>(initialViewMode);

    const setViewMode = useCallback((mode: 'list' | 'grid' | 'calendar') => {
        setViewModeState(mode);
        document.cookie = `activities_view_mode=${mode}; path=/; max-age=31536000; SameSite=Lax`;
    }, []);

    const [showPastActivities, setShowPastActivitiesState] = useState<boolean>(initialShowPast);

    const toggleShowPastActivities = useCallback(() => {
        setShowPastActivitiesState(prev => {
            const next = !prev;
            document.cookie = `activities_show_past=${next}; path=/; max-age=31536000; SameSite=Lax`;
            return next;
        });
    }, []);

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
        <div className="relative flex w-full flex-col">
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                {/* View Mode Switcher */}
                <div 
                    role="tablist" 
                    aria-label="Weergavemodus" 
                    className="flex w-full rounded-xl border border-border-color/30 bg-bg-card p-1 shadow-xs sm:w-auto sm:rounded-2xl"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'list'}
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "tab-button flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:min-h-0 sm:flex-initial sm:rounded-xl sm:py-2",
                            viewMode === 'list'
                                ? "bg-(--theme-purple) text-white shadow-sm"
                                : "text-(--theme-purple) hover:bg-(--theme-purple)/5"
                        )}
                    >
                        <List className="size-4 shrink-0" />
                        <span>Lijst</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'grid'}
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "tab-button flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:min-h-0 sm:flex-initial sm:rounded-xl sm:py-2",
                            viewMode === 'grid'
                                ? "bg-(--theme-purple) text-white shadow-sm"
                                : "text-(--theme-purple) hover:bg-(--theme-purple)/5"
                        )}
                    >
                        <LayoutGrid className="size-4 shrink-0" />
                        <span>Kaarten</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'calendar'}
                        onClick={() => setViewMode('calendar')}
                        className={cn(
                            "tab-button hidden items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:rounded-xl lg:flex",
                            viewMode === 'calendar'
                                ? "bg-(--theme-purple) text-white shadow-sm"
                                : "text-(--theme-purple) hover:bg-(--theme-purple)/5"
                        )}
                    >
                        <CalendarIcon className="size-4 shrink-0" />
                        <span>Kalender</span>
                    </button>
                </div>

                {/* Actions: Agenda koppelen & Afgelopen activiteiten */}
                <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-3">
                    <CalendarExportButton 
                        calendarToken={calendarToken} 
                        isLoggedIn={isLoggedIn}
                        buttonClassName="tab-button w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all active:scale-95 text-[11px] sm:text-[10px] font-black uppercase tracking-widest min-h-[44px] sm:min-h-0 bg-bg-card text-(--theme-purple) border-border-color/30 hover:border-(--theme-purple)/30 hover:bg-(--theme-purple)/5 shadow-xs"
                    />

                    <button
                        type="button"
                        onClick={toggleShowPastActivities}
                        className={cn(
                            "tab-button group relative inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border px-4 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all active:scale-95 sm:min-h-0 sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3 sm:text-[10px]",
                            showPastActivities
                                ? "border-(--theme-purple) bg-(--theme-purple) text-white shadow-md"
                                : "border-border-color/30 bg-bg-card text-(--theme-purple) shadow-xs hover:border-(--theme-purple)/30 hover:bg-(--theme-purple)/5"
                        )}
                    >
                        <span className="relative whitespace-nowrap" aria-live="polite">
                            <span className="pointer-events-none invisible select-none" aria-hidden="true">Verberg afgelopen</span>
                            <span className="absolute inset-0 flex items-center justify-center">
                                {showPastActivities ? 'Verberg afgelopen' : 'Toon afgelopen'}
                            </span>
                        </span>
                        <span className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                            showPastActivities
                                ? "bg-white/20 text-white"
                                : "bg-(--theme-purple)/10 text-(--theme-purple) group-hover:bg-(--theme-purple) group-hover:text-white"
                        )}>
                            {showPastActivities ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </span>
                    </button>
                </div>
            </div>

            <div className="w-full space-y-6">
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
                            <ActiviteitList
                                events={filteredEvents}
                                onEventClick={handleShowDetails}
                            />
                        </div>
                    </>
                )}

                {viewMode === 'list' && (
                    <ActiviteitList
                        events={filteredEvents}
                        onEventClick={handleShowDetails}
                        serverTime={serverTime}
                    />
                )}

                {viewMode === 'grid' && (
                    <ActiviteitList
                        events={filteredEvents}
                        onEventClick={handleShowDetails}
                        variant="grid"
                        serverTime={serverTime}
                    />
                )}
            </div>

            {selectedDay && (
                <DayDetails
                    selectedDay={selectedDay}
                    activities={events}
                    onClose={() => setSelectedDay(null)}
                    onEventClick={handleShowDetails}
                />
            )}
        </div>
    );
}