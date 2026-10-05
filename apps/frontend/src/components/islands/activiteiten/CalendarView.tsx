'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { isEventOnDay } from '@/shared/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface CalendarViewProps {
    currentDate: Date;
    events: Activiteit[];
    selectedDay?: Date | null;
    onSelectDay: (day: Date) => void;
    onEventClick: (event: Activiteit) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToDate?: (date: Date) => void;
}

const WEEK_DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const;

export default function CalendarView({
    currentDate,
    events,
    selectedDay,
    onSelectDay,
    onEventClick,
    onPrevMonth,
    onNextMonth,
    onGoToDate
}: CalendarViewProps) {
    const { days, monthStart } = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const getStartOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - (day === 0 ? 6 : day - 1);
            return new Date(date.setDate(diff));
        };

        const getEndOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() + (day === 0 ? 0 : 7 - day);
            return new Date(date.setDate(diff));
        };

        const startDate = getStartOfWeek(start);
        const endDate = getEndOfWeek(end);

        const dayList: Date[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            dayList.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return { days: dayList, monthStart: start };
    }, [currentDate]);

    const eventsByDayKey = useMemo(() => {
        const map = new Map<string, Activiteit[]>();
        for (const d of days) {
            const key = d.toDateString();
            const dayEvents = events.filter(e => isEventOnDay(e, d));
            map.set(key, dayEvents);
        }
        return map;
    }, [days, events]);

    return (
        <section aria-label="Activiteitenkalender" className="calendar-card-container">
            <div className="calendar-header-bar">
                <h2 className="calendar-header-title">
                    {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevMonth}
                        className="btn-calendar-nav"
                        aria-label="Vorige maand"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            onSelectDay(today);
                            onGoToDate?.(today);
                        }}
                        className="btn-calendar-today"
                    >
                        Vandaag
                    </button>
                    <button
                        type="button"
                        onClick={onNextMonth}
                        className="btn-calendar-nav"
                        aria-label="Volgende maand"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            </div>

            <div className="calendar-weekdays-bar">
                {WEEK_DAYS.map(day => (
                    <div key={day} className="calendar-weekday-label">
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar-grid-wrapper">
                {days.map((day) => {
                    const dayKey = day.toDateString();
                    const dayEvents = eventsByDayKey.get(dayKey) ?? [];
                    const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                    const isDayToday = dayKey === new Date().toDateString();
                    const isSelected = selectedDay ? dayKey === selectedDay.toDateString() : false;
                    const maxVisibleEvents = 2;
                    const overflowCount = dayEvents.length - maxVisibleEvents;

                    return (
                        <div
                            key={dayKey}
                            onClick={() => onSelectDay(day)}
                            className={cn(
                                "group calendar-day-cell",
                                !isCurrentMonth ? "bg-bg-soft/40 text-text-muted/60" : "bg-bg-card text-text-main",
                                isSelected && "bg-theme-purple/5 ring-2 ring-theme-purple ring-inset",
                                !isSelected && "hover:bg-theme-purple/5"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        "calendar-day-badge",
                                        isDayToday
                                            ? "bg-theme-purple font-black text-wit-paars shadow-xs"
                                            : isSelected
                                                ? "font-black text-theme-purple"
                                                : isCurrentMonth
                                                    ? "font-semibold text-text-main"
                                                    : "text-text-muted/60"
                                    )}
                                >
                                    {day.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                    <span className="hidden text-2xs font-bold text-text-muted opacity-70 group-hover:opacity-100 sm:inline-block">
                                        {dayEvents.length} act.
                                    </span>
                                )}
                            </div>

                            <div className="mt-1.5 flex flex-col gap-1">
                                {dayEvents.slice(0, maxVisibleEvents).map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className="calendar-event-chip"
                                        title={`${event.event_time ? event.event_time.split(':').slice(0, 2).join(':') : '00:00'} - ${event.name}`}
                                    >
                                        {event.event_time && (
                                            <span className="shrink-0 text-2xs font-black opacity-60">
                                                {event.event_time.split(':').slice(0, 2).join(':')}
                                            </span>
                                        )}
                                        <span className="truncate">
                                            {event.name}
                                        </span>
                                    </button>
                                ))}

                                {overflowCount > 0 && (
                                    <div className="mt-0.5 text-center text-2xs font-bold text-theme-purple">
                                        +{overflowCount} meer
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
