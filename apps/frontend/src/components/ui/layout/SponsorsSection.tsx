import React from 'react';
import type { Sponsor } from '@salvemundi/validations/schema/home.zod';
import { getImageUrl } from '@/lib/utils/image-utils';

interface SponsorsSectionProps {
    isLoading?: boolean;
    sponsors?: Sponsor[];
}

/**
 * UI Component voor de sponsoren-sectie op de homepagina.
 * Modernized: No manual skeleton branch. Uses .skeleton-active for Zero-Drift masking.
 */
export const SponsorsSection: React.FC<SponsorsSectionProps> = ({ 
    isLoading = false, 
    sponsors = [] 
}) => {
    const hasSponsors = sponsors.length > 0;

    // 20× dupliceren voor een naadloze oneindige CSS scroll-animatie.
    const displaySponsors = isLoading && !hasSponsors 
        ? Array(8).fill({ sponsor_id: 'loading', image: '', website_url: '' }) 
        : Array.from({ length: 20 }, () => sponsors).flat();

    return (
        <section className={`py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden ${isLoading ? 'skeleton-active' : ''}`} aria-busy={isLoading}>
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

            {!hasSponsors && !isLoading ? (
                <div className="mx-auto max-w-app px-6">
                    <p className="text-center text-sm text-[var(--text-muted)] italic">Binnenkort meer informatie.</p>
                </div>
            ) : (
                <div className="sponsors-scroll-container">
                    <div className="sponsors-scroll-track">
                        {displaySponsors.map((sponsor, index) => {
                            const key = `${sponsor.sponsor_id}-${index}`;
                            const src = getImageUrl(sponsor.image) || '/img/newlogo.png';
                            
                            return (
                                <div
                                    key={key}
                                    className={`sponsor-item ${sponsor.dark_bg ? 'sponsor-dark-bg' : 'sponsor-light-bg'} ${isLoading ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt="Sponsor"
                                        className="sponsor-logo"
                                        loading="lazy"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
