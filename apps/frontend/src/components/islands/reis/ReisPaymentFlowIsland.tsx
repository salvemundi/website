'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ChevronLeft, ChevronRight, CreditCard, Compass, User } from 'lucide-react';
import { Alert, Badge, Box, Button, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';
import type { Trip, TripActivity } from '@salvemundi/validations/schema/beheer-trip.zod';
import type { TripSignup, ReisPaymentEnrichment } from '@salvemundi/validations/schema/trip.zod';
import { reisPaymentEnrichmentSchema } from '@salvemundi/validations/schema/trip.zod';
import ActivitySelector from './ActivitySelector';
import {
    updateSignupDetails,
    syncSignupActivities,
    initiateTripPaymentAction
} from '@/server/actions/events/reis/reis-payment.actions';
import { calculateTripPricing, type ActivitySelection } from '@/lib/reis/pricing';
import { NameConfirmModal } from './shared/NameConfirmModal';
import { EnrichmentForm } from './payment/EnrichmentForm';
import { PaymentSummary } from './payment/PaymentSummary';
import { PaymentSuccess } from './payment/PaymentSuccess';
import { safeConsoleError } from '@/server/utils/logger';

interface ExtendedTripSignup extends Omit<TripSignup, 'document_expiry_date' | 'extra_luggage'> {
    document_expiry_date?: string | null;
    extra_luggage?: boolean | null;
}

interface TripPaymentFlowProps {
    signup: TripSignup;
    trip: Trip;
    allActivities: TripActivity[];
    selectedActivities: TripActivity[];
    paymentType: 'deposit' | 'final';
    token?: string;
}

const toISOStringWithoutTimezone = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return '';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - userTimezoneOffset);
    return localDate.toISOString().split('T')[0];
};

const formatDateNL = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return 'Onbekend';
    return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export default function ReisPaymentFlowIsland({
    signup,
    trip,
    allActivities,
    selectedActivities,
    paymentType,
    token
}: TripPaymentFlowProps) {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNameConfirm, setShowNameConfirm] = useState(false);
    const [localSignup, setLocalSignup] = useState(signup);
    const signupExtended = localSignup as ExtendedTripSignup;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const enrichmentSchema = useMemo(() => {
        return reisPaymentEnrichmentSchema.superRefine((data, ctx) => {
            if (!trip.is_bus_trip && data.document_expiry_date && trip.end_date) {
                const expiry = new Date(data.document_expiry_date);
                const tripEnd = new Date(trip.end_date);

                if (expiry < tripEnd) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Document moet geldig zijn tot tenminste het einde van de reis (${formatDateNL(tripEnd)}).`,
                        path: ['document_expiry_date']
                    });
                }

                const maxExpiry = new Date(tripEnd);
                maxExpiry.setFullYear(maxExpiry.getFullYear() + 15);
                if (expiry > maxExpiry) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Vervaldatum ligt te ver in de toekomst (max 15 jaar).',
                        path: ['document_expiry_date']
                    });
                }
            }
        });
    }, [trip.end_date, trip.is_bus_trip]);

    const methods = useForm<ReisPaymentEnrichment>({
        resolver: zodResolver(enrichmentSchema),
        defaultValues: {
            first_name: signupExtended.first_name || '',
            last_name: signupExtended.last_name || '',
            phone_number: signupExtended.phone_number || '',
            date_of_birth: toISOStringWithoutTimezone(signupExtended.date_of_birth),
            id_document: signupExtended.id_document || 'none',
            document_number: signupExtended.document_number || '',
            document_expiry_date: toISOStringWithoutTimezone(signupExtended.document_expiry_date),
            extra_luggage: !!signupExtended.extra_luggage,
            allergies: signupExtended.allergies || '',
            special_notes: signupExtended.special_notes || '',
            willing_to_drive: signupExtended.willing_to_drive || false,
            is_bus_trip: trip.is_bus_trip
        },
        mode: 'onChange',
        shouldUnregister: true
    });

    const { watch, getValues, trigger } = methods;
    const firstName = watch('first_name');
    const [activitySelections, setActivitySelections] = useState<ActivitySelection[]>(() =>
        selectedActivities.map(sa => ({
            activityId: sa.id,
            options: {}
        }))
    );

    const pricing = useMemo(() => {
        return calculateTripPricing(
            trip,
            signup.role,
            activitySelections,
            allActivities,
            paymentType
        );
    }, [trip, signup.role, activitySelections, allActivities, paymentType]);

    const handleNext = async () => {
        setError(null);
        setLoading(true);

        try {
            if (step === 1) {
                const isValidForm = await trigger();
                if (!isValidForm) {
                    setLoading(false);
                    const firstErrorEl = document.querySelector('[aria-invalid="true"], .mantine-Input-error');
                    if (firstErrorEl) {
                        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }
                setShowNameConfirm(true);
                setLoading(false);
                return;
            } else if (step === 2) {
                const res = await syncSignupActivities(signup.id || 0, activitySelections, token);
                if (!res.success) {
                    setError(res.error || 'Fout bij opslaan activiteiten.');
                    setLoading(false);
                    return;
                }
                if (paymentType === 'final' && !trip.allow_final_payments) {
                    setStep(4);
                    setLoading(false);
                    return;
                }
            } else if (step === 3) {
                const res = (await initiateTripPaymentAction(signup.id || 0, paymentType, token)) as { success: boolean; checkoutUrl?: string; error?: string };
                if (res.success && res.checkoutUrl) {
                    window.location.href = res.checkoutUrl;
                    return;
                } else {
                    setError(res.error || 'Betaalsessie starten mislukt.');
                    setLoading(false);
                    return;
                }
            }
            setStep(step + 1);
        } catch (err) {
            safeConsoleError('[ReisPaymentFlowIsland.tsx][ReisPaymentFlowIsland] ', err);
            setError('Er is een onverwachte fout opgetreden.');
        } finally {
            setLoading(false);
        }
    };

    const confirmNameAndProceed = async () => {
        setShowNameConfirm(false);
        setLoading(true);
        try {
            const formData = getValues();
            const res = await updateSignupDetails(signup.id || 0, formData, token);
            if (!res.success) {
                setError(res.error || 'Fout bij opslaan gegevens.');
                setLoading(false);
                return;
            }
            setLocalSignup({ ...localSignup, ...formData });
            setStep(2);
        } catch (err) {
            safeConsoleError('[ReisPaymentFlowIsland.tsx][ReisPaymentFlowIsland] ', err);
            setError('Fout bij opslaan gegevens.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <Container size="lg" py="xl">
                <Box component="form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                    <Stack gap="xl">
                        <Box>
                            <Group justify="space-between" align="center" pb="md" wrap="wrap" gap="md">
                                <Stack gap={4}>
                                    <Group gap="sm">
                                        <Text span c="brand" lh={1}>
                                            {step === 1 && <User size={26} />}
                                            {step === 2 && <Compass size={26} />}
                                            {step === 3 && <CreditCard size={26} />}
                                        </Text>
                                        <Title order={2} size="h2">
                                            {step === 1 && 'Reisgegevens'}
                                            {step === 2 && 'Optionele Activiteiten'}
                                            {step === 3 && 'Betalingssamenvatting'}
                                            {step === 4 && 'Gelukt!'}
                                        </Title>
                                    </Group>
                                    <Text size="sm" c="dimmed">
                                        {step === 1 && `Vul je gegevens aan voor ${trip.name}`}
                                        {step === 2 && 'Kies de extra activiteiten die je wilt doen'}
                                        {step === 3 && 'Controleer je reissom en selecties'}
                                        {step === 4 && 'Je keuzes zijn opgeslagen'}
                                    </Text>
                                </Stack>
                                {step <= 3 && (
                                    <Badge size="md">
                                        Stap {step} van 3
                                    </Badge>
                                )}
                            </Group>
                            <Divider />
                        </Box>

                        <Box py="xs">
                            <Box display={step === 1 ? 'block' : 'none'}>
                                <EnrichmentForm trip={trip} hideHeader={true} />
                            </Box>
                            <Box display={step === 2 ? 'block' : 'none'}>
                                {paymentType === 'deposit' && (
                                    <Alert color="accent" mb="lg" icon={<AlertCircle size={16} />}>
                                        Let op: De getoonde prijzen voor de activiteiten zijn op dit moment een schatting en kunnen nog wijzigen.
                                    </Alert>
                                )}
                                <ActivitySelector
                                    activities={allActivities}
                                    selectedSelections={activitySelections}
                                    onChange={setActivitySelections}
                                    hideHeader={true}
                                />
                            </Box>
                            <Box display={step === 3 ? 'block' : 'none'}>
                                <PaymentSummary pricing={pricing} paymentType={paymentType} hideHeader={true} />
                            </Box>
                            <Box display={step === 4 ? 'block' : 'none'}>
                                <PaymentSuccess trip={trip} />
                            </Box>
                        </Box>

                        {step <= 3 && (
                            <>
                                <Divider />
                                <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                                    <Button
                                        type="button"
                                        size="md"
                                        onClick={step === 1 ? () => router.push('/reis') : () => setStep(step - 1)}
                                        leftSection={<ChevronLeft size={16} />}
                                        w={{ base: '100%', sm: 'auto' }}
                                    >
                                        {step === 1 ? 'Annuleren' : 'Vorige'}
                                    </Button>

                                    <Stack gap="sm" align="flex-end" w={{ base: '100%', sm: 'auto' }}>
                                        {error && (
                                            <Alert color="error" icon={<AlertCircle size={16} />} w="100%">
                                                {error}
                                            </Alert>
                                        )}

                                        <Button
                                            type="button"
                                            size="md"
                                            onClick={() => void handleNext()}
                                            loading={loading}
                                            w={{ base: '100%', sm: 'auto' }}
                                            leftSection={step === 3 ? <CreditCard size={18} /> : undefined}
                                            rightSection={step < 3 ? <ChevronRight size={16} /> : undefined}
                                        >
                                            {loading
                                                ? 'Verwerken...'
                                                : step < 3
                                                    ? 'Volgende'
                                                    : paymentType === 'deposit'
                                                        ? 'Aanbetaling voldoen'
                                                        : 'Restbetaling voldoen'}
                                        </Button>
                                    </Stack>
                                </Group>
                            </>
                        )}
                    </Stack>
                </Box>
            </Container>

            <NameConfirmModal
                isOpen={showNameConfirm}
                name={firstName}
                onConfirm={() => void confirmNameAndProceed()}
                onCancel={() => setShowNameConfirm(false)}
            />
        </FormProvider>
    );
}
