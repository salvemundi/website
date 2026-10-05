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
            <div className="group/editor mail-editor-card">
                <div className="mail-editor-glow group-hover/editor:bg-beheer-accent/10" />

                {/* Editor Header */}
                <div className="mail-editor-header">
                    <div className="admin-action-header-row">
                        <div className="flex items-center gap-5">
                            <div className="mail-editor-icon-box">
                                <Mail className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold tracking-tight text-beheer-text">Verstuur bulk communicatie naar geselecteerde groep</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Body */}
                <div className="relative z-10 space-y-8 p-8">
                    {emailType === 'custom' ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="form-label-caption">Onderwerp van de e-mail</label>
                                <input
                                    type="text"
                                    placeholder="Bijv: Belangrijke update over de reis..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="beheer-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="form-label-caption">Inhoud van het bericht</label>
                                <textarea
                                    rows={10}
                                    placeholder="Typ hier je bericht voor de deelnemers..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="beheer-input custom-scrollbar resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mail-editor-alert-card">
                            <div className="mail-editor-alert-icon">
                                <Info className="size-6" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold tracking-tight text-beheer-text">Automatisch Betaalverzoek</h3>
                                <p className="text-sm leading-relaxed font-medium text-beheer-text-muted">
                                    Je staat op het punt om een automatisch <strong>{emailType === 'deposit_request' ? 'aanbetaling' : 'restbetaling'}</strong> email te sturen naar <span className="font-bold text-beheer-accent">{filteredCount}</span> reizigers.
                                </p>
                                <div className="mail-editor-grid">
                                    <TickItem>Gepersonaliseerde aanhef</TickItem>
                                    <TickItem>Directe betaallink (Mollie)</TickItem>
                                    <TickItem>Bedrag details & overzicht</TickItem>
                                    <TickItem>Unieke referentie per mail</TickItem>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mail-editor-footer">
                        <div className="mail-editor-warning-label">
                            <div className="size-1.5 rounded-full bg-geel" />
                            Controleer de filters voor verzenden
                        </div>
                        <button
                            onClick={onSend}
                            disabled={sending || filteredCount === 0 || (emailType === 'custom' && (!subject.trim() || !message.trim()))}
                            className="btn-mail-send"
                            type="button">
                            {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />}
                            <span>Bericht Verzenden</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
