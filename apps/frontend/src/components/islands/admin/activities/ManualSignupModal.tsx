'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, User, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import { searchMembersAction, createManualSignupAction } from '@/server/actions/aanmeldingen.actions';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

interface ManualSignupModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | number;
    eventName: string;
    eventPrice: number;
}

interface UserResult {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export default function ManualSignupModal({ isOpen, onClose, eventId, eventName, eventPrice }: ManualSignupModalProps) {
    const [activeTab, setActiveTab] = useState<'member' | 'guest'>('member');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Member specific state
    const [memberQuery, setMemberQuery] = useState('');
    const [memberResults, setMemberResults] = useState<UserResult[]>([]);
    const [selectedMember, setSelectedMember] = useState<UserResult | null>(null);
    const [isSearchingMember, setIsSearchingMember] = useState(false);
    const debouncedMemberQuery = useDebounce(memberQuery, 300);

    // Guest specific state
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Effect for searching members
    useEffect(() => {
        const searchMembers = async () => {
            if (debouncedMemberQuery.length < 2) {
                setMemberResults([]);
                return;
            }

            setIsSearchingMember(true);
            const res = await searchMembersAction(debouncedMemberQuery);
            if (res.success && res.data) {
                setMemberResults(res.data as any);
            } else {
                setMemberResults([]);
            }
            setIsSearchingMember(false);
        };

        searchMembers();
    }, [debouncedMemberQuery]);

    const resetForm = () => {
        setActiveTab('member');
        setIsLoading(false);
        setError(null);
        setSuccessMessage(null);
        setMemberQuery('');
        setMemberResults([]);
        setSelectedMember(null);
        setGuestName('');
        setGuestEmail('');
        setGuestPhone('');
    };

    const handleMemberSelect = (user: UserResult) => {
        setSelectedMember(user);
        setMemberResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const guestData = activeTab === 'guest' ? { name: guestName, email: guestEmail, phone: guestPhone } : undefined;
        const memberData = activeTab === 'member' ? selectedMember : undefined;

        if (activeTab === 'member' && !selectedMember) {
            setError('Selecteer een lid');
            setIsLoading(false);
            return;
        }

        const res = await createManualSignupAction(Number(eventId), eventName, activeTab, guestData, memberData);

        if (res.success) {
            const name = activeTab === 'member' ? `${selectedMember!.first_name} ${selectedMember!.last_name || ''}` : guestName;
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[var(--beheer-card-bg)] w-full max-w-xl rounded-[var(--beheer-radius)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10 scale-100 animate-in zoom-in-95 duration-200 border border-[var(--beheer-border)]">
                {/* Header */}
                <div className="p-6 border-b border-[var(--beheer-border)] flex justify-between items-center bg-[var(--beheer-card-soft)]">
                    <h2 className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight flex items-center gap-3">
                        <div className="bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] p-2 rounded-xl">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        Handmatig Inschrijven
                    </h2>
                    <button onClick={onClose} className="text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)] p-2 rounded-full transition-colors focus:outline-none">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-[var(--beheer-card-soft)] p-2 border-b border-[var(--beheer-border)] gap-2">
                    <button
                        className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${activeTab === 'member'
                            ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm border border-[var(--beheer-border)] select-none'
                            : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)]/50'
                            }`}
                        onClick={() => setActiveTab('member')}
                    >
                        <User className="h-4 w-4" />
                        Geregistreerd Lid
                    </button>
                    <button
                        className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${activeTab === 'guest'
                            ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-accent)] shadow-sm border border-[var(--beheer-border)] select-none'
                            : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-bg)]/50'
                            }`}
                        onClick={() => setActiveTab('guest')}
                    >
                        <UserPlus className="h-4 w-4" />
                        Gast (Niet-lid)
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-500/20 flex items-start gap-3">
                            <XCircle className="h-5 w-5 shrink-0" />
                            <span className="font-medium leading-relaxed">{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-xl text-sm border border-green-200 dark:border-green-500/20 flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <span className="font-medium leading-relaxed">{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        {activeTab === 'member' ? (
                            <div className="relative">
                                <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">
                                    Zoek bestaand lid
                                </label>
                                {selectedMember ? (
                                    <div className="flex items-center justify-between p-4 bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 flex items-center justify-center bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] font-black rounded-full">
                                                {selectedMember.first_name[0]}{selectedMember.last_name?.[0] || ''}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--beheer-text)]">
                                                    {selectedMember.first_name} {selectedMember.last_name}
                                                </p>
                                                <p className="text-sm text-[var(--beheer-text-muted)]">{selectedMember.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMember(null)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--beheer-text-muted)]" />
                                            <input
                                                suppressHydrationWarning
                                                type="text"
                                                placeholder="Typ om te zoeken op voornaam..."
                                                value={memberQuery}
                                                onChange={(e) => setMemberQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (memberResults.length > 0) {
                                                            handleMemberSelect(memberResults[0]);
                                                        }
                                                    }
                                                }}
                                                className="beheer-input pl-12"
                                                autoFocus
                                                autoComplete="off"
                                            />
                                            {isSearchingMember && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-5 w-5 animate-spin text-[var(--beheer-accent)]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Dropdown Results */}
                                        {memberResults.length > 0 && !selectedMember && (
                                            <div className="w-full mt-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2 z-20 absolute">
                                                {memberResults.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => handleMemberSelect(user)}
                                                        className="w-full text-left px-5 py-3 hover:bg-[var(--beheer-card-soft)] transition-colors flex flex-col items-start gap-0.5"
                                                    >
                                                        <span className="font-bold text-[var(--beheer-text)]">{user.first_name} {user.last_name}</span>
                                                        <span className="text-[10px] uppercase tracking-widest font-black text-[var(--beheer-text-muted)] mt-1">{user.email}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {memberQuery.length >= 2 && !isSearchingMember && memberResults.length === 0 && (
                                            <p className="mt-3 ml-2 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Niemand gevonden.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Guest Form
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Naam Gast *</label>
                                    <input
                                        suppressHydrationWarning
                                        type="text"
                                        required
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="beheer-input"
                                        placeholder="Volledige naam"
                                        autoComplete="off"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">E-mailadres *</label>
                                    <input
                                        suppressHydrationWarning
                                        type="email"
                                        required
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                        className="beheer-input"
                                        placeholder="email@voorbeeld.nl"
                                        autoComplete="off"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Telefoonnummer</label>
                                    <input
                                        suppressHydrationWarning
                                        type="tel"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        className="beheer-input"
                                        placeholder="Optioneel"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-6 mt-4 border-t border-[var(--beheer-border)]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition cursor-pointer"
                                disabled={isLoading}
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Bezig...
                                    </>
                                ) : (
                                    'Bevestig Inschrijving'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
