'use client';

import React from 'react';
import { X, Clock, MapPin } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface DayDetailsProps {
    selectedDay: Date;
    events: any[];
    onClose: () => void;
    onEventClick: (event: any) => void;
}

export default function DayDetails({ selectedDay, events, onClose, onEventClick }: DayDetailsProps) {
    const dayEvents = events.filter(event => isSameDay(parseISO(event.event_date), selectedDay));

    return (
        <div className="rounded-3xl bg-white dark:bg-[#1f1921] dark:border dark:border-white/10 p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-paars dark:text-white">
                    {format(selectedDay, 'd MMMM', { locale: nl })}
                </h3>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-slate-400 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white/70"
                    aria-label="Sluiten"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {dayEvents.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-white/60 py-4">
                    Geen activiteiten op deze dag
                </p>
            ) : (
                <div className="space-y-3">
                    {dayEvents.map(event => (
                        <div
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="group cursor-pointer rounded-xl bg-slate-50 dark:bg-[#2a232b] p-3 transition hover:bg-oranje/5 hover:ring-2 hover:ring-inset hover:ring-purple-600/30"
                        >
                            <h4 className="font-semibold text-paars dark:text-white group-hover:text-oranje">
                                {event.name}
                            </h4>
                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 dark:text-white/60">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(parseISO(event.event_date), 'HH:mm')}</span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate max-w-[120px]">{event.location}</span>
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
