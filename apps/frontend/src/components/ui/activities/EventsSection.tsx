import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import type { Activity } from '@salvemundi/validations/schema/activity.zod';
import { EventCard } from './EventCard';

interface EventsSectionProps {
    isLoading?: boolean;
    activities?: Activity[];
}

/**
 * UI Component voor de activiteiten-sectie op de homepagina.
 * Modernized: No manual skeleton branch. Uses .skeleton-active for Zero-Drift masking.
 */
export function EventsSection({ isLoading = false, activities = [] }: EventsSectionProps) {
    const hasActivities = activities.length > 0;

    return (
        <section id="kalender" 
            className={`py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] ${isLoading ? 'skeleton-active' : ''}`}
            aria-busy={isLoading}
        >
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 rounded-xl bg-gradient-theme px-6 sm:px-10 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pt-12 shadow-xl">
                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] sm:text-4xl md:text-5xl lg:text-6xl gradient-text">
                                Onze Activiteiten
                            </h2>
                            <p className="max-w-xl text-xs sm:text-sm font-medium text-[var(--text-muted)] leading-relaxed">
                                Van legendarische borrels tot verrijkende workshops en onvergetelijke studiereizen. Er is altijd een plek voor jou!
                            </p>
                        </div>

                        {(hasActivities || isLoading) && (
                            <Link 
                                href="/activiteiten"
                                className="group relative inline-flex items-center gap-4 px-8 py-4 bg-[var(--color-purple-600)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 overflow-hidden"
                            >
                                <div className="relative z-10">Alle activiteiten</div>
                                <div className="relative z-10 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </Link>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {isLoading ? (
                            [1, 2, 3, 4].map((i) => (
                                <EventCard key={i} isLoading={true} />
                            ))
                        ) : hasActivities ? (
                            activities.slice(0, 4).map((activity) => (
                                <EventCard 
                                    key={activity.id} 
                                    activity={activity as any} 
                                    href={`/activiteiten/${activity.id}`} 
                                />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-black/20 rounded-[2.5rem] border border-dashed border-[var(--color-purple-500)]/20">
                                <div className="h-16 w-16 mb-4 rounded-full bg-[var(--color-purple-100)] dark:bg-[var(--color-purple-900)]/30 flex items-center justify-center text-[var(--color-purple-600)] dark:text-[var(--color-purple-300)]">
                                    <Calendar className="h-8 w-8" />
                                </div>
                                <p className="text-lg font-bold text-[var(--text-main)] italic">
                                    Geen activiteiten gevonden.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
