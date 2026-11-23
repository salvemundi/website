'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { AspectRatio, Box, Center, Modal, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { type WebshopProductMedia } from '@salvemundi/validations/schema/webshop.zod';

interface WebshopGalleryIslandProps {
    media: WebshopProductMedia[];
    productName: string;
}

export default function WebshopGalleryIsland({ media, productName }: WebshopGalleryIslandProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (media.length === 0) {
        return (
            <AspectRatio ratio={1} pos="relative">
                <Center
                    w="100%"
                    h="100%"
                    style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        backgroundColor: 'var(--surface-subtle)',
                    }}
                >
                    <Text span c="brand" opacity={0.3} lh={1}>
                        <ImageOff size={48} />
                    </Text>
                </Center>
            </AspectRatio>
        );
    }

    const active = media.at(activeIndex) ?? media[0];

    return (
        <Stack gap="sm">
            <UnstyledButton
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={`${productName} - vergroot media ${activeIndex + 1}`}
                w="100%"
                style={{ cursor: 'zoom-in' }}
            >
                <AspectRatio
                    ratio={1}
                    pos="relative"
                    style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        overflow: 'hidden',
                        backgroundColor: 'var(--surface-subtle)',
                    }}
                >
                    <Box pos="relative" w="100%" h="100%">
                        <MediaAsset
                            asset={{ id: active.asset, type: active.asset_type }}
                            alt={`${productName} - foto ${activeIndex + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            objectFit="cover"
                            priority
                        />
                    </Box>
                </AspectRatio>
            </UnstyledButton>

            {media.length > 1 && (
                <SimpleGrid cols={5} spacing="xs">
                    {media.map((item, idx) => (
                        <UnstyledButton
                            key={item.id}
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            aria-label={`Bekijk media ${idx + 1}`}
                            aria-current={idx === activeIndex}
                            w="100%"
                        >
                            <AspectRatio
                                ratio={1}
                                pos="relative"
                                style={{
                                    borderRadius: 'var(--mantine-radius-md)',
                                    overflow: 'hidden',
                                    border: idx === activeIndex
                                        ? '2px solid var(--mantine-color-brand-filled)'
                                        : '2px solid transparent',
                                }}
                            >
                                <Box pos="relative" w="100%" h="100%">
                                    <MediaAsset
                                        asset={{ id: item.asset, type: item.asset_type }}
                                        alt={`${productName} - miniatuur ${idx + 1}`}
                                        fill
                                        sizes="20vw"
                                        objectFit="cover"
                                    />
                                </Box>
                            </AspectRatio>
                        </UnstyledButton>
                    ))}
                </SimpleGrid>
            )}

            <Modal
                opened={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                size="xl"
                centered
                padding="xs"
                aria-label={`${productName} - vergrote weergave`}
            >
                <Box pos="relative" h="75vh" w="100%" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
                    <MediaAsset
                        asset={{ id: active.asset, type: active.asset_type }}
                        alt={`${productName} - vergrote foto ${activeIndex + 1}`}
                        fill
                        objectFit="contain"
                    />
                </Box>
            </Modal>
        </Stack>
    );
}
