'use client';

import { Calendar, ChevronDown, Beer } from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Group,
    Menu,
    ScrollArea,
    Stack,
    Text,
    ThemeIcon,
} from '@mantine/core';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';

interface KroegentochtEventDropdownProps {
    events: PubCrawlEvent[];
    selectedEventId: string | number | null;
    onSelect: (event: PubCrawlEvent) => void;
}

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);

export default function KroegentochtEventDropdown({
    events,
    selectedEventId,
    onSelect,
}: KroegentochtEventDropdownProps) {
    const selectedEvent = events.find((e) => e.id === selectedEventId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedEvents = [...events].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <Menu shadow="md" width={288} position="bottom-end">
            <Menu.Target>
                <Button
                    type="button"
                    variant="default"
                    h="auto"
                    py={8}
                    px="sm"
                    miw={210}
                    justify="space-between"
                    leftSection={
                        <ThemeIcon size="sm" variant="light" color="brand" radius="sm">
                            <Beer size={14} />
                        </ThemeIcon>
                    }
                    rightSection={<ChevronDown size={16} />}
                >
                    <Stack gap={0} align="flex-start" miw={0}>
                        <Text size="xs" c="dimmed" fw={600} lh={1.1}>
                            Selecteer Event
                        </Text>
                        <Text size="sm" fw={600} truncate maw={160}>
                            {selectedEvent?.name || 'Geen event'}
                        </Text>
                    </Stack>
                </Button>
            </Menu.Target>

            <Menu.Dropdown p="xs">
                <ScrollArea.Autosize mah={300}>
                    <Stack gap={4}>
                        {sortedEvents.map((event) => {
                            const eventDate = event.date ? new Date(event.date) : new Date(0);
                            const isUpcoming = event.date ? eventDate >= today : false;
                            const isSelected = selectedEventId === event.id;

                            return (
                                <Menu.Item
                                    key={event.id}
                                    onClick={() => onSelect(event)}
                                    bg={isSelected ? 'var(--mantine-color-brand-light)' : undefined}
                                    leftSection={
                                        <ThemeIcon
                                            size="sm"
                                            variant={isSelected ? 'filled' : 'default'}
                                            color={isSelected ? 'brand' : undefined}
                                        >
                                            <Calendar size={14} />
                                        </ThemeIcon>
                                    }
                                >
                                    <Box miw={0}>
                                        <Text
                                            size="sm"
                                            fw={600}
                                            c={isSelected ? 'brand' : undefined}
                                            truncate
                                        >
                                            {event.name}
                                        </Text>
                                        <Group gap="xs">
                                            <Text size="xs" c="dimmed">
                                                {formatDate(eventDate)}
                                            </Text>
                                            {isUpcoming && (
                                                <Badge size="xs" variant="light" color="success">
                                                    Live
                                                </Badge>
                                            )}
                                        </Group>
                                    </Box>
                                </Menu.Item>
                            );
                        })}
                    </Stack>
                </ScrollArea.Autosize>
            </Menu.Dropdown>
        </Menu>
    );
}
