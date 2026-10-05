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
            } else if (['expired', 'failed'].includes(currentStatus)) {
                setStatus('failed');
                onExpire?.();
            } else {
                setStatus('open');
                if (attempts < maxAttempts) {
                    setAttempts(prev => prev + 1);
                } else {
                    setStatus('expired');
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
        <div className="status-card-payment">
            {status === 'loading' || status === 'open' ? (
                <div className="space-y-4 duration-500">
                    <div className="relative mb-6 flex justify-center">
                        <div className="status-payment-glow-pending" />
                        <Loader2 className="icon-spinner-status" />
                    </div>
                    <h2 className="status-title-main">
                        Betaling Verwerken...
                    </h2>
                    <p className="status-message-text">
                        We wachten op bevestiging van Mollie. Dit duurt meestal enkele seconden.
                        Blijf nog even op deze pagina.
                    </p>
                    <div className="status-counter-caption">
                        Poging {attempts} van {maxAttempts}
                    </div>
                </div>
            ) : status === 'paid' ? (
                <div className="space-y-4 duration-500">
                    <div className="relative mb-6 flex justify-center">
                        <div className="status-payment-glow-success" />
                        <CheckCircle2 className="relative z-10 size-20 text-theme-success" />
                    </div>
                    <h2 className="status-title-main">
                        Betaling Geslaagd!
                    </h2>
                    <p className="status-message-text">
                        {successText}
                    </p>
                    <button
                        onClick={() => window.location.href = returnUrl}
                        className="btn-status-success"
                        type="button">
                        {returnText}
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            ) : (
                <div className="space-y-4 duration-500">
                    <div className="relative mb-6 flex justify-center">
                        <div className="status-payment-glow-error" />
                        <XCircle className="relative z-10 size-20 text-theme-error" />
                    </div>
                    <h2 className="status-title-main">
                        Status Onbekend
                    </h2>
                    <p className="status-message-text">
                        We kunnen de status op dit moment niet direct bevestigen.
                        Dit kan betekenen dat de betaling nog even nodig heeft of is afgebroken.
                    </p>
                    <div className="status-actions-row">
                        <button
                            onClick={() => window.location.reload()}
                            className="form-button shadow-xs"
                            type="button">
                            <RefreshCw className="size-5" />
                            Controleer Handmatig
                        </button>
                        <button
                            onClick={() => window.location.href = returnUrl}
                            className="tab-button text-sm text-text-muted hover:text-text-main"
                            type="button">
                            Ik check het later wel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
