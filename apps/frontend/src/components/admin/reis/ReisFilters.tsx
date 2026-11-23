'use client';

import { Search, Download, Mail, Compass } from 'lucide-react';
import Link from 'next/link';
import { Button, Group, Paper, Select, TextInput } from '@mantine/core';

interface ReisFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    roleFilter: string;
    onRoleChange: (value: string) => void;
    onDownloadCSV: () => void;
    tripId: number;
}

const statusOptions = [
    { value: 'all', label: 'Alle statussen' },
    { value: 'registered', label: 'Geregistreerd' },
    { value: 'confirmed', label: 'Bevestigd' },
    { value: 'waitlist', label: 'Wachtlijst' },
    { value: 'cancelled', label: 'Geannuleerd' }
];

const roleOptions = [
    { value: 'all', label: 'Alle rollen' },
    { value: 'participant', label: 'Deelnemers' },
    { value: 'crew', label: 'Crew' },
    { value: 'driver', label: 'Bestuurders' }
];

export default function ReisFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    roleFilter,
    onRoleChange,
    onDownloadCSV,
    tripId
}: ReisFiltersProps) {
    return (
        <Paper withBorder p="sm">
            <Group gap="sm" wrap="wrap" align="center">
                <TextInput
                    placeholder="Zoek deelnemers..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                    leftSection={<Search size={16} />}
                    style={{ flex: 1, minWidth: 200 }}
                />

                <Select
                    value={statusFilter}
                    onChange={(val) => {
                        if (val !== null) onStatusChange(val);
                    }}
                    data={statusOptions}
                    size="sm"
                    allowDeselect={false}
                    w={{ base: '100%', sm: 176 }}
                />

                <Select
                    value={roleFilter}
                    onChange={(val) => {
                        if (val !== null) onRoleChange(val);
                    }}
                    data={roleOptions}
                    size="sm"
                    allowDeselect={false}
                    w={{ base: '100%', sm: 160 }}
                />

                <Group gap="xs" wrap="wrap" justify="center">
                    <Button
                        component={Link}
                        href={`/beheer/reis/activiteiten?tripId=${tripId}`}
                        size="sm"
                        leftSection={<Compass size={14} />}
                    >
                        Activiteiten
                    </Button>
                    <Button
                        component={Link}
                        href="/beheer/reis/mail"
                        size="sm"
                        leftSection={<Mail size={14} />}
                    >
                        Mailen
                    </Button>
                    <Button
                        type="button"
                        color="success"
                        size="sm"
                        onClick={onDownloadCSV}
                        leftSection={<Download size={14} />}
                    >
                        Exporteer CSV
                    </Button>
                </Group>
            </Group>
        </Paper>
    );
}
