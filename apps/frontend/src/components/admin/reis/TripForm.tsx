'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, X, Info, Calendar as CalendarIcon, MapPin, Users, Euro, Link as LinkIcon, Eye, Check } from 'lucide-react';
import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import TripFormSidebar from './TripFormSidebar';

interface ActionState {
    success: boolean;
    id?: number;
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
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [registrationOpen, setRegistrationOpen] = useState(false);
    const [allowFinalPayments, setAllowFinalPayments] = useState(false);
    const [isBusTrip, setIsBusTrip] = useState(false);

    useEffect(() => {
        if (editingTrip) {
            if (editingTrip.image) setImagePreview(getImageUrl(editingTrip.image, { width: 400, height: 200, fit: 'cover' }));
            setRegistrationOpen(!!editingTrip.registration_open);
            setAllowFinalPayments(!!editingTrip.allow_final_payments);
            setIsBusTrip(!!editingTrip.is_bus_trip);
        }
        
        if (state?.initialData) {
            const d = state.initialData;
            setRegistrationOpen(d.registration_open === 'on' || d.registration_open === 'true' || d.registration_open === true);
            setAllowFinalPayments(d.allow_final_payments === 'on' || d.allow_final_payments === 'true' || d.allow_final_payments === true);
            setIsBusTrip(d.is_bus_trip === 'on' || d.is_bus_trip === 'true' || d.is_bus_trip === true);
        }
    }, [editingTrip, state]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
    };

    const formErrors = state?.fieldErrors || {};

    return (
        <div className="mb-12 animate-in slide-in-from-bottom-8 duration-500">
            <form action={editingTrip ? updateAction : createAction}>
                {editingTrip && <input type="hidden" name="id" value={editingTrip.id} />}
                {/* Hidden fields for controlled state toggles */}
                <input type="hidden" name="registration_open" value={registrationOpen ? 'on' : 'off'} />
                <input type="hidden" name="allow_final_payments" value={allowFinalPayments ? 'on' : 'off'} />
                <input type="hidden" name="is_bus_trip" value={isBusTrip ? 'on' : 'off'} />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Section 1: Algemene Informatie */}
                        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                <Info className="h-4 w-4 text-[var(--beheer-accent)]" />
                                <h2 className="text-[10px] font-semibold tracking-widest text-[var(--beheer-text)]">Algemene Informatie</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Naam van de reis *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        autoComplete="off"
                                        className={`beheer-input ${formErrors.name ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                                        placeholder="Bijv. Skiereis 2025"
                                        defaultValue={state?.initialData?.name || editingTrip?.name}
                                    />
                                    {formErrors.name && <p className="text-red-500 text-[10px] font-semibold tracking-widest mt-2">{formErrors.name[0]}</p>}
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Beschrijving</label>
                                    <textarea 
                                        id="description" 
                                        name="description" 
                                        rows={4} 
                                        className={`beheer-input ${formErrors.description ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} 
                                        placeholder="Wat gaan we beleven op deze reis?" 
                                        defaultValue={state?.initialData?.description || editingTrip?.description || ''} 
                                    />
                                    {formErrors.description && <p className="text-red-500 text-[10px] font-semibold tracking-widest mt-2">{formErrors.description[0]}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Planning & Capaciteit */}
                        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                <CalendarIcon className="h-4 w-4 text-[var(--beheer-accent)]" />
                                <h2 className="text-[10px] font-semibold tracking-widest text-[var(--beheer-text)]">Planning & Capaciteit</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="start_date" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Startdatum *</label>
                                        <input type="date" id="start_date" name="start_date" className={`beheer-input ${formErrors.start_date ? 'border-red-500' : ''}`} defaultValue={state?.initialData?.start_date || editingTrip?.start_date?.split('T')[0]} />
                                        {formErrors.start_date && <p className="text-red-500 text-[10px] font-semibold tracking-widest mt-2">{formErrors.start_date[0]}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="end_date" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Einddatum</label>
                                        <input type="date" id="end_date" name="end_date" className="beheer-input" defaultValue={state?.initialData?.end_date || editingTrip?.end_date?.split('T')[0]} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--beheer-border)]/30">
                                    <div>
                                        <label htmlFor="max_participants" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Max. Deelnemers *</label>
                                        <input type="number" id="max_participants" name="max_participants" min="0" className={`beheer-input ${formErrors.max_participants ? 'border-red-500' : ''}`} placeholder="Bijv. 50" defaultValue={state?.initialData?.max_participants || editingTrip?.max_participants} />
                                        {formErrors.max_participants && <p className="text-red-500 text-[10px] font-semibold tracking-widest mt-2">{formErrors.max_participants[0]}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="registration_start_date" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Auto-open Datum</label>
                                        <input 
                                            type="datetime-local" 
                                            id="registration_start_date" 
                                            name="registration_start_date" 
                                            className="beheer-input" 
                                            defaultValue={state?.initialData?.registration_start_date || (editingTrip?.registration_start_date ? new Date(editingTrip.registration_start_date).toISOString().slice(0, 16) : '')} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financiën */}
                        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                <Euro className="h-4 w-4 text-[var(--beheer-accent)]" />
                                <h2 className="text-[10px] font-semibold tracking-widest text-[var(--beheer-text)]">Financiën</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="base_price" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Totale Prijs (€) *</label>
                                        <input type="number" id="base_price" name="base_price" step="0.01" min="0" className={`beheer-input ${formErrors.base_price ? 'border-red-500' : ''}`} placeholder="0.00" defaultValue={state?.initialData?.base_price || editingTrip?.base_price} />
                                        {formErrors.base_price && <p className="text-red-500 text-[10px] font-semibold tracking-widest mt-2">{formErrors.base_price[0]}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="deposit_amount" className="block text-[10px] font-semibold text-[var(--beheer-text-muted)] tracking-widest mb-2">Aanbetaling (€) *</label>
                                        <input type="number" id="deposit_amount" name="deposit_amount" step="0.01" min="0" className={`beheer-input ${formErrors.deposit_amount ? 'border-red-500' : ''}`} placeholder="0.00" defaultValue={state?.initialData?.deposit_amount || editingTrip?.deposit_amount} />
                                        {formErrors.deposit_amount && <p className="text-red-500 text-[10px] font-semibold tracking-widest mt-2">{formErrors.deposit_amount[0]}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <TripFormSidebar 
                        isAdding={isAdding}
                        pending={pending}
                        imagePreview={imagePreview}
                        onImageChange={handleImageChange}
                        onRemoveImage={handleRemoveImage}
                        onCancel={onCancel}
                        registrationOpen={registrationOpen}
                        setRegistrationOpen={setRegistrationOpen}
                        allowFinalPayments={allowFinalPayments}
                        setAllowFinalPayments={setAllowFinalPayments}
                        isBusTrip={isBusTrip}
                        setIsBusTrip={setIsBusTrip}
                    />
                </div>
            </form>
        </div>
    );
}
