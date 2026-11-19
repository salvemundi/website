'use client';

import { Layout, Filter, Search, Users } from 'lucide-react';
import { Badge, GridCol, Group, Paper, ScrollArea, Select, Stack, Text, TextInput } from '@mantine/core';
import type { Trip, TripSignup } from '@salvemundi/validations';
import { Card, FilterField } from './MailComponents';

interface MailFiltersProps {
    trips: Trip[];
    selectedTripId: number;
    onTripChange: (id: number) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterRole: string;
    setFilterRole: (role: string) => void;
    filterPayment: string;
    setFilterPayment: (paymentStatus: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredCount: number;
    filteredRecipients: TripSignup[];
}

const statusOptions = [
    { value: 'all', label: 'Alle Statussen' },
    { value: 'registered', label: 'Geregistreerd' },
    { value: 'confirmed', label: 'Bevestigd' },
    { value: 'waitlist', label: 'Wachtlijst' },
    { value: 'cancelled', label: 'Geannuleerd' }
];

const roleOptions = [
    { value: 'all', label: 'Alle Rollen' },
    { value: 'participant', label: 'Deelnemer' },
    { value: 'crew', label: 'Crew' }
];

const paymentOptions = [
    { value: 'all', label: 'Alle Betalingen' },
    { value: 'unpaid', label: 'Onbetaald' },
    { value: 'deposit_paid', label: 'Aanbetaling OK' },
    { value: 'full_paid', label: 'Volledig OK' }
];

function getStatusBadgeProps(status: string): { color: string; label: string } {
    switch (status) {
        case 'confirmed':
            return { color: 'success', label: 'Bevestigd' };
        case 'cancelled':
            return { color: 'error', label: 'Geannuleerd' };
        case 'waitlist':
            return { color: 'accent', label: 'Wachtlijst' };
        default:
            return { color: 'brand', label: 'Geregistreerd' };
    }
}

export default function MailFilters({
    trips,
    selectedTripId,
    onTripChange,
    filterStatus,
    setFilterStatus,
    filterRole,
    setFilterRole,
    filterPayment,
    setFilterPayment,
    searchTerm,
    setSearchTerm,
    filteredCount,
    filteredRecipients
}: MailFiltersProps) {
    const tripOptions = trips.map(trip => ({
        value: String(trip.id),
        label: trip.name || 'Onbekende reis'
    }));

    return (
        <GridCol span={{ base: 12, lg: 3 }}>
            <Stack gap="lg">
                <Card title="Selecteer Reis" icon={<Layout size={16} />}>
                <Select
                    value={String(selectedTripId)}
                    onChange={(val) => {
                        if (val) onTripChange(Number(val));
                    }}
                    data={tripOptions}
                    size="sm"
                    allowDeselect={false}
                />
            </Card>

            <Card title="Ontvangers Filter" icon={<Filter size={16} />}>
                <Stack gap="md">
                    <FilterField label="Status" value={filterStatus} onChange={setFilterStatus} options={statusOptions} />
                    <FilterField label="Rol" value={filterRole} onChange={setFilterRole} options={roleOptions} />
                    <FilterField label="Betaling" value={filterPayment} onChange={setFilterPayment} options={paymentOptions} />
                    <TextInput
                        placeholder="Zoek deelnemer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        leftSection={<Search size={16} />}
                    />
                </Stack>
            </Card>

            <Paper withBorder radius="lg" p="lg">
                <Stack gap={4}>
                    <Group gap="sm">
                        <Text span c="accent" lh={1}>
                            <Users size={20} />
                        </Text>
                        <Text size="xl" fw={700}>
                            {filteredCount}
                        </Text>
                    </Group>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>
                        Ontvangers geselecteerd
                    </Text>
                </Stack>
            </Paper>

            <Card title="Geselecteerde Ontvangers" icon={<Users size={16} />}>
                <ScrollArea.Autosize mah={250}>
                    {filteredRecipients.length === 0 ? (
                        <Text size="xs" c="dimmed" fs="italic" ta="center" py="md">
                            Geen ontvangers geselecteerd
                        </Text>
                    ) : (
                        <Stack gap="xs">
                            {filteredRecipients.map(recipient => {
                                const badge = getStatusBadgeProps(recipient.status);
                                return (
                                    <Paper key={recipient.id} withBorder radius="md" p="xs">
                                        <Group justify="space-between" wrap="nowrap" gap="xs">
                                            <Text size="xs" fw={700} truncate="end">
                                                {recipient.first_name} {recipient.last_name}
                                            </Text>
                                            <Badge color={badge.color} variant="light" size="xs">
                                                {badge.label}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed" truncate="end" mt={2}>
                                            {recipient.email}
                                        </Text>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </ScrollArea.Autosize>
            </Card>
            </Stack>
        </GridCol>
    );
}
