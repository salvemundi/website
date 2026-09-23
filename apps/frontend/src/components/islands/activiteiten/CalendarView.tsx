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
        <section aria-label="Activiteitenkalender" className="overflow-hidden rounded-2xl bg-(--bg-card) shadow-xl sm:rounded-3xl dark:border dark:border-white/10">
            <div className="flex items-center justify-between p-5 text-purple-700 sm:p-6 dark:text-purple-300">
                <h2 className="text-xl font-black tracking-tight capitalize sm:text-2xl">
                    {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevMonth}
                        className="icon-button flex size-9 items-center justify-center rounded-full text-purple-700 transition-colors hover:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-400/10"
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
                        className="tab-button rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-500/20 dark:bg-purple-400/10 dark:text-purple-300 dark:hover:bg-purple-400/20"
                    >
                        Vandaag
                    </button>
                    <button
                        type="button"
                        onClick={onNextMonth}
                        className="icon-button flex size-9 items-center justify-center rounded-full text-purple-700 transition-colors hover:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-400/10"
                        aria-label="Volgende maand"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-y border-(--border-color)/30 bg-(--bg-soft)">
                {WEEK_DAYS.map(day => (
                    <div key={day} className="py-2.5 text-center text-[11px] font-black tracking-wider text-(--text-muted) uppercase">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid auto-rows-fr grid-cols-7 gap-px bg-(--border-color)/40">
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
                                "group relative flex min-h-28 cursor-pointer flex-col justify-between p-2 transition-colors",
                                !isCurrentMonth ? "bg-(--bg-soft)/40 text-(--text-muted)/60" : "bg-(--bg-card) text-(--text-main)",
                                isSelected && "bg-purple-500/5 ring-2 ring-purple-600 ring-inset dark:bg-purple-400/5 dark:ring-purple-400",
                                !isSelected && "hover:bg-purple-500/4 dark:hover:bg-purple-400/4"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        "flex size-7 items-center justify-center rounded-full text-xs transition-colors",
                                        isDayToday
                                            ? "bg-(--theme-purple) font-black text-white shadow-xs"
                                            : isSelected
                                                ? "font-black text-purple-700 dark:text-purple-300"
                                                : isCurrentMonth
                                                    ? "font-semibold text-(--text-main)"
                                                    : "text-(--text-muted)/60"
                                    )}
                                >
                                    {day.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                    <span className="hidden text-[10px] font-bold text-(--text-muted) opacity-70 group-hover:opacity-100 sm:inline-block">
                                        {dayEvents.length} {dayEvents.length === 1 ? 'act.' : 'act.'}
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
                                        className="tab-button group/item flex w-full items-center gap-1.5 rounded-md border border-purple-500/15 bg-purple-500/10 px-2 py-1 text-left text-[11px] font-bold text-purple-800 transition-colors duration-150 hover:border-purple-500/35 hover:bg-purple-500/20 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-200 dark:hover:border-purple-400/40 dark:hover:bg-purple-400/20"
                                        title={`${event.event_time ? event.event_time.split(':').slice(0, 2).join(':') : '00:00'} - ${event.name}`}
                                    >
                                        {event.event_time && (
                                            <span className="shrink-0 text-[10px] font-black opacity-60">
                                                {event.event_time.split(':').slice(0, 2).join(':')}
                                            </span>
                                        )}
                                        <span className="truncate">
                                            {event.name}
                                        </span>
                                    </button>
                                ))}

                                {overflowCount > 0 && (
                                    <div className="mt-0.5 text-center text-[10px] font-bold text-purple-700 dark:text-purple-300">
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
