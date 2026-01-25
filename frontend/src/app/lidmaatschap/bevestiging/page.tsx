'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { motion } from 'framer-motion';
import { CheckCircle, Home, User, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { transactionsApi } from '@/shared/lib/api/salvemundi';

function SignUpConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('transaction_id');
    const type = searchParams.get('type');
    const [status, setStatus] = useState<'loading' | 'paid' | 'open' | 'failed' | 'error'>('loading');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!transactionId) {
            // If no transaction ID is provided, we assume success IF they got here normally in the old flow
            // But for safety, let's treat it as paid if no ID is present to avoid breaking current users
            setStatus('paid');
            return;
        }

        const checkStatus = async () => {
            try {
                const transaction = await transactionsApi.getById(transactionId);
                if (transaction.payment_status === 'paid') {
                    setStatus('paid');
                } else if (transaction.payment_status === 'failed' || transaction.payment_status === 'canceled' || transaction.payment_status === 'expired') {
                    setStatus('failed');
                } else if (retryCount < 5) {
                    setTimeout(() => setRetryCount(prev => prev + 1), 2000);
                } else {
                    setStatus('open');
                }
            } catch (err) {
                console.error('Error fetching transaction status:', err);
                setStatus('error');
            }
        };

        checkStatus();
    }, [transactionId, retryCount]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="py-12">
                        <Loader2 className="w-12 h-12 text-theme-purple animate-spin mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-theme-white mb-4">Status controleren...</h1>
                    </div>
                );
            case 'paid':
                if (type === 'renewal') {
                    return (
                        <>
                            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-green-400" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-theme-white mb-4">Verlenging Geslaagd!</h1>
                            <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-8 max-w-lg mx-auto">
                                Welkom terug! Je lidmaatschap is succesvol verlengd. Je betaling is verwerkt en je hebt weer toegang tot alle activiteiten.
                                We hebben een bevestigingsmail naar je gestuurd.
                            </p>
                        </>
                    );
                }
                return (
                    <>
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-theme-white mb-4">Inschrijving Geslaagd!</h1>
                        <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-8 max-w-lg mx-auto">
                            Bedankt voor je inschrijving bij Salve Mundi. Je betaling is verwerkt en je bent nu officieel lid!
                            We hebben een bevestigingsmail naar je gestuurd.
                        </p>
                    </>
                );
            case 'failed':
                return (
                    <>
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-theme-white mb-4">Betaling Mislukt</h1>
                        <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-8 max-w-lg mx-auto">
                            Helaas is de betaling voor je lidmaatschap niet gelukt. Je kunt het opnieuw proberen om je inschrijving te voltooien.
                        </p>
                        <button
                            onClick={() => router.push('/lidmaatschap')}
                            className="bg-theme-white text-theme-purple-darker font-bold py-3 px-6 rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform"
                        >
                            Opnieuw proberen
                        </button>
                    </>
                );
            default:
                return (
                    <>
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-12 h-12 text-yellow-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-theme-white mb-4">Betaling nog in verwerking</h1>
                        <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-8 max-w-lg mx-auto">
                            We wachten nog op bevestiging van de betaling. Zodra dit verwerkt is, wordt je account geactiveerd en ontvang je een mail.
                        </p>
                    </>
                );
        }
    };

    return (
        <main className="">
            <div className="flex flex-col items-center justify-center p-6 sm:p-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl bg-gradient-theme rounded-3xl shadow-lg p-8 sm:p-12 text-center"
                >
                    {renderContent()}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        {status === 'paid' && (
                            <button
                                onClick={() => router.push('/account')}
                                className="flex items-center justify-center gap-2 bg-theme-white text-theme-purple-darker font-bold py-3 px-6 rounded-xl shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                <User className="w-5 h-5" />
                                Naar mijn account
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center justify-center gap-2 bg-theme-purple-darker/50 text-theme-white font-bold py-3 px-6 rounded-xl border border-theme-white/20 transition-transform hover:-translate-y-0.5 hover:bg-theme-purple-darker/70"
                        >
                            <Home className="w-5 h-5" />
                            Terug naar home
                        </button>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}

export default function SignUpConfirmation() {
    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader
                    title="BEVESTIGING"
                    backgroundImage="/img/placeholder.svg"
                />
            </div>
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-10 h-10 text-theme-purple animate-spin" />
                </div>
            }>
                <SignUpConfirmationContent />
            </Suspense>
        </>
    );
}

