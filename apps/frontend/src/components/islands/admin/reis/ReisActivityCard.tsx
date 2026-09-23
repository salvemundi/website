'use client';

import React from 'react';
import { 
    Users, 
    Pen, 
    Trash, 
    LayoutGrid 
} from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';

import { type TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';

interface Props {
    activity: TripActivity;
    onEdit: (activity: TripActivity) => void;
    onDelete: (id: number) => void;
    onViewSignups: (id: number) => void;
}

export default function ReisActivityCard({ activity, onEdit, onDelete, onViewSignups }: Props) {
    return (
        <div className="group flex flex-col overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-sm transition-all duration-500 hover:border-(--beheer-accent)/30 hover:shadow-xl">
            {/* Visual Header */}
            {activity.image ? (
                <div className="relative h-48 overflow-hidden bg-slate-900">
                    <MediaAsset asset={activity.image} alt={activity.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className={`absolute top-4 right-4 rounded-full px-3 py-1 text-[9px] font-semibold tracking-widest shadow-lg ${activity.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {activity.is_active ? 'Actief' : 'Inactief'}
                    </div>
                </div>
            ) : (
                <div className="flex h-24 items-center justify-center border-b border-(--beheer-border) bg-(--beheer-card-soft)/50">
                    <LayoutGrid className="size-8 text-(--beheer-text-muted) opacity-20" />
                </div>
            )}

            <div className="flex flex-1 flex-col p-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="line-clamp-1 text-lg font-semibold tracking-tight text-(--beheer-text) transition-colors group-hover:text-(--beheer-accent)">{activity.name}</h3>
                    <span className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-40">#{activity.display_order}</span>
                </div>
                
                {activity.description && (
                    <p className="mt-1 mb-6 line-clamp-2 min-h-10 text-xs leading-relaxed font-medium text-(--beheer-text-muted)">{activity.description}</p>
                )}

                <div className="mt-auto mb-8 flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="mb-1 text-[9px] font-semibold text-(--beheer-text-muted) opacity-60">Basisprijs</span>
                        <span className="text-2xl font-semibold text-(--beheer-accent)">€{Number(activity.price || 0).toFixed(2)}</span>
                    </div>
                    {activity.max_participants && (
                        <div className="flex flex-col items-end">
                            <span className="mb-1 text-[9px] font-semibold text-(--beheer-text-muted) opacity-60">Capaciteit</span>
                            <span className="flex items-center gap-1.5 rounded-lg border border-(--beheer-border)/50 bg-(--beheer-card-soft) px-2 py-1 text-xs font-semibold text-(--beheer-text)"><Users className="size-3" /> {activity.max_participants}</span>
                        </div>
                    )}
                </div>

                {activity.options && activity.options.length > 0 && (
                    <div className="mb-8 rounded-2xl border border-(--beheer-border)/30 bg-(--beheer-card-soft)/50 p-4">
                        <span className="mb-2 block text-[9px] font-semibold text-(--beheer-text-muted) opacity-60">{activity.max_selections === 1 ? 'Keuze verplicht' : 'Extra opties'} ({activity.options.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                            {activity.options.slice(0, 2).map((o, i) => (
                                <span key={i} className="rounded-lg border border-(--beheer-border) bg-(--beheer-card-bg) px-2 py-1 text-[9px] font-semibold tracking-tight text-(--beheer-text-muted)">
                                    {o.name || 'Naamloos'}
                                </span>
                            ))}
                            {activity.options.length > 2 && (
                                <span className="px-2 py-1 text-[9px] font-semibold text-(--beheer-text-muted) opacity-50">+{activity.options.length - 2}</span>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-3 border-t border-(--beheer-border)/20 pt-6">
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onEdit(activity)}
                            className="beheer-button flex flex-1 items-center justify-center gap-2 rounded-xl border border-(--beheer-border) px-4 py-3 text-[10px] font-semibold text-(--beheer-text) transition-all hover:border-(--beheer-accent) hover:bg-(--beheer-accent)/5 hover:text-(--beheer-accent) active:scale-95"
                        >
                            <Pen className="size-3.5" /> Bewerken
                        </button>
                        <button 
                            onClick={() => onDelete(activity.id as number)}
                            className="icon-button flex items-center justify-center rounded-xl border border-(--beheer-border) p-3 text-(--beheer-text-muted) transition-all hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-500 active:scale-95"
                        >
                            <Trash className="size-4" />
                        </button>
                    </div>
                    <button 
                        onClick={() => onViewSignups(activity.id as number)}
                        className="beheer-button flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-(--beheer-accent)/10 bg-(--beheer-accent)/5 text-[10px] font-semibold text-(--beheer-accent) transition-all hover:bg-(--beheer-accent)/10 active:scale-95"
                    >
                        <Users className="size-3.5" /> Inschrijvingen
                    </button>
                </div>
            </div>
        </div>
    );
}


