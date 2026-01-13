'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Search, Download, Mail, Users, Beer, AlertCircle } from 'lucide-react';
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
    }, [signups, searchQuery]);

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
        if (!searchQuery) {
            setFilteredSignups(signups);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = signups.filter(signup => {
            return (
                signup.name.toLowerCase().includes(query) ||
                signup.email.toLowerCase().includes(query) ||
                (signup.association && signup.association.toLowerCase().includes(query))
            );
        });

        setFilteredSignups(filtered);
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
        total: signups.length,
        totalTickets: signups.reduce((sum, s) => sum + s.amount_tickets, 0),
        associations: [...new Set(signups.map(s => s.association).filter(Boolean))].length,
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100 text-sm font-medium mb-1">Totaal Inschrijvingen</p>
                                            <p className="text-4xl font-bold">{stats.total}</p>
                                        </div>
                                        <Users className="h-12 w-12 text-white/30" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-100 text-sm font-medium mb-1">Totaal Tickets</p>
                                            <p className="text-4xl font-bold">{stats.totalTickets}</p>
                                        </div>
                                        <Beer className="h-12 w-12 text-white/30" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm font-medium mb-1">Verenigingen</p>
                                            <p className="text-4xl font-bold">{stats.associations}</p>
                                        </div>
                                        <Users className="h-12 w-12 text-white/30" />
                                    </div>
                                </div>
                            </div>

                            {/* Search and Export */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Zoek op naam, email of vereniging..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                                        />
                                    </div>
                                    <button
                                        onClick={exportToExcel}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition whitespace-nowrap"
                                    >
                                        <Download className="h-5 w-5" />
                                        Export naar Excel
                                    </button>
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Vereniging
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Tickets
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Deelnemers
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Betaalstatus
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                                    Aangemeld op
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                                                        Laden...
                                                    </td>
                                                </tr>
                                            ) : filteredSignups.length > 0 ? (
                                                filteredSignups.map((signup) => {
                                                    const participants = parseParticipants(signup.name_initials);
                                                    return (
                                                        <tr key={signup.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                    {signup.name}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <a
                                                                    href={`mailto:${signup.email}`}
                                                                    className="text-theme-purple hover:underline flex items-center gap-1"
                                                                >
                                                                    <Mail className="h-4 w-4" />
                                                                    {signup.email}
                                                                </a>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="text-slate-700 dark:text-slate-300">
                                                                    {signup.association || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                                                    {signup.amount_tickets}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {participants.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {participants.map((p, idx) => (
                                                                            <div key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                                                                                {p.name} {p.initial}.
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-slate-400 dark:text-slate-500">Geen details</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${signup.payment_status === 'paid'
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                                                    }`}>
                                                                    {signup.payment_status === 'paid' ? 'Betaald' : 'Open'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                                {format(new Date(signup.created_at), 'd MMM yyyy HH:mm', { locale: nl })}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <AlertCircle className="h-12 w-12" />
                                                            <p>Geen aanmeldingen gevonden</p>
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
                            <p className="text-slate-600 dark:text-slate-400">Geen kroegentocht events gevonden</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
