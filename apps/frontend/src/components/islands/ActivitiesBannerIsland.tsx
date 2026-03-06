'use client';

import React, { useMemo } from 'react';
import FlipClock from './FlipClock';

interface ActivitiesBannerIslandProps {
    events: any[];
}

export default function ActivitiesBannerIsland({ events }: ActivitiesBannerIslandProps) {
    const upcomingEvent = useMemo(() => {
        const now = new Date();
        return events
            .filter(e => {
                const eventDateTime = e.event_time
                    ? new Date(`${e.event_date}T${e.event_time}`)
                    : new Date(e.event_date);
                return eventDateTime >= now;
            })
            .sort((a, b) => {
                const aDateTime = a.event_time
                    ? new Date(`${a.event_date}T${a.event_time}`).getTime()
                    : new Date(a.event_date).getTime();
                const bDateTime = b.event_time
                    ? new Date(`${b.event_date}T${b.event_time}`).getTime()
                    : new Date(b.event_date).getTime();
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
                    ? `${upcomingEvent.event_date}T${upcomingEvent.event_time}`
                    : upcomingEvent.event_date
                }
                title={upcomingEvent.name}
                href={`/activiteiten/${upcomingEvent.id}`}
            />
        </div>
    );
}
