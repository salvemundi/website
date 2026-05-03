'use client';

import { Plus, Edit2, X, Loader2, Save } from 'lucide-react';
import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';
import { InputField, ReisImageUpload, ToggleField } from './TripFormFields';

interface ActionState {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: Record<string, any>;
}

interface TripFormProps {
    editingTrip: Trip | null;
    isAdding: boolean;
    onCancel: () => void;
    state: ActionState | null;
    pending: boolean;
    createAction: (formData: FormData) => void;
    updateAction: (formData: FormData) => void;
}

export default function TripForm({ 
    editingTrip, 
    isAdding, 
    onCancel, 
    state, 
    pending, 
    createAction, 
    updateAction 
}: TripFormProps) {
    return (
        <div className="mb-12 bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-6 border-b border-[var(--beheer-border)]/50 bg-[var(--bg-main)]/30 backdrop-blur-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-inner">
                        {isAdding ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-tight">
                            {isAdding ? 'Nieuwe Reis' : `${editingTrip?.name} Bewerken`}
                        </h2>
                        <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest">Vul alle velden in</p>
                    </div>
                </div>
                <button 
                    onClick={onCancel}
                    className="p-2 hover:bg-[var(--beheer-border)]/10 rounded-lg transition-colors text-[var(--beheer-text-muted)]"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form action={editingTrip ? updateAction : createAction} className="p-6">
                {editingTrip && <input type="hidden" name="id" value={editingTrip.id} />}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Basic Info */}
                    <div className="lg:col-span-7 space-y-5">
                        <InputField 
                            label="Naam van de reis" 
                            name="name" 
                            defaultValue={state?.initialData?.name || editingTrip?.name} 
                            placeholder="Bijv. Skiereis 2025" 
                            required 
                        />
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-0.5">Beschrijving</label>
                            <textarea 
                                name="description"
                                defaultValue={state?.initialData?.description || editingTrip?.description || ''}
                                rows={3}
                                className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--border-color)]/30 rounded-xl text-sm text-[var(--text-main)] transition-all resize-none font-semibold focus:ring-2 focus:ring-[var(--theme-purple)]"
                                placeholder="Korte omschrijving..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Start Datum" name="start_date" type="date" defaultValue={state?.initialData?.start_date || editingTrip?.start_date?.split('T')[0]} required />
                            <InputField label="Eind Datum" name="end_date" type="date" defaultValue={state?.initialData?.end_date || editingTrip?.end_date?.split('T')[0]} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <InputField 
                                label="Capaciteit" 
                                name="max_participants" 
                                type="number" 
                                defaultValue={state?.initialData?.max_participants || editingTrip?.max_participants} 
                                required 
                            />
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-0.5">Auto-open Datum</label>
                                <input 
                                    type="datetime-local" 
                                    name="registration_start_date"
                                    defaultValue={state?.initialData?.registration_start_date || (editingTrip?.registration_start_date ? new Date(editingTrip.registration_start_date).toISOString().slice(0,16) : '')}
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--border-color)]/30 rounded-xl text-sm text-[var(--text-main)] transition-all font-semibold focus:ring-2 focus:ring-[var(--theme-purple)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing & Logistics */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Prijs (€)" name="base_price" type="number" step="0.01" defaultValue={state?.initialData?.base_price || editingTrip?.base_price} required />
                            <InputField label="Aanbetaling (€)" name="deposit_amount" type="number" step="0.01" defaultValue={state?.initialData?.deposit_amount || editingTrip?.deposit_amount} required />
                        </div>
                        
                        <ReisImageUpload 
                            defaultValue={editingTrip?.image} 
                            name="image"
                        />
                        
                        <div className="p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-color)]/20 space-y-3">
                            <ToggleField label="Inschrijving nu Open" name="registration_open" defaultChecked={state?.initialData ? (state.initialData.registration_open === 'on' || state.initialData.registration_open === 'true' || state.initialData.registration_open === true) : !!editingTrip?.registration_open} />
                            <ToggleField label="Restbetalingen" name="allow_final_payments" defaultChecked={state?.initialData ? (state.initialData.allow_final_payments === 'on' || state.initialData.allow_final_payments === 'true' || state.initialData.allow_final_payments === true) : !!editingTrip?.allow_final_payments} />
                            <ToggleField label="Busreis (Vraag rijbewijs)" name="is_bus_trip" defaultChecked={state?.initialData ? (state.initialData.is_bus_trip === 'on' || state.initialData.is_bus_trip === 'true' || state.initialData.is_bus_trip === true) : !!editingTrip?.is_bus_trip} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--beheer-border)]/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] font-black uppercase tracking-widest text-[10px] transition-colors"
                    >
                        Annuleren
                    </button>
                    <button
                        type="submit"
                        disabled={pending}
                        className="px-8 py-3 bg-[var(--beheer-accent)] hover:opacity-95 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Opslaan</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
