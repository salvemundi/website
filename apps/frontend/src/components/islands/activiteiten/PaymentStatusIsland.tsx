'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, RefreshCw, ChevronRight } from 'lucide-react';

import { getPaymentStatusAction } from '@/server/actions/events/reis/reis-payment.actions';

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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/5 p-12 text-center backdrop-blur-xl">
            {status === 'loading' || status === 'open' ? (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-3xl" />
                        <Loader2 className="relative z-10 mx-auto size-20 animate-spin text-orange-500" />
                    </div>
                    <h2 className="mb-4 text-3xl font-black tracking-tighter text-white">
                        Betaling Verwerken...
                    </h2>
                    <p className="mx-auto max-w-sm text-base leading-relaxed font-semibold text-gray-400">
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
                        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl" />
                        <CheckCircle2 className="relative z-10 mx-auto size-20 text-green-500" />
                    </div>
                    <h2 className="mb-4 text-4xl font-black tracking-tighter text-white">
                        Betaling Geslaagd!
                    </h2>
                    <p className="mx-auto mb-10 max-w-sm text-base leading-relaxed font-semibold text-gray-400">
                        {successText}
                    </p>
                    <button
                        onClick={() => window.location.href = returnUrl}
                        className="mx-auto form-button flex items-center gap-2 rounded-2xl bg-white px-10 py-5 text-base font-bold text-black shadow-2xl shadow-green-500/10 transition-all hover:bg-green-500 hover:text-white"
                    >
                        {returnText}
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 rounded-full bg-red-500/20 blur-3xl" />
                        <XCircle className="relative z-10 mx-auto size-20 text-red-500" />
                    </div>
                    <h2 className="mb-4 text-3xl font-black tracking-tighter text-white">
                        Status Onbekend
                    </h2>
                    <p className="mx-auto mb-10 max-w-sm text-base leading-relaxed font-semibold text-gray-400">
                        We kunnen de status op dit moment niet direct bevestigen.
                        Dit kan betekenen dat de betaling nog even nodig heeft of is afgebroken.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="mx-auto form-button flex items-center gap-2 rounded-2xl bg-white px-10 py-5 text-base font-bold text-black transition-all hover:bg-orange-500 hover:text-white"
                        >
                            <RefreshCw className="size-5" />
                            Controleer Handmatig
                        </button>
                        <button
                            onClick={() => window.location.href = returnUrl}
                            className="form-button text-base font-bold text-gray-500 transition-all hover:text-white"
                        >
                            Ik check het later wel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
