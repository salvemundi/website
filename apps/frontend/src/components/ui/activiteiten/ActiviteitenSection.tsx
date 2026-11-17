import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { ActiviteitCard } from './ActiviteitCard';
import { getActivityUrl } from '@/shared/lib/utils/activity';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
        <section id="kalender">
            <div className="mb-8 text-center">
                <h2>Aankomende activiteiten</h2>
                <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                    Van legendarische borrels tot verrijkende workshops en onvergetelijke studiereizen. Er is altijd een plek voor jou!
                </p>
            </div>

            <div className={`grid gap-6 ${gridLayoutClass}`}>
                {!hasActivities ? (
                    <Card className="col-span-full flex min-h-80 flex-col items-center justify-center p-12 text-center">
                        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <Calendar className="size-8" />
                        </div>
                        <p className="text-lg font-bold text-foreground italic">
                            Geen activiteiten gevonden.
                        </p>
                    </Card>
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
                    <Button asChild size="lg">
                        <Link href="/activiteiten">
                            Alle activiteiten
                            <ChevronRight />
                        </Link>
                    </Button>
                </div>
            )}
        </section>
    );
}
