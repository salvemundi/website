import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Sponsor } from '@salvemundi/validations/schema/home.zod';
import { getImageUrl } from '@/lib/utils/image-utils';

import { BRAND_CONFIG } from '@/lib/config/brand';

interface SponsorsSectionProps {
    sponsors?: Sponsor[];
}

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
    sponsors = []
}) => {
    const hasSponsors = sponsors.length > 0;
    const scrollDuration = Math.max(2, sponsors.length * 0.8);

    return (
        <section className="py-6 sm:py-8 overflow-hidden" style={{ '--scroll-duration': `${scrollDuration}s` } as React.CSSProperties}>
            <div className="mx-auto max-w-app px-6">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl font-black text-gradient sm:text-3xl">
                        Onze sponsors
                    </h2>
                </div>

                {!hasSponsors ? (
                    <div className="w-full min-h-[120px] flex items-center justify-center">
                        <p className="text-center text-sm text-(--text-muted) italic">Binnenkort meer informatie.</p>
                    </div>
                ) : (
                    <div className="sponsors-scroll-container">
                        <div className="sponsors-scroll-track">
                            {[1, 2, 3, 4].map((set) => (
                                <div key={set} className="sponsors-set" aria-hidden={set > 1}>
                                    {sponsors.map((sponsor, index) => {
                                        const key = `${sponsor.sponsor_id}-${set}-${index}`;
                                        const hasSponsorImage = !!sponsor.image;
                                        const src = hasSponsorImage
                                            ? getImageUrl(sponsor.image, { width: 400, height: 200, fit: 'inside' })
                                            : null;
                                        const itemClasses = `sponsor-item ${sponsor.dark_bg ? 'sponsor-dark-bg' : ''}`;

                                        const imageContent = src ? (
                                            <Image
                                                src={src}
                                                alt="Sponsor Logo"
                                                height={80}
                                                width={160}
                                                quality={90}
                                                className="sponsor-logo"
                                                priority={true}
                                            />
                                        ) : (
                                            <>
                                                <Image
                                                    src={BRAND_CONFIG.logoFallbackLight}
                                                    alt="Sponsor Logo"
                                                    height={80}
                                                    width={160}
                                                    quality={90}
                                                    className="sponsor-logo dark:hidden"
                                                    priority={true}
                                                />
                                                <Image
                                                    src={BRAND_CONFIG.logoFallbackDark}
                                                    alt="Sponsor Logo"
                                                    height={80}
                                                    width={160}
                                                    quality={90}
                                                    className="sponsor-logo hidden dark:block"
                                                    priority={true}
                                                />
                                            </>
                                        );

                                        if (sponsor.website_url) {
                                            return (
                                                <Link
                                                    key={key}
                                                    href={sponsor.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={itemClasses}
                                                >
                                                    {imageContent}
                                                </Link>
                                            );
                                        }

                                        return (
                                            <div key={key} className={itemClasses}>
                                                {imageContent}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
