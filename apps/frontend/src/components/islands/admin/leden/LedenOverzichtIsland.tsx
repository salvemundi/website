'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import {
    Bell,
    Download,
    Loader2
} from 'lucide-react';
import { downloadCSV } from '@/lib/utils/export';
import { sendMembershipReminderAction } from '@/server/actions/admin/leden.actions';
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
        safeConsoleError('[LedenOverzicht][formatDate]', error);
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
            safeConsoleError('[LedenOverzicht][isMembershipActive]', error);
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

    const handleSendReminder = async () => {
        if (!confirm('Herinnering sturen naar alle leden (binnen 30 dagen verlenging)?')) return;

        setIsSendingReminder(true);
        try {
            const res = await sendMembershipReminderAction(30);
            if (res.success) {
                showToast(res.count === 0 ? 'Geen leden gevonden.' : `Herinnering verstuurd naar ${res.count} leden!`, 'success');
            } else {
                showToast(res.error || 'Fout bij versturen', 'error');
            }
        } catch (error) {
            safeConsoleError('[LedenOverzicht][handleSendReminder]', error);
            showToast('Er is een onverwachte fout opgetreden', 'error');
        } finally {
            setIsSendingReminder(false);
        }
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