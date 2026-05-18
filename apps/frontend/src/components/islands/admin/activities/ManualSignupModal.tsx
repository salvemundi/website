'use client';

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Loader2, User, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { createManualSignupAction } from '@/server/actions/admin/aanmeldingen.actions';
import { type UserBasic } from '@salvemundi/validations';

import MemberTab from './manual/MemberTab';
import GuestTab from './manual/GuestTab';

interface ManualSignupModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | number;
    eventName: string;
}

export default function ManualSignupModal({ isOpen, onClose, eventId, eventName }: ManualSignupModalProps) {
    const [activeTab, setActiveTab] = useState<'member' | 'guest'>('member');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [selectedMember, setSelectedMember] = useState<UserBasic | null>(null);

    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setActiveTab('member');
        setIsLoading(false);
        setError(null);
        setSuccessMessage(null);
        setSelectedMember(null);
        setGuestName('');
        setGuestEmail('');
        setGuestPhone('');
    };

    const handleMemberSelect = (user: UserBasic) => {
        setSelectedMember(user);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const guestData = activeTab === 'guest' ? { name: guestName, email: guestEmail, phone: guestPhone } : undefined;
        const memberData = activeTab === 'member' ? (selectedMember ?? undefined) : undefined;

        if (activeTab === 'member' && !selectedMember) {
            setError('Selecteer een lid');
            setIsLoading(false);
            return;
        }

        const res = await createManualSignupAction(Number(eventId), eventName, activeTab, guestData, memberData);

        if (res.success) {
            const name = (activeTab === 'member' && selectedMember)
                ? `${selectedMember.first_name} ${selectedMember.last_name || ''}`
                : guestName;
            setSuccessMessage(`Succesvol ingeschreven: ${name}`);
            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 1000);
        } else {
            setError(res.error || 'Er is een fout opgetreden.');
        }

        setIsLoading(false);
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 isolate">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="bg-[var(--beheer-card-bg)] w-full max-w-xl rounded-[2rem] shadow-[var(--shadow-card-elevated)] ring-1 ring-white/10 overflow-hidden flex flex-col max-h-[90vh] relative z-10 border border-[var(--beheer-border)]"
                    >
                        <div className="px-8 py-6 border-b border-[var(--beheer-border)] flex justify-between items-center bg-[var(--beheer-card-soft)]/80 relative">
                            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[var(--beheer-accent)]/30 to-transparent" />
                            <h2 className="text-[10px] font-semibold text-[var(--beheer-text)]  tracking-[0.2em] flex items-center gap-3">
                                <div className="bg-[var(--beheer-accent)] text-white p-2.5 rounded-2xl shadow-[var(--shadow-glow)]">
                                    <UserPlus className="h-4 w-4" />
                                </div>
                                Handmatig Inschrijven
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)] p-2.5 rounded-full transition-all active:scale-90 focus:outline-none border border-transparent hover:border-[var(--beheer-border)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-8 py-4 bg-[var(--beheer-card-bg)]">
                            <div className="flex bg-[var(--beheer-card-soft)] p-1.5 rounded-2xl border border-[var(--beheer-border)] gap-1">
                                <button
                                    type="button"
                                    className={`flex-1 py-2.5 text-[10px]  font-semibold tracking-widest rounded-xl transition-all flex justify-center items-center gap-2.5 ${activeTab === 'member'
                                        ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-md border border-[var(--beheer-border)]'
                                        : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)]/40'
                                        }`}
                                    onClick={() => setActiveTab('member')}
                                >
                                    <User className="h-3.5 w-3.5" />
                                    Lid
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2.5 text-[10px]  font-semibold tracking-widest rounded-xl transition-all flex justify-center items-center gap-2.5 ${activeTab === 'guest'
                                        ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-md border border-[var(--beheer-border)]'
                                        : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)]/40'
                                        }`}
                                    onClick={() => setActiveTab('guest')}
                                >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Gast (Niet-lid)
                                </button>
                            </div>
                        </div>

                        <div className="px-8 pb-8 pt-2 overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-semibold  tracking-widest border border-red-500/20 flex items-start gap-4 animate-in slide-in-from-top-2">
                                    <XCircle className="h-5 w-5 shrink-0" />
                                    <span className="leading-relaxed">{error}</span>
                                </div>
                            )}
                            {successMessage && (
                                <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[10px] font-semibold  tracking-widest border border-emerald-500/20 flex items-center gap-4 animate-in slide-in-from-top-2">
                                    <CheckCircle className="h-5 w-5 shrink-0" />
                                    <span className="leading-relaxed">{successMessage}</span>
                                </div>
                            )}

                            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-8" autoComplete="off">
                                {activeTab === 'member' ? (
                                    <MemberTab
                                        selectedMember={selectedMember}
                                        onSelect={handleMemberSelect}
                                        onClear={() => setSelectedMember(null)}
                                    />
                                ) : (
                                    <GuestTab
                                        name={guestName}
                                        email={guestEmail}
                                        phone={guestPhone}
                                        onNameChange={setGuestName}
                                        onEmailChange={setGuestEmail}
                                        onPhoneChange={setGuestPhone}
                                    />
                                )}

                                <div className="flex gap-4 pt-8 mt-4 border-t border-[var(--beheer-border)]">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 h-14 rounded-2xl font-semibold  tracking-widest text-[10px] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all active:scale-[0.98] cursor-pointer"
                                        disabled={isLoading}
                                    >
                                        Annuleren
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || (activeTab === 'member' && !selectedMember)}
                                        className="flex-[1.5] h-14 rounded-2xl font-semibold  tracking-widest text-[10px] bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/10 group"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Bevestig Inschrijving</span>
                                                <CheckCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}