'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Users, Edit, Trash2, Eye, Plus, Search, Bell, Send, MapPin, Mail, Euro, X, Loader2 } from 'lucide-react';
import { deleteActivity, sendActivityReminder, sendActivityCustomNotification } from '@/server/actions/activiteiten.actions';
import PageHeader from '@/components/ui/layout/PageHeader';
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
    inschrijf_deadline?: string | null;
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Actions Bar */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/beheer/activiteiten/nieuw')}
                            className="bg-purple-600 dark:bg-purple-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Nieuwe Activiteit</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-slate-500 sr-only sm:not-sr-only">Toon</label>
                            <select
                                value={pageSize === -1 ? 'all' : pageSize}
                                onChange={(e) => setPageSize(e.target.value === 'all' ? -1 : parseInt(e.target.value, 10))}
                                className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm px-4 py-2 outline-none cursor-pointer font-medium"
                            >
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="all">Alles</option>
                            </select>
                        </div>
                    </div>
                    <div className="hidden sm:flex gap-2">
                        {['all', 'upcoming', 'past'].map(f => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f as any)}
                                className={`px-5 py-2 rounded-full font-bold transition-all cursor-pointer ${filter === f ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                {f === 'all' ? 'Alle' : f === 'upcoming' ? 'Aankomend' : 'Verleden'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors pointer-events-none z-20" />
                <input
                    type="text"
                    placeholder="Zoek activiteiten..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm"
                />
            </div>

            {/* Activities List */}
            <div className="grid grid-cols-1 gap-6">
                {displayedEvents.map(event => {
                    const eventDate = new Date(event.event_date);
                    const isPast = eventDate < new Date();
                    const isDraft = event.status === 'draft';
                    const isScheduled = event.status === 'published' && event.publish_date && new Date(event.publish_date) > new Date();
                    const canEdit = superAdmin || (event.committee_id && userCommittees.some(c => String(c.id) === String(event.committee_id)));

                    return (
                        <div
                            key={event.id}
                            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 transition-all border border-slate-100 dark:border-slate-700/50 hover:shadow-2xl hover:scale-[1.005] group/card ${isPast ? 'opacity-80' : ''}`}
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Image & Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-5 flex-1 min-w-0">
                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 flex-shrink-0 group-hover/card:scale-105 transition-transform duration-500">
                                                <Image
                                                    src={getImageUrl(event.image) || '/img/placeholder.svg'}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover rounded-2xl shadow-md border border-slate-100 dark:border-slate-700"
                                                    sizes="112px"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate pr-2">
                                                        {event.name}
                                                    </h3>
                                                    {isDraft && <span className="px-3 py-1 text-xs font-black bg-slate-500 text-white rounded-full uppercase tracking-tighter">Draft</span>}
                                                    {isScheduled && <span className="px-3 py-1 text-xs font-black bg-blue-500 text-white rounded-full uppercase tracking-tighter">Scheduled</span>}
                                                    {isPast && <span className="px-3 py-1 text-xs font-black bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full uppercase tracking-tighter">Past</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-purple-500" />
                                                        <span>{formatDate(event.event_date)}</span>
                                                    </div>
                                                    {event.location && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-red-500" />
                                                            <span className="truncate max-w-[150px] sm:max-w-none">{event.location}</span>
                                                        </div>
                                                    )}
                                                    {event.contact && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4 text-blue-500" />
                                                            <span className="truncate max-w-[150px] sm:max-w-none">{event.contact}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {event.description && (
                                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                                            {event.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-6 items-center">
                                        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl">
                                            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            <span className="font-black text-purple-600 dark:text-purple-400">{event.signup_count || 0}</span>
                                            {event.max_sign_ups && <span className="text-purple-400 dark:text-purple-600 font-bold">/ {event.max_sign_ups}</span>}
                                            <span className="text-xs font-bold text-purple-500/70 uppercase ml-1">aanmeldingen</span>
                                        </div>
                                        {(event.price_members !== undefined || event.price_non_members !== undefined) && (
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                <Euro className="h-4 w-4 text-green-500" />
                                                <span>
                                                    {event.price_members === 0 && event.price_non_members === 0 ? (
                                                        <span className="text-green-600 dark:text-green-400 font-black">GRATIS</span>
                                                    ) : (
                                                        <span>€{event.price_members || 0} <span className="text-slate-400 font-medium">/</span> €{event.price_non_members || 0}</span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row md:flex-col gap-3 justify-end items-end w-full md:w-auto flex-wrap pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                                    <button
                                        onClick={() => router.push(`/beheer/activiteiten/${event.id}/aanmeldingen`)}
                                        className="btn-secondary flex items-center gap-2 px-4 py-3 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-white dark:hover:bg-blue-800/50 rounded-xl transition-all font-bold cursor-pointer"
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span>Show Signups</span>
                                    </button>

                                    {!isPast && !isDraft && (
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => handleReminder(event.id, event.name)}
                                                disabled={isSending}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 text-sm bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-white rounded-xl transition-all font-bold disabled:opacity-50 cursor-pointer"
                                                title="Stuur herinnering naar alle deelnemers"
                                            >
                                                <Bell className="h-4 w-4" />
                                                <span className="md:hidden lg:inline">Reminder</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCustomNotification({ title: `Update: ${event.name}`, body: '', eventId: event.id });
                                                    setShowModal(true);
                                                }}
                                                disabled={isSending}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-white rounded-xl transition-all font-bold disabled:opacity-50 cursor-pointer"
                                                title="Stuur custom notificatie"
                                            >
                                                <Send className="h-4 w-4" />
                                                <span className="md:hidden lg:inline">Custom</span>
                                            </button>
                                        </div>
                                    )}

                                    {canEdit && (
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => router.push(`/beheer/activiteiten/${event.id}/bewerken`)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all font-bold cursor-pointer"
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id, event.name)}
                                                disabled={isPending}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-white rounded-xl transition-all font-bold disabled:opacity-50 cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="inline md:hidden lg:inline">Delete</span>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-700 scale-in-center">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Custom Notificatie
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer">
                                <X className="h-6 w-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                                    Titel
                                </label>
                                <input
                                    type="text"
                                    value={customNotification.title}
                                    onChange={(e) => setCustomNotification({ ...customNotification, title: e.target.value })}
                                    className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold"
                                    placeholder="Reminder: Activiteit..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                                    Bericht
                                </label>
                                <textarea
                                    value={customNotification.body}
                                    onChange={(e) => setCustomNotification({ ...customNotification, body: e.target.value })}
                                    rows={4}
                                    className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all resize-none font-medium"
                                    placeholder="Belangrijke update voor deelnemers..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleCustomNotify}
                                disabled={isSending || !customNotification.title || !customNotification.body}
                                className="flex-1 px-8 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all font-black shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                            >
                                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                <span>VERSTUREN</span>
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isSending}
                                className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all font-bold cursor-pointer"
                            >
                                Annuleer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
