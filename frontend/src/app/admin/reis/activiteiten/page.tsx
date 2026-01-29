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
        price: 0 as number | string,
        image: '',
        max_participants: null as number | string | null,
        is_active: true,
        display_order: 0,
        options: [] as { name: string; price: number | string }[],
        max_selections: null as number | null,
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
            options: [],
            max_selections: null,
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
            options: activity.options?.map(o => ({ ...o, price: o.price || 0 })) || [],
            max_selections: activity.max_selections || null,
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
            options: [],
            max_selections: null,
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
                price: typeof form.price === 'string' ? parseFloat(form.price) || 0 : form.price,
                image: form.image || undefined,
                max_participants: form.max_participants ? (typeof form.max_participants === 'string' ? parseInt(form.max_participants) || undefined : form.max_participants) : undefined,
                is_active: form.is_active,
                display_order: form.display_order,
                options: form.options.map(o => ({
                    ...o,
                    price: typeof o.price === 'string' ? parseFloat(o.price) || 0 : o.price
                })),
                max_selections: form.max_selections || undefined,
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


        const formData = new FormData();
        formData.append('file', file);

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch('/api/files', {
                method: 'POST',
                body: formData,
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
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
                    <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 p-4 rounded">
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Trip Selector */}
                <div className="bg-admin-card rounded-lg shadow-md p-6 mb-6">
                    <label className="block text-sm font-medium text-admin-muted mb-2">
                        Selecteer Reis
                    </label>
                    <select
                        value={selectedTripId || ''}
                        onChange={(e) => setSelectedTripId(parseInt(e.target.value))}
                        className="w-full md:w-1/2 px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
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
                            className="px-6 py-3 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition flex items-center shadow-md hover:shadow-lg"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Nieuwe Activiteit Toevoegen
                        </button>
                    </div>
                )}

                {/* Add/Edit Form */}
                {(addingNew || editingId) && (
                    <div className="bg-admin-card rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-admin mb-4">
                            {addingNew ? 'Nieuwe Activiteit' : 'Activiteit Bewerken'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Naam *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                    placeholder="Bijv. Kanoën"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Prijs (€) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setForm({ ...form, price: isNaN(val) ? 0 : val });
                                    }}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Beschrijving
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                    placeholder="Optionele beschrijving..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Max. Deelnemers
                                </label>
                                <input
                                    type="number"
                                    value={form.max_participants ?? ''}
                                    onChange={(e) => setForm({ ...form, max_participants: e.target.value === '' ? null : e.target.value })}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            setForm({ ...form, max_participants: null });
                                        } else {
                                            const val = parseInt(e.target.value);
                                            setForm({ ...form, max_participants: isNaN(val) ? null : val });
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                    placeholder="Leeg = onbeperkt"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Weergavevolgorde
                                </label>
                                <input
                                    type="number"
                                    value={form.display_order}
                                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-admin-muted mb-2">
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

                            <div className="md:col-span-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        className="h-4 w-4 text-theme-purple focus:ring-theme-purple border-admin rounded dark:border-gray-600 bg-admin-card"
                                    />
                                    <span className="ml-2 text-sm text-admin-muted">Actief (zichtbaar voor deelnemers)</span>
                                </label>
                            </div>

                            <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Sub-opties configuratie
                                </label>

                                <div className="flex gap-6 mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="selection_type"
                                            checked={form.max_selections === null}
                                            onChange={() => setForm({ ...form, max_selections: null })}
                                            className="h-4 w-4 text-theme-purple focus:ring-theme-purple border-admin"
                                        />
                                        <span className="ml-2 text-sm text-admin">Meerdere opties mogelijk (Checkbox)</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="selection_type"
                                            checked={form.max_selections === 1}
                                            onChange={() => setForm({ ...form, max_selections: 1 })}
                                            className="h-4 w-4 text-theme-purple focus:ring-theme-purple border-admin"
                                        />
                                        <span className="ml-2 text-sm text-admin">Slechts 1 optie kiezen (Radio)</span>
                                    </label>
                                </div>

                                <label className="block text-sm font-medium text-admin-muted mb-2">
                                    Opties & Extra Kosten
                                </label>
                                <div className="space-y-3">
                                    {form.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={opt.name}
                                                onChange={(e) => {
                                                    const newOpts = [...form.options];
                                                    newOpts[idx] = { ...newOpts[idx], name: e.target.value };
                                                    setForm({ ...form, options: newOpts });
                                                }}
                                                placeholder={`Optie ${idx + 1}`}
                                                className="flex-1 px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                            />
                                            <div className="relative w-32">
                                                <span className="absolute left-3 top-2 text-admin-muted">€</span>
                                                <input
                                                    type="number"
                                                    value={opt.price}
                                                    onChange={(e) => {
                                                        const newOpts = [...form.options];
                                                        newOpts[idx] = { ...newOpts[idx], price: e.target.value };
                                                        setForm({ ...form, options: newOpts });
                                                    }}
                                                    onBlur={(e) => {
                                                        const newOpts = [...form.options];
                                                        const val = parseFloat(e.target.value);
                                                        newOpts[idx] = { ...newOpts[idx], price: isNaN(val) ? 0 : val };
                                                        setForm({ ...form, options: newOpts });
                                                    }}
                                                    className="w-full pl-8 pr-3 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newOpts = form.options.filter((_, i) => i !== idx);
                                                    setForm({ ...form, options: newOpts });
                                                }}
                                                className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setForm({ ...form, options: [...form.options, { name: '', price: 0 }] })}
                                        className="text-sm text-theme-purple font-medium hover:underline flex items-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Optie toevoegen
                                    </button>
                                </div>
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
                                className="px-6 py-2 border border-admin text-admin-muted rounded-lg hover:bg-admin-hover hover:text-admin transition flex items-center"
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
                            <div className="col-span-full text-center py-12 text-admin-muted">
                                Nog geen activiteiten toegevoegd
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="bg-admin-card rounded-lg shadow-md overflow-hidden">
                                    {activity.image ? (
                                        <img
                                            src={getImageUrl(activity.image)}
                                            alt={activity.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-admin-card-soft flex items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-admin-muted" />
                                        </div>
                                    )}

                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-admin">{activity.name}</h3>
                                            {!activity.is_active && (
                                                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-admin-muted text-xs rounded">
                                                    Inactief
                                                </span>
                                            )}
                                        </div>

                                        {activity.description && (
                                            <p className="text-sm text-admin-muted mb-3 line-clamp-2">{activity.description}</p>
                                        )}

                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xl font-bold text-theme-purple">€{fmt(activity.price)}</span>
                                            {activity.max_participants && (
                                                <span className="text-sm text-admin-muted">Max: {activity.max_participants}</span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(activity)}
                                                className="flex-1 px-4 py-2 border border-theme-purple text-theme-purple rounded-lg hover:bg-admin-card-soft transition flex items-center justify-center"
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
