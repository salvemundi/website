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
    Tag
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updatePubCrawlSignup } from '@/server/actions/admin-kroegentocht.actions';

interface SignupFormProps {
    signup: any;
}

export default function SignupForm({ signup }: SignupFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        name: signup?.name || '',
        email: signup?.email || '',
        association: signup?.association || '',
        payment_status: signup?.payment_status || 'open',
        amount_tickets: signup?.amount_tickets || 1,
    });

    const tickets = signup?.tickets || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                await updatePubCrawlSignup(signup.id, signup.pub_crawl_event_id, formData);
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (err) {
                alert('Fout bij opslaan: ' + err);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 overflow-hidden">
                <div className="p-8 border-b border-[var(--border-color)]/30 bg-[var(--bg-main)]/30">
                    <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight flex items-center gap-3">
                        <User className="h-6 w-6 text-[var(--theme-purple)]" />
                        Aanmelding <span className="text-[var(--theme-purple)]">Details</span>
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Beheer gegevens en tickets van de deelnemer</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <User className="h-3 w-3" /> Naam Contactpersoon
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Mail className="h-3 w-3" /> E-mailadres
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)]"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Vereniging
                            </label>
                            <input
                                type="text"
                                value={formData.association}
                                onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 flex items-center gap-2">
                                <Tag className="h-3 w-3" /> Betaalstatus
                            </label>
                            <select
                                value={formData.payment_status}
                                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-bold text-[var(--text-main)] appearance-none"
                            >
                                <option value="paid">✅ Betaald</option>
                                <option value="open">⏳ Open</option>
                                <option value="canceled">❌ Geannuleerd</option>
                                <option value="failed">⚠️ Mislukt</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-color)]/30 pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-[var(--theme-purple)]" />
                                Tickets ({tickets.length})
                            </h3>
                            <span className="px-3 py-1 bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] text-[9px] font-black uppercase rounded-full ring-1 ring-[var(--theme-purple)]/20">
                                {formData.amount_tickets} Gereserveerd
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {tickets.map((ticket: any, idx: number) => (
                                <div key={ticket.id} className="p-4 bg-[var(--bg-main)]/30 rounded-[var(--radius-xl)] border border-[var(--border-color)]/50 flex items-center justify-between group hover:border-[var(--theme-purple)]/30 transition-all">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-black text-[var(--text-main)]">{ticket.name} {ticket.initial}.</p>
                                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-tighter">{ticket.qr_token}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {ticket.checked_in ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black uppercase rounded-full ring-1 ring-green-500/20">
                                                <CheckCircle className="h-3 w-3" /> Check-in ✅
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--text-muted)]/10 text-[var(--text-muted)] text-[9px] font-black uppercase rounded-full ring-1 ring-[var(--text-muted)]/20">
                                                <XCircle className="h-3 w-3 opacity-50" /> Niet binnen
                                            </span>
                                        )}
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)] border border-[var(--border-color)] select-none group-hover:bg-[var(--theme-purple)] group-hover:text-white group-hover:border-[var(--theme-purple)] transition-all">
                                            {idx + 1}
                                        </div>
                                    </div>
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

            <div className="flex justify-between items-center gap-4">
                <Link 
                    href="/beheer/kroegentocht"
                    className="flex items-center gap-2 px-8 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-xl)] text-xs font-black uppercase tracking-widest text-[var(--text-light)] hover:text-[var(--theme-purple)] transition-all active:scale-95 shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Terug naar lijst
                </Link>

                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-5 bg-[var(--theme-purple)] text-white font-black text-sm uppercase tracking-[0.2em] rounded-[var(--radius-xl)] shadow-[var(--shadow-glow)] hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
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
    );
}
