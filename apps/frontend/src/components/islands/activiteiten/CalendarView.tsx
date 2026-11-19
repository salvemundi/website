'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ActionIcon, Box, Button, Card, Group, Paper, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { isEventOnDay } from '@/shared/lib/utils/date';

interface CalendarViewProps {
    currentDate: Date;
    events: Activiteit[];
    selectedDay?: Date | null;
    onSelectDay: (day: Date) => void;
    onEventClick: (event: Activiteit) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToDate?: (date: Date) => void;
}

const WEEK_DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const;

export default function CalendarView({
    currentDate,
    events,
    selectedDay,
    onSelectDay,
    onEventClick,
    onPrevMonth,
    onNextMonth,
    onGoToDate
}: CalendarViewProps) {
    const { days, monthStart } = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const getStartOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - (day === 0 ? 6 : day - 1);
            return new Date(date.setDate(diff));
        };

        const getEndOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() + (day === 0 ? 0 : 7 - day);
            return new Date(date.setDate(diff));
        };

        const startDate = getStartOfWeek(start);
        const endDate = getEndOfWeek(end);

        const dayList: Date[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            dayList.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return { days: dayList, monthStart: start };
    }, [currentDate]);

    const eventsByDayKey = useMemo(() => {
        const map = new Map<string, Activiteit[]>();
        for (const d of days) {
            const key = d.toDateString();
            const dayEvents = events.filter(e => isEventOnDay(e, d));
            map.set(key, dayEvents);
        }
        return map;
    }, [days, events]);

    return (
        <Card component="section" aria-label="Activiteitenkalender" padding={0} radius="xl" shadow="xl" withBorder style={{ overflow: 'hidden' }}>
            <Group justify="space-between" align="center" p={{ base: 'md', sm: 'lg' }}>
                <Title order={2} size="h3" tt="capitalize" c="brand">
                    {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </Title>
                <Group gap="xs">
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="brand"
                        size="lg"
                        onClick={onPrevMonth}
                        aria-label="Vorige maand"
                    >
                        <ChevronLeft size={20} />
                    </ActionIcon>
                    <Button
                        type="button"
                        variant="light"
                        color="brand"
                        size="xs"
                        onClick={() => {
                            const today = new Date();
                            onSelectDay(today);
                            onGoToDate?.(today);
                        }}
                    >
                        Vandaag
                    </Button>
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="brand"
                        size="lg"
                        onClick={onNextMonth}
                        aria-label="Volgende maand"
                    >
                        <ChevronRight size={20} />
                    </ActionIcon>
                </Group>
            </Group>

            <SimpleGrid
                cols={7}
                spacing={0}
                style={{
                    borderTop: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                    borderBottom: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--primary) 6%, transparent)',
                }}
            >
                {WEEK_DAYS.map(day => (
                    <Text key={day} py="xs" ta="center" size="xs" fw={900} tt="uppercase" c="dimmed">
                        {day}
                    </Text>
                ))}
            </SimpleGrid>

            <SimpleGrid
                cols={7}
                spacing={1}
                style={{
                    backgroundColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                }}
            >
                {days.map((day) => {
                    const dayKey = day.toDateString();
                    const dayEvents = eventsByDayKey.get(dayKey) ?? [];
                    const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                    const isDayToday = dayKey === new Date().toDateString();
                    const isSelected = selectedDay ? dayKey === selectedDay.toDateString() : false;
                    const maxVisibleEvents = 2;
                    const overflowCount = dayEvents.length - maxVisibleEvents;

                    return (
                        <Box
                            key={dayKey}
                            onClick={() => onSelectDay(day)}
                            p="xs"
                            mih={112}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                backgroundColor: isSelected
                                    ? 'color-mix(in srgb, var(--primary) 12%, var(--mantine-color-default))'
                                    : isCurrentMonth
                                        ? 'var(--mantine-color-default)'
                                        : 'var(--mantine-color-body)',
                                opacity: isCurrentMonth ? 1 : 0.65,
                                boxShadow: isSelected ? 'inset 0 0 0 2px var(--primary)' : undefined,
                            }}
                        >
                            <Group justify="space-between" align="center" wrap="nowrap">
                                <Box
                                    w={28}
                                    h={28}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '9999px',
                                        backgroundColor: isDayToday ? 'var(--primary)' : undefined,
                                        color: isDayToday ? '#FFFFFF' : isSelected ? 'var(--primary)' : undefined,
                                    }}
                                >
                                    <Text size="xs" fw={isDayToday || isSelected ? 900 : 600}>
                                        {day.getDate()}
                                    </Text>
                                </Box>
                                {dayEvents.length > 0 && (
                                    <Text size="10px" fw={700} c="dimmed" visibleFrom="sm">
                                        {dayEvents.length} act.
                                    </Text>
                                )}
                            </Group>

                            <Stack gap={4} mt={6}>
                                {dayEvents.slice(0, maxVisibleEvents).map((event) => (
                                    <UnstyledButton
                                        key={event.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        w="100%"
                                        title={`${event.event_time ? event.event_time.split(':').slice(0, 2).join(':') : '00:00'} - ${event.name}`}
                                    >
                                        <Paper
                                            px={6}
                                            py={3}
                                            radius="sm"
                                            withBorder
                                            style={{
                                                backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
                                            }}
                                        >
                                            <Group gap={4} wrap="nowrap">
                                                {event.event_time && (
                                                    <Text size="10px" fw={900} c="brand" style={{ flexShrink: 0, opacity: 0.75 }}>
                                                        {event.event_time.split(':').slice(0, 2).join(':')}
                                                    </Text>
                                                )}
                                                <Text size="11px" fw={700} c="brand" truncate>
                                                    {event.name}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    </UnstyledButton>
                                ))}

                                {overflowCount > 0 && (
                                    <Text size="10px" fw={700} c="brand" ta="center">
                                        +{overflowCount} meer
                                    </Text>
                                )}
                            </Stack>
                        </Box>
                    );
                })}
            </SimpleGrid>
        </Card>
    );
}
