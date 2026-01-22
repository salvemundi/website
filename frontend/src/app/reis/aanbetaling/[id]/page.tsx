'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { 
    tripSignupsApi, 
    tripActivitiesApi, 
    tripSignupActivitiesApi,
    tripsApi,
    getImageUrl 
} from '@/shared/lib/api/salvemundi';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
    CheckCircle2, 
    Loader2, 
    AlertCircle, 
    CreditCard,
    User,
    FileText,
    Bus,
    Utensils
} from 'lucide-react';
import Image from 'next/image';

interface TripSignup {
    id: number;
    trip_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth?: string;
    id_document_type?: 'passport' | 'id_card';
    allergies?: string;
    special_notes?: string;
    willing_to_drive?: boolean;
    role: 'participant' | 'crew';
    status: string;
    deposit_paid: boolean;
    deposit_paid_at?: string;
}

interface Trip {
    id: number;
    name: string;
    description: string;
    image?: string;
    event_date: string;
    deposit_amount: number;
    is_bus_trip: boolean;
}

interface TripActivity {
    id: number;
    name: string;
    description: string;
    price: number;
    image?: string;
    max_participants?: number;
}

export default function AanbetalingPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const signupId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [signup, setSignup] = useState<TripSignup | null>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [activities, setActivities] = useState<TripActivity[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const [form, setForm] = useState({
        date_of_birth: '',
        id_document_type: '' as '' | 'passport' | 'id_card',
        allergies: '',
        special_notes: '',
        willing_to_drive: false,
    });

    useEffect(() => {
        loadData();
    }, [signupId]);

    useEffect(() => {
        // Check if returning from successful payment
        const status = searchParams.get('status');
        if (status === 'success') {
            setPaymentSuccess(true);
            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [searchParams]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load signup
            const signupData = await tripSignupsApi.getById(signupId);
            setSignup(signupData);

            // Check if already paid deposit
            if (signupData.deposit_paid) {
                router.push(`/reis/restbetaling/${signupId}`);
                return;
            }

            // Load trip
            const tripData = await tripsApi.getById(signupData.trip_id);
            setTrip(tripData);

            // Load activities
            const activitiesData = await tripActivitiesApi.getByTripId(signupData.trip_id);
            setActivities(activitiesData);

            // Load existing selected activities
            const existingActivities = await tripSignupActivitiesApi.getBySignupId(signupId);
            setSelectedActivities(existingActivities.map((a: any) => a.trip_activity_id.id || a.trip_activity_id));

            // Pre-fill form with existing data
            setForm({
                date_of_birth: signupData.date_of_birth || '',
                id_document_type: (signupData.id_document_type as 'passport' | 'id_card') || '',
                allergies: signupData.allergies || '',
                special_notes: signupData.special_notes || '',
                willing_to_drive: signupData.willing_to_drive || false,
            });
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError('Er is een fout opgetreden bij het laden van de gegevens.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setForm({ ...form, [name]: value });
        }
        if (error) setError(null);
    };

    const toggleActivity = (activityId: number) => {
        setSelectedActivities(prev => 
            prev.includes(activityId) 
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!form.date_of_birth) {
            setError('Geboortedatum is verplicht.');
            return;
        }

        if (!form.id_document_type) {
            setError('Kies een ID document type.');
            return;
        }

        setSubmitting(true);
        try {
            // Update signup with additional data
            await tripSignupsApi.update(signupId, {
                date_of_birth: form.date_of_birth,
                id_document_type: form.id_document_type,
                allergies: form.allergies || undefined,
                special_notes: form.special_notes || undefined,
                willing_to_drive: trip?.is_bus_trip ? form.willing_to_drive : undefined,
            });

            // Get current activities
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
            
            // Redirect to payment page
            setTimeout(() => {
                router.push(`/reis/aanbetaling/${signupId}/betaling`);
            }, 1500);

        } catch (err: any) {
            console.error('Error submitting form:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het opslaan van je gegevens.');
        } finally {
            setSubmitting(false);
        }
    };

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

    return (
        <>
            <PageHeader
                title={`Aanbetaling - ${trip.name}`}
                backgroundImage={trip.image ? getImageUrl(trip.image) : '/img/placeholder.svg'}
            />

            <div className="container mx-auto px-4 py-12 max-w-3xl">
                {/* Progress indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-[var(--text-muted-dark)]">Aanmelding</span>
                        </div>
                        <div className="flex-1 h-1 bg-purple-600 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white mb-2">
                                2
                            </div>
                            <span className="text-xs font-semibold text-purple-600">Aanbetaling</span>
                        </div>
                        <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 mb-2">
                                3
                            </div>
                            <span className="text-xs font-semibold text-gray-500">Restbetaling</span>
                        </div>
                    </div>
                </div>

                {/* Payment Success message */}
                {paymentSuccess && (
                    <div className="mb-8 bg-green-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-green-400 p-6 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle2 className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-green-800 dark:text-green-300 font-bold text-xl mb-2">Betaling geslaagd!</h3>
                                <p className="text-green-700 dark:text-green-200 mb-3">
                                    Bedankt voor je aanbetaling van <strong>€{trip && Number(trip.deposit_amount).toFixed(2)}</strong> voor {trip?.name}!
                                </p>
                                <p className="text-green-700 text-sm">
                                    Je ontvangt binnenkort een bevestigingsmail met alle details. 
                                    We zullen je informeren wanneer je de restbetaling kunt voldoen.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => router.push('/reis')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                    >
                                        Terug naar reis pagina
                                    </button>
                                    <button
                                        onClick={() => router.push('/')}
                                        className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition text-sm"
                                    >
                                        Naar homepagina
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success message */}
                {success && (
                    <div className="mb-8 bg-green-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-green-400 p-6 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-green-800 dark:text-green-300 font-bold text-lg mb-2">Gegevens opgeslagen!</h3>
                                <p className="text-green-700 dark:text-green-200">
                                    Je wordt doorgestuurd naar de betaalpagina...
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

                {/* Show form only if payment is not successful yet */}
                {!paymentSuccess && (
                    <>
                {/* Info card */}
                    <div className="bg-blue-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-blue-400 p-6 rounded-lg mb-8">
                            <div className="flex items-start">
                                <User className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                            <h3 className="text-blue-800 dark:text-blue-200 font-bold mb-2">Welkom, {signup.first_name}!</h3>
                            <p className="text-blue-700 dark:text-blue-200 text-sm">
                                Je hebt je succesvol aangemeld voor <strong>{trip.name}</strong> op{' '}
                                {format(new Date(trip.event_date), 'd MMMM yyyy', { locale: nl })}.
                            </p>
                            <p className="text-blue-700 text-sm mt-2">
                                Om je aanmelding definitief te maken, hebben we nog wat extra informatie nodig en 
                                vragen we je om een aanbetaling van <strong>€{Number(trip.deposit_amount).toFixed(2)}</strong> te doen.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="bg-purple-50 dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 border-t-4 border-purple-600">
                        <div className="flex items-center mb-6">
                            <FileText className="h-6 w-6 text-purple-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aanvullende gegevens</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">
                                        Geboortedatum <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={form.date_of_birth}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        ID Document Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="id_document_type"
                                        value={form.id_document_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                        required
                                    >
                                        <option value="">Selecteer...</option>
                                        <option value="passport">Paspoort</option>
                                        <option value="id_card">ID Kaart</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Allergieën
                                </label>
                                <textarea
                                    name="allergies"
                                    value={form.allergies}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                    placeholder="Vermeld hier eventuele allergieën..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bijzonderheden
                                </label>
                                <textarea
                                    name="special_notes"
                                    value={form.special_notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                    placeholder="Overige bijzonderheden die we moeten weten..."
                                />
                            </div>

                            {trip.is_bus_trip && (
                                <div className="flex items-start pt-4 bg-blue-50 dark:bg-[var(--bg-card-dark)] p-4 rounded-lg">
                                    <input
                                        type="checkbox"
                                        name="willing_to_drive"
                                        checked={form.willing_to_drive}
                                        onChange={handleChange}
                                        className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <label className="ml-3">
                                        <div className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                                            <Bus className="h-5 w-5 mr-2 text-blue-600" />
                                            Ik wil vrijwillig rijden tijdens de busjesreis
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            We organiseren deze reis met busjes en zoeken vrijwilligers die willen rijden.
                                        </p>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activities Selection */}
                    {activities.length > 0 && (
                        <div className="bg-purple-50 rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
                            <div className="flex items-center mb-6">
                                <Utensils className="h-6 w-6 text-blue-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-900">Activiteiten tijdens de reis</h2>
                            </div>
                            
                            <p className="text-gray-600 mb-6">
                                Selecteer de activiteiten waar je aan wilt deelnemen. 
                                De kosten worden meegenomen in de restbetaling.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activities.map(activity => (
                                    <div
                                        key={activity.id}
                                        onClick={() => toggleActivity(activity.id)}
                                        className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                                            selectedActivities.includes(activity.id)
                                                ? 'border-purple-600 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <input
                                                type="checkbox"
                                                checked={selectedActivities.includes(activity.id)}
                                                onChange={() => {}}
                                                className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <div className="ml-3 flex-1">
                                                {activity.image && (
                                                    <div className="mb-3 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={getImageUrl(activity.image)}
                                                            alt={activity.name}
                                                            width={300}
                                                            height={200}
                                                            className="w-full h-32 object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <h3 className="font-bold text-gray-900 mb-1">{activity.name}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                                                <p className="text-lg font-bold text-purple-600">
                                                    €{Number(activity.price).toFixed(2)}
                                                </p>
                                                {activity.max_participants && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Max. {activity.max_participants} deelnemers
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedActivities.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        <strong>Let op:</strong> De kosten voor de geselecteerde activiteiten 
                                        (totaal €{totalActivitiesPrice.toFixed(2)}) worden meegenomen in je restbetaling.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Summary */}
                    <div className="bg-purple-50 rounded-xl shadow-lg p-8 border-t-4 border-green-600">
                        <div className="flex items-center mb-6">
                            <CreditCard className="h-6 w-6 text-green-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Aanbetaling</h2>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-700">Aanbetalingsbedrag:</span>
                                <span className="text-3xl font-bold text-purple-600">
                                    €{Number(trip.deposit_amount).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 space-y-2">
                            <p>
                                <strong>Let op:</strong> Na het opslaan van je gegevens wordt je doorgestuurd naar de betaalpagina.
                            </p>
                            <p>
                                De geselecteerde activiteiten (€{totalActivitiesPrice.toFixed(2)}) worden later bij de restbetaling gefactureerd.
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || success}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                    Bezig met opslaan...
                                </>
                            ) : (
                                <>
                                    Opslaan en doorgaan naar betaling
                                    <CreditCard className="ml-3 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
                    </>
                )}
            </div>
        </>
    );
}
