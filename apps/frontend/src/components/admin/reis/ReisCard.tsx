'use client';

import { Pen, Trash, Calendar, Users, Euro, Loader2 } from 'lucide-react';
import type { Trip } from '@salvemundi/validations/schema/admin-trip.zod';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface ReisCardProps {
    trip: Trip;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}

export default function ReisCard({ trip, onEdit, onDelete, isDeleting }: ReisCardProps) {
    const sd = trip.start_date;
    const ed = trip.end_date;

    const dateRange = sd
        ? ed
            ? `${new Date(sd).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - ${new Date(ed).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : new Date(sd).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Onbekend';

    const formattedPrice = new Intl.NumberFormat('nl-NL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(trip.base_price || 0));

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl bg-(--bg-card) shadow-(--shadow-card) ring-1 ring-(--border-color) transition-all hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-(--beheer-border)/5 dark:bg-black/20">                {(() => {
                const isOpen = trip.registration_open || (trip.registration_start_date && new Date(trip.registration_start_date) <= new Date());
                return (
                    <div className={`absolute top-4 left-4 z-10 rounded-xl px-3 py-1.5 text-[10px] font-black tracking-widest uppercase italic shadow-lg backdrop-blur-md ${isOpen ? 'bg-(--beheer-active) text-white shadow-(--beheer-active)/20' : 'bg-(--beheer-inactive) text-white shadow-(--beheer-inactive)/20'
                        }`}>
                        {isOpen ? 'Open' : 'Gesloten'}
                    </div>
                );
            })()}
                {trip.is_bus_trip && (
                    <div className="absolute top-4 right-4 z-10 rounded-xl bg-blue-500 px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-lg shadow-blue-500/20 backdrop-blur-md">
                        Busreis
                    </div>
                )}

                {trip.image ? (
                    <MediaAsset
                        asset={trip.image}
                        alt={trip.name || 'Trip'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        objectFit="contain"
                    />
                ) : (
                    <FallbackLogo className="object-contain p-8 opacity-40" />
                )}
            </div>

            <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-2 line-clamp-1 text-xl font-black tracking-tight text-(--beheer-text) transition-colors group-hover:text-(--beheer-accent)">{trip.name}</h3>

                <div className="mb-6 flex-1 space-y-3">
                    <div className="flex items-center gap-3 text-(--text-muted)">
                        <Calendar className="size-4" />
                        <span className="text-xs font-bold">{dateRange}</span>
                    </div>
                    <div className="flex items-center gap-3 text-(--text-muted)">
                        <Users className="size-4" />
                        <span className="text-xs font-bold">{trip.max_participants} plekken totaal</span>
                    </div>
                    <div className="flex items-center gap-3 text-(--beheer-accent)">
                        <Euro className="size-4" />
                        <span className="text-sm font-black italic">{formattedPrice}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-(--beheer-border)/50 pt-4">
                    <button
                        onClick={onEdit}
                        className="beheer-button flex items-center justify-center gap-2 rounded-xl bg-(--bg-main) px-4 py-3 text-[10px] font-black tracking-widest text-(--beheer-text) uppercase ring-1 ring-(--beheer-border)/50 transition-all hover:bg-(--beheer-border)/10"
                    >
                        <Pen className="size-3.5" />
                        Bewerken
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="beheer-button flex items-center justify-center gap-2 rounded-xl bg-(--beheer-inactive)/5 px-4 py-3 text-[10px] font-black tracking-widest text-(--beheer-inactive) uppercase ring-1 ring-(--beheer-inactive)/20 transition-all hover:bg-(--beheer-inactive)/10"
                    >
                        {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash className="size-3.5" />}
                        Wissen
                    </button>
                </div>
            </div>
        </div>
    );
}
