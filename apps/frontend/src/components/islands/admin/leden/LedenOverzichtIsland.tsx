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
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    ShieldAlert,
    Clock,
    UserPlus,
    Download,
    Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { sendMembershipReminderAction } from '@/server/actions/leden.actions';
import { format, isAfter } from 'date-fns';
import { nl } from 'date-fns/locale';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';

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
    pageSize: number;
}

export default function LedenOverzichtIsland({ 
    members, 
    totalCount, 
    currentPage, 
    searchQuery: initialSearchQuery,
    pageSize
}: LedenOverzichtIslandProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== initialSearchQuery) {
                updateUrl({ search: searchQuery, page: 1 });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    function updateUrl(params: { search?: string, page?: number }) {
        const url = new URL(window.location.href);
        if (params.search !== undefined) {
            if (params.search) url.searchParams.set('search', params.search);
            else url.searchParams.delete('search');
        }
        if (params.page !== undefined) {
            if (params.page > 1) url.searchParams.set('page', params.page.toString());
            else url.searchParams.delete('page');
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

    const filteredMembers = members.filter(m => {
        const active = isMembershipActive(m);
        return activeTab === 'active' ? active : !active;
    });

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
        const data = filteredMembers.map(m => ({
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

    const activeCount = members.filter(m => isMembershipActive(m)).length;
    const inactiveCount = members.filter(m => !isMembershipActive(m)).length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const adminStats = [
        { label: 'Leden', value: totalCount, icon: Users, trend: 'Totaal' },
        { label: 'Actief', value: activeCount, icon: UserCheck, trend: 'Lidmaatschap' },
        { label: 'Verlopen', value: inactiveCount, icon: UserMinus, trend: 'Niet Actief' },
        { label: 'Herinneringen', value: '30d', icon: Bell, trend: 'Trigger' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Leden Overzicht"
                subtitle="Beheer alle Salve Mundi leden en lidmaatschappen"
                backHref="/beheer"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={exportToXLSX}
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95"
                            title="Exporteer naar Excel"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                        <button
                            onClick={handleSendReminder}
                            disabled={isSendingReminder}
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                            Reminder
                        </button>
                    </div>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AdminStatsBar stats={adminStats} />

                {/* Filters & Search */}
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex p-1 bg-[var(--beheer-card-soft)] rounded-xl w-full lg:w-auto border border-[var(--beheer-border)]">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'active'
                                ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm ring-1 ring-[var(--beheer-border)]'
                                : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'
                                }`}
                        >
                            <UserCheck className="h-3.5 w-3.5" />
                            Actief
                        </button>
                        <button
                            onClick={() => setActiveTab('inactive')}
                            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'inactive'
                                ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm ring-1 ring-[var(--beheer-border)]'
                                : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'
                                }`}
                        >
                            <UserMinus className="h-3.5 w-3.5" />
                            Verlopen
                        </button>
                    </div>

                    <div className="relative flex-1 lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Zoek op naam of email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-5 py-3 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-2 focus:ring-[var(--beheer-accent)]/20 focus:border-[var(--beheer-accent)] outline-none transition-all shadow-sm font-bold uppercase tracking-widest text-[10px]"
                            suppressHydrationWarning
                        />
                        {isPending && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--beheer-accent)]" />}
                    </div>
                </div>

            {/* Main List */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[10px] uppercase font-black tracking-widest text-[var(--beheer-text-muted)]">
                                <th className="px-8 py-4">Lid</th>
                                <th className="px-8 py-4">Contactgegevens</th>
                                <th className="px-8 py-4">Geboortedatum</th>
                                <th className="px-8 py-4">Validiteit</th>
                                <th className="px-8 py-4 text-right">Beheer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredMembers.map((member) => (
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

                {filteredMembers.length === 0 && (
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
        </>
    );
}
