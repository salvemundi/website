'use client';

import { useState, useTransition, useActionState } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Save, 
    X, 
    Upload, 
    Calendar, 
    Users, 
    DollarSign,
    Loader2,
    Info,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
    createTrip, 
    updateTrip, 
    deleteTrip 
} from '@/server/actions/admin-reis.actions';
import { getImageUrl } from '@/lib/image-utils';
import type { Trip } from '@salvemundi/validations';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import { Bus, Clock } from 'lucide-react';

interface ReisInstellingenIslandProps {
    initialTrips: Trip[];
}

export default function ReisInstellingenIsland({ initialTrips }: ReisInstellingenIslandProps) {
    const [trips, setTrips] = useState<Trip[]>(initialTrips);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const [createState, createAction, isCreating] = useActionState(createTrip, null);
    const [updateState, updateAction, isUpdating] = useActionState(
        (prevState: any, formData: FormData) => updateTrip(editingTrip?.id!, prevState, formData), 
        null
    );

    const handleEdit = (trip: Trip) => {
        setEditingTrip(trip);
        setIsAdding(false);
    };

    const handleAdd = () => {
        setEditingTrip(null);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setEditingTrip(null);
        setIsAdding(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze reis wilt verwijderen? Dit verwijdert ook alle aanmeldingen!')) return;
        
        setIsDeleting(id);
        try {
            const res = await deleteTrip(id);
            if (res.success) {
                setTrips(prev => prev.filter(t => t.id !== id));
            } else {
                alert(res.error || 'Verwijderen mislukt');
            }
        } catch (err) {
            alert('Er is een fout opgetreden');
        } finally {
            setIsDeleting(null);
        }
    };

    const state = editingTrip ? updateState : createState;
    const pending = editingTrip ? isUpdating : isCreating;

    if (state?.success && (isAdding || editingTrip)) {
        // Refresh and close on success
        window.location.reload();
    }

    const upcomingCount = trips.filter(t => new Date(t.event_date || t.start_date!) >= new Date()).length;
    const openCount = trips.filter(t => t.registration_open).length;
    const busCount = trips.filter(t => t.is_bus_trip).length;

    const adminStats = [
        { label: 'Reizen', value: trips.length, icon: Calendar, trend: 'Totaal' },
        { label: 'Aankomend', value: upcomingCount, icon: Clock, trend: 'Toekomst' },
        { label: 'Inschrijving Open', value: openCount, icon: CheckCircle, trend: 'Actief' },
        { label: 'Busreizen', value: busCount, icon: Bus, trend: 'Logistiek' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Reis Instellingen"
                subtitle="Configureer reis details, prijzen en algemene instellingen"
                backHref="/beheer/reis"
                actions={
                    <>
                        <button
                            onClick={handleAdd}
                            className="px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] hover:opacity-90 text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] transition-all active:scale-95 flex items-center gap-2 group"
                        >
                            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                            <span>Nieuw</span>
                        </button>
                    </>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AdminStatsBar stats={adminStats} />

            {/* Error Display */}
            {state?.error && (
                <div className="mb-8 p-4 bg-[var(--theme-error)]/10 text-[var(--theme-error)] rounded-2xl border border-[var(--theme-error)]/20 flex items-center gap-3 animate-in slide-in-from-top-4">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">{state.error}</p>
                        {state.fieldErrors && (
                            <ul className="text-xs mt-1 list-disc list-inside opacity-80">
                                {Object.entries(state.fieldErrors).map(([field, msgs]: any) => (
                                    <li key={field}>{field}: {msgs.join(', ')}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Form (Add/Edit) */}
            {(isAdding || editingTrip) && (
                <div className="mb-12 bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                    <div className="p-8 border-b border-[var(--beheer-border)]/50 bg-[var(--bg-main)]/30 backdrop-blur-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-inner">
                                {isAdding ? <Plus className="h-6 w-6" /> : <Edit2 className="h-6 w-6" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">
                                    {isAdding ? 'Nieuwe Reis Toevoegen' : `${editingTrip?.name} Bewerken`}
                                </h2>
                                <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest">Vul alle verplichte velden in</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCancel}
                            className="p-3 hover:bg-[var(--beheer-border)]/10 rounded-xl transition-colors text-[var(--beheer-text-muted)]"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form action={editingTrip ? updateAction : createAction} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-6">
                                <InputField 
                                    label="Naam van de reis" 
                                    name="name" 
                                    defaultValue={editingTrip?.name} 
                                    placeholder="Bijv. Skiereis 2025" 
                                    required 
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Beschrijving</label>
                                    <textarea 
                                        name="description"
                                        defaultValue={editingTrip?.description || ''}
                                        rows={4}
                                        className="w-full px-6 py-4 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--border-color)]/30 rounded-2xl text-sm text-[var(--text-main)] transition-all resize-none font-semibold focus:ring-2 focus:ring-[var(--theme-purple)]"
                                        placeholder="Korte omschrijving voor de deelnemers..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Start Datum" name="start_date" type="date" defaultValue={editingTrip?.start_date?.split('T')[0]} required />
                                    <InputField label="Eind Datum" name="end_date" type="date" defaultValue={editingTrip?.end_date?.split('T')[0]} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Max Deelnemers" name="max_participants" type="number" defaultValue={editingTrip?.max_participants} required />
                                    <InputField label="Aantal Crew" name="max_crew" type="number" defaultValue={editingTrip?.max_crew || 0} required />
                                </div>
                            </div>

                            {/* Right Column: Pricing & Logistics */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Basis Prijs (€)" name="base_price" type="number" step="0.01" defaultValue={editingTrip?.base_price} required />
                                    <InputField label="Aanbetaling (€)" name="deposit_amount" type="number" step="0.01" defaultValue={editingTrip?.deposit_amount} required />
                                </div>
                                <InputField label="Crew Korting (€)" name="crew_discount" type="number" step="0.01" defaultValue={editingTrip?.crew_discount} />
                                <InputField label="Banner Image ID (Directus)" name="image" defaultValue={editingTrip?.image} />
                                
                                <div className="p-6 bg-[var(--bg-main)]/50 rounded-3xl border border-[var(--border-color)]/20 space-y-4">
                                    <ToggleField label="Inschrijving nu Open" name="registration_open" defaultChecked={editingTrip?.registration_open} />
                                    <ToggleField label="Restbetalingen toestaan" name="allow_final_payments" defaultChecked={editingTrip?.allow_final_payments} />
                                    <ToggleField label="Busreis (Vraag rijbewijs)" name="is_bus_trip" defaultChecked={editingTrip?.is_bus_trip} />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Auto-open Datum</label>
                                    <input 
                                        type="datetime-local" 
                                        name="registration_start_date"
                                        defaultValue={editingTrip?.registration_start_date ? new Date(editingTrip.registration_start_date).toISOString().slice(0,16) : ''}
                                        className="w-full px-6 py-4 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--border-color)]/30 rounded-2xl text-sm text-[var(--text-main)] transition-all font-semibold focus:ring-2 focus:ring-[var(--theme-purple)]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-[var(--beheer-border)]/30 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-8 py-4 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] font-black uppercase tracking-widest text-xs transition-colors"
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={pending}
                                className="px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] hover:opacity-95 text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-2xl shadow-[var(--beheer-accent)]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                <span>Gegevens Opslaan</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Trips List */}
            {!isAdding && !editingTrip && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 animate-in fade-in duration-1000">
                    {trips.map((trip) => (
                        <TripCard 
                            key={trip.id} 
                            trip={trip} 
                            onEdit={() => handleEdit(trip)} 
                            onDelete={() => handleDelete(trip.id)}
                            isDeleting={isDeleting === trip.id}
                        />
                    ))}
                    {trips.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <Info className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4 opacity-20" />
                            <p className="text-[var(--text-muted)] font-bold italic">Nog geen reizen gepland...</p>
                        </div>
                    )}
                </div>
            )}
            </div>
        </>
    );
}

function TripCard({ trip, onEdit, onDelete, isDeleting }: any) {
    const sd = trip.start_date || trip.event_date;
    const ed = trip.end_date;
    
    let dateRange = 'Onbekend';
    if (sd) {
        const start = new Date(sd);
        if (ed) {
            const end = new Date(ed);
            dateRange = `${format(start, 'd MMM', { locale: nl })} - ${format(end, 'd MMM yyyy', { locale: nl })}`;
        } else {
            dateRange = format(start, 'd MMMM yyyy', { locale: nl });
        }
    }

    return (
        <div className="group bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)] overflow-hidden flex flex-col transition-all hover:translate-y-[-4px] hover:shadow-2xl">
            {/* Trip Status Overlays */}
            <div className="relative h-48 bg-[var(--beheer-border)]/5 flex items-center justify-center overflow-hidden">
                <div className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl backdrop-blur-md font-black italic text-[10px] uppercase tracking-widest shadow-lg ${
                    trip.registration_open ? 'bg-[var(--beheer-active)] text-white shadow-[var(--beheer-active)]/20' : 'bg-[var(--beheer-inactive)] text-white shadow-[var(--beheer-inactive)]/20'
                }`}>
                    {trip.registration_open ? 'Open' : 'Gesloten'}
                </div>
                {trip.is_bus_trip && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md font-black italic text-[10px] uppercase tracking-widest">
                        Busreis
                    </div>
                )}
                
                {trip.image ? (
                    <img 
                        src={getImageUrl(trip.image, { width: 600, height: 400, fit: 'cover' }) || '/img/newlogo.png'} 
                        alt={trip.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="text-[var(--text-muted)] opacity-30">
                        <ImageIcon className="h-12 w-12" />
                    </div>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-[var(--beheer-text)] tracking-tight mb-2 line-clamp-1 group-hover:text-[var(--beheer-accent)] transition-colors">{trip.name}</h3>
                
                <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3 text-[var(--text-muted)]">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold">{dateRange}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[var(--text-muted)]">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-bold">{trip.max_participants} deelnemers {trip.max_crew > 0 && `(+${trip.max_crew} crew)`}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[var(--beheer-accent)]">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-black italic">€{trip.base_price.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--beheer-border)]/50">
                    <button
                        onClick={onEdit}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-main)] hover:bg-[var(--beheer-border)]/10 text-[var(--beheer-text)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ring-1 ring-[var(--beheer-border)]/50"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                        Bewerken
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--beheer-inactive)]/5 hover:bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ring-1 ring-[var(--beheer-inactive)]/20"
                    >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Wissen
                    </button>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, name, type = 'text', defaultValue, placeholder, required, step }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
                {label} {required && <span className="text-[var(--theme-error)]">*</span>}
            </label>
            <input 
                type={type} 
                name={name}
                step={step}
                defaultValue={defaultValue}
                placeholder={placeholder}
                required={required}
                className="w-full px-6 py-4 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-2xl text-sm text-[var(--beheer-text)] transition-all font-semibold focus:ring-2 focus:ring-[var(--beheer-accent)]"
            />
        </div>
    );
}

function ToggleField({ label, name, defaultChecked }: any) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-xs font-bold text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors">{label}</span>
            <div className="relative">
                <input 
                    type="checkbox" 
                    name={name} 
                    defaultChecked={defaultChecked}
                    className="sr-only peer"
                />
                <div className="w-12 h-6 bg-[var(--beheer-border)]/20 rounded-full peer peer-checked:bg-[var(--beheer-accent)] transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-[var(--beheer-card-bg)] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 shadow-inner ring-1 ring-[var(--beheer-border)]/30"></div>
            </div>
        </label>
    );
}
