'use client';

import { Mail, Loader2, Send, Info } from 'lucide-react';
import { TickItem } from './MailComponents';

interface MailEditorProps {
    emailType: 'custom' | 'deposit_request' | 'final_request';
    subject: string;
    setSubject: (subjectText: string) => void;
    message: string;
    setMessage: (messageText: string) => void;
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
        <div className="space-y-8 lg:col-span-3">
            <div className="group/editor relative overflow-hidden rounded-3xl border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
                <div className="absolute -top-24 -right-24 size-48 rounded-full bg-(--beheer-accent)/5 blur-3xl transition-colors duration-700 group-hover/editor:bg-(--beheer-accent)/10" />

                {/* Editor Header */}
                <div className="relative z-10 border-b border-(--beheer-border)/30 bg-(--beheer-card-soft)/30 p-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-(--beheer-accent) text-white shadow-(--beheer-accent)/20 shadow-xl">
                                <Mail className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold tracking-tight text-(--beheer-text)">Verstuur bulk communicatie naar geselecteerde groep</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Body */}
                <div className="relative z-10 space-y-8 p-8">
                    {emailType === 'custom' ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="ml-1 text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase opacity-70">Onderwerp van de e-mail</label>
                                <input
                                    type="text"
                                    placeholder="Bijv: Belangrijke update over de reis..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="beheer-input w-full rounded-2xl border border-(--beheer-border)/50 bg-(--bg-main)/50 px-5 py-4 text-sm font-semibold text-(--beheer-text) shadow-inner transition-all outline-none placeholder:opacity-30 focus:bg-(--bg-main) focus:ring-2 focus:ring-(--beheer-accent)"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="ml-1 text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase opacity-70">Inhoud van het bericht</label>
                                <textarea
                                    rows={10}
                                    placeholder="Typ hier je bericht voor de deelnemers..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="custom-scrollbar beheer-input w-full resize-none rounded-2xl border border-(--beheer-border)/50 bg-(--bg-main)/50 px-5 py-4 text-sm leading-relaxed text-(--beheer-text) shadow-inner transition-all outline-none placeholder:opacity-30 focus:bg-(--bg-main) focus:ring-2 focus:ring-(--beheer-accent)"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-6 rounded-3xl border border-(--beheer-accent)/10 bg-(--beheer-accent)/5 p-8">
                            <div className="rounded-2xl bg-(--beheer-accent)/10 p-4 text-(--beheer-accent) shadow-sm">
                                <Info className="size-6" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold tracking-tight text-(--beheer-text)">Automatisch Betaalverzoek</h3>
                                <p className="text-sm leading-relaxed font-medium text-(--beheer-text-muted)">
                                    Je staat op het punt om een automatisch <strong>{emailType === 'deposit_request' ? 'aanbetaling' : 'restbetaling'}</strong> email te sturen naar <span className="font-bold text-(--beheer-accent)">{filteredCount}</span> reizigers.
                                </p>
                                <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                                    <TickItem>Gepersonaliseerde aanhef</TickItem>
                                    <TickItem>Directe betaallink (Mollie)</TickItem>
                                    <TickItem>Bedrag details & overzicht</TickItem>
                                    <TickItem>Unieke referentie per mail</TickItem>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col items-center justify-between gap-6 border-t border-(--beheer-border)/30 pt-8 sm:flex-row">
                        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase italic opacity-50">
                            <div className="size-1.5 rounded-full bg-yellow-500" />
                            Controleer de filters voor verzenden
                        </div>
                        <button
                            onClick={onSend}
                            disabled={sending || filteredCount === 0 || (emailType === 'custom' && (!subject.trim() || !message.trim()))}
                            className="group form-button flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-(--beheer-accent) px-10 py-4 text-[10px] font-semibold tracking-widest text-white uppercase shadow-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 sm:w-auto"
                        >
                            {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />}
                            <span>Bericht Verzenden</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
