'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Calendar, Users, Edit, Trash2, Eye, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Event {
    id: number;
    name: string;
    event_date: string;
    description: string;
    location?: string;
    max_sign_ups?: number;
    contact?: string;
    price_members?: number;
    price_non_members?: number;
    inschrijf_deadline?: string;
    signup_count?: number;
    image?: { id: string } | string;
}

export default function AdminActiviteitenPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [pageSize, setPageSize] = useState<number | -1>(10); // -1 === all

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        filterEvents();
    }, [events, searchQuery, filter]);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            // Fetch all events with signup counts
            const eventsData = await directusFetch<Event[]>(
                '/items/events?fields=id,name,event_date,description,location,max_sign_ups,price_members,price_non_members,inschrijf_deadline,contact,image.id&sort=-event_date&limit=-1'
            );

            // Get signup counts for each event
            const eventsWithCounts = await Promise.all(
                eventsData.map(async (event) => {
                    try {
                        const signups = await directusFetch<any>(
                            `/items/event_signups?aggregate[count]=*&filter[event_id][_eq]=${event.id}`
                        );
                        return {
                            ...event,
                            signup_count: signups?.[0]?.count || 0
                        };
                    } catch (error) {
                        return { ...event, signup_count: 0 };
                    }
                })
            );

            setEvents(eventsWithCounts);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterEvents = () => {
        let filtered = [...events];

        // Apply time filter
        const now = new Date();
        if (filter === 'upcoming') {
            filtered = filtered.filter(event => new Date(event.event_date) >= now);
        } else if (filter === 'past') {
            filtered = filtered.filter(event => new Date(event.event_date) < now);
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.name.toLowerCase().includes(query) ||
                event.description?.toLowerCase().includes(query) ||
                event.location?.toLowerCase().includes(query)
            );
        }

        setFilteredEvents(filtered);
    };

    const handleDelete = async (eventId: number, eventName: string) => {
        if (!confirm(`Weet je zeker dat je "${eventName}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
            return;
        }

        try {
            await directusFetch(`/items/events/${eventId}`, {
                method: 'DELETE'
            });

            // Refresh events list
            await loadEvents();
            alert('Activiteit succesvol verwijderd');
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Fout bij verwijderen van activiteit');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMMM yyyy', { locale: nl });
        } catch (error) {
            return dateString;
        }
    };

    const isEventPast = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    const getImageUrl = (image?: { id: string } | string) => {
        if (!image) return '';
        const imageId = typeof image === 'object' ? image.id : image;
        return `https://admin.salvemundi.nl/assets/${imageId}`;
    };

    return (
        <>
            <PageHeader
                title="Beheer Activiteiten"
                description="Bekijk, bewerk en verwijder activiteiten"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
                titleClassName="text-sm sm:text-base md:text-xl"
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Actions Bar */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <button
                        onClick={() => router.push('/admin/activiteiten/nieuw')}
                        className="bg-theme-purple text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Nieuwe Activiteit
                    </button>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'all'
                                    ? 'bg-theme-purple text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Alle
                        </button>
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'upcoming'
                                    ? 'bg-theme-purple text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Aankomend
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'past'
                                    ? 'bg-theme-purple text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Verleden
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600 dark:text-white/70">Toon</label>
                        <select
                            value={pageSize === -1 ? 'all' : pageSize}
                            onChange={(e) => setPageSize(e.target.value === 'all' ? -1 : parseInt(e.target.value, 10))}
                            className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1921] text-sm px-3 py-1 outline-none"
                        >
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="all">Alles</option>
                        </select>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Zoek activiteiten..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-300 focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                        />
                    </div>
                </div>

                {/* Events List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="bg-white dark:bg-[#1f1921] dark:border dark:border-white/10 rounded-2xl shadow-lg p-12 text-center">
                        <Calendar className="h-16 w-16 text-slate-300 dark:text-white/60 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-white/90 text-lg">
                            {searchQuery ? 'Geen activiteiten gevonden' : 'Nog geen activiteiten aangemaakt'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {((pageSize === -1) ? filteredEvents : filteredEvents.slice(0, pageSize)).map((event) => (
                            <div
                                key={event.id}
                                className={`bg-white dark:bg-[#1f1921] dark:border dark:border-white/10 rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all ${
                                    isEventPast(event.event_date) ? 'opacity-75' : ''
                                }`}
                            >
                                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                                    {/* Event Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                {/* Event Image */}
                                                {event.image && (
                                                    <img
                                                        src={getImageUrl(event.image)}
                                                        alt={event.name}
                                                        className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0"
                                                    />
                                                )}
                                                
                                                {/* Event Title and Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-2 truncate">
                                                        {event.name}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-white/70">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>{formatDate(event.event_date)}</span>
                                                        </div>
                                                        {event.location && (
                                                            <div className="flex items-center gap-1">
                                                                <span>📍</span>
                                                                <span>{event.location}</span>
                                                            </div>
                                                        )}
                                                        {event.contact && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-500 dark:text-white/70">Contact:</span>
                                                                <span className="font-medium text-slate-700 dark:text-white">{event.contact}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {isEventPast(event.event_date) && (
                                                <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                                                    Afgelopen
                                                </span>
                                            )}
                                        </div>

                                        {event.description && (
                                            <p className="text-slate-600 dark:text-white/70 text-sm mb-2 line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm items-center">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-theme-purple" />
                                                <span className="font-semibold text-slate-800 dark:text-white bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">{event.signup_count || 0}</span>
                                                {event.max_sign_ups && <span className="text-slate-500 dark:text-white/70">/ {event.max_sign_ups}</span>}
                                                <span className="text-slate-500 dark:text-white/70">aanmeldingen</span>
                                            </div>
                                            {(event.price_members !== undefined || event.price_non_members !== undefined) && (
                                                <div className="text-slate-600">
                                                    {event.price_members === 0 && event.price_non_members === 0 ? (
                                                        <span className="font-semibold text-green-600">Gratis</span>
                                                    ) : (
                                                        <span>
                                                            €{event.price_members || 0} / €{event.price_non_members || 0}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col gap-2 justify-end items-end w-full md:w-auto flex-wrap">
                                        <button
                                            onClick={() => router.push(`/admin/activiteiten/${event.id}/aanmeldingen`) }
                                            className="flex items-center gap-1 px-3 py-2 w-auto text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-white dark:hover:bg-blue-800/30 rounded-lg hover:bg-blue-100 transition font-medium"
                                            title="Bekijk aanmeldingen"
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="inline">Aanmeldingen</span>
                                        </button>
                                        <button
                                            onClick={() => router.push(`/admin/activiteiten/${event.id}/bewerken`) }
                                            className="flex items-center gap-1 px-3 py-2 w-auto text-sm bg-slate-50 text-slate-600 dark:bg-slate-800/30 dark:text-white dark:hover:bg-slate-700/30 rounded-lg hover:bg-slate-100 transition font-medium"
                                            title="Bewerk activiteit"
                                        >
                                            <Edit className="h-4 w-4" />
                                            <span className="inline">Bewerken</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id, event.name)}
                                            className="flex items-center gap-1 px-3 py-2 w-auto text-sm bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-white dark:hover:bg-red-800/30 rounded-lg hover:bg-red-100 transition font-medium"
                                            title="Verwijder activiteit"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="hidden sm:inline">Verwijderen</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
