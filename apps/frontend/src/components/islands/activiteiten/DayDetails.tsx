'use client';

import { Clock, MapPin, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import { Group, Modal, Paper, ScrollArea, Stack, Text, ThemeIcon, Title, UnstyledButton } from '@mantine/core';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { isEventOnDay } from '@/shared/lib/utils/date';

interface DayDetailsProps {
    selectedDay: Date;
    activities: Activiteit[];
    onClose: () => void;
    onEventClick: (event: Activiteit) => void;
}

export default function DayDetails({ selectedDay, activities, onClose, onEventClick }: DayDetailsProps) {
    const dayEvents = activities.filter(event => isEventOnDay(event, selectedDay));
    const formattedDate = new Intl.DateTimeFormat('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(selectedDay);

    return (
        <Modal
            opened
            onClose={onClose}
            centered
            size="md"
            title={
                <Group gap="sm">
                    <ThemeIcon size={40}>
                        <CalendarIcon size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                            {dayEvents.length} {dayEvents.length === 1 ? 'activiteit' : 'activiteiten'}
                        </Text>
                        <Title order={3} size="h4" tt="capitalize" c="brand">
                            {formattedDate}
                        </Title>
                    </Stack>
                </Group>
            }
        >
            <ScrollArea.Autosize mah="65vh">
                {dayEvents.length === 0 ? (
                    <Text py="xl" ta="center" size="sm" fw={600} c="dimmed">
                        Geen activiteiten gepland op deze dag
                    </Text>
                ) : (
                    <Stack gap="sm">
                        {dayEvents.map(event => (
                            <UnstyledButton
                                key={event.id}
                                type="button"
                                w="100%"
                                onClick={() => {
                                    onClose();
                                    onEventClick(event);
                                }}
                            >
                                <Paper p="md" withBorder>
                                    <Stack gap="xs">
                                        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                                            <Text fw={700}>{event.name}</Text>
                                            <Text span c="dimmed" lh={1} style={{ flexShrink: 0 }}>
                                                <ArrowRight size={16} />
                                            </Text>
                                        </Group>

                                        <Group gap="md" wrap="wrap" c="dimmed">
                                            <Group gap={6}>
                                                <Text span c="brand" lh={1}><Clock size={14} /></Text>
                                                <Text size="xs">
                                                    {event.event_time
                                                        ? event.event_time.split(':').slice(0, 2).join(':')
                                                        : new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.event_date))}
                                                    {event.event_time_end && ` - ${event.event_time_end.split(':').slice(0, 2).join(':')}`}
                                                </Text>
                                            </Group>
                                            {event.location && (
                                                <Group gap={6}>
                                                    <Text span c="brand" lh={1}><MapPin size={14} /></Text>
                                                    <Text size="xs" maw={220} truncate>{event.location}</Text>
                                                </Group>
                                            )}
                                        </Group>
                                    </Stack>
                                </Paper>
                            </UnstyledButton>
                        ))}
                    </Stack>
                )}
            </ScrollArea.Autosize>
        </Modal>
    );
}
