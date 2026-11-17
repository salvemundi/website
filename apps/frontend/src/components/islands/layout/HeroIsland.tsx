import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { HeroBanner } from '@salvemundi/validations/schema/home.zod';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { formatDateRange } from '@/shared/lib/utils/date';
import dynamic from 'next/dynamic';
import { getActivityUrl } from '@/shared/lib/utils/activity';
import { type ExtendedSession } from '@/types/auth';
import { Card, CardContent } from '@/components/ui/card';

const HeroCarousel = dynamic(() => import('./HeroCarousel').then(mod => mod.HeroCarousel));

interface HeroIslandProps {
    banners?: HeroBanner[];
    activiteiten?: Activiteit[];
    initialSession?: ExtendedSession | null;
}

export async function HeroIsland({ banners = [], activiteiten = [], initialSession }: HeroIslandProps) {
    const isAuthenticated = !!initialSession?.user;

    const slideUrls = banners.length
        ? banners
            .sort((a, b) => a.display_order - b.display_order)
            .map((b) => getImageUrl(b.afbeelding_id, {
                width: 1200,
                height: 800,
                fit: 'cover',
                quality: 90
            }))
        : [getImageUrl(null, { width: 1200, height: 800, quality: 90 })];

    const nextEvent = (() => {
        if (!activiteiten.length) return null;
        const now = new Date();
        const upcoming = activiteiten
            .filter((a) => {
                const date = new Date(a.event_date);
                if (Number.isNaN(date.valueOf())) return false;
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                return endOfDay >= now;
            })
            .sort((a, b) => new Date(a.event_date).valueOf() - new Date(b.event_date).valueOf());
        return upcoming[0] ?? null;
    })();

    const showMembershipLink = !isAuthenticated;

    return (
        <section id="home">
            <div className="grid gap-8 md:grid-cols-[3fr_2fr] md:items-center">
                <div className="min-w-0 space-y-6">
                    <div className="space-y-4">
                        <h1>
                            <span className="block">Studievereniging</span>
                            <span className="block text-primary">Salve Mundi</span>
                        </h1>
                        <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.
                        </p>
                    </div>

                    <div>
                        {showMembershipLink ? (
                            <Link href="/lidmaatschap" className="group block">
                                <Card className="transition-transform duration-200 group-hover:-translate-y-0.5">
                                    <CardContent className="flex items-center justify-between gap-4 p-6">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-xs font-semibold tracking-wider text-primary uppercase">Word lid</p>
                                            <p className="truncate text-lg font-bold text-foreground">Sluit je aan bij Salve Mundi</p>
                                            <p className="line-clamp-2 text-sm text-muted-foreground">Ontdek alle voordelen van een lidmaatschap!</p>
                                        </div>
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <ChevronRight className="size-5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ) : nextEvent ? (
                            <Link href={getActivityUrl({ name: nextEvent.name || '', custom_url: nextEvent.custom_url })} className="group block">
                                <Card className="transition-transform duration-200 group-hover:-translate-y-0.5">
                                    <CardContent className="flex items-center justify-between gap-4 p-6">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-xs font-semibold tracking-wider text-primary uppercase">Volgende activiteit</p>
                                            <p className="truncate text-lg font-bold text-foreground">{nextEvent.name} • {formatDateRange(nextEvent.event_date, nextEvent.event_date_end)}</p>
                                            <p className="line-clamp-2 text-sm text-muted-foreground">{nextEvent.description ?? 'Kom gezellig langs!'}</p>
                                        </div>
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <ChevronRight className="size-5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ) : (
                            <Card>
                                <CardContent className="space-y-1 p-6">
                                    <p className="text-xs font-semibold tracking-wider text-primary uppercase">Volgende activiteit</p>
                                    <p className="text-lg font-bold text-foreground">Binnenkort meer activiteiten</p>
                                    <p className="text-sm text-muted-foreground">Check regelmatig onze agenda.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="relative aspect-3/2 w-full overflow-hidden rounded-2xl bg-card shadow-lg">
                    <HeroCarousel slideUrls={slideUrls} />
                </div>
            </div>
        </section>
    );
}
