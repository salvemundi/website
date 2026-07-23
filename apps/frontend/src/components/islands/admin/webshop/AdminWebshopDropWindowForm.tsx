'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { type AdminDropWindow } from './webshop-admin-types';

interface Props {
    dropWindow?: AdminDropWindow | null;
    onSave: (formData: FormData) => void;
    onCancel: () => void;
    isPending: boolean;
    error: string | null;
}

function toLocalInputValue(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminWebshopDropWindowForm({ dropWindow, onSave, onCancel, isPending, error }: Props) {
    const [status, setStatus] = useState(dropWindow?.status || 'draft');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (dropWindow) fd.set('id', String(dropWindow.id));
        fd.set('status', status);
        onSave(fd);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-2xl text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <label className="text-xs font-semibold text-(--beheer-text-muted)">Naam *</label>
                <input
                    type="text"
                    name="name"
                    required
                    defaultValue={dropWindow?.name || ''}
                    placeholder="Bijv. Voorjaarsdrop 2026"
                    className="beheer-input w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold"
                />
            </div>

            <div className="space-y-3">
                <label className="text-xs font-semibold text-(--beheer-text-muted)">Status</label>
                <div className="grid grid-cols-3 bg-(--beheer-card-soft) p-1 rounded-xl border border-(--beheer-border)">
                    {(['draft', 'open', 'closed'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setStatus(value)}
                            className={`beheer-button flex-1 w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize text-center ${
                                status === value 
                                    ? 'bg-(--beheer-accent) text-white shadow-md' 
                                    : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'
                            }`}
                        >
                            {value === 'draft' ? 'Concept' : value === 'open' ? 'Open' : 'Gesloten'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Opent op</label>
                    <input
                        type="datetime-local"
                        name="opens_at"
                        defaultValue={toLocalInputValue(dropWindow?.opens_at || null)}
                        className="beheer-input w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Sluit op *</label>
                    <input
                        type="datetime-local"
                        name="closes_at"
                        required
                        defaultValue={toLocalInputValue(dropWindow?.closes_at || null)}
                        className="beheer-input w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-(--beheer-border)">
                <button type="button" onClick={onCancel} className="beheer-button px-8 py-4 rounded-xl font-semibold text-sm border border-(--beheer-border) text-(--beheer-text) hover:bg-(--beheer-card-soft) transition-all cursor-pointer">
                    Annuleren
                </button>
                <button type="submit" disabled={isPending} className="beheer-button flex items-center justify-center gap-3 px-10 py-4 bg-(--beheer-accent) text-white font-semibold text-sm rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>{isPending ? 'Bezig...' : dropWindow ? 'Opslaan' : 'Drop Aanmaken'}</span>
                </button>
            </div>
        </form>
    );
}