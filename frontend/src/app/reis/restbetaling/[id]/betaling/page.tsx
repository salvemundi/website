'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { tripSignupsApi, tripsApi, paymentApi, tripSignupActivitiesApi, tripActivitiesApi, getImageUrl } from '@/shared/lib/api/salvemundi';
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
    const [selectedActivities, setSelectedActivities] = useState<any[]>([]);
    const [selectedActivityOptions, setSelectedActivityOptions] = useState<Record<number, string[]>>({});
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'checking'>('pending');
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [showManualRefresh, setShowManualRefresh] = useState(false);
    const [costs, setCosts] = useState({
        base: 0,
        activities: 0,
        crewDiscount: 0,
        deposit: 0,
        total: 0,
        remaining: 0,
    });

    useEffect(() => {
        loadData();
    }, [signupId]);

    // Poll for payment status after returning from Mollie
    useEffect(() => {
        // Only run this effect once on mount or when strict dependencies change
        if (!loading && signup && !signup.full_payment_paid && !checkingPayment) {
            const urlParams = new URLSearchParams(window.location.search);
            const hasTransactionId = urlParams.has('transaction_id');
            // We removed referrer check because it can cause loops if not handled carefully

            if (hasTransactionId) {
                console.log('[restbetaling] Found transaction_id in URL, starting status check...');
                setPaymentStatus('checking');
                setCheckingPayment(true);
                checkPaymentStatus();
            }
        }
    }, [loading, signup?.id]); // Removed 'signup' object dependency to prevent loops on deep updates, used ID instead

    const checkPaymentStatus = async () => {
        let attempts = 0;
        const maxAttempts = 20; // Check for up to 40 seconds

        const interval = setInterval(async () => {
            attempts++;
            console.log(`[restbetaling] Checking payment status (attempt ${attempts}/${maxAttempts})...`);

            try {
                const signupData = await tripSignupsApi.getById(signupId);

                if (signupData.full_payment_paid) {
                    console.log('[restbetaling] Payment confirmed! Showing success page');
                    clearInterval(interval);
                    setSignup(signupData);
                    setPaymentStatus('success');
                    setCheckingPayment(false);
                    setShowManualRefresh(false);
                }

                if (attempts >= maxAttempts) {
                    console.log('[restbetaling] Max attempts reached, showing manual refresh option');
                    clearInterval(interval);
                    setCheckingPayment(false);
                    setShowManualRefresh(true);
                }
            } catch (err) {
                console.error('[restbetaling] Error checking payment status:', err);
            }
        }, 2000); // Check every 2 seconds
    };

    const manualRefresh = async () => {
        setShowManualRefresh(false);
        setCheckingPayment(true);
        setPaymentStatus('checking');

        try {
            const signupData = await tripSignupsApi.getById(signupId);
            setSignup(signupData);

            if (signupData.full_payment_paid) {
                setPaymentStatus('success');
            } else {
                // Still not paid, show pending state
                setPaymentStatus('pending');
            }
        } catch (err) {
            console.error('[restbetaling] Error during manual refresh:', err);
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

            // Load selected activities
            const signupActivities = await tripSignupActivitiesApi.getBySignupId(signupId);

            // Extract selected options
            const optionsMap: Record<number, string[]> = {};
            signupActivities.forEach((sa: any) => {
                const id = (sa.trip_activity_id && sa.trip_activity_id.id) ? sa.trip_activity_id.id : (sa.trip_activity_id || sa.activity_id);
                if (id && sa.selected_options) {
                    optionsMap[id] = Array.isArray(sa.selected_options) ? sa.selected_options : [];
                }
            });
            setSelectedActivityOptions(optionsMap);

            // Support different shapes returned by API
            const activityIds = signupActivities
                .map((a: any) => (a.trip_activity_id && a.trip_activity_id.id) ? a.trip_activity_id.id : (a.trip_activity_id || a.activity_id || null))
                .filter(Boolean);
            const activities = await tripActivitiesApi.getByTripId(signupData.trip_id);
            const selected = activities.filter((a: any) => activityIds.includes(a.id));
            setSelectedActivities(selected);

            // Calculate costs
            const basePrice = Number(tripData.base_price) || 0;
            const activitiesTotal = selected.reduce((sum: number, a: any) => {
                let price = Number(a.price) || 0;
                const opts = optionsMap[a.id];
                if (opts && a.options) {
                    opts.forEach(optName => {
                        const opt = a.options.find((o: any) => o.name === optName);
                        if (opt) price += Number(opt.price) || 0;
                    });
                }
                return sum + price;
            }, 0);
            const crewDiscount = signupData.role === 'crew' ? (Number(tripData.crew_discount) || 0) : 0;
            const deposit = Number(tripData.deposit_amount) || 0;
            const totalCost = basePrice + activitiesTotal - crewDiscount;
            // For restbetaling: the remaining amount is the full total (base + activities - crew discount) minus the deposit
            const remaining = Math.max(0, totalCost - deposit);

            setCosts({
                base: basePrice,
                activities: activitiesTotal,
                crewDiscount,
                deposit,
                total: totalCost,
                remaining: remaining > 0 ? remaining : 0,
            });

            // Check if full payment is already made (returning from successful payment)
            if (signupData.full_payment_paid) {
                console.log('[restbetaling] Full payment already made, showing success');
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
        if (!signup || !trip || costs.remaining <= 0) {
            console.warn('[restbetaling] Cannot initiate payment:', { hasSignup: !!signup, hasTrip: !!trip, remaining: costs.remaining });
            return;
        }

        setPaying(true);
        setError(null);

        try {
            const amount = costs.remaining;
            const description = `Restbetaling ${trip.name} - ${signup.first_name}${signup.middle_name ? ' ' + signup.middle_name : ''} ${signup.last_name}`;
            const redirectUrl = `${window.location.origin}/reis/restbetaling/${signupId}/betaling`;

            console.log('[restbetaling] Initiating payment API call...', {
                amount,
                registrationId: signupId,
                email: signup.email
            });

            const paymentResponse = await paymentApi.create({
                amount,
                description,
                redirectUrl,
                userId: undefined,
                email: signup.email,
                registrationId: signupId,
                registrationType: 'trip_signup',
                firstName: signup.first_name,
                lastName: signup.last_name,
            });

            console.log('[restbetaling] Payment API success, redirecting to Mollie:', paymentResponse.checkoutUrl);

            // Redirect to Mollie checkout
            window.location.href = paymentResponse.checkoutUrl;
        } catch (err: any) {
            console.error('[restbetaling] Error creating payment:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het aanmaken van de betaling.');
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-[var(--bg-soft-dark)] dark:to-[var(--bg-main-dark)]">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-[var(--text-muted-dark)]">Gegevens laden...</p>
                </div>
            </div>
        );
    }

    if (checkingPayment || showManualRefresh) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-[var(--bg-soft-dark)] dark:to-[var(--bg-main-dark)] px-4">
                <div className="text-center max-w-md">
                    {!showManualRefresh ? (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Betaling controleren...</h2>
                            <p className="text-gray-600 dark:text-[var(--text-muted-dark)]">We controleren of je betaling is verwerkt. Dit duurt enkele seconden.</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Betaling wordt nog verwerkt</h2>
                            <p className="text-gray-600 dark:text-[var(--text-muted-dark)] mb-6">
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
                                    onClick={() => router.push(`/reis/restbetaling/${signupId}`)}
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-[var(--bg-soft-dark)] dark:to-[var(--bg-main-dark)]">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Aanmelding niet gevonden</h1>
                    <p className="text-gray-600 dark:text-[var(--text-muted-dark)] mb-6">De opgegeven aanmelding bestaat niet.</p>
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
                <div className="container mx-auto px-4 py-12 max-w-2xl">
                    <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 text-center border border-[var(--border-color)] dark:border-white/10">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Betaling Voltooid!</h1>
                        <p className="text-lg text-gray-700 dark:text-[var(--text-muted-dark)] mb-6">
                            Bedankt voor je betaling van <strong>€{costs.remaining.toFixed(2)}</strong> voor {trip.name}!
                        </p>
                        <p className="text-gray-600 dark:text-[var(--text-muted-dark)] mb-8">
                            Je bent nu volledig ingeschreven voor de reis. Je ontvangt binnenkort een bevestigingsmail
                            met alle details en verdere instructies.
                        </p>
                        <div className="bg-purple-50 dark:bg-purple-900/10 border-l-4 border-purple-400 dark:border-purple-500 p-4 rounded mb-8 text-left">
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                                <strong>Wat gebeurt er nu?</strong>
                            </p>
                            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
                                <li>Je ontvangt een bevestigingsmail met alle details</li>
                                <li>We sturen je verdere informatie over de reis enkele weken van tevoren</li>
                                <li>Bij vragen kun je altijd contact met ons opnemen</li>
                            </ul>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/reis')}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                Terug naar reis pagina
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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
                <div className="container mx-auto px-4 py-12 max-w-2xl">
                    <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 text-center border border-[var(--border-color)] dark:border-white/10">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Betaling Mislukt</h1>
                        <p className="text-lg text-gray-700 dark:text-[var(--text-muted-dark)] mb-6">
                            Helaas is je betaling niet gelukt. Dit kan verschillende oorzaken hebben.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push(`/reis/restbetaling/${signupId}`)}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                Opnieuw proberen
                            </button>
                            <button
                                onClick={() => router.push('/contact')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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
                title={`Restbetaling - ${trip.name}`}
                backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
            />
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 border border-[var(--border-color)] dark:border-white/10 mb-8 relative overflow-hidden">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CreditCard className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Restbetaling</h1>
                        <p className="text-lg text-gray-700 dark:text-[var(--text-muted-dark)]">
                            Je staat op het punt om de restbetaling te doen voor <strong>{trip.name}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-400 dark:border-red-600 p-4 rounded">
                            <div className="flex items-start">
                                <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                                <p className="text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 mb-8 border border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Naam</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {signup.first_name} {signup.middle_name} {signup.last_name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Email</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{signup.email}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Reis</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{trip.name}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Datum</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {trip.event_date ? format(new Date(trip.event_date), 'd MMMM yyyy', { locale: nl }) : (trip.start_date ? format(new Date(trip.start_date), 'd MMMM yyyy', { locale: nl }) : 'N.t.b.')}
                            </span>
                        </div>

                        <div className="border-t border-gray-300 dark:border-white/10 my-4"></div>

                        {/* Cost Breakdown */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Basisprijs</span>
                                <span className="text-gray-900 dark:text-white">€{costs.base.toFixed(2)}</span>
                            </div>

                            {selectedActivities.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Activiteiten:</span>
                                        <span className="text-gray-900 dark:text-white">€{costs.activities.toFixed(2)}</span>
                                    </div>
                                    {selectedActivities.map((activity) => {
                                        let activityPrice = Number(activity.price) || 0;
                                        const options = selectedActivityOptions[activity.id] || [];
                                        let optionText = '';

                                        if (activity.options && options.length > 0) {
                                            options.forEach(optName => {
                                                const opt = activity.options.find((o: any) => o.name === optName);
                                                if (opt) {
                                                    activityPrice += Number(opt.price) || 0;
                                                    optionText += ` (+ ${optName})`;
                                                }
                                            });
                                        }

                                        return (
                                            <div key={activity.id} className="flex justify-between items-center text-sm pl-4">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    • {activity.name}
                                                    {optionText && <span className="text-xs block text-gray-500 dark:text-gray-500">{optionText}</span>}
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">€{activityPrice.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {costs.crewDiscount > 0 && (
                                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                    <span>Crew korting</span>
                                    <span>-€{costs.crewDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {costs.deposit > 0 && (
                                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                    <span>Reeds betaalde aanbetaling</span>
                                    <span>-€{costs.deposit.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="border-t border-gray-300 dark:border-white/10 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">Te betalen</span>
                                    <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                        €{costs.remaining.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded mb-8">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Let op:</strong> Dit is de restbetaling voor je reis. Na het voltooien van deze betaling
                            ben je volledig ingeschreven en ontvang je een bevestigingsmail.
                        </p>
                    </div>

                    {costs.remaining > 0 ? (
                        <button
                            onClick={handlePayment}
                            disabled={paying}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {paying ? (
                                <>
                                    <Loader2 className="animate-spin h-6 w-6 mr-3" />
                                    Bezig met betaling...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-3 h-6 w-6" />
                                    Doorgaan naar betaling
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-400 dark:border-green-600 p-4 rounded">
                            <div className="flex items-start">
                                <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-300 mb-1">Betaling voltooid</p>
                                    <p className="text-sm text-green-600 dark:text-green-300/80">
                                        Je hebt alle kosten voor deze reis al betaald. Er is geen restbetaling meer nodig.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {paying && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                            Je wordt doorgestuurd naar een beveiligde betaalomgeving
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

export default function RestbetalingBetalingPage() {
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
