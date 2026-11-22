'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import {
    ActionIcon,
    Button,
    Container,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    Title,
} from '@mantine/core';

import ActivityCard from './ActivityCard';
import ActivityFilters from './ActivityFilters';
import { isEventPast } from '@/shared/lib/utils/date';
import { type BeheerActivity } from '@salvemundi/validations';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

interface Props {
    initialEvents?: BeheerActivity[];
    committees?: Committee[];
    userId?: string;
    userCommittees?: Committee[];
    permissions?: string[];
}

export default function AdminActivitiesIsland({
    initialEvents = [],
    committees = [],
    permissions
}: Props) {
    const router = useRouter();
    const [events] = useState(initialEvents);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
    const [pageSize, setPageSize] = useState<number | -1>(10);
    const [isPending] = useTransition();

    const handleFilterChange = (newFilter: 'all' | 'upcoming' | 'past') => setFilter(newFilter);

    const availableCommittees = useMemo(() => {
        return committees
            .map(c => ({ id: String(c.id), name: cleanCommitteeName(c.name || '') }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [committees]);

    const filteredEvents = useMemo(() => {
        let result = events;
        const eventIsPast = (e: BeheerActivity) => isEventPast(
            e.event_date_end || e.event_date,
            e.event_time_end || e.event_time,
            !!e.event_time_end
        );
        if (filter === 'upcoming') result = result.filter(e => !eventIsPast(e));
        else if (filter === 'past') result = result.filter(e => eventIsPast(e));
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e => e.name.toLowerCase().includes(query) || e.location?.toLowerCase().includes(query));
        }
        if (selectedCommittee !== 'all') result = result.filter(e => String(e.committee_id) === selectedCommittee);

        const getTime = (e: BeheerActivity) => (e.event_time && e.event_date.length <= 10)
            ? new Date(`${e.event_date}T${e.event_time}`).getTime()
            : new Date(e.event_date).getTime();
        return [...result].sort((a, b) => {
            const aPast = eventIsPast(a);
            const bPast = eventIsPast(b);
            if (aPast !== bPast) return aPast ? 1 : -1;
            return aPast ? getTime(b) - getTime(a) : getTime(a) - getTime(b);
        });
    }, [events, filter, searchQuery, selectedCommittee]);

    const displayedEvents = useMemo(() => {
        return pageSize === -1 ? filteredEvents : filteredEvents.slice(0, pageSize);
    }, [filteredEvents, pageSize]);

    const stats = useMemo(() => {
        const upcoming = displayedEvents.filter(e => e.event_date && !isEventPast(
            e.event_date_end || e.event_date,
            e.event_time_end || e.event_time,
            !!e.event_time_end
        )).length;
        const signups = displayedEvents.reduce((acc, curr) => acc + (curr.signup_count || 0), 0);
        return {
            upcoming,
            total: displayedEvents.length,
            signups
        };
    }, [displayedEvents]);
    const canEdit = !!permissions?.includes('activiteiten:edit');

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                    <Group gap="md" align="center">
                        <ActionIcon
                            component={Link}
                            href="/beheer"
                            size="lg"
                            aria-label="Terug"
                        >
                            <ChevronLeft size={18} />
                        </ActionIcon>
                        <Title order={1} size="h2" c="brand">
                            Activiteiten Beheer
                        </Title>
                    </Group>

                    <Group gap="md" wrap="wrap">
                        <Paper withBorder px="md" py="xs">
                            <Group gap="md" wrap="nowrap">
                                <Stack gap={2} align="center" px={4}>
                                    <Text size="xs" c="dimmed" fw={600} lh={1}>Aankomend</Text>
                                    <Text size="sm" fw={700} lh={1}>{stats.upcoming}</Text>
                                </Stack>
                                <Divider orientation="vertical" />
                                <Stack gap={2} align="center" px={4}>
                                    <Text size="xs" c="dimmed" fw={600} lh={1}>Totale activiteiten</Text>
                                    <Text size="sm" fw={700} lh={1}>{stats.total}</Text>
                                </Stack>
                                <Divider orientation="vertical" />
                                <Stack gap={2} align="center" px={4}>
                                    <Text size="xs" c="dimmed" fw={600} lh={1}>Aanmeldingen</Text>
                                    <Text size="sm" fw={700} lh={1}>{stats.signups}</Text>
                                </Stack>
                            </Group>
                        </Paper>

                        <Button
                            component={Link}
                            href="/beheer/activiteiten/nieuw"
                            leftSection={<Plus size={16} />}
                        >
                            Nieuwe Activiteit
                        </Button>
                    </Group>
                </Group>

                <ActivityFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    selectedCommittee={selectedCommittee}
                    committees={availableCommittees}
                    onCommitteeChange={setSelectedCommittee}
                />

                <Stack gap="lg">
                    {displayedEvents.map((event) => (
                        <ActivityCard
                            key={event.id}
                            event={event}
                            canEdit={canEdit}
                            isPending={isPending}
                            onViewSignups={(id) => router.push(`/beheer/activiteiten/${id}/aanmeldingen`)}
                            onViewAttendance={(id) => router.push(`/beheer/activiteiten/${id}/aanwezigheid`)}
                            onEdit={(id) => router.push(`/beheer/activiteiten/${id}/bewerken`)}
                        />
                    ))}
                </Stack>
            </Stack>
        </Container>
    );
}
