'use client';

import React from 'react';
import Image from 'next/image';
import { 
    Calendar, 
    Users, 
    Edit, 
    Trash2, 
    Eye, 
    Bell, 
    Send, 
    MapPin, 
    Mail, 
    Euro, 
    Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getImageUrl } from '@/lib/utils/image-utils';

interface AdminActivity {
    id: number;
    name: string;
    event_date: string;
    description?: string | null;
    location?: string | null;
    max_sign_ups?: number | null;
    price_members?: number | null;
    price_non_members?: number | null;
    contact?: string | null;
    image?: any;
    status?: 'published' | 'draft' | 'archived' | 'scheduled' | null;
    publish_date?: string | null;
    signup_count?: number;
}

interface Props {
    event?: AdminActivity;
    canEdit?: boolean;
    isPending?: boolean;
    onViewSignups?: (id: number) => void;
    onEdit?: (id: number) => void;
}

export default function ActivityCard({
    event,
    canEdit = false,
    isPending = false,
    onViewSignups = () => {},
    onEdit = () => {},
}: Props) {
    if (!event) return null;
    const eventDate = new Date(event.event_date);
    const isPast = eventDate < new Date();
    const isDraft = event.status === 'draft';
    const isScheduled = event.status === 'published' && event.publish_date && new Date(event.publish_date) > new Date();

    const formatDate = (date: string) => {
        return format(new Date(date), 'dd MMMM yyyy', { locale: nl });
    };

    return (
        <div
            className={`flex flex-col md:flex-row bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-lg transition-all border border-[var(--beheer-border)] hover:shadow-2xl group/card relative overflow-hidden ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
            {/* Left: Image Banner */}
            <div className="relative w-full md:w-48 lg:w-56 min-h-[160px] md:min-h-full bg-[var(--beheer-card-soft)]/50 flex-shrink-0 border-r border-[var(--beheer-border)]">
                <div className="absolute inset-0 p-4">
                    <div className="relative w-full h-full">
                        <Image
                            src={getImageUrl(event.image) || '/img/placeholder.svg'}
                            alt={event.name}
                            fill
                            unoptimized
                            className="object-contain drop-shadow-md"
                        />
                    </div>
                </div>
            </div>

            {/* Middle: Main Info */}
            <div className="flex-1 px-6 py-4 sm:px-8 sm:py-5 min-w-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--beheer-text)] truncate tracking-tight uppercase leading-tight">
                        {event.name}
                    </h3>
                    <div className="flex gap-2">
                        {isDraft && <span className="px-3 py-1 text-[8px] font-black bg-[var(--beheer-text-muted)]/10 text-[var(--beheer-text-muted)] border border-[var(--beheer-border)] rounded-full uppercase tracking-widest">Draft</span>}
                        {isScheduled && <span className="px-3 py-1 text-[8px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full uppercase tracking-widest">Scheduled</span>}
                        {isPast && <span className="px-3 py-1 text-[8px] font-black bg-[var(--beheer-border)] text-[var(--beheer-text-muted)] rounded-full uppercase tracking-widest">Verleden</span>}
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[var(--beheer-text-muted)] mb-4 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                        <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>

                {event.description && (
                    <p className="text-[var(--beheer-text-muted)] text-sm mb-4 line-clamp-2 leading-relaxed font-medium">
                        {event.description}
                    </p>
                )}

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-3 bg-[var(--beheer-card-soft)]/50 border border-[var(--beheer-border)] px-5 py-2.5 rounded-2xl group/stats">
                        <div className="p-2 rounded-full bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] group-hover/stats:rotate-12 transition-transform">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-xl text-[var(--beheer-text)] leading-none">{event.signup_count || 0}</span>
                            {event.max_sign_ups && <span className="text-[var(--beheer-text-muted)] font-black text-sm">/ {event.max_sign_ups}</span>}
                            <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest ml-1">aanmeldingen</span>
                        </div>
                    </div>
                    {(event.price_members !== undefined || event.price_non_members !== undefined) && (
                        <div className="flex items-center gap-4 bg-[var(--beheer-card-soft)]/50 border border-[var(--beheer-border)] px-5 py-2.5 rounded-2xl group/price">
                            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 group-hover/price:scale-110 transition-transform">
                                <Euro className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-2 font-black text-[var(--beheer-text)] uppercase tracking-tighter">
                                {event.price_members === 0 && event.price_non_members === 0 ? (
                                    <span className="text-emerald-500">GRATIS</span>
                                ) : (
                                    <>
                                        <span>€{event.price_members || 0} Lid</span>
                                        <span className="text-[var(--beheer-border)]">|</span>
                                        <span className="text-[var(--beheer-text-muted)]">€{event.price_non_members || 0} Niet lid</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Original Actions Area */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center items-stretch md:w-64 p-6 border-t md:border-t-0 md:border-l border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/20">
                <button
                    onClick={() => onViewSignups(event.id)}
                    className="flex-1 flex items-center justify-center gap-4 px-6 py-5 text-[11px] bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)] hover:text-white rounded-2xl transition-all font-black tracking-widest cursor-pointer active:scale-95 group/btn"
                >
                    <Eye className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                    <span>Aanmeldingen</span>
                </button>

                {canEdit && (
                    <button
                        onClick={() => onEdit(event.id)}
                        className="flex-1 flex items-center justify-center gap-4 px-6 py-5 text-[11px] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-border)] rounded-2xl transition-all font-black tracking-widest cursor-pointer active:scale-95 group/btn"
                    >
                        <Edit className="h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
                        <span>Bewerken</span>
                    </button>
                )}
            </div>
        </div>
    );
}
