'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Mail, 
    Send, 
    Users, 
    Filter, 
    CheckCircle, 
    AlertCircle, 
    Loader2, 
    ChevronDown, 
    Search,
    Info,
    Layout,
    Check,
    Calendar,
    DollarSign,
    UserCheck,
    History,
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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterPayment, setFilterPayment] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Email Config
    const [emailType, setEmailType] = useState<'custom' | 'deposit_request' | 'final_request'>('custom');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    // Sync state with props when trip changes via URL
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
        setError(null);
        setSuccess(null);

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
                {/* Left Column: Config & Filters */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Trip Selector */}
                    <Card title="Selecteer Reis" icon={<Layout className="h-4 w-4" />}>
                        <div className="relative group">
                            <select 
                                value={selectedTripId}
                                onChange={handleTripChange}
                                className="w-full pl-4 pr-10 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all appearance-none cursor-pointer"
                            >
                                {trips.map(trip => (
                                    <option key={trip.id} value={trip.id}>{trip.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors" />
                        </div>
                    </Card>

                    {/* Filters */}
                    <Card title="Recipients Filter" icon={<Filter className="h-4 w-4" />}>
                        <div className="space-y-4">
                            <FilterField label="Status" value={filterStatus} onChange={setFilterStatus}>
                                <option value="all">Alle Statussen</option>
                                <option value="registered">Geregistreerd</option>
                                <option value="confirmed">Bevestigd</option>
                                <option value="waitlist">Wachtlijst</option>
                                <option value="cancelled">Geannuleerd</option>
                            </FilterField>
                            <FilterField label="Rol" value={filterRole} onChange={setFilterRole}>
                                <option value="all">Alle Rollen</option>
                                <option value="participant">Deelnemer</option>
                                <option value="crew">Crew</option>
                            </FilterField>
                            <FilterField label="Betaling" value={filterPayment} onChange={setFilterPayment}>
                                <option value="all">Alle Betalingen</option>
                                <option value="unpaid">Onbetaald</option>
                                <option value="deposit_paid">Aanbetaling OK</option>
                                <option value="full_paid">Volledig OK</option>
                            </FilterField>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--beheer-text-muted)]" />
                                <input 
                                    type="text" 
                                    placeholder="Zoek deelnemer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-main)] hover:bg-[var(--beheer-border)]/5 border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-[10px] uppercase font-black tracking-widest text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Summary */}
                    <div className="bg-[var(--beheer-accent)]/5 rounded-[var(--beheer-radius)] border border-[var(--beheer-accent)]/20 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-[var(--beheer-accent)]">
                            <Users className="h-5 w-5" />
                            <span className="text-2xl font-black italic">{filteredRecipients.length}</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                            Ontvangers geselecteerd
                        </p>
                    </div>
                </div>

                {/* Right Column: Content Editor */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                        {/* Editor Header */}
                        <div className="p-8 border-b border-[var(--beheer-border)]/50 bg-[var(--beheer-card-soft)]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[var(--beheer-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--beheer-accent)]/20">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Bericht Componeren</h2>
                                        <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest">Verzend bulk communicatie</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editor Body */}
                        <div className="p-8 space-y-8">
                            {emailType === 'custom' ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Onderwerp</label>
                                        <input 
                                            type="text" 
                                            placeholder="Bijv: Belangrijke update over de reis"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="w-full px-6 py-4 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/30 rounded-2xl text-base text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Bericht</label>
                                        <textarea 
                                            rows={12}
                                            placeholder="Typ hier je bericht..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full px-6 py-4 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/30 rounded-2xl text-base text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all resize-none custom-scrollbar"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 bg-[var(--theme-purple)]/5 rounded-3xl border border-[var(--theme-purple)]/10 flex items-start gap-6 animate-in zoom-in-95 duration-500">
                                    <div className="p-4 bg-[var(--theme-purple)]/10 rounded-2xl text-[var(--theme-purple)]">
                                        <Info className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-[var(--text-main)] italic">Automatisch Verzoek</h3>
                                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                            Je staat op het punt om een automatisch gegenereerde <strong>{emailType === 'deposit_request' ? 'aanbetaling' : 'restbetaling'}</strong> email te sturen.
                                            Dit bericht bevat:
                                        </p>
                                        <ul className="space-y-2">
                                            <TickItem>Gepersonaliseerde begroeting</TickItem>
                                            <TickItem>Bedrag informatie en betaallink</TickItem>
                                            <TickItem>Instructies voor de betreffende betaling</TickItem>
                                            {emailType === 'final_request' && <TickItem>Overzicht van geselecteerde activiteiten</TickItem>}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-8 flex items-center justify-between border-t border-[var(--border-color)]/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] italic">
                                    Controleer de filters voordat je verstuurt.
                                </p>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || filteredRecipients.length === 0 || (emailType === 'custom' && (!subject.trim() || !message.trim()))}
                                    className="px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] hover:opacity-95 text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-lg shadow-2xl shadow-[var(--beheer-accent)]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4 group"
                                >
                                    {sending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                    <span className="italic">Verzenden</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}

function Card({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-lg border border-[var(--beheer-border)] p-6">
            <div className="flex items-center gap-2 mb-4 text-[var(--beheer-text-muted)]">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            </div>
            {children}
        </div>
    );
}

function FilterField({ label, value, onChange, children }: { label: string, value: string, onChange: (v: string) => void, children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-tighter text-[var(--text-muted)] ml-1">{label}</label>
            <div className="relative group">
                <select 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all appearance-none cursor-pointer"
                >
                    {children}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors" />
            </div>
        </div>
    );
}

function TypeTab({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                active 
                    ? 'bg-[var(--beheer-accent)] shadow-sm text-white' 
                    : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'
            }`}
        >
            {children}
        </button>
    );
}

function TickItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
            <Check className="h-3 w-3 text-[var(--theme-purple)]" />
            {children}
        </li>
    );
}
