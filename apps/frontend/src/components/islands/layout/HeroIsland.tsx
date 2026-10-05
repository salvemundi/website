import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { HeroBanner } from '@salvemundi/validations/schema/home.zod';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { formatDateRange } from '@/shared/lib/utils/date';
import dynamic from 'next/dynamic';

const HeroCarousel = dynamic(() => import('./HeroCarousel').then(mod => mod.HeroCarousel));

import { getActivityUrl } from '@/shared/lib/utils/activity';
import { type ExtendedSession } from '@/types/auth';

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
        <section
            id="home"
            className="relative w-full justify-self-center overflow-hidden pt-fluid-xl pb-fluid-lg"
        >
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="relative w-full px-0">
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-[3fr_2fr] md:items-center md:gap-6 lg:gap-10 xl:gap-12">
                        <div className="@container min-w-0 space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                <h1 className="text-gradient-animated pb-1 text-[clamp(1.75rem,8.2cqw,4.5rem)] leading-tight font-black">
                                    <span className="block w-full">Studievereniging</span>
                                    <span className="block w-full">Salve Mundi</span>
                                </h1>
                                <p className="text-xs leading-relaxed text-(--text-muted) sm:text-sm md:text-lg lg:max-w-xl">
                                    Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.
                                </p>
                            </div>

                            <div className="w-full max-w-full">
                                <div className="flex h-auto min-h-29 flex-wrap gap-3 sm:gap-4">
                                    {showMembershipLink ? (
                                        <Link href="/lidmaatschap" className="block w-full">
                                            <div className="flex size-full max-w-full card-interactive items-center justify-between gap-3 p-4 sm:p-6">
                                                <div className="min-w-0 flex-1 overflow-hidden">
                                                    <p className="text-xs font-semibold tracking-wider text-theme-purple uppercase">Word lid</p>
                                                    <p className="mt-1 truncate text-base font-bold text-(--text-main) sm:text-lg">Sluit je aan bij Salve Mundi</p>
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-(--text-muted)">Ontdek alle voordelen van een lidmaatschap!</p>
                                                </div>
                                                <div className="icon-box size-10 shrink-0 sm:size-12">
                                                    <ChevronRight className="size-5" />
                                                </div>
                                            </div>
                                        </Link>
                                    ) : nextEvent ? (
                                        <Link href={getActivityUrl({ name: nextEvent.name || '', custom_url: nextEvent.custom_url })} className="block w-full">
                                            <div className="flex size-full card-interactive items-center justify-between gap-4 p-4 sm:p-6">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold tracking-wider text-theme-purple uppercase">Volgende activiteit</p>
                                                    <p className="mt-1 truncate text-base font-bold text-(--text-main) sm:text-lg">{nextEvent.name} • {formatDateRange(nextEvent.event_date, nextEvent.event_date_end)}</p>
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-(--text-muted)">{nextEvent.description ?? 'Kom gezellig langs!'}</p>
                                                </div>
                                                <div className="icon-box size-10 shrink-0 sm:size-12">
                                                    <ChevronRight className="size-5" />
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="size-full card-base p-4 sm:p-6">
                                            <p className="text-xs font-semibold tracking-wider text-theme-purple uppercase">Volgende activiteit</p>
                                            <p className="mt-1 text-base font-bold text-(--text-main) sm:text-lg">Binnenkort meer activiteiten</p>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-(--text-muted)">Check regelmatig onze agenda.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Rechts: Swiper afbeeldingsgalerij ───────────────────── */}
                        <div className="flex min-w-0 flex-wrap gap-3 sm:gap-4">
                            <div className="relative aspect-3/2 w-full overflow-hidden rounded-2xl bg-(--bg-card)/80 shadow-2xl backdrop-blur-xl sm:rounded-3xl">
                                <HeroCarousel slideUrls={slideUrls} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
