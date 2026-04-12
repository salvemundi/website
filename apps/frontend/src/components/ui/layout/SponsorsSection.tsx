import React from 'react';
import type { Sponsor } from '@salvemundi/validations/schema/home.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Skeleton } from '../Skeleton';

interface SponsorsSectionProps {
    isLoading?: boolean;
    sponsors?: Sponsor[];
}

/**
 * UI Component voor de sponsoren-sectie op de homepagina.
 * Toont een oneindige scroll van logo's of een skeleton-rij tijdens het laden.
 */
export const SponsorsSection: React.FC<SponsorsSectionProps> = ({ 
    isLoading = false, 
    sponsors = [] 
}) => {
    const hasSponsors = sponsors.length > 0;

    // Loading state: render premium skeletons that match the track's vertical centering
    if (isLoading) {
        return (
            <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden" aria-busy="true">
                <div className="mx-auto max-w-app px-6">
                    <div className="text-center mb-8 space-y-3">
                        <Skeleton className="h-4 w-32 mx-auto bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                        <Skeleton className="h-8 w-64 mx-auto bg-slate-200 dark:bg-slate-800/30" rounded="lg" />
                    </div>
                    <div className="flex justify-center gap-6 px-6 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-16 w-32 sm:w-48 shrink-0 bg-slate-200 dark:bg-slate-800/10" rounded="2xl" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // 20× dupliceren voor een naadloze oneindige CSS scroll-animatie.
    const duplicatedSponsors = Array.from({ length: 20 }, () => sponsors).flat();

    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden">
            {/* Sectie-header */}
            <div className="mx-auto max-w-app px-6">
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-purple dark:text-purple-400 mb-2">
                        Onze sponsors
                    </p>
                    <h2 className="text-2xl font-black text-theme dark:text-white sm:text-3xl">
                        Zij maken het mogelijk
                    </h2>
                </div>
            </div>

            {!hasSponsors ? (
                <div className="mx-auto max-w-app px-6">
                    <p className="text-center text-sm text-[var(--text-muted)] italic">Binnenkort meer informatie over onze sponsors.</p>
                </div>
            ) : (
                <div className="sponsors-scroll-container">
                    <div className="sponsors-scroll-track">
                        {duplicatedSponsors.map((sponsor, index) => {
                            const key = `${sponsor.sponsor_id}-${index}`;
                            const src = getImageUrl(sponsor.image) || '/img/newlogo.png';
                            const cls = `sponsor-item ${sponsor.dark_bg ? 'sponsor-dark-bg' : 'sponsor-light-bg'}`;

                            return (
                                <a
                                    key={key}
                                    href={sponsor.website_url ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cls}
                                    aria-label={`Bezoek sponsor ${sponsor.website_url ?? ''}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt={sponsor.website_url ? `Sponsor: ${sponsor.website_url}` : 'Sponsor'}
                                        className="sponsor-logo"
                                        loading="lazy"
                                    />
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

