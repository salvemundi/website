'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Home, User, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { getTransactionStatusAction } from '@/server/actions/profile/membership.actions';

interface ConfirmationIslandProps {
    transactionId: string | null;
    type: string | null;
    initialStatus?: 'loading' | 'paid' | 'open' | 'failed' | 'error';
    initialUserId?: string | null;
}

export default function ConfirmationIsland({ transactionId, type, initialStatus }: ConfirmationIslandProps) {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'paid' | 'open' | 'failed' | 'error'>(initialStatus || (transactionId ? 'loading' : 'paid'));
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!transactionId) return;

        const checkStatus = async () => {
            const result = await getTransactionStatusAction(transactionId);

            if (result.status === 'paid') {
                setStatus('paid');
            } else if (result.status === 'failed') {
                setStatus('failed');
            } else if (result.status === 'open' && retryCount < 5) {
                setTimeout(() => setRetryCount(prev => prev + 1), 2000);
            } else if (result.status === 'open') {
                setStatus('open');
            } else {
                setStatus('error');
            }
        };

        void checkStatus();
    }, [transactionId, retryCount]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center py-12">
                        <Loader2 className="mb-6 size-16 animate-spin text-theme-purple" />
                        <h1 className="mb-4 text-3xl font-bold dark:text-white">Status controleren...</h1>
                    </div>
                );
            case 'paid':
                return (
                    <>
                        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-green-500/20 shadow-glow shadow-green-500/20 dark:bg-green-500/30 dark:shadow-green-500/40">
                            <CheckCircle className="size-14 text-green-500 dark:text-green-400" />
                        </div>
                        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-theme-purple dark:text-purple-400">GESLAAGD!</h1>
                        <p className="mx-auto mb-8 max-w-lg text-lg leading-relaxed opacity-80 dark:text-white/80">
                            {type === 'renewal'
                                ? 'Welkom terug! Je lidmaatschap is succesvol verlengd. Je hebt weer volledige toegang tot alle activiteiten.'
                                : 'Bedankt voor je inschrijving! Je bent nu officieel lid van Salve Mundi. We hebben een bevestigingsmail naar je gestuurd.'}
                        </p>
                    </>
                );
            case 'failed':
                return (
                    <>
                        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-red-500/20 dark:bg-red-500/30">
                            <XCircle className="text-theme-error size-14 dark:text-red-400" />
                        </div>
                        <h1 className="text-theme-error mb-4 text-3xl font-bold dark:text-red-400">Betaling Mislukt</h1>
                        <p className="mx-auto mb-8 max-w-lg text-lg opacity-80 dark:text-white/80">
                            Helaas is de betaling niet gelukt. Je kunt het opnieuw proberen om je lidmaatschap te activeren.
                        </p>
                        <button
                            onClick={() => router.push('/lidmaatschap')}
                            className="form-button rounded-2xl bg-theme-purple px-8 py-4 font-bold text-white shadow-lg transition-transform hover:scale-105 dark:bg-purple-500"
                        >
                            Opnieuw proberen
                        </button>
                    </>
                );
            default:
                return (
                    <>
                        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-yellow-500/20">
                            <AlertTriangle className="size-14 text-yellow-500" />
                        </div>
                        <h1 className="mb-4 text-3xl font-bold dark:text-white">Verwerking...</h1>
                        <p className="mx-auto mb-8 max-w-lg text-lg opacity-80">
                            We wachten nog op bevestiging van de betaling. Dit kan een ogenblik duren.
                        </p>
                    </>
                );
        }
    };

    return (
        <div
            className="w-full max-w-2xl rounded-[2.5rem] bg-(--bg-card) p-8 text-center shadow-2xl sm:p-12 dark:border dark:border-white/10"
        >
            {renderContent()}

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                {status === 'paid' && (
                    <button
                        onClick={() => router.push('/profiel')}
                        className="form-button flex items-center justify-center gap-2 rounded-2xl bg-theme-purple px-8 py-4 font-bold text-white shadow-glow transition-all hover:scale-105"
                    >
                        <User className="size-5" />
                        Naar mijn account
                    </button>
                )}
                <button
                    onClick={() => router.push('/')}
                    className="form-button flex items-center justify-center gap-2 rounded-2xl border border-purple-100 bg-purple-50 px-8 py-4 font-bold text-theme-purple transition-all hover:bg-purple-100 dark:border-white/10 dark:bg-white/5 dark:text-purple-400 dark:hover:bg-white/10"
                >
                    <Home className="size-5" />
                    Terug naar Home
                </button>
            </div>
        </div>
    );
}
