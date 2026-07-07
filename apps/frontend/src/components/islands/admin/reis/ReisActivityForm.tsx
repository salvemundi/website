'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Save,
    X,
    Loader2,
    Euro,
    List,
    Trash
} from 'lucide-react';
import { Field, inputClass } from './ReisTabComponents';
import { type ActivityOption } from '@/lib/reis';

import { type TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';


interface Props {
    activity: Partial<TripActivity> | null;
    onSave: (formData: FormData, options: ActivityOption[]) => Promise<void>;
    onCancel: () => void;
    pending: boolean;
}

export default function ReisActivityForm({ activity, onSave, onCancel, pending }: Props) {
    // Map existing options, handling nulls from the schema type
    const initialOptions = (activity?.options || []).map(opt => ({
        id: opt.id || '',
        name: opt.name || '',
        price: opt.price || 0
    }));
    const [options, setOptions] = useState<ActivityOption[]>(initialOptions);

    // Sync options if activity prop changes (e.g. after failed submission with initialData)
    useEffect(() => {
        if (activity?.options) {
            setOptions((activity.options as ActivityOption[]).map((opt) => ({
                id: opt.id || '',
                name: opt.name || '',
                price: opt.price || 0
            })));
        }
    }, [activity?.options]);

    const addOption = () => setOptions([...options, { id: `opt-${options.length}`, name: '', price: 0 }]);
    const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
    const updateOption = (idx: number, field: keyof ActivityOption, value: string) => {
        setOptions(options.map((opt, i) =>
            i === idx ? { ...opt, [field]: field === 'price' ? parseFloat(value) || 0 : value } : opt
        ));
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        void onSave(formData, options);
    };

    return (
        <div className="bg-(--beheer-card-bg) rounded-3xl border border-(--beheer-border) p-8 mb-10 shadow-2xl overflow-hidden relative group/form">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-(--beheer-accent)/5 rounded-full blur-3xl group-hover/form:bg-(--beheer-accent)/10 transition-colors duration-700" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-semibold text-(--beheer-text) tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-(--beheer-accent)/10 rounded-xl text-(--beheer-accent) shadow-sm">
                        {activity?.id ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    {activity?.id ? 'Bewerken' : 'Nieuwe Activiteit'}
                </h2>
                <button onClick={onCancel} className="p-3 bg-(--beheer-card-soft) hover:bg-(--beheer-card-soft)/80 text-(--beheer-text-muted) hover:text-(--beheer-text) transition-all rounded-xl active:scale-90"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                {activity?.id && <input type="hidden" name="id" value={activity.id} />}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-7 space-y-6">
                        <Field label="Naam *">
                            <input type="text" name="name" defaultValue={activity?.name || ''} required className={inputClass} placeholder="Bijv. Skiën" />
                        </Field>
                        <Field label="Beschrijving">
                            <textarea name="description" rows={5} defaultValue={activity?.description || ''} className={`${inputClass} resize-none`} placeholder="Wat houdt deze activiteit precies in?" />
                        </Field>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <Field label="Basisprijs (€) *">
                                <div className="relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-(--beheer-text-muted) opacity-40" />
                                    <input type="number" step="0.01" name="price" defaultValue={activity?.price || 0} required className={`${inputClass} pl-12`} />
                                </div>
                            </Field>
                        </div>
                        <Field label="Max Reizigers">
                            <input type="number" name="max_participants" defaultValue={activity?.max_participants || ''} placeholder="Onbeperkt" className={inputClass} />
                        </Field>
                        <Field label="Sorteer Volgorde">
                            <input type="number" name="display_order" defaultValue={activity?.display_order || 0} className={inputClass} />
                        </Field>
                        <div className="col-span-2 flex items-center pt-2">
                            <label className="flex items-center gap-4 cursor-pointer group select-none bg-(--beheer-card-soft)/50 px-6 py-4 rounded-2xl border border-(--beheer-border)/20 hover:border-(--beheer-accent)/30 transition-all">
                                <div className="relative">
                                    <input type="checkbox" name="is_active" className="sr-only peer" defaultChecked={activity?.is_active ?? true} />
                                    <div className="h-6 w-11 bg-(--beheer-border)/20 dark:bg-white/5 backdrop-blur-md rounded-full peer-checked:bg-(--beheer-accent) transition-all border border-(--beheer-border)/30 shadow-inner" />
                                    <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-all peer-checked:left-6 shadow-lg transform peer-active:scale-90" />
                                </div>
                                <span className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-70 group-hover:text-(--beheer-text) transition-colors">Activiteit is zichtbaar</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Options Management */}
                <div className="bg-(--beheer-card-soft)/30 rounded-3xl p-8 border border-(--beheer-border)/30 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-(--beheer-text) flex items-center gap-3">
                                <List className="h-4 w-4 text-(--beheer-accent)" /> Sub-opties
                            </h3>
                            <p className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-60">Optionele keuzes voor deze activiteit</p>
                        </div>
                        <button type="button" onClick={addOption} className="text-(--beheer-accent) font-semibold text-[10px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-(--beheer-accent)/5 hover:bg-(--beheer-accent)/10 transition-all border border-(--beheer-accent)/20 active:scale-95">
                            <Plus className="h-4 w-4" /> Optie toevoegen
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-8 bg-(--beheer-card-bg)/50 p-6 rounded-2xl border border-(--beheer-border)/10 shadow-inner">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="relative flex items-center h-5">
                                <input type="radio" name="max_selections" value="" defaultChecked={activity?.max_selections === null} className="sr-only peer" />
                                <div className="h-5 w-5 rounded-lg border-2 border-(--beheer-border)/50 peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent) transition-all flex items-center justify-center shadow-sm">
                                    <div className="h-2 w-2 bg-white rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-accent) transition-colors">Checkbox (Meerdere)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="relative flex items-center h-5">
                                <input type="radio" name="max_selections" value="1" defaultChecked={activity?.max_selections === 1} className="sr-only peer" />
                                <div className="h-5 w-5 rounded-full border-2 border-(--beheer-border)/50 peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent) transition-all flex items-center justify-center shadow-sm">
                                    <div className="h-2 w-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-accent) transition-colors">Radio (Eén keuze)</span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <input
                                        type="text" value={opt.name || ''}
                                        onChange={(e) => updateOption(idx, 'name', e.target.value)}
                                        placeholder="Bijv. Inclusief lunch..."
                                        className={`${inputClass} py-4 text-xs`}
                                    />
                                </div>
                                <div className="w-40 relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-(--beheer-text-muted) opacity-40" />
                                    <input
                                        type="number" step="0.01" value={opt.price || 0}
                                        onChange={(e) => updateOption(idx, 'price', e.target.value)}
                                        className={`${inputClass} py-4 pl-12 text-xs`}
                                        placeholder="Meerprijs"
                                    />
                                </div>
                                <button type="button" onClick={() => removeOption(idx)} className="p-4 text-(--beheer-inactive) hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all active:scale-90 bg-(--beheer-card-soft)">
                                    <Trash className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="py-16 text-center bg-(--beheer-card-bg)/20 border border-dashed border-(--beheer-border)/30 rounded-2xl text-[10px] font-semibold text-(--beheer-text-muted) opacity-40">
                                Geen sub-opties geconfigureerd voor deze activiteit
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-4 pt-4 border-t border-(--beheer-border)/10">
                    <button type="button" onClick={onCancel} className="px-8 py-4 rounded-xl font-semibold text-[10px] text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) transition-all border border-transparent hover:border-(--beheer-border) active:scale-95">Annuleren</button>
                    <button type="submit" disabled={pending} className="px-10 py-4 bg-(--beheer-accent) text-white rounded-xl font-semibold text-[10px] shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 border border-white/10">
                        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        <span>Opslaan</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
