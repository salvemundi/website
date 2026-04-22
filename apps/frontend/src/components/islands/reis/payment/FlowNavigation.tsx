import React from 'react';
import { ChevronRight, CreditCard, ChevronLeft } from 'lucide-react';
import { type Trip } from '@salvemundi/validations/schema/admin-reis.zod';

interface FlowNavigationProps {
    step: number;
    loading: boolean;
    isProcessing: boolean;
    isValid?: boolean;
    paymentType: 'deposit' | 'final';
    trip: Trip;
    onPrevious: () => void;
    onNext: () => void;
    onPayment: () => void;
}

export function FlowNavigation({ 
    step, 
    loading, 
    isProcessing, 
    isValid = true,
    paymentType, 
    trip, 
    onPrevious, 
    onNext, 
    onPayment 
}: FlowNavigationProps) {
    if (step > 3) return null;

    // Next button should be disabled if we are on step 1 and the form is invalid
    const isNextDisabled = loading || (step === 1 && !isValid);

    return (
        <div className="py-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="order-2 sm:order-1 w-full sm:w-auto">
                <button
                    onClick={step === 1 ? () => window.location.href = '/reis' : onPrevious}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" /> 
                    {step === 1 ? 'Annuleren' : 'Vorige'}
                </button>
            </div>

            <div className="order-1 sm:order-2 w-full sm:w-auto">
                {step < 3 ? (
                    <button
                        onClick={onNext}
                        disabled={isNextDisabled}
                        className={`form-button px-10 ${isNextDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                        {loading ? 'Laden...' : (
                            <>
                                Volgende
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={onPayment}
                        disabled={isProcessing}
                        className="form-button px-10 bg-gradient-to-br from-theme-purple to-theme-purple-dark"
                    >
                        {isProcessing ? 'Verwerken...' : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                {paymentType === 'deposit' ? 'Aanbetaling voldoen' : 'Restbetaling voldoen'}
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
