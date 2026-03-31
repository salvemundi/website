'use client';

import React, { useState } from 'react';
import { 
    Plus, 
    X, 
    Save, 
    Loader2, 
    Edit, 
    Trash2, 
    List, 
    LayoutGrid, 
    Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { IntroPlanningItem } from '@salvemundi/validations';
import { Field, inputClass } from './IntroTabComponents';

interface Props {
    planning: IntroPlanningItem[];
    onSave: (item: Partial<IntroPlanningItem>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
}

export default function IntroPlanningTab({ planning, onSave, onDelete, saving, deletingId }: Props) {
    const [editingPlanning, setEditingPlanning] = useState<Partial<IntroPlanningItem> | null>(null);
    const [view, setView] = useState<'calendar' | 'list'>('list');

    const handleSave = async () => {
        if (!editingPlanning) return;
        await onSave(editingPlanning);
        setEditingPlanning(null);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                {editingPlanning === null && (
                    <button onClick={() => setEditingPlanning({ date: '', time_start: '', title: '', description: '' })} className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95">
                        <Plus className="h-4 w-4" /> 
                        Nieuw Item
                        </button>
                )}
                <div className="flex gap-1 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-1.5 ml-auto shadow-sm">
                    <button onClick={() => setView('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-[var(--beheer-accent)] text-white shadow-md' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}>
                        <List className="h-4 w-4" /> Lijst
                    </button>
                    <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'calendar' ? 'bg-[var(--beheer-accent)] text-white shadow-md' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}>
                        <LayoutGrid className="h-4 w-4" /> Kalender
                    </button>
                </div>
            </div>

            {/* Planning Form */}
            {editingPlanning !== null && (
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--beheer-text-muted)]">
                            {editingPlanning.id ? 'Planning Bewerken' : 'Nieuw Planning Item'}
                        </h3>
                        <button onClick={() => setEditingPlanning(null)} className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Datum *">
                            <input type="date" value={editingPlanning.date || ''} onChange={e => setEditingPlanning({ ...editingPlanning, date: e.target.value })} className={inputClass} />
                        </Field>
                        <Field label="Starttijd *">
                            <input type="time" value={editingPlanning.time_start || ''} onChange={e => setEditingPlanning({ ...editingPlanning, time_start: e.target.value })} className={inputClass} />
                        </Field>
                        <Field label="Eindtijd">
                            <input type="time" value={editingPlanning.time_end || ''} onChange={e => setEditingPlanning({ ...editingPlanning, time_end: e.target.value })} className={inputClass} />
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Titel *">
                                <input type="text" value={editingPlanning.title || ''} onChange={e => setEditingPlanning({ ...editingPlanning, title: e.target.value })} className={inputClass} placeholder="Activiteit titel..." />
                            </Field>
                        </div>
                        <Field label="Locatie">
                            <input type="text" value={editingPlanning.location || ''} onChange={e => setEditingPlanning({ ...editingPlanning, location: e.target.value })} className={inputClass} placeholder="Bv. TU/e Gemini" />
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Beschrijving *">
                                <textarea value={editingPlanning.description || ''} onChange={e => setEditingPlanning({ ...editingPlanning, description: e.target.value })} rows={4} className={inputClass} placeholder="Wat gaan we doen?" />
                            </Field>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-10 border-t border-[var(--beheer-border)] mt-10">
                        <button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                            Opslaan
                        </button>
                        <button onClick={() => setEditingPlanning(null)} className="px-8 py-4 rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-card-soft)] border border-transparent hover:border-[var(--beheer-border)] transition-all">
                            Annuleren
                        </button>
                    </div>
                </div>
            )}

            {/* List view */}
            {view === 'list' && (
                <div className="grid gap-4">
                    {planning.map(item => (
                        <div key={item.id} className="group bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-6 flex items-start justify-between gap-6 hover:border-[var(--beheer-accent)]/30 transition-all shadow-sm hover:shadow-xl">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black text-[var(--beheer-accent)] uppercase tracking-widest bg-[var(--beheer-accent)]/5 px-2 py-0.5 rounded">{item.day || ''}</span>
                                    {item.date && <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{format(new Date(item.date), 'd MMM yyyy', { locale: nl })}</span>}
                                </div>
                                <h4 className="font-black uppercase tracking-tight text-base text-[var(--beheer-text)]">{item.title}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mt-1 opacity-70">
                                    {item.time_start}{item.time_end ? ` - ${item.time_end}` : ''}{item.location ? ` · ${item.location}` : ''}
                                </p>
                                {item.description && <p className="text-sm text-[var(--beheer-text-muted)] mt-4 font-medium leading-relaxed">{item.description}</p>}
                            </div>
                            <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingPlanning(item)} className="p-3 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/10 rounded-xl transition-all"><Edit className="h-4 w-4" /></button>
                                <button onClick={() => onDelete(item.id!)} disabled={deletingId === item.id} className="p-3 text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                    {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {planning.length === 0 && (
                        <div className="py-20 text-center text-[var(--beheer-text-muted)]">
                            <div className="p-6 bg-[var(--beheer-card-soft)] rounded-full w-fit mx-auto mb-6">
                                <Calendar className="h-12 w-12 opacity-20" />
                            </div>
                            <p className="font-black uppercase tracking-widest text-xs">Geen planning items aangemaakt</p>
                        </div>
                    )}
                </div>
            )}

            {/* Calendar view - day-based grid */}
            {view === 'calendar' && planning.length > 0 && (() => {
                const dayOrder = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
                const byDay = planning.reduce((acc, item) => {
                    const key = (item.day || 'overig').toLowerCase();
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                }, {} as Record<string, IntroPlanningItem[]>);
                const sorted = Object.keys(byDay).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sorted.map(day => (
                            <div key={day} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-6 shadow-sm">
                                <h3 className="font-black text-[var(--beheer-accent)] uppercase text-xs tracking-[0.2em] mb-6 capitalize pb-3 border-b border-[var(--beheer-border)]">{day}</h3>
                                <div className="space-y-3">
                                    {byDay[day].sort((a, b) => (a.time_start || '').localeCompare(b.time_start || '')).map(item => (
                                        <div key={item.id} className="group bg-[var(--beheer-card-soft)] rounded-xl p-4 border border-transparent hover:border-[var(--beheer-accent)]/20 transition-all">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-black uppercase tracking-tight text-sm text-[var(--beheer-text)] mb-1">{item.title}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-70">{item.time_start}{item.time_end ? ` - ${item.time_end}` : ''}</p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingPlanning(item)} className="p-1.5 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-colors"><Edit className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => onDelete(item.id!)} className="p-1.5 text-[var(--beheer-text-muted)] hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}
