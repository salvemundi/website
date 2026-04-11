import React from 'react';
import { CreditCard } from 'lucide-react';
import { TripPricingResult } from '@/lib/reis/pricing';

interface PaymentSummaryProps {
    pricing: TripPricingResult;
    paymentType: 'deposit' | 'final';
}

export function PaymentSummary({ pricing, paymentType }: PaymentSummaryProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
                <h2 className="text-3xl font-black text-[var(--text-main)] mb-2 uppercase italic tracking-tighter">Betalingssamenvatting</h2>
                <p className="text-[var(--text-muted)]">Controleer de gegevens voordat we je doorsturen naar Mollie.</p>
            </div>

            <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Basisprijs Reis</span>
                        <span className="text-white font-bold">€{pricing.base.toFixed(2)}</span>
                    </div>
                    {pricing.discount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-green-500 italic">Crew Korting</span>
                            <span className="text-green-500 font-bold">-€{pricing.discount.toFixed(2)}</span>
                        </div>
                    )}
                    {pricing.actPrice > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Optionele Activiteiten</span>
                            <span className="text-white font-bold">+€{pricing.actPrice.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-white font-black uppercase text-xs tracking-widest">Totaalbedrag</span>
                        <span className="text-xl font-black text-white uppercase italic">€{pricing.total.toFixed(2)}</span>
                    </div>
                    {paymentType === 'final' && (
                        <div className="flex justify-between items-center text-sm pt-2">
                            <span className="text-green-500 italic">Reeds voldaan (Aanbetaling)</span>
                            <span className="text-green-500 font-bold">-€{pricing.deposit.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-theme-purple to-theme-purple-dark shadow-xl shadow-theme-purple/10 text-white">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
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
