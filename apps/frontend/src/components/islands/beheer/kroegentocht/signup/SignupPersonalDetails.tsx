'use client';

import { User, Mail, Building2, Tag, Users } from 'lucide-react';
import { Select, SimpleGrid, Stack, TextInput } from '@mantine/core';

interface SignupPersonalDetailsProps {
    formData: {
        name: string;
        email: string;
        association: string;
        payment_status: 'paid' | 'open' | 'failed' | 'canceled' | 'expired';
        amount_tickets: number;
        group_name: string | null;
    };
    setFormData: React.Dispatch<
        React.SetStateAction<{
            name: string;
            email: string;
            association: string;
            payment_status: 'paid' | 'open' | 'failed' | 'canceled' | 'expired';
            amount_tickets: number;
            group_name: string | null;
        }>
    >;
    eventGroups?: string[];
}

const PAYMENT_STATUS_OPTIONS = [
    { value: 'paid', label: 'Betaald' },
    { value: 'open', label: 'Open' },
    { value: 'canceled', label: 'Geannuleerd' },
    { value: 'failed', label: 'Mislukt' },
    { value: 'expired', label: 'Verlopen' },
];

const getGroupOptions = (groups: string[]) => [
    { value: '', label: 'Geen groep (nog niet ingedeeld)' },
    ...groups.map((g) => ({ value: g, label: g })),
];

export default function SignupPersonalDetails({
    formData,
    setFormData,
    eventGroups = [],
}: SignupPersonalDetailsProps) {
    return (
        <Stack gap="md">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                    label="Naam"
                    leftSection={<User size={14} />}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoComplete="off"
                />

                <TextInput
                    label="E-mailadres"
                    type="email"
                    leftSection={<Mail size={14} />}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    autoComplete="off"
                />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                    label="Vereniging"
                    leftSection={<Building2 size={14} />}
                    value={formData.association}
                    onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                    autoComplete="off"
                />

                <Select
                    label="Betaalstatus"
                    leftSection={<Tag size={14} />}
                    value={formData.payment_status}
                    onChange={(val) => {
                        if (val) {
                            setFormData({
                                ...formData,
                                payment_status: val as typeof formData.payment_status,
                            });
                        }
                    }}
                    data={PAYMENT_STATUS_OPTIONS}
                    allowDeselect={false}
                />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Select
                    label="Groepsindeling"
                    leftSection={<Users size={14} />}
                    value={formData.group_name ?? ''}
                    onChange={(val) =>
                        setFormData({ ...formData, group_name: val || null })
                    }
                    data={getGroupOptions(eventGroups)}
                    placeholder="Selecteer groep..."
                />
            </SimpleGrid>
        </Stack>
    );
}
