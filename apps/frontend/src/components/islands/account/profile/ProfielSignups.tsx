'use client';

import Link from 'next/link';
import { Calendar, ChevronRight, CreditCard } from 'lucide-react';
import { Anchor, Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { Tile } from './ProfielUI';
import { slugify } from '@/shared/lib/utils/slug';
import { type ProfileSignupItem } from '@/lib/profile/profile-admin.utils';

const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));

interface ProfielSignupsProps {
    filteredSignups?: ProfileSignupItem[];
    showPastEvents?: boolean;
    setShowPastEvents?: (value: boolean | ((previousValue: boolean) => boolean)) => void;
}

export default function ProfielSignups({
    filteredSignups = [],
    showPastEvents = false,
    setShowPastEvents = () => { }
}: ProfielSignupsProps) {
    return (
        <Tile
            title="Mijn aanmeldingen"
            icon={<Calendar size={20} />}
            actions={
                <Group gap="xs" wrap="wrap">
                    <Button
                        type="button"
                        size="xs"
                        onClick={() => setShowPastEvents((previousValue) => !previousValue)}
                    >
                        {showPastEvents ? 'Verberg oude' : 'Toon oude'}
                    </Button>
                    <Button
                        component={Link}
                        href="/profiel/tickets"
                        size="xs"
                        rightSection={<ChevronRight size={14} />}
                    >
                        Tickets
                    </Button>
                    <Button
                        component={Link}
                        href="/activiteiten"
                        size="xs"
                        rightSection={<ChevronRight size={14} />}
                    >
                        Kalender
                    </Button>
                </Group>
            }
        >
            {filteredSignups.length > 0 ? (
                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                    {filteredSignups.map((signup: ProfileSignupItem) => {
                        const isEvent = signup._type === 'event';
                        const eventName = isEvent ? signup.event_id?.name : signup.pub_crawl_event_id.name;

                        if (!eventName) return null;

                        const eventDateStr = isEvent ? signup.event_id?.event_date : signup.pub_crawl_event_id.date;
                        const detailHref = isEvent ? `/activiteiten/${slugify(eventName)}` : '/kroegentocht';
                        const icon = isEvent ? <Calendar size={24} /> : <CreditCard size={24} />;

                        const isPast = (() => {
                            if (!eventDateStr) return false;
                            const eventDate = new Date(eventDateStr);
                            if (Number.isNaN(eventDate.getTime())) return false;
                            eventDate.setHours(0, 0, 0, 0);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return eventDate.getTime() < today.getTime();
                        })();

                        return (
                            <Anchor key={`${signup._type}-${signup.id}`} component={Link} href={detailHref} underline="never">
                                <Paper
                                    p="md"
                                    withBorder
                                    h="100%"
                                    style={isPast ? { opacity: 0.6 } : undefined}
                                >
                                    <Group justify="space-between" wrap="nowrap" gap="md">
                                        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                                            <ThemeIcon size="lg">
                                                {icon}
                                            </ThemeIcon>
                                            <Stack gap={2} style={{ minWidth: 0 }}>
                                                <Text size="md" fw={700} lineClamp={1}>
                                                    {eventName}
                                                </Text>
                                                {eventDateStr && (
                                                    <Group gap={6} c="dimmed">
                                                        <Calendar size={14} />
                                                        <Text size="xs" fw={600}>
                                                            {formatDate(eventDateStr)}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Stack>
                                        </Group>
                                        <Text span c="dimmed" lh={1}>
                                            <ChevronRight size={20} />
                                        </Text>
                                    </Group>
                                </Paper>
                            </Anchor>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Paper
                    p="xl"
                    withBorder
                    ta="center"
                    style={{ borderStyle: 'dashed' }}
                >
                    <Stack align="center" gap="sm">
                        <Text size="lg" fw={700}>
                            Je bent nog niet aangemeld voor activiteiten.
                        </Text>
                        <Text size="sm" c="dimmed">
                            Bekijk de kalender om aankomende activiteiten te ontdekken
                        </Text>
                        <Button component={Link} href="/activiteiten" size="md" mt="xs">
                            Ontdek activiteiten
                        </Button>
                    </Stack>
                </Paper>
            )}
        </Tile>
    );
}
