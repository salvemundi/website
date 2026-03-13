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
                const eDate = e.datum_start || e.event_date;
                const eventDateTime = e.event_time
                    ? new Date(`${eDate}T${e.event_time}`)
                    : new Date(eDate);
                return eventDateTime >= now;
            })
            .sort((a, b) => {
                const aDate = a.datum_start || a.event_date;
                const bDate = b.datum_start || b.event_date;
                const aDateTime = a.event_time
                    ? new Date(`${aDate}T${a.event_time}`).getTime()
                    : new Date(aDate).getTime();
                const bDateTime = b.event_time
                    ? new Date(`${bDate}T${b.event_time}`).getTime()
                    : new Date(bDate).getTime();
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
                    ? `${upcomingEvent.datum_start || upcomingEvent.event_date}T${upcomingEvent.event_time}`
                    : (upcomingEvent.datum_start || upcomingEvent.event_date)
                }
                title={upcomingEvent.titel || upcomingEvent.name}
                href={`/activiteiten/${upcomingEvent.id}`}
            />
        </div>
    );
}
