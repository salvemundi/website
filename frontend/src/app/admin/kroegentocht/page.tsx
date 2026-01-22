'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Search, Download, Users, Beer, AlertCircle, Trash2, Loader2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface PubCrawlEvent {
    id: number;
    name: string;
    date: string;
    email: string;
}

interface PubCrawlSignup {
    id: number;
    name: string;
    email: string;
    association: string;
    amount_tickets: number;
    payment_status: string;
    name_initials: string | null; // JSON string
    created_at: string;
}

interface Participant {
    name: string;
    initial: string;
}

export default function KroegentochtAanmeldingenPage() {
    const router = useRouter();
    const [events, setEvents] = useState<PubCrawlEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<PubCrawlEvent | null>(null);
    const [signups, setSignups] = useState<PubCrawlSignup[]>([]);
    const [filteredSignups, setFilteredSignups] = useState<PubCrawlSignup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllSignups, setShowAllSignups] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            loadSignups(selectedEvent.id);
        }
    }, [selectedEvent]);

    useEffect(() => {
        filterSignups();
    }, [signups, searchQuery, showAllSignups]);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const eventsData = await directusFetch<PubCrawlEvent[]>(
                '/items/pub_crawl_events?fields=id,name,date,email&sort=-date'
            );
            setEvents(eventsData);

            // Select the most recent upcoming event
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingEvent = eventsData.find(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            });

            if (upcomingEvent) {
                setSelectedEvent(upcomingEvent);
            } else if (eventsData.length > 0) {
                // If no upcoming event, select the most recent past event
                setSelectedEvent(eventsData[0]);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSignups = async (eventId: number) => {
        setIsLoading(true);
        try {
            const signupsData = await directusFetch<PubCrawlSignup[]>(
                `/items/pub_crawl_signups?filter[pub_crawl_event_id][_eq]=${eventId}&fields=id,name,email,association,amount_tickets,payment_status,name_initials,created_at&sort=-created_at`
            );
            setSignups(signupsData);
        } catch (error) {
            console.error('Failed to load signups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterSignups = () => {
        let filtered = [...signups];

        // 1. Filter by Paid status (unless showAllSignups is true)
        if (!showAllSignups) {
            filtered = filtered.filter(s => s.payment_status === 'paid');
        }

        // 2. Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(signup => {
                return (
                    signup.name.toLowerCase().includes(query) ||
                    signup.email.toLowerCase().includes(query) ||
                    (signup.association && signup.association.toLowerCase().includes(query))
                );
            });
        }

        setFilteredSignups(filtered);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze inschrijving wilt verwijderen?')) return;

        try {
            await directusFetch(`/items/pub_crawl_signups/${id}`, {
                method: 'DELETE'
            });
            // Update local state
            setSignups(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete signup:', error);
            alert('Fout bij het verwijderen van inschrijving.');
        }
    };

    const parseParticipants = (nameInitials: string | null): Participant[] => {
        if (!nameInitials) return [];
        try {
            const parsed = JSON.parse(nameInitials);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const exportToExcel = () => {
        if (!selectedEvent) return;

        // Prepare data with group numbers
        const rows: any[] = [];
        let groupNumber = 1;

        filteredSignups.forEach(signup => {
            const participants = parseParticipants(signup.name_initials);

            if (participants.length > 0) {
                // Add all participants with the same group number
                participants.forEach(participant => {
                    rows.push({
                        'Naam': `${participant.name} ${participant.initial}.`,
                        'Vereniging': signup.association || '-',
                        'Groep': groupNumber
                    });
                });
            } else {
                // Fallback if no participants data
                for (let i = 0; i < signup.amount_tickets; i++) {
                    rows.push({
                        'Naam': i === 0 ? signup.name : '-',
                        'Vereniging': signup.association || '-',
                        'Groep': groupNumber
                    });
                }
            }

            groupNumber++;
        });

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aanmeldingen');

        // Set column widths
        ws['!cols'] = [
            { wch: 30 }, // Naam
            { wch: 20 }, // Vereniging
            { wch: 10 }  // Groep
        ];

        // Generate filename
        const filename = `kroegentocht-${selectedEvent.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

        // Download
        XLSX.writeFile(wb, filename);
    };

    const stats = {
        total: signups.filter(s => s.payment_status === 'paid').length,
        totalTickets: signups.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + s.amount_tickets, 0),
        failedCount: signups.filter(s => s.payment_status !== 'paid').length,
        associations: [...new Set(signups.filter(s => s.payment_status === 'paid').map(s => s.association).filter(Boolean))].length,
    };

    return (
        <>
            <PageHeader
                title="KROEGENTOCHT AANMELDINGEN"
                backgroundImage="/img/backgrounds/intro-banner.jpg"
            />

            <main className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/admin')}
                        className="mb-6 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                    >
                        ← Terug naar Dashboard
                    </button>

                    {/* Event Selector */}
                    <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Selecteer Event</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map(event => {
                                const eventDate = new Date(event.date);
                                const isUpcoming = eventDate >= new Date();
                                const isSelected = selectedEvent?.id === event.id;

                                return (
                                    <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`p-4 rounded-xl border-2 transition text-left ${isSelected
                                            ? 'border-theme-purple bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-theme-purple dark:hover:border-theme-purple'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                                {event.name}
                                            </h3>
                                            {isUpcoming && (
                                                <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                                                    Aanstaand
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {format(eventDate, 'd MMMM yyyy', { locale: nl })}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedEvent ? (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white text-center sm:text-left">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                                        <div>
                                            <p className="text-purple-100 text-sm font-medium mb-1">Inschrijvingen (Betaald)</p>
                                            <p className="text-4xl font-bold">{stats.total}</p>
                                        </div>
                                        <Users className="h-12 w-12 text-white/30 hidden sm:block" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white text-center sm:text-left">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                                        <div>
                                            <p className="text-orange-100 text-sm font-medium mb-1">Tickets (Betaald)</p>
                                            <p className="text-4xl font-bold">{stats.totalTickets}</p>
                                        </div>
                                        <Beer className="h-12 w-12 text-white/30 hidden sm:block" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white text-center sm:text-left">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                                        <div>
                                            <p className="text-blue-100 text-sm font-medium mb-1">Verenigingen (Betaald)</p>
                                            <p className="text-4xl font-bold">{stats.associations}</p>
                                        </div>
                                        <Users className="h-12 w-12 text-white/30 hidden sm:block" />
                                    </div>
                                </div>

                                <div className="bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-slate-600 dark:text-slate-300 text-center sm:text-left">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium mb-1">Onbetaald / Open</p>
                                            <p className="text-4xl font-bold">{stats.failedCount}</p>
                                        </div>
                                        <AlertCircle className="h-12 w-12 text-slate-400/30 hidden sm:block" />
                                    </div>
                                </div>
                            </div>

                            {/* Search and Export */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
                                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                                    <div className="relative flex-1 w-full lg:max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Zoek op naam, email of vereniging..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-4 w-full lg:w-auto">
                                        {/* Toggle button for showing all signups */}
                                        <button
                                            onClick={() => setShowAllSignups(!showAllSignups)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap border-2 ${showAllSignups
                                                ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:border-theme-purple'
                                                }`}
                                        >
                                            <AlertCircle size={20} />
                                            {showAllSignups ? 'Verberg onbetaald' : 'Toon ook onbetaald'}
                                        </button>

                                        <button
                                            onClick={exportToExcel}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition whitespace-nowrap"
                                        >
                                            <Download className="h-5 w-5" />
                                            Export (Gefilterd)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Signups Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Naam
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider text-center">
                                                    Tickets
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Betaalstatus
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Email & Vereniging
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Aangemeld op
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Acties
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-theme-purple" />
                                                        Laden...
                                                    </td>
                                                </tr>
                                            ) : filteredSignups.length > 0 ? (
                                                filteredSignups.map((signup) => {
                                                    const participants = parseParticipants(signup.name_initials);
                                                    return (
                                                        <tr key={signup.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                                                    {signup.name}
                                                                </div>
                                                                {participants.length > 0 && (
                                                                    <div className="mt-2 text-xs space-y-0.5 border-l-2 border-purple-200 dark:border-purple-800 pl-2">
                                                                        {participants.map((p, idx) => (
                                                                            <div key={idx} className="text-slate-500 dark:text-slate-400">
                                                                                • {p.name} {p.initial}.
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-bold">
                                                                    {signup.amount_tickets}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${signup.payment_status === 'paid'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                    : signup.payment_status === 'open'
                                                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                    }`}>
                                                                    {signup.payment_status === 'paid' ? 'Betaald' : signup.payment_status === 'open' ? 'Open' : signup.payment_status || 'Fout'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm">
                                                                    <a href={`mailto:${signup.email}`} className="text-theme-purple hover:underline font-medium block">
                                                                        {signup.email}
                                                                    </a>
                                                                    <div className="text-slate-500 dark:text-slate-400 mt-1">
                                                                        {signup.association || '-'}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                                {format(new Date(signup.created_at), 'd MMM HH:mm', { locale: nl })}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                <div className="inline-flex items-center space-x-2">
                                                                    <button
                                                                        onClick={() => router.push(`/admin/kroegentocht/deelnemer/${signup.id}`)}
                                                                        className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                                                                        title="Bewerk inschrijving"
                                                                    >
                                                                        <Edit className="h-5 w-5" />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleDelete(signup.id)}
                                                                        className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                        title="Verwijder inschrijving"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <AlertCircle className="h-12 w-12 opacity-20" />
                                                            <p className="font-bold text-lg">Geen aanmeldingen gevonden</p>
                                                            <p className="text-sm">Probeer een andere zoekopdracht of filter.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
                            <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 italic">Selecteer een event hierboven om de aanmeldingen te bekijken.</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
