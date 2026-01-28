'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import {
    tripSignupsApi,
    tripActivitiesApi,
    tripSignupActivitiesApi,
    tripsApi,
    getImageUrl
} from '@/shared/lib/api/salvemundi';
import type { Trip, TripActivity, TripSignup } from '@/shared/lib/api/salvemundi';
import {
    CheckCircle2,
    Loader2,
    AlertCircle,
    Utensils,
    Save,
    ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ActiviteitenAanpassenPage() {
    const params = useParams();
    const router = useRouter();
    const signupId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [signup, setSignup] = useState<TripSignup | null>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [activities, setActivities] = useState<TripActivity[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
    const [originalActivities, setOriginalActivities] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, [signupId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load signup
            const signupData = await tripSignupsApi.getById(signupId);
            setSignup(signupData);

            // Check if allowed to edit activities
            if (!signupData.deposit_paid) {
                // Not yet paid deposit, redirect to aanbetaling
                router.push(`/reis/aanbetaling/${signupId}`);
                return;
            }

            if (signupData.full_payment_paid) {
                // Already paid full amount, cannot edit anymore
                setError('Je hebt de restbetaling al voldaan. Activiteiten kunnen niet meer worden aangepast. Neem contact op met de reiscommissie als je wijzigingen wilt doorvoeren.');
                setLoading(false);
                return;
            }

            // Load trip
            const tripData = await tripsApi.getById(signupData.trip_id);
            setTrip(tripData);

            // Load activities
            const activitiesData = await tripActivitiesApi.getByTripId(signupData.trip_id);
            setActivities(activitiesData.filter(a => a.is_active));

            // Load existing selected activities
            const existingActivities = await tripSignupActivitiesApi.getBySignupId(signupId);
            const existingIds = existingActivities.map((a: any) => a.trip_activity_id.id || a.trip_activity_id);
            setSelectedActivities(existingIds);
            setOriginalActivities(existingIds);

        } catch (err: any) {
            console.error('Error loading data:', err);
            setError('Er is een fout opgetreden bij het laden van de gegevens.');
        } finally {
            setLoading(false);
        }
    };

    const toggleActivity = (activityId: number) => {
        setSelectedActivities(prev =>
            prev.includes(activityId)
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
        if (error) setError(null);
    };

    const handleSave = async () => {
        setError(null);
        setSubmitting(true);

        try {
            // Get current activities from DB
            const existingActivities = await tripSignupActivitiesApi.getBySignupId(signupId);
            const existingActivityIds = existingActivities.map((a: any) => a.trip_activity_id.id || a.trip_activity_id);

            // Remove activities that are no longer selected
            for (const existing of existingActivities) {
                const activityId = existing.trip_activity_id.id || existing.trip_activity_id;
                if (!selectedActivities.includes(activityId)) {
                    await tripSignupActivitiesApi.delete(existing.id);
                }
            }

            // Add newly selected activities
            for (const activityId of selectedActivities) {
                if (!existingActivityIds.includes(activityId)) {
                    await tripSignupActivitiesApi.create({
                        trip_signup_id: signupId,
                        trip_activity_id: activityId,
                    });
                }
            }

            setSuccess(true);
            setOriginalActivities(selectedActivities);

            // Redirect back after a short delay
            setTimeout(() => {
                router.push(`/reis/restbetaling/${signupId}`);
            }, 2000);

        } catch (err: any) {
            console.error('Error saving activities:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het opslaan van je activiteiten.');
        } finally {
            setSubmitting(false);
        }
    };

    const hasChanges = JSON.stringify(selectedActivities.sort()) !== JSON.stringify(originalActivities.sort());

    const totalActivitiesPrice = activities
        .filter(a => selectedActivities.includes(a.id))
        .reduce((sum, a) => sum + (Number(a.price) || 0), 0);

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

    if (!signup || !trip) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-[var(--bg-soft-dark)] dark:to-[var(--bg-main-dark)]">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Aanmelding niet gevonden</h1>
                    <p className="text-gray-600 dark:text-[var(--text-muted-dark)] mb-6">De opgegeven aanmelding bestaat niet of je hebt geen toegang.</p>
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

    return (
        <>
            <PageHeader
                title={`Activiteiten Aanpassen - ${trip.name}`}
                backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
            />

            <div className="container mx-auto px-4 py-12 max-w-3xl">
                {/* Back link */}
                <Link
                    href={`/reis/restbetaling/${signupId}`}
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6 transition"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Terug naar restbetaling
                </Link>

                {/* Success message */}
                {success && (
                    <div className="mb-8 bg-green-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-green-400 p-6 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-green-800 dark:text-green-300 font-bold text-lg mb-2">Activiteiten opgeslagen!</h3>
                                <p className="text-green-700 dark:text-green-200">
                                    Je activiteiten zijn succesvol bijgewerkt. Je wordt doorgestuurd naar de restbetalingspagina...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-8 bg-red-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-red-400 p-6 rounded-lg">
                        <div className="flex items-start">
                            <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    </div>
                )}

                {/* Info message */}
                {!signup.full_payment_paid && (
                    <div className="mb-8 bg-blue-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-blue-400 p-6 rounded-lg">
                        <div className="flex items-start">
                            <Utensils className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-blue-800 dark:text-blue-300 font-bold text-lg mb-2">Activiteiten aanpassen</h3>
                                <p className="text-blue-700 dark:text-blue-200">
                                    Je kunt je activiteiten aanpassen tot je de restbetaling hebt voldaan.
                                    De kosten voor activiteiten worden meegenomen in de restbetaling.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activities selection */}
                {activities.length > 0 && !signup.full_payment_paid && (
                    <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 border-t-4 border-blue-600 mb-8">
                        <div className="flex items-center mb-6">
                            <Utensils className="h-6 w-6 text-blue-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Beschikbare Activiteiten</h2>
                        </div>

                        <div className="space-y-4">
                            {activities.map(activity => (
                                <div
                                    key={activity.id}
                                    onClick={() => toggleActivity(activity.id)}
                                    className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${selectedActivities.includes(activity.id)
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                                            : 'bg-gray-50 dark:bg-[var(--bg-soft-dark)] border-2 border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedActivities.includes(activity.id)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white border-2 border-gray-300'
                                            }`}>
                                            {selectedActivities.includes(activity.id) && (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                        </div>
                                    </div>

                                    {activity.image && (
                                        <Image
                                            src={getImageUrl(activity.image)}
                                            alt={activity.name}
                                            width={80}
                                            height={80}
                                            className="rounded-lg object-cover flex-shrink-0"
                                        />
                                    )}

                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{activity.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-[var(--text-muted-dark)]">{activity.description}</p>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-bold text-blue-600">€{Number(activity.price).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-[var(--text-muted-dark)]">Totaal activiteiten:</span>
                                <span className="text-xl font-bold text-blue-600">€{totalActivitiesPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Save button */}
                        <div className="mt-6 flex gap-4">
                            <Link
                                href={`/reis/restbetaling/${signupId}`}
                                className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-[var(--text-muted-dark)] rounded-lg hover:bg-gray-50 dark:hover:bg-[var(--bg-soft-dark)] transition text-center font-semibold"
                            >
                                Annuleren
                            </Link>
                            <button
                                onClick={handleSave}
                                disabled={submitting || !hasChanges || success}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" />
                                        Opslaan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Wijzigingen opslaan
                                    </>
                                )}
                            </button>
                        </div>

                        {!hasChanges && !success && (
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Je hebt nog geen wijzigingen gemaakt.
                            </p>
                        )}
                    </div>
                )}

                {/* No activities available */}
                {activities.length === 0 && !error && (
                    <div className="bg-gray-50 dark:bg-[var(--bg-card-dark)] rounded-xl p-8 text-center">
                        <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">Geen activiteiten beschikbaar</h3>
                        <p className="text-gray-500 dark:text-[var(--text-muted-dark)]">
                            Er zijn geen activiteiten beschikbaar voor deze reis.
                        </p>
                        <Link
                            href={`/reis/restbetaling/${signupId}`}
                            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Terug naar restbetaling
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
