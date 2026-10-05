'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Mail, Send, XCircle, CheckCircle, Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import { sendBulkEventEmail } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-mail.actions';
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

    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
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
        <div className="modal-wrapper">
            <div
                className="modal-backdrop"
                onClick={onClose}
            />

            <div
                className="modal-content z-10 max-w-xl"
            >
                <div className="modal-header">
                    <h2 className="section-title-sm">
                        <div className="icon-box">
                            <Mail className="size-4" />
                        </div>
                        Mail naar Deelnemers
                    </h2>
                    <button
                        onClick={onClose}
                        className="icon-button"
                        type="button"
                        aria-label="Sluiten"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="custom-scrollbar overflow-y-auto p-6">
                    {error && (
                        <div className="alert-banner-error">
                            <XCircle className="size-5 shrink-0" />
                            <span className="leading-relaxed">{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="alert-banner-success">
                            <CheckCircle className="size-5 shrink-0" />
                            <span className="leading-relaxed">{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-6" autoComplete="off">
                        <div className="space-y-2">
                            <label className="form-label-uppercase">Onderwerp</label>
                            <input
                                type="text"
                                placeholder="Bijv: Belangrijke update over de activiteit..."
                                value={subject}
                                onChange={(event) => setSubject(event.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="form-label-uppercase">Bericht</label>
                            <textarea
                                rows={8}
                                placeholder="Typ hier je bericht voor de deelnemers..."
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                className="form-input custom-scrollbar resize-none"
                            />
                        </div>

                        <label className="radio-option-row">
                            <input
                                type="checkbox"
                                checked={paidOnly}
                                onChange={(event) => setPaidOnly(event.target.checked)}
                                className="checkbox-box-outer"
                            />
                            <span className="text-sm font-medium text-text-main">Alleen betaalde aanmeldingen</span>
                        </label>

                        <div className="beheer-row-card-box">
                            <Users className="size-4 shrink-0 text-theme-purple" />
                            <span className="text-xs font-semibold text-text-main">
                                {recipients.length} ontvanger{recipients.length === 1 ? '' : 's'} geselecteerd
                            </span>
                            <span className="ml-auto text-xs text-text-muted">via BCC, iedereen krijgt een eigen mail</span>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-cancel flex-1"
                                disabled={isLoading}
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || recipients.length === 0 || !subject.trim() || !message.trim()}
                                className="form-button flex-[1.5]"
                            >
                                {isLoading ? (
                                    <Loader2 className="mx-auto size-5 animate-spin" />
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
