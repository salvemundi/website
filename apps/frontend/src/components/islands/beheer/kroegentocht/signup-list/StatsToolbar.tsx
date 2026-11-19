'use client';

import { useState } from 'react';
import {
    Beer,
    Download,
    Grid,
    Search,
    Table as TableIcon,
    Users,
    Building2,
    ChevronDown,
    UserPlus,
} from 'lucide-react';
import {
    Button,
    Card,
    Checkbox,
    Divider,
    Group,
    Popover,
    ScrollArea,
    Stack,
    Tabs,
    Text,
    TextInput,
} from '@mantine/core';

interface StatsToolbarProps {
    viewMode: 'table' | 'groups';
    setViewMode: (mode: 'table' | 'groups') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    enabledGroups: string[];
    setEnabledGroups: (groups: string[]) => void;
    totalTicketsCount: number;
    totalAssociationsCount: number;
    groupNames: string[];
    isPending: boolean;
    onAutoDistribute: () => void;
    onExportCSV: () => void;
    onAddParticipant: () => void;
    hasSignups: boolean;
}

export default function StatsToolbar({
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    enabledGroups,
    setEnabledGroups,
    totalTicketsCount,
    totalAssociationsCount,
    groupNames,
    isPending,
    onAutoDistribute,
    onExportCSV,
    onAddParticipant,
    hasSignups,
}: StatsToolbarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isAllSelected = enabledGroups.length === groupNames.length + 1;
    const isUnassignedSelected = enabledGroups.includes('unassigned');

    const dropdownLabel = isAllSelected
        ? 'Alle groepen'
        : enabledGroups.length === 0
          ? 'Geen groepen'
          : enabledGroups.length === 1
            ? enabledGroups[0] === 'unassigned'
                ? 'Niet ingedeeld'
                : enabledGroups[0]
            : `${enabledGroups.length} geselecteerd`;

    return (
        <Card p="lg" shadow="sm">
            <Stack gap="md">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Tabs
                            value={viewMode}
                            onChange={(val) =>
                                setViewMode((val as 'table' | 'groups' | null) ?? 'groups')
                            }
                            variant="pills"
                        >
                            <Tabs.List>
                                <Tabs.Tab value="groups" leftSection={<Grid size={16} />}>
                                    Groepen Weergave
                                </Tabs.Tab>
                                <Tabs.Tab value="table" leftSection={<TableIcon size={16} />}>
                                    Tabel Weergave
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs>

                        <Divider orientation="vertical" visibleFrom="sm" />

                        <Group gap="md">
                            <Group gap={6}>
                                <Text span c="brand" lh={1}>
                                    <Beer size={15} />
                                </Text>
                                <Text size="xs" fw={600} c="dimmed">
                                    Tickets:{' '}
                                    <Text span fw={700} c="var(--mantine-color-text)">
                                        {totalTicketsCount}
                                    </Text>
                                </Text>
                            </Group>
                            <Group gap={6}>
                                <Text span c="success" lh={1}>
                                    <Building2 size={15} />
                                </Text>
                                <Text size="xs" fw={600} c="dimmed">
                                    Verenigingen:{' '}
                                    <Text span fw={700} c="var(--mantine-color-text)">
                                        {totalAssociationsCount}
                                    </Text>
                                </Text>
                            </Group>
                        </Group>
                    </Group>

                    <Group gap="sm" wrap="wrap">
                        <Button
                            type="button"
                            size="xs"
                            onClick={onAddParticipant}
                            leftSection={<UserPlus size={16} />}
                        >
                            Deelnemer Toevoegen
                        </Button>

                        {groupNames.length > 0 && (
                            <Button
                                type="button"
                                size="xs"
                                variant="default"
                                onClick={onAutoDistribute}
                                disabled={isPending || !hasSignups}
                            >
                                Automatisch verdelen
                            </Button>
                        )}

                        <Button
                            type="button"
                            size="xs"
                            color="success"
                            onClick={onExportCSV}
                            disabled={!hasSignups}
                            leftSection={<Download size={16} />}
                        >
                            Exporteer CSV
                        </Button>
                    </Group>
                </Group>

                <Group gap="md" wrap="wrap">
                    <TextInput
                        flex={1}
                        miw={240}
                        placeholder="Zoek op naam, e-mail of vereniging..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftSection={<Search size={16} />}
                        autoComplete="off"
                        spellCheck={false}
                    />

                    <Popover
                        opened={isDropdownOpen}
                        onChange={setIsDropdownOpen}
                        width={260}
                        position="bottom-end"
                        shadow="md"
                    >
                        <Popover.Target>
                            <Button
                                type="button"
                                variant="default"
                                w={{ base: '100%', md: 256 }}
                                justify="space-between"
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                leftSection={
                                    <Text span c="brand" lh={1}>
                                        <Users size={16} />
                                    </Text>
                                }
                                rightSection={<ChevronDown size={16} />}
                            >
                                <Text size="xs" fw={600} truncate>
                                    {dropdownLabel}
                                </Text>
                            </Button>
                        </Popover.Target>

                        <Popover.Dropdown p="xs">
                            <ScrollArea.Autosize mah={300}>
                                <Stack gap={4}>
                                    <Button
                                        type="button"
                                        variant={isAllSelected ? 'light' : 'subtle'}
                                        size="xs"
                                        justify="space-between"
                                        fullWidth
                                        onClick={() => {
                                            const allOptions = [...groupNames, 'unassigned'];
                                            if (isAllSelected) {
                                                setEnabledGroups([]);
                                            } else {
                                                setEnabledGroups(allOptions);
                                            }
                                        }}
                                        rightSection={
                                            <Checkbox
                                                checked={isAllSelected}
                                                readOnly
                                                size="xs"
                                                tabIndex={-1}
                                            />
                                        }
                                    >
                                        Alle groepen
                                    </Button>

                                    <Button
                                        type="button"
                                        variant={isUnassignedSelected ? 'light' : 'subtle'}
                                        size="xs"
                                        justify="space-between"
                                        fullWidth
                                        onClick={() => {
                                            if (isUnassignedSelected) {
                                                setEnabledGroups(
                                                    enabledGroups.filter((g) => g !== 'unassigned')
                                                );
                                            } else {
                                                setEnabledGroups([...enabledGroups, 'unassigned']);
                                            }
                                        }}
                                        rightSection={
                                            <Checkbox
                                                checked={isUnassignedSelected}
                                                readOnly
                                                size="xs"
                                                tabIndex={-1}
                                            />
                                        }
                                    >
                                        Niet ingedeeld
                                    </Button>

                                    {groupNames.map((name) => {
                                        const isSelected = enabledGroups.includes(name);
                                        return (
                                            <Button
                                                key={name}
                                                type="button"
                                                variant={isSelected ? 'light' : 'subtle'}
                                                size="xs"
                                                justify="space-between"
                                                fullWidth
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setEnabledGroups(
                                                            enabledGroups.filter((g) => g !== name)
                                                        );
                                                    } else {
                                                        setEnabledGroups([...enabledGroups, name]);
                                                    }
                                                }}
                                                rightSection={
                                                    <Checkbox
                                                        checked={isSelected}
                                                        readOnly
                                                        size="xs"
                                                        tabIndex={-1}
                                                    />
                                                }
                                            >
                                                {name}
                                            </Button>
                                        );
                                    })}
                                </Stack>
                            </ScrollArea.Autosize>
                        </Popover.Dropdown>
                    </Popover>
                </Group>
            </Stack>
        </Card>
    );
}
