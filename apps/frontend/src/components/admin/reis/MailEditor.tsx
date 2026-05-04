'use client';

import { Mail, Loader2, Send, Info } from 'lucide-react';
import { TickItem } from './MailComponents';

interface MailEditorProps {
    emailType: 'custom' | 'deposit_request' | 'final_request';
    subject: string;
    setSubject: (v: string) => void;
    message: string;
    setMessage: (v: string) => void;
    sending: boolean;
    onSend: () => void;
    filteredCount: number;
}

export default function MailEditor({
    emailType,
    subject,
    setSubject,
    message,
    setMessage,
    sending,
    onSend,
    filteredCount
}: MailEditorProps) {
    return (
        <div className="lg:col-span-3 space-y-8">
            <div className="bg-[var(--beheer-card-bg)] rounded-3xl shadow-xl border border-[var(--beheer-border)] overflow-hidden relative group/editor">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--beheer-accent)]/5 rounded-full blur-3xl group-hover/editor:bg-[var(--beheer-accent)]/10 transition-colors duration-700" />

                {/* Editor Header */}
                <div className="p-8 border-b border-[var(--beheer-border)]/30 bg-[var(--beheer-card-soft)]/30 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-[var(--beheer-accent)] text-white flex items-center justify-center shadow-xl shadow-[var(--beheer-accent)]/20">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-[var(--beheer-text)] tracking-tight">Bericht Componeren</h2>
                                <p className="text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">Verstuur bulk communicatie naar geselecteerde groep</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Body */}
                <div className="p-8 space-y-8 relative z-10">
                    {emailType === 'custom' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] ml-1 opacity-70">Onderwerp van de e-mail</label>
                                <input 
                                    type="text" 
                                    placeholder="Bijv: Belangrijke update over de reis..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border border-[var(--beheer-border)]/50 rounded-2xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)] transition-all font-semibold shadow-inner outline-none placeholder:opacity-30"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] ml-1 opacity-70">Inhoud van het bericht</label>
                                <textarea 
                                    rows={10}
                                    placeholder="Typ hier je bericht voor de deelnemers..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border border-[var(--beheer-border)]/50 rounded-2xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)] transition-all resize-none custom-scrollbar shadow-inner outline-none placeholder:opacity-30 leading-relaxed"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-[var(--beheer-accent)]/5 rounded-3xl border border-[var(--beheer-accent)]/10 flex items-start gap-6 animate-in zoom-in-95 duration-500">
                            <div className="p-4 bg-[var(--beheer-accent)]/10 rounded-2xl text-[var(--beheer-accent)] shadow-sm">
                                <Info className="h-6 w-6" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-[var(--beheer-text)] tracking-tight">Automatisch Betaalverzoek</h3>
                                <p className="text-sm text-[var(--beheer-text-muted)] leading-relaxed font-medium">
                                    Je staat op het punt om een automatisch <strong>{emailType === 'deposit_request' ? 'aanbetaling' : 'restbetaling'}</strong> email te sturen naar <span className="text-[var(--beheer-accent)] font-bold">{filteredCount}</span> reizigers.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                                    <TickItem>Gepersonaliseerde aanhef</TickItem>
                                    <TickItem>Directe betaallink (Mollie)</TickItem>
                                    <TickItem>Bedrag details & overzicht</TickItem>
                                    <TickItem>Unieke referentie per mail</TickItem>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[var(--beheer-border)]/30">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50 italic">
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                            Controleer de filters voor verzenden
                        </div>
                        <button
                            onClick={onSend}
                            disabled={sending || filteredCount === 0 || (emailType === 'custom' && (!subject.trim() || !message.trim()))}
                            className="w-full sm:w-auto px-10 py-4 bg-[var(--beheer-accent)] text-white rounded-2xl font-semibold uppercase tracking-widest text-[10px] shadow-xl hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group border border-white/10 transition-all"
                        >
                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                            <span>Bericht Verzenden</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
