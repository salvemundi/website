import React, { useMemo } from 'react';
import FlipClock from './FlipClock';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import Image from 'next/image';

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

        function e_to_time(e: any) {
            return e.event_time
                    ? new Date(`${e.datum_start}T${e.event_time}`).getTime()
                    : new Date(e.datum_start).getTime();
        }
    }, [events, serverTime]);

    if (!upcomingEvent) return null;
    
    return (
        <div className="relative w-full">
            <FlipClock
                targetDate={upcomingEvent.event_time
                    ? `${upcomingEvent.datum_start}T${upcomingEvent.event_time}`
                    : upcomingEvent.datum_start
                }
                title={upcomingEvent.titel}
                href={`/activiteiten/${upcomingEvent.id}`}
                serverTime={serverTime}
            />
        </div>
    );
}
