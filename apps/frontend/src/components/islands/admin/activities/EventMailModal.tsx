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
        <div className="fixed inset-0 isolate z-9999 flex items-center justify-center p-4 sm:p-6">
            <div
                className="animate-in fade-in absolute inset-0 bg-slate-950/60 backdrop-blur-xl duration-300"
                onClick={onClose}
            />

            <div
                className="animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-4 relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-4xl border border-(--beheer-border) bg-(--beheer-card-bg) shadow-(--shadow-card-elevated) ring-1 ring-white/10 duration-300 ease-out"
            >
                <div className="relative flex items-center justify-between border-b border-(--beheer-border) bg-(--beheer-card-soft)/80 px-8 py-6">
                    <div className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-(--beheer-accent)/30 to-transparent" />
                    <h2 className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.2em] text-(--beheer-text)">
                        <div className="rounded-2xl bg-(--beheer-accent) p-2.5 text-white shadow-(--shadow-glow)">
                            <Mail className="size-4" />
                        </div>
                        Mail naar Deelnemers
                    </h2>
                    <button
                        onClick={onClose}
                        className="icon-button rounded-full border border-transparent p-2.5 text-(--beheer-text-muted) transition-all hover:border-(--beheer-border) hover:bg-(--beheer-card-bg) hover:text-(--beheer-text) focus:outline-none active:scale-90"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="custom-scrollbar overflow-y-auto px-8 pt-6 pb-8">
                    {error && (
                        <div className="animate-in slide-in-from-top-2 mb-6 flex items-start gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-[10px] font-semibold tracking-widest text-red-500">
                            <XCircle className="size-5 shrink-0" />
                            <span className="leading-relaxed">{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="animate-in slide-in-from-top-2 mb-6 flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-[10px] font-semibold tracking-widest text-emerald-500">
                            <CheckCircle className="size-5 shrink-0" />
                            <span className="leading-relaxed">{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6" autoComplete="off">
                        <div className="space-y-2">
                            <label className="ml-1 text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase opacity-70">Onderwerp</label>
                            <input
                                type="text"
                                placeholder="Bijv: Belangrijke update over de activiteit..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="beheer-input w-full rounded-2xl border border-(--beheer-border)/50 bg-(--bg-main)/50 px-5 py-4 text-sm font-semibold text-(--beheer-text) shadow-inner transition-all outline-none placeholder:opacity-30 focus:bg-(--bg-main) focus:ring-2 focus:ring-(--beheer-accent)"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="ml-1 text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase opacity-70">Bericht</label>
                            <textarea
                                rows={8}
                                placeholder="Typ hier je bericht voor de deelnemers..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="custom-scrollbar beheer-input w-full resize-none rounded-2xl border border-(--beheer-border)/50 bg-(--bg-main)/50 px-5 py-4 text-sm leading-relaxed text-(--beheer-text) shadow-inner transition-all outline-none placeholder:opacity-30 focus:bg-(--bg-main) focus:ring-2 focus:ring-(--beheer-accent)"
                            />
                        </div>

                        <label className="flex cursor-pointer items-center gap-3 select-none">
                            <input
                                type="checkbox"
                                checked={paidOnly}
                                onChange={(e) => setPaidOnly(e.target.checked)}
                                className="size-4 rounded accent-(--beheer-accent)"
                            />
                            <span className="text-[11px] font-semibold text-(--beheer-text-muted)">Alleen betaalde aanmeldingen</span>
                        </label>

                        <div className="flex items-center gap-3 rounded-2xl border border-(--beheer-accent)/10 bg-(--beheer-accent)/5 p-4">
                            <Users className="size-4 shrink-0 text-(--beheer-accent)" />
                            <span className="text-[11px] font-semibold text-(--beheer-text)">
                                {recipients.length} ontvanger{recipients.length === 1 ? '' : 's'} geselecteerd
                            </span>
                            <span className="ml-auto text-[10px] text-(--beheer-text-muted) opacity-60">via BCC, iedereen krijgt een eigen mail</span>
                        </div>

                        <div className="flex gap-4 border-t border-(--beheer-border) pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="active:scale-0.98 beheer-button h-14 flex-1 cursor-pointer rounded-2xl border border-(--beheer-border) text-[10px] font-semibold tracking-widest text-(--beheer-text) transition-all hover:bg-(--beheer-card-soft)"
                                disabled={isLoading}
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || recipients.length === 0 || !subject.trim() || !message.trim()}
                                className="group active:scale-0.98 form-button flex h-14 flex-[1.5] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-(--beheer-accent) text-[10px] font-semibold tracking-widest text-white shadow-(--shadow-glow) transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                {isLoading ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Versturen</span>
                                        <Send className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
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
