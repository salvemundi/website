'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    UserCheck,
    UserMinus,
    Bell,
    Download,
    Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { sendMembershipReminderAction } from '@/server/actions/leden.actions';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import LedenFilters from './LedenFilters';
import LedenTable from './LedenTable';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    membership_expiry: string | null;
    status: string;
}

interface LedenOverzichtIslandProps {
    members: Member[];
    totalCount: number;
    searchQuery: string;
}

export default function LedenOverzichtIsland({ 
    members, 
    totalCount, 
    searchQuery: initialSearchQuery
}: LedenOverzichtIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
    const isMembershipActive = (m: Member) => {
        if (!m.membership_expiry) return false;
        const todayStr = new Date().toISOString().substring(0, 10);
        return m.membership_expiry.substring(0, 10) >= todayStr;
    };

    // Local search filtering
    const filteredMembers = members.filter(m => {
        const active = isMembershipActive(m);
        const matchesTab = activeTab === 'active' ? active : !active;
        
        if (!searchQuery) return matchesTab;

        const searchLower = searchQuery.toLowerCase();
        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
        const email = (m.email || '').toLowerCase();
        
        return matchesTab && (fullName.includes(searchLower) || email.includes(searchLower));
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
            showToast(res.count === 0 ? 'Geen leden gevonden voor herinnering.' : `Herinnering verstuurd naar ${res.count} lid/leden!`, res.count === 0 ? 'info' : 'success');
        } else {
            showToast(res.error || 'Fout bij versturen van herinneringen', 'error');
        }
        setIsSendingReminder(false);
    };

    const exportToXLSX = () => {
        const data = filteredMembers.map(m => ({
            Naam: `${m.first_name} ${m.last_name}`,
            Email: m.email,
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

    const adminStats = [
        { label: 'Totaal', value: totalCount, icon: Users, trend: 'Accounts' },
        { label: 'Actief', value: activeCount, icon: UserCheck, trend: 'Leden' },
        { label: 'Verlopen', value: inactiveCount, icon: UserMinus, trend: 'Niet Actief' },
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

                <LedenFilters 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isPending={isPending}
                />

                <LedenTable 
                    members={filteredMembers}
                    isPending={isPending}
                    formatDate={formatDate}
                    isMembershipActive={isMembershipActive}
                />
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
