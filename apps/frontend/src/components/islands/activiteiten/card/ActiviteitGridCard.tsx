'use client';

import React from 'react';
import { Calendar, Check, Info, UserPlus } from 'lucide-react';
import { ActionIcon, AspectRatio, Badge, Box, Card, Center, Divider, Group, Stack, Text, Title } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';

interface ActiviteitGridCardProps {
    title: string;
    image: string | { id: string; type?: string | null } | null;
    displayDate: string;
    timeRange: string | null;
    description: string;
    short_description?: string | null;
    safePrice: string;
    committeeLabel: string;
    onlyMembers: boolean;
    isPast: boolean;
    cannotSignUp: boolean;
    alreadySignedUp: boolean;
    isDeadlinePassed?: boolean;
    isFull?: boolean;
    handleSignupClick: (e: React.MouseEvent) => void;
    onShowDetails?: () => void;
}

export default function ActiviteitGridCard({
    title,
    image,
    displayDate,
    timeRange,
    description,
    short_description,
    safePrice,
    committeeLabel,
    onlyMembers,
    isPast,
    cannotSignUp,
    alreadySignedUp,
    isDeadlinePassed = false,
    isFull = false,
    handleSignupClick,
    onShowDetails
}: ActiviteitGridCardProps) {
    return (
        <Card
            onClick={onShowDetails}
            padding={0}
            withBorder
            shadow="sm"
            h="100%"
            style={{
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                opacity: isPast ? 0.75 : 1,
                filter: isPast ? 'grayscale(50%)' : undefined,
            }}
        >
            <Box pos="relative">
                <AspectRatio ratio={16 / 9}>
                    <Box pos="relative" w="100%" h="100%">
                        {image ? (
                            <MediaAsset
                                asset={image}
                                alt={title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                objectFit="contain"
                            />
                        ) : (
                            <Center h="100%">
                                <Text span c="brand" opacity={0.3} lh={1}>
                                    <Calendar size={48} />
                                </Text>
                            </Center>
                        )}
                    </Box>
                </AspectRatio>
                <Stack pos="absolute" top={16} right={16} align="flex-end" gap="xs" style={{ zIndex: 20 }}>
                    <Badge size="sm">
                        {committeeLabel}
                    </Badge>
                    {onlyMembers && (
                        <Badge color="accent" size="sm">
                            Leden Alleen
                        </Badge>
                    )}
                </Stack>
            </Box>

            <Stack justify="space-between" gap="sm" p="lg" style={{ flex: 1 }}>
                <Stack gap="sm">
                    <Title order={3} size="h3" c="brand" lineClamp={2}>
                        {title}
                    </Title>

                    <Stack gap={2}>
                        <Group gap="xs" c="brand">
                            <Calendar size={16} />
                            <Text size="sm" fw={700}>{displayDate}</Text>
                        </Group>
                        {timeRange && (
                            <Text size="sm" fw={500} c="dimmed" ml={24}>
                                {timeRange}
                            </Text>
                        )}
                    </Stack>

                    {short_description ? (
                        <Text size="sm" c="dimmed" lineClamp={5}>
                            <SafeMarkdown content={short_description} />
                        </Text>
                    ) : description ? (
                        <Text size="sm" c="dimmed" lineClamp={3}>
                            {description}
                        </Text>
                    ) : null}
                </Stack>

                <Stack gap="sm" mt="auto">
                    <Divider />
                    <Group justify="space-between" align="center">
                        <Stack gap={0}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Prijs</Text>
                            <Text size="lg" fw={700} c="brand">€{safePrice}</Text>
                        </Stack>

                        <Group gap="xs">
                            {!isPast && (
                                <ActionIcon
                                    type="button"
                                    onClick={handleSignupClick}
                                    variant={cannotSignUp ? 'light' : 'filled'}
                                    color={cannotSignUp ? 'dimmed' : 'brand'}
                                    size="lg"
                                    title={alreadySignedUp ? 'Al aangemeld' : isDeadlinePassed ? 'Aanmelding gesloten' : isFull ? 'Activiteit vol' : 'Aanmelden'}
                                    aria-label={alreadySignedUp ? 'Al aangemeld' : isDeadlinePassed ? 'Aanmelding gesloten' : isFull ? 'Activiteit vol' : 'Aanmelden'}
                                >
                                    {alreadySignedUp ? <Check size={18} strokeWidth={3} /> : <UserPlus size={18} />}
                                </ActionIcon>
                            )}
                            <ActionIcon
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShowDetails?.();
                                }}
                                size="lg"
                                title="Meer info"
                                aria-label="Meer info"
                            >
                                <Info size={18} />
                            </ActionIcon>
                        </Group>
                    </Group>
                </Stack>
            </Stack>
        </Card>
    );
}
