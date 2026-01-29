'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { siteSettingsMutations } from '@/shared/lib/api/salvemundi';
import { useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { Search, Download, Users, Beer, AlertCircle, Trash2, Loader2, Edit } from 'lucide-react';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { isUserAuthorizedForReis } from '@/shared/lib/committee-utils';
import qrService from '@/shared/lib/qr-service';
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
    const { user } = useAuth();
    const canEdit = isUserAuthorizedForReis(user);
    const [events, setEvents] = useState<PubCrawlEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<PubCrawlEvent | null>(null);
    const [signups, setSignups] = useState<PubCrawlSignup[]>([]);
    const [filteredSignups, setFilteredSignups] = useState<PubCrawlSignup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authorizedForAttendance, setAuthorizedForAttendance] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllSignups, setShowAllSignups] = useState(false);
    // site visibility for kroegentocht
    const { data: kroegentochtSettings, refetch: refetchKroegSettings } = useSalvemundiSiteSettings('kroegentocht');

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        const check = async () => {
            try {
                if (user) {
                    const ok = await qrService.isUserAuthorizedForPubCrawlAttendance(user.id);
                    setAuthorizedForAttendance(ok);
                }
            } catch (err) {
                console.error('Error checking pub crawl attendance auth:', err);
            }
        };
        check();
    }, [user]);

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
        if (!canEdit) {
            alert('Je hebt geen rechten om inschrijvingen te verwijderen.');
            return;
        }
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
                        className="mb-6 px-4 py-2 bg-admin-card-soft text-admin rounded-lg hover:bg-admin-hover transition"
                    >
                        ← Terug naar Dashboard
                    </button>

                    {/* Event Selector */}
                    <div className="mb-6 bg-admin-card rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-admin mb-4">Selecteer Event</h2>
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
                                            ? 'border-theme-purple bg-theme-purple/10'
                                            : 'border-admin hover:border-theme-purple'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-admin line-clamp-1">
                                                {event.name}
                                            </h3>
                                            {isUpcoming && (
                                                <span className="ml-2 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium rounded">
                                                    Aanstaand
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-admin-muted">
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
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                                    <div className="flex flex-col items-center text-center">
                                        <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Inschrijvingen (Betaald)</p>
                                        <p className="text-3xl sm:text-4xl font-bold">{stats.total}</p>
                                        <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white/30 mt-2" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                                    <div className="flex flex-col items-center text-center">
                                        <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Tickets (Betaald)</p>
                                        <p className="text-3xl sm:text-4xl font-bold">{stats.totalTickets}</p>
                                        <Beer className="h-8 w-8 sm:h-10 sm:w-10 text-white/30 mt-2" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                                    <div className="flex flex-col items-center text-center">
                                        <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Verenigingen (Betaald)</p>
                                        <p className="text-3xl sm:text-4xl font-bold">{stats.associations}</p>
                                        <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white/30 mt-2" />
                                    </div>
                                </div>

                                <div className="bg-admin-card-soft border-2 border-dashed border-admin rounded-xl sm:rounded-2xl p-4 sm:p-6 text-admin-muted">
                                    <div className="flex flex-col items-center text-center">
                                        <p className="text-xs sm:text-sm font-medium mb-1">Onbetaald / Open</p>
                                        <p className="text-3xl sm:text-4xl font-bold">{stats.failedCount}</p>
                                        <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-admin-muted/30 mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Search and Export */}
                            <div className="bg-admin-card rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
                                <div className="flex flex-col gap-4">
                                    <div className="relative flex-1 w-full lg:max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                        <input
                                            type="text"
                                            placeholder="Zoek op naam, email of vereniging..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-admin-card text-admin"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full">
                                        {/* Toggle button for showing all signups */}
                                        <button
                                            onClick={() => setShowAllSignups(!showAllSignups)}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition border-2 w-full sm:w-auto ${showAllSignups
                                                ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                                                : 'bg-admin-card-soft border-admin text-admin-muted hover:border-theme-purple'
                                                }`}
                                        >
                                            <AlertCircle size={20} />
                                            {showAllSignups ? 'Verberg onbetaald' : 'Toon ook onbetaald'}
                                        </button>

                                        {/* Visibility toggle for Kroegentocht (ICT/admin only) */}
                                        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                                            <label className="text-sm font-medium">Kroegentocht zichtbaar</label>
                                            <button
                                                onClick={async () => {
                                                    const current = kroegentochtSettings?.show ?? true;
                                                    try {
                                                        await siteSettingsMutations.upsertByPage('kroegentocht', { show: !current });
                                                        await refetchKroegSettings();
                                                    } catch (err) {
                                                        console.error('Failed to toggle kroegentocht visibility', err);
                                                        alert('Fout bij het bijwerken van de zichtbaarheid voor Kroegentocht');
                                                    }
                                                }}
                                                className={`w-12 h-6 rounded-full p-0.5 transition ${kroegentochtSettings?.show ? 'bg-green-500' : 'bg-gray-300'}`}
                                                aria-pressed={kroegentochtSettings?.show ?? true}
                                            >
                                                <span className={`block w-5 h-5 bg-white rounded-full transform transition ${kroegentochtSettings?.show ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={exportToExcel}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition w-full sm:w-auto">
                                            <Download className="h-5 w-5" />
                                            Export (Gefilterd)
                                        </button>
                                        {authorizedForAttendance && selectedEvent && (
                                            <button
                                                onClick={() => router.push(`/kroegentocht/${selectedEvent.id}/attendance`)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-theme-purple text-white font-bold rounded-lg transition w-full sm:w-auto">
                                                Aanwezigheid Beheren
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Signups Table */}
                            <div className="bg-admin-card rounded-2xl shadow-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-admin-card-soft">
                                            <tr>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                                                    Naam
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-admin-muted uppercase tracking-wider">
                                                    Tickets
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden sm:table-cell">
                                                    Betaalstatus
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden md:table-cell">
                                                    Email & Vereniging
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider hidden lg:table-cell">
                                                    Aangemeld op
                                                </th>
                                                <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-admin-muted uppercase tracking-wider">
                                                    Acties
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-admin">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-admin-muted">
                                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-theme-purple" />
                                                        Laden...
                                                    </td>
                                                </tr>
                                            ) : filteredSignups.length > 0 ? (
                                                filteredSignups.map((signup) => {
                                                    const participants = parseParticipants(signup.name_initials);
                                                    return (
                                                        <tr key={signup.id} className="hover:bg-admin-hover">
                                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                                <div className="font-bold text-admin text-xs sm:text-sm">
                                                                    {signup.name}
                                                                </div>
                                                                {participants.length > 0 && (
                                                                    <div className="mt-2 text-xs space-y-0.5 border-l-2 border-purple-200 dark:border-purple-800 pl-2">
                                                                        {participants.map((p, idx) => (
                                                                            <div key={idx} className="text-admin-muted">
                                                                                • {p.name} {p.initial}.
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                                                <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs sm:text-sm font-bold">
                                                                    {signup.amount_tickets}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${signup.payment_status === 'paid'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                    : signup.payment_status === 'open'
                                                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                    }`}>
                                                                    {signup.payment_status === 'paid' ? 'Betaald' : signup.payment_status === 'open' ? 'Open' : signup.payment_status || 'Fout'}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                                                <div className="text-sm">
                                                                    <a href={`mailto:${signup.email}`} className="text-theme-purple hover:underline font-medium block">
                                                                        {signup.email}
                                                                    </a>
                                                                    <div className="text-admin-muted mt-1">
                                                                        {signup.association || '-'}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-admin-muted hidden lg:table-cell">
                                                                {format(new Date(signup.created_at), 'd MMM HH:mm', { locale: nl })}
                                                            </td>
                                                            <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                                <div className="inline-flex items-center gap-1 sm:gap-2">
                                                                    {canEdit && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => router.push(`/admin/kroegentocht/deelnemer/${signup.id}`)}
                                                                                className="text-admin-muted hover:text-admin p-1 sm:p-2 rounded-lg hover:bg-admin-hover transition-colors"
                                                                                title="Bewerk inschrijving"
                                                                            >
                                                                                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                            </button>

                                                                            <button
                                                                                onClick={() => handleDelete(signup.id)}
                                                                                className="text-red-400 hover:text-red-600 p-1 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                                title="Verwijder inschrijving"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-admin-muted">
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
                        <div className="bg-admin-card rounded-2xl shadow-lg p-12 text-center">
                            <AlertCircle className="h-16 w-16 text-admin-muted mx-auto mb-4" />
                            <p className="text-admin-muted italic">Selecteer een event hierboven om de aanmeldingen te bekijken.</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
