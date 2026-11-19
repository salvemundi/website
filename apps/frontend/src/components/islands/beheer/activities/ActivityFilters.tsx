'use client';

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Grid, SegmentedControl, Select, SimpleGrid, TextInput } from '@mantine/core';

interface Props {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    filter: 'all' | 'upcoming' | 'past';
    onFilterChange: (f: 'all' | 'upcoming' | 'past') => void;
    pageSize: number | -1;
    onPageSizeChange: (size: number | -1) => void;
    selectedCommittee: string;
    committees: { id: string, name: string }[];
    onCommitteeChange: (id: string) => void;
}

const PAGE_SIZE_OPTIONS = [
    { value: '10', label: '10 items' },
    { value: '25', label: '25 items' },
    { value: 'all', label: 'Alles' }
] as const;

export default function ActivityFilters({
    searchQuery,
    onSearchChange,
    filter,
    onFilterChange,
    pageSize,
    onPageSizeChange,
    selectedCommittee,
    committees,
    onCommitteeChange
}: Props) {
    const committeeOptions = useMemo(() => {
        return [
            { value: 'all', label: 'Alle' },
            ...committees.map(c => ({ value: c.id, label: c.name }))
        ];
    }, [committees]);

    return (
        <Grid gap="md" align="flex-end">
            <Grid.Col span={{ base: 12, lg: 5 }}>
                <TextInput
                    placeholder="Zoek activiteiten op naam of locatie..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                    leftSection={<Search size={16} />}
                    autoComplete="off"
                    suppressHydrationWarning
                />
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 7 }}>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" style={{ alignItems: 'end' }}>
                    <Select
                        label="Commissie"
                        value={selectedCommittee}
                        onChange={(val) => {
                            if (val) onCommitteeChange(val);
                        }}
                        data={committeeOptions}
                        allowDeselect={false}
                        searchable
                    />

                    <Select
                        label="Per pagina"
                        value={pageSize === -1 ? 'all' : pageSize.toString()}
                        onChange={(val) => {
                            if (val) onPageSizeChange(val === 'all' ? -1 : parseInt(val, 10));
                        }}
                        data={[...PAGE_SIZE_OPTIONS]}
                        allowDeselect={false}
                    />

                    <SegmentedControl
                        value={filter}
                        onChange={(val) => onFilterChange(val as 'all' | 'upcoming' | 'past')}
                        color="accent"
                        fullWidth
                        data={[
                            { value: 'all', label: 'Alle' },
                            { value: 'upcoming', label: 'Aankomend' },
                            { value: 'past', label: 'Verleden' },
                        ]}
                    />
                </SimpleGrid>
            </Grid.Col>
        </Grid>
    );
}
