'use client';

import { useState, useRef, useOptimistic, useActionState, useEffect } from 'react';
import { 
    Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Upload, Users, 
    ChevronDown, LayoutGrid, List, CheckCircle2, AlertCircle, 
    Loader2, Euro, Info, MoreHorizontal, Settings2, Trash
} from 'lucide-react';
import { 
    getTripActivities, createTripActivity, updateTripActivity, 
    deleteTripActivity, getActivitySignups 
} from '@/server/actions/admin-reis.actions';

interface Trip {
    id: number;
    name: string;
}

interface TripActivity {
    id: number;
    trip_id: number;
    name: string;
    description?: string | null;
    price: number;
    image?: string | null;
    max_participants?: number | null;
    is_active: boolean;
    display_order: number;
    options?: { name: string; price: number }[] | null;
    max_selections?: number | null;
}

export default function TripActivitiesIsland({ trips }: { trips: Trip[] }) {
    const [selectedTripId, setSelectedTripId] = useState<number>(trips[0]?.id || 0);
    const [activities, setActivities] = useState<TripActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [viewingSignupsId, setViewingSignupsId] = useState<number | null>(null);
    const [signups, setSignups] = useState<any[]>([]);
    const [loadingSignups, setLoadingSignups] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [options, setOptions] = useState<{ name: string; price: number }[]>([]);
    
    useEffect(() => {
        if (selectedTripId) {
            refreshActivities();
        }
    }, [selectedTripId]);

    const refreshActivities = async () => {
        setLoading(true);
        const data = await getTripActivities(selectedTripId);
        setActivities(data as TripActivity[]);
        setLoading(false);
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    // Action wrappers
    const [createState, createAction, createPending] = useActionState(async (prevState: any, formData: FormData) => {
        formData.set('trip_id', selectedTripId.toString());
        formData.set('options', JSON.stringify(options));
        const res = await createTripActivity(prevState, formData);
        if (res.success) {
            showToast('Activiteit succesvol aangemaakt', 'success');
            setIsAdding(false);
            setOptions([]);
            refreshActivities();
        } else {
            showToast(res.error || 'Fout bij aanmaken', 'error');
        }
        return res;
    }, { success: false });

    const [updateState, updateAction, updatePending] = useActionState(async (prevState: any, formData: FormData) => {
        if (!editingId) return prevState;
        formData.set('options', JSON.stringify(options));
        const res = await updateTripActivity(editingId, prevState, formData);
        if (res.success) {
            showToast('Activiteit bijgewerkt', 'success');
            setEditingId(null);
            setOptions([]);
            refreshActivities();
        } else {
            showToast(res.error || 'Fout bij bijwerken', 'error');
        }
        return res;
    }, { success: false });

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze activiteit wilt verwijderen?')) return;
        const res = await deleteTripActivity(id);
        if (res.success) {
            showToast('Activiteit verwijderd', 'success');
            refreshActivities();
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
    };

    const handleViewSignups = async (id: number) => {
        setViewingSignupsId(id);
        setLoadingSignups(true);
        const data = await getActivitySignups(id);
        setSignups(data);
        setLoadingSignups(false);
    };

    const startEdit = (activity: TripActivity) => {
        setEditingId(activity.id);
        setOptions(activity.options || []);
        setIsAdding(false);
    };

    const startAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        setOptions([]);
    };

    const addOption = () => setOptions([...options, { name: '', price: 0 }]);
    const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
    const updateOption = (idx: number, field: 'name' | 'price', value: any) => {
        const newOpts = [...options];
        newOpts[idx] = { ...newOpts[idx], [field]: field === 'price' ? parseFloat(value) || 0 : value };
        setOptions(newOpts);
    };

    const getImageUrl = (id: string) => `/api/assets/${id}`;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Trip Selector */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 mb-8 border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Settings2 className="h-3 w-3" /> Selecteer Reis
                    </label>
                    <div className="relative group min-w-[300px]">
                        <select
                            value={selectedTripId}
                            onChange={(e) => setSelectedTripId(parseInt(e.target.value))}
                            className="w-full pl-0 pr-10 py-2 bg-transparent text-xl font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer border-b-2 border-transparent focus:border-primary transition-all"
                        >
                            {trips.map((trip) => (
                                <option key={trip.id} value={trip.id} className="dark:bg-slate-800 text-lg">
                                    {trip.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                </div>

                {!isAdding && !editingId && (
                    <button
                        onClick={startAdd}
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Nieuwe Activiteit
                    </button>
                )}
            </div>

            {/* Form Section */}
            {(isAdding || editingId) && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 mb-10 border border-slate-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="text-2xl font-bold dark:text-white mb-8 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            {isAdding ? <Plus className="h-6 w-6" /> : <Edit2 className="h-6 w-6" />}
                        </div>
                        {isAdding ? 'Nieuwe Reisactiviteit' : 'Activiteit Bewerken'}
                    </h2>

                    <form action={isAdding ? createAction : updateAction} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-bold text-slate-600 dark:text-slate-400">Naam *</label>
                                    <input 
                                        type="text" id="name" name="name" 
                                        defaultValue={editingId ? activities.find(a => a.id === editingId)?.name : ''}
                                        required
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-bold text-slate-600 dark:text-slate-400">Beschrijving</label>
                                    <textarea 
                                        id="description" name="description" rows={3}
                                        defaultValue={editingId ? activities.find(a => a.id === editingId)?.description || '' : ''}
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary outline-none transition resize-none" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="price" className="text-sm font-bold text-slate-600 dark:text-slate-400">Basisprijs (€) *</label>
                                    <div className="relative">
                                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input 
                                            type="number" step="0.01" id="price" name="price" 
                                            defaultValue={editingId ? activities.find(a => a.id === editingId)?.price : 0}
                                            required
                                            className="w-full pl-11 pr-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary outline-none" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="max_participants" className="text-sm font-bold text-slate-600 dark:text-slate-400">Max Deelnemers</label>
                                    <input 
                                        type="number" id="max_participants" name="max_participants" 
                                        defaultValue={editingId ? activities.find(a => a.id === editingId)?.max_participants || '' : ''}
                                        placeholder="Leeg = onbeperkt"
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary outline-none" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="display_order" className="text-sm font-bold text-slate-600 dark:text-slate-400">Volgorde</label>
                                    <input 
                                        type="number" id="display_order" name="display_order" 
                                        defaultValue={editingId ? activities.find(a => a.id === editingId)?.display_order : activities.length}
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary outline-none" 
                                    />
                                </div>
                                <div className="flex items-end pb-4">
                                    <label className="flex items-center gap-3 cursor-pointer group px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors">
                                        <input 
                                            type="checkbox" id="is_active" name="is_active" 
                                            defaultChecked={editingId ? activities.find(a => a.id === editingId)?.is_active : true}
                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20" 
                                        />
                                        <span className="text-sm font-bold dark:text-white">Actief</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Options Management */}
                        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-8 border border-slate-100 dark:border-slate-700/50 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                                    <List className="h-5 w-5 text-primary" /> Sub-opties Configuratie
                                </h3>
                                <button type="button" onClick={addOption} className="text-primary hover:text-primary-dark font-bold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors">
                                    <Plus className="h-4 w-4" /> Optie toevoegen
                                </button>
                            </div>

                            <div className="flex gap-8 mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="radio" name="max_selections" value="" 
                                        defaultChecked={editingId ? activities.find(a => a.id === editingId)?.max_selections === null : true}
                                        className="w-5 h-5 text-primary" 
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold dark:text-white">Meerdere opties mogelijk</span>
                                        <span className="text-xs text-slate-500">Gebruikers kunnen meerdere extra's kiezen (checkboxes)</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="radio" name="max_selections" value="1" 
                                        defaultChecked={editingId ? activities.find(a => a.id === editingId)?.max_selections === 1 : false}
                                        className="w-5 h-5 text-primary" 
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold dark:text-white">Slechts 1 optie kiezen</span>
                                        <span className="text-xs text-slate-500">Gebruikers kiezen max één extra (radio buttons)</span>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-4">
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-left-4 duration-300">
                                        <div className="flex-1">
                                            <input
                                                type="text" value={opt.name}
                                                onChange={(e) => updateOption(idx, 'name', e.target.value)}
                                                placeholder={`Naam van optie ${idx + 1} (bijv. Vegetarisch)`}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition shadow-sm"
                                            />
                                        </div>
                                        <div className="w-32 relative">
                                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <input
                                                type="number" step="0.01" value={opt.price}
                                                onChange={(e) => updateOption(idx, 'price', e.target.value)}
                                                className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition shadow-sm"
                                                placeholder="Extra"
                                            />
                                        </div>
                                        <button type="button" onClick={() => removeOption(idx)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                                {options.length === 0 && (
                                    <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 font-medium italic">
                                        Nog geen extra opties geconfigureerd
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-4 pt-4">
                            <button 
                                type="button" onClick={() => { setIsAdding(false); setEditingId(null); setOptions([]); }}
                                className="px-8 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                                Annuleren
                            </button>
                            <button 
                                type="submit" 
                                disabled={createPending || updatePending}
                                className="px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-70"
                            >
                                {(createPending || updatePending) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                {isAdding ? 'Activiteit Aanmaken' : 'Wijzigingen Opslaan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Activities List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest">Laden van activiteiten...</p>
                </div>
            ) : activities.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700/50">
                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <LayoutGrid className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold dark:text-white mb-2">Geen activiteiten gevonden</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-8">Er zijn nog geen activiteiten toegevoegd aan deze reis. Klik op de knop bovenaan om te beginnen.</p>
                    <button onClick={startAdd} className="font-bold text-primary hover:underline">Nu toevoegen →</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activities.map((activity) => (
                        <div key={activity.id} className="group bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 dark:border-slate-700/50 flex flex-col">
                            {/* Card Header/Visual */}
                            {activity.image && (
                                <div className="relative h-48 bg-slate-900 overflow-hidden">
                                    <img src={getImageUrl(activity.image)} alt={activity.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${activity.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                        {activity.is_active ? 'Actief' : 'Inactief'}
                                    </div>
                                    <div className="absolute top-4 left-4 h-8 w-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                        #{activity.display_order}
                                    </div>
                                </div>
                            )}

                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{activity.name}</h3>
                                {activity.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 h-10">{activity.description}</p>
                                )}

                                <div className="flex justify-between items-center mb-6 pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prijs</span>
                                        <span className="text-2xl font-black text-primary">€{activity.price.toFixed(2)}</span>
                                    </div>
                                    {activity.max_participants && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Capaciteit</span>
                                            <span className="text-sm font-bold dark:text-white flex items-center gap-1"><Users className="h-3 w-3" /> {activity.max_participants}</span>
                                        </div>
                                    )}
                                </div>

                                {activity.options && activity.options.length > 0 && (
                                    <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{activity.max_selections === 1 ? 'Eén optie' : 'Sub-opties'} ({activity.options.length})</span>
                                        <div className="flex flex-wrap gap-2">
                                            {activity.options.slice(0, 3).map((o, i) => (
                                                <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                                    {o.name} {o.price > 0 && `(+€${o.price})`}
                                                </span>
                                            ))}
                                            {activity.options.length > 3 && (
                                                <span className="text-[10px] font-bold px-2 py-1 text-slate-400">+{activity.options.length - 3}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto space-y-3 pt-4">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => startEdit(activity)}
                                            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary dark:hover:text-primary transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="h-4 w-4" /> Bewerken
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(activity.id)}
                                            className="p-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 text-slate-300 hover:text-red-500 hover:border-red-500/20 hover:bg-red-50 to dark:hover:bg-red-900/10 transition-all flex items-center justify-center"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleViewSignups(activity.id)}
                                        className="w-full h-12 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-indigo-100/50 dark:border-indigo-900/20"
                                    >
                                        <Users className="h-4 w-4" /> Inschrijvingen Bekijken
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Signups Modal */}
            {viewingSignupsId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    Inschrijvingen
                                </h2>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">{activities.find(a => a.id === viewingSignupsId)?.name}</p>
                            </div>
                            <button
                                onClick={() => setViewingSignupsId(null)}
                                className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition group"
                            >
                                <X className="h-6 w-6 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {loadingSignups ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
                                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading data...</p>
                                </div>
                            ) : signups.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Users className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Nog geen inschrijvingen voor deze activiteit.</p>
                                </div>
                            ) : (
                                <div className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                                <th className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Deelnemer</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Gekozen Opties</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {signups.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-6 font-bold text-slate-900 dark:text-white">
                                                        {s.trip_signup_id ? `${s.trip_signup_id.first_name} ${s.trip_signup_id.middle_name || ''} ${s.trip_signup_id.last_name}` : 'Onbekend'}
                                                    </td>
                                                    <td className="px-6 py-6 text-slate-500 dark:text-slate-400 font-medium">{s.trip_signup_id?.email || '-'}</td>
                                                    <td className="px-6 py-6">
                                                        {Array.isArray(s.selected_options) && s.selected_options.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {s.selected_options.map((opt: string, i: number) => (
                                                                    <span key={i} className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase rounded-lg border border-primary/10">
                                                                        {opt}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 italic text-sm">Geen opties</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <td colSpan={3} className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                                    Totaal: {signups.length} {signups.length === 1 ? 'aanmelding' : 'aanmeldingen'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 flex justify-end">
                            <button
                                onClick={() => setViewingSignupsId(null)}
                                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Sluiten
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Toast */}
            {toast && (
                <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className={`px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' : 'bg-red-500/90 border-red-400 text-white'}`}>
                        <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-xl">
                            {toast.type === 'success' ? '✓' : '!'}
                        </div>
                        <span className="font-bold text-lg">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
