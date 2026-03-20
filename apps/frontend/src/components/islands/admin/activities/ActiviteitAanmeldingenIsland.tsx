'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import { Search, Download, Mail, Phone, CheckCircle, XCircle, Clock, Trash2, UserPlus, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { deleteSignupAction, toggleCheckInAction } from '@/server/actions/aanmeldingen.actions';
import ManualSignupModal from './ManualSignupModal';
import { useRouter } from 'next/navigation';

interface Signup {
    id: number;
    participant_name: string;
    participant_email: string;
    participant_phone?: string | null;
    payment_status?: string;
    created_at: string;
    checked_in?: boolean;
    checked_in_at?: string | null;
    directus_relations?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone_number?: string | null;
    } | null;
}

export default function ActiviteitAanmeldingenIsland({ event, initialSignups }: { event: any, initialSignups: Signup[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Optimistic state for check-ins
    const [optimisticSignups, setOptimisticSignups] = useOptimistic(
        initialSignups || [],
        (state: Signup[], { id, checkedIn }: { id: number; checkedIn: boolean }) =>
            state.map(s => s.id === id ? { ...s, checked_in: checkedIn } : s)
    );

    const filteredSignups = useMemo(() => {
        // Deduplicate
        const map = new Map();
        for (const signup of optimisticSignups) {
            const emailKey = getEmail(signup).toLowerCase();
            const idKey = signup.directus_relations?.id || emailKey;
            const key = idKey === '-' ? signup.participant_name : idKey;

            if (!map.has(key)) {
                map.set(key, signup);
            } else {
                const existing = map.get(key);
                if (signup.payment_status === 'paid' && existing.payment_status !== 'paid') {
                    map.set(key, signup);
                }
            }
        }
        
        const deduplicated = Array.from(map.values()) as Signup[];

        if (!searchQuery) return deduplicated;
        const query = searchQuery.toLowerCase();
        return deduplicated.filter(signup => {
            const name = getName(signup).toLowerCase();
            const email = getEmail(signup).toLowerCase();
            const phone = getPhone(signup).toLowerCase();
            return name.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [optimisticSignups, searchQuery]);

    const stats = useMemo(() => {
        const base = searchQuery ? filteredSignups : (initialSignups || []);
        return {
            total: base.length,
            paid: base.filter(s => s.payment_status === 'paid').length,
            checkedIn: base.filter(s => s.checked_in).length,
            open: base.filter(s => s.payment_status === 'open').length,
        };
    }, [filteredSignups, searchQuery, initialSignups]);

    function getName(signup: Signup): string {
        if (signup.participant_name) return signup.participant_name;
        if (signup.directus_relations?.first_name) {
            return `${signup.directus_relations.first_name} ${signup.directus_relations.last_name || ''}`.trim();
        }
        return 'Onbekend';
    }

    function getEmail(signup: Signup): string {
        return signup.participant_email || signup.directus_relations?.email || '-';
    }

    function getPhone(signup: Signup): string {
        return signup.participant_phone || signup.directus_relations?.phone_number || '-';
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Betaald
                    </span>
                );
            case 'failed':
            case 'canceled':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <XCircle className="h-3.5 w-3.5" />
                        Mislukt
                    </span>
                );
            case 'open':
            default:
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5" />
                        Open
                    </span>
                );
        }
    }

    const exportToXLSX = () => {
        if (filteredSignups.length === 0) return;

        const data = filteredSignups.map(signup => ({
            Naam: getName(signup),
            Email: getEmail(signup),
            Telefoon: getPhone(signup),
            Status: signup.payment_status || 'open',
            'Checked In': signup.checked_in ? 'Ja' : 'Nee',
            'Inschrijfdatum': format(new Date(signup.created_at), 'dd-MM-yyyy HH:mm', { locale: nl })
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Aanmeldingen");
        
        const fileName = `Aanmeldingen_${(event.name || 'Activiteit').replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    async function handleToggleCheckIn(signupId: number, currentCheckedIn: boolean) {
        const newValue = !currentCheckedIn;
        startTransition(async () => {
            setOptimisticSignups({ id: signupId, checkedIn: newValue });
            const res = await toggleCheckInAction(signupId, event.id, newValue);
            if (!res.success) {
                alert(res.error || 'Fout bij bijwerken check-in');
            }
        });
    }

    async function handleDelete(signupId: number, email: string) {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen? De persoon krijgt hiervan een email notificatie.')) {
            return;
        }

        setIsDeleting(signupId);
        const res = await deleteSignupAction(signupId, event.id, email, event.name);
        if (!res.success) {
            alert(res.error || 'Fout bij verwijderen');
        } else {
            router.refresh();
        }
        setIsDeleting(null);
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-6 flex flex-col justify-center transition-all hover:shadow-md h-32">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Totaal</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-6 flex flex-col justify-center transition-all hover:shadow-md h-32">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Betaald</p>
                    <p className="text-4xl font-black text-green-600 dark:text-green-400 leading-none">{stats.paid}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-6 flex flex-col justify-center transition-all hover:shadow-md h-32">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Ingecheckt</p>
                    <p className="text-4xl font-black text-blue-600 dark:text-blue-400 leading-none">{stats.checkedIn}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-6 flex flex-col justify-center transition-all hover:shadow-md h-32">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Nog Open</p>
                    <p className="text-4xl font-black text-amber-500 dark:text-amber-400 leading-none">{stats.open}</p>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-4 mb-8 flex flex-col sm:flex-row gap-4 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Zoek op naam, email of telefoon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none ring-1 ring-slate-200 dark:ring-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToXLSX}
                        disabled={filteredSignups.length === 0}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Download className="h-5 w-5" />
                        <span className="hidden sm:inline">Exporteer</span>
                    </button>
                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                        <UserPlus className="h-5 w-5" />
                        <span className="hidden sm:inline">Handmatig</span>
                        <span className="sm:hidden">Lid</span>
                    </button>
                </div>
            </div>

            <ManualSignupModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                eventId={event.id}
                eventName={event.name}
                eventPrice={event.price_members || 0}
            />

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 overflow-hidden">
                {filteredSignups.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 mb-6">
                            <Search className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Geen resultaten</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                            {searchQuery ? "We konden niemand vinden die voldoet aan je zoekopdracht." : "Er zijn nog geen aanmeldingen voor deze activiteit."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                    <th className="px-6 py-4">Ingecheckt</th>
                                    <th className="px-6 py-4">Deelnemer</th>
                                    <th className="px-6 py-4">Contactgegevens</th>
                                    <th className="px-6 py-4">Status & Datum</th>
                                    <th className="px-6 py-4 text-right">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredSignups.map(signup => {
                                    const name = getName(signup);
                                    const email = getEmail(signup);
                                    const phone = getPhone(signup);
                                    const isRowDeleting = isDeleting === signup.id;
                                    
                                    return (
                                        <tr key={signup.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors ${isRowDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <td className="px-6 py-5">
                                                <button
                                                    onClick={() => handleToggleCheckIn(signup.id, !!signup.checked_in)}
                                                    className={`p-2 rounded-xl transition-all cursor-pointer ${signup.checked_in ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-600 hover:text-blue-400 group-hover:scale-110'}`}
                                                >
                                                    {signup.checked_in ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-extrabold text-slate-900 dark:text-white text-base mb-1">{name}</div>
                                                {signup.directus_relations && (
                                                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                                                        Bestigend Lid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                    <Mail className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                                    <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
                                                </div>
                                                {phone && phone !== '-' && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                        <Phone className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                                        <a href={`tel:${phone}`} className="hover:text-primary transition-colors">{phone}</a>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="mb-2">
                                                    {getStatusBadge(signup.payment_status || 'open')}
                                                </div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                                                    {format(new Date(signup.created_at), 'dd MMM yyyy, HH:mm', { locale: nl })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleDelete(signup.id, email)}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 dark:text-slate-600 dark:hover:text-red-400 transition-all cursor-pointer"
                                                    title="Verwijder aanmelding"
                                                >
                                                    {isRowDeleting ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
