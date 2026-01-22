'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { directusFetch } from '@/shared/lib/directus';
import { 
    tripActivitiesApi, 
    tripSignupActivitiesApi 
} from '@/shared/lib/api/salvemundi';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
    Loader2, 
    AlertCircle, 
    Save,
    ArrowLeft,
    User,
    Calendar,
    FileText,
    CreditCard,
    Utensils,
    Trash2
} from 'lucide-react';

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
    status: 'registered' | 'waitlist' | 'confirmed' | 'cancelled';
    deposit_paid: boolean;
    deposit_paid_at?: string;
    full_payment_paid: boolean;
    full_payment_paid_at?: string;
    created_at: string;
}

interface TripActivity {
    id: number;
    name: string;
    price: number;
}

export default function DeelnemerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const signupId = parseInt(params.id as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [signup, setSignup] = useState<TripSignup | null>(null);
    const [allActivities, setAllActivities] = useState<TripActivity[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '',
        id_document_type: '' as '' | 'passport' | 'id_card',
        allergies: '',
        special_notes: '',
        willing_to_drive: false,
        role: 'participant' as 'participant' | 'crew',
        status: 'registered' as 'registered' | 'waitlist' | 'confirmed' | 'cancelled',
        deposit_paid: false,
        full_payment_paid: false,
    });

    useEffect(() => {
        loadData();
    }, [signupId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load signup
            const signupData = await directusFetch<TripSignup>(`/items/trip_signups/${signupId}?fields=*`);
            setSignup(signupData);

            // Load all activities for this trip
            const activities = await tripActivitiesApi.getByTripId(signupData.trip_id);
            setAllActivities(activities);

            // Load selected activities
            const signupActivities = await tripSignupActivitiesApi.getBySignupId(signupId);
            setSelectedActivities(signupActivities.map((a: any) => a.trip_activity_id.id || a.trip_activity_id));

            // Pre-fill form
            setForm({
                first_name: signupData.first_name,
                middle_name: signupData.middle_name || '',
                last_name: signupData.last_name,
                email: signupData.email,
                phone_number: signupData.phone_number,
                date_of_birth: signupData.date_of_birth || '',
                id_document_type: (signupData.id_document_type as 'passport' | 'id_card') || '',
                allergies: signupData.allergies || '',
                special_notes: signupData.special_notes || '',
                willing_to_drive: signupData.willing_to_drive || false,
                role: signupData.role,
                status: signupData.status,
                deposit_paid: signupData.deposit_paid,
                full_payment_paid: signupData.full_payment_paid,
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
        setSuccess(false);
        setSaving(true);

        try {
            // Update signup
            await directusFetch(`/items/trip_signups/${signupId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    first_name: form.first_name,
                    middle_name: form.middle_name || undefined,
                    last_name: form.last_name,
                    email: form.email,
                    phone_number: form.phone_number,
                    date_of_birth: form.date_of_birth || undefined,
                    id_document_type: form.id_document_type || undefined,
                    allergies: form.allergies || undefined,
                    special_notes: form.special_notes || undefined,
                    willing_to_drive: form.willing_to_drive,
                    role: form.role,
                    status: form.status,
                    deposit_paid: form.deposit_paid,
                    full_payment_paid: form.full_payment_paid,
                })
            });

            // Update activities
            const existingActivities = await tripSignupActivitiesApi.getBySignupId(signupId);
            const existingActivityIds = existingActivities.map((a: any) => a.trip_activity_id.id || a.trip_activity_id);

            // Remove deselected activities
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
            await loadData(); // Reload data
            
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error saving:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het opslaan.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Weet je zeker dat je deze deelnemer wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
            return;
        }

        try {
            await directusFetch(`/items/trip_signups/${signupId}`, { method: 'DELETE' });
            router.push('/admin/reis');
        } catch (err: any) {
            console.error('Error deleting:', err);
            setError('Er is een fout opgetreden bij het verwijderen.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!signup) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Deelnemer niet gevonden</h1>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Deelnemer bewerken"
                // backgroundImage="/img/backgrounds/committees-bg.jpg"
            />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back button */}
                <button
                    onClick={() => router.push('/admin/reis')}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Terug naar overzicht
                </button>

                {/* Success message */}
                {success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <p className="text-green-700 font-semibold">Wijzigingen succesvol opgeslagen!</p>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-6">
                            <User className="h-6 w-6 text-purple-600 mr-3" />
                            <h2 className="text-xl font-bold text-gray-900">Persoonlijke gegevens</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Voornaam</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={form.first_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tussenvoegsel</label>
                                    <input
                                        type="text"
                                        name="middle_name"
                                        value={form.middle_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Achternaam</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={form.last_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefoon</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Geboortedatum</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={form.date_of_birth}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">ID Type</label>
                                    <select
                                        name="id_document_type"
                                        value={form.id_document_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                    >
                                        <option value="">Selecteer...</option>
                                        <option value="passport">Paspoort</option>
                                        <option value="id_card">ID Kaart</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Allergieën</label>
                                <textarea
                                    name="allergies"
                                    value={form.allergies}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bijzonderheden</label>
                                <textarea
                                    name="special_notes"
                                    value={form.special_notes}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="willing_to_drive"
                                    checked={form.willing_to_drive}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">Wil vrijwillig rijden</label>
                            </div>
                        </div>
                    </div>

                    {/* Status and Role */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-6">
                            <Calendar className="h-6 w-6 text-purple-600 mr-3" />
                            <h2 className="text-xl font-bold text-gray-900">Status en rol</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                >
                                    <option value="registered">Geregistreerd</option>
                                    <option value="confirmed">Bevestigd</option>
                                    <option value="waitlist">Wachtlijst</option>
                                    <option value="cancelled">Geannuleerd</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                >
                                    <option value="participant">Deelnemer</option>
                                    <option value="crew">Crew / Organisatie</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                            <strong>Let op:</strong> Crew leden krijgen automatisch korting op de restbetaling.
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-6">
                            <CreditCard className="h-6 w-6 text-purple-600 mr-3" />
                            <h2 className="text-xl font-bold text-gray-900">Betalingsstatus</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="deposit_paid"
                                        checked={form.deposit_paid}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                                    />
                                    <label className="ml-3 text-sm font-semibold text-gray-700">Aanbetaling voldaan</label>
                                </div>
                                {signup.deposit_paid_at && (
                                    <span className="text-sm text-gray-500">
                                        {format(new Date(signup.deposit_paid_at), 'd MMM yyyy HH:mm', { locale: nl })}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="full_payment_paid"
                                        checked={form.full_payment_paid}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                                    />
                                    <label className="ml-3 text-sm font-semibold text-gray-700">Volledige betaling voldaan</label>
                                </div>
                                {signup.full_payment_paid_at && (
                                    <span className="text-sm text-gray-500">
                                        {format(new Date(signup.full_payment_paid_at), 'd MMM yyyy HH:mm', { locale: nl })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Activities */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-6">
                            <Utensils className="h-6 w-6 text-purple-600 mr-3" />
                            <h2 className="text-xl font-bold text-gray-900">Activiteiten</h2>
                        </div>

                        <div className="space-y-2">
                            {allActivities.map(activity => (
                                <div
                                    key={activity.id}
                                    onClick={() => toggleActivity(activity.id)}
                                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                                        selectedActivities.includes(activity.id)
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedActivities.includes(activity.id)}
                                                onChange={() => {}}
                                                className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                                            />
                                            <span className="ml-3 font-semibold text-gray-900">{activity.name}</span>
                                        </div>
                                        <span className="text-purple-600 font-bold">€{Number(activity.price).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center mb-4">
                            <FileText className="h-6 w-6 text-purple-600 mr-3" />
                            <h2 className="text-xl font-bold text-gray-900">Metadata</h2>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>Aangemeld op: {format(new Date(signup.created_at), 'd MMMM yyyy HH:mm', { locale: nl })}</p>
                            <p>Deelnemer ID: {signup.id}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-between">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            <Trash2 className="h-5 w-5" />
                            Verwijderen
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {saving ? (
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
                </form>
            </div>
        </>
    );
}
