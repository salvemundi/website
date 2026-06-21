import React from 'react';
import { CreditCard } from 'lucide-react';
import { TripPricingResult } from '@/lib/reis/pricing';


interface PaymentSummaryProps {
    pricing: TripPricingResult;
    paymentType: 'deposit' | 'final';
    hideHeader?: boolean;
}

export function PaymentSummary({ pricing, paymentType, hideHeader = false }: PaymentSummaryProps) {
    return (
        <div className="space-y-8">
            {!hideHeader && (
                <header className="mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                    <h2 className="text-2xl sm:text-3xl font-black text-(--text-main) mb-1 italic tracking-tighter flex items-center gap-3">
                        <CreditCard className="w-7 h-7 text-theme-purple" />
                        Betalingssamenvatting
                    </h2>
                    <p className="text-(--text-muted) text-sm">Controleer de gegevens voordat we je doorsturen naar Mollie.</p>
                </header>
            )}

            <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-(--bg-card) border border-black/5 dark:border-white/10 space-y-3 shadow-md">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted">Basisprijs Reis</span>
                        <span className="text-text-main font-bold">€{pricing.base.toFixed(2)}</span>
                    </div>
                    {pricing.discount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-emerald-600 dark:text-emerald-400 italic">Crew Korting</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">-€{pricing.discount.toFixed(2)}</span>
                        </div>
                    )}
                    {pricing.actPrice > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-muted">Optionele Activiteiten</span>
                            <span className="text-text-main font-bold">+€{pricing.actPrice.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 flex justify-between items-center">
                        <span className="text-text-main font-bold text-xs tracking-widest">Totaalbedrag</span>
                        <span className="text-xl font-bold text-text-main italic">€{pricing.total.toFixed(2)}</span>
                    </div>
                    {paymentType === 'final' && (
                        <div className="flex justify-between items-center text-sm pt-2">
                            <span className="text-emerald-600 dark:text-emerald-400 italic">Reeds voldaan (Aanbetaling)</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">-€{pricing.deposit.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-theme-purple to-theme-purple-dark shadow-xl shadow-theme-purple/10 text-white">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1">
                                {paymentType === 'deposit' ? 'Nu te voldoen (Aanbetaling)' : 'Nu te voldoen (Restbetaling)'}
                            </p>
                            <h3 className="text-5xl font-black italic tracking-tighter italic">€{pricing.toPayNow.toFixed(2)}</h3>
                        </div>
                        <CreditCard className="w-12 h-12 opacity-30 -mb-2 -mr-2" />
                    </div>
                </div>
            </div>
        </div>
    );
}
