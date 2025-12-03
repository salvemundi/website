'use client';

import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { getImageUrl } from '@/lib/api/salvemundi';

interface FeaturedEventProps {
    event: any;
    onEventClick: (event: any) => void;
}

export default function FeaturedEvent({ event, onEventClick }: FeaturedEventProps) {
    if (!event) return null;

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    const formattedTime = eventDate.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="rounded-3xl bg-white dark:bg-surface-dark p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-oranje/10 text-oranje">
                    <Calendar className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-oranje dark:text-ink">
                    Eerstvolgende Activiteit
                </h3>
            </div>

            <div
                onClick={() => onEventClick(event)}
                className="group cursor-pointer space-y-4"
            >
                <div className="overflow-hidden rounded-2xl">
                    <img
                        src={getImageUrl(event.image)}
                        alt={event.name}
                        className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/img/placeholder.svg';
                        }}
                    />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-paars transition group-hover:text-oranje">
                        {event.name}
                    </h2>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-oranje" />
                            <span>{formattedDate} om {formattedTime}</span>
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-oranje" />
                                <span>{event.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                <button className="w-full rounded-xl bg-paars py-3 font-semibold text-white transition hover:bg-paars/90">
                    Bekijk details
                </button>
            </div>
        </div>
    );
}
