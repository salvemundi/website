'use client';

import {
    Calendar,
    Users,
    Edit,
    Eye,
    MapPin,
    Euro
} from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Flex,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { type BeheerActivity } from '@salvemundi/validations';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { isEventPast } from '@/shared/lib/utils/date';

const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(dateString));

interface Props {
    event?: BeheerActivity;
    canEdit?: boolean;
    isPending?: boolean;
    onViewSignups?: (id: number) => void;
    onViewAttendance?: (id: number) => void;
    onEdit?: (id: number) => void;
}

export default function ActivityCard({
    event,
    canEdit = false,
    onViewSignups = () => { },
    onViewAttendance = () => { },
    onEdit = () => { }
}: Props) {
    if (!event) return null;
    const isPast = isEventPast(
        event.event_date_end || event.event_date,
        event.event_time_end || event.event_time,
        !!event.event_time_end
    );
    const isDraft = event.status === 'draft';
    const isScheduled = event.status === 'published' && event.publish_date && new Date(event.publish_date) > new Date();

    return (
        <Card
            withBorder
            padding={0}
            radius="lg"
            style={{
                overflow: 'hidden',
                opacity: isPast ? 0.65 : 1,
            }}
        >
            <Flex direction={{ base: 'column', md: 'row' }}>
                <Box
                    visibleFrom="md"
                    pos="relative"
                    w={{ md: 200, lg: 224 }}
                    mih={180}
                    p="md"
                    style={{
                        flexShrink: 0,
                        borderRight: '1px solid var(--mantine-color-default-border)',
                    }}
                >
                    <Box pos="relative" w="100%" h="100%">
                        <MediaAsset
                            asset={event.image}
                            alt={event.name}
                            fill
                            objectFit="contain"
                        />
                    </Box>
                </Box>

                <Stack justify="center" gap="sm" p={{ base: 'lg', sm: 'xl' }} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="sm" wrap="wrap">
                        <Title order={3} size="h3">{event.name}</Title>
                        <Group gap="xs">
                            {isDraft && <Badge variant="default" size="xs">Draft</Badge>}
                            {isScheduled && <Badge color="brand" variant="light" size="xs">Ingepland</Badge>}
                            {isPast && <Badge variant="default" size="xs">Verleden</Badge>}
                        </Group>
                    </Group>

                    <Group gap="lg" wrap="wrap">
                        <Group gap={6}>
                            <Text span c="accent" lh={1}><Calendar size={14} /></Text>
                            <Text size="xs" fw={600} c="dimmed">{formatDate(event.event_date)}</Text>
                        </Group>
                        {event.location && (
                            <Group gap={6}>
                                <Text span c="error" lh={1}><MapPin size={14} /></Text>
                                <Text size="xs" fw={600} c="dimmed" truncate>{event.location}</Text>
                            </Group>
                        )}
                    </Group>

                    {event.description && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                            {event.description}
                        </Text>
                    )}

                    <Group gap="md" wrap="wrap" pt={4}>
                        <Paper withBorder px="md" py="xs" radius="md">
                            <Group gap="sm" wrap="nowrap">
                                <ThemeIcon variant="light" color="accent" radius="xl" size="md">
                                    <Users size={16} />
                                </ThemeIcon>
                                <Group gap={4} align="baseline">
                                    <Text size="lg" fw={700} lh={1}>{event.signup_count || 0}</Text>
                                    {event.max_sign_ups && (
                                        <Text size="xs" fw={600} c="dimmed">/ {event.max_sign_ups}</Text>
                                    )}
                                    <Text size="xs" fw={600} c="dimmed" ml={2}>aanmeldingen</Text>
                                </Group>
                            </Group>
                        </Paper>

                        {(event.price_members !== undefined || event.price_non_members !== undefined) && (
                            <Paper withBorder px="md" py="xs" radius="md">
                                <Group gap="sm" wrap="nowrap">
                                    <ThemeIcon variant="light" color="success" radius="xl" size="md">
                                        <Euro size={16} />
                                    </ThemeIcon>
                                    <Group gap="xs" wrap="nowrap">
                                        {event.price_members === 0 && event.price_non_members === 0 ? (
                                            <Text size="sm" fw={600} c="success">Gratis</Text>
                                        ) : (
                                            <>
                                                <Text size="sm" fw={600}>€{event.price_members || 0} Lid</Text>
                                                <Divider orientation="vertical" />
                                                <Text size="sm" fw={600} c="dimmed">€{event.price_non_members || 0} Niet lid</Text>
                                            </>
                                        )}
                                    </Group>
                                </Group>
                            </Paper>
                        )}
                    </Group>
                </Stack>

                <Divider hiddenFrom="md" />
                <Divider orientation="vertical" visibleFrom="md" />

                <Stack justify="center" gap="xs" p="lg" w={{ base: '100%', md: 240 }} style={{ flexShrink: 0 }}>
                    <Button
                        type="button"
                        variant="light"
                        color="accent"
                        onClick={() => onViewSignups(event.id)}
                        leftSection={<Eye size={16} />}
                    >
                        Aanmeldingen
                    </Button>

                    <Button
                        type="button"
                        variant="light"
                        color="success"
                        onClick={() => onViewAttendance(event.id)}
                        leftSection={<Users size={16} />}
                    >
                        Aanwezigheid
                    </Button>

                    {canEdit && (
                        <Button
                            type="button"
                            variant="default"
                            onClick={() => onEdit(event.id)}
                            leftSection={<Edit size={16} />}
                        >
                            Bewerken
                        </Button>
                    )}
                </Stack>
            </Flex>
        </Card>
    );
}
