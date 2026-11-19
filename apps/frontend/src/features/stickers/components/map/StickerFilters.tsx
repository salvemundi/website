'use client';

import { Search } from 'lucide-react';
import { Card, Group, Stack, Text, TextInput } from '@mantine/core';

interface StickerFiltersProps {
    filterCountry: string;
    setFilterCountry: (val: string) => void;
    filterCity: string;
    setFilterCity: (val: string) => void;
}

export default function StickerFilters({
    filterCountry,
    setFilterCountry,
    filterCity,
    setFilterCity,
}: StickerFiltersProps) {
    return (
        <Card p="md" radius="lg" shadow="xl" style={{ pointerEvents: 'auto' }}>
            <Stack gap="sm">
                <Group gap="xs">
                    <Text span c="brand" lh={1}>
                        <Search size={16} />
                    </Text>
                    <Text size="xs" fw={900} tt="uppercase" style={{ letterSpacing: '0.1em' }}>
                        Filteren
                    </Text>
                </Group>
                <TextInput
                    size="xs"
                    placeholder="Land..."
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.currentTarget.value)}
                />
                <TextInput
                    size="xs"
                    placeholder="Stad..."
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.currentTarget.value)}
                />
            </Stack>
        </Card>
    );
}
