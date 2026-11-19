'use client';

import { FileText, CreditCard } from 'lucide-react';
import { Group, Stack, Text, Title } from '@mantine/core';
import type { TripSignup } from '@salvemundi/validations';
import { parseBoolean } from '@salvemundi/validations';
import { toISODate, formatShortDate } from '@/lib/utils/date-utils';
import {
    HorizontalInput,
    HorizontalDate,
    HorizontalSelect,
    HorizontalTextarea,
    HorizontalCheckbox,
    HorizontalPhone,
} from './ReisSignupFormFields';

interface CockpitSignupFormProps {
    signup: TripSignup;
    initialData?: Partial<TripSignup>;
    isBusTrip?: boolean;
    section?: 'all' | 'personal' | 'admin' | 'personal_basic' | 'personal_extended';
}

export default function CockpitSignupForm({
    signup,
    initialData,
    isBusTrip,
    section = 'all',
}: CockpitSignupFormProps) {
    return (
        <Stack gap="md">
            {(section === 'all' || section === 'personal' || section === 'personal_basic') && (
                <Stack gap="xs">
                    <Group gap="xs">
                        <Text span c="brand" lh={1}>
                            <FileText size={14} />
                        </Text>
                        <Title order={3} size="h6">
                            Informatie
                        </Title>
                    </Group>
                    <Stack gap={4}>
                        <HorizontalInput
                            label="Voornaam"
                            name="first_name"
                            defaultValue={initialData?.first_name || signup.first_name}
                            required
                        />
                        <HorizontalInput
                            label="Achternaam"
                            name="last_name"
                            defaultValue={initialData?.last_name || signup.last_name}
                            required
                        />
                        <HorizontalInput
                            label="Email"
                            name="email"
                            type="email"
                            defaultValue={initialData?.email || signup.email}
                            required
                        />
                        <HorizontalPhone
                            label="Telefoon"
                            name="phone_number"
                            defaultValue={initialData?.phone_number || signup.phone_number || ''}
                        />
                        <HorizontalDate
                            label="Geb. Datum"
                            name="date_of_birth"
                            defaultValue={
                                initialData?.date_of_birth ||
                                (signup.date_of_birth ? toISODate(signup.date_of_birth) : '')
                            }
                        />
                    </Stack>
                </Stack>
            )}

            {(section === 'all' || section === 'personal' || section === 'personal_extended') && (
                <Stack gap="xs">
                    {section === 'personal_extended' && (
                        <Group gap="xs">
                            <Text span c="brand" lh={1}>
                                <FileText size={14} />
                            </Text>
                            <Title order={3} size="h6">
                                Documenten & Extra
                            </Title>
                        </Group>
                    )}
                    <Stack gap={4}>
                        {!isBusTrip && (
                            <>
                                <HorizontalSelect
                                    label="ID Type"
                                    name="id_document"
                                    defaultValue={
                                        initialData?.id_document || signup.id_document || ''
                                    }
                                >
                                    <option value="">Niet opgegeven</option>
                                    <option value="passport">Paspoort</option>
                                    <option value="id_card">ID Kaart</option>
                                </HorizontalSelect>
                                <HorizontalInput
                                    label="ID Nummer"
                                    name="document_number"
                                    defaultValue={
                                        initialData?.document_number ||
                                        signup.document_number ||
                                        ''
                                    }
                                />
                                <HorizontalDate
                                    label="Vervaldatum"
                                    name="document_expiry_date"
                                    defaultValue={
                                        initialData?.document_expiry_date ||
                                        (signup.document_expiry_date
                                            ? toISODate(signup.document_expiry_date)
                                            : '')
                                    }
                                />
                            </>
                        )}
                        <Stack gap="xs" pt="xs">
                            <HorizontalTextarea
                                label="Allergieën"
                                name="allergies"
                                defaultValue={initialData?.allergies || signup.allergies || ''}
                            />
                            <HorizontalTextarea
                                label="Bijzonderheden"
                                name="special_notes"
                                defaultValue={
                                    initialData?.special_notes || signup.special_notes || ''
                                }
                            />
                        </Stack>
                        <Group gap="lg" pt="xs">
                            {!isBusTrip && (
                                <HorizontalCheckbox
                                    label="Extra Koffer"
                                    name="extra_luggage"
                                    defaultChecked={
                                        initialData
                                            ? parseBoolean(initialData.extra_luggage)
                                            : parseBoolean(signup.extra_luggage)
                                    }
                                />
                            )}
                            {isBusTrip && (
                                <HorizontalCheckbox
                                    label="Chauffeur"
                                    name="willing_to_drive"
                                    defaultChecked={
                                        initialData
                                            ? parseBoolean(initialData.willing_to_drive)
                                            : parseBoolean(signup.willing_to_drive)
                                    }
                                />
                            )}
                        </Group>
                    </Stack>
                </Stack>
            )}

            {(section === 'all' || section === 'admin') && (
                <Stack gap="xs">
                    <Group gap="xs">
                        <Text span c="brand" lh={1}>
                            <CreditCard size={14} />
                        </Text>
                        <Title order={3} size="h6">
                            Beheer
                        </Title>
                    </Group>
                    <Stack gap={4}>
                        <HorizontalSelect
                            label="Status"
                            name="status"
                            defaultValue={initialData?.status || signup.status}
                        >
                            <option value="registered">Geregistreerd</option>
                            <option value="confirmed">Bevestigd</option>
                            <option value="waitlist">Wachtlijst</option>
                            <option value="cancelled">Geannuleerd</option>
                        </HorizontalSelect>
                        <HorizontalSelect
                            label="Rol"
                            name="role"
                            defaultValue={initialData?.role || signup.role}
                        >
                            <option value="participant">Regulier</option>
                            <option value="crew">Crew</option>
                        </HorizontalSelect>
                        <Stack gap="xs" pt="sm">
                            <Group justify="space-between">
                                <HorizontalCheckbox
                                    label="Aanbetaling"
                                    name="deposit_paid"
                                    defaultChecked={
                                        initialData
                                            ? parseBoolean(initialData.deposit_paid)
                                            : parseBoolean(signup.deposit_paid)
                                    }
                                />
                                {signup.deposit_paid_at && (
                                    <Text size="xs" c="dimmed">
                                        {formatShortDate(new Date(signup.deposit_paid_at))}
                                    </Text>
                                )}
                            </Group>
                            <Group justify="space-between">
                                <HorizontalCheckbox
                                    label="Restbetaling"
                                    name="full_payment_paid"
                                    defaultChecked={
                                        initialData
                                            ? parseBoolean(initialData.full_payment_paid)
                                            : parseBoolean(signup.full_payment_paid)
                                    }
                                />
                                {signup.full_payment_paid_at && (
                                    <Text size="xs" c="dimmed">
                                        {formatShortDate(new Date(signup.full_payment_paid_at))}
                                    </Text>
                                )}
                            </Group>
                        </Stack>
                    </Stack>
                </Stack>
            )}
        </Stack>
    );
}
