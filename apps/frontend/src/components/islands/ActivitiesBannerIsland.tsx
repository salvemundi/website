'use client';

import React, { useMemo } from 'react';
import FlipClock from './FlipClock';
import type { Activiteit } from '@salvemundi/validations';

interface ActivitiesBannerIslandProps {
    events: Activiteit[];
}

export default function ActivitiesBannerIsland({ events }: ActivitiesBannerIslandProps) {
    const upcomingEvent = useMemo(() => {
        const now = new Date();
        return events
            .filter(e => {
                const eventDateTime = e.event_time
                    ? new Date(`${e.datum_start}T${e.event_time}`)
                    : new Date(e.datum_start);
                return eventDateTime >= now;
            })
            .sort((a, b) => {
                const aDateTime = a.event_time
                    ? new Date(`${a.datum_start}T${a.event_time}`).getTime()
                    : new Date(a.datum_start).getTime();
                const bDateTime = b.event_time
                    ? new Date(`${b.datum_start}T${b.event_time}`).getTime()
                    : new Date(b.datum_start).getTime();
                return aDateTime - bDateTime;
            })[0];
    }, [events]);

    if (!upcomingEvent) return null;

    return (
        <div className="rounded-3xl shadow-xl px-8 pb-4 bg-gradient-to-br 
            from-[var(--gradient-start)]
            via-[var(--gradient-start)]
            to-[var(--gradient-end)]
            dark:from-[#1f1921]
            dark:via-[#1f1921]
            dark:to-[#2a232b]">
            <FlipClock
                targetDate={upcomingEvent.event_time
                    ? `${upcomingEvent.datum_start}T${upcomingEvent.event_time}`
                    : upcomingEvent.datum_start
                }
                title={upcomingEvent.titel}
                href={`/activiteiten/${upcomingEvent.id}`}
            />
        </div>
    );
}
