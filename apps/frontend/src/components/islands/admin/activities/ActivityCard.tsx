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
import { getImageUrl } from '@/lib/image-utils';

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
    isSuperAdmin?: boolean;
    isPending?: boolean;
    isSending?: boolean;
    onViewSignups?: (id: number) => void;
    onReminder?: (id: number, name: string) => void;
    onCustomNotify?: (event: AdminActivity) => void;
    onEdit?: (id: number) => void;
    onDelete?: (id: number, name: string) => void;
    isLoading?: boolean;
}

import { Skeleton } from '@/components/ui/Skeleton';

export default function ActivityCard({
    event,
    canEdit = false,
    isPending = false,
    isSending = false,
    onViewSignups = () => {},
    onReminder = () => {},
    onCustomNotify = () => {},
    onEdit = () => {},
    onDelete = () => {},
    isLoading = false
}: Props) {
    if (isLoading) {
        return (
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-lg p-5 sm:p-8 border border-[var(--beheer-border)] animate-pulse">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-6 mb-6">
                            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-[var(--radius-2xl)] shrink-0" />
                            <div className="flex-1 space-y-3 pt-1">
                                <Skeleton className="h-8 w-1/2" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-32 opacity-50" />
                                    <Skeleton className="h-4 w-40 opacity-30" />
                                </div>
                            </div>
                        </div>
                        <Skeleton className="h-4 w-3/4 mb-8 opacity-40" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-40 rounded-2xl" />
                            <Skeleton className="h-10 w-40 rounded-2xl" />
                        </div>
                    </div>
                    <div className="flex flex-row lg:flex-col gap-3 justify-end items-stretch lg:w-48 pt-6 lg:pt-0 border-t lg:border-t-0 border-[var(--beheer-border)]">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                        <div className="flex gap-3">
                            <Skeleton className="h-12 flex-1 rounded-2xl" />
                            <Skeleton className="h-12 flex-1 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
            className={`bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-lg p-5 sm:p-8 transition-all border border-[var(--beheer-border)] hover:shadow-2xl hover:scale-[1.01] hover:border-[var(--beheer-accent)]/30 group/card relative overflow-hidden ${isPast ? 'opacity-70 grayscale-[0.3]' : ''}`}
        >
            {/* Accent line for upcoming activities */}
            {!isPast && !isDraft && (
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--beheer-accent)] opacity-50" />
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Image & Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-6 mb-6">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex-shrink-0 group-hover/card:scale-105 transition-transform duration-700">
                            <div className="absolute inset-0 rounded-[var(--radius-2xl)] bg-[var(--beheer-accent)]/10 animate-pulse group-hover/card:animate-none opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            <Image
                                src={getImageUrl(event.image) || '/img/placeholder.svg'}
                                alt={event.name}
                                fill
                                className="object-cover rounded-[var(--radius-2xl)] shadow-xl border border-[var(--beheer-border)]"
                                sizes="(max-width: 768px) 96px, 128px"
                            />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h3 className="text-2xl sm:text-3xl font-black text-[var(--beheer-text)] truncate tracking-tight uppercase leading-tight">
                                    {event.name}
                                </h3>
                                <div className="flex gap-2">
                                    {isDraft && <span className="px-3 py-1 text-[8px] font-black bg-[var(--beheer-text-muted)]/10 text-[var(--beheer-text-muted)] border border-[var(--beheer-border)] rounded-full uppercase tracking-widest">Draft</span>}
                                    {isScheduled && <span className="px-3 py-1 text-[8px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full uppercase tracking-widest">Scheduled</span>}
                                    {isPast && <span className="px-3 py-1 text-[8px] font-black bg-[var(--beheer-border)] text-[var(--beheer-text-muted)] rounded-full uppercase tracking-widest">Verleden</span>}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[var(--beheer-text-muted)]">
                                <div className="flex items-center gap-2 group/info">
                                    <div className="p-1.5 rounded-lg bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] group-hover/info:scale-110 transition-transform">
                                        <Calendar className="h-3.5 w-3.5" />
                                    </div>
                                    <span>{formatDate(event.event_date)}</span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-2 group/info">
                                        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 group-hover/info:scale-110 transition-transform">
                                            <MapPin className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="truncate max-w-[200px] sm:max-w-none">{event.location}</span>
                                    </div>
                                )}
                                {event.contact && (
                                    <div className="flex items-center gap-2 group/info">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover/info:scale-110 transition-transform">
                                            <Mail className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="truncate max-w-[200px] sm:max-w-none">{event.contact}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {event.description && (
                        <p className="text-[var(--beheer-text-muted)] text-base mb-8 line-clamp-2 leading-relaxed font-medium">
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

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-3 justify-end items-stretch lg:w-48 pt-6 lg:pt-0 border-t lg:border-t-0 border-[var(--beheer-border)]">
                    <button
                        onClick={() => onViewSignups(event.id)}
                        className="flex-1 flex items-center justify-center gap-3 px-5 py-4 text-[10px] bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)] hover:text-white rounded-2xl transition-all font-black uppercase tracking-widest cursor-pointer active:scale-95 group/btn"
                    >
                        <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                        <span>Aanmeldingen</span>
                    </button>

                    {!isPast && !isDraft && (
                        <div className="flex flex-1 lg:flex-none gap-3">
                            <button
                                onClick={() => onReminder(event.id, event.name)}
                                disabled={isSending}
                                className="flex-1 flex items-center justify-center gap-2 p-4 text-[10px] bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl transition-all font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer active:scale-95 group/btn"
                                title="Stuur herinnering"
                            >
                                <Bell className="h-4 w-4 group-hover/btn:animate-bounce" />
                            </button>
                            <button
                                onClick={() => onCustomNotify(event)}
                                disabled={isSending}
                                className="flex-1 flex items-center justify-center gap-2 p-4 text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-2xl transition-all font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer active:scale-95 group/btn"
                                title="Stuur update"
                            >
                                <Send className="h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {canEdit && (
                        <div className="flex flex-1 lg:flex-none gap-3">
                            <button
                                onClick={() => onEdit(event.id)}
                                className="flex-1 flex items-center justify-center gap-2 p-4 text-[10px] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-border)] rounded-2xl transition-all font-black uppercase tracking-widest cursor-pointer active:scale-95 group/btn"
                            >
                                <Edit className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                            </button>
                            <button
                                onClick={() => onDelete(event.id, event.name)}
                                disabled={isPending}
                                className="flex-1 flex items-center justify-center gap-2 p-4 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer active:scale-95 group/btn"
                            >
                                <Trash2 className="h-4 w-4 group-hover/btn:scale-125 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
