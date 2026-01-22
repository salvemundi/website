'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { tripsApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { Loader2, Plus, Edit2, Trash2, Save, X, Upload, Calendar, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

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
        registration_open: true,
        max_participants: 0,
        base_price: 0,
        crew_discount: 0,
        deposit_amount: 0,
        is_bus_trip: false,
    });

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await tripsApi.getAll();
            setTrips(data);
        } catch (err) {
            console.error('Error loading trips:', err);
            setError('Fout bij het laden van reizen');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setAddingNew(true);
        setEditingId(null);
        setForm({
            name: '',
            description: '',
            image: '',
            event_date: '',
            registration_open: true,
            max_participants: 30,
            base_price: 0,
            crew_discount: 0,
            deposit_amount: 0,
            is_bus_trip: false,
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
            registration_open: trip.registration_open,
            max_participants: trip.max_participants,
            base_price: trip.base_price,
            crew_discount: trip.crew_discount,
            deposit_amount: trip.deposit_amount,
            is_bus_trip: trip.is_bus_trip,
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
            registration_open: true,
            max_participants: 0,
            base_price: 0,
            crew_discount: 0,
            deposit_amount: 0,
            is_bus_trip: false,
        });
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setError('Naam is verplicht');
            return;
        }
        if (!form.event_date) {
            setError('Datum is verplicht');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                image: form.image || undefined,
                event_date: form.event_date,
                registration_open: form.registration_open,
                max_participants: form.max_participants,
                base_price: form.base_price,
                crew_discount: form.crew_discount,
                deposit_amount: form.deposit_amount,
                is_bus_trip: form.is_bus_trip,
            };

            if (addingNew) {
                await tripsApi.create(payload);
            } else if (editingId) {
                await tripsApi.update(editingId, payload);
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
            await tripsApi.delete(id);
            await loadTrips();
        } catch (err) {
            console.error('Error deleting trip:', err);
            setError('Fout bij het verwijderen van reis');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_API_URL;
        
        const formData = new FormData();
        formData.append('file', file);

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(`${directusUrl}/files`, {
                method: 'POST',
                body: formData,
                headers
            });
            
            if (!response.ok) throw new Error('Upload failed');
            const json = await response.json();
            const fileId = json?.data?.id || json?.data;
            
            setForm({ ...form, image: fileId });
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
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Add Button */}
                {!addingNew && !editingId && (
                    <div className="mb-6">
                        <button
                            onClick={handleAdd}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Nieuwe Reis Toevoegen
                        </button>
                    </div>
                )}

                {/* Add/Edit Form */}
                {(addingNew || editingId) && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {addingNew ? 'Nieuwe Reis' : 'Reis Bewerken'}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Naam *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Bijv. Salvemundi Skiereis 2025"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Beschrijving
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Korte beschrijving van de reis..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Datum *
                                </label>
                                <input
                                    type="date"
                                    value={form.event_date}
                                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max. Deelnemers *
                                </label>
                                <input
                                    type="number"
                                    value={form.max_participants}
                                    onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Basisprijs (€) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.base_price}
                                    onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Crew Korting (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.crew_discount}
                                    onChange={(e) => setForm({ ...form, crew_discount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Aanbetalingsbedrag (€) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.deposit_amount}
                                    onChange={(e) => setForm({ ...form, deposit_amount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    <label className="px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center">
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
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Inschrijving open</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.is_bus_trip}
                                        onChange={(e) => setForm({ ...form, is_bus_trip: e.target.checked })}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Busreis (vraag rijbewijs en bereidheid om te rijden)</span>
                                </label>
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
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center"
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
                        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {trips.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                Nog geen reizen aangemaakt
                            </div>
                        ) : (
                            trips.map((trip) => (
                                <div key={trip.id} className="bg-white rounded-lg shadow-md overflow-hidden">
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
                                            <div className="md:w-1/3 bg-gray-200 h-64 md:h-full flex items-center justify-center">
                                                <Calendar className="h-16 w-16 text-gray-400" />
                                            </div>
                                        )}
                                        
                                        <div className="md:w-2/3 p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{trip.name}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center">
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            {format(new Date(trip.event_date), 'd MMMM yyyy', { locale: nl })}
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
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">Open</span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded">Gesloten</span>
                                                    )}
                                                    {trip.is_bus_trip && (
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">Busreis</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {trip.description && (
                                                <p className="text-gray-600 mb-4 line-clamp-2">{trip.description}</p>
                                            )}
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Aanbetaling:</span>
                                                    <p className="font-semibold">€{fmt(trip.deposit_amount)}</p>
                                                </div>
                                                {trip.crew_discount > 0 && (
                                                    <div>
                                                        <span className="text-gray-500">Crew Korting:</span>
                                                        <p className="font-semibold text-green-600">-€{fmt(trip.crew_discount)}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => router.push(`/admin/reis?trip=${trip.id}`)}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                                                >
                                                    Bekijk Aanmeldingen
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/reis/activiteiten`)}
                                                    className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition text-sm"
                                                >
                                                    Activiteiten
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(trip)}
                                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center"
                                                >
                                                    <Edit2 className="h-4 w-4 mr-1" />
                                                    Bewerken
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trip.id)}
                                                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition text-sm flex items-center"
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
