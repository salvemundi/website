'use client';

import { useState, useEffect } from 'react';
import type { SyntheticEvent } from 'react';
import { X, Loader2, User, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { createManualSignupAction } from '@/server/actions/admin/activiteiten/admin-activiteiten-signups.actions';
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

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);



    const handleMemberSelect = (user: UserBasic) => {
        setSelectedMember(user);
    };

    const handleSubmit = async (e: SyntheticEvent) => {
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
                            <UserPlus className="size-4" />
                        </div>
                        Handmatig Inschrijven
                    </h2>
                    <button
                        onClick={onClose}
                        className="icon-button rounded-full border border-transparent p-2.5 text-(--beheer-text-muted) transition-all hover:border-(--beheer-border) hover:bg-(--beheer-card-bg) hover:text-(--beheer-text) focus:outline-none active:scale-90"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="bg-(--beheer-card-bg) px-8 py-4">
                    <div className="flex gap-1 rounded-2xl border border-(--beheer-border) bg-(--beheer-card-soft) p-1.5">
                        <button
                            type="button"
                            className={`tab-button flex flex-1 items-center justify-center gap-2.5 rounded-xl py-2.5 text-[10px] font-semibold tracking-widest transition-all ${activeTab === 'member'
                                ? 'border border-(--beheer-border) bg-(--beheer-card-bg) text-(--beheer-accent) shadow-md'
                                : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-bg)/40 hover:text-(--beheer-text)'
                                }`}
                            onClick={() => setActiveTab('member')}
                        >
                            <User className="size-3.5" />
                            Lid
                        </button>
                        <button
                            type="button"
                            className={`tab-button flex flex-1 items-center justify-center gap-2.5 rounded-xl py-2.5 text-[10px] font-semibold tracking-widest transition-all ${activeTab === 'guest'
                                ? 'border border-(--beheer-border) bg-(--beheer-card-bg) text-(--beheer-accent) shadow-md'
                                : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-bg)/40 hover:text-(--beheer-text)'
                                }`}
                            onClick={() => setActiveTab('guest')}
                        >
                            <UserPlus className="size-3.5" />
                            Gast (Niet-lid)
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar overflow-y-auto px-8 pt-2 pb-8">
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

                        <div className="mt-4 flex gap-4 border-t border-(--beheer-border) pt-8">
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
                                disabled={isLoading || (activeTab === 'member' && !selectedMember)}
                                className="group active:scale-0.98 form-button flex h-14 flex-[1.5] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-(--beheer-accent) text-[10px] font-semibold tracking-widest text-white shadow-(--shadow-glow) transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                {isLoading ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Bevestig Inschrijving</span>
                                        <CheckCircle className="size-4 transition-transform group-hover:scale-110" />
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