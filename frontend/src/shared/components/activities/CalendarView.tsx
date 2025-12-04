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

interface Event {
    id: number;
    name: string;
    event_date: string;
    committee_name?: string;
    image?: string;
}

interface CalendarViewProps {
    currentDate: Date;
    events: Event[];
    selectedDay?: Date | null;
    onSelectDay: (day: Date) => void;
    onEventClick: (event: Event) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export default function CalendarView({
    currentDate,
    events,
    selectedDay,
    onSelectDay,
    onEventClick,
    onPrevMonth,
    onNextMonth
}: CalendarViewProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(parseISO(event.event_date), day));
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 flex items-center justify-between bg-gradient-theme text-theme-white">
                <h2 className="text-2xl font-bold capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: nl })}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Vorige maand"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => onSelectDay(new Date())} // Reset to today logic handled by parent usually, but here we can just select today
                        className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm font-semibold transition-colors"
                    >
                        Vandaag
                    </button>
                    <button
                        onClick={onNextMonth}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Volgende maand"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 bg-[var(--bg-soft)]">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-sm font-bold text-theme-muted uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
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
                                ${!isCurrentMonth ? 'bg-[var(--bg-soft)]/50 text-theme-muted' : 'bg-[var(--bg-card)] hover:bg-[var(--bg-soft)]'}
                                ${isSelected ? 'ring-2 ring-inset ring-theme-purple bg-theme-purple/5' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span
                                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                                        ${isDayToday ? 'bg-gradient-theme text-theme-white' : isSelected ? 'text-theme-purple' : 'text-theme'}
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
                                        className="text-left text-xs p-1.5 rounded bg-theme-purple/10 hover:bg-theme-purple/20 text-theme-purple font-medium truncate transition-all hover:scale-[1.02]"
                                        title={`${format(parseISO(event.event_date), 'HH:mm')} - ${event.name}`}
                                    >
                                        <span className="opacity-75 mr-1">{format(parseISO(event.event_date), 'HH:mm')}</span>
                                        {event.name}
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
