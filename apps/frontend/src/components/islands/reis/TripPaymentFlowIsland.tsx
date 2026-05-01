'use client';

import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft } from 'lucide-react';
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
} from '@/server/actions/reis-payment.actions';
import { calculateTripPricing, type TripPricingResult, type ActivitySelection } from '@/lib/reis/pricing';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import { NameConfirmModal } from './shared/NameConfirmModal';
import { EnrichmentForm } from './payment/EnrichmentForm';
import { PaymentSummary } from './payment/PaymentSummary';
import { PaymentSuccess } from './payment/PaymentSuccess';
import { FlowNavigation } from './payment/FlowNavigation';

interface TripPaymentFlowProps {
    signup: TripSignup;
    trip: Trip;
    allActivities: TripActivity[];
    selectedActivities: TripSignupActivity[];
    paymentType: 'deposit' | 'final';
    token?: string;
}

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

    // Dynamic schema extension to include trip-specific end date validation
    const enrichmentSchema = useMemo(() => {
        return reisPaymentEnrichmentSchema.superRefine((data, ctx) => {
            if (data.document_expiry_date && trip.end_date) {
                const expiry = new Date(data.document_expiry_date);
                const tripEnd = new Date(trip.end_date);
                
                // Lower bound: must be at least end of trip
                if (expiry < tripEnd) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Document moet geldig zijn tot tenminste het einde van de reis (${format(new Date(trip.end_date), 'dd-MM-yyyy')}).`,
                        path: ['document_expiry_date']
                    });
                }

                // Upper bound: block if more than 15 years in the future (typo protection)
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
    }, [trip.end_date]);

    // Form setup with React Hook Form
    const methods = useForm<ReisPaymentEnrichment>({
        resolver: zodResolver(enrichmentSchema),
        defaultValues: {
            first_name: localSignup.first_name || '',
            last_name: localSignup.last_name || '',
            phone_number: localSignup.phone_number || '',
            date_of_birth: localSignup.date_of_birth ? format(new Date(localSignup.date_of_birth), 'yyyy-MM-dd') : '',
            id_document: localSignup.id_document || 'none',
            document_number: localSignup.document_number || '',
            document_expiry_date: (localSignup as unknown as Record<string, any>).document_expiry_date ? format(new Date((localSignup as unknown as Record<string, any>).document_expiry_date), 'yyyy-MM-dd') : '',
            extra_luggage: (localSignup as unknown as Record<string, any>).extra_luggage || false,
            allergies: localSignup.allergies || '',
            special_notes: localSignup.special_notes || '',
            willing_to_drive: localSignup.willing_to_drive || false,
        },
        mode: 'onChange'
    });

    const { handleSubmit, watch, getValues, trigger, formState: { isValid } } = methods;
    const firstName = watch('first_name');

    const [activitySelections, setActivitySelections] = useState<{ activityId: number, options: Record<string, boolean> }[]>(
        selectedActivities.map(sa => ({
            activityId: typeof sa.trip_activity_id === 'object' ? (sa.trip_activity_id as unknown as Record<string, any>).id : Number(sa.trip_activity_id),
            options: (sa.selected_options as Record<string, boolean>) || {}
        }))
    );

    // Pricing Calculation
    const pricing = useMemo(() => {
        return calculateTripPricing(
            trip,
            signup.role,
            activitySelections as ActivitySelection[],
            allActivities,
            paymentType
        );
    }, [trip, signup.role, activitySelections, allActivities, paymentType]);

    const handleNext = async () => {
        setError(null);
        setLoading(true);

        try {
            if (step === 1) {
                // Step 1: Validation
                const isValid = await trigger();
                if (!isValid) {
                    setLoading(false);
                    return;
                }
                
                // Show confirmation modal for the name
                setShowNameConfirm(true);
                setLoading(false);
                return;
            } else if (step === 2) {
                // Step 2: Sync Activities
                const res = await syncSignupActivities(signup.id!, activitySelections, token);
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
        } catch (err) {
            setError('Er is een onverwachte fout opgetreden. Probeer het later opnieuw.');
        } finally {
            setLoading(false);
        }
    };

    const confirmNameAndProceed = async () => {
        setShowNameConfirm(false);
        setLoading(true);
        try {
            const formData = getValues();
            const res = await updateSignupDetails(signup.id!, formData, token);
            if (!res.success) {
                setError(res.error || 'Fout bij opslaan gegevens.');
                setLoading(false);
                return;
            }
            
            // Sync local state so Step 3 and back-navigation show updated data
            setLocalSignup({ ...localSignup, ...formData });
            setStep(2);
        } catch (err) {
            setError('Fout bij opslaan gegevens.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartPayment = async () => {
        setError(null);
        setIsProcessing(true);

        try {
            const res = await initiateTripPaymentAction(signup.id!, paymentType, token);
            if (res.success && res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            } else {
                setError(res.error || 'Betaalsessie starten mislukt.');
                setIsProcessing(false);
            }
        } catch (err) {
            setError('Fout bij verbinden met betaalservice.');
            setIsProcessing(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="max-w-4xl mx-auto px-6 py-4">
                <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                    <div className="py-4 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {step === 1 && (
                                    <EnrichmentForm 
                                        trip={trip} 
                                    />
                                )}

                                {step === 2 && (
                                    <ActivitySelector 
                                        activities={allActivities}
                                        selectedSelections={activitySelections}
                                        onChange={setActivitySelections}
                                    />
                                )}

                                {step === 3 && (
                                    <PaymentSummary 
                                        signup={localSignup}
                                        pricing={pricing} 
                                        paymentType={paymentType} 
                                    />
                                )}

                                {step === 4 && <PaymentSuccess trip={trip} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-4">
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-bold uppercase tracking-tight italic">Er is iets misgegaan</p>
                                        <p className="opacity-80">{error}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <FlowNavigation 
                            step={step}
                            loading={loading}
                            isProcessing={isProcessing}
                            isValid={isValid}
                            paymentType={paymentType}
                            trip={trip}
                            onPrevious={() => setStep(step - 1)}
                            onNext={handleNext}
                            onPayment={handleStartPayment}
                        />
                    </div>
                </form>
            </div>

            <NameConfirmModal 
                isOpen={showNameConfirm} 
                name={firstName}
                onConfirm={confirmNameAndProceed}
                onCancel={() => setShowNameConfirm(false)}
            />
        </FormProvider>
    );
}
