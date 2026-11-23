'use client';

import { ChevronRight, Users } from 'lucide-react';
import {
    Card,
    Divider,
    NavLink,
    ScrollArea,
    SegmentedControl,
    Stack,
    Text,
} from '@mantine/core';
import type { Committee } from '@/server/queries/commissies/beheer-commissies.queries';

export type GroupCategory = 'commissies' | 'teams';

export function cleanCommitteeName(name: string): string {
    return name
        .replace(/\s*(\|\||\||[-–—])\s*salve\s*mundi/gi, '')
        .replace(/\s*samu\s*(\|\||\|)\s*/gi, '')
        .trim();
}

interface Props {
    committees: Committee[];
    selectedId: number | null;
    onSelect: (c: Committee) => void;
    category: GroupCategory;
    onCategoryChange: (category: GroupCategory) => void;
}

export default function CommitteeSidebar({
    committees,
    selectedId,
    onSelect,
    category,
    onCategoryChange,
}: Props) {
    return (
        <Card padding={0} style={{ overflow: 'hidden' }}>
            <Stack gap="md" p="md">
                <SegmentedControl
                    fullWidth
                    value={category}
                    onChange={(val) => onCategoryChange(val === 'teams' ? 'teams' : 'commissies')}
                    data={[
                        { value: 'commissies', label: 'Commissies' },
                        { value: 'teams', label: 'Teams' },
                    ]}
                />
            </Stack>

            <Divider />

            <ScrollArea.Autosize mah={540} p="xs">
                {committees.length === 0 ? (
                    <Stack align="center" gap="xs" py="xl">
                        <Users size={36} opacity={0.2} />
                        <Text size="sm" fw={600} c="dimmed" fs="italic">
                            {category === 'commissies' ? 'Geen commissies gevonden' : 'Geen teams gevonden'}
                        </Text>
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
                                    variant="light"
                                    color="brand"
                                    onClick={() => onSelect(c)}
                                    label={cleanCommitteeName(c.name)}
                                    description={c.email || undefined}
                                    rightSection={<ChevronRight size={16} />}
                                    styles={{
                                        root: { borderRadius: 'var(--mantine-radius-md)' },
                                        label: { fontWeight: 600 },
                                    }}
                                />
                            );
                        })}
                    </Stack>
                )}
            </ScrollArea.Autosize>
        </Card>
    );
}
