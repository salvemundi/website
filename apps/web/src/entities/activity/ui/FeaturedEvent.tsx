'use client';

import Image from 'next/image';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { getImageUrl } from '@/shared/lib/api/image';

interface FeaturedEventProps {
    event: any;
    onEventClick: (event: any) => void;
}

export default function FeaturedEvent({ event, onEventClick }: FeaturedEventProps) {
    if (!event) return null;

    // Build a full datetime using event_time when available so times are accurate
    const eventDate = event.event_time
        ? new Date(`${event.event_date}T${event.event_time}`)
        : new Date(event.event_date);

    const formattedDate = eventDate.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const formattedTime = (() => {
        // If event_time is explicitly provided prefer that formatting
        if (event.event_time) {
            try {
                const t = new Date(`${event.event_date}T${event.event_time}`);
                if (!Number.isNaN(t.getTime())) {
                    return t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                }
            } catch {
                // fallthrough
            }
        }

        // Fallback: if the date string itself contains a time portion, format it
        try {
            if (String(event.event_date).includes('T') || /\d{2}:\d{2}/.test(String(event.event_date))) {
                const t = new Date(event.event_date);
                if (!Number.isNaN(t.getTime())) return t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
            }
        } catch {
            // ignore
        }

        return '';
    })();

    return (
        <div className="rounded-3xl bg-gradient-to-b from-theme-gradient-light-start via-theme-gradient-light-start to-theme-gradient-light-end dark:from-theme-gradient-dark-start dark:via-theme-gradient-dark-start dark:to-theme-gradient-dark-end p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-oranje/10 text-oranje">
                        <Calendar className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-oranje dark:text-ink">
                        Eerstvolgende Activiteit
                    </h3>
                </div>
                {event.only_members && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                        Leden Alleen
                    </span>
                )}
            </div>

            <div
                onClick={() => onEventClick(event)}
                className="group cursor-pointer space-y-4"
            >
                <div className="overflow-hidden rounded-2xl relative h-48">
                    <Image
                        src={getImageUrl(event.image)}
                        alt={event.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE5MiIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/img/placeholder.svg';
                        }}
                    />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-theme-purple transition group-hover:text-theme-purple-light">
                        {event.name}
                    </h2>
                    <div className="mt-3 space-y-2 text-sm text-theme-muted">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-theme-purple" />
                            <span>{formattedDate} om {formattedTime}</span>
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-theme-purple" />
                                <span>{event.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                <button className="w-full rounded-xl bg-gradient-theme py-3 font-bold text-theme-purple dark:text-theme-white transition hover:opacity-90 shadow-md">
                    Bekijk details
                </button>
            </div>
        </div>
    );
}
