'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getTripsFullAction,
    createTripAction,
    updateTripAction,
    deleteTripAction,
    Trip
} from '@/features/admin/server/trips-actions';
import { getImageUrl } from "@/shared/lib/api/image";
import { getMembersByCommitteeAction } from '@/features/admin/server/members-data';
import { uploadFileAction } from '@/features/admin/server/file-actions';
import {
    Calendar,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Upload,
    DollarSign,
    Loader2,
    Users
} from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// react-datepicker removed to prefer native date inputs
export default function ReisInstellingenPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [trips, setTrips] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        image: '',
        event_date: '',
        start_date: '',
        end_date: '',
        registration_start_date: null as Date | null,
        registration_open: true,
        max_participants: 0,
        max_crew: 0,
        base_price: 0,
        crew_discount: 0,
        deposit_amount: 0,
        is_bus_trip: false,
        allow_final_payments: false,
    });

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTripsFullAction();
            setTrips(data);
        } catch (err) {
            console.error('Error loading trips:', err);
            setError('Fout bij het laden van reizen');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        setAddingNew(true);
        setEditingId(null);

        let crewCount = 0;
        try {
            // Find members of the Reiscommissie
            const members = await getMembersByCommitteeAction('reiscommissie');
            crewCount = members.length;
        } catch (e) {
            console.warn('Could not fetch committee members for default crew size', e);
        }

        setForm({
            name: '',
            description: '',
            image: '',
            event_date: '',
            start_date: '',
            end_date: '',
            registration_start_date: null,
            registration_open: true,
            max_participants: 30, // Default value
            max_crew: crewCount,
            base_price: 0,
            crew_discount: 0,
            deposit_amount: 0,
            is_bus_trip: false,
            allow_final_payments: false,
        });
    };

    const handleEdit = (trip: any) => {
        setEditingId(trip.id);
        setAddingNew(false);
        setForm({
            name: trip.name,
            description: trip.description || '',
            image: trip.image || '',
            event_date: trip.event_date ? trip.event_date.split('T')[0] : '',
            start_date: trip.start_date ? String(trip.start_date).split('T')[0] : (trip.event_date ? String(trip.event_date).split('T')[0] : ''),
            end_date: trip.end_date ? String(trip.end_date).split('T')[0] : '',
            registration_start_date: trip.registration_start_date ? new Date(trip.registration_start_date) : null,
            registration_open: trip.registration_open,
            max_participants: trip.max_participants,
            max_crew: trip.max_crew || 0,
            base_price: trip.base_price,
            crew_discount: trip.crew_discount,
            deposit_amount: trip.deposit_amount,
            is_bus_trip: trip.is_bus_trip,
            allow_final_payments: trip.allow_final_payments || false,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setAddingNew(false);
        setForm({
            name: '',
            description: '',
            image: '',
            event_date: '',
            start_date: '',
            end_date: '',
            registration_start_date: null,
            registration_open: true,
            max_participants: 0,
            max_crew: 0,
            base_price: 0,
            crew_discount: 0,
            deposit_amount: 0,
            is_bus_trip: false,
            allow_final_payments: false,
        });
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setError('Naam is verplicht');
            return;
        }
        if (!form.start_date) {
            setError('Start datum is verplicht');
            return;
        }

        if (form.end_date && form.start_date && new Date(form.end_date) < new Date(form.start_date)) {
            setError('Einddatum mag niet vóór de startdatum liggen');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                image: form.image || null,
                // Prefer explicit start/end dates for multi-day events.
                start_date: form.start_date || null,
                end_date: form.end_date || null,
                // Keep event_date for backward compatibility when present
                event_date: form.event_date || null,
                registration_start_date: form.registration_start_date ? form.registration_start_date.toISOString() : null,
                registration_open: form.registration_open,
                max_participants: form.max_participants,
                max_crew: form.max_crew,
                base_price: form.base_price,
                crew_discount: form.crew_discount,
                deposit_amount: form.deposit_amount,
                is_bus_trip: form.is_bus_trip,
                allow_final_payments: form.allow_final_payments,
            };

            if (addingNew) {
                await createTripAction(payload as Partial<Trip>);
            } else if (editingId) {
                await updateTripAction(editingId, payload as Partial<Trip>);
            }

            await loadTrips();
            handleCancel();
        } catch (err: any) {
            console.error('Error saving trip:', err);
            setError(err?.message || 'Fout bij het opslaan van reis');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze reis wilt verwijderen? Dit verwijdert ook alle aanmeldingen!')) return;

        try {
            await deleteTripAction(id);
            await loadTrips();
        } catch (err) {
            console.error('Error deleting trip:', err);
            setError('Fout bij het verwijderen van reis');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { id } = await uploadFileAction(formData);
            setForm({ ...form, image: id });
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Fout bij het uploaden van afbeelding');
        }
    };

    // Safely format currency values that may be strings or undefined coming from Directus
    const fmt = (value: any) => {
        const n = Number(value);
        if (Number.isNaN(n)) return '0.00';
        return n.toFixed(2);
    };

    return (
        <>
            <PageHeader title="Reis Instellingen" />

            <div className="container mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 p-4 rounded">
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Add Button */}
                {!addingNew && !editingId && (
                    <div className="mb-6">
                        <button
                            onClick={handleAdd}
                            className="px-6 py-3 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition flex items-center shadow-md hover:shadow-lg"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Nieuwe Reis Toevoegen
                        </button>
                    </div>
                )}

                {/* Add/Edit Form */}
                {(addingNew || editingId) && (
                    <div className="bg-admin-card rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-admin mb-4">
                            {addingNew ? 'Nieuwe Reis' : 'Reis Bewerken'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Naam *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                    placeholder="Bijv. Salvemundi Skiereis 2025"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Beschrijving
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                    placeholder="Korte beschrijving van de reis..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Start Datum *
                                </label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Eind Datum
                                </label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                                <p className="text-xs text-admin-muted mt-1">Laat leeg voor eendaagse reis</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Max. Deelnemers zonder commissie *
                                </label>
                                <input
                                    type="number"
                                    value={form.max_participants}
                                    onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 0 })}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Aantal Crew *
                                </label>
                                <input
                                    type="number"
                                    value={form.max_crew}
                                    onChange={(e) => setForm({ ...form, max_crew: parseInt(e.target.value) || 0 })}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Prijs per deelnemer excl. Activiteiten *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.base_price}
                                    onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Crew Korting (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.crew_discount}
                                    onChange={(e) => setForm({ ...form, crew_discount: parseFloat(e.target.value) || 0 })}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Aanbetalingsbedrag (€) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.deposit_amount}
                                    onChange={(e) => setForm({ ...form, deposit_amount: parseFloat(e.target.value) || 0 })}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Banner Afbeelding
                                </label>
                                <div className="flex items-center gap-4">
                                    {form.image && (
                                        <img
                                            src={getImageUrl(form.image)}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded-lg"
                                        />
                                    )}
                                    <label className="px-4 py-2 border border-admin rounded-lg cursor-pointer hover:bg-admin-hover flex items-center bg-admin-card text-admin-muted">
                                        <Upload className="h-5 w-5 mr-2" />
                                        Upload Afbeelding
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.registration_open}
                                        onChange={(e) => setForm({ ...form, registration_open: e.target.checked })}
                                        className="h-4 w-4 text-theme-purple focus:ring-theme-purple border-admin rounded bg-admin-card"
                                    />
                                    <span className="ml-2 text-sm text-admin-muted">Inschrijving nu direct openen (Forceer Open)</span>
                                </label>

                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-admin-muted mb-2">
                                        Automatisch openen vanaf (Optioneel)
                                    </label>
                                    <p className="text-xs text-admin-muted mb-2">
                                        Als je dit invult, gaat de inschrijving automatisch open op dit tijdstip,
                                        ook al staat 'Forceer Open' hierboven uit.
                                    </p>
                                    <input
                                        type="datetime-local"
                                        value={form.registration_start_date ? new Date(form.registration_start_date).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setForm({ ...form, registration_start_date: e.target.value ? new Date(e.target.value) : null })}
                                        className="w-full px-4 py-2 border border-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-admin-card text-admin"
                                        placeholder="Selecteer startdatum en tijd..."
                                    />
                                </div>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.is_bus_trip}
                                        onChange={(e) => setForm({ ...form, is_bus_trip: e.target.checked })}
                                        className="h-4 w-4 text-theme-purple focus:ring-theme-purple border-admin rounded bg-admin-card"
                                    />
                                    <span className="ml-2 text-sm text-admin-muted">Busreis (vraag rijbewijs en bereidheid om te rijden)</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.allow_final_payments}
                                        onChange={(e) => setForm({ ...form, allow_final_payments: e.target.checked })}
                                        className="h-4 w-4 text-theme-purple focus:ring-theme-purple border-admin rounded bg-admin-card"
                                    />
                                    <span className="ml-2 text-sm font-bold text-admin">Restbetalingen openstellen</span>
                                </label>
                                <p className="text-xs text-admin-muted ml-6 italic">Als dit uit staat, kunnen reizigers de restbetaling nog niet voldoen en kunnen er geen restbetalingsmails verstuurd worden.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                        Opslaan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Opslaan
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-6 py-2 border border-admin text-admin-muted rounded-lg hover:bg-admin-hover transition flex items-center hover:text-admin"
                            >
                                <X className="h-5 w-5 mr-2" />
                                Annuleren
                            </button>
                        </div>
                    </div>
                )}

                {/* Trips List */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="animate-spin h-12 w-12 text-theme-purple" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {trips.length === 0 ? (
                            <div className="text-center py-12 text-admin-muted">
                                Nog geen reizen aangemaakt
                            </div>
                        ) : (
                            trips.map((trip) => (
                                <div key={trip.id} className="bg-admin-card rounded-lg shadow-md overflow-hidden">
                                    <div className="md:flex">
                                        {trip.image ? (
                                            <div className="md:w-1/3">
                                                <img
                                                    src={getImageUrl(trip.image)}
                                                    alt={trip.name}
                                                    className="w-full h-64 md:h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="md:w-1/3 bg-admin-card-soft h-64 md:h-full flex items-center justify-center">
                                                <Calendar className="h-16 w-16 text-admin-muted" />
                                            </div>
                                        )}

                                        <div className="md:w-2/3 p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-admin mb-2">{trip.name}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-admin-muted">
                                                        <span className="flex items-center">
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            {(() => {
                                                                const sd = trip.start_date || trip.event_date;
                                                                const ed = trip.end_date || null;
                                                                try {
                                                                    if (!sd) return 'Onbekende datum';
                                                                    const start = new Date(sd);
                                                                    if (ed) {
                                                                        const end = new Date(ed);
                                                                        const fStart = format(start, 'd MMMM yyyy', { locale: nl });
                                                                        const fEnd = format(end, 'd MMMM yyyy', { locale: nl });
                                                                        return fStart === fEnd ? fStart : `${fStart} — ${fEnd}`;
                                                                    }
                                                                    return format(start, 'd MMMM yyyy', { locale: nl });
                                                                } catch (e) {
                                                                    return 'Onbekende datum';
                                                                }
                                                            })()}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Users className="h-4 w-4 mr-1" />
                                                            Max {trip.max_participants}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <DollarSign className="h-4 w-4 mr-1" />
                                                            €{fmt(trip.base_price)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {trip.registration_open ? (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-sm rounded">Open</span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-sm rounded">Gesloten</span>
                                                    )}
                                                    {trip.is_bus_trip && (
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-sm rounded">Busreis</span>
                                                    )}
                                                </div>
                                            </div>

                                            {trip.description && (
                                                <p className="text-admin-muted mb-4 line-clamp-2">{trip.description}</p>
                                            )}

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                                <div>
                                                    <span className="text-admin-muted">Aanbetaling:</span>
                                                    <p className="font-semibold text-admin">€{fmt(trip.deposit_amount)}</p>
                                                </div>
                                                {trip.crew_discount > 0 && (
                                                    <div>
                                                        <span className="text-admin-muted">Crew Korting:</span>
                                                        <p className="font-semibold text-green-600">-€{fmt(trip.crew_discount)}</p>
                                                    </div>
                                                )}
                                                {trip.max_crew > 0 && (
                                                    <div>
                                                        <span className="text-admin-muted">Crew Grootte:</span>
                                                        <p className="font-semibold text-admin">{trip.max_crew}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => router.push(`/admin/reis?trip=${trip.id}`)}
                                                    className="px-4 py-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition text-sm"
                                                >
                                                    Bekijk Aanmeldingen
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/reis/activiteiten`)}
                                                    className="px-4 py-2 border border-theme-purple text-theme-purple rounded-lg hover:bg-admin-card-soft transition text-sm"
                                                >
                                                    Activiteiten
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(trip)}
                                                    className="px-4 py-2 border border-admin text-admin-muted rounded-lg hover:bg-admin-hover hover:text-admin transition text-sm flex items-center"
                                                >
                                                    <Edit2 className="h-4 w-4 mr-1" />
                                                    Bewerken
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trip.id)}
                                                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm flex items-center"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Verwijderen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

