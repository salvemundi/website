import React from 'react';
import { Loader2, ChevronRight, ArrowRight } from 'lucide-react';
import { type Trip } from '@salvemundi/validations/schema/admin-reis.zod';

interface FlowNavigationProps {
    step: number;
    loading: boolean;
    isProcessing: boolean;
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
    paymentType,
    trip,
    onPrevious,
    onNext,
    onPayment
}: FlowNavigationProps) {
    if (step >= 4) return null;

    return (
        <div className="px-8 pb-8 md:px-12 md:pb-12 pt-0 flex flex-col md:flex-row gap-4">
            <button
                disabled={loading || isProcessing}
                onClick={onPrevious}
                className="px-8 py-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)]/40 text-[var(--text-main)] font-bold hover:bg-[var(--bg-soft)]/80 transition-all flex items-center justify-center gap-2"
            >
                Vorige
            </button>

            {step < 3 ? (
                <button
                    disabled={loading || isProcessing}
                    onClick={onNext}
                    className="flex-1 bg-theme-purple text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-theme-purple-dark transition-all shadow-xl shadow-theme-purple/5 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                        <>
                            {step === 2 && paymentType === 'final' && !trip.allow_final_payments ? 'Keuzes Opslaan' : 'Opslaan & Volgende'}
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            ) : (
                <button
                    disabled={isProcessing || loading}
                    onClick={onPayment}
                    className="flex-1 bg-theme-purple text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-theme-purple-dark transition-all shadow-2xl shadow-theme-purple/10 disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                        <>
                            Betaal nu met Mollie
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
