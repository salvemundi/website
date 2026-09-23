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
                <header className="mb-6 border-b border-black/5 pb-4 dark:border-white/10">
                    <h2 className="mb-1 flex items-center gap-3 text-2xl font-black tracking-tighter text-(--text-main) italic sm:text-3xl">
                        <CreditCard className="size-7 text-theme-purple" />
                        Betalingssamenvatting
                    </h2>
                    <p className="text-sm text-(--text-muted)">Controleer de gegevens voordat we je doorsturen naar Mollie.</p>
                </header>
            )}

            <div className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-black/5 bg-(--bg-card) p-6 shadow-md dark:border-white/10">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Basisprijs Reis</span>
                        <span className="font-bold text-text-main">€{pricing.base.toFixed(2)}</span>
                    </div>
                    {pricing.discount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-600 italic dark:text-emerald-400">Crew Korting</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">-€{pricing.discount.toFixed(2)}</span>
                        </div>
                    )}
                    {pricing.actPrice > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Optionele Activiteiten</span>
                            <span className="font-bold text-text-main">+€{pricing.actPrice.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
                        <span className="text-xs font-bold tracking-widest text-text-main">Totaalbedrag</span>
                        <span className="text-xl font-bold text-text-main italic">€{pricing.total.toFixed(2)}</span>
                    </div>
                    {paymentType === 'final' && (
                        <div className="flex items-center justify-between pt-2 text-sm">
                            <span className="text-emerald-600 italic dark:text-emerald-400">Reeds voldaan (Aanbetaling)</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">-€{pricing.deposit.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="rounded-3xl bg-linear-to-br from-theme-purple to-theme-purple-dark p-8 text-white shadow-xl shadow-theme-purple/10">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="mb-1 text-[10px] font-bold tracking-[0.2em] opacity-80">
                                {paymentType === 'deposit' ? 'Nu te voldoen (Aanbetaling)' : 'Nu te voldoen (Restbetaling)'}
                            </p>
                            <h3 className="text-5xl font-black tracking-tighter italic italic">€{pricing.toPayNow.toFixed(2)}</h3>
                        </div>
                        <CreditCard className="-mr-2 -mb-2 size-12 opacity-30" />
                    </div>
                </div>
            </div>
        </div>
    );
}
