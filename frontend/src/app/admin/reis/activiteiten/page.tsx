'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { tripActivitiesApi, tripsApi, getImageUrl, TripActivity } from '@/shared/lib/api/salvemundi';
import { Loader2, Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Upload } from 'lucide-react';

export default function ActiviteitenBeheerPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activities, setActivities] = useState<TripActivity[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: 0,
        image: '',
        max_participants: null as number | null,
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        loadTrips();
    }, []);

    useEffect(() => {
        if (selectedTripId) {
            loadActivities(selectedTripId);
        }
    }, [selectedTripId]);

    const loadTrips = async () => {
        try {
            const data = await tripsApi.getAll();
            setTrips(data);
            if (data.length > 0 && !selectedTripId) {
                setSelectedTripId(data[0].id);
            }
        } catch (err) {
            console.error('Error loading trips:', err);
            setError('Fout bij het laden van reizen');
        }
    };

    const loadActivities = async (tripId: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await tripActivitiesApi.getAllByTripId(tripId);
            setActivities(data);
        } catch (err) {
            console.error('Error loading activities:', err);
            setError('Fout bij het laden van activiteiten');
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
            price: 0,
            image: '',
            max_participants: null,
            is_active: true,
            display_order: activities.length,
        });
    };

    const handleEdit = (activity: TripActivity) => {
        setEditingId(activity.id);
        setAddingNew(false);
        setForm({
            name: activity.name,
            description: activity.description || '',
            price: activity.price,
            image: activity.image || '',
            max_participants: activity.max_participants || null,
            is_active: activity.is_active,
            display_order: activity.display_order,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setAddingNew(false);
        setForm({
            name: '',
            description: '',
            price: 0,
            image: '',
            max_participants: null,
            is_active: true,
            display_order: 0,
        });
    };

    const handleSave = async () => {
        if (!selectedTripId) return;
        if (!form.name.trim()) {
            setError('Naam is verplicht');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const payload = {
                trip_id: selectedTripId,
                name: form.name,
                description: form.description || undefined,
                price: form.price,
                image: form.image || undefined,
                max_participants: form.max_participants || undefined,
                is_active: form.is_active,
                display_order: form.display_order,
            };

            if (addingNew) {
                await tripActivitiesApi.create(payload);
            } else if (editingId) {
                await tripActivitiesApi.update(editingId, payload);
            }

            await loadActivities(selectedTripId);
            handleCancel();
        } catch (err: any) {
            console.error('Error saving activity:', err);
            setError(err?.message || 'Fout bij het opslaan van activiteit');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze activiteit wilt verwijderen?')) return;

        try {
            await tripActivitiesApi.delete(id);

            if (selectedTripId) {
                await loadActivities(selectedTripId);
            }
        } catch (err) {
            console.error('Error deleting activity:', err);
            setError('Fout bij het verwijderen van activiteit');
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

    const fmt = (value: any) => {
        const n = Number(value);
        if (Number.isNaN(n)) return '0.00';
        return n.toFixed(2);
    };

    return (
        <>
            <PageHeader title="Activiteiten Beheer" />
            
            <div className="container mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-[var(--bg-card-dark)] border-l-4 border-red-400 p-4 rounded">
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Trip Selector */}
                <div className="bg-purple-50 dark:bg-[var(--bg-card-dark)] rounded-lg shadow-md p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecteer Reis
                    </label>
                    <select
                        value={selectedTripId || ''}
                        onChange={(e) => setSelectedTripId(parseInt(e.target.value))}
                        className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        {trips.map((trip) => (
                            <option key={trip.id} value={trip.id}>
                                {trip.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Add Button */}
                {!addingNew && !editingId && (
                    <div className="mb-6">
                        <button
                            onClick={handleAdd}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Nieuwe Activiteit Toevoegen
                        </button>
                    </div>
                )}

                {/* Add/Edit Form */}
                {(addingNew || editingId) && (
                    <div className="bg-purple-50 dark:bg-[var(--bg-card-dark)] rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {addingNew ? 'Nieuwe Activiteit' : 'Activiteit Bewerken'}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Naam *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Bijv. Kanoën"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prijs (€) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Beschrijving
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Optionele beschrijving..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max. Deelnemers
                                </label>
                                <input
                                    type="number"
                                    value={form.max_participants || ''}
                                    onChange={(e) => setForm({ ...form, max_participants: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-[var(--bg-soft-dark)] dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Leeg = onbeperkt"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Weergavevolgorde
                                </label>
                                <input
                                    type="number"
                                    value={form.display_order}
                                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Afbeelding
                                </label>
                                <div className="flex items-center gap-4">
                                    {form.image && (
                                        <img
                                            src={getImageUrl(form.image)}
                                            alt="Preview"
                                            className="w-24 h-24 object-cover rounded-lg"
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

                            <div className="md:col-span-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-[var(--text-muted-dark)]">Actief (zichtbaar voor deelnemers)</span>
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

                {/* Activities List */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                Nog geen activiteiten toegevoegd
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="bg-purple-50 dark:bg-[var(--bg-card-dark)] rounded-lg shadow-md overflow-hidden">
                                    {activity.image ? (
                                        <img
                                            src={getImageUrl(activity.image)}
                                            alt={activity.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                    
                                        <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{activity.name}</h3>
                                            {!activity.is_active && (
                                                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-[var(--text-muted-dark)] text-xs rounded">
                                                    Inactief
                                                </span>
                                            )}
                                        </div>
                                        
                                            {activity.description && (
                                            <p className="text-sm text-gray-600 dark:text-[var(--text-muted-dark)] mb-3 line-clamp-2">{activity.description}</p>
                                        )}
                                        
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xl font-bold text-purple-600">€{fmt(activity.price)}</span>
                                            {activity.max_participants && (
                                                <span className="text-sm text-gray-500 dark:text-[var(--text-muted-dark)]">Max: {activity.max_participants}</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(activity)}
                                                className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-[var(--bg-soft-dark)] transition flex items-center justify-center"
                                            >
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Bewerken
                                            </button>
                                            <button
                                                onClick={() => handleDelete(activity.id)}
                                                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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
