'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, RefreshCw, ChevronRight } from 'lucide-react';

import { getPaymentStatusAction } from '@/server/actions/reis-payment.actions';

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
    successText = 'Je aanbetaling is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging in je e-mail.'
}: PaymentStatusProps) {
    const [status, setStatus] = useState<'loading' | 'open' | 'paid' | 'expired' | 'failed'>('loading');
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 20;

    const checkStatus = async () => {
        try {
            const res = await getPaymentStatusAction(mollieId);
            
            if (!res.success) {
                // If the server action fails, we treat it as a temporary error and keep polling
                if (attempts < maxAttempts) {
                    setAttempts(prev => prev + 1);
                }
                return;
            }

            const currentStatus = res.payment_status;

            if (currentStatus === 'paid') {
                setStatus('paid');
                onSuccess?.();
            } else if (['expired', 'canceled', 'failed'].includes(currentStatus || '')) {
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
        } catch (err) {
            console.error('[PaymentStatus] Check failed:', err);
            if (attempts < maxAttempts) {
                setAttempts(prev => prev + 1);
            }
        }
    };

    useEffect(() => {
        if (status === 'paid' || status === 'expired' || status === 'failed') return;

        const timer = setTimeout(() => {
            checkStatus();
        }, 3000);

        return () => clearTimeout(timer);
    }, [attempts, status]);

    return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-xl">
            {status === 'loading' || status === 'open' ? (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                        <Loader2 className="w-20 h-20 text-orange-500 animate-spin relative z-10 mx-auto" />
                    </div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter italic mb-4">
                        Betaling Verwerken...
                    </h2>
                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
                        We wachten op bevestiging van Mollie. Dit duurt meestal enkele seconden. 
                        Blijf nog even op deze pagina.
                    </p>
                    <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                        Poging {attempts} van {maxAttempts}
                    </div>
                </div>
            ) : status === 'paid' ? (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                        <CheckCircle2 className="w-20 h-20 text-green-500 relative z-10 mx-auto" />
                    </div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter italic mb-4">
                        Betaling Geslaagd!
                    </h2>
                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-10">
                        {successText}
                    </p>
                    <button 
                        onClick={() => window.location.href = returnUrl}
                        className="px-10 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-green-500 hover:text-white transition-all shadow-2xl shadow-green-500/10 flex items-center gap-2 mx-auto"
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
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter italic mb-4">
                        Status Onbekend
                    </h2>
                    <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-10">
                        We kunnen de status op dit moment niet direct bevestigen. 
                        Dit kan betekenen dat de betaling nog even nodig heeft of is afgebroken.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-10 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Controleer Handmatig
                        </button>
                        <button 
                            onClick={() => window.location.href = returnUrl}
                            className="text-gray-500 text-sm font-bold hover:text-white transition-all"
                        >
                            Ik check het later wel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
