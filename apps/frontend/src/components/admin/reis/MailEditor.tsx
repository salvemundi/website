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
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                {/* Editor Header */}
                <div className="p-6 border-b border-[var(--beheer-border)]/50 bg-[var(--beheer-card-soft)]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[var(--beheer-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--beheer-accent)]/20">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-tight">Bericht Componeren</h2>
                                <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest">Verzend bulk communicatie</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Body */}
                <div className="p-6 space-y-6">
                    {emailType === 'custom' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-0.5">Onderwerp</label>
                                <input 
                                    type="text" 
                                    placeholder="Bijv: Belangrijke update..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/30 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all font-semibold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-0.5">Bericht</label>
                                <textarea 
                                    rows={8}
                                    placeholder="Typ hier je bericht..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/30 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all resize-none custom-scrollbar"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-[var(--theme-purple)]/5 rounded-2xl border border-[var(--theme-purple)]/10 flex items-start gap-4 animate-in zoom-in-95 duration-500">
                            <div className="p-3 bg-[var(--theme-purple)]/10 rounded-xl text-[var(--theme-purple)]">
                                <Info className="h-6 w-6" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-base font-bold text-[var(--text-main)] italic">Automatisch Verzoek</h3>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                    Je staat op het punt om een automatisch <strong>{emailType === 'deposit_request' ? 'aanbetaling' : 'restbetaling'}</strong> email te sturen.
                                </p>
                                <ul className="space-y-1.5">
                                    <TickItem>Gepersonaliseerde begroeting</TickItem>
                                    <TickItem>Bedrag en betaallink</TickItem>
                                    <TickItem>Instructies en overzicht</TickItem>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-6 flex items-center justify-between border-t border-[var(--border-color)]/10">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] italic">
                            Controleer de filters voor verzenden.
                        </p>
                        <button
                            onClick={onSend}
                            disabled={sending || filteredCount === 0 || (emailType === 'custom' && (!subject.trim() || !message.trim()))}
                            className="px-8 py-3 bg-[var(--beheer-accent)] hover:opacity-95 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 group"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                            <span className="italic">Verzenden</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
