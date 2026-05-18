'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, RefreshCw, ChevronRight } from 'lucide-react';

import { getPaymentStatusAction } from '@/server/actions/events/reis-payment.actions';

interface PaymentStatusProps {
    mollieId: string;
    onSuccess?: () => void;
    onExpire?: () => void;
    returnUrl?: string;
    returnText?: string;
    successText?: string;
}

export default function PaymentStatusIsland({
    mollieId,
    onSuccess,
    onExpire,
    returnUrl = '/reis',
    returnText = 'Terug naar Reizen',
    successText = 'Je aanbetaling is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging in je e-mail.',
    initialStatus = 'loading'
}: PaymentStatusProps & { initialStatus?: 'loading' | 'open' | 'paid' | 'expired' | 'failed' | 'canceled' }) {
    const [status, setStatus] = useState<'loading' | 'open' | 'paid' | 'expired' | 'failed' | 'canceled'>(initialStatus);
    const [attempts, setAttempts] = useState(0);

    const maxAttempts = 20;

    const checkStatus = useCallback(async () => {
        try {
            const res = await getPaymentStatusAction(mollieId);

            if (!res.success) {
                if (attempts < maxAttempts) {
                    setAttempts(prev => prev + 1);
                }
                return;
            }

            const currentStatus = res.payment_status;

            if (currentStatus === 'paid') {
                setStatus('paid');
                onSuccess?.();
            } else if (currentStatus === 'canceled') {
                setStatus('failed');
                setAttempts(999); // Stop polling
            } else if (['expired', 'failed'].includes(currentStatus || '')) {
                setStatus('failed');
                onExpire?.();
            } else {
                setStatus('open');
                if (attempts < maxAttempts) {
                    setAttempts(prev => prev + 1);
                } else {
                    setStatus('expired'); // Polling timeout
                }
            }
        } catch {
            if (attempts < maxAttempts) {
                setAttempts(prev => prev + 1);
            }
        }
    }, [attempts, mollieId, onExpire, onSuccess]);

    useEffect(() => {
        if (status === 'paid' || status === 'expired' || status === 'failed' || status === 'canceled') return;

        const timer = setTimeout(() => {
            void checkStatus();
        }, 3000);

        return () => clearTimeout(timer);
    }, [status, checkStatus]);

    return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-xl">
            {status === 'loading' || status === 'open' ? (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                        <Loader2 className="w-20 h-20 text-orange-500 animate-spin relative z-10 mx-auto" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-4">
                        Betaling Verwerken...
                    </h2>
                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed text-base font-semibold">
                        We wachten op bevestiging van Mollie. Dit duurt meestal enkele seconden.
                        Blijf nog even op deze pagina.
                    </p>
                    <div className="mt-8 text-base font-bold text-gray-600">
                        Poging {attempts} van {maxAttempts}
                    </div>
                </div>
            ) : status === 'paid' ? (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                        <CheckCircle2 className="w-20 h-20 text-green-500 relative z-10 mx-auto" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-4">
                        Betaling Geslaagd!
                    </h2>
                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-10 text-base font-semibold">
                        {successText}
                    </p>
                    <button
                        onClick={() => window.location.href = returnUrl}
                        className="px-10 py-5 rounded-2xl bg-white text-black font-bold text-base hover:bg-green-500 hover:text-white transition-all shadow-2xl shadow-green-500/10 flex items-center gap-2 mx-auto"
                    >
                        {returnText}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                        <XCircle className="w-20 h-20 text-red-500 relative z-10 mx-auto" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-4">
                        Status Onbekend
                    </h2>
                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-10 text-base font-semibold">
                        We kunnen de status op dit moment niet direct bevestigen.
                        Dit kan betekenen dat de betaling nog even nodig heeft of is afgebroken.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-10 py-5 rounded-2xl bg-white text-black font-bold text-base hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Controleer Handmatig
                        </button>
                        <button
                            onClick={() => window.location.href = returnUrl}
                            className="text-gray-500 text-base font-bold hover:text-white transition-all"
                        >
                            Ik check het later wel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
