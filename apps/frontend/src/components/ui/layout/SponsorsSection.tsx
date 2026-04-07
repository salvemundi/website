import React from 'react';
import type { Sponsor } from '@salvemundi/validations';
import { getImageUrl } from '@/lib/image-utils';
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
    // Skeleton-state: render een statische rij van placeholders
    if (isLoading) {
        return (
            <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden" aria-busy="true">
                <div className="mx-auto max-w-app px-6">
                    <div className="text-center mb-10">
                        <Skeleton className="h-4 w-32 mx-auto mb-2" rounded="full" />
                        <Skeleton className="h-10 w-64 mx-auto" rounded="lg" />
                    </div>
                    <div className="flex justify-center gap-8 px-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-24 w-40 shrink-0" rounded="2xl" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    const hasSponsors = sponsors.length > 0;

    // 20× dupliceren voor een naadloze oneindige CSS scroll-animatie.
    // De animatie loopt van 0% naar -25% (van 20 kopieën, 5 zijn zichtbaar tegelijk).
    const duplicatedSponsors = Array.from({ length: 20 }, () => sponsors).flat();

    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden" aria-busy={isLoading}>
            {/* Sectie-header */}
            <div className="mx-auto max-w-app px-6">
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-purple-300)] mb-2">
                        Onze sponsors
                    </p>
                    <h2 className="text-2xl font-black text-[var(--text-main)] sm:text-3xl">
                        Zij maken het mogelijk
                    </h2>
                </div>
            </div>

            {/* Scrollende sponsor-balk of lege staat of loading staat */}
            {isLoading ? (
                <div className="mx-auto max-w-app px-6">
                    <div className="flex items-center justify-center gap-8 opacity-20 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 w-32 rounded-xl bg-[var(--color-purple-100)] shrink-0" />
                        ))}
                    </div>
                </div>
            ) : !hasSponsors ? (
                <div className="mx-auto max-w-app px-6">
                    <p className="text-center text-sm text-[var(--text-muted)]">Binnenkort meer informatie over onze sponsors.</p>
                </div>
            ) : (
                <div className="sponsors-scroll-container">
                    <div className="sponsors-scroll-track">
                        {duplicatedSponsors.map((sponsor, index) => {
                            // Unieke key combineert sponsor_id én index voor deduplicatie
                            const key = `${sponsor.sponsor_id}-${index}`;

                            // Afbeelding-URL via interne Directus asset-proxy
                            const src = getImageUrl(sponsor.image) || '/img/newlogo.png';

                            // Per-sponsor achtergrondvoorkeur (dark_bg al genormaliseerd via Zod)
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

