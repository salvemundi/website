'use client';

import { useState, useMemo } from 'react';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import {
    type Trip,
    type TripSignup,
    type TripActivity,
    type TripSignupActivity
} from '@salvemundi/validations/schema/admin-reis.zod';
import {
    reisPaymentEnrichmentSchema,
    type ReisPaymentEnrichment
} from '@salvemundi/validations/schema/reis.zod';
import ActivitySelector from './ActivitySelector';
import {
    updateSignupDetails,
    syncSignupActivities,
    initiateTripPaymentAction
} from '@/server/actions/events/reis-payment.actions';
import { calculateTripPricing, type ActivitySelection } from '@/lib/reis/pricing';
import { NameConfirmModal } from './shared/NameConfirmModal';
import { EnrichmentForm } from './payment/EnrichmentForm';
import { PaymentSummary } from './payment/PaymentSummary';
import { PaymentSuccess } from './payment/PaymentSuccess';
import { FlowNavigation } from './payment/FlowNavigation';
import { safeConsoleError } from '@/server/utils/logger';

interface ExtendedTripSignup extends Omit<TripSignup, 'document_expiry_date' | 'extra_luggage'> {
    document_expiry_date?: string | null;
    extra_luggage?: boolean | null;
}

interface TripPaymentFlowProps {
    signup: TripSignup;
    trip: Trip;
    allActivities: TripActivity[];
    selectedActivities: TripSignupActivity[];
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

export default function TripPaymentFlowIsland({
    signup,
    trip,
    allActivities,
    selectedActivities,
    paymentType,
    token
}: TripPaymentFlowProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showNameConfirm, setShowNameConfirm] = useState(false);
    const [localSignup, setLocalSignup] = useState(signup);
    const signupExtended = localSignup as ExtendedTripSignup;

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

    const { watch, getValues, trigger, formState: { isValid } } = methods;
    const firstName = watch('first_name');
    const [activitySelections, setActivitySelections] = useState<ActivitySelection[]>(() =>
        selectedActivities.map(sa => {
            const activityId = sa.trip_activity_id && typeof sa.trip_activity_id === 'object'
                ? (sa.trip_activity_id as { id: number }).id
                : Number(sa.trip_activity_id);

            return {
                activityId,
                options: (sa.selected_options as Record<string, boolean> | undefined) || {}
            };
        })
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
            }
            setStep(step + 1);
        } catch (error) {
            safeConsoleError('[TripPaymentFlowIsland][handleNext]', error);
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
        } catch (error) {
            safeConsoleError('[TripPaymentFlowIsland][confirmNameAndProceed]', error);
            setError('Fout bij opslaan gegevens.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartPayment = async () => {
        setError(null);
        setIsProcessing(true);
        try {
            const res = (await initiateTripPaymentAction(signup.id || 0, paymentType, token)) as { success: boolean; checkoutUrl?: string; error?: string };
            if (res.success && res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            } else {
                setError(res.error || 'Betaalsessie starten mislukt.');
                setIsProcessing(false);
            }
        } catch (error) {
            safeConsoleError('[TripPaymentFlowIsland][handleStartPayment]', error);
            setError('Fout bij verbinden met betaalservice.');
            setIsProcessing(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="max-w-4xl mx-auto px-6 py-4">
                <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                    <div className="py-4 min-h-[400px]">
                        <div className={`animate-in fade-in duration-300 ${step === 1 ? 'block' : 'hidden'}`}>
                            <EnrichmentForm trip={trip} />
                        </div>
                        <div className={`animate-in fade-in duration-300 ${step === 2 ? 'block' : 'hidden'}`}>
                            <ActivitySelector
                                activities={allActivities}
                                selectedSelections={activitySelections}
                                onChange={setActivitySelections}
                            />
                        </div>
                        <div className={`animate-in fade-in duration-300 ${step === 3 ? 'block' : 'hidden'}`}>
                            <PaymentSummary pricing={pricing} paymentType={paymentType} />
                        </div>
                        <div className={`animate-in fade-in duration-300 ${step === 4 ? 'block' : 'hidden'}`}>
                            <PaymentSuccess trip={trip} />
                        </div>
                    </div>

                    <div className="mt-4">
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold tracking-tight italic">Er is iets misgegaan</p>
                                    <p className="opacity-80">{error}</p>
                                </div>
                            </div>
                        )}

                        <FlowNavigation
                            step={step}
                            loading={loading}
                            isProcessing={isProcessing}
                            isValid={isValid}
                            paymentType={paymentType}
                            onPrevious={() => setStep(step - 1)}
                            onNext={() => void handleNext()}
                            onPayment={() => void handleStartPayment()}
                        />
                    </div>
                </form>
            </div>

            <NameConfirmModal
                isOpen={showNameConfirm}
                name={firstName}
                onConfirm={() => void confirmNameAndProceed()}
                onCancel={() => setShowNameConfirm(false)}
            />
        </FormProvider>
    );
}