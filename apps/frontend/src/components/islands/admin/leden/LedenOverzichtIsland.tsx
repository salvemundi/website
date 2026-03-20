'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Users,
    Search,
    UserCheck,
    UserMinus,
    ChevronRight,
    Calendar,
    Mail,
    Bell,
    Loader2,
    Download,
    ChevronLeft,
    ChevronRight as ChevronRightIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { sendMembershipReminderAction } from '@/server/actions/leden.actions';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string | null;
    membership_expiry: string | null;
    status: string;
}

interface LedenOverzichtIslandProps {
    members: Member[];
    totalCount: number;
    currentPage: number;
    searchQuery: string;
    activeTab: 'active' | 'inactive';
    pageSize: number;
}

export default function LedenOverzichtIsland({ 
    members, 
    totalCount, 
    currentPage, 
    searchQuery: initialSearchQuery,
    activeTab: initialActiveTab,
    pageSize
}: LedenOverzichtIslandProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== initialSearchQuery) {
                updateUrl({ search: searchQuery, page: 1 });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    function updateUrl(params: { search?: string, page?: number, tab?: string }) {
        const url = new URL(window.location.href);
        if (params.search !== undefined) {
            if (params.search) url.searchParams.set('search', params.search);
            else url.searchParams.delete('search');
        }
        if (params.page !== undefined) {
            if (params.page > 1) url.searchParams.set('page', params.page.toString());
            else url.searchParams.delete('page');
        }
        if (params.tab !== undefined) {
            url.searchParams.set('tab', params.tab);
        }
        
        startTransition(() => {
            router.push(url.pathname + url.search);
        });
    }

    const isMembershipActive = (m: Member) => {
        if (!m.membership_expiry) return false;
        const todayStr = new Date().toISOString().substring(0, 10);
        return m.membership_expiry.substring(0, 10) >= todayStr;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return format(new Date(dateString), 'dd-MM-yyyy', { locale: nl });
        } catch (e) {
            return 'Onbekend';
        }
    };

    const handleSendReminder = async () => {
        if (!confirm('Wil je een herinnering sturen naar alle leden die binnen 30 dagen hun lidmaatschap moeten verlengen?')) return;
        
        setIsSendingReminder(true);
        const res = await sendMembershipReminderAction(30);
        if (res.success) {
            alert(res.count === 0 ? 'Geen leden gevonden voor herinnering.' : `Herinnering verstuurd naar ${res.count} lid/leden!`);
        } else {
            alert(res.error || 'Fout bij versturen van herinneringen');
        }
        setIsSendingReminder(false);
    };

    const exportToXLSX = () => {
        const data = members.map(m => ({
            Naam: `${m.first_name} ${m.last_name}`,
            Email: m.email,
            Geboortedatum: formatDate(m.date_of_birth),
            'Lidmaatschap Tot': formatDate(m.membership_expiry),
            Status: isMembershipActive(m) ? 'Actief' : 'Niet Actief'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leden");
        XLSX.writeFile(wb, `Leden_Overzicht_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl w-full lg:w-auto">
                    <button
                        onClick={() => updateUrl({ tab: 'active', page: 1 })}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${initialActiveTab === 'active'
                            ? 'bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                    >
                        <UserCheck className="h-4 w-4" />
                        Actief
                    </button>
                    <button
                        onClick={() => updateUrl({ tab: 'inactive', page: 1 })}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${initialActiveTab === 'inactive'
                            ? 'bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                    >
                        <UserMinus className="h-4 w-4" />
                        Niet Actief
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Zoek op naam of email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none ring-1 ring-slate-200 dark:ring-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                        />
                        {isPending && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={exportToXLSX}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all"
                            title="Exporteer naar Excel"
                        >
                            <Download className="h-5 w-5" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button
                            onClick={handleSendReminder}
                            disabled={isSendingReminder}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20 font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
                        >
                            {isSendingReminder ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
                            <span className="hidden sm:inline">Herinnering</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                <th className="px-8 py-4">Lid</th>
                                <th className="px-8 py-4">Contactgegevens</th>
                                <th className="px-8 py-4">Geboortedatum</th>
                                <th className="px-8 py-4">Validiteit</th>
                                <th className="px-8 py-4 text-right">Beheer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {members.map((member) => (
                                <tr key={member.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform group-hover:scale-110">
                                                {member.first_name?.[0]}{member.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 dark:text-white leading-tight">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase tracking-wider">Lid ID: {member.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                            <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors">{member.email}</a>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {formatDate(member.date_of_birth)}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span suppressHydrationWarning className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${isMembershipActive(member)
                                            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                            }`}>
                                            Tot {formatDate(member.membership_expiry)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => router.push(`/beheer/leden/${member.id}`)}
                                            className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-primary hover:bg-primary/5 dark:text-slate-600 transition-all cursor-pointer"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {members.length === 0 && (
                    <div className="p-20 text-center">
                        <Users className="h-16 w-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Geen leden gevonden</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Pas de filters aan of probeer een andere zoekterm.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Pagina {currentPage} van {totalPages} <span className="mx-2">|</span> {totalCount} leden totaal
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => updateUrl({ page: currentPage - 1 })}
                                disabled={currentPage === 1 || isPending}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => updateUrl({ page: currentPage + 1 })}
                                disabled={currentPage === totalPages || isPending}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
