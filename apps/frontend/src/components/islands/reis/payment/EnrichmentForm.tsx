'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Bus, AlertCircle, Briefcase, User } from 'lucide-react';
import {
    Box,
    Divider,
    Group,
    InputWrapper,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/trip.zod';
import { type Trip } from '@salvemundi/validations';

interface EnrichmentFormProps {
    trip: Trip;
    hideHeader?: boolean;
}

const parseNlDate = (input: string): string | null => {
    const trimmed = input.trim();
    const nlMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (nlMatch) {
        return `${nlMatch[3]}-${nlMatch[2].padStart(2, '0')}-${nlMatch[1].padStart(2, '0')}`;
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return isoMatch ? trimmed : null;
};

export function EnrichmentForm({ trip, hideHeader = false }: EnrichmentFormProps) {
    const { register, control, formState: { errors } } = useFormContext<ReisPaymentEnrichment>();

    return (
        <Stack gap="lg">
            <TextInput type="hidden" display="none" {...register('is_bus_trip')} />
            {!hideHeader && (
                <Stack gap={4}>
                    <Group gap="sm">
                        <Text span c="brand" lh={1}>
                            <User size={26} />
                        </Text>
                        <Title order={2} size="h2">
                            Reisgegevens
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Vul je gegevens aan voor <Text span fw={700} c="brand">{trip.name}</Text>.
                    </Text>
                    <Divider mt="sm" />
                </Stack>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                <Stack gap={4}>
                    <TextInput
                        id="first_name"
                        label="Voornaam (zoals op ID/Paspoort)"
                        required
                        placeholder="Volledige voornaam"
                        autoComplete="one-time-code"
                        rightSection={
                            <Text span c="error" lh={1}>
                                <AlertCircle size={18} />
                            </Text>
                        }
                        error={errors.first_name?.message}
                        {...register('first_name')}
                    />
                    <Text size="xs" fw={700} c="error">
                        → LET OP: MOET EXACT OVEREENKOMEN MET JE ID-BEWIJS!
                    </Text>
                </Stack>

                <TextInput
                    id="last_name"
                    label="Achternaam"
                    required
                    placeholder="Achternaam"
                    error={errors.last_name?.message}
                    {...register('last_name')}
                />

                <Controller
                    name="date_of_birth"
                    control={control}
                    render={({ field }) => (
                        <DateInput
                            id="date_of_birth"
                            label="Geboortedatum"
                            required
                            value={field.value || null}
                            onChange={(val) => field.onChange(val ?? '')}
                            valueFormat="DD-MM-YYYY"
                            dateParser={parseNlDate}
                            placeholder="dd-mm-jjjj"
                            autoComplete="off"
                            error={errors.date_of_birth?.message}
                        />
                    )}
                />

                <InputWrapper
                    id="phone_number"
                    label="Telefoonnummer"
                    required
                    error={errors.phone_number?.message}
                >
                    <Controller
                        name="phone_number"
                        control={control}
                        render={({ field }) => (
                            <PhoneInput
                                {...field}
                                id="phone_number"
                                error={!!errors.phone_number}
                            />
                        )}
                    />
                </InputWrapper>

                {!trip.is_bus_trip && (
                    <>
                        <Controller
                            name="id_document"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    id="id_document"
                                    label="ID Document Type"
                                    required
                                    data={[
                                        { value: 'none', label: 'Maak een keuze...' },
                                        { value: 'id_card', label: 'ID-kaart' },
                                        { value: 'passport', label: 'Paspoort' },
                                    ]}
                                    value={field.value}
                                    onChange={(val) => field.onChange((val ?? 'none') as ReisPaymentEnrichment['id_document'])}
                                    allowDeselect={false}
                                    error={errors.id_document?.message}
                                />
                            )}
                        />

                        <TextInput
                            id="document_number"
                            label="Documentnummer"
                            required
                            placeholder="Bijv. ABC123456"
                            autoComplete="off"
                            minLength={6}
                            maxLength={12}
                            error={errors.document_number?.message}
                            {...register('document_number')}
                        />

                        <Controller
                            name="document_expiry_date"
                            control={control}
                            render={({ field }) => (
                                <DateInput
                                    id="document_expiry_date"
                                    label="Vervaldatum Document"
                                    required
                                    value={field.value || null}
                                    onChange={(val) => field.onChange(val ?? '')}
                                    valueFormat="DD-MM-YYYY"
                                    dateParser={parseNlDate}
                                    placeholder="dd-mm-jjjj"
                                    autoComplete="off"
                                    error={errors.document_expiry_date?.message}
                                />
                            )}
                        />
                    </>
                )}

                <Textarea
                    id="allergies"
                    label="Allergieën & Medisch"
                    placeholder="Bijv. Notenallergie, medicijngebruik..."
                    minRows={3}
                    autosize
                    autoComplete="off"
                    error={errors.allergies?.message}
                    {...register('allergies')}
                />

                <Textarea
                    id="special_notes"
                    label="Speciale Opmerkingen"
                    placeholder="Overige zaken..."
                    minRows={3}
                    autosize
                    autoComplete="off"
                    error={errors.special_notes?.message}
                    {...register('special_notes')}
                />

                <Box style={{ gridColumn: '1 / -1' }}>
                    {trip.is_bus_trip ? (
                        <Paper p="md" withBorder>
                            <Group justify="space-between" align="center" gap="md">
                                <Group gap="sm">
                                    <ThemeIcon size="lg">
                                        <Bus size={20} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text size="sm" fw={700}>
                                            Vrijwillige Chauffeur?
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Bereid om een busje te rijden.
                                        </Text>
                                    </Stack>
                                </Group>
                                <Controller
                                    name="willing_to_drive"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={Boolean(field.value)}
                                            onChange={(e) => field.onChange(e.currentTarget.checked)}
                                            aria-label="Vrijwillige chauffeur"
                                        />
                                    )}
                                />
                            </Group>
                        </Paper>
                    ) : (
                        <Paper p="md" withBorder>
                            <Group justify="space-between" align="center" gap="md">
                                <Group gap="sm">
                                    <ThemeIcon size="lg">
                                        <Briefcase size={20} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text size="sm" fw={700}>
                                            Extra Koffer?
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Ik wil een grote koffer meenemen.
                                        </Text>
                                    </Stack>
                                </Group>
                                <Controller
                                    name="extra_luggage"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={Boolean(field.value)}
                                            onChange={(e) => field.onChange(e.currentTarget.checked)}
                                            aria-label="Extra koffer meenemen"
                                        />
                                    )}
                                />
                            </Group>
                        </Paper>
                    )}
                </Box>
            </SimpleGrid>
        </Stack>
    );
}
