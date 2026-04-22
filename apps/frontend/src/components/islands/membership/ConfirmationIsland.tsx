'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Home, User, XCircle, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTransactionStatusAction } from '@/server/actions/membership.actions';
import BackButton from '@/components/ui/navigation/BackButton';

interface ConfirmationIslandProps {
    transactionId: string | null;
    type: string | null;
    initialStatus?: 'loading' | 'paid' | 'open' | 'failed' | 'error';
    initialUserId?: string | null;
}

export default function ConfirmationIsland({ transactionId, type, initialStatus, initialUserId }: ConfirmationIslandProps) {
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

        checkStatus();
    }, [transactionId, retryCount]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="py-12 flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-theme-purple animate-spin mb-6" />
                        <h1 className="text-3xl font-bold dark:text-white mb-4">Status controleren...</h1>
                    </div>
                );
            case 'paid':
                return (
                    <>
                        <div className="w-24 h-24 bg-green-500/20 dark:bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow shadow-green-500/20 dark:shadow-green-500/40 animate-in zoom-in duration-500">
                            <CheckCircle className="w-14 h-14 text-green-500 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl font-black text-theme-purple dark:text-purple-400 mb-4 tracking-tight">GESLAAGD!</h1>
                        <p className="text-lg opacity-80 dark:text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
                            {type === 'renewal'
                                ? 'Welkom terug! Je lidmaatschap is succesvol verlengd. Je hebt weer volledige toegang tot alle activiteiten.'
                                : 'Bedankt voor je inschrijving! Je bent nu officieel lid van Salve Mundi. We hebben een bevestigingsmail naar je gestuurd.'}
                        </p>
                    </>
                );
            case 'failed':
                return (
                    <>
                        <div className="w-24 h-24 bg-red-500/20 dark:bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                            <XCircle className="w-14 h-14 text-theme-error dark:text-red-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-theme-error dark:text-red-400 mb-4">Betaling Mislukt</h1>
                        <p className="text-lg opacity-80 dark:text-white/80 mb-8 max-w-lg mx-auto">
                            Helaas is de betaling niet gelukt. Je kunt het opnieuw proberen om je lidmaatschap te activeren.
                        </p>
                        <button
                            onClick={() => router.push('/lidmaatschap')}
                            className="bg-theme-purple dark:bg-purple-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                        >
                            Opnieuw proberen
                        </button>
                    </>
                );
            default:
                return (
                    <>
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-14 h-14 text-yellow-500" />
                        </div>
                        <h1 className="text-3xl font-bold dark:text-white mb-4">Verwerking...</h1>
                        <p className="text-lg opacity-80 mb-8 max-w-lg mx-auto">
                            We wachten nog op bevestiging van de betaling. Dit kan een ogenblik duren.
                        </p>
                    </>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2.5rem] shadow-2xl p-8 sm:p-12 text-center"
        >
            {renderContent()}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                {status === 'paid' && (
                    <button
                        onClick={() => router.push('/profiel')}
                        className="flex items-center justify-center gap-2 bg-theme-purple text-white font-bold py-4 px-8 rounded-2xl shadow-glow transition-all hover:scale-105"
                    >
                        <User className="w-5 h-5" />
                        Naar mijn account
                    </button>
                )}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center justify-center gap-2 bg-purple-50 dark:bg-white/5 text-theme-purple dark:text-purple-400 font-bold py-4 px-8 rounded-2xl border border-purple-100 dark:border-white/10 transition-all hover:bg-purple-100 dark:hover:bg-white/10"
                >
                    <Home className="w-5 h-5" />
                    Terug naar Home
                </button>
            </div>
        </motion.div>
    );
}
