'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Anchor, AspectRatio, Badge, Box, Card, Center, Divider, Group, Stack, Text, Title } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';
import { isProductSoldOut } from '@/shared/lib/utils/webshop-stock';

interface WebshopProductCardProps {
    product: WebshopCatalogProduct;
}

export default function WebshopProductCard({ product }: WebshopProductCardProps) {
    const [isHovering, setIsHovering] = useState(false);
    const cover = product.media.length > 0 ? product.media[0] : null;
    const video = product.media.find(m => m.asset_type?.startsWith('video/')) ?? null;
    const price = Number(product.price).toFixed(2);
    const isSoldOut = isProductSoldOut(product);

    const showVideo = isHovering && video !== null;

    return (
        <Anchor
            component={Link}
            href={`/merch/${product.slug}`}
            underline="never"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            h="100%"
        >
            <Card padding={0} withBorder shadow="sm" h="100%" style={{ overflow: 'hidden' }}>
                <Box pos="relative">
                    <AspectRatio
                        ratio={1}
                        style={{ backgroundColor: 'var(--surface-subtle)' }}
                    >
                        {showVideo ? (
                            <MediaAsset
                                asset={{ id: video.asset, type: video.asset_type }}
                                alt={`${product.name} - video preview`}
                                fill
                                objectFit="cover"
                            />
                        ) : cover ? (
                            <MediaAsset
                                asset={{ id: cover.asset, type: cover.asset_type }}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                                objectFit="cover"
                            />
                        ) : (
                            <Center h="100%">
                                <Text span c="brand" opacity={0.3} lh={1}>
                                    <ShoppingBag size={48} />
                                </Text>
                            </Center>
                        )}
                    </AspectRatio>
                    <Badge
                        pos="absolute"
                        top={16}
                        right={16}
                        size="sm"
                        style={{ zIndex: 10 }}
                    >
                        {product.type === 'clothing' ? 'Kleding' : 'Item'}
                    </Badge>
                    {isSoldOut && (
                        <Badge
                            pos="absolute"
                            top={16}
                            left={16}
                            color="darkBase"
                            size="sm"
                            style={{ zIndex: 10 }}
                        >
                            Uitverkocht
                        </Badge>
                    )}
                </Box>

                <Stack justify="space-between" gap="sm" p="lg" style={{ flex: 1 }}>
                    <Title order={3} size="h4" c="brand" lineClamp={2}>
                        {product.name}
                    </Title>
                    <Stack gap="xs">
                        <Divider />
                        <Group justify="space-between" align="flex-end">
                            <Stack gap={0}>
                                <Text size="xs" fw={700} tt="uppercase" c="dimmed">Prijs</Text>
                                <Text size="lg" fw={700} c="brand">€{price}</Text>
                            </Stack>
                            <Text size="xs" fw={700} tt="uppercase" c="brand">
                                Bekijk &rarr;
                            </Text>
                        </Group>
                    </Stack>
                </Stack>
            </Card>
        </Anchor>
    );
}
