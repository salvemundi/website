'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { tripSignupsApi, tripsApi, paymentApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CheckCircle2, Loader2, AlertCircle, CreditCard, XCircle } from 'lucide-react';

function BetalingContent() {
    const params = useParams();
    const router = useRouter();
    const signupId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [signup, setSignup] = useState<any>(null);
    const [trip, setTrip] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'checking'>('pending');
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [showManualRefresh, setShowManualRefresh] = useState(false);

    useEffect(() => {
        loadData();
    }, [signupId]);

    // Poll for payment status after returning from Mollie
    useEffect(() => {
        if (!loading && signup && !checkingPayment) {
            // Check URL parameters or referrer to detect return from payment
            const urlParams = new URLSearchParams(window.location.search);
            const hasPaymentReturn = urlParams.toString().length > 0 ||
                document.referrer.includes('mollie.com') ||
                document.referrer.includes('mollie.nl');

            // If deposit is already paid, show success immediately
            if (signup.deposit_paid) {
                console.log('[betaling] Deposit already paid, showing success');
                setPaymentStatus('success');
                return;
            }

            if (hasPaymentReturn) {
                console.log('[betaling] Detected return from payment, checking status...');
                setPaymentStatus('checking');
                setCheckingPayment(true);
                checkPaymentStatus();
            }
        }
    }, [loading, signup]);

    const checkPaymentStatus = async () => {
        let attempts = 0;
        const maxAttempts = 20; // Check for up to 60 seconds (increased from 40)

        const interval = setInterval(async () => {
            attempts++;
            console.log(`[betaling] Checking payment status (attempt ${attempts}/${maxAttempts})...`);

            try {
                const signupData = await tripSignupsApi.getById(signupId);
                console.log('[betaling] Signup data:', {
                    id: signupData.id,
                    deposit_paid: signupData.deposit_paid,
                    has_deposit_paid: !!signupData.deposit_paid
                });

                if (signupData.deposit_paid) {
                    console.log('[betaling] ✅ Payment confirmed! Deposit paid at:', signupData.deposit_paid);
                    clearInterval(interval);
                    setSignup(signupData);
                    setPaymentStatus('success');
                    setCheckingPayment(false);
                    setShowManualRefresh(false);
                    // Navigate to the overview page with a success flag so the user reliably sees the success screen
                    try {
                        router.push(`/reis/aanbetaling/${signupId}?status=success`);
                    } catch (e) {
                        // Fallback: attempt to clean the URL if navigation fails
                        try {
                            const cleanUrl = window.location.origin + window.location.pathname;
                            window.history.replaceState({}, document.title, cleanUrl);
                        } catch (e2) {
                            // ignore
                        }
                    }
                    return; // Exit early
                }

                if (attempts >= maxAttempts) {
                    console.log('[betaling] ⏱️ Max attempts reached, showing manual refresh option');
                    clearInterval(interval);
                    setCheckingPayment(false);
                    setShowManualRefresh(true);
                }
            } catch (err) {
                console.error('[betaling] ❌ Error checking payment status:', err);
                // Don't stop checking on error, webhook might still be processing
            }
        }, 3000); // Check every 3 seconds (increased from 2)
    };

    const manualRefresh = async () => {
        setShowManualRefresh(false);
        setCheckingPayment(true);
        setPaymentStatus('checking');

        try {
            const signupData = await tripSignupsApi.getById(signupId);
            setSignup(signupData);

            if (signupData.deposit_paid) {
                setPaymentStatus('success');
            } else {
                // Still not paid, show pending state
                setPaymentStatus('pending');
            }
        } catch (err) {
            console.error('[betaling] Error during manual refresh:', err);
            setError('Er ging iets fout bij het controleren van de betaling');
        } finally {
            setCheckingPayment(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const signupData = await tripSignupsApi.getById(signupId);
            setSignup(signupData);

            const tripData = await tripsApi.getById(signupData.trip_id);
            setTrip(tripData);

            // Check if deposit is already paid
            if (signupData.deposit_paid) {
                console.log('[betaling] Deposit already paid, showing success');
                setPaymentStatus('success');
            }
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError('Er is een fout opgetreden bij het laden van de gegevens.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!signup || !trip) return;

        setPaying(true);
        setError(null);

        try {
            const amount = trip.deposit_amount;
            const description = `Aanbetaling ${trip.name} - ${signup.first_name}${signup.middle_name ? ' ' + signup.middle_name : ''} ${signup.last_name}`;
            const redirectUrl = `${window.location.origin}/reis/aanbetaling/${signupId}/betaling`;

            console.log('[betaling] Creating payment with data:', {
                amount,
                description,
                registrationId: signupId,
                registrationType: 'trip_signup',
                email: signup.email,
                firstName: signup.first_name,
                lastName: signup.last_name
            });

            const paymentResponse = await paymentApi.create({
                amount,
                description,
                redirectUrl,
                userId: undefined, // Not linked to user account
                email: signup.email,
                registrationId: signupId,
                registrationType: 'trip_signup',
                firstName: signup.first_name,
                lastName: signup.last_name,
            });

            console.log('[betaling] Payment created, redirecting to:', paymentResponse.checkoutUrl);

            // Redirect to Mollie checkout
            window.location.href = paymentResponse.checkoutUrl;
        } catch (err: any) {
            console.error('Error creating payment:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het aanmaken van de betaling.');
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Gegevens laden...</p>
                </div>
            </div>
        );
    }

    if (checkingPayment || showManualRefresh) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4">
                <div className="text-center max-w-md">
                    {!showManualRefresh ? (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Betaling controleren...</h2>
                            <p className="text-gray-600">We controleren of je betaling is verwerkt. Dit duurt enkele seconden.</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Betaling wordt nog verwerkt</h2>
                            <p className="text-gray-600 mb-6">
                                De betaling wordt nog verwerkt door onze systemen. Dit kan soms wat langer duren.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={manualRefresh}
                                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                                >
                                    Opnieuw controleren
                                </button>
                                <button
                                    onClick={() => router.push(`/reis/aanbetaling/${signupId}`)}
                                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                                >
                                    Terug naar overzicht
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (!signup || !trip) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Aanmelding niet gevonden</h1>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">De opgegeven aanmelding bestaat niet.</p>
                    <button
                        onClick={() => router.push('/reis')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        Terug naar reis pagina
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (paymentStatus === 'success') {
        return (
            <>
                <PageHeader
                    title="Betaling Geslaagd"
                    backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
                />
                <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
                    <div className="bg-purple-50 dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-6 sm:p-8 text-center">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-[var(--bg-soft-dark)] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">Aanbetaling Geslaagd!</h1>
                        <p className="text-base sm:text-lg text-gray-700 dark:text-[var(--text-muted-dark)] mb-4 sm:mb-6 px-2">
                            Bedankt voor je aanbetaling van <strong className="whitespace-nowrap">€{Number(trip.deposit_amount).toFixed(2)}</strong> voor {trip.name}!
                        </p>
                        <div className="bg-blue-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-blue-400 p-4 rounded mb-6 sm:mb-8 mx-2">
                            <p className="text-sm sm:text-base text-blue-700 dark:text-blue-200">
                                <strong>📧 Email bevestiging:</strong> Je ontvangt binnen enkele minuten een bevestigingsmail met je reisdetails en een overzicht van je betaling.
                            </p>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-2">
                            We zullen je informeren wanneer je de restbetaling kunt voldoen.
                            Let op: controleer ook je spam/ongewenste e-mail folder als je de bevestiging niet direct ontvangt.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                            <button
                                onClick={() => router.push('/reis')}
                                className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
                            >
                                Terug naar reis pagina
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                            >
                                Naar homepagina
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Failed state
    if (paymentStatus === 'failed') {
        return (
            <>
                <PageHeader
                    title="Betaling Mislukt"
                    backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
                />
                <div className="container mx-auto px-4 py-8 sm:py-12 max-w-2xl">
                    <div className="bg-purple-50 dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-6 sm:p-8 text-center">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 dark:bg-[var(--bg-soft-dark)] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">Betaling Mislukt</h1>
                        <p className="text-base sm:text-lg text-gray-700 dark:text-[var(--text-muted-dark)] mb-4 sm:mb-6 px-2">
                            Helaas is je betaling niet gelukt. Dit kan verschillende oorzaken hebben.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                            <button
                                onClick={() => router.push(`/reis/aanbetaling/${signupId}`)}
                                className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
                            >
                                Opnieuw proberen
                            </button>
                            <button
                                onClick={() => router.push('/contact')}
                                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                            >
                                Contact opnemen
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Pending / Initial payment state
    return (
        <>
            <PageHeader
                title={`Aanbetaling - ${trip.name}`}
                backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
            />
            <div className="container mx-auto px-4 py-8 sm:py-12 max-w-2xl">
                <div className="bg-purple-50 dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-6 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-100 dark:bg-[var(--bg-soft-dark)] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">Aanbetaling</h1>
                        <p className="text-base sm:text-lg text-gray-700 dark:text-[var(--text-muted-dark)] px-2">
                            Je staat op het punt om de aanbetaling te doen voor <strong>{trip.name}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                                <p className="text-sm sm:text-base text-red-700 break-words">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-50 dark:bg-[var(--bg-card-dark)] rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <span className="text-sm sm:text-base text-gray-700 dark:text-[var(--text-muted-dark)]">Naam</span>
                            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white text-right break-words ml-4">
                                {signup.first_name} {signup.middle_name} {signup.last_name}
                            </span>
                        </div>
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <span className="text-sm sm:text-base text-gray-700 dark:text-[var(--text-muted-dark)]">Email</span>
                            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white text-right break-all ml-4">{signup.email}</span>
                        </div>
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <span className="text-sm sm:text-base text-gray-700 dark:text-[var(--text-muted-dark)]">Reis</span>
                            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white text-right break-words ml-4">{trip.name}</span>
                        </div>
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <span className="text-sm sm:text-base text-gray-700 dark:text-[var(--text-muted-dark)]">Datum</span>
                            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white text-right ml-4">
                                {trip.event_date ? format(new Date(trip.event_date), 'd MMMM yyyy', { locale: nl }) : (trip.start_date ? format(new Date(trip.start_date), 'd MMMM yyyy', { locale: nl }) : 'N.t.b.')}
                            </span>
                        </div>
                        <div className="border-t border-gray-300 dark:border-gray-700 my-3 sm:my-4"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">Aanbetalingsbedrag</span>
                            <span className="text-2xl sm:text-3xl font-bold text-purple-600">
                                €{Number(trip.deposit_amount).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-blue-400 p-4 rounded mb-6 sm:mb-8">
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-200">
                            <strong>Let op:</strong> Na het voltooien van de betaling ontvang je een bevestigingsmail.
                            De restbetaling volgt later en wordt apart gefactureerd.
                        </p>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={paying}
                        className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                    >
                        {paying ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6 mr-3" />
                                Bezig met betaling...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                                Doorgaan naar betaling
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-[var(--text-muted-dark)] mt-4 px-2">
                        Je wordt doorgestuurd naar een beveiligde betaalomgeving
                    </p>
                </div>
            </div>
        </>
    );
}

export default function AanbetalingBetalingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
            </div>
        }>
            <BetalingContent />
        </Suspense>
    );
}
