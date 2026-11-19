'use client';

import { Search, UserCheck, UserMinus, Download, Bell } from 'lucide-react';
import { Button, Group, Loader, Tabs, TextInput } from '@mantine/core';

interface LedenFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    activeTab: 'active' | 'inactive';
    onTabChange: (tab: 'active' | 'inactive') => void;
    isPending: boolean;
    onExport?: () => void;
    onReminder?: () => void;
    isSendingReminder?: boolean;
}

export default function LedenFilters({
    searchQuery,
    onSearchChange,
    activeTab,
    onTabChange,
    isPending,
    onExport,
    onReminder,
    isSendingReminder,
}: LedenFiltersProps) {
    return (
        <Group justify="space-between" wrap="wrap" gap="md" mb="lg">
            <Tabs
                value={activeTab}
                onChange={(val) => onTabChange((val as 'active' | 'inactive' | null) ?? 'active')}
                variant="pills"
            >
                <Tabs.List>
                    <Tabs.Tab value="active" leftSection={<UserCheck size={16} />}>
                        Actief
                    </Tabs.Tab>
                    <Tabs.Tab value="inactive" leftSection={<UserMinus size={16} />}>
                        Verlopen
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>

            <Group gap="sm" wrap="wrap" flex={{ base: 1, lg: 'initial' }} justify="flex-end">
                <TextInput
                    placeholder="Zoek op naam of email..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    leftSection={<Search size={16} />}
                    rightSection={isPending ? <Loader size={14} /> : undefined}
                    autoComplete="off"
                    w={{ base: '100%', sm: 280 }}
                />

                {onExport && (
                    <Button
                        type="button"
                        variant="default"
                        onClick={onExport}
                        leftSection={<Download size={16} />}
                    >
                        Export
                    </Button>
                )}

                {onReminder && (
                    <Button
                        type="button"
                        onClick={onReminder}
                        loading={isSendingReminder}
                        leftSection={<Bell size={16} />}
                    >
                        Herinnering
                    </Button>
                )}
            </Group>
        </Group>
    );
}
