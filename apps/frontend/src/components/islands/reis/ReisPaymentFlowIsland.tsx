'use client';

import { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ChevronLeft, ChevronRight, CreditCard, Compass, User } from 'lucide-react';
import {
    type Trip,
    type TripSignup,
    type TripActivity,
    type TripSignupActivity
} from '@salvemundi/validations/schema/admin-trip.zod';
import {
    reisPaymentEnrichmentSchema,
    type ReisPaymentEnrichment
} from '@salvemundi/validations/schema/trip.zod';
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

export default function ReisPaymentFlowIsland({
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
                    const firstErrorEl = document.querySelector('[aria-invalid="true"], .text-red-500');
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
        } catch (error) {
            safeConsoleError('[ReisPaymentFlowIsland.tsx][ReisPaymentFlowIsland] ', error);
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
            safeConsoleError('[ReisPaymentFlowIsland.tsx][ReisPaymentFlowIsland] ', error);
            setError('Fout bij opslaan gegevens.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <form 
                    autoComplete="off" 
                    onSubmit={(e) => e.preventDefault()}
                    className="flex flex-col gap-10 @container"
                >
                    {/* Seamless Header */}
                    <div className="pb-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-text-main italic tracking-tighter flex items-center gap-3">
                                {step === 1 && <User className="w-7 h-7 text-theme-purple" />}
                                {step === 2 && <Compass className="w-7 h-7 text-theme-purple" />}
                                {step === 3 && <CreditCard className="w-7 h-7 text-theme-purple" />}
                                {step === 1 && 'Reisgegevens'}
                                {step === 2 && 'Optionele Activiteiten'}
                                {step === 3 && 'Betalingssamenvatting'}
                                {step === 4 && 'Gelukt!'}
                            </h2>
                            <p className="text-(--text-muted) text-sm mt-1">
                                {step === 1 && `Vul je gegevens aan voor ${trip.name}`}
                                {step === 2 && 'Kies de extra activiteiten die je wilt doen'}
                                {step === 3 && 'Controleer je reissom en selecties'}
                                {step === 4 && 'Je keuzes zijn opgeslagen'}
                            </p>
                        </div>
                        {step <= 3 && (
                            <div className="text-xs font-bold text-theme-purple bg-theme-purple/10 px-3 py-1.5 rounded-full tracking-wider select-none">
                                Stap {step} van 3
                            </div>
                        )}
                    </div>

                    {/* Step Body */}
                    <div className="py-2">
                        <div className={`animate-in fade-in duration-300 ${step === 1 ? 'block' : 'hidden'}`}>
                            <EnrichmentForm trip={trip} hideHeader={true} />
                        </div>
                        <div className={`animate-in fade-in duration-300 ${step === 2 ? 'block' : 'hidden'}`}>
                            <ActivitySelector
                                activities={allActivities}
                                selectedSelections={activitySelections}
                                onChange={setActivitySelections}
                                hideHeader={true}
                            />
                        </div>
                        <div className={`animate-in fade-in duration-300 ${step === 3 ? 'block' : 'hidden'}`}>
                            <PaymentSummary pricing={pricing} paymentType={paymentType} hideHeader={true} />
                        </div>
                        <div className={`animate-in fade-in duration-300 ${step === 4 ? 'block' : 'hidden'}`}>
                            <PaymentSuccess trip={trip} />
                        </div>
                    </div>

                    {/* Seamless Footer */}
                    {step <= 3 && (
                        <div className="pt-6 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="order-2 sm:order-1 w-full sm:w-auto">
                                <button
                                    onClick={step === 1 ? () => window.location.href = '/reis' : () => setStep(step - 1)}
                                    className="form-button w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm text-(--text-muted) hover:text-(--text-main) transition-all flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /> 
                                    {step === 1 ? 'Annuleren' : 'Vorige'}
                                </button>
                            </div>

                            <div className="order-1 sm:order-2 w-full sm:w-auto flex flex-col gap-4 items-end">
                                {error && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p className="text-xs">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => void handleNext()}
                                    disabled={loading}
                                    className={`form-button w-full sm:w-auto px-10 bg-linear-to-br from-theme-purple to-theme-purple-dark flex items-center justify-center gap-2 ${
                                        loading ? 'opacity-50 cursor-not-allowed grayscale' : ''
                                    }`}
                                >
                                    {loading ? (
                                        'Verwerken...'
                                    ) : (
                                        <>
                                            {step < 3 ? (
                                                <>
                                                    Volgende
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard className="w-5 h-5" />
                                                    {paymentType === 'deposit' ? 'Aanbetaling voldoen' : 'Restbetaling voldoen'}
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
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