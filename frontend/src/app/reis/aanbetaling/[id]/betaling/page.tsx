'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { tripSignupsApi, tripsApi, paymentApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CheckCircle2, Loader2, AlertCircle, CreditCard, XCircle } from 'lucide-react';

function BetalingContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const signupId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [signup, setSignup] = useState<any>(null);
    const [trip, setTrip] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

    // Check if returning from payment
    const status = searchParams.get('status');

    useEffect(() => {
        loadData();
    }, [signupId]);

    useEffect(() => {
        if (status === 'success') {
            setPaymentStatus('success');
        } else if (status === 'failed' || status === 'canceled' || status === 'expired') {
            setPaymentStatus('failed');
        }
    }, [status]);

    const loadData = async () => {
        setLoading(true);
        try {
            const signupData = await tripSignupsApi.getById(signupId);
            setSignup(signupData);

            const tripData = await tripsApi.getById(signupData.trip_id);
            setTrip(tripData);
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
            const description = `Aanbetaling ${trip.name} - ${signup.first_name} ${signup.last_name}`;
            const redirectUrl = `${window.location.origin}/reis/aanbetaling/${signupId}/betaling`;

            const paymentResponse = await paymentApi.create({
                amount,
                description,
                redirectUrl,
                userId: undefined, // Not linked to user account
                email: signup.email,
                registrationId: signupId,
                registrationType: 'trip_signup',
            });

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Gegevens laden...</p>
                </div>
            </div>
        );
    }

    if (!signup || !trip) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Aanmelding niet gevonden</h1>
                    <p className="text-gray-600 mb-6">De opgegeven aanmelding bestaat niet.</p>
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
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Aanbetaling Geslaagd!</h1>
                        <p className="text-lg text-gray-700 mb-6">
                            Bedankt voor je aanbetaling van <strong>€{trip.deposit_amount.toFixed(2)}</strong> voor {trip.name}!
                        </p>
                        <p className="text-gray-600 mb-8">
                            Je ontvangt binnenkort een bevestigingsmail met alle details. 
                            We zullen je informeren wanneer je de restbetaling kunt voldoen.
                        </p>
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
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Betaling Mislukt</h1>
                        <p className="text-lg text-gray-700 mb-6">
                            Helaas is je betaling niet gelukt. Dit kan verschillende oorzaken hebben.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push(`/reis/aanbetaling/${signupId}`)}
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
                title={`Aanbetaling - ${trip.name}`}
                backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
            />
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CreditCard className="h-12 w-12 text-purple-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Aanbetaling</h1>
                        <p className="text-lg text-gray-700">
                            Je staat op het punt om de aanbetaling te doen voor <strong>{trip.name}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                            <div className="flex items-start">
                                <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700">Naam</span>
                            <span className="font-semibold text-gray-900">
                                {signup.first_name} {signup.middle_name} {signup.last_name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700">Email</span>
                            <span className="font-semibold text-gray-900">{signup.email}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700">Reis</span>
                            <span className="font-semibold text-gray-900">{trip.name}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-700">Datum</span>
                            <span className="font-semibold text-gray-900">
                                {format(new Date(trip.event_date), 'd MMMM yyyy', { locale: nl })}
                            </span>
                        </div>
                        <div className="border-t border-gray-300 my-4"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">Aanbetalingsbedrag</span>
                            <span className="text-3xl font-bold text-purple-600">
                                €{trip.deposit_amount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-8">
                        <p className="text-sm text-blue-700">
                            <strong>Let op:</strong> Na het voltooien van de betaling ontvang je een bevestigingsmail. 
                            De restbetaling volgt later en wordt apart gefactureerd.
                        </p>
                    </div>

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

                    <p className="text-center text-sm text-gray-500 mt-4">
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
