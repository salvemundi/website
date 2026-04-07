import React from 'react';
import Link from 'next/link';
import type { Activity } from '@salvemundi/validations';
import { EventCard } from './EventCard';
import { Skeleton } from '../Skeleton';

interface EventsSectionProps {
    isLoading?: boolean;
    activities?: Activity[];
}

/**
 * UI Component voor de evenementen-sectie op de homepagina.
 * Beheert de grid van EventCards en hun loading states.
 */
export function EventsSection({ isLoading = false, activities = [] }: EventsSectionProps) {
    if (isLoading) {
        return (
            <section id="kalender" className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]" aria-busy="true">
                <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 rounded-xl bg-gradient-theme px-6 sm:px-10 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pt-12 shadow-xl">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-24" rounded="full" />
                                <Skeleton className="h-10 w-64" rounded="lg" />
                                <Skeleton className="h-4 w-48" rounded="full" />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <EventCard key={i} isLoading />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const hasActivities = activities.length > 0;

    return (
        <section id="kalender" className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 rounded-xl bg-gradient-theme px-6 sm:px-10 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pt-12 shadow-xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-purple-600)] dark:text-[var(--color-purple-200)] bg-[var(--bg-main)]/50 dark:bg-black/20 w-fit px-4 py-1.5 rounded-full border border-[var(--color-purple-500)]/10 backdrop-blur-sm">
                                Binnenkort
                            </span>
                            <h2 className="text-3xl font-black tracking-tight text-[var(--color-purple-800)] dark:text-white sm:text-4xl md:text-5xl">
                                Onze Activiteiten
                            </h2>
                            <p className="max-w-xl text-sm font-medium text-[var(--color-purple-700)] dark:text-[var(--color-purple-100)] opacity-80">
                                Van borrels tot workshops en van studiereizen tot sportevenementen. Er is altijd iets te doen! Mis niets en houd onze kalender in de gaten.
                            </p>
                        </div>

                        {hasActivities && (
                            <Link 
                                href="/activiteiten"
                                className="group flex w-fit items-center gap-3 rounded-full bg-[var(--bg-main)]/90 dark:bg-black/40 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[var(--color-purple-600)] dark:text-[var(--color-purple-200)] shadow-lg transition hover:scale-105 hover:bg-white dark:hover:bg-black border border-[var(--color-purple-500)]/20"
                            >
                                Alle activiteiten bekijken
                                <div className="h-2 w-2 rounded-full bg-[var(--color-purple-500)] transition group-hover:scale-150" />
                            </Link>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {hasActivities ? (
                            activities.slice(0, 4).map((activity) => (
                                <EventCard 
                                    key={activity.id} 
                                    activity={activity} 
                                    href={`/activiteiten/${activity.id}`} 
                                />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-black/20 rounded-[2.5rem] border border-dashed border-[var(--color-purple-500)]/20">
                                <div className="h-16 w-16 mb-4 rounded-full bg-[var(--color-purple-100)] dark:bg-[var(--color-purple-900)]/30 flex items-center justify-center text-[var(--color-purple-600)] dark:text-[var(--color-purple-300)]">
                                    <Calendar className="h-8 w-8" />
                                </div>
                                <p className="text-lg font-bold text-[var(--text-main)] italic">
                                    Geen activiteiten gevonden voor de komende periode.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

import { Calendar } from 'lucide-react';
