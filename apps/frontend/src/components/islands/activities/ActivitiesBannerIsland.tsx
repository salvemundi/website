'use client';

import { useMemo } from 'react';
import FlipClock from './FlipClock';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { getActivityUrl } from '@/shared/lib/utils/activity';

interface ActivitiesBannerIslandProps {
    events: Activiteit[];
    serverTime?: string;
}

export default function ActivitiesBannerIsland({ events, serverTime }: ActivitiesBannerIslandProps) {
    const upcomingEvent = useMemo(() => {
        if (events.length === 0) return null;

        const now = serverTime ? new Date(serverTime) : new Date();

        const getEventTime = (e: Activiteit) => {
            const datePart = e.event_date.split('T')[0];
            return e.event_time
                ? new Date(`${datePart}T${e.event_time}`).getTime()
                : new Date(e.event_date).getTime();
        };

        const upcoming = [...events]
            .filter(e => getEventTime(e) >= now.getTime())
            .sort((a, b) => getEventTime(a) - getEventTime(b));

        return upcoming.length > 0 ? upcoming[0] : null;
    }, [events, serverTime]);

    if (!upcomingEvent) return null;

    const datePart = upcomingEvent.event_date.split('T')[0];
    return (
        <div className="relative w-full flex justify-center py-4">
            <FlipClock
                targetDate={upcomingEvent.event_time
                    ? `${datePart}T${upcomingEvent.event_time}`
                    : upcomingEvent.event_date
                }
                title={upcomingEvent.name}
                href={getActivityUrl({ name: upcomingEvent.name || '', custom_url: upcomingEvent.custom_url })}
                serverTime={serverTime}
            />
        </div>
    );
}
