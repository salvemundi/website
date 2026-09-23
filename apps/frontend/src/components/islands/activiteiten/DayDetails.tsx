'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, MapPin, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { isEventOnDay } from '@/shared/lib/utils/date';

interface DayDetailsProps {
    selectedDay: Date;
    activities: Activiteit[];
    onClose: () => void;
    onEventClick: (event: Activiteit) => void;
}

export default function DayDetails({ selectedDay, activities, onClose, onEventClick }: DayDetailsProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [onClose]);

    if (!mounted) return null;

    const dayEvents = activities.filter(event => isEventOnDay(event, selectedDay));
    const formattedDate = new Intl.DateTimeFormat('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(selectedDay);

    const modalContent = (
        <div
            className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Activiteiten op ${formattedDate}`}
                className="animate-in zoom-in-95 relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border-color/60 bg-(--bg-card) shadow-2xl duration-200 sm:rounded-3xl dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-color/30 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/5 text-purple-700 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                            <CalendarIcon className="size-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">
                                {dayEvents.length} {dayEvents.length === 1 ? 'activiteit' : 'activiteiten'}
                            </p>
                            <h3 className="text-base font-black text-purple-700 capitalize sm:text-lg dark:text-purple-300">
                                {formattedDate}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="icon-button flex size-9 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:bg-(--bg-soft) hover:text-(--text-main)"
                        aria-label="Sluiten"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
                    {dayEvents.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm font-semibold text-(--text-muted)">
                                Geen activiteiten gepland op deze dag
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dayEvents.map(event => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onEventClick(event);
                                    }}
                                    className="tab-button group flex w-full flex-col gap-2 rounded-xl border border-border-color/30 bg-(--bg-soft) p-4 text-left transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 dark:hover:border-purple-400/30 dark:hover:bg-purple-400/10"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="font-bold text-(--text-main) transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                            {event.name}
                                        </h4>
                                        <ArrowRight className="size-4 shrink-0 text-(--text-muted) transition-transform group-hover:translate-x-1 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-(--text-muted)">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="size-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                                            <span>
                                                {event.event_time 
                                                    ? event.event_time.split(':').slice(0, 2).join(':')
                                                    : new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.event_date))}
                                                {event.event_time_end && ` - ${event.event_time_end.split(':').slice(0, 2).join(':')}`}
                                            </span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="size-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                                                <span className="max-w-55 truncate">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}