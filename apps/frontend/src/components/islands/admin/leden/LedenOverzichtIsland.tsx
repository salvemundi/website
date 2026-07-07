'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import { downloadCSV } from '@/lib/utils/export';
import { sendMembershipReminderAction } from '@/server/actions/admin/leden/admin-leden-membership.actions';
import LedenFilters from './LedenFilters';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import LedenTable from './LedenTable';
import { type AdminMember } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';

export type Member = AdminMember;

interface LedenOverzichtIslandProps {
    initialMembers?: Member[];
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Onbekend';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Onbekend';
        return new Intl.DateTimeFormat('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(d);
    } catch (error) {
        safeConsoleError('[LedenOverzichtIsland.tsx][formatDate] ', error);
        return 'Onbekend';
    }
};

export default function LedenOverzichtIsland({
    initialMembers = []
}: LedenOverzichtIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    const isMembershipActive = useCallback((m: Member) => {
        if (!m.membership_expiry) return false;
        try {
            const expiryDate = new Date(m.membership_expiry);
            if (isNaN(expiryDate.getTime())) return false;

            const today = startOfDay(new Date());
            return startOfDay(expiryDate) >= today;
        } catch (error) {
            safeConsoleError('[LedenOverzichtIsland.tsx][LedenOverzichtIsland] ', error);
            return false;
        }
    }, []);

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
    }, [members, activeTab, searchQuery, isMembershipActive]);

    const handleSendReminder = () => {
        if (!confirm('Herinnering sturen naar alle leden (binnen 30 dagen verlenging)?')) return;

        setIsSendingReminder(true);
        void (async () => {
            try {
                const res = await sendMembershipReminderAction(30);
                if (res.success) {
                    showToast(res.count === 0 ? 'Geen leden gevonden.' : `Herinnering verstuurd naar ${res.count} leden!`, 'success');
                } else {
                    showToast(res.error || 'Fout bij versturen', 'error');
                }
            } catch (error) {
                safeConsoleError('[LedenOverzichtIsland.tsx][LedenOverzichtIsland] ', error);
                showToast('Er is een onverwachte fout opgetreden', 'error');
            } finally {
                setIsSendingReminder(false);
            }
        })();
    };

    const exportToCSV = () => {
        const dateStr = new Date().toISOString().split('T')[0];
        const data = filteredMembers.map(m => ({
            Naam: `${m.first_name} ${m.last_name}`,
            Email: m.email,
            'Lidmaatschap Tot': formatDate(m.membership_expiry),
            Status: isMembershipActive(m) ? 'Actief' : 'Niet Actief'
        }));
        downloadCSV(data, `Leden_${dateStr}.csv`);
    };

    return (
        <>
            <LedenFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isPending={isPending}
                onExport={exportToCSV}
                onReminder={handleSendReminder}
                isSendingReminder={isSendingReminder}
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