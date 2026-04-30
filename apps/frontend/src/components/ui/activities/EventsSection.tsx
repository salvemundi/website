import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import type { Activity } from '@salvemundi/validations/schema/activity.zod';
import { EventCard } from './EventCard';

import { slugify } from '@/shared/lib/utils/slug';

interface EventsSectionProps {
    activities?: Activity[];
    count?: number;
}

/**
 * UI Component voor de activiteiten-sectie op de homepagina.
 * V7.12 Industrial SSR: Clean architecture, no loading logic.
 */
export function EventsSection({ activities = [], count = 4 }: EventsSectionProps) {
    const displayActivities = activities.slice(0, count);
    const hasActivities = displayActivities.length > 0;

    return (
        <section id="kalender" className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div 
                    className="flex flex-col gap-6 rounded-xl bg-gradient-theme px-6 sm:px-10 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pt-12 shadow-xl"
                >
                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-gradient-animated sm:text-4xl md:text-5xl lg:text-5xl">
                                Komende activiteiten
                            </h2>
                            <p className="max-w-xl text-xs sm:text-sm font-medium text-[var(--text-muted)] dark:text-white/60 leading-relaxed">
                                Van legendarische borrels tot verrijkende workshops en onvergetelijke studiereizen. Er is altijd een plek voor jou!
                            </p>
                        </div>

                        {hasActivities && (
                            <Link 
                                href="/activiteiten"
                                className="group relative inline-flex items-center gap-4 px-8 py-4 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/40 text-[var(--text-main)] dark:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[var(--border-color)]/20 shadow-lg transition-all hover:scale-105 active:scale-95 backdrop-blur-sm overflow-hidden"
                            >
                                <div className="relative z-10">Alle activiteiten</div>
                                <div className="relative z-10 h-6 w-6 rounded-full bg-[var(--color-purple-500)] flex items-center justify-center text-white group-hover:bg-[var(--color-purple-600)] transition-colors">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </Link>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {!hasActivities ? (
                            <div className="col-span-full flex flex-col items-center justify-center min-h-[320px] p-12 text-center bg-white/50 dark:bg-black/20 rounded-[2.5rem] border border-dashed border-[var(--color-purple-500)]/20 animate-in fade-in duration-500">
                                <div className="h-16 w-16 mb-4 rounded-full bg-[var(--color-purple-100)] dark:bg-[var(--color-purple-900)]/30 flex items-center justify-center text-[var(--color-purple-600)] dark:text-[var(--color-purple-300)]">
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
                                    activity={activity as any} 
                                    href={`/activiteiten/${slugify(activity.titel || '')}`} 
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
