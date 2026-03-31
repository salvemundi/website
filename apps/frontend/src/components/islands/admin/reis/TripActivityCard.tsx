'use client';

import React from 'react';
import { 
    Users, 
    Edit2, 
    Trash2, 
    Euro, 
    LayoutGrid 
} from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';

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
    activity: TripActivity;
    onEdit: (activity: TripActivity) => void;
    onDelete: (id: number) => void;
    onViewSignups: (id: number) => void;
}

export default function TripActivityCard({ activity, onEdit, onDelete, onViewSignups }: Props) {
    return (
        <div className="group bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--beheer-accent)]/30 transition-all duration-500 flex flex-col">
            {/* Visual Header */}
            {activity.image ? (
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img src={getImageUrl(activity.image, { width: 400, height: 200, fit: 'cover' }) || ''} alt={activity.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${activity.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {activity.is_active ? 'Actief' : 'Inactief'}
                    </div>
                </div>
            ) : (
                <div className="h-20 bg-[var(--beheer-card-soft)]/50 flex items-center justify-center border-b border-[var(--beheer-border)]">
                    <LayoutGrid className="h-8 w-8 text-[var(--beheer-text-muted)] opacity-20" />
                </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-tight line-clamp-1 group-hover:text-[var(--beheer-accent)] transition-colors">{activity.name}</h3>
                    <span className="text-[10px] font-black text-[var(--beheer-text-muted)] opacity-40">#{activity.display_order}</span>
                </div>
                
                {activity.description && (
                    <p className="text-xs text-[var(--beheer-text-muted)] mt-1 mb-6 line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed">{activity.description}</p>
                )}

                <div className="flex justify-between items-end mt-auto mb-8">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-1 opacity-60">Basisprijs</span>
                        <span className="text-2xl font-black text-[var(--beheer-accent)]">€{Number(activity.price || 0).toFixed(2)}</span>
                    </div>
                    {activity.max_participants && (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-1 opacity-60">Capaciteit</span>
                            <span className="text-xs font-black text-[var(--beheer-text)] flex items-center gap-1.5 bg-[var(--beheer-card-soft)] px-2 py-1 rounded-lg"><Users className="h-3 w-3" /> {activity.max_participants}</span>
                        </div>
                    )}
                </div>

                {activity.options && activity.options.length > 0 && (
                    <div className="mb-8 p-4 bg-[var(--beheer-card-soft)]/50 rounded-xl border border-[var(--beheer-border)]/50">
                        <span className="text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest block mb-2 opacity-60">{activity.max_selections === 1 ? 'Eén optie verplicht' : 'Extra opties'} ({activity.options.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                            {activity.options.slice(0, 2).map((o, i) => (
                                <span key={i} className="text-[9px] font-black px-2 py-1 bg-[var(--beheer-card-bg)] rounded-md border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] uppercase tracking-tighter">
                                    {o.name}
                                </span>
                            ))}
                            {activity.options.length > 2 && (
                                <span className="text-[9px] font-black px-2 py-1 text-[var(--beheer-text-muted)] opacity-50">+{activity.options.length - 2}</span>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2 pt-4 border-t border-[var(--beheer-border)]/30">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onEdit(activity)}
                            className="flex-1 px-4 py-3 rounded-xl border border-[var(--beheer-border)] font-black text-[10px] uppercase tracking-widest text-[var(--beheer-text)] hover:border-[var(--beheer-accent)] hover:text-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all flex items-center justify-center gap-2"
                        >
                            <Edit2 className="h-3.5 w-3.5" /> Bewerken
                        </button>
                        <button 
                            onClick={() => onDelete(activity.id)}
                            className="p-3 rounded-xl border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/5 transition-all flex items-center justify-center"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <button 
                        onClick={() => onViewSignups(activity.id)}
                        className="w-full h-11 bg-[var(--beheer-accent)]/5 hover:bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-[var(--beheer-accent)]/10"
                    >
                        <Users className="h-3.5 w-3.5" /> Inschrijvingen
                    </button>
                </div>
            </div>
        </div>
    );
}
