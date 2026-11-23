'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box, Modal, SimpleGrid, UnstyledButton } from '@mantine/core';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

const IMAGES = [
    { src: '/img/Intro-2-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro-3-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro-4-2025.jpg', alt: 'Introductie Sfeer' },
    { src: '/img/Intro2025.jpg', alt: 'Introductie Sfeer' },
];

export const IntroLightboxIsland = () => {
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxSrc(null);
    };

    const openLightbox = (src: string) => {
        setLightboxSrc(src);
        setLightboxOpen(true);
    };

    return (
        <>
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm" mt="lg">
                {IMAGES.map((img, idx) => {
                    const isFailed = failedImages.has(img.src);

                    return (
                        <UnstyledButton
                            key={idx}
                            type="button"
                            onClick={() => openLightbox(img.src)}
                            style={{ width: '100%' }}
                        >
                            <Box
                                pos="relative"
                                h={128}
                                w="100%"
                                style={{
                                    borderRadius: 'var(--mantine-radius-md)',
                                    overflow: 'hidden',
                                    border: '1px solid var(--surface-subtle-border)',
                                    backgroundColor: 'var(--surface-subtle)',
                                }}
                            >
                                {isFailed ? (
                                    <Box pos="relative" w="100%" h="100%" p="lg">
                                        <FallbackLogo className="object-contain" />
                                    </Box>
                                ) : (
                                    <Image
                                        src={img.src}
                                        alt={img.alt}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        style={{ objectFit: 'cover' }}
                                        onError={() => setFailedImages(prev => new Set([...prev, img.src]))}
                                    />
                                )}
                            </Box>
                        </UnstyledButton>
                    );
                })}
            </SimpleGrid>

            <Modal
                opened={lightboxOpen && Boolean(lightboxSrc)}
                onClose={closeLightbox}
                size="xl"
                centered
                padding="xs"
                aria-label="Foto voorbeeld"
            >
                {lightboxSrc && (
                    <Box pos="relative" h="75vh" w="100%" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
                        {failedImages.has(lightboxSrc) ? (
                            <Box pos="relative" w="100%" h="100%" p={48}>
                                <FallbackLogo className="object-contain" />
                            </Box>
                        ) : (
                            <Image
                                src={lightboxSrc}
                                alt="Foto"
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        )}
                    </Box>
                )}
            </Modal>
        </>
    );
};
