'use client';

import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
    id: number | string;
    titel: string;
    datum_start: string;
    datum_eind?: string | null;
    committee_name?: string | null;
    afbeelding_id?: string | null;
}

interface CalendarViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    selectedDay?: Date | null;
    onSelectDay: (day: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToDate?: (date: Date) => void;
}

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
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

    const getEventsForDay = (day: Date) => {
        return events.filter(event => {
            const start = parseISO(event.datum_start);
            const end = event.datum_eind ? parseISO(event.datum_eind) : start;

            const d = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
            const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
            const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

            return d >= s && d <= e;
        });
    };

    return (
        <div className="bg-[var(--bg-card)] dark:border dark:border-[var(--color-white)]/10 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 flex items-center justify-between text-[var(--theme-purple)] dark:text-[var(--text-main)]">
                <h2 className="text-2xl font-bold capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: nl })}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 hover:bg-[var(--theme-purple)]/10 rounded-full transition-colors"
                        aria-label="Vorige maand"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            onSelectDay(today);
                            onGoToDate?.(today);
                        }}
                        className="px-4 py-1.5 bg-[var(--theme-purple)]/10 hover:bg-[var(--theme-purple)]/20 rounded-full text-sm font-semibold transition-colors"
                    >
                        Vandaag
                    </button>
                    <button
                        onClick={onNextMonth}
                        className="p-2 hover:bg-[var(--theme-purple)]/10 rounded-full transition-colors"
                        aria-label="Volgende maand"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 bg-[var(--bg-soft)]">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr bg-[var(--border-color)] gap-px">
                {days.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isDayToday = isToday(day);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onSelectDay(day)}
                            className={`min-h-[120px] p-2 flex flex-col gap-1 transition-colors cursor-pointer
                                ${!isCurrentMonth ? 'bg-[var(--bg-soft)]/50 text-[var(--text-muted)]' : 'bg-[var(--bg-card)]'}
                                ${isSelected ? 'ring-2 ring-inset ring-[var(--theme-purple)] bg-[var(--theme-purple)]/5' : ''}
                                hover:ring-2 hover:ring-inset hover:ring-[var(--theme-purple)]/30
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span
                                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                                        ${isDayToday ? 'bg-[var(--theme-purple)] text-[var(--color-white)]' : isSelected ? 'text-[var(--theme-purple)]' : 'text-[var(--text-main)]'}
                                    `}
                                >
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                                {dayEvents.map(event => (
                                    <button
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className="w-full text-left text-xs p-1.5 rounded bg-[var(--theme-purple)]/10 hover:bg-[var(--theme-purple)]/20 text-[var(--theme-purple)] font-medium truncate transition-colors hover:ring-2 hover:ring-inset hover:ring-[var(--theme-purple)]/30"
                                        title={`${format(parseISO(event.datum_start), 'HH:mm')} - ${event.titel}`}
                                    >
                                        <span className="opacity-75 mr-1">{format(parseISO(event.datum_start), 'HH:mm')}</span>
                                        {event.titel}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
