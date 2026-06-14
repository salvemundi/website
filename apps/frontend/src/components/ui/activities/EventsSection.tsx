import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { EventCard } from './EventCard';

import { slugify } from '@/shared/lib/utils/slug';

interface EventsSectionProps {
    activities?: Activiteit[];
    count?: number;
}

/**
 * UI Component voor de activiteiten-sectie op de homepagina.
 * V7.12 Industrial SSR: Clean architecture, no loading logic.
 */
export function EventsSection({ activities = [], count = 4 }: EventsSectionProps) {
    const displayActivities = activities.slice(0, count);
    const hasActivities = displayActivities.length > 0;

    const gridLayoutClass = !hasActivities
        ? 'grid-cols-1'
        : displayActivities.length === 1
            ? 'grid-cols-1 max-w-md mx-auto w-full'
            : displayActivities.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto w-full'
                : displayActivities.length === 3
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto w-full'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full';

    return (
        <section id="kalender" className="px-6 py-6 sm:py-8">
            <div className="mx-auto max-w-app">
                <div className="text-center mb-6 sm:mb-10">
                    <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl">
                        Komende activiteiten
                    </h2>
                    <p className="mx-auto max-w-xl mt-2 text-xs sm:text-sm font-medium text-[var(--text-muted)] dark:text-white/60 leading-relaxed">
                        Van legendarische borrels tot verrijkende workshops en onvergetelijke studiereizen. Er is altijd een plek voor jou!
                    </p>
                </div>

                <div className={`grid gap-4 ${gridLayoutClass}`}>
                    {!hasActivities ? (
                        <div className="col-span-full flex flex-col items-center justify-center min-h-[320px] p-12 text-center bg-white/50 dark:bg-black/20 rounded-[2.5rem] border border-dashed border-[var(--color-purple-500)]/20">
                            <div className="h-16 w-16 mb-4 rounded-full bg-[var(--color-purple-100)] dark:bg-transparent flex items-center justify-center text-[var(--color-purple-600)] dark:text-[var(--color-purple-300)]">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <p className="text-lg font-bold text-[var(--text-main)] italic">
                                Geen activiteiten gevonden.
                            </p>
                        </div>
                    ) : (
                        displayActivities.map((activity) => (
                            <EventCard 
                                key={activity.id}
                                activity={activity} 
                                href={activity.custom_url || `/activiteiten/${slugify(activity.titel || '')}`} 
                            />
                        ))
                    )}
                </div>

                {hasActivities && (
                    <div className="mt-8 flex justify-center">
                        <Link 
                            href="/activiteiten"
                            className="group relative inline-flex items-center gap-4 px-8 py-4 bg-[var(--bg-card)] hover:bg-[var(--color-purple-500)]/10 dark:hover:bg-white/10 text-[var(--text-main)] text-xs font-bold squircle border border-[var(--border-color)]/20 shadow-lg transition-all hover:scale-105 active:scale-95 backdrop-blur-sm overflow-hidden"
                        >
                            <div className="relative z-10">Alle activiteiten</div>
                            <div className="relative z-10 h-6 w-6 rounded-full bg-[var(--color-purple-500)] flex items-center justify-center text-white group-hover:bg-[var(--color-purple-600)] transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
