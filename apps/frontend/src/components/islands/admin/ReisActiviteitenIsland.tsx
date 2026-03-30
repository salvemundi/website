'use client';

import { useState, useTransition, useActionState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Loader2, 
    Plus, 
    Edit2, 
    Trash2, 
    Save, 
    X, 
    Users,
    ChevronRight,
    AlertCircle,
    Info,
    Layers,
    Euro
} from 'lucide-react';
import { 
    createTripActivity, 
    updateTripActivity, 
    deleteTripActivity
} from '@/server/actions/admin-reis.actions';
import { getImageUrl } from '@/lib/image-utils';
import type { Trip, TripActivity } from '@salvemundi/validations';

interface ReisActiviteitenIslandProps {
    initialTrips: Trip[];
    initialActivities: TripActivity[];
    initialSelectedTripId: number;
    initialSignupsByActivity: Record<number, any[]>;
}

export default function ReisActiviteitenIsland({ 
    initialTrips, 
    initialActivities, 
    initialSelectedTripId,
    initialSignupsByActivity
}: ReisActiviteitenIslandProps) {
    const router = useRouter();
    const [trips] = useState<Trip[]>(initialTrips);
    const [selectedTripId, setSelectedTripId] = useState<number>(initialSelectedTripId);
    const [activities, setActivities] = useState<TripActivity[]>(initialActivities);
    const [signupsByActivity] = useState<Record<number, any[]>>(initialSignupsByActivity);
    
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const [editingActivity, setEditingActivity] = useState<TripActivity | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const [viewingSignupsId, setViewingSignupsId] = useState<number | null>(null);

    // Sync state with props when trip changes via URL
    useEffect(() => {
        setActivities(initialActivities);
        setSelectedTripId(initialSelectedTripId);
    }, [initialActivities, initialSelectedTripId]);

    // Handle trip selection via URL
    const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        router.push(`/beheer/reis/activiteiten?tripId=${id}`);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze activiteit wilt verwijderen?')) return;
        
        startTransition(async () => {
            const res = await deleteTripActivity(id);
            if (res.success) {
                setActivities(prev => prev.filter(a => a.id !== id));
            } else {
                alert(res.error || 'Verwijderen mislukt');
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
            {/* Trip Selector Card */}
            <div className="bg-[var(--beheer-card-bg)]/80 backdrop-blur-md rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] p-8 mb-10 transition-all hover:shadow-[var(--shadow-glow)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--beheer-text-muted)] mb-3 px-1">
                            Selecteer Reis
                        </label>
                        <div className="relative group">
                            <select
                                value={selectedTripId}
                                onChange={handleTripChange}
                                className="w-full pl-6 pr-12 py-4 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-[var(--radius-xl)] text-[var(--beheer-text)] font-black uppercase tracking-widest text-xs focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all appearance-none cursor-pointer"
                            >
                                {trips.map(trip => (
                                    <option key={trip.id} value={trip.id}>{trip.name}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 h-5 w-5 text-[var(--beheer-text-muted)] pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors" />
                        </div>
                    </div>
                    
                    <button
                        onClick={() => {
                            setIsAddingNew(true);
                            setEditingActivity(null);
                        }}
                        className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] hover:opacity-90 text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--beheer-accent)]/20 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Nieuwe Activiteit
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-[var(--theme-error)]/10 text-[var(--theme-error)] rounded-[var(--radius-xl)] border border-[var(--theme-error)]/20 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            {/* List or Form */}
            {isAddingNew || editingActivity ? (
                <ActivityForm 
                    activity={editingActivity} 
                    tripId={selectedTripId} 
                    onCancel={() => {
                        setIsAddingNew(false);
                        setEditingActivity(null);
                    }}
                    onSuccess={() => {
                        setIsAddingNew(false);
                        setEditingActivity(null);
                        // Data will refresh via revalidatePath in the action
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-[var(--bg-card)]/40 rounded-[var(--radius-2xl)] border-2 border-dashed border-[var(--border-color)]">
                            <Layers className="h-12 w-12 text-[var(--text-light)] mx-auto mb-4" />
                            <p className="text-[var(--text-muted)] font-medium uppercase tracking-widest text-xs">Nog geen activiteiten voor deze reis</p>
                        </div>
                    ) : (
                        activities.map(activity => (
                            <ActivityCard 
                                key={activity.id} 
                                activity={activity} 
                                signupCount={signupsByActivity[activity.id]?.length || 0}
                                onEdit={() => setEditingActivity(activity)}
                                onDelete={() => handleDelete(activity.id)}
                                onViewSignups={() => setViewingSignupsId(activity.id)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Signups Modal */}
            {viewingSignupsId && (
                <SignupsModal 
                    activity={activities.find(a => a.id === viewingSignupsId)!}
                    signups={signupsByActivity[viewingSignupsId] || []}
                    onClose={() => setViewingSignupsId(null)}
                />
            )}
        </div>
    );
}

function ActivityCard({ activity, signupCount, onEdit, onDelete, onViewSignups }: any) {
    return (
        <div className="group bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-lg border border-[var(--beheer-border)] overflow-hidden flex flex-col transition-all hover:ring-[var(--beheer-accent)]/50 hover:shadow-[var(--shadow-glow)]">
            {activity.image && (
                <div className="relative h-48 w-full overflow-hidden bg-[var(--bg-main)]">
                    <img 
                        src={getImageUrl(activity.image, { width: 600, height: 400, fit: 'cover' }) || ''} 
                        alt={activity.name} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    {!activity.is_active && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-[var(--beheer-card-bg)]/80 text-[var(--beheer-text)] text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-sm border border-[var(--beheer-border)]/20">
                            Inactief
                        </div>
                    )}
                </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-black text-[var(--beheer-text)] tracking-tight leading-tight group-hover:text-[var(--beheer-accent)] transition-colors">{activity.name}</h3>
                    <div className="px-3 py-1 bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] text-sm font-black italic rounded-lg shrink-0">
                        €{activity.price.toFixed(2)}
                    </div>
                </div>

                {activity.description && (
                    <p className="text-sm text-[var(--beheer-text-muted)] mb-6 line-clamp-2">
                        {activity.description}
                    </p>
                )}

                <div className="mt-auto space-y-3">
                    <button
                        onClick={onViewSignups}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-main)] hover:bg-[var(--beheer-accent)]/10 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-[10px] transition-all border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30"
                    >
                        <Users className="h-3.5 w-3.5" />
                        Inschrijvingen ({signupCount})
                    </button>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--bg-main)] hover:bg-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-[10px] transition-all border border-[var(--beheer-border)]"
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                            Bewerken
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-3 bg-[var(--beheer-inactive)]/5 hover:bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] rounded-[var(--beheer-radius)] transition-all border border-[var(--beheer-inactive)]/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActivityForm({ activity, tripId, onCancel, onSuccess }: any) {
    const action = activity ? updateTripActivity.bind(null, activity.id) : createTripActivity;
    const [state, formAction, isPending] = useActionState(action, null);
    const [options, setOptions] = useState<any[]>(activity?.options || []);
    const [selectionType, setSelectionType] = useState<'single' | 'multiple'>(activity?.max_selections === 1 ? 'single' : 'multiple');

    const handleAddOption = () => setOptions([...options, { name: '', price: 0 }]);
    const handleRemoveOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
    const handleOptionChange = (index: number, field: string, value: any) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setOptions(newOptions);
    };

    useEffect(() => {
        if (state?.success) {
            onSuccess();
        }
    }, [state?.success, onSuccess]);

    return (
        <form action={formAction} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl border border-[var(--beheer-border)] p-8 animate-in slide-in-from-bottom-4 duration-500">
            <input type="hidden" name="trip_id" value={tripId} />
            <input type="hidden" name="options" value={JSON.stringify(options)} />

            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--beheer-border)]/30">
                <h2 className="text-2xl font-black text-[var(--beheer-text)] uppercase tracking-tight">
                    {activity ? 'Activiteit Bewerken' : 'Nieuwe Activiteit'}
                </h2>
                <button type="button" onClick={onCancel} className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">Naam *</label>
                        <input
                            name="name"
                            defaultValue={activity?.name || ''}
                            required
                            className="w-full px-5 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)] rounded-[var(--radius-xl)] text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] transition-all"
                            placeholder="Bijv. Kanoën op de Amstel"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">Beschrijving</label>
                        <textarea
                            name="description"
                            defaultValue={activity?.description || ''}
                            rows={4}
                            className="w-full px-5 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)] rounded-[var(--radius-xl)] text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] transition-all resize-none"
                            placeholder="Wat gaan we doen?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">Basisprijs (€) *</label>
                            <div className="relative">
                                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-light)]" />
                                <input
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    defaultValue={activity?.price || 0}
                                    required
                                    className="w-full pl-10 pr-5 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)] rounded-[var(--radius-xl)] text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">Volgorde</label>
                            <input
                                type="number"
                                name="display_order"
                                defaultValue={activity?.display_order || 0}
                                className="w-full px-5 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)] rounded-[var(--radius-xl)] text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">Max Deelnemers</label>
                            <input
                                type="number"
                                name="max_participants"
                                defaultValue={activity?.max_participants || ''}
                                placeholder="Leeg = onbeperkt"
                                className="w-full px-5 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)] rounded-[var(--radius-xl)] text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] transition-all"
                            />
                        </div>
                        <div className="flex items-end">
                             <input 
                                type="hidden" 
                                name="max_selections" 
                                value={selectionType === 'single' ? '1' : ''} 
                             />
                        </div>
                    </div>

                    <div className="p-6 bg-[var(--bg-main)]/50 rounded-[var(--radius-2xl)] ring-1 ring-[var(--border-color)]/50">
                        <div className="flex items-center justify-between mb-6 px-1 border-b border-[var(--border-color)]/20 pb-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Sub-opties & Extra Kosten</label>
                                <p className="text-[10px] text-[var(--text-light)] mt-1">Configureer extra keuzes voor deelnemers</p>
                            </div>
                            <button type="button" onClick={handleAddOption} className="px-3 py-1.5 bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors">
                                <Plus className="h-3 w-3" /> Optie toevoegen
                            </button>
                        </div>

                        <div className="mb-6 px-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-3">Selectie Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label 
                                    onClick={() => setSelectionType('single')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                    selectionType === 'single'
                                    ? 'bg-[var(--theme-purple)]/10 border-[var(--theme-purple)] text-[var(--theme-purple)]' 
                                    : 'bg-[var(--bg-card)] border-[var(--border-color)]/30 text-[var(--text-light)] hover:border-[var(--border-color)]'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="selection_type_ui" 
                                        checked={selectionType === 'single'}
                                        onChange={() => {}} 
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-bold">Enkele selectie (Radio)</span>
                                </label>
                                <label 
                                    onClick={() => setSelectionType('multiple')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                    selectionType === 'multiple'
                                    ? 'bg-[var(--theme-purple)]/10 border-[var(--theme-purple)] text-[var(--theme-purple)]' 
                                    : 'bg-[var(--bg-card)] border-[var(--border-color)]/30 text-[var(--text-light)] hover:border-[var(--border-color)]'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="selection_type_ui" 
                                        checked={selectionType === 'multiple'}
                                        onChange={() => {}} 
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-bold">Meerdere (Checkbox)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {options.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-[var(--border-color)]/30 rounded-2xl">
                                    <Layers className="h-6 w-6 text-[var(--text-light)]/30 mx-auto mb-2" />
                                    <p className="text-[10px] text-[var(--text-light)] italic">Nog geen sub-opties geconfigureerd</p>
                                </div>
                            ) : options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2 group animate-in slide-in-from-right-2">
                                    <div className="flex-1 relative">
                                        <input
                                            placeholder={`Optie ${idx + 1} (bijv. Helmhuur)`}
                                            value={opt.name}
                                            onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[var(--bg-card)] border-0 ring-1 ring-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--theme-purple)] transition-all"
                                        />
                                    </div>
                                    <div className="relative w-24">
                                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-light)]" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={opt.price}
                                            onChange={(e) => handleOptionChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full pl-8 pr-3 py-2.5 bg-[var(--bg-card)] border-0 ring-1 ring-[var(--border-color)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--theme-purple)] transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveOption(idx)} 
                                        type="button" 
                                        className="p-2.5 text-[var(--text-light)] hover:text-[var(--theme-error)] hover:bg-[var(--theme-error)]/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-1 py-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    defaultChecked={activity?.is_active ?? true}
                                    className="sr-only peer"
                                />
                                <div className="h-6 w-11 bg-[var(--border-color)] rounded-full peer-checked:bg-[var(--theme-purple)] transition-all" />
                                <div className="absolute left-1 top-1 h-4 w-4 bg-[var(--bg-card)] rounded-full transition-all peer-checked:left-6" />
                            </div>
                            <span className="text-sm font-bold text-[var(--text-subtle)] group-hover:text-[var(--theme-purple)] transition-colors">Activiteit is Actief</span>
                        </label>
                    </div>
                </div>
            </div>

            {state?.error && (
                <div className="mt-8 p-4 bg-[var(--theme-error)]/10 text-[var(--theme-error)] rounded-[var(--radius-xl)] border border-[var(--theme-error)]/20 text-sm font-semibold">
                    {state.error}
                </div>
            )}

            <div className="mt-12 flex gap-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-[var(--theme-purple)] hover:opacity-90 text-white rounded-[var(--radius-xl)] font-bold shadow-lg shadow-[var(--theme-purple)]/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Wijzigingen Opslaan
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 bg-[var(--bg-main)] hover:bg-[var(--border-color)]/20 text-[var(--text-subtle)] rounded-[var(--radius-xl)] font-bold transition-all"
                >
                    Annuleren
                </button>
            </div>
        </form>
    );
}

function SignupsModal({ activity, signups, onClose }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-main)]/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[var(--beheer-card-bg)] w-full max-w-2xl rounded-[var(--beheer-radius)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[var(--beheer-border)] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-[var(--beheer-border)]/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-[var(--radius-xl)] bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight leading-tight">Inschrijvingen</h2>
                            <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest">{activity.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-main)] rounded-xl transition-colors">
                        <X className="h-6 w-6 text-[var(--beheer-text-muted)]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {signups.length === 0 ? (
                        <div className="text-center py-20">
                            <Info className="h-10 w-10 text-[var(--beheer-text-muted)]/50 mx-auto mb-4" />
                            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px]">Nog geen inschrijvingen voor deze activiteit.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {signups.map((s: any) => (
                                <div key={s.id} className="p-4 bg-[var(--bg-main)]/50 rounded-[var(--radius-xl)] border border-[var(--beheer-border)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-[var(--bg-main)]">
                                    <div>
                                        <p className="font-black text-[var(--beheer-text)] uppercase tracking-tight text-sm">
                                            {s.trip_signup_id?.first_name} {s.trip_signup_id?.last_name}
                                        </p>
                                        <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest">{s.trip_signup_id?.email}</p>
                                    </div>
                                    {s.selected_options && (
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(s.selected_options) ? s.selected_options.map((opt: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-[var(--beheer-card-bg)] text-[10px] font-black text-[var(--beheer-accent)] rounded-lg border border-[var(--beheer-accent)]/20 uppercase tracking-widest">
                                                    {opt}
                                                </span>
                                            )) : (
                                                <span className="px-2 py-1 bg-[var(--beheer-card-bg)] text-[10px] font-black text-[var(--beheer-accent)] rounded-lg border border-[var(--beheer-accent)]/20 uppercase tracking-widest">
                                                    {s.selected_options}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-[var(--beheer-border)]/30 flex items-center justify-between bg-[var(--bg-main)]/50">
                    <div className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                        Totaal: <span className="text-[var(--beheer-text)]">{signups.length}</span>
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-[var(--beheer-border)]/20 hover:bg-[var(--beheer-border)]/40 text-[var(--beheer-text)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">
                        Sluiten
                    </button>
                </div>
            </div>
        </div>
    );
}
