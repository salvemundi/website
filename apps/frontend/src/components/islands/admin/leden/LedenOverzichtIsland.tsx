'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    UserCheck,
    UserMinus,
    Bell,
    Download,
    Loader2
} from 'lucide-react';
import { downloadCSV } from '@/lib/utils/export';
import { sendMembershipReminderAction } from '@/server/actions/leden.actions';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import LedenFilters from './LedenFilters';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { cn } from '@/lib/utils/cn';
import LedenTable from './LedenTable';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    membership_expiry: string | null;
    status: string;
}

interface LedenOverzichtIslandProps {
    isLoading?: boolean;
    initialMembers?: Member[];
    initialTotalCount?: number;
}

export default function LedenOverzichtIsland({ 
    isLoading = false,
    initialMembers = [], 
    initialTotalCount = 0
}: LedenOverzichtIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    const isMembershipActive = (m: Member) => {
        if (!m.membership_expiry) return false;
        const todayStr = new Date().toISOString().substring(0, 10);
        return m.membership_expiry.substring(0, 10) >= todayStr;
    };

    const members = initialMembers;
    const totalCount = initialTotalCount;

    const filteredMembers = useMemo(() => {
        if (isLoading) return [];
        
        return members.filter(m => {
            const active = isMembershipActive(m);
            const matchesTab = activeTab === 'active' ? active : !active;
            
            if (!searchQuery) return matchesTab;

            const searchLower = searchQuery.toLowerCase();
            const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
            const email = (m.email || '').toLowerCase();
            
            return matchesTab && (fullName.includes(searchLower) || email.includes(searchLower));
        });
    }, [members, activeTab, searchQuery, isLoading]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return format(new Date(dateString), 'dd-MM-yyyy', { locale: nl });
        } catch (e) {
            return 'Onbekend';
        }
    };

    const handleSendReminder = async () => {
        if (!confirm('Herinnering sturen naar alle leden (binnen 30 dagen verlenging)?')) return;
        
        setIsSendingReminder(true);
        const res = await sendMembershipReminderAction(30);
        if (res.success) {
            showToast(res.count === 0 ? 'Geen leden gevonden.' : `Herinnering verstuurd naar ${res.count} leden!`, 'success');
        } else {
            showToast(res.error || 'Fout bij versturen', 'error');
        }
        setIsSendingReminder(false);
    };

    const exportToCSV = () => {
        const data = filteredMembers.map(m => ({
            Naam: `${m.first_name} ${m.last_name}`,
            Email: m.email,
            'Lidmaatschap Tot': formatDate(m.membership_expiry),
            Status: isMembershipActive(m) ? 'Actief' : 'Niet Actief'
        }));
        downloadCSV(data, `Leden_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };

    const activeCount = members.filter(m => isMembershipActive(m)).length;
    const inactiveCount = members.filter(m => !isMembershipActive(m)).length;

    const adminStats = [
        { label: 'Totaal', value: totalCount, icon: Users, trend: 'Accounts' },
        { label: 'Actief', value: activeCount, icon: UserCheck, trend: 'Leden' },
        { label: 'Verlopen', value: inactiveCount, icon: UserMinus, trend: 'Niet Actief' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl" aria-busy={isLoading}>
            {/* Global Actions */}
            <div className="flex justify-end gap-3 mb-8">
                <button
                    onClick={exportToCSV}
                    disabled={isLoading}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 shadow-sm disabled:opacity-50",
                        isLoading && "ghost-active"
                    )}
                >
                    <Download className="h-3.5 w-3.5" />
                    Export
                </button>
                <button
                    onClick={handleSendReminder}
                    disabled={isSendingReminder || isLoading}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 bg-[var(--beheer-accent)] text-white font-black text-[10px] uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50",
                        isLoading && "ghost-active"
                    )}
                >
                    {isSendingReminder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                    Reminder
                </button>
            </div>

            <AdminStatsBar stats={adminStats} isLoading={isLoading} />

            <LedenFilters 
                isLoading={isLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isPending={isPending}
            />

            <div className={cn("w-full", isLoading && "ghost-active")}>
                <LedenTable 
                    isLoading={isLoading}
                    members={filteredMembers}
                    isPending={isPending}
                    formatDate={formatDate}
                    isMembershipActive={isMembershipActive}
                />
            </div>
            
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
