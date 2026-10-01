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
            <div className="max-w-app mx-auto">
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
                        <div className="col-span-full flex min-h-80 flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-purple-500/20 bg-white/50 p-12 text-center dark:bg-black/20">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-transparent dark:text-purple-300">
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
                            className="group squircle relative inline-flex items-center gap-4 overflow-hidden border border-(--border-color)/20 bg-(--bg-card) px-8 py-4 text-xs font-bold text-(--text-main) shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-purple-500/10 active:scale-95 dark:hover:bg-white/10"
                        >
                            <div className="relative z-10">Alle activiteiten</div>
                            <div className="relative z-10 flex size-6 items-center justify-center rounded-full bg-purple-500 text-white transition-colors group-hover:bg-purple-600">
                                <ChevronRight className="size-4" />
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
