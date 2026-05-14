import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Sponsor } from '@salvemundi/validations/schema/home.zod';
import { getImageUrl } from '@/lib/utils/image-utils';

interface SponsorsSectionProps {
    sponsors?: Sponsor[];
}

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
    sponsors = []
}) => {
    const hasSponsors = sponsors.length > 0;
    const scrollDuration = Math.max(2, sponsors.length * 0.8);

    return (
        <section className="py-12 overflow-hidden" style={{ '--scroll-duration': `${scrollDuration}s` } as React.CSSProperties}>
            <div className="mx-auto max-w-app px-6">
                <div className="text-center mb-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-purple-700)] dark:text-[var(--color-purple-300)] mb-2">
                        Onze sponsors
                    </p>
                    <h2 className="text-2xl font-black text-[var(--text-main)] sm:text-3xl">
                        Zij maken het mogelijk
                    </h2>
                </div>

                {!hasSponsors ? (
                    <div className="w-full min-h-[120px] flex items-center justify-center">
                        <p className="text-center text-sm text-[var(--text-muted)] italic">Binnenkort meer informatie.</p>
                    </div>
                ) : (
                    <div className="sponsors-scroll-container">
                        <div className="sponsors-scroll-track">
                            {[1, 2, 3, 4].map((set) => (
                                <div key={set} className="sponsors-set" aria-hidden={set > 1}>
                                    {sponsors.map((sponsor, index) => {
                                        const key = `${sponsor.sponsor_id}-${set}-${index}`;
                                        const src = getImageUrl(sponsor.image, { width: 400, height: 200, fit: 'inside' }) || '/img/newlogo.png';
                                        const itemClasses = `sponsor-item ${sponsor.dark_bg ? 'sponsor-light-bg' : ''}`;

                                        const imageContent = (
                                            <Image
                                                src={src}
                                                alt="Sponsor Logo"
                                                height={80}
                                                width={160}
                                                quality={90}
                                                className="sponsor-logo"
                                                priority={true}
                                            />
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
