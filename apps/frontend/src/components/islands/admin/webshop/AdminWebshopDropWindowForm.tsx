'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { type AdminDropWindow } from './webshop-admin-types';
import { toLocalInputValue } from '@/shared/lib/utils/date';

interface Props {
    dropWindow?: AdminDropWindow | null;
    onSave: (formData: FormData) => void;
    onCancel: () => void;
    isPending: boolean;
    error: string | null;
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
                <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-xs font-semibold text-red-500">
                    <AlertCircle className="size-4 shrink-0" />
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
                    className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
                />
            </div>

            <div className="space-y-3">
                <label className="text-xs font-semibold text-(--beheer-text-muted)">Status</label>
                <div className="grid grid-cols-3 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) p-1">
                    {(['draft', 'open', 'closed'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setStatus(value)}
                            className={`beheer-button w-full flex-1 cursor-pointer rounded-lg px-4 py-2.5 text-center text-xs font-semibold capitalize transition-all ${
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Opent op</label>
                    <input
                        type="datetime-local"
                        name="opens_at"
                        defaultValue={toLocalInputValue(dropWindow?.opens_at || null)}
                        className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Sluit op *</label>
                    <input
                        type="datetime-local"
                        name="closes_at"
                        required
                        defaultValue={toLocalInputValue(dropWindow?.closes_at || null)}
                        className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
                    />
                </div>
            </div>

            <div className="flex flex-col justify-end gap-4 border-t border-(--beheer-border) pt-6 sm:flex-row">
                <button type="button" onClick={onCancel} className="beheer-button cursor-pointer rounded-xl border border-(--beheer-border) px-8 py-4 text-sm font-semibold text-(--beheer-text) transition-all hover:bg-(--beheer-card-soft)">
                    Annuleren
                </button>
                <button type="submit" disabled={isPending} className="beheer-button flex cursor-pointer items-center justify-center gap-3 rounded-xl bg-(--beheer-accent) px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50">
                    {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                    <span>{isPending ? 'Bezig...' : dropWindow ? 'Opslaan' : 'Drop Aanmaken'}</span>
                </button>
            </div>
        </form>
    );
}