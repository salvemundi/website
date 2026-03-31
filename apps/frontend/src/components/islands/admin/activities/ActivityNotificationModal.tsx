'use client';

import React from 'react';
import { 
    Send, 
    X, 
    Loader2 
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    body: string;
    onTitleChange: (v: string) => void;
    onBodyChange: (v: string) => void;
    onSend: () => void;
    isSending: boolean;
}

export default function ActivityNotificationModal({
    isOpen,
    onClose,
    title,
    body,
    onTitleChange,
    onBodyChange,
    onSend,
    isSending
}: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl max-w-lg w-full p-10 border border-[var(--beheer-border)] scale-in-center relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Glow effect */}
                <div className="absolute -top-24 -right-24 h-48 w-48 bg-[var(--beheer-accent)]/5 blur-3xl rounded-full" />
                
                <div className="flex items-center justify-between mb-8 relative z-10 border-b border-[var(--beheer-border)] pb-6">
                    <h3 className="text-2xl font-black text-[var(--beheer-text)] uppercase tracking-tight">
                        Push Notificatie
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--beheer-border)]/50 rounded-xl transition-all cursor-pointer text-[var(--beheer-text-muted)] group">
                        <X className="h-6 w-6 group-hover:text-[var(--beheer-text)] transition-colors" />
                    </button>
                </div>

                <div className="space-y-6 mb-12 relative z-10">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">
                            Onderwerp / Titel
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
                            placeholder="Belangrijke update..."
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">
                            Bericht Inhoud
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => onBodyChange(e.target.value)}
                            rows={6}
                            className="w-full px-6 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all resize-none font-medium text-sm leading-relaxed"
                            placeholder="Typ hier je bericht naar de deelnemers..."
                        />
                    </div>
                </div>

                <div className="flex gap-4 relative z-10 pt-4">
                    <button
                        onClick={onSend}
                        disabled={isSending || !title || !body}
                        className="flex-1 px-10 py-5 bg-[var(--beheer-accent)] text-white rounded-2xl hover:opacity-90 transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-[var(--beheer-accent)]/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                    >
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span>NU VERSTUREN</span>
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-10 py-5 bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] rounded-2xl hover:bg-[var(--beheer-border)] transition-all font-black text-xs uppercase tracking-widest cursor-pointer border border-[var(--beheer-border)]/50"
                    >
                        X
                    </button>
                </div>
            </div>
        </div>
    );
}
