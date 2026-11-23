'use client';

import React from 'react';
import {
    Users,
    Pen,
    Trash,
    LayoutGrid,
} from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Group,
    Stack,
    Text,
    ActionIcon,
    Title,
} from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { type TripActivity } from '@salvemundi/validations/schema/beheer-trip.zod';
import { parseActivityOptions } from '@/lib/reis';

interface Props {
    activity: TripActivity;
    onEdit: (activity: TripActivity) => void;
    onDelete: (id: number) => void;
    onViewSignups: (id: number) => void;
}

export default function ReisActivityCard({
    activity,
    onEdit,
    onDelete,
    onViewSignups,
}: Props) {
    const options = parseActivityOptions(activity.options);

    return (
        <Card
            p={0}
            shadow="sm"
            style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Card.Section pos="relative" h={activity.image ? 192 : 96}>
                {activity.image ? (
                    <>
                        <MediaAsset
                            asset={activity.image || undefined}
                            alt={activity.name || undefined}
                            fill
                            objectFit="cover"
                        />
                        <Badge
                            pos="absolute"
                            top={12}
                            right={12}
                            size="sm"
                            color={activity.is_active ? 'success' : 'error'}
                        >
                            {activity.is_active ? 'Actief' : 'Inactief'}
                        </Badge>
                    </>
                ) : (
                    <Group h="100%" justify="center" align="center">
                        <Text span c="dimmed" lh={1}>
                            <LayoutGrid size={32} />
                        </Text>
                    </Group>
                )}
            </Card.Section>

            <Stack p="lg" gap="md" flex={1} justify="space-between">
                <Stack gap="xs">
                    <Title order={3} size="h4" lineClamp={1}>
                        {activity.name}
                    </Title>
                    {activity.description && (
                        <Text size="xs" c="dimmed" lineClamp={4}>
                            {activity.description}
                        </Text>
                    )}
                </Stack>

                <Stack gap="md">
                    <Group justify="space-between" align="flex-end">
                        <Box>
                            <Text size="xs" fw={600} c="dimmed">
                                Basisprijs
                            </Text>
                            <Text size="xl" fw={700} c="brand">
                                €{Number(activity.price || 0).toFixed(2)}
                            </Text>
                        </Box>
                        {activity.max_participants && (
                            <Stack gap={2} align="flex-end">
                                <Text size="xs" fw={600} c="dimmed">
                                    Capaciteit
                                </Text>
                                <Badge
                                    size="md"
                                    leftSection={<Users size={12} />}
                                >
                                    {activity.max_participants}
                                </Badge>
                            </Stack>
                        )}
                    </Group>

                    {options.length > 0 && (
                        <Box>
                            <Text size="xs" fw={600} c="dimmed" mb={6}>
                                {activity.max_selections === 1 ? 'Keuze verplicht' : 'Extra opties'}{' '}
                                ({options.length})
                            </Text>
                            <Group gap={6} wrap="wrap">
                                {options.slice(0, 2).map((o, i) => (
                                    <Badge key={i} size="xs">
                                        {o.name || 'Naamloos'}
                                    </Badge>
                                ))}
                                {options.length > 2 && (
                                    <Text size="xs" c="dimmed">
                                        +{options.length - 2}
                                    </Text>
                                )}
                            </Group>
                        </Box>
                    )}

                    <Stack gap="xs">
                        <Group gap="xs" wrap="nowrap">
                            <Button
                                type="button"
                                size="xs"
                                flex={1}
                                onClick={() => onEdit(activity)}
                                leftSection={<Pen size={14} />}
                            >
                                Bewerken
                            </Button>
                            <ActionIcon
                                type="button"
                                color="error"
                                size="lg"
                                onClick={() => onDelete(activity.id as number)}
                                aria-label="Activiteit verwijderen"
                            >
                                <Trash size={16} />
                            </ActionIcon>
                        </Group>
                        <Button
                            type="button"
                            size="xs"
                            fullWidth
                            onClick={() => onViewSignups(activity.id as number)}
                            leftSection={<Users size={14} />}
                        >
                            Inschrijvingen
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </Card>
    );
}
