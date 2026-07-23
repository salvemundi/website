'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Mail, Send, XCircle, CheckCircle, Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import { sendBulkEventEmail } from '@/server/actions/admin/activiteiten/admin-activiteiten-mail.actions';
import { getSignupName, getSignupEmail } from '@/lib/activities/activity-signup.utils';
import { type Signup } from './ActiviteitAanmeldingenIsland';

interface EventMailModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number | string;
    eventName: string;
    signups: Signup[];
}

export default function EventMailModal({ isOpen, onClose, eventId, eventName, signups }: EventMailModalProps) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [paidOnly, setPaidOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const resetForm = () => {
        setSubject('');
        setMessage('');
        setPaidOnly(false);
        setIsLoading(false);
        setError(null);
        setSuccessMessage(null);
    };

    useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [isOpen]);

    const recipients = useMemo(() => {
        const filtered = paidOnly ? signups.filter(s => s.payment_status === 'paid') : signups;
        const byEmail = new Map<string, { email: string; name: string }>();
        for (const signup of filtered) {
            const email = getSignupEmail(signup);
            if (!email || email === '-') continue;
            const key = email.toLowerCase();
            if (!byEmail.has(key)) {
                byEmail.set(key, { email, name: getSignupName(signup) });
            }
        }
        return Array.from(byEmail.values());
    }, [signups, paidOnly]);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError(null);

        if (recipients.length === 0) {
            setError('Geen ontvangers geselecteerd');
            return;
        }
        if (!subject.trim() || !message.trim()) {
            setError('Vul een onderwerp en bericht in');
            return;
        }
        if (!confirm(`Weet je zeker dat je deze e-mail wilt sturen naar ${recipients.length} deelnemers? Iedereen ontvangt zijn eigen e-mail (BCC), niemand ziet de andere adressen.`)) {
            return;
        }

        setIsLoading(true);
        const res = await sendBulkEventEmail({
            eventId: Number(eventId),
            eventName,
            recipients,
            subject,
            message
        });

        if (res.success) {
            setSuccessMessage(`E-mail succesvol verzonden naar ${recipients.length} deelnemers!`);
            setSubject('');
            setMessage('');
            setTimeout(() => onClose(), 1200);
        } else {
            setError(res.error || 'Er is een fout opgetreden.');
        }
        setIsLoading(false);
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 isolate">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div
                className="bg-(--beheer-card-bg) w-full max-w-xl rounded-4xl shadow-(--shadow-card-elevated) ring-1 ring-white/10 overflow-hidden flex flex-col max-h-[90vh] relative z-10 border border-(--beheer-border) animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-4 duration-300 ease-out"
            >
                <div className="px-8 py-6 border-b border-(--beheer-border) flex justify-between items-center bg-(--beheer-card-soft)/80 relative">
                    <div className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-(--beheer-accent)/30 to-transparent" />
                    <h2 className="text-[10px] font-semibold text-(--beheer-text) tracking-[0.2em] flex items-center gap-3">
                        <div className="bg-(--beheer-accent) text-white p-2.5 rounded-2xl shadow-(--shadow-glow)">
                            <Mail className="h-4 w-4" />
                        </div>
                        Mail naar Deelnemers
                    </h2>
                    <button
                        onClick={onClose}
                        className="icon-button text-(--beheer-text-muted) hover:text-(--beheer-text) hover:bg-(--beheer-card-bg) p-2.5 rounded-full transition-all active:scale-90 focus:outline-none border border-transparent hover:border-(--beheer-border)"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-8 pb-8 pt-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-semibold tracking-widest border border-red-500/20 flex items-start gap-4 animate-in slide-in-from-top-2">
                            <XCircle className="h-5 w-5 shrink-0" />
                            <span className="leading-relaxed">{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[10px] font-semibold tracking-widest border border-emerald-500/20 flex items-center gap-4 animate-in slide-in-from-top-2">
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <span className="leading-relaxed">{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6" autoComplete="off">
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-(--beheer-text-muted) ml-1 opacity-70">Onderwerp</label>
                            <input
                                type="text"
                                placeholder="Bijv: Belangrijke update over de activiteit..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="beheer-input w-full px-5 py-4 bg-(--bg-main)/50 border border-(--beheer-border)/50 rounded-2xl text-sm text-(--beheer-text) focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main) transition-all font-semibold shadow-inner outline-none placeholder:opacity-30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-(--beheer-text-muted) ml-1 opacity-70">Bericht</label>
                            <textarea
                                rows={8}
                                placeholder="Typ hier je bericht voor de deelnemers..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="beheer-input w-full px-5 py-4 bg-(--bg-main)/50 border border-(--beheer-border)/50 rounded-2xl text-sm text-(--beheer-text) focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main) transition-all resize-none custom-scrollbar shadow-inner outline-none placeholder:opacity-30 leading-relaxed"
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={paidOnly}
                                onChange={(e) => setPaidOnly(e.target.checked)}
                                className="h-4 w-4 rounded accent-(--beheer-accent)"
                            />
                            <span className="text-[11px] font-semibold text-(--beheer-text-muted)">Alleen betaalde aanmeldingen</span>
                        </label>

                        <div className="flex items-center gap-3 p-4 bg-(--beheer-accent)/5 rounded-2xl border border-(--beheer-accent)/10">
                            <Users className="h-4 w-4 text-(--beheer-accent) shrink-0" />
                            <span className="text-[11px] font-semibold text-(--beheer-text)">
                                {recipients.length} ontvanger{recipients.length === 1 ? '' : 's'} geselecteerd
                            </span>
                            <span className="text-[10px] text-(--beheer-text-muted) opacity-60 ml-auto">via BCC, iedereen krijgt een eigen mail</span>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-(--beheer-border)">
                            <button
                                type="button"
                                onClick={onClose}
                                className="beheer-button flex-1 h-14 rounded-2xl font-semibold tracking-widest text-[10px] border border-(--beheer-border) text-(--beheer-text) hover:bg-(--beheer-card-soft) transition-all active:scale-[0.98] cursor-pointer"
                                disabled={isLoading}
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || recipients.length === 0 || !subject.trim() || !message.trim()}
                                className="form-button flex-[1.5] h-14 rounded-2xl font-semibold tracking-widest text-[10px] bg-(--beheer-accent) text-white shadow-(--shadow-glow) hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/10 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Versturen</span>
                                        <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
