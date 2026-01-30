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
import { updateTripSignup } from '../../actions';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
    CheckCircle2,
    Loader2,
    AlertCircle,
    CreditCard,
    Edit,
    FileText,
    Utensils,
    Calculator
} from 'lucide-react';
import Image from 'next/image';



export default function RestbetalingPage() {
    const params = useParams();
    const router = useRouter();
    const signupId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [signup, setSignup] = useState<TripSignup | null>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [selectedActivities, setSelectedActivities] = useState<TripActivity[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedActivityOptions, setSelectedActivityOptions] = useState<Record<number, string[]>>({});

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '',
        id_document_type: '' as '' | 'passport' | 'id_card',
        document_number: '',
        allergies: '',
        special_notes: '',
    });

    useEffect(() => {
        loadData();
    }, [signupId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load signup
            const signupData = await tripSignupsApi.getById(signupId);
            setSignup(signupData);

            // Check if deposit is paid
            if (!signupData.deposit_paid) {
                router.push(`/reis/aanbetaling/${signupId}`);
                return;
            }

            // Check if already paid full amount
            if (signupData.full_payment_paid) {
                setSuccess(true);
            }

            // Load trip
            const tripData = await tripsApi.getById(signupData.trip_id);
            setTrip(tripData);

            // Load selected activities
            const signupActivities = await tripSignupActivitiesApi.getBySignupId(signupId);
            const activityIds = signupActivities.map((a: any) => a.trip_activity_id.id || a.trip_activity_id);

            const optionsMap: Record<number, string[]> = {};
            signupActivities.forEach((a: any) => {
                const actId = a.trip_activity_id.id || a.trip_activity_id;
                if (a.selected_options) {
                    optionsMap[actId] = a.selected_options;
                }
            });
            setSelectedActivityOptions(optionsMap);

            // Load full activity details
            const allActivities = await tripActivitiesApi.getByTripId(signupData.trip_id);
            const selected = allActivities.filter(a => activityIds.includes(a.id));
            setSelectedActivities(selected);

            // Pre-fill form
            setForm({
                first_name: signupData.first_name,
                middle_name: signupData.middle_name || '',
                last_name: signupData.last_name,
                email: signupData.email,
                phone_number: signupData.phone_number,
                date_of_birth: signupData.date_of_birth || '',
                id_document_type: (signupData.id_document_type || (signupData as any).id_document as 'passport' | 'id_card') || '',
                document_number: signupData.document_number || '',
                allergies: signupData.allergies || (signupData as any).alergies || '',
                special_notes: signupData.special_notes || '',
            });
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError('Er is een fout opgetreden bij het laden van de gegevens.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (error) setError(null);
    };

    const handleSaveChanges = async () => {
        setError(null);
        setSubmitting(true);

        try {
            const updateResult = await updateTripSignup(signupId, {
                first_name: form.first_name,
                middle_name: form.middle_name || undefined,
                last_name: form.last_name,
                email: form.email,
                phone_number: form.phone_number,
                date_of_birth: form.date_of_birth,
                id_document_type: form.id_document_type || undefined,
                document_number: form.document_number || undefined,
                allergies: form.allergies || undefined,
                special_notes: form.special_notes || undefined,
            });

            if (!updateResult.success) {
                throw new Error(updateResult.error);
            }

            setEditMode(false);
            await loadData(); // Reload to get updated data
        } catch (err: any) {
            console.error('Error updating data:', err);
            setError('Er is een fout opgetreden bij het opslaan van je wijzigingen.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePayment = async () => {
        setError(null);
        setSubmitting(true);

        try {
            // Redirect to payment page
            router.push(`/reis/restbetaling/${signupId}/betaling`);
        } catch (err: any) {
            console.error('Error initiating payment:', err);
            setError('Er is een fout opgetreden bij het starten van de betaling.');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate costs
    const calculateTotal = () => {
        if (!trip) return { basePrice: 0, activities: 0, discount: 0, total: 0, deposit: 0, remaining: 0 };

        const basePrice = Number(trip.base_price) || 0;
        const activitiesTotal = selectedActivities.reduce((sum, a) => {
            let price = Number(a.price) || 0;
            const options = selectedActivityOptions[a.id] || [];
            if (a.options) {
                options.forEach(optName => {
                    const opt = a.options?.find(o => o.name === optName);
                    if (opt) price += Number(opt.price);
                });
            }
            return sum + price;
        }, 0);
        const discount = signup?.role === 'crew' ? (Number(trip.crew_discount) || 0) : 0;
        const total = basePrice + activitiesTotal - discount;
        const deposit = Number(trip.deposit_amount) || 0;
        // For rest payment: total - deposit
        const remaining = Math.max(0, total - deposit);

        return {
            basePrice,
            activities: activitiesTotal,
            discount,
            total,
            deposit,
            remaining
        };
    };

    const costs = calculateTotal();

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
                title={`Restbetaling - ${trip.name}`}
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
                        <div className="flex-1 h-1 bg-green-500 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">Aanbetaling</span>
                        </div>
                        <div className="flex-1 h-1 bg-purple-600 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white mb-2">
                                3
                            </div>
                            <span className="text-xs font-semibold text-purple-600">Restbetaling</span>
                        </div>
                    </div>
                </div>

                {/* Success message */}
                {success && (
                    <div className="mb-8 bg-green-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-green-400 p-6 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-green-800 dark:text-green-300 font-bold text-lg mb-2">Betaling voltooid!</h3>
                                <p className="text-green-700 dark:text-green-200">
                                    Je hebt de volledige betaling voor de reis voldaan. We kijken ernaar uit om je te zien!
                                </p>
                                {signup.full_payment_paid_at && (
                                    <p className="text-green-600 text-sm mt-2">
                                        Betaald op: {format(new Date(signup.full_payment_paid_at), 'd MMMM yyyy HH:mm', { locale: nl })}
                                    </p>
                                )}
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

                {/* Personal Information */}
                {/* Personal Information */}
                <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 border border-[var(--border-color)] dark:border-white/10 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <FileText className="h-6 w-6 text-purple-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Je gegevens</h2>
                        </div>
                        {!editMode && !success && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            >
                                <Edit className="h-5 w-5" />
                                Wijzigen
                            </button>
                        )}
                    </div>

                    {editMode ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Voornaam</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={form.first_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tussenvoegsel</label>
                                    <input
                                        type="text"
                                        name="middle_name"
                                        value={form.middle_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Achternaam</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={form.last_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefoon</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Geboortedatum</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={form.date_of_birth}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">ID Type</label>
                                    <select
                                        name="id_document_type"
                                        value={form.id_document_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    >
                                        <option value="">Selecteer...</option>
                                        <option value="passport">Paspoort</option>
                                        <option value="id_card">ID Kaart</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Document nummer</label>
                                    <input
                                        type="text"
                                        name="document_number"
                                        value={form.document_number || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Allergieën</label>
                                <textarea
                                    name="allergies"
                                    value={form.allergies}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bijzonderheden</label>
                                <textarea
                                    name="special_notes"
                                    value={form.special_notes}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-4 justify-end">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="px-6 py-3 border border-[var(--border-color)] dark:border-white/10 text-gray-700 dark:text-[var(--text-muted-dark)] rounded-lg hover:bg-[var(--bg-main)] dark:hover:bg-white/5 transition"
                                    disabled={submitting}
                                >
                                    Annuleren
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={submitting}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                            Opslaan...
                                        </>
                                    ) : (
                                        'Wijzigingen opslaan'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Naam</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {form.first_name} {form.middle_name} {form.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Geboortedatum</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {form.date_of_birth ? format(new Date(form.date_of_birth), 'd MMMM yyyy', { locale: nl }) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Email</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{form.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Telefoon</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{form.phone_number}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">ID Type</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {form.id_document_type === 'passport' ? 'Paspoort' : form.id_document_type === 'id_card' ? 'ID Kaart' : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Document nummer</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {form.document_number || '-'}
                                </p>
                            </div>
                            {form.allergies && (
                                <div className="md:col-span-2">
                                    <p className="text-gray-500 mb-1">Allergieën</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{form.allergies}</p>
                                </div>
                            )}
                            {form.special_notes && (
                                <div className="md:col-span-2">
                                    <p className="text-gray-500 mb-1">Bijzonderheden</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{form.special_notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div >

                {/* Selected Activities */}
                {/* Selected Activities */}
                {
                    selectedActivities.length > 0 && (
                        <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 border border-[var(--border-color)] dark:border-white/10 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                            <div className="flex items-center mb-6">
                                <Utensils className="h-6 w-6 text-blue-600 mr-3" />
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Geselecteerde activiteiten</h2>
                            </div>

                            <div className="space-y-4">
                                {selectedActivities.map(activity => (
                                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                        {activity.image && (
                                            <Image
                                                src={getImageUrl(activity.image)}
                                                alt={activity.name}
                                                width={80}
                                                height={80}
                                                className="rounded-lg object-cover"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white break-words">{activity.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-[var(--text-muted-dark)]">{activity.description}</p>
                                            {selectedActivityOptions[activity.id] && selectedActivityOptions[activity.id].length > 0 && (
                                                <div className="mt-2 text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 p-2 rounded inline-block">
                                                    <span className="font-semibold">Opties:</span> {selectedActivityOptions[activity.id].join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">€{Number(activity.price).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!success && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                        <strong>Tip:</strong> Je kunt je activiteiten nog aanpassen tot je de restbetaling hebt voldaan.
                                    </p>
                                    <a
                                        href={`/reis/activiteiten/${signupId}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Activiteiten aanpassen
                                    </a>
                                </div>
                            )}

                            {success && (
                                <div className="mt-4 p-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-600 dark:text-[var(--text-muted-dark)]">
                                    <strong>Let op:</strong> Wijzigingen in activiteiten zijn niet meer mogelijk.
                                    Neem contact op met de reiscommissie als je wijzigingen wilt doorvoeren.
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Payment Calculation */}
                <div className="bg-white dark:bg-[var(--bg-card-dark)] rounded-xl shadow-lg p-8 border border-[var(--border-color)] dark:border-white/10 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                    <div className="flex items-center mb-6">
                        <Calculator className="h-6 w-6 text-green-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kostenoverzicht</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                            <span className="font-medium text-gray-900 dark:text-white">Basisprijs reis</span>
                            <span className="font-semibold text-gray-900 dark:text-white">€{costs.basePrice.toFixed(2)}</span>
                        </div>

                        {selectedActivities.length > 0 && (
                            <div className="py-3 border-b border-gray-100 dark:border-white/10">
                                <span className="block text-sm font-semibold text-gray-700 dark:text-[var(--text-muted-dark)] mb-2">Activiteiten</span>
                                <div className="space-y-2 pl-2">
                                    {selectedActivities.map(activity => {
                                        let actPrice = Number(activity.price) || 0;
                                        const opts = selectedActivityOptions[activity.id] || [];
                                        let optPrice = 0;
                                        if (activity.options) {
                                            opts.forEach(optName => {
                                                const o = activity.options?.find(opt => opt.name === optName);
                                                if (o) optPrice += Number(o.price);
                                            });
                                        }
                                        const itemTotal = actPrice + optPrice;

                                        return (
                                            <div key={activity.id} className="flex justify-between items-start text-sm">
                                                <div className="text-gray-600 dark:text-gray-300">
                                                    <span>{activity.name}</span>
                                                    {opts.length > 0 && (
                                                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                            (+ {opts.join(', ')})
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    €{itemTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {costs.discount > 0 && (
                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                                <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Crew korting</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">-€{costs.discount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                            <span className="text-gray-700 dark:text-[var(--text-muted-dark)]">Reeds betaalde aanbetaling</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">-€{costs.deposit.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center py-4 bg-[var(--bg-soft)] dark:bg-white/5 rounded-lg px-4 mt-4 border border-purple-100 dark:border-white/10">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Te betalen</span>
                            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">€{costs.remaining.toFixed(2)}</span>
                        </div>
                    </div>

                    {!success && costs.remaining > 0 && (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Controleer je gegevens goed voordat je de betaling voltooit.
                                    Na betaling ontvang je een bevestigingsmail met alle details.
                                </p>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={submitting || editMode}
                                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin h-6 w-6 mr-3" />
                                        Bezig...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-3 h-6 w-6" />
                                        Betaal restbedrag van €{costs.remaining.toFixed(2)}
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="text-center py-6">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-gray-900">
                                Je hebt alle betalingen voltooid. Tot ziens op de reis!
                            </p>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
}
