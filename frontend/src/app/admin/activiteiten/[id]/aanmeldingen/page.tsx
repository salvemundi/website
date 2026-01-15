'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import { sendActivityCancellationEmail } from '@/shared/lib/services/email-service';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Search, Download, Mail, Phone, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Signup {
    id: number;
    participant_name?: string;
    participant_email?: string;
    participant_phone?: string;
    payment_status: string;
    created_at: string;
    directus_relations?: {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
    };
}

export default function AanmeldingenPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params?.id as string;

    const [signups, setSignups] = useState<Signup[]>([]);
    const [filteredSignups, setFilteredSignups] = useState<Signup[]>([]);
    const [eventName, setEventName] = useState<string>('');
    const [eventData, setEventData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [eventId]);

    useEffect(() => {
        filterSignups();
    }, [signups, searchQuery]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load event name
            const event = await directusFetch<any>(`/items/events/${eventId}?fields=name,committee_name,committee_email`);
            setEventName(event.name);
            setEventData(event);

            // Load signups
            const signupsData = await directusFetch<Signup[]>(
                `/items/event_signups?filter[event_id][_eq]=${eventId}&fields=id,participant_name,participant_email,participant_phone,payment_status,created_at,directus_relations.id,directus_relations.first_name,directus_relations.last_name,directus_relations.email,directus_relations.phone_number&sort=-created_at`
            );
            setSignups(signupsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (signupId: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
            return;
        }

        const signup = signups.find(s => s.id === signupId);

        try {
            // Send cancellation email if signup found
            if (signup) {
                const email = getEmail(signup);
                if (email && email !== '-') {
                    await sendActivityCancellationEmail({
                        recipientEmail: email,
                        recipientName: getName(signup),
                        eventName: eventName,
                        committeeName: eventData?.committee_name,
                        committeeEmail: eventData?.committee_email
                    });
                }
            }

            await directusFetch(`/items/event_signups/${signupId}`, {
                method: 'DELETE',
            });
            // Update local state
            setSignups(prev => prev.filter(s => s.id !== signupId));
        } catch (error) {
            console.error('Failed to delete signup:', error);
            alert('Kon aanmelding niet verwijderen. Probeer het later opnieuw.');
        }
    };

    const filterSignups = () => {
        if (!searchQuery) {
            setFilteredSignups(signups);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = signups.filter(signup => {
            const name = getName(signup).toLowerCase();
            const email = getEmail(signup).toLowerCase();
            const phone = getPhone(signup).toLowerCase();

            return name.includes(query) || email.includes(query) || phone.includes(query);
        });

        setFilteredSignups(filtered);
    };

    const getName = (signup: Signup): string => {
        if (signup.participant_name) return signup.participant_name;
        if (signup.directus_relations?.first_name) {
            return `${signup.directus_relations.first_name} ${signup.directus_relations.last_name || ''}`.trim();
        }
        return 'Onbekend';
    };

    const getEmail = (signup: Signup): string => {
        return signup.participant_email || signup.directus_relations?.email || '-';
    };

    const getPhone = (signup: Signup): string => {
        return signup.participant_phone || signup.directus_relations?.phone_number || '-';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Betaald
                    </span>
                );
            case 'failed':
            case 'canceled':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-full text-sm font-medium">
                        <XCircle className="h-4 w-4" />
                        Mislukt
                    </span>
                );
            case 'open':
            default:
                return (
                    <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        Open
                    </span>
                );
        }
    };

    const exportToCSV = () => {
        const headers = ['Naam', 'Email', 'Telefoon', 'Status', 'Aangemeld op'];
        const rows = filteredSignups.map(signup => [
            getName(signup),
            getEmail(signup),
            getPhone(signup),
            signup.payment_status,
            format(new Date(signup.created_at), 'dd-MM-yyyy HH:mm', { locale: nl })
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aanmeldingen-${eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`;
        link.click();
    };

    const stats = {
        total: signups.length,
        paid: signups.filter(s => s.payment_status === 'paid').length,
        open: signups.filter(s => s.payment_status === 'open').length,
        failed: signups.filter(s => ['failed', 'canceled'].includes(s.payment_status)).length,
    };

    return (
        <>
            <PageHeader
                title={eventName || 'Aanmeldingen'}
                description="Bekijk alle aanmeldingen voor deze activiteit"
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Totaal</p>
                        <p className="text-3xl font-bold text-theme-purple">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Betaald</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-300">{stats.paid}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Open</p>
                        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">{stats.open}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Mislukt</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-300">{stats.failed}</p>
                    </div>
                </div>

                {/* Search & Export */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Zoek op naam, email of telefoon..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-theme-purple focus:ring-2 focus:ring-theme-purple/20 outline-none transition"
                            />
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-6 py-3 bg-theme-purple text-white rounded-lg hover:shadow-lg transition font-medium"
                        >
                            <Download className="h-5 w-5" />
                            Exporteer CSV
                        </button>
                    </div>
                </div>

                {/* Signups Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                    </div>
                ) : filteredSignups.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-12 text-center">
                        <p className="text-slate-600 dark:text-slate-300 text-lg">
                            {searchQuery ? 'Geen aanmeldingen gevonden' : 'Nog geen aanmeldingen'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-theme-purple to-paars text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Naam</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Telefoon</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Datum</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Acties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredSignups.map((signup) => (
                                        <tr key={signup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                                {getName(signup)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                <a href={`mailto:${getEmail(signup)}`} className="flex items-center gap-2 hover:text-theme-purple transition">
                                                    <Mail className="h-4 w-4" />
                                                    {getEmail(signup)}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {getPhone(signup) !== '-' ? (
                                                    <a href={`tel:${getPhone(signup)}`} className="flex items-center gap-2 hover:text-theme-purple transition">
                                                        <Phone className="h-4 w-4" />
                                                        {getPhone(signup)}
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(signup.payment_status)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                                                {format(new Date(signup.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                                                <button
                                                    onClick={() => handleDelete(signup.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Verwijder aanmelding"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {filteredSignups.map((signup) => (
                                <div key={signup.id} className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 relative">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{getName(signup)}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {format(new Date(signup.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {getStatusBadge(signup.payment_status)}
                                            <button
                                                onClick={() => handleDelete(signup.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Verwijder aanmelding"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <a href={`mailto:${getEmail(signup)}`} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-theme-purple">
                                            <Mail className="h-4 w-4" />
                                            {getEmail(signup)}
                                        </a>
                                        {getPhone(signup) !== '-' && (
                                            <a href={`tel:${getPhone(signup)}`} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-theme-purple">
                                                <Phone className="h-4 w-4" />
                                                {getPhone(signup)}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-8">
                    <button
                        onClick={() => router.push('/admin/activiteiten')}
                        className="text-white hover:text-white/80 transition"
                    >
                        ← Terug naar activiteiten
                    </button>
                </div>
            </div>
        </>
    );
}
