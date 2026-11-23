'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Anchor, Box, Button, Checkbox, InputWrapper, Paper, Stack, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createTripSignup } from '@/server/actions/events/reis/reis-public.actions';
import type { Trip } from '@salvemundi/validations/schema/beheer-trip.zod';
import { reisSignupFormSchema, type ReisSignupForm } from '@salvemundi/validations/schema/trip.zod';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { AlertCircle, ArrowRight, Calendar } from 'lucide-react';
import { NameConfirmModal } from './shared/NameConfirmModal';
import { RegistrationSuccess } from './registration/RegistrationSuccess';
import { RegistrationClosed } from './registration/RegistrationClosed';
import { type EnrichedUser } from '@/types/auth';

interface ReisRegistrationFormProps {
    nextTrip: Trip | null;
    canSignUp: boolean;
    registrationStartText: string;
    currentUser: EnrichedUser | null;
    onRefresh?: () => void;
    termsFileUrl?: string | null;
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

export function ReisRegistrationForm({
    nextTrip,
    canSignUp,
    registrationStartText,
    currentUser,
    onRefresh,
    termsFileUrl
}: ReisRegistrationFormProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useAdminToast();
    const [showNameConfirm, setShowNameConfirm] = useState(false);
    const [pendingData, setPendingData] = useState<ReisSignupForm | null>(null);

    const formatDateForInput = (dateStr?: string | null) => {
        if (!dateStr) return '';
        return toLocalISOString(dateStr) || '';
    };

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState
    } = useForm<ReisSignupForm>({
        resolver: zodResolver(reisSignupFormSchema),
        defaultValues: {
            trip_id: nextTrip?.id || 0,
            /*
             * We intentionally leave the first name empty even if the user is logged in.
             * This forces the user to look at their passport and type it manually
             * to prevent mismatches with airline tickets.
             */
            first_name: '',
            last_name: currentUser?.last_name || '',
            email: currentUser?.email || '',
            phone_number: formatPhoneNumber(currentUser?.phone_number),
            date_of_birth: formatDateForInput(currentUser?.date_of_birth),
            terms_accepted: false
        }
    });

    const firstName = watch('first_name');
    const { errors } = formState;

    const onSubmit = (data: ReisSignupForm) => {
        setPendingData(data);
        setShowNameConfirm(true);
    };

    const confirmAndSubmit = async () => {
        if (!nextTrip || !pendingData) return;

        setShowNameConfirm(false);
        setLoading(true);
        try {
            const result = await createTripSignup(pendingData, nextTrip.id);
            if (!result.success) {
                showToast(result.message || 'Fout bij inschrijven.', 'error');
            } else {
                setIsSuccess(true);
                showToast('Je bent succesvol ingeschreven!', 'success');

                if (currentUser && onRefresh) {
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        onRefresh();
                    }, 1000);
                }
            }
        } catch {
            showToast('Er is een onverwachte fout opgetreden bij het verzenden.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <RegistrationSuccess
                currentUser={currentUser}
                email={pendingData?.email}
            />
        );
    }

    if (!nextTrip) {
        return (
            <Paper
                p="xl"
                withBorder
                ta="center"
                style={{
                    backgroundColor: 'var(--surface-subtle)',
                    borderColor: 'var(--surface-subtle)',
                }}
            >
                <Stack align="center" gap="sm" py="md">
                    <ThemeIcon size="xl">
                        <Calendar size={32} />
                    </ThemeIcon>
                    <Title order={2} size="h3" c="brand">
                        Geen reis gepland
                    </Title>
                    <Text size="sm" c="dimmed" maw={320}>
                        Momenteel is er geen reis gepland. Houd deze pagina in de gaten voor nieuwe data!
                    </Text>
                </Stack>
            </Paper>
        );
    }

    if (!canSignUp) {
        return <RegistrationClosed registrationStartText={registrationStartText} />;
    }

    return (
        <>
            <NameConfirmModal
                isOpen={showNameConfirm}
                name={firstName}
                onConfirm={() => { void confirmAndSubmit(); }}
                onCancel={() => setShowNameConfirm(false)}
            />

            <Box
                component="form"
                onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
                autoComplete="off"
                suppressHydrationWarning
            >
                <Stack gap="md">
                    <Text size="sm" fw={500} c="dimmed">
                        Let op: dit is een vrijblijvende aanmelding. De daadwerkelijke betaling volgt later.
                    </Text>

                    <Stack gap="xs">
                        <TextInput
                            id="field-first_name"
                            label="Voornaam"
                            required
                            placeholder="Voornaam"
                            autoComplete="one-time-code"
                            error={errors.first_name?.message}
                            {...register('first_name')}
                        />
                        <Alert icon={<AlertCircle size={16} />}>
                            <Text size="xs" fw={600}>
                                <Text span fw={700} c="brand">LET OP:</Text> Gebruik je volledige voornaam zoals op je paspoort/ID. Dit is essentieel voor je ticket!
                            </Text>
                        </Alert>
                    </Stack>

                    <TextInput
                        id="field-last_name"
                        label="Tussenvoegsel & Achternaam"
                        required
                        placeholder="Achternaam (incl. tussenvoegsel)"
                        autoComplete="off"
                        error={errors.last_name?.message}
                        {...register('last_name')}
                    />

                    <TextInput
                        id="field-email"
                        type="email"
                        label="E-mailadres"
                        required
                        placeholder="jouw@email.nl"
                        autoComplete="off"
                        data-lpignore="true"
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <Controller
                        name="date_of_birth"
                        control={control}
                        render={({ field }) => (
                            <DateInput
                                id="field-date_of_birth"
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
                        id="field-phone_number"
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
                                    id="field-phone_number"
                                    placeholder="06 12345678"
                                    autoComplete="off"
                                    error={!!errors.phone_number}
                                />
                            )}
                        />
                    </InputWrapper>

                    <Controller
                        name="terms_accepted"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                id="terms_accepted"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.currentTarget.checked)}
                                error={errors.terms_accepted?.message}
                                label={
                                    <>
                                        Ik accepteer de{' '}
                                        <Anchor
                                            href={termsFileUrl || '/reisvoorwaarden.pdf'}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            c="brand"
                                            fw={600}
                                            td="underline"
                                        >
                                            algemene voorwaarden
                                        </Anchor>
                                    </>
                                }
                            />
                        )}
                    />

                    <TextInput {...register('website')} display="none" tabIndex={-1} autoComplete="off" suppressHydrationWarning />

                    <Button
                        type="submit"
                        size="lg"
                        loading={loading}
                        mt="xs"
                        rightSection={!loading ? <ArrowRight size={18} /> : undefined}
                    >
                        {loading ? 'Bezig met aanmelden...' : 'Aanmelden voor de reis'}
                    </Button>
                </Stack>
            </Box>
        </>
    );
}
