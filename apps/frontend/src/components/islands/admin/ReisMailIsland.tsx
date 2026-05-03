'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    DollarSign,
    UserCheck,
    Clock
} from 'lucide-react';
import { 
    sendBulkTripEmail, 
    sendBulkPaymentEmails 
} from '@/server/actions/reis-admin-signups.actions';
import type { Trip, TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Modular Components
import { TypeTab } from '@/components/admin/reis/MailComponents';
import MailFilters from '@/components/admin/reis/MailFilters';
import MailEditor from '@/components/admin/reis/MailEditor';

interface ReisMailIslandProps {
    trips: Trip[];
    initialSignups: TripSignup[];
    initialSelectedTripId: number;
}

export default function ReisMailIsland({ trips, initialSignups, initialSelectedTripId }: ReisMailIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [selectedTripId, setSelectedTripId] = useState<number>(initialSelectedTripId);
    const [signups, setSignups] = useState<TripSignup[]>(initialSignups);
    const [sending, setSending] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterPayment, setFilterPayment] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Email Config
    const [emailType, setEmailType] = useState<'custom' | 'deposit_request' | 'final_request'>('custom');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        setSignups(initialSignups);
        setSelectedTripId(initialSelectedTripId);
    }, [initialSignups, initialSelectedTripId]);

    const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        router.push(`/beheer/reis/mail?tripId=${id}`);
    };

    const filteredRecipients = useMemo(() => {
        return signups.filter(s => {
            const matchesSearch = `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            const matchesRole = filterRole === 'all' || s.role === filterRole;
            const matchesPayment = 
                filterPayment === 'all' ? true :
                filterPayment === 'unpaid' ? (!s.deposit_paid && !s.full_payment_paid) :
                filterPayment === 'deposit_paid' ? (s.deposit_paid && !s.full_payment_paid) :
                filterPayment === 'full_paid' ? s.full_payment_paid : true;
            
            return matchesSearch && matchesStatus && matchesRole && matchesPayment;
        });
    }, [signups, searchTerm, filterStatus, filterRole, filterPayment]);

    const handleSend = async () => {
        if (filteredRecipients.length === 0) return;
        
        const confirmMsg = emailType === 'custom' 
            ? `Weet je zeker dat je deze email wilt sturen naar ${filteredRecipients.length} deelnemers?`
            : `Weet je zeker dat je een ${emailType === 'deposit_request' ? 'aanbetaling' : 'restbetaling'} verzoek wilt sturen naar ${filteredRecipients.length} deelnemers?`;
            
        if (!confirm(confirmMsg)) return;

        setSending(true);

        try {
            if (emailType === 'custom') {
                const res = await sendBulkTripEmail({
                    tripId: selectedTripId,
                    recipients: filteredRecipients.map(r => ({ email: r.email, name: `${r.first_name} ${r.last_name}` })),
                    subject,
                    message
                });
                if (res.success) {
                    showToast(`Email succesvol verzonden naar ${filteredRecipients.length} deelnemers!`, 'success');
                    setSubject('');
                    setMessage('');
                } else {
                    showToast(res.error || 'Fout bij het verzenden', 'error');
                }
            } else {
                const res = await sendBulkPaymentEmails(
                    selectedTripId, 
                    filteredRecipients.map(r => r.id), 
                    emailType === 'deposit_request' ? 'deposit' : 'final'
                );
                if (res.success) {
                    showToast(`${filteredRecipients.length} betalingsverzoeken succesvol verstuurd!`, 'success');
                } else {
                    showToast(`Verzenden voltooid: ${res.successCount || 0} gelukt, ${res.failCount || 0} mislukt.`, 'info');
                }
            }
        } catch (err) {
            showToast('Er is een onverwachte fout opgetreden', 'error');
        } finally {
            setSending(false);
        }
    };

    const confirmedCount = initialSignups.filter(s => s.status === 'confirmed').length;
    const waitlistCount = initialSignups.filter(s => s.status === 'waitlist').length;
    const unpaidCount = initialSignups.filter(s => !s.full_payment_paid).length;

    const adminStats = [
        { label: 'Deelnemers', value: initialSignups.length, icon: Users, trend: 'Totaal' },
        { label: 'Bevestigd', value: confirmedCount, icon: UserCheck, trend: 'Zeker' },
        { label: 'Wachtlijst', value: waitlistCount, icon: Clock, trend: 'Standby' },
        { label: 'Niet Betaald', value: unpaidCount, icon: DollarSign, trend: 'Openstaand' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Bulk Mail"
                subtitle="Verstuur e-mails naar groepen reizigers"
                backHref="/beheer/reis"
                actions={
                    <div className="flex bg-[var(--beheer-card-soft)] p-1 rounded-xl border border-[var(--beheer-border)] shadow-inner">
                        <TypeTab active={emailType === 'custom'} onClick={() => setEmailType('custom')}>Custom</TypeTab>
                        <TypeTab active={emailType === 'deposit_request'} onClick={() => setEmailType('deposit_request')}>Deposit</TypeTab>
                        <TypeTab active={emailType === 'final_request'} onClick={() => setEmailType('final_request')}>Final</TypeTab>
                    </div>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AdminStatsBar stats={adminStats} />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <MailFilters 
                        trips={trips}
                        selectedTripId={selectedTripId}
                        onTripChange={handleTripChange}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterRole={filterRole}
                        setFilterRole={setFilterRole}
                        filterPayment={filterPayment}
                        setFilterPayment={setFilterPayment}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filteredCount={filteredRecipients.length}
                    />

                    <MailEditor 
                        emailType={emailType}
                        subject={subject}
                        setSubject={setSubject}
                        message={message}
                        setMessage={setMessage}
                        sending={sending}
                        onSend={handleSend}
                        filteredCount={filteredRecipients.length}
                    />
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
