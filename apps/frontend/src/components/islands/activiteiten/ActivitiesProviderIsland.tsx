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
            <div className="switcher-header-row">
                {/* View Mode Switcher */}
                <div 
                    role="tablist" 
                    aria-label="Weergavemodus" 
                    className="switcher-tab-bar"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'list'}
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "tab-button switcher-tab-item",
                            viewMode === 'list'
                                ? "switcher-tab-item-active"
                                : "switcher-tab-item-inactive"
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
                            "tab-button switcher-tab-item",
                            viewMode === 'grid'
                                ? "switcher-tab-item-active"
                                : "switcher-tab-item-inactive"
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
                            "tab-button switcher-tab-item hidden lg:flex",
                            viewMode === 'calendar'
                                ? "switcher-tab-item-active"
                                : "switcher-tab-item-inactive"
                        )}
                    >
                        <CalendarIcon className="size-4 shrink-0" />
                        <span>Kalender</span>
                    </button>
                </div>

                {/* Actions: Agenda koppelen & Afgelopen activiteiten */}
                <div className="provider-action-group">
                    <CalendarExportButton 
                        calendarToken={calendarToken} 
                        isLoggedIn={isLoggedIn}
                        buttonClassName="btn-calendar-export w-full sm:w-auto"
                    />

                    <button
                        type="button"
                        onClick={toggleShowPastActivities}
                        className={cn(
                            "group btn-past-toggle",
                            showPastActivities
                                ? "btn-past-toggle-active"
                                : "btn-past-toggle-inactive"
                        )}
                    >
                        <span className="past-toggle-label-box" aria-live="polite">
                            <span className="pointer-events-none invisible select-none" aria-hidden="true">Verberg afgelopen</span>
                            <span className="absolute inset-0 flex items-center justify-center">
                                {showPastActivities ? 'Verberg afgelopen' : 'Toon afgelopen'}
                            </span>
                        </span>
                        <span className={cn(
                            "past-toggle-icon-box",
                            showPastActivities
                                ? "bg-wit-paars/20 text-wit-paars"
                                : "bg-theme-purple/10 text-theme-purple group-hover:bg-theme-purple group-hover:text-wit-paars"
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