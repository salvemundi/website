'use client';

import { useState, useTransition, useMemo } from 'react';
import {
    Bell,
    Download,
    Loader2
} from 'lucide-react';
import { downloadCSV } from '@/lib/utils/export';
import { sendMembershipReminderAction } from '@/server/actions/admin/leden.actions';
import { format, startOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import LedenFilters from './LedenFilters';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import LedenTable from './LedenTable';
import { type AdminMember } from '@salvemundi/validations';

export type Member = AdminMember;

interface LedenOverzichtIslandProps {
    initialMembers?: Member[];
}

export default function LedenOverzichtIsland({
    initialMembers = []
}: LedenOverzichtIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    const isMembershipActive = (m: Member) => {
        if (!m.membership_expiry) return false;
        try {
            // Robust check: handle both string and Date objects
            const expiryDate = new Date(m.membership_expiry);
            if (isNaN(expiryDate.getTime())) return false;

            const today = startOfDay(new Date());
            return startOfDay(expiryDate) >= today;
        } catch (_error) {
            return false;
        }
    };

    const members = initialMembers;

    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const active = isMembershipActive(m);
            const matchesTab = activeTab === 'active' ? active : !active;

            if (!searchQuery) return matchesTab;

            const searchLower = searchQuery.toLowerCase();
            const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
            const email = (m.email || '').toLowerCase();

            return matchesTab && (fullName.includes(searchLower) || email.includes(searchLower));
        });
    }, [members, activeTab, searchQuery]);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Onbekend';
        try {
            return format(new Date(dateString), 'dd-MM-yyyy', { locale: nl });
        } catch (_error) {
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



    return (
        <>
            {/* Global Actions */}
            <div className="flex justify-end gap-3 mb-8">
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-6 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-semibold hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                >
                    <Download className="h-3.5 w-3.5" />
                    Export
                </button>
                <button
                    onClick={() => { void handleSendReminder(); }}
                    disabled={isSendingReminder}
                    className="flex items-center gap-2 px-6 py-2 bg-[var(--beheer-accent)] text-white font-semibold text-xs rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSendingReminder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                    Reminder
                </button>
            </div>



            <LedenFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isPending={isPending}
            />

            <div className="w-full">
                <LedenTable
                    members={filteredMembers}
                    formatDate={formatDate}
                    isMembershipActive={isMembershipActive}
                />
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
