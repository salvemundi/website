'use client';

import { useState, useTransition } from 'react';
import { 
    Save, 
    Loader2, 
    ArrowLeft, 
    User, 
    Mail, 
    Building2, 
    Ticket, 
    CheckCircle,
    XCircle,
    Tag,
    RefreshCw,
    Edit2,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updatePubCrawlSignup, togglePubCrawlTicketCheckIn, updatePubCrawlTickets, deletePubCrawlSignup } from '@/server/actions/admin-kroegentocht.actions';
import { Trash2 } from 'lucide-react';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

import { type EnrichedPubCrawlSignup } from '@/server/actions/kroegentocht-db.utils';

interface SignupFormProps {
    signup: EnrichedPubCrawlSignup;
}

export default function SignupForm({ signup }: SignupFormProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: signup?.name || '',
        email: signup?.email || '',
        association: signup?.association || '',
        payment_status: signup?.payment_status || 'open',
        amount_tickets: signup?.amount_tickets || 1 });
    const [ticketsData, setTicketsData] = useState(signup?.tickets || []);
    const [editingTicketId, setEditingTicketId] = useState<number | null>(null);

    const tickets = signup?.tickets || [];

    const handleToggleCheckIn = async (ticketId: number, currentStatus: boolean) => {
        if (togglingId) return;
        setTogglingId(ticketId);
        try {
            await togglePubCrawlTicketCheckIn(ticketId, currentStatus, Number(signup.pub_crawl_event_id?.id || 0));
            showToast('Kaart status bijgewerkt', 'success');
            router.refresh();
        } catch (err) {
            showToast('Fout bij bijwerken: ' + err, 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleTicketChange = (id: number, field: 'name' | 'initial', value: string) => {
        setTicketsData(prev => prev.map(t => 
            t.id === id ? { ...t, [field]: field === 'initial' ? value.slice(0, 1).toUpperCase() : value } : t
        ));
    };

    const handleDeleteSignup = async () => {
        if (!window.confirm('Weet je zeker dat je deze volledige aanmelding wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
        
        startTransition(async () => {
            try {
                await deletePubCrawlSignup(Number(signup.id), Number(signup.pub_crawl_event_id?.id || 0));
                showToast('Aanmelding verwijderd', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (err) {
                showToast('Fout bij verwijderen: ' + err, 'error');
            }
        });
    };

    const handleDeleteTicket = async (ticketId: number) => {
        if (!window.confirm('Weet je zeker dat je dit ticket wilt verwijderen?')) return;
        
        const { deletePubCrawlTicket } = await import('@/server/actions/admin-kroegentocht.actions');
        
        startTransition(async () => {
            try {
                await deletePubCrawlTicket(ticketId, Number(signup.id), Number(signup.pub_crawl_event_id?.id || 0));
                showToast('Ticket verwijderd', 'success');
                router.refresh();
            } catch (err) {
                showToast('Fout bij verwijderen ticket: ' + err, 'error');
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                const eventId = Number(signup.pub_crawl_event_id?.id || 0);
                await Promise.all([
                    updatePubCrawlSignup(Number(signup.id), eventId, formData),
                    updatePubCrawlTickets(Number(signup.id), eventId, ticketsData.map(t => ({
                        id: Number(t.id),
                        name: t.name,
                        initial: t.initial
                    })))
                ]);
                
                showToast('Aanmelding en tickets succesvol bijgewerkt', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (err) {
                showToast('Fout bij opslaan: ' + err, 'error');
            }
        });
    };

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto" autoComplete="off">
            <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 overflow-hidden">
                <div className="p-8 border-b border-[var(--border-color)]/30 bg-[var(--bg-main)]/30">
                    <h2 className="text-2xl font-semibold text-[var(--text-main)] tracking-tight flex items-center gap-3">
                        <User className="h-6 w-6 text-[var(--theme-purple)]" />
                        Aanmelding <span className="text-[var(--theme-purple)]">Details</span>
                    </h2>
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-1">Beheer gegevens en tickets van de deelnemer</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <User className="h-3 w-3" /> Naam
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)]"
                                required
                                autoComplete="off"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Mail className="h-3 w-3" /> E-mailadres
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)]"
                                required
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Vereniging
                            </label>
                            <input
                                type="text"
                                value={formData.association}
                                onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)]"
                                autoComplete="off"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Tag className="h-3 w-3" /> Betaalstatus
                            </label>
                            <div className="relative group">
                                <select
                                    value={formData.payment_status}
                                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as "paid" | "open" | "failed" | "canceled" | "expired" })}
                                    className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)] appearance-none cursor-pointer hover:border-[var(--theme-purple)]/30"
                                    autoComplete="off"
                                >
                                    <option value="paid" className="bg-[var(--bg-card)] text-[var(--text-main)]">Paid</option>
                                    <option value="open" className="bg-[var(--bg-card)] text-[var(--text-main)]">Open</option>
                                    <option value="canceled" className="bg-[var(--bg-card)] text-[var(--text-main)]">Canceled</option>
                                    <option value="failed" className="bg-[var(--bg-card)] text-[var(--text-main)]">Failed</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover:text-[var(--theme-purple)] transition-colors">
                                    <ArrowLeft className="h-4 w-4 -rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-color)]/30 pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-[var(--theme-purple)]" />
                                Tickets ({tickets.length})
                            </h3>
                            <span className="px-3 py-1 bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] text-[9px] font-semibold rounded-full ring-1 ring-[var(--theme-purple)]/20">
                                {formData.amount_tickets} Gereserveerd
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ticketsData.map((ticket, idx) => (
                                <div key={ticket.id} className="p-4 bg-[var(--bg-main)]/30 rounded-[var(--radius-xl)] border border-[var(--border-color)]/50 flex flex-col gap-3 group hover:border-[var(--theme-purple)]/30 transition-all relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--border-color)] select-none group-hover:bg-[var(--theme-purple)] group-hover:text-white group-hover:border-[var(--theme-purple)] transition-all">
                                                {idx + 1}
                                            </div>
                                            {!editingTicketId || editingTicketId !== ticket.id ? (
                                                <div className="flex items-center gap-1 transition-all">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setEditingTicketId(Number(ticket.id))}
                                                        className="p-1 text-[var(--text-muted)] hover:text-[var(--theme-purple)]"
                                                        title="Naam aanpassen"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeleteTicket(Number(ticket.id))}
                                                        className="p-1 text-[var(--text-muted)] hover:text-red-500"
                                                        title="Ticket verwijderen"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditingTicketId(null)}
                                                    className="p-1 text-[var(--theme-purple)] hover:text-[var(--text-main)] transition-all"
                                                    title="Sluiten"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => handleToggleCheckIn(Number(ticket.id), !!ticket.checked_in)}
                                            disabled={!!togglingId}
                                            className="transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {ticket.checked_in ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-semibold rounded-full ring-1 ring-green-500/20 hover:bg-green-500/20 transition-all">
                                                    {togglingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                                    Checked-in
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-semibold rounded-full ring-1 ring-red-500/20 hover:bg-red-500/20 transition-all">
                                                    {togglingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 opacity-50" />}
                                                    Inschrijven
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {editingTicketId === ticket.id ? (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1 block">Naam</label>
                                                <input
                                                    type="text"
                                                    value={ticket.name}
                                                    onChange={(e) => handleTicketChange(Number(ticket.id), 'name', e.target.value)}
                                                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] focus:border-[var(--theme-purple)] transition-all"
                                                    autoFocus
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <div className="w-16">
                                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1 block">Init.</label>
                                                <input
                                                    type="text"
                                                    value={ticket.initial}
                                                    onChange={(e) => handleTicketChange(Number(ticket.id), 'initial', e.target.value)}
                                                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] text-center focus:border-[var(--theme-purple)] transition-all"
                                                    maxLength={1}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            className="cursor-pointer group/name" 
                                            onClick={() => setEditingTicketId(Number(ticket.id))}
                                        >
                                            <p className="text-sm font-bold text-[var(--text-main)] group-hover/name:text-[var(--theme-purple)] transition-colors">
                                                {ticket.name} {ticket.initial && <span className="opacity-50 text-[10px] uppercase">{ticket.initial}.</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {tickets.length === 0 && (
                                <div className="text-center py-8 bg-[var(--bg-main)]/30 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border-color)]/30">
                                    <p className="text-xs text-[var(--text-subtle)] font-medium italic">Geen tickets gegenereerd. Deze verschijnen zodra de betaling op "Betaald" staat.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-4 w-full md:w-auto">
                    <button 
                        type="button"
                        onClick={() => setFormData({
                            name: signup?.name || '',
                            email: signup?.email || '',
                            association: signup?.association || '',
                            payment_status: signup?.payment_status || 'open',
                            amount_tickets: signup?.amount_tickets || 1 })}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-xl)] text-xs font-semibold text-[var(--text-light)] hover:text-[var(--theme-purple)] transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reset
                    </button>

                    <button 
                        type="button"
                        onClick={handleDeleteSignup}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-xl)] text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                        <Trash2 className="h-4 w-4" />
                        Verwijder Aanmelding
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-[var(--theme-purple)] text-white font-semibold text-sm rounded-[var(--radius-xl)] shadow-[var(--shadow-glow)] hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    Wijzigingen Opslaan
                </button>
            </div>
        </form>
        <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
