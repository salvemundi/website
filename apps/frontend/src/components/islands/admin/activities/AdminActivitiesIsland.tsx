'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Users, Edit, Trash2, Eye, Plus, Search, Bell, Send, MapPin, Mail, Euro, X, Loader2 } from 'lucide-react';
import { deleteActivity, sendActivityReminder, sendActivityCustomNotification } from '@/server/actions/activiteiten.actions';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getImageUrl } from '@/lib/image-utils';
import { isSuperAdmin } from '@/lib/auth-utils';

interface AdminActivity {
    id: number;
    name: string;
    event_date: string;
    event_date_end?: string | null;
    description?: string | null;
    location?: string | null;
    max_sign_ups?: number | null;
    price_members?: number | null;
    price_non_members?: number | null;
    registration_deadline?: string | null;
    contact?: string | null;
    image?: { id: string } | string | null;
    committee_id?: number | null;
    status?: 'published' | 'draft' | 'archived' | 'scheduled' | null;
    publish_date?: string | null;
    signup_count?: number;
}

export default function AdminActivitiesIsland({
    initialEvents,
    userId,
    userCommittees = [],
    initialSearch = '',
    initialFilter = 'all'
}: {
    initialEvents: AdminActivity[],
    userId?: string,
    userCommittees?: any[],
    initialSearch?: string,
    initialFilter?: 'all' | 'upcoming' | 'past'
}) {
    const router = useRouter();
    const [events, setEvents] = useState(initialEvents);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>(initialFilter);
    const [pageSize, setPageSize] = useState<number | -1>(10);

    // Notification states
    const [showModal, setShowModal] = useState(false);
    const [customNotification, setCustomNotification] = useState({ title: '', body: '', eventId: 0 });
    const [isSending, setIsSending] = useState(false);

    const [isPending, startTransition] = useTransition();

    // URL Sync logic
    const updateUrl = (q: string, f: string) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (f && f !== 'all') params.set('filter', f);

        const queryString = params.toString();
        router.push(`/beheer/activiteiten${queryString ? `?${queryString}` : ''}`);
    };

    // Sync state with props when they change (e.g. from router.push)
    useEffect(() => {
        setEvents(initialEvents);
        setSearchQuery(initialSearch);
        setFilter(initialFilter);
    }, [initialEvents, initialSearch, initialFilter]);

    // Search debounce
    useEffect(() => {
        if (searchQuery === initialSearch) return;

        const timer = setTimeout(() => {
            updateUrl(searchQuery, filter);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleFilterChange = (newFilter: 'all' | 'upcoming' | 'past') => {
        if (newFilter === filter) return;
        setFilter(newFilter);
        updateUrl(searchQuery, newFilter);
    };

    const displayedEvents = pageSize === -1 ? events : events.slice(0, pageSize);

    const handleDelete = async (eventId: number, eventName: string) => {
        if (!confirm(`Weet je zeker dat je "${eventName}" wilt verwijderen?`)) return;
        startTransition(async () => {
            const res = await deleteActivity(eventId);
            if (res.success) {
                setEvents(prev => prev.filter(e => e.id !== eventId));
            } else {
                alert(res.error);
            }
        });
    };

    const handleReminder = async (eventId: number, eventName: string) => {
        if (!confirm(`Wil je een herinnering sturen naar alle deelnemers van "${eventName}"?`)) return;
        setIsSending(true);
        const res = await sendActivityReminder(eventId);
        setIsSending(false);
        if (res.success) alert(`Herinnering verstuurd naar ${res.sent} deelnemers!`);
        else alert(res.error);
    };

    const handleCustomNotify = async () => {
        setIsSending(true);
        const res = await sendActivityCustomNotification(
            customNotification.eventId,
            customNotification.title,
            customNotification.body
        );
        setIsSending(false);
        if (res.success) {
            alert(`Notificatie verstuurd naar ${res.sent} deelnemers!`);
            setShowModal(false);
        } else {
            alert(res.error);
        }
    };


    const formatDate = (date: string) => {
        return format(new Date(date), 'dd MMMM yyyy', { locale: nl });
    };

    // Global admin privileges
    const superAdmin = useMemo(() => isSuperAdmin(userCommittees), [userCommittees]);

    return (
        <div className="container mx-auto px-4 max-w-7xl">
            {/* Actions Bar */}
            <div className="mb-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                        <button
                            onClick={() => router.push('/beheer/activiteiten/nieuw')}
                            className="bg-[var(--beheer-accent)] text-white px-8 py-4 rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 cursor-pointer group"
                        >
                            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                            <span>Nieuwe Activiteit</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest sr-only sm:not-sr-only whitespace-nowrap">Toon</label>
                            <select
                                value={pageSize === -1 ? 'all' : pageSize}
                                onChange={(e) => setPageSize(e.target.value === 'all' ? -1 : parseInt(e.target.value, 10))}
                                className="rounded-full border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] text-xs px-5 py-2.5 outline-none cursor-pointer font-bold transition-all hover:border-[var(--beheer-accent)] focus:ring-2 focus:ring-[var(--beheer-accent)]/20"
                            >
                                <option value="10">10 items</option>
                                <option value="15">15 items</option>
                                <option value="all">Alles tonen</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 p-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full w-full sm:w-auto overflow-x-auto scrollbar-hide">
                        {['all', 'upcoming', 'past'].map(f => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f as any)}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                                    filter === f 
                                    ? 'bg-[var(--beheer-accent)] text-white shadow-lg' 
                                    : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-border)]/50'
                                }`}
                            >
                                {f === 'all' ? 'Alle' : f === 'upcoming' ? 'Aankomend' : 'Verleden'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-12 relative max-w-xl group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-20">
                    <Search className="h-5 w-5 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Zoek activiteiten op naam of locatie..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all shadow-xl shadow-black/5 font-medium text-lg"
                />
            </div>

            {/* Activities List */}
            <div className="grid grid-cols-1 gap-8">
                {displayedEvents.map(event => {
                    const eventDate = new Date(event.event_date);
                    const isPast = eventDate < new Date();
                    const isDraft = event.status === 'draft';
                    const isScheduled = event.status === 'published' && event.publish_date && new Date(event.publish_date) > new Date();
                    const canEdit = superAdmin || (event.committee_id && userCommittees.some(c => String(c.id) === String(event.committee_id)));

                    return (
                        <div
                            key={event.id}
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
                                                    {isDraft && <span className="px-3 py-1 text-[10px] font-black bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full uppercase tracking-widest">Draft</span>}
                                                    {isScheduled && <span className="px-3 py-1 text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full uppercase tracking-widest">Scheduled</span>}
                                                    {isPast && <span className="px-3 py-1 text-[10px] font-black bg-[var(--beheer-border)] text-[var(--beheer-text-muted)] rounded-full uppercase tracking-widest">Verleden</span>}
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
                                        <div className="flex items-center gap-3 bg-[var(--bg-main)] border border-[var(--beheer-border)] px-5 py-2.5 rounded-2xl group/stats">
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
                                            <div className="flex items-center gap-4 bg-[var(--bg-main)] border border-[var(--beheer-border)] px-5 py-2.5 rounded-2xl group/price">
                                                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 group-hover/price:scale-110 transition-transform">
                                                    <Euro className="h-4 w-4" />
                                                </div>
                                                <div className="flex items-center gap-2 font-black text-[var(--beheer-text)] uppercase tracking-tighter">
                                                    {event.price_members === 0 && event.price_non_members === 0 ? (
                                                        <span className="text-emerald-500">GRATIS</span>
                                                    ) : (
                                                        <>
                                                            <span>€{event.price_members || 0} Member</span>
                                                            <span className="text-[var(--beheer-border)]">|</span>
                                                            <span className="text-[var(--beheer-text-muted)]">€{event.price_non_members || 0} Guest</span>
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
                                        id={`view-signups-${event.id}`}
                                        onClick={() => router.push(`/beheer/activiteiten/${event.id}/aanmeldingen`)}
                                        className="flex-1 flex items-center justify-center gap-3 px-5 py-4 text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-2xl transition-all font-black uppercase tracking-widest cursor-pointer active:scale-95 group/btn"
                                    >
                                        <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                        <span>Aanmeldingen</span>
                                    </button>

                                    {!isPast && !isDraft && (
                                        <div className="flex flex-1 lg:flex-none gap-3">
                                            <button
                                                id={`reminder-${event.id}`}
                                                onClick={() => handleReminder(event.id, event.name)}
                                                disabled={isSending}
                                                className="flex-1 flex items-center justify-center gap-2 p-4 text-[10px] bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl transition-all font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer active:scale-95 group/btn"
                                                title="Stuur herinnering"
                                            >
                                                <Bell className="h-4 w-4 group-hover/btn:animate-bounce" />
                                            </button>
                                            <button
                                                id={`custom-notify-${event.id}`}
                                                onClick={() => {
                                                    setCustomNotification({ title: `Update: ${event.name}`, body: '', eventId: event.id });
                                                    setShowModal(true);
                                                }}
                                                disabled={isSending}
                                                className="flex-1 flex items-center justify-center gap-2 p-4 text-[10px] bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer active:scale-95 group/btn"
                                                title="Stuur update"
                                            >
                                                <Send className="h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                            </button>
                                        </div>
                                    )}

                                    {canEdit && (
                                        <div className="flex flex-1 lg:flex-none gap-3">
                                            <button
                                                id={`edit-${event.id}`}
                                                onClick={() => router.push(`/beheer/activiteiten/${event.id}/bewerken`)}
                                                className="flex-1 flex items-center justify-center gap-2 p-4 text-[10px] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-border)] rounded-2xl transition-all font-black uppercase tracking-widest cursor-pointer active:scale-95 group/btn"
                                            >
                                                <Edit className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                                            </button>
                                            <button
                                                id={`delete-${event.id}`}
                                                onClick={() => handleDelete(event.id, event.name)}
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
                })}
            </div>

            {/* Custom Notification Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl max-w-lg w-full p-8 border border-[var(--beheer-border)] scale-in-center relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute -top-24 -right-24 h-48 w-48 bg-[var(--beheer-accent)]/5 blur-3xl rounded-full" />
                        
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h3 className="text-2xl font-black text-[var(--beheer-text)] uppercase tracking-tight">
                                Custom Notificatie
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[var(--beheer-border)]/50 rounded-full transition-colors cursor-pointer text-[var(--beheer-text-muted)]">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-6 mb-10 relative z-10">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                                    Onderwerp / Titel
                                </label>
                                <input
                                    id="notif-title"
                                    type="text"
                                    value={customNotification.title}
                                    onChange={(e) => setCustomNotification({ ...customNotification, title: e.target.value })}
                                    className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--bg-main)] text-[var(--beheer-text)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all font-bold"
                                    placeholder="Belangrijke update..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                                    Bericht Inhoud
                                </label>
                                <textarea
                                    id="notif-body"
                                    value={customNotification.body}
                                    onChange={(e) => setCustomNotification({ ...customNotification, body: e.target.value })}
                                    rows={5}
                                    className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--bg-main)] text-[var(--beheer-text)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all resize-none font-medium text-base"
                                    placeholder="Typ hier je bericht naar de deelnemers..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 relative z-10">
                            <button
                                id="send-notif-btn"
                                onClick={handleCustomNotify}
                                disabled={isSending || !customNotification.title || !customNotification.body}
                                className="flex-1 px-8 py-4 bg-[var(--beheer-accent)] text-white rounded-2xl hover:brightness-110 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-[var(--beheer-accent)]/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                            >
                                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                <span>NU VERSTUREN</span>
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isSending}
                                className="px-8 py-4 bg-[var(--beheer-border)]/50 text-[var(--beheer-text)] rounded-2xl hover:bg-[var(--beheer-border)] transition-all font-bold text-xs uppercase tracking-widest cursor-pointer"
                            >
                                Annuleren
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
