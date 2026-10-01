'use client';

import { useState, useMemo, useTransition } from 'react';
import { downloadCSV } from '@/lib/utils/export';
import { sendMembershipReminderAction } from '@/server/actions/beheer/leden/beheer-leden-membership.actions';
import LedenFilters from './LedenFilters';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import LedenTable from './LedenTable';
import { type BeheerMember } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';
import { isMembershipActive } from '@/lib/leden/leden-utils';

export type Member = BeheerMember;

interface LedenOverzichtIslandProps {
    initialMembers?: Member[];
}

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

            <BeheerToast toast={toast} onClose={hideToast} />
        </>
    );
}