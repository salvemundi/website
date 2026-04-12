'use client';

import React, { useState, useMemo } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { 
    type Trip, 
    type TripSignup, 
    type TripActivity, 
    type TripSignupActivity 
} from '@salvemundi/validations/schema/admin-reis.zod';
import { type ReisPaymentEnrichment } from '@salvemundi/validations/schema/reis.zod';
import ActivitySelector from './ActivitySelector';
import { 
    updateSignupDetails, 
    syncSignupActivities, 
    initiateTripPaymentAction 
} from '@/server/actions/reis-payment.actions';
import { calculateTripPricing } from '@/lib/reis/pricing';
import { format } from 'date-fns';

// Sub-components
import { StepIndicator } from './payment/StepIndicator';
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

    // Form State
    const [enrichment, setEnrichment] = useState<ReisPaymentEnrichment>({
        first_name: signup.first_name || '',
        last_name: signup.last_name || '',
        phone_number: signup.phone_number || '',
        date_of_birth: signup.date_of_birth ? format(new Date(signup.date_of_birth), 'yyyy-MM-dd') : '',
        id_document: signup.id_document || 'none',
        document_number: signup.document_number || '',
        allergies: signup.allergies || '',
        special_notes: signup.special_notes || '',
        willing_to_drive: signup.willing_to_drive || false,
    });

    const [activitySelections, setActivitySelections] = useState<{ activityId: number, options: any }[]>(
        selectedActivities.map(sa => ({
            activityId: typeof sa.trip_activity_id === 'object' ? (sa.trip_activity_id as any).id : Number(sa.trip_activity_id),
            options: sa.selected_options || {}
        }))
    );

    // Pricing Calculation (extracted to lib)
    const pricing = useMemo(() => {
        return calculateTripPricing(
            trip,
            signup.role,
            activitySelections as any,
            allActivities,
            paymentType
        );
    }, [trip, signup.role, activitySelections, allActivities, paymentType]);

    const handleNext = async () => {
        setError(null);
        setLoading(true);

        try {
            if (step === 1) {
                const res = await updateSignupDetails(signup.id!, enrichment, token);
                if (!res.success) {
                    setError(res.error || 'Fout bij opslaan gegevens.');
                    setLoading(false);
                    return;
                }
            } else if (step === 2) {
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
        <div className="max-w-4xl mx-auto px-4 py-12">
            <StepIndicator step={step} />

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/20 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 md:p-12">
                    {step === 1 && (
                        <EnrichmentForm 
                            trip={trip} 
                            enrichment={enrichment} 
                            setEnrichment={setEnrichment} 
                        />
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in duration-500">
                            <ActivitySelector 
                                activities={allActivities}
                                selectedSelections={activitySelections}
                                onChange={setActivitySelections}
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <PaymentSummary 
                            pricing={pricing} 
                            paymentType={paymentType} 
                        />
                    )}

                    {step === 4 && <PaymentSuccess trip={trip} />}
                </div>

                <FlowNavigation 
                    step={step}
                    loading={loading}
                    isProcessing={isProcessing}
                    paymentType={paymentType}
                    trip={trip}
                    onPrevious={() => setStep(step - 1)}
                    onNext={handleNext}
                    onPayment={handleStartPayment}
                />
            </div>

             <div className="mt-8 flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs">
                <Info className="w-3.5 h-3.5" />
                <p>Betalingen worden beveiligd verwerkt door Mollie. Je wordt omgeleid naar een veilige betaalomgeving.</p>
            </div>
        </div>
    );
}
