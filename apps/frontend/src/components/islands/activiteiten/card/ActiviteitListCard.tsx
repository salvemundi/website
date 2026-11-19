'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { AspectRatio, Badge, Box, Button, Card, Center, Divider, Flex, Group, Paper, Stack, Text, Title } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';

interface ActiviteitListCardProps {
    title: string;
    image: string | { id: string; type?: string | null } | null;
    displayDate: string;
    timeRange: string | null;
    location: string | null;
    description: string;
    short_description?: string | null;
    safePrice: string;
    committeeLabel: string;
    onlyMembers: boolean;
    isPast: boolean;
    cannotSignUp: boolean;
    alreadySignedUp: boolean;
    isDeadlinePassed: boolean;
    isFull?: boolean;
    contact?: string;
    handleSignupClick: (e: React.MouseEvent) => void;
    onShowDetails?: () => void;
}

export default function ActiviteitListCard({
    title,
    image,
    displayDate,
    timeRange,
    location,
    description,
    short_description,
    safePrice,
    committeeLabel,
    onlyMembers,
    isPast,
    cannotSignUp,
    alreadySignedUp,
    isDeadlinePassed,
    isFull = false,
    contact,
    handleSignupClick,
    onShowDetails
}: ActiviteitListCardProps) {
    return (
        <Card
            onClick={onShowDetails}
            padding={0}
            radius="xl"
            withBorder
            shadow="sm"
            style={{
                cursor: 'pointer',
                overflow: 'hidden',
                opacity: isPast ? 0.75 : 1,
                filter: isPast ? 'grayscale(50%)' : undefined,
            }}
        >
            <Flex direction={{ base: 'column', md: 'row' }}>
                <Box pos="relative" w={{ base: '100%', md: 256 }} style={{ flexShrink: 0, overflow: 'hidden' }}>
                    <AspectRatio ratio={16 / 9} h={{ md: '100%' }}>
                        <Box pos="relative" w="100%" h="100%">
                            {image ? (
                                <MediaAsset
                                    asset={image}
                                    alt={title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    objectFit="contain"
                                />
                            ) : (
                                <Center h="100%">
                                    <Text span c="brand" opacity={0.3} lh={1}>
                                        <Calendar size={32} />
                                    </Text>
                                </Center>
                            )}
                        </Box>
                    </AspectRatio>
                </Box>

                <Stack justify="space-between" gap="md" p="lg" style={{ flex: 1, minWidth: 0 }}>
                    <Flex direction={{ base: 'column', lg: 'row' }} align={{ lg: 'center' }} gap={{ base: 'md', lg: 'xl' }}>
                        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                            <Group gap="xs" wrap="wrap">
                                <Badge color="brand" size="sm" radius="sm">
                                    {committeeLabel}
                                </Badge>
                                {onlyMembers && (
                                    <Badge color="accent" size="sm" radius="sm">
                                        Leden
                                    </Badge>
                                )}
                            </Group>
                            <Title order={3} size="h3" c="brand" lineClamp={2} title={title}>
                                {title}
                            </Title>
                            {short_description ? (
                                <Box visibleFrom="md">
                                    <Text size="sm" c="dimmed" lineClamp={6} component="div">
                                        <SafeMarkdown content={short_description} />
                                    </Text>
                                </Box>
                            ) : description ? (
                                <Box visibleFrom="md">
                                    <Text size="sm" c="dimmed" lineClamp={2}>
                                        {description}
                                    </Text>
                                </Box>
                            ) : null}
                            {contact && (
                                <Text size="xs" c="dimmed">
                                    <Text span fw={700}>Contact:</Text> {contact}
                                </Text>
                            )}
                        </Stack>

                        <Group gap="lg" wrap="wrap" align="center">
                            <Stack gap={2} ta={{ base: 'left', lg: 'right' }}>
                                <Text size="xs" fw={900} tt="uppercase" c="dimmed">
                                    Datum &amp; Tijd
                                </Text>
                                <Text size="sm" fw={700} c="brand" style={{ whiteSpace: 'nowrap' }}>
                                    {displayDate}
                                </Text>
                                <Text size="xs" fw={500} c="dimmed" maw={180} truncate>
                                    {timeRange ? `${timeRange} • ` : ''}{location || 'Locatie volgt'}
                                </Text>
                            </Stack>

                            <Paper p="sm" px="md" radius="md" withBorder ta="center" miw={84}>
                                <Text size="xs" fw={900} tt="uppercase" c="dimmed">
                                    Prijs
                                </Text>
                                <Text size="lg" fw={900} c="brand">
                                    €{safePrice}
                                </Text>
                            </Paper>
                        </Group>
                    </Flex>

                    <Divider />

                    <Group justify="flex-end" gap="xs" wrap="wrap">
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowDetails?.();
                            }}
                        >
                            Meer Informatie
                        </Button>

                        {!isPast && (
                            <Button
                                type="button"
                                size="sm"
                                variant={cannotSignUp ? 'light' : 'filled'}
                                color={cannotSignUp ? 'dimmed' : 'brand'}
                                onClick={handleSignupClick}
                            >
                                {alreadySignedUp ? 'Al Aangemeld' : isDeadlinePassed ? 'Aanmelding Gesloten' : isFull ? 'Activiteit Vol' : 'Aanmelden'}
                            </Button>
                        )}
                    </Group>
                </Stack>
            </Flex>
        </Card>
    );
}
