'use client';

import React, { useState } from 'react';
import { 
    Plus, 
    Save, 
    X, 
    Loader2, 
    Euro, 
    List, 
    Trash2 
} from 'lucide-react';
import { Field, inputClass } from './TripTabComponents';

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

interface Props {
    activity: Partial<TripActivity> | null;
    onSave: (formData: FormData, options: any[]) => Promise<void>;
    onCancel: () => void;
    pending: boolean;
}

export default function TripActivityForm({ activity, onSave, onCancel, pending }: Props) {
    const [options, setOptions] = useState<{ name: string; price: number }[]>(activity?.options || []);

    const addOption = () => setOptions([...options, { name: '', price: 0 }]);
    const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
    const updateOption = (idx: number, field: 'name' | 'price', value: any) => {
        const newOpts = [...options];
        newOpts[idx] = { ...newOpts[idx], [field]: field === 'price' ? parseFloat(value) || 0 : value };
        setOptions(newOpts);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave(formData, options);
    };

    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 mb-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-[var(--beheer-accent)]/10 rounded-xl text-[var(--beheer-accent)]">
                        {activity?.id ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    {activity?.id ? 'Activiteit Bewerken' : 'Nieuwe Reisactiviteit'}
                </h2>
                <button onClick={onCancel} className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Field label="Naam *">
                            <input type="text" name="name" defaultValue={activity?.name || ''} required className={inputClass} placeholder="Bijv. Skiën in de middag" />
                        </Field>
                        <Field label="Beschrijving">
                            <textarea name="description" rows={4} defaultValue={activity?.description || ''} className={inputClass} placeholder="Wat houdt deze activiteit in?" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Basisprijs (€) *">
                            <div className="relative">
                                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] opacity-40" />
                                <input type="number" step="0.01" name="price" defaultValue={activity?.price || 0} required className={`${inputClass} pl-12`} />
                            </div>
                        </Field>
                        <Field label="Max Deelnemers">
                            <input type="number" name="max_participants" defaultValue={activity?.max_participants || ''} placeholder="Onbeperkt" className={inputClass} />
                        </Field>
                        <Field label="Weergave Volgorde">
                            <input type="number" name="display_order" defaultValue={activity?.display_order || 0} className={inputClass} />
                        </Field>
                        <div className="flex items-end pb-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="is_active" className="sr-only peer" defaultChecked={activity?.is_active ?? true} />
                                <div className="w-11 h-6 bg-[var(--beheer-card-soft)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--beheer-accent)]"></div>
                                <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Zichtbaar</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Options Management */}
                <div className="bg-[var(--beheer-card-soft)]/30 rounded-[var(--beheer-radius)] p-8 border border-[var(--beheer-border)]/50 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-widest flex items-center gap-2">
                            <List className="h-4 w-4 text-[var(--beheer-accent)]" /> Sub-opties Configuratie
                        </h3>
                        <button type="button" onClick={addOption} className="text-[var(--beheer-accent)] font-black uppercase tracking-widest text-[10px] flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-[var(--beheer-accent)]/10 transition-all border border-transparent hover:border-[var(--beheer-accent)]/20">
                            <Plus className="h-3.5 w-3.5" /> Optie toevoegen
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-10 border-b border-[var(--beheer-border)]/50 pb-8">
                        <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="relative flex items-center h-5">
                                <input type="radio" name="max_selections" value="" defaultChecked={activity?.max_selections === null} className="w-5 h-5 text-[var(--beheer-accent)] peer focus:ring-0" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Checkbox Modus</span>
                                <span className="text-[9px] text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">Meerdere extra's selecteren</span>
                            </div>
                        </label>
                        <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="relative flex items-center h-5">
                                <input type="radio" name="max_selections" value="1" defaultChecked={activity?.max_selections === 1} className="w-5 h-5 text-[var(--beheer-accent)] peer focus:ring-0" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Radio Button Modus</span>
                                <span className="text-[9px] text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">Slechts één extra kiestbaar</span>
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
                                        placeholder="Bijv. Inclusief lunch..."
                                        className={`${inputClass} py-3 text-xs`}
                                    />
                                </div>
                                <div className="w-36 relative">
                                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--beheer-text-muted)] opacity-40" />
                                    <input
                                        type="number" step="0.01" value={opt.price}
                                        onChange={(e) => updateOption(idx, 'price', e.target.value)}
                                        className={`${inputClass} py-3 pl-9 text-xs`}
                                        placeholder="Extra"
                                    />
                                </div>
                                <button type="button" onClick={() => removeOption(idx)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="py-12 text-center border border-dashed border-[var(--beheer-border)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-40">
                                Geen extra opties geconfigureerd
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-6">
                    <button type="button" onClick={onCancel} className="px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-card-soft)] transition-all border border-transparent hover:border-[var(--beheer-border)]">Annuleren</button>
                    <button type="submit" disabled={pending} className="px-12 py-4 bg-[var(--beheer-accent)] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
                        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {activity?.id ? 'Wijzigingen Opslaan' : 'Activiteit Opslaan'}
                    </button>
                </div>
            </form>
        </div>
    );
}
