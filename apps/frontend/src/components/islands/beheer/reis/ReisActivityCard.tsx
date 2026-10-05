'use client';

import React from 'react';
import { 
    Users, 
    Pen, 
    Trash, 
    LayoutGrid 
} from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';

import { type TripActivity } from '@salvemundi/validations/schema/beheer-trip.zod';
import { parseActivityOptions } from '@/lib/reis';

interface Props {
    activity: TripActivity;
    onEdit: (activity: TripActivity) => void;
    onDelete: (id: number) => void;
    onViewSignups: (id: number) => void;
}

export default function ReisActivityCard({ activity, onEdit, onDelete, onViewSignups }: Props) {
    const options = parseActivityOptions(activity.options);

    return (
        <div className="group overflow-hidden card-base p-0">
            {/* Visual Header */}
            {activity.image ? (
                <div className="relative h-48 bg-beheer-card-soft">
                    <MediaAsset asset={activity.image || undefined} alt={activity.name || undefined} fill className="object-cover" />
                    <div className="badge absolute top-4 right-4">
                        {activity.is_active ? 'Actief' : 'Inactief'}
                    </div>
                </div>
            ) : (
                <div className="flex-center h-24 bg-beheer-card-soft">
                    <LayoutGrid className="size-8 text-beheer-text-muted/20" />
                </div>
            )}

            <div className="flex flex-col p-6">
                <div className="mb-2 flex-between">
                    <h3 className="line-clamp-1 text-lg font-semibold text-beheer-text">
                        {activity.name}
                    </h3>
                </div>
                
                {activity.description && (
                    <p className="my-3 line-clamp-4 text-xs text-beheer-text-muted">
                        {activity.description}
                    </p>
                )}

                <div className="mt-auto flex-between border-t pt-4">
                    <div className="flex flex-col">
                        <span className="text-2xs font-semibold text-beheer-text-muted">Basisprijs</span>
                        <span className="text-xl font-semibold text-beheer-accent">€{Number(activity.price || 0).toFixed(2)}</span>
                    </div>
                    {activity.max_participants && (
                        <div className="flex flex-col items-end">
                            <span className="text-2xs font-semibold text-beheer-text-muted">Capaciteit</span>
                            <span className="badge flex gap-1.5"><Users className="size-3" /> {activity.max_participants}</span>
                        </div>
                    )}
                </div>

                {options.length > 0 && (
                    <div className="card-soft mb-4 p-3">
                        <span className="mb-1 text-2xs font-semibold text-beheer-text-muted/60">{activity.max_selections === 1 ? 'Keuze verplicht' : 'Extra opties'} ({options.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                            {options.slice(0, 2).map((o, i) => (
                                <span key={i} className="badge">
                                    {o.name || 'Naamloos'}
                                </span>
                            ))}
                            {options.length > 2 && (
                                <span className="text-2xs font-semibold text-beheer-text-muted/50">+{options.length - 2}</span>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2 border-t border-beheer-border/20 pt-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(activity)}
                            className="beheer-button-secondary flex-1"
                            type="button">
                            <Pen className="size-3.5" /> Bewerken
                        </button>
                        <button
                            onClick={() => onDelete(activity.id as number)}
                            className="icon-button beheer-button-secondary text-beheer-text-muted"
                            type="button">
                            <Trash className="size-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => onViewSignups(activity.id as number)}
                        className="beheer-button-secondary h-10 w-full"
                        type="button">
                        <Users className="size-3.5" /> Inschrijvingen
                    </button>
                </div>
            </div>
        </div>
    );
}


