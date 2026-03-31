'use client';

import React, { useState } from 'react';
import { 
    X, 
    Bell, 
    Loader2 
} from 'lucide-react';
import { Field, inputClass } from './IntroTabComponents';

interface Props {
    onClose: () => void;
    onSend: (title: string, body: string, includeParents: boolean) => Promise<void>;
    sending: boolean;
}

export default function IntroNotificationModal({ onClose, onSend, sending }: Props) {
    const [notif, setNotif] = useState({ title: '', body: '', includeParents: false });

    const handleSend = async () => {
        if (!notif.title || !notif.body) {
            alert('Vul een titel en bericht in');
            return;
        }
        await onSend(notif.title, notif.body, notif.includeParents);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-[0_0_50px_rgba(0,0,0,0.3)] max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--beheer-text-muted)]">Push Notificatie</h3>
                    <button onClick={onClose} className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-6">
                    <Field label="Titel">
                        <input type="text" value={notif.title} onChange={e => setNotif({ ...notif, title: e.target.value })} placeholder="Notificatie titel..." className={inputClass} />
                    </Field>
                    <Field label="Bericht">
                        <textarea value={notif.body} onChange={e => setNotif({ ...notif, body: e.target.value })} rows={4} placeholder="Wat wil je versturen?" className={inputClass} />
                    </Field>
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={notif.includeParents}
                                onChange={e => setNotif({ ...notif, includeParents: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-[var(--beheer-card-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--beheer-accent)]"></div>
                            <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Inclusief Ouders</span>
                        </label>
                    </div>
                    <div className="bg-[var(--beheer-accent)]/5 border border-[var(--beheer-accent)]/10 rounded-[var(--beheer-radius)] p-4 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)] leading-relaxed">
                        <span className="opacity-60 block mb-1">Let op:</span>
                        Intro aanmeldingen zijn anoniem; notificaties gaan alleen naar ingelogde Intro Ouders.
                    </div>
                </div>
                <div className="flex gap-3 mt-10">
                    <button onClick={handleSend} disabled={sending || (!notif.includeParents && !notif.title)} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[var(--beheer-accent)] text-white rounded-[var(--beheer-radius)] font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 shadow-[var(--shadow-glow)]">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                        {sending ? 'Verzenden...' : 'Versturen'}
                    </button>
                    <button onClick={onClose} disabled={sending} className="px-6 py-4 rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest text-[var(--beheer-text-muted)] border border-transparent hover:bg-[var(--beheer-card-soft)] transition-all">Annuleren</button>
                </div>
            </div>
        </div>
    );
}
