'use client';

import { Pen, Trash, Calendar, Users, Euro } from 'lucide-react';
import { Badge, Box, Button, Card, Divider, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { Trip } from '@salvemundi/validations';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface ReisCardProps {
    trip: Trip;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}

export default function ReisCard({ trip, onEdit, onDelete, isDeleting }: ReisCardProps) {
    const sd = trip.start_date;
    const ed = trip.end_date;

    const dateRange = sd
        ? ed
            ? `${new Date(sd).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - ${new Date(ed).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : new Date(sd).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Onbekend';

    const formattedPrice = new Intl.NumberFormat('nl-NL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(trip.base_price || 0));

    const isOpen = trip.registration_open || (trip.registration_start_date && new Date(trip.registration_start_date) <= new Date());

    return (
        <Card
            withBorder
            radius="lg"
            padding={0}
            h="100%"
            style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <Box
                pos="relative"
                h={192}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: 'var(--mantine-color-default-hover)',
                }}
            >
                <Badge
                    pos="absolute"
                    top={12}
                    left={12}
                    color={isOpen ? 'success' : 'error'}
                    variant="filled"
                    size="sm"
                    style={{ zIndex: 10 }}
                >
                    {isOpen ? 'Open' : 'Gesloten'}
                </Badge>

                {trip.is_bus_trip && (
                    <Badge
                        pos="absolute"
                        top={12}
                        right={12}
                        color="brand"
                        variant="filled"
                        size="sm"
                        style={{ zIndex: 10 }}
                    >
                        Busreis
                    </Badge>
                )}

                {trip.image ? (
                    <MediaAsset
                        asset={trip.image}
                        alt={trip.name || 'Trip'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        objectFit="contain"
                    />
                ) : (
                    <Box pos="relative" w="100%" h="100%" p="xl" style={{ opacity: 0.4 }}>
                        <FallbackLogo />
                    </Box>
                )}
            </Box>

            <Stack p="lg" gap="md" style={{ flex: 1 }}>
                <Title order={3} size="h4" lineClamp={1}>
                    {trip.name}
                </Title>

                <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="sm" wrap="nowrap">
                        <Calendar size={16} opacity={0.7} />
                        <Text size="xs" fw={600} c="dimmed">
                            {dateRange}
                        </Text>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                        <Users size={16} opacity={0.7} />
                        <Text size="xs" fw={600} c="dimmed">
                            {trip.max_participants} plekken totaal
                        </Text>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                        <Text span c="accent" lh={1}>
                            <Euro size={16} />
                        </Text>
                        <Text size="sm" fw={800} c="accent" fs="italic">
                            {formattedPrice}
                        </Text>
                    </Group>
                </Stack>

                <Divider />

                <SimpleGrid cols={2} spacing="sm">
                    <Button
                        type="button"
                        variant="default"
                        size="xs"
                        onClick={onEdit}
                        leftSection={<Pen size={14} />}
                    >
                        Bewerken
                    </Button>
                    <Button
                        type="button"
                        variant="light"
                        color="error"
                        size="xs"
                        onClick={onDelete}
                        loading={isDeleting}
                        leftSection={<Trash size={14} />}
                    >
                        Wissen
                    </Button>
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
