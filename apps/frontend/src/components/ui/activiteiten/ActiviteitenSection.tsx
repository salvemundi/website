import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { ActiviteitCard } from './ActiviteitCard';

import { getActivityUrl } from '@/shared/lib/utils/activity';

interface ActiviteitenSectionProps {
    activities?: Activiteit[];
    count?: number;
}

export function ActiviteitenSection({ activities = [], count = 4 }: ActiviteitenSectionProps) {
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
        <section id="kalender" className="p-6 sm:py-8">
            <div className="mx-auto max-w-app">
                <div className="mb-6 text-center sm:mb-10">
                    <h2 className="text-gradient text-3xl font-black sm:text-4xl md:text-5xl">
                        Aankomende activiteiten
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed font-medium text-(--text-muted) sm:text-sm dark:text-white/60">
                        Van legendarische borrels tot verrijkende workshops en onvergetelijke studiereizen. Er is altijd een plek voor jou!
                    </p>
                </div>

                <div className={`grid gap-4 ${gridLayoutClass}`}>
                    {!hasActivities ? (
                        <div className="col-span-full flex min-h-80 flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-theme-purple/20 bg-white/50 p-12 text-center dark:bg-black/20">
                            <div className="mb-4 icon-box size-16 rounded-full">
                                <Calendar className="size-8" />
                            </div>
                            <p className="text-lg font-bold text-(--text-main) italic">
                                Geen activiteiten gevonden.
                            </p>
                        </div>
                    ) : (
                        displayActivities.map((activity) => (
                            <ActiviteitCard 
                                key={activity.id}
                                activity={activity} 
                                href={getActivityUrl({ name: activity.name || '', custom_url: activity.custom_url })} 
                            />
                        ))
                    )}
                </div>

                {hasActivities && (
                    <div className="mt-8 flex justify-center">
                        <Link 
                            href="/activiteiten"
                            className="group relative beheer-button-secondary overflow-hidden squircle text-(--text-main) backdrop-blur-sm"
                        >
                            <div className="relative z-10">Alle activiteiten</div>
                            <div className="relative z-10 flex size-6 items-center justify-center rounded-full bg-theme-purple text-wit-paars transition-colors group-hover:opacity-90">
                                <ChevronRight className="size-4" />
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
