'use client';

import { useState, useEffect } from 'react';
import type { SyntheticEvent } from 'react';
import { X, Loader2, User, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { createManualSignupAction } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-signups.actions';
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

    const handleSubmit = async (event: SyntheticEvent) => {
        event.preventDefault();
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
                            <UserPlus className="size-4" />
                        </div>
                        Handmatig Inschrijven
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

                <div className="bg-bg-card px-6 py-4">
                    <div className="tab-bar-wrapper">
                        <button
                            type="button"
                            className={`tab-button ${activeTab === 'member' ? 'modal-tab-active' : 'modal-tab-inactive'}`}
                            onClick={() => setActiveTab('member')}
                        >
                            <User className="size-3.5" />
                            Lid
                        </button>
                        <button
                            type="button"
                            className={`tab-button ${activeTab === 'guest' ? 'modal-tab-active' : 'modal-tab-inactive'}`}
                            onClick={() => setActiveTab('guest')}
                        >
                            <UserPlus className="size-3.5" />
                            Gast (Niet-lid)
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar modal-body-custom-scroll">
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
                                disabled={isLoading || (activeTab === 'member' && !selectedMember)}
                                className="form-button flex-[1.5]"
                            >
                                {isLoading ? (
                                    <Loader2 className="mx-auto size-5 animate-spin" />
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