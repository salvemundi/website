'use client';

import { Pen, Trash, Calendar, Users, Euro, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';
import type { Trip } from '@salvemundi/validations/schema/admin-trip.zod';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

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
        <div className="group bg-(--bg-card) rounded-2xl shadow-(--shadow-card) ring-1 ring-(--border-color) overflow-hidden flex flex-col transition-all hover:translate-y-[-4px] hover:shadow-2xl">
            <div className="relative h-48 bg-(--beheer-border)/5 dark:bg-black/20 flex items-center justify-center overflow-hidden">                {(() => {
                const isOpen = trip.registration_open || (trip.registration_start_date && new Date(trip.registration_start_date) <= new Date());
                return (
                    <div className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl backdrop-blur-md font-black italic text-[10px] uppercase tracking-widest shadow-lg ${isOpen ? 'bg-(--beheer-active) text-white shadow-(--beheer-active)/20' : 'bg-(--beheer-inactive) text-white shadow-(--beheer-inactive)/20'
                        }`}>
                        {isOpen ? 'Open' : 'Gesloten'}
                    </div>
                );
            })()}
                {trip.is_bus_trip && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md font-black italic text-[10px] uppercase tracking-widest">
                        Busreis
                    </div>
                )}

                {trip.image ? (
                    (() => {
                        const imgUrl = getImageUrl(trip.image, { fit: 'contain' });
                        if (imgUrl) {
                            return (
                                <Image
                                    src={imgUrl}
                                    alt={trip.name || 'Trip'}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-contain transition-transform duration-700"
                                />
                            );
                        }

                        return <FallbackLogo className="object-contain p-8" />;
                    })()
                ) : (
                    <FallbackLogo className="object-contain p-8 opacity-40" />
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-(--beheer-text) tracking-tight mb-2 line-clamp-1 group-hover:text-(--beheer-accent) transition-colors">{trip.name}</h3>

                <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3 text-(--text-muted)">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold">{dateRange}</span>
                    </div>
                    <div className="flex items-center gap-3 text-(--text-muted)">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-bold">{trip.max_participants} plekken totaal</span>
                    </div>
                    <div className="flex items-center gap-3 text-(--beheer-accent)">
                        <Euro className="h-4 w-4" />
                        <span className="text-sm font-black italic">{formattedPrice}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-(--beheer-border)/50">
                    <button
                        onClick={onEdit}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-(--bg-main) hover:bg-(--beheer-border)/10 text-(--beheer-text) rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ring-1 ring-(--beheer-border)/50"
                    >
                        <Pen className="h-3.5 w-3.5" />
                        Bewerken
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-(--beheer-inactive)/5 hover:bg-(--beheer-inactive)/10 text-(--beheer-inactive) rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ring-1 ring-(--beheer-inactive)/20"
                    >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                        Wissen
                    </button>
                </div>
            </div>
        </div>
    );
}
