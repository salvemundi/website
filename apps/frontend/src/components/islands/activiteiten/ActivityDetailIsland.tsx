'use client';

import React from 'react';
import { MapPin, User, Mail, CalendarClock } from 'lucide-react';
import { Badge, Box, Card, Container, Divider, Grid, GridCol, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { buildCommitteeEmail, formatActivityDateTime } from '@/shared/lib/activity-utils';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface ActivityDetailIslandProps {
    activity?: Activiteit;
    isLoggedIn?: boolean;
    children?: React.ReactNode;
}

export default function ActivityDetailIsland({ activity, isLoggedIn = false, children }: ActivityDetailIslandProps) {
    const contact = activity?.contact;
    const committeeEmail = contact && contact.includes('@')
        ? contact
        : activity ? buildCommitteeEmail(activity.committee_name) : null;

    const { displayDate, timeRange } = formatActivityDateTime(
        {
            event_date: activity?.event_date || '',
            event_date_end: activity?.event_date_end,
            event_time: activity?.event_time,
            event_time_end: activity?.event_time_end
        },
        'detail'
    );

    return (
        <Box w="100%" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {activity?.afbeelding_id ? (
                <Box pos="relative" h="45vh" mih={400} w="100%" style={{ overflow: 'hidden' }}>
                    <MediaAsset
                        asset={activity.afbeelding_id}
                        alt={activity.name}
                        fill
                        priority
                        className="object-cover"
                    />
                    <Box
                        pos="absolute"
                        inset={0}
                        style={{
                            background: 'linear-gradient(to top, var(--mantine-color-body), color-mix(in srgb, var(--mantine-color-body) 40%, transparent), transparent)',
                        }}
                    />
                    <Container size="xl" pos="absolute" bottom={0} left={0} right={0} pb="xl">
                        <Stack gap="sm" maw={768}>
                            <Box>
                                <Badge size="lg">
                                    {activity.committee_name || 'Algemene Activiteit'}
                                </Badge>
                            </Box>
                            <Title order={1} fz={{ base: '2.25rem', md: '4.5rem' }} lh={1.08}>
                                {activity.name}
                            </Title>
                        </Stack>
                    </Container>
                </Box>
            ) : (
                <Container size="xl" w="100%" pt="xl" pb="md">
                    <Stack gap="sm">
                        <Box>
                            <Badge size="lg">
                                {activity?.committee_name || 'Algemene Activiteit'}
                            </Badge>
                        </Box>
                        <Title order={1} fz={{ base: '2.25rem', md: '4.5rem' }} lh={1.08}>
                            {activity?.name}
                        </Title>
                    </Stack>
                </Container>
            )}

            <Container component="main" size="xl" w="100%" py="xl">
                <Grid gap="xl" align="stretch">
                    <GridCol span={{ base: 12, lg: 6 }}>
                        <Stack gap="lg">
                            {children}
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                <Paper p="md" withBorder shadow="sm">
                                    <Stack gap={4}>
                                        <Group gap="xs">
                                            <Text span c="brand" lh={1}><CalendarClock size={16} /></Text>
                                            <Text size="xs" fw={900} tt="uppercase" c="dimmed">Datum &amp; Tijd</Text>
                                        </Group>
                                        <Text size="md" fw={700}>{displayDate}</Text>
                                        {timeRange && (
                                            <Text size="sm" fw={600} c="brand">{timeRange}</Text>
                                        )}
                                    </Stack>
                                </Paper>

                                {activity?.location && (
                                    <Paper p="md" withBorder shadow="sm">
                                        <Stack gap={4}>
                                            <Group gap="xs">
                                                <Text span c="brand" lh={1}><MapPin size={16} /></Text>
                                                <Text size="xs" fw={900} tt="uppercase" c="dimmed">Locatie</Text>
                                            </Group>
                                            <Text size="md" fw={700} style={{ wordBreak: 'break-word' }}>
                                                {activity.location}
                                            </Text>
                                        </Stack>
                                    </Paper>
                                )}

                                <Paper p="md" withBorder shadow="sm">
                                    <Stack gap={4}>
                                        <Group gap="xs">
                                            <Text span c="brand" lh={1}><User size={16} /></Text>
                                            <Text size="xs" fw={900} tt="uppercase" c="dimmed">Organisatie</Text>
                                        </Group>
                                        <Text size="md" fw={700} style={{ wordBreak: 'break-word' }}>
                                            {activity?.committee_name || 'Bestuur'}
                                        </Text>
                                    </Stack>
                                </Paper>

                                <Paper p="md" withBorder shadow="sm">
                                    <Stack gap={4}>
                                        <Group gap="xs">
                                            <Text span c="brand" lh={1}><Mail size={16} /></Text>
                                            <Text size="xs" fw={900} tt="uppercase" c="dimmed">Contact</Text>
                                        </Group>
                                        <Text size="sm" fw={700} c="brand" component="div">
                                            <ObfuscatedEmail email={committeeEmail || 'bestuur@salvemundi.nl'} showIcon={false} />
                                        </Text>
                                    </Stack>
                                </Paper>
                            </SimpleGrid>
                        </Stack>
                    </GridCol>

                    <GridCol span={{ base: 12, lg: 6 }}>
                        <Card padding="xl" withBorder shadow="lg" h="100%">
                            <Stack gap="lg">
                                <Group gap="sm">
                                    <Box w={8} h={32} style={{ borderRadius: '9999px', backgroundColor: 'var(--mantine-color-brand-filled)' }} />
                                    <Title order={2} size="h3" tt="uppercase" c="brand">
                                        Over deze activiteit
                                    </Title>
                                </Group>

                                <SafeMarkdown content={activity?.description || 'Geen beschrijving beschikbaar.'} />

                                {isLoggedIn && activity?.description_logged_in && (
                                    <>
                                        <Divider my="sm" />
                                        <Group gap="sm">
                                            <Box w={6} h={24} style={{ borderRadius: '9999px', backgroundColor: 'var(--mantine-color-dimmed)' }} />
                                            <Title order={3} size="h4" tt="uppercase" c="dimmed">
                                                Extra Informatie (alleen ingelogd)
                                            </Title>
                                        </Group>
                                        <SafeMarkdown content={activity.description_logged_in} />
                                    </>
                                )}
                            </Stack>
                        </Card>
                    </GridCol>
                </Grid>
            </Container>
        </Box>
    );
}
