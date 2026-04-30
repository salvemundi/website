import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { HeroBanner } from '@salvemundi/validations/schema/home.zod';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { formatDate } from '@/shared/lib/utils/date';
import { HeroCarousel } from './HeroCarousel';

interface HeroIslandProps {
    banners?: HeroBanner[];
    activiteiten?: Activiteit[];
    initialSession?: any;
}

/**
 * Server Component — Belangrijkste visuele sectie van de homepage.
 * V7.12 RSC: Now fully server-side for faster initial paint and lower JS bundle.
 */
export async function HeroIsland({ banners = [], activiteiten = [], initialSession }: HeroIslandProps) {
    const isAuthenticated = !!initialSession?.user;

    const slideUrls = banners.length 
        ? banners
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((b) => getImageUrl(b.afbeelding_id, { width: 1200, height: 800, fit: 'cover' }))
        : [getImageUrl(null)];

    const nextEvent = (() => {
        if (!activiteiten.length) return null;
        const now = new Date();
        const upcoming = activiteiten
            .filter((a) => {
                const date = new Date(a.datum_start);
                if (Number.isNaN(date.valueOf())) return false;
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                return endOfDay >= now;
            })
            .sort((a, b) => new Date(a.datum_start).valueOf() - new Date(b.datum_start).valueOf());
        return upcoming[0] ?? null;
    })();

    const showMembershipLink = !isAuthenticated;

    return (
        <section
            id="home"
            className="relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full h-[480px] sm:h-[520px] md:h-[580px] lg:h-[640px] py-4 sm:py-8 lg:py-12 transition-colors duration-300"
        >
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="relative w-full px-0">
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20 md:items-center">

                        {/* ── Links: tekst + dynamische kaart ─────────────────────── */}
                        <div className="space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                <h1 className="text-gradient-animated text-2xl font-black leading-tight sm:text-3xl md:text-5xl lg:text-6xl pb-1 font-[950]">
                                    <span>Studievereniging</span>
                                    <br />
                                    <span className="inline-block w-full">Salve Mundi</span>
                                </h1>
                                <p className="text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm md:text-lg lg:max-w-xl">
                                    Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.
                                </p>
                            </div>

                            <div className="w-full max-w-full">
                                <div className="flex flex-wrap gap-3 sm:gap-4 h-[116px]">
                                    {showMembershipLink ? (
                                         <Link href="/lidmaatschap" className="block w-full transition-transform hover:scale-[1.02] group/lid">
                                             <div className="w-full max-w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur cursor-pointer flex items-center justify-between gap-3 sm:gap-4 h-full">
                                                 <div className="flex-1 min-w-0 overflow-hidden">
                                                     <p className="text-[0.6rem] sm:text-xs font-semibold uppercase tracking-wide text-[var(--color-purple-300)]/60 dark:text-white/60">Word lid</p>
                                                     <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg font-bold text-[var(--color-purple-300)] dark:text-white truncate">Sluit je aan bij Salve Mundi</p>
                                                     <p className="mt-0.5 sm:mt-1 text-[0.7rem] sm:text-xs md:text-sm text-[var(--text-muted)] line-clamp-2">Ontdek alle voordelen van een lidmaatschap!</p>
                                                 </div>
                                                 <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[var(--color-purple-300)]/10 dark:bg-white/10 text-[var(--color-purple-300)] dark:text-white flex items-center justify-center shadow-md group-hover/lid:bg-gradient-theme group-hover/lid:text-[var(--text-main)]">
                                                     <ChevronRight className="h-5 w-5" />
                                                 </div>
                                             </div>
                                         </Link>
                                     ) : nextEvent ? (
                                         <Link href={`/activiteiten/${nextEvent.id}`} className="block w-full transition-transform hover:scale-[1.02] group/event">
                                             <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 sm:p-6 shadow-lg backdrop-blur cursor-pointer flex items-center justify-between gap-4 h-full">
                                                 <div className="flex-1 min-w-0">
                                                     <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-purple-300)]/60 dark:text-white/60">Volgende activiteit</p>
                                                     <p className="mt-2 text-base sm:text-lg font-bold text-[var(--color-purple-300)] dark:text-white truncate">{nextEvent.titel} • {formatDate(nextEvent.datum_start)}</p>
                                                     <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2">{nextEvent.beschrijving ?? 'Kom gezellig langs!'}</p>
                                                 </div>
                                                 <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[var(--color-purple-300)]/10 dark:bg-white/10 text-[var(--color-purple-300)] dark:text-white flex items-center justify-center shadow-md group-hover/event:bg-gradient-theme group-hover/event:text-[var(--text-main)]">
                                                     <ChevronRight className="h-5 w-5" />
                                                 </div>
                                             </div>
                                         </Link>
                                     ) : (
                                         <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 sm:p-6 shadow-lg backdrop-blur h-full">
                                             <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-purple-300)]/60 dark:text-white/60">Volgende activiteit</p>
                                             <p className="mt-2 text-base sm:text-lg font-bold text-[var(--color-purple-300)] dark:text-white">Binnenkort meer activiteiten</p>
                                             <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2">Check regelmatig onze agenda.</p>
                                         </div>
                                     )}
                                </div>
                            </div>
                        </div>

                        {/* ── Rechts: Swiper afbeeldingsgalerij ───────────────────── */}
                        <div className="flex flex-wrap gap-3 sm:gap-4 min-w-0">
                            <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/80 shadow-2xl backdrop-blur-xl overflow-hidden aspect-video md:aspect-auto md:h-[350px] lg:h-[480px] xl:h-[540px]">
                                <HeroCarousel slideUrls={slideUrls} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
