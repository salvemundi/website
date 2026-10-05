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
            className="modal-backdrop"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Activiteiten op ${formattedDate}`}
                className="modal-content max-w-lg"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-box">
                            <CalendarIcon className="size-5" />
                        </div>
                        <div>
                            <p className="text-caption-muted">
                                {dayEvents.length} {dayEvents.length === 1 ? 'activiteit' : 'activiteiten'}
                            </p>
                            <h3 className="modal-title-lg">
                                {formattedDate}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="icon-button size-9 p-2"
                        aria-label="Sluiten"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-body-scroll">
                    {dayEvents.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm font-semibold text-text-muted">
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
                                    className="group btn-day-event"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="font-bold text-text-main transition-colors group-hover:text-theme-purple">
                                            {event.name}
                                        </h4>
                                        <ArrowRight className="icon-arrow-slide" />
                                    </div>

                                    <div className="meta-row-muted">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="size-3.5 shrink-0 text-theme-purple" />
                                            <span>
                                                {event.event_time 
                                                    ? event.event_time.split(':').slice(0, 2).join(':')
                                                    : new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.event_date))}
                                                {event.event_time_end && ` - ${event.event_time_end.split(':').slice(0, 2).join(':')}`}
                                            </span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="size-3.5 shrink-0 text-theme-purple" />
                                                <span className="max-w-xs truncate">{event.location}</span>
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