import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Center, Text, Title } from '@mantine/core';
import type { Sponsor } from '@salvemundi/validations/schema/home.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface SponsorsSectionProps {
    sponsors?: Sponsor[];
}

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
    sponsors = [],
}) => {
    const hasSponsors = sponsors.length > 0;
    const scrollDuration = Math.max(2, sponsors.length * 0.8 * 2.5);

    return (
        <Box component="section" py="xl" style={{ '--scroll-duration': `${scrollDuration}s` } as React.CSSProperties}>
            <Title order={2} ta="center" mb="xl" fz={{ base: '2rem', md: '3rem' }}>
                Onze sponsoren
            </Title>

            {!hasSponsors ? (
                <Center mih={120} w="100%">
                    <Text size="sm" c="dimmed" fs="italic" ta="center">
                        Binnenkort meer informatie.
                    </Text>
                </Center>
            ) : (
                <Box mod={{ 'sponsors-scroll-container': true }}>
                    <Box mod={{ 'sponsors-scroll-track': true }}>
                        {[1, 2, 3, 4].map((set) => (
                            <Box key={set} mod={{ 'sponsors-set': true }} aria-hidden={set > 1}>
                                {sponsors.map((sponsor, index) => {
                                    const key = `${sponsor.sponsor_id}-${set}-${index}`;
                                    const hasSponsorImage = !!sponsor.image;
                                    const src = hasSponsorImage
                                        ? getImageUrl(sponsor.image, { width: 400, height: 200, fit: 'inside' })
                                        : null;

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
                                        <FallbackLogo
                                            alt="Sponsor Logo"
                                            height={80}
                                            width={160}
                                            className="sponsor-logo"
                                            priority
                                        />
                                    );

                                    if (sponsor.website_url) {
                                        return (
                                            <Link
                                                key={key}
                                                href={sponsor.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                data-sponsor-item=""
                                                data-sponsor-dark-bg={sponsor.dark_bg ? '' : undefined}
                                            >
                                                {imageContent}
                                            </Link>
                                        );
                                    }

                                    return (
                                        <Box
                                            key={key}
                                            mod={{
                                                'sponsor-item': true,
                                                ...(sponsor.dark_bg ? { 'sponsor-dark-bg': true } : {}),
                                            }}
                                        >
                                            {imageContent}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
