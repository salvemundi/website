import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Sponsor } from '@salvemundi/validations/schema/home.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { cn } from '@/lib/utils/cn';

interface SponsorsSectionProps {
    sponsors?: Sponsor[];
}

/**
 * UI Component voor de sponsoren-sectie op de homepagina.
 * V7.13 Nuclear SSR: Restored interactivity and premium styling.
 */
export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
    sponsors = []
}) => {
    const hasSponsors = sponsors.length > 0;

    // 20× dupliceren voor een naadloze oneindige CSS scroll-animatie.
    const displaySponsors = Array.from({ length: 20 }, () => sponsors).flat();

    return (
        <section className="py-12 bg-white/50 dark:bg-black/20 overflow-hidden">
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
                    <div className="relative overflow-visible min-h-[120px] h-32 flex items-center rounded-3xl">
                        <div className="sponsors-scroll-track flex items-center gap-16 whitespace-nowrap px-8">
                            {displaySponsors.map((sponsor, index) => {
                                const key = `${sponsor.sponsor_id}-${index}`;
                                const src = getImageUrl(sponsor.image) || '/img/newlogo.png';

                                const content = (
                                    <div
                                        className={cn(
                                            "sponsor-item flex-shrink-0 transition-all duration-300",
                                            sponsor.dark_bg && "sponsor-dark-bg"
                                        )}
                                    >
                                        <Image
                                            src={src}
                                            alt="Sponsor Logo"
                                            height={80}
                                            width={160}
                                            className="sponsor-logo h-20 w-auto object-contain"
                                            unoptimized
                                        />
                                    </div>
                                );

                                if (sponsor.website_url) {
                                    return (
                                        <Link
                                            key={key}
                                            href={sponsor.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            {content}
                                        </Link>
                                    );
                                }

                                return <React.Fragment key={key}>{content}</React.Fragment>;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
