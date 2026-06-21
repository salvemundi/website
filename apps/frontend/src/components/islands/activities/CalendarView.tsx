'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';

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
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

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

    const startDate = getStartOfWeek(monthStart);
    const endDate = getEndOfWeek(monthEnd);

    const days: Date[] = [];
    const day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }

    const weekDays = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

    const getEventsForDay = (day: Date) => {
        return events.filter(event => {
            const start = new Date(event.datum_start);
            const end = event.datum_eind ? new Date(event.datum_eind) : start;

            const d = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
            const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
            const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

            return d >= s && d <= e;
        });
    };

    return (
        <div className="bg-(--bg-card) dark:border dark:border-white/10 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 flex items-center justify-between text-(--theme-purple) dark:text-(--text-main)">
                <h2 className="text-2xl font-bold capitalize">
                    {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 hover:bg-(--theme-purple)/10 rounded-full transition-colors"
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
                        className="px-4 py-1.5 bg-(--theme-purple)/10 hover:bg-(--theme-purple)/20 rounded-full text-sm font-semibold transition-colors"
                    >
                        Vandaag
                    </button>
                    <button
                        onClick={onNextMonth}
                        className="p-2 hover:bg-(--theme-purple)/10 rounded-full transition-colors"
                        aria-label="Volgende maand"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 bg-(--bg-soft)">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-sm font-bold text-(--text-muted) uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr bg-(--border-color) gap-px">
                {days.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                    const isDayToday = day.toDateString() === new Date().toDateString();
                    const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onSelectDay(day)}
                            className={`min-h-[120px] p-2 flex flex-col gap-1 transition-colors cursor-pointer
                                ${!isCurrentMonth ? 'bg-(--bg-soft)/50 text-(--text-muted)' : 'bg-(--bg-card)'}
                                ${isSelected ? 'ring-2 ring-inset ring-(--theme-purple) bg-(--theme-purple)/5' : ''}
                                hover:ring-2 hover:ring-inset hover:ring-(--theme-purple)/30
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span
                                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                                        ${isDayToday ? 'bg-(--theme-purple) text-white' : isSelected ? 'text-(--theme-purple)' : 'text-(--text-main)'}
                                    `}
                                >
                                    {day.getDate()}
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
                                        className="w-full text-left text-[10px] p-1.5 rounded-lg bg-(--theme-purple)/10 hover:bg-(--theme-purple)/20 text-(--theme-purple) font-bold truncate transition-all hover:scale-[1.02] border border-transparent hover:border-(--theme-purple)/20"
                                        title={`${event.event_time ? event.event_time.split(':').slice(0, 2).join(':') : '00:00'} - ${event.titel}`}
                                    >
                                        <span className="opacity-60 mr-1.5 font-black">{event.event_time ? event.event_time.split(':').slice(0, 2).join(':') : '00:00'}</span>
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
