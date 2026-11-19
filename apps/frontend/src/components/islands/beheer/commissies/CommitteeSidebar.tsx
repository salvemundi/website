'use client';

import {
    Users,
    Search,
    Mail,
    ChevronRight
} from 'lucide-react';
import {
    Card,
    Divider,
    Group,
    NavLink,
    ScrollArea,
    SegmentedControl,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import type { Committee } from '@/server/queries/commissies/beheer-commissies.queries';

interface Props {
    committees: Committee[];
    selectedId: number | null;
    onSelect: (c: Committee) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    showAll: boolean;
    onShowAllChange: (all: boolean) => void;
}

const normalizeName = (name: string) =>
    name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim();

export default function CommitteeSidebar({
    committees,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    showAll,
    onShowAllChange
}: Props) {
    return (
        <Card withBorder padding={0} style={{ overflow: 'hidden' }}>
            <Stack gap="md" p="lg">
                <Group gap="xs">
                    <Text span c="accent" lh={1}><Users size={16} /></Text>
                    <Title order={2} size="xs" c="dimmed" fw={700} tt="uppercase">
                        Groepen &amp; commissies
                    </Title>
                </Group>

                <TextInput
                    placeholder="Zoek commissie..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                    leftSection={<Search size={16} />}
                />

                <SegmentedControl
                    fullWidth
                    value={showAll ? 'all' : 'core'}
                    onChange={(val) => onShowAllChange(val === 'all')}
                    color="accent"
                    data={[
                        { value: 'core', label: 'Kern' },
                        { value: 'all', label: 'Alles' },
                    ]}
                />
            </Stack>

            <Divider />

            <ScrollArea.Autosize mah={540} p="xs">
                {committees.length === 0 ? (
                    <Stack align="center" gap="xs" py="xl">
                        <Search size={36} opacity={0.15} />
                        <Text size="sm" fw={600} c="dimmed" fs="italic">Geen resultaten</Text>
                    </Stack>
                ) : (
                    <Stack gap={4}>
                        {committees.map((c) => {
                            const isSelected = selectedId === c.id;
                            return (
                                <NavLink
                                    key={c.id}
                                    component="button"
                                    type="button"
                                    active={isSelected}
                                    variant="filled"
                                    color="accent"
                                    onClick={() => onSelect(c)}
                                    label={
                                        <Text size="sm" fw={600} truncate>
                                            {normalizeName(c.name)}
                                        </Text>
                                    }
                                    description={
                                        c.email ? (
                                            <Group gap={4} wrap="nowrap">
                                                <Mail size={12} />
                                                <Text size="xs" truncate>{c.email}</Text>
                                            </Group>
                                        ) : undefined
                                    }
                                    rightSection={<ChevronRight size={16} />}
                                    style={{ borderRadius: 'var(--mantine-radius-md)' }}
                                />
                            );
                        })}
                    </Stack>
                )}
            </ScrollArea.Autosize>
        </Card>
    );
}
