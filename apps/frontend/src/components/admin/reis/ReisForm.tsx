'use client';

import { useState, useEffect, useActionState } from 'react';
import { CalendarIcon, Euro, Info } from 'lucide-react';
import {
    Alert,
    Box,
    Card,
    Divider,
    Grid,
    Group,
    NumberInput,
    SimpleGrid,
    Stack,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { DateInput, DateTimePicker } from '@mantine/dates';
import type { Trip } from '@salvemundi/validations';
import ReisFormSidebar from './ReisFormSidebar';
import { createTrip, updateTrip } from '@/server/actions/beheer/reis/beheer-reis-core.actions';
import { toISODate } from '@/lib/utils/date-utils';

interface ActionState {
    success: boolean;
    id?: number;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: Record<string, string | number | boolean | File | null | undefined>;
}

interface ReisFormProps {
    editingTrip: Trip | null;
    isAdding: boolean;
    onCancel: () => void;
    onSuccess: (message: string) => void;
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

const toNumberOrUndefined = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const toLocalISO = (d: string | Date | null | undefined) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toAmsterdamLocalString = (val: string | null): string => {
    if (!val) return '';
    return val.replace(' ', 'T').slice(0, 16);
};

export default function ReisForm({
    editingTrip,
    isAdding,
    onCancel,
    onSuccess
}: ReisFormProps) {
    const [createState, createAction, isCreating] = useActionState<ActionState | null, FormData>(createTrip, null);
    const [updateState, updateAction, isUpdating] = useActionState<ActionState | null, FormData>(updateTrip, null);

    const state = editingTrip ? updateState : createState;
    const pending = editingTrip ? isUpdating : isCreating;

    useEffect(() => {
        if (state?.success) {
            onSuccess(editingTrip ? 'Reis succesvol bijgewerkt' : 'Reis succesvol aangemaakt');
        }
    }, [state, editingTrip, onSuccess]);

    const [imagePreview, setImagePreview] = useState<string | { id: string; type?: string | null } | null>(null);
    const [existingImageId, setExistingImageId] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [registrationOpen, setRegistrationOpen] = useState(false);
    const [allowFinalPayments, setAllowFinalPayments] = useState(false);
    const [allowDepositPayments, setAllowDepositPayments] = useState(false);
    const [isBusTrip, setIsBusTrip] = useState(false);
    const [startDate, setStartDate] = useState<string | null>(() => {
        const d = (editingTrip?.start_date as string) || (state?.initialData?.start_date as string);
        return toISODate(d) || null;
    });
    const [endDate, setEndDate] = useState<string | null>(() => {
        const d = (editingTrip?.end_date as string) || (state?.initialData?.end_date as string);
        return toISODate(d) || null;
    });
    const [regStartDate, setRegStartDate] = useState<string | null>(() => {
        const d = (state?.initialData?.registration_start_date as string) || toLocalISO(editingTrip?.registration_start_date);
        return d || null;
    });

    useEffect(() => {
        if (editingTrip) {
            setStartDate(toISODate(editingTrip.start_date) || null);
            setEndDate(toISODate(editingTrip.end_date) || null);
            setRegStartDate(toLocalISO(editingTrip.registration_start_date) || null);
        }
    }, [editingTrip]);

    useEffect(() => {
        if (editingTrip) {
            if (editingTrip.image) {
                const rawImage = editingTrip.image as unknown as string | { id: string; type?: string | null } | null;
                const imageId = rawImage && typeof rawImage === 'object' ? rawImage.id : (rawImage as string | null);
                setImagePreview(rawImage);
                setExistingImageId(imageId);
            } else {
                setExistingImageId(null);
            }
            setRegistrationOpen(!!editingTrip.registration_open);
            setAllowFinalPayments(!!editingTrip.allow_final_payments);
            setAllowDepositPayments(!!editingTrip.allow_deposit_payments);
            setIsBusTrip(!!editingTrip.is_bus_trip);
        }

        if (state?.initialData) {
            const d = state.initialData;
            setRegistrationOpen(d.registration_open === 'on' || d.registration_open === 'true' || d.registration_open === true);
            setAllowFinalPayments(d.allow_final_payments === 'on' || d.allow_final_payments === 'true' || d.allow_final_payments === true);
            setAllowDepositPayments(d.allow_deposit_payments === 'on' || d.allow_deposit_payments === 'true' || d.allow_deposit_payments === true);
            setIsBusTrip(d.is_bus_trip === 'on' || d.is_bus_trip === 'true' || d.is_bus_trip === true);
        }
    }, [editingTrip, state]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setImageError(null);

        if (file) {
            const maxSizeBytes = 10 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                setImageError('Het geselecteerde bestand is te groot (maximaal 10MB).');
                e.target.value = '';
                return;
            }

            setExistingImageId(null);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageError(null);
        setExistingImageId(null);
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        if (imageError) {
            e.preventDefault();
            return;
        }

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const file = formData.get('image_file') as File | null;

        if (file && file.size > 10 * 1024 * 1024) {
            e.preventDefault();
            setImageError('Het bestand is te groot om te uploaden (maximaal 10MB).');
        }
    };

    const formErrors = (state?.fieldErrors || {}) as Record<string, string[] | undefined>;

    return (
        <Box mb="xl">
            <form action={editingTrip ? updateAction : createAction} onSubmit={handleSubmit}>
                {editingTrip && <input type="hidden" name="id" value={editingTrip.id} />}
                <input type="hidden" name="registration_open" value={registrationOpen ? 'on' : 'off'} />
                <input type="hidden" name="allow_final_payments" value={allowFinalPayments ? 'on' : 'off'} />
                <input type="hidden" name="allow_deposit_payments" value={allowDepositPayments ? 'on' : 'off'} />
                <input type="hidden" name="is_bus_trip" value={isBusTrip ? 'on' : 'off'} />
                <input type="hidden" name="existing_image_id" value={existingImageId || ''} />

                {imageError && (
                    <Alert color="error" icon={<Info size={16} />} mb="lg">
                        {imageError}
                    </Alert>
                )}

                <Grid gap="lg" align="flex-start">
                    <Grid.Col span={{ base: 12, lg: 8 }}>
                        <Stack gap="lg">
                            <Card withBorder padding="lg">
                                <Group gap="sm" mb="md">
                                    <ThemeIcon size="md" color="accent">
                                        <Info size={16} />
                                    </ThemeIcon>
                                    <Title order={2} size="h5">Algemene Informatie</Title>
                                </Group>
                                <Divider mb="lg" />
                                <Stack gap="md">
                                    <TextInput
                                        id="name"
                                        name="name"
                                        label="Naam van de reis"
                                        required
                                        autoComplete="off"
                                        placeholder="Bijv. Skiereis 2025"
                                        defaultValue={(state?.initialData?.name as string | undefined) ?? editingTrip?.name ?? undefined}
                                        error={formErrors.name?.[0]}
                                    />

                                    <Textarea
                                        id="description"
                                        name="description"
                                        label="Beschrijving"
                                        rows={4}
                                        placeholder="Wat gaan we beleven op deze reis?"
                                        defaultValue={(state?.initialData?.description as string | undefined) ?? editingTrip?.description ?? undefined}
                                        error={formErrors.description?.[0]}
                                    />
                                </Stack>
                            </Card>

                            <Card withBorder padding="lg">
                                <Group gap="sm" mb="md">
                                    <ThemeIcon size="md" color="accent">
                                        <CalendarIcon size={16} />
                                    </ThemeIcon>
                                    <Title order={2} size="h5">Planning &amp; Capaciteit</Title>
                                </Group>
                                <Divider mb="lg" />
                                <Stack gap="lg">
                                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                        <Box>
                                            <input type="hidden" name="start_date" value={startDate ?? ''} />
                                            <DateInput
                                                id="start_date"
                                                label="Startdatum"
                                                required
                                                value={startDate}
                                                onChange={setStartDate}
                                                valueFormat="DD-MM-YYYY"
                                                dateParser={parseNlDate}
                                                placeholder="dd-mm-jjjj"
                                                error={formErrors.start_date?.[0]}
                                            />
                                        </Box>
                                        <Box>
                                            <input type="hidden" name="end_date" value={endDate ?? ''} />
                                            <DateInput
                                                id="end_date"
                                                label="Einddatum"
                                                value={endDate}
                                                onChange={setEndDate}
                                                minDate={startDate ?? undefined}
                                                valueFormat="DD-MM-YYYY"
                                                dateParser={parseNlDate}
                                                placeholder="dd-mm-jjjj"
                                                clearable
                                            />
                                        </Box>
                                    </SimpleGrid>

                                    <Divider />

                                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                        <NumberInput
                                            id="max_participants"
                                            name="max_participants"
                                            label="Max. Deelnemers"
                                            required
                                            min={0}
                                            allowDecimal={false}
                                            placeholder="Bijv. 50"
                                            defaultValue={toNumberOrUndefined(state?.initialData?.max_participants ?? editingTrip?.max_participants)}
                                            error={formErrors.max_participants?.[0]}
                                        />
                                        <Box>
                                            <input
                                                type="hidden"
                                                name="registration_start_date"
                                                value={toAmsterdamLocalString(regStartDate)}
                                            />
                                            <DateTimePicker
                                                id="registration_start_date"
                                                label="Auto-open Datum"
                                                placeholder="Kies datum en tijd"
                                                value={regStartDate}
                                                onChange={setRegStartDate}
                                                valueFormat="DD-MM-YYYY HH:mm"
                                                clearable
                                            />
                                        </Box>
                                    </SimpleGrid>
                                </Stack>
                            </Card>

                            <Card withBorder padding="lg">
                                <Group gap="sm" mb="md">
                                    <ThemeIcon size="md" color="accent">
                                        <Euro size={16} />
                                    </ThemeIcon>
                                    <Title order={2} size="h5">Financiën</Title>
                                </Group>
                                <Divider mb="lg" />
                                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                    <NumberInput
                                        id="base_price"
                                        name="base_price"
                                        label="Totale Prijs (€)"
                                        required
                                        step={0.01}
                                        decimalScale={2}
                                        min={0}
                                        placeholder="0.00"
                                        defaultValue={toNumberOrUndefined(state?.initialData?.base_price ?? editingTrip?.base_price)}
                                        error={formErrors.base_price?.[0]}
                                    />
                                    <NumberInput
                                        id="crew_discount"
                                        name="crew_discount"
                                        label="Crewkorting (€)"
                                        step={0.01}
                                        decimalScale={2}
                                        min={0}
                                        placeholder="20.00"
                                        defaultValue={toNumberOrUndefined(state?.initialData?.crew_discount ?? editingTrip?.crew_discount)}
                                        error={formErrors.crew_discount?.[0]}
                                    />
                                    <NumberInput
                                        id="deposit_amount"
                                        name="deposit_amount"
                                        label="Aanbetaling (€)"
                                        required
                                        step={0.01}
                                        decimalScale={2}
                                        min={0}
                                        placeholder="0.00"
                                        defaultValue={toNumberOrUndefined(state?.initialData?.deposit_amount ?? editingTrip?.deposit_amount)}
                                        error={formErrors.deposit_amount?.[0]}
                                    />
                                </SimpleGrid>
                            </Card>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, lg: 4 }}>
                        <ReisFormSidebar
                            isAdding={isAdding}
                            pending={pending}
                            imagePreview={imagePreview}
                            onImageChange={handleImageChange}
                            onRemoveImage={handleRemoveImage}
                            onCancel={onCancel}
                            registrationOpen={registrationOpen}
                            setRegistrationOpen={setRegistrationOpen}
                            allowFinalPayments={allowFinalPayments}
                            setAllowFinalPayments={setAllowFinalPayments}
                            allowDepositPayments={allowDepositPayments}
                            setAllowDepositPayments={setAllowDepositPayments}
                            isBusTrip={isBusTrip}
                            setIsBusTrip={setIsBusTrip}
                            registrationStartDate={editingTrip?.registration_start_date}
                        />
                    </Grid.Col>
                </Grid>
            </form>
        </Box>
    );
}