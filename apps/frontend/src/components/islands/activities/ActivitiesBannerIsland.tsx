import React, { useMemo } from 'react';
import FlipClock from './FlipClock';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { slugify } from '@/shared/lib/utils/slug';

interface ActivitiesBannerIslandProps {
    events: Activiteit[];
    serverTime?: string;
}

export default function ActivitiesBannerIsland({ events, serverTime }: ActivitiesBannerIslandProps) {
    const upcomingEvent = useMemo(() => {
        const now = serverTime ? new Date(serverTime) : new Date();
        const allEvents = events || [];
        
        // 1. Try finding the next upcoming event
        const upcoming = allEvents
            .filter(e => {
                const eventDateTime = e_to_time(e);
                return eventDateTime >= now.getTime();
            })
            .sort((a, b) => e_to_time(a) - e_to_time(b));
            
        if (upcoming.length > 0) return upcoming[0];
        
        // 2. Fallback: Show the most recent past event to maintain geometry (Zero-Drift)
        return allEvents.sort((a, b) => e_to_time(b) - e_to_time(a))[0] || null;

        function e_to_time(e: Activiteit) {
            const datePart = e.datum_start.split('T')[0];
            return e.event_time
                    ? new Date(`${datePart}T${e.event_time}`).getTime()
                    : new Date(e.datum_start).getTime();
        }
    }, [events, serverTime]);

    if (!upcomingEvent) return null;
    
    const datePart = upcomingEvent.datum_start.split('T')[0];
    
    return (
        <div className="relative w-full flex justify-center py-4">
            <FlipClock
                targetDate={upcomingEvent.event_time
                    ? `${datePart}T${upcomingEvent.event_time}`
                    : upcomingEvent.datum_start
                }
                title={upcomingEvent.titel}
                href={`/activiteiten/${slugify(upcomingEvent.titel || '')}`}
                serverTime={serverTime}
            />
        </div>
    );
}
