'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import FlipClock from './FlipClock';
import { getImageUrl } from '@/lib/utils/image-utils';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';

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

    return (
        <section className="relative w-full overflow-hidden min-h-[260px] flex items-center justify-center bg-[var(--bg-card)]">
            {upcomingEvent ? (
                <>
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={upcomingEvent.afbeelding_id ? getImageUrl(upcomingEvent.afbeelding_id, { width: 1200, height: 400, fit: 'cover' }) : '/img/backgrounds/activities-banner.jpg'}
                            alt="Activities Banner"
                            fill
                            priority
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-purple-900)]/90 via-[var(--color-purple-800)]/80 to-[var(--color-purple-900)]/90 backdrop-blur-[2px]" />
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 w-full max-w-app px-4 py-8 sm:py-12 md:py-16">
                        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
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
                    </div>
                </>
            ) : (
                <div className="relative z-10 w-full max-w-app px-4 py-8 text-center">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-[var(--color-purple-300)] opacity-50">
                        Geen Komende Activiteiten
                    </h2>
                    <p className="text-[var(--text-muted)] mt-2 italic px-10">
                        Check binnenkort weer voor nieuwe evenementen!
                    </p>
                </div>
            )}
        </section>
    );
}
