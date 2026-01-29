'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import QRDisplay from '@/entities/activity/ui/QRDisplay';
import { motion } from 'framer-motion';
import { CheckCircle, Home, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect, useState, Suspense, useRef } from 'react';
import { pubCrawlSignupsApi, transactionsApi } from '@/shared/lib/api/salvemundi';

function KroegentochtConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const signupId = searchParams.get('id');
    const transactionId = searchParams.get('transaction_id');
    const [status, setStatus] = useState<'loading' | 'paid' | 'open' | 'failed' | 'error'>('loading');
    const [retryCount, setRetryCount] = useState(0);
    const [signupData, setSignupData] = useState<any>(null);
    const hasSentEmail = useRef(false);

    useEffect(() => {
        if (!transactionId && !signupId) {
            setStatus('error');
            return;
        }

        const checkStatus = async () => {
            try {
                let statusValue = 'open';
                let signup = null;
                let currentSignupId = signupId;

                console.log('[Kroegentocht Bevestiging] Checking status, retry:', retryCount);

                if (transactionId) {
                    console.log('[Kroegentocht Bevestiging] Checking transaction:', transactionId);
                    const transaction = await transactionsApi.getById(transactionId);
                    statusValue = transaction.payment_status;
                    if (transaction.pub_crawl_signup) {
                        currentSignupId = typeof transaction.pub_crawl_signup === 'object'
                            ? transaction.pub_crawl_signup.id
                            : transaction.pub_crawl_signup;
                    }
                    console.log('[Kroegentocht Bevestiging] Transaction status:', statusValue);
                } else if (signupId) {
                    console.log('[Kroegentocht Bevestiging] Checking signup:', signupId);
                    signup = await pubCrawlSignupsApi.getById(signupId);
                    statusValue = signup.payment_status;
                    console.log('[Kroegentocht Bevestiging] Signup status:', statusValue, 'QR token:', signup.qr_token ? 'present' : 'missing');
                    setSignupData(signup);
                }

                if (statusValue === 'paid') {
                    console.log('[Kroegentocht Bevestiging] ✅ Payment is PAID!');
                    // Make sure we have signup data when paid
                    if (!signup && currentSignupId) {
                        signup = await pubCrawlSignupsApi.getById(currentSignupId);
                        setSignupData(signup);
                    }
                    setStatus('paid');

                    // Trigger email with tickets if not sent in this session yet
                    if (!hasSentEmail.current && (currentSignupId || (signup && signup.id))) {
                        hasSentEmail.current = true;
                        console.log('[Kroegentocht Bevestiging] Triggering ticket email...');
                        fetch('/api/send-kroegentocht-tickets', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ signupId: currentSignupId || signup.id })
                        }).then(res => {
                            if (res.ok) console.log('[Kroegentocht Bevestiging] Email trigger sent.');
                            else console.warn('[Kroegentocht Bevestiging] Email trigger failed status:', res.status);
                        }).catch(err => console.error('[Kroegentocht Bevestiging] Email trigger error:', err));
                    }

                } else if (statusValue === 'failed' || statusValue === 'canceled' || statusValue === 'expired') {
                    console.log('[Kroegentocht Bevestiging] ❌ Payment failed/canceled/expired');
                    setStatus('failed');
                } else if (retryCount < 10) {
                    // Still open, maybe webhook hasn't fired yet. Retry after 2 seconds.
                    console.log('[Kroegentocht Bevestiging] Status still open, retrying in 2s... (attempt', retryCount + 1, 'of 10)');
                    setTimeout(() => setRetryCount(prev => prev + 1), 2000);
                } else {
                    console.log('[Kroegentocht Bevestiging] ⚠️ Max retries reached, status still open');
                    setStatus('open');
                }
            } catch (err) {
                console.error('[Kroegentocht Bevestiging] Error fetching signup status:', err);
                setStatus('error');
            }
        };

        checkStatus();
    }, [signupId, transactionId, retryCount]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <>
                        <div className="w-24 h-24 bg-theme-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-12 h-12 text-theme-purple animate-spin" />
                        </div>
                        <h1 className="text-3xl font-bold text-theme-white mb-4">Status controleren...</h1>
                        <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-8 max-w-lg mx-auto">
                            We controleren je betaling. Een moment geduld alsjeblieft.
                        </p>
                    </>
                );
            case 'paid':
                return (
                    <>
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-theme-white mb-4">Inschrijving Geslaagd!</h1>
                        <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-6 max-w-lg mx-auto">
                            Bedankt voor je inschrijving voor de Kroegentocht! Je betaling is succesvol verwerkt.
                            We hebben een bevestigingsmail naar je gestuurd met de details.
                        </p>

                        {/* Display QR code if available */}
                        {signupData && signupData.qr_token && (
                            <div className="mt-8">
                                <h2 className="text-2xl font-bold text-white">Jouw Ticket{signupData.amount_tickets > 1 ? 's' : ''}</h2>
                                <p className="text-white/90 mb-4">
                                    Bewaar deze QR-code of laat deze zien bij de ingang.
                                    {signupData.amount_tickets > 1 && ` Dit ticket is geldig voor ${signupData.amount_tickets} personen.`}
                                </p>

                                <div className="bg-white/10 p-4 rounded-xl">
                                    <div className="flex justify-center">
                                        <QRDisplay qrToken={signupData.qr_token} size={200} />
                                    </div>
                                    {signupData.amount_tickets > 1 && (
                                        <p className="text-center text-white/80 mt-2 text-sm">
                                            Geldig voor {signupData.amount_tickets} personen
                                        </p>
                                    )}
                                </div>

                                <p className="text-center text-sm text-white/70 mt-4">
                                    Deze QR-code is ook per e-mail naar je verzonden.
                                </p>
                            </div>
                        )}
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
                            Helaas is je betaling niet gelukt. Je kunt het opnieuw proberen of contact met ons opnemen als dit probleem blijft optreden.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/kroegentocht')}
                                className="bg-theme-white text-theme-purple-darker font-bold py-3 px-6 rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform"
                            >
                                Opnieuw proberen
                            </button>
                        </div>
                    </>
                );
            case 'open':
                return (
                    <>
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-12 h-12 text-yellow-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-theme-white mb-4">Betaling nog in verwerking</h1>
                        <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-6 max-w-lg mx-auto">
                            Je betaling wordt nog verwerkt. Zodra de betaling is afgerond, ontvang je een bevestigingsmail. Dit kan soms een paar minuten duren.
                        </p>
                        <div className="bg-white/10 p-4 rounded-xl max-w-lg mx-auto mb-6">
                            <p className="text-sm text-white/90">
                                <strong>Tip:</strong> Je kunt deze pagina veilig sluiten. Je ontvangt een email zodra je betaling is verwerkt met je toegangscode(s).
                            </p>
                        </div>
                    </>
                );
            default:
                return (
                    <>
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-theme-white mb-4">Oeps!</h1>
                        <p className="text-lg text-theme-text-subtle dark:text-theme-text-subtle mb-8 max-w-lg mx-auto">
                            Er is iets misgegaan bij het ophalen van je inschrijvingsstatus. Geen zorgen, als je betaling geslaagd is, ontvang je alsnog een mail.
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

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
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

export default function KroegentochtConfirmation() {
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
                <KroegentochtConfirmationContent />
            </Suspense>
        </>
    );
}

