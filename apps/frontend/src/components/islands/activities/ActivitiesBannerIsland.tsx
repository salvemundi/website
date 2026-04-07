'use client';

import React, { useMemo } from 'react';
import FlipClock from './FlipClock';
import type { Activiteit } from '@salvemundi/validations';
import { Skeleton } from '@/components/ui/Skeleton';

interface ActivitiesBannerIslandProps {
    events: Activiteit[];
    isLoading?: boolean;
}

export default function ActivitiesBannerIsland({ events, isLoading = false }: ActivitiesBannerIslandProps) {
    const upcomingEvent = useMemo(() => {
        if (isLoading) return null;
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
    }, [events, isLoading]);

    if (isLoading) {
        return (
            <div className="rounded-3xl shadow-xl px-8 pb-8 pt-6 bg-gradient-to-br 
                from-[var(--gradient-start)]
                via-[var(--gradient-start)]
                to-[var(--gradient-end)]
                dark:from-[#1f1921]
                dark:via-[#1f1921]
                dark:to-[#2a232b]
                animate-pulse">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-6 w-48 mb-2" variant="purple" rounded="full" />
                    <Skeleton className="h-8 w-64 mb-6" variant="purple" rounded="lg" />
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <Skeleton className="h-20 w-16 sm:w-20" rounded="xl" />
                                <Skeleton className="h-3 w-8" rounded="full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

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
