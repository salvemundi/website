'use client';

import { X, Clock, MapPin } from 'lucide-react';
import type { Activity } from '@salvemundi/validations/schema/activity.zod';

const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

interface DayDetailsProps {
    selectedDay: Date;
    activities: Activity[];
    onClose: () => void;
    onEventClick: (event: Activity) => void;
}

export default function DayDetails({ selectedDay, activities, onClose, onEventClick }: DayDetailsProps) {
    const dayEvents = activities.filter(event => isSameDay(new Date(event.event_date), selectedDay));

    return (
        <div className="rounded-3xl bg-(--bg-card) dark:border dark:border-white/10 p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-(--theme-purple) dark:text-(--text-main)">
                    {new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' }).format(selectedDay)}
                </h3>
                <button
                    onClick={onClose}
                    className="icon-button rounded-full p-1 text-(--text-muted) hover:bg-(--bg-soft)"
                    aria-label="Sluiten"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {dayEvents.length === 0 ? (
                <p className="text-center text-sm text-(--text-muted) py-4">
                    Geen activiteiten op deze dag
                </p>
            ) : (
                <div className="space-y-3">
                    {dayEvents.map(event => (
                        <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="group cursor-pointer rounded-xl bg-(--bg-soft) p-3 transition hover:ring-2 hover:ring-inset hover:ring-(--theme-purple)/30"
                        >
                            <h4 className="font-semibold text-(--theme-purple) dark:text-(--text-main) group-hover:text-(--theme-purple-light)">
                                {event.name}
                            </h4>
                            <div className="mt-2 flex items-center gap-3 text-xs text-(--text-muted)">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                        {new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.event_date))}
                                    </span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate max-w-30">{event.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}