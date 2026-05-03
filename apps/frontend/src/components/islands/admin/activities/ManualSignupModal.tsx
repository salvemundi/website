'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, User, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { searchMembersAction, createManualSignupAction } from '@/server/actions/aanmeldingen.actions';
import { UserBasic } from '@salvemundi/validations';

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


export default function ManualSignupModal({ isOpen, onClose, eventId, eventName, eventPrice }: ManualSignupModalProps) {
    const [activeTab, setActiveTab] = useState<'member' | 'guest'>('member');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Member specific state
    const [memberQuery, setMemberQuery] = useState('');
    const [memberResults, setMemberResults] = useState<UserBasic[]>([]);
    const [selectedMember, setSelectedMember] = useState<UserBasic | null>(null);
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
                setMemberResults(res.data);
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

    const handleMemberSelect = (user: UserBasic) => {
        setSelectedMember(user);
        setMemberResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll Lock when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 isolate">
                    {/* Background Overlay with heavy blur */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" 
                        onClick={onClose} 
                    />
                    
                    {/* Modal Container */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="bg-[var(--beheer-card-bg)] w-full max-w-xl rounded-[2rem] shadow-[var(--shadow-card-elevated)] ring-1 ring-white/10 overflow-hidden flex flex-col max-h-[90vh] relative z-10 border border-[var(--beheer-border)]"
                    >
                        
                        {/* Header with subtle glow */}
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

                        {/* Segmented Control Tabs */}
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
                                    <User className={`h-3.5 w-3.5 ${activeTab === 'member' ? 'animate-pulse' : ''}`} />
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
                                    <UserPlus className={`h-3.5 w-3.5 ${activeTab === 'guest' ? 'animate-pulse' : ''}`} />
                                    Gast (Niet-lid)
                                </button>
                            </div>
                        </div>

                        {/* Body Content */}
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

                            <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
                                {activeTab === 'member' ? (
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-semibold text-[var(--beheer-text-muted)]  tracking-widest mb-2 ml-1">
                                            Zoek bestaand lid
                                        </label>
                                        {selectedMember ? (
                                            <div className="group relative overflow-hidden p-5 bg-gradient-to-br from-[var(--beheer-card-soft)] to-transparent border border-[var(--beheer-border)] rounded-2xl animate-in zoom-in-95 duration-300">
                                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-[var(--beheer-accent)]/10 p-1.5 rounded-lg">
                                                        <Check className="h-3 w-3 text-[var(--beheer-accent)]" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-5">
                                                    <div className="h-14 w-14 flex items-center justify-center bg-[var(--beheer-accent)] text-white text-lg font-semibold rounded-2xl shadow-lg ring-4 ring-[var(--beheer-accent)]/5">
                                                        {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-[var(--beheer-text)] text-sm  tracking-tight">
                                                            {selectedMember.first_name} {selectedMember.last_name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-[var(--beheer-text-muted)]  tracking-widest mt-1">{selectedMember.email}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedMember(null)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/20"
                                                        title="Selectie wissen"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="relative group">
                                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors z-20" />
                                                    <input
                                                        suppressHydrationWarning
                                                        type="text"
                                                        placeholder="TYP NAAM OM TE ZOEKEN..."
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
                                                        className="beheer-input !pl-14 h-14 text-[10px] font-semibold  tracking-[0.2em] focus:ring-4 focus:ring-[var(--beheer-accent)]/10"
                                                        autoFocus
                                                        autoComplete="off"
                                                    />
                                                    {isSearchingMember && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="h-5 w-5 animate-spin text-[var(--beheer-accent)]" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Premium Floating Results */}
                                                {memberResults.length > 0 && !selectedMember && (
                                                    <div className="w-full mt-3 bg-[var(--beheer-card-bg)]/95 backdrop-blur-xl border border-[var(--beheer-border)] rounded-2xl shadow-2xl max-h-64 overflow-y-auto py-3 z-50 absolute animate-in fade-in slide-in-from-top-4 duration-300">
                                                        {memberResults.map((user) => (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => handleMemberSelect(user)}
                                                                className="w-full text-left px-5 py-4 hover:bg-[var(--beheer-accent)]/10 group transition-all flex items-center justify-between border-b last:border-0 border-[var(--beheer-border)]/50"
                                                            >
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-semibold text-[var(--beheer-text)] text-xs  tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors">
                                                                        {user.first_name} {user.last_name}
                                                                    </span>
                                                                    <span className="text-[9px]  tracking-[0.15em] font-bold text-[var(--beheer-text-muted)]">
                                                                        {user.email}
                                                                    </span>
                                                                </div>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--beheer-accent)] text-white p-1.5 rounded-lg">
                                                                    <Check className="h-3 w-3" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {memberQuery.length >= 2 && !isSearchingMember && memberResults.length === 0 && (
                                                    <div className="mt-4 flex items-center justify-center py-8 bg-[var(--beheer-card-soft)]/50 rounded-2xl border border-dashed border-[var(--beheer-border)]">
                                                        <p className="text-[10px] font-semibold  tracking-widest text-[var(--beheer-text-muted)] opacity-50">Niemand gevonden.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Guest Form with sleek inputs
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-semibold text-[var(--beheer-text-muted)]  tracking-widest mb-2.5 ml-1 group-focus-within:text-[var(--beheer-accent)] transition-colors">Naam Gast *</label>
                                                <input
                                                    suppressHydrationWarning
                                                    type="text"
                                                    required
                                                    value={guestName}
                                                    onChange={(e) => setGuestName(e.target.value)}
                                                    className="beheer-input h-14 text-[10px] font-semibold  tracking-[0.2em]"
                                                    placeholder="VOLLEDIGE NAAM"
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-[10px] font-semibold text-[var(--beheer-text-muted)]  tracking-widest mb-2.5 ml-1 group-focus-within:text-[var(--beheer-accent)] transition-colors">E-mailadres *</label>
                                                <input
                                                    suppressHydrationWarning
                                                    type="email"
                                                    required
                                                    value={guestEmail}
                                                    onChange={(e) => setGuestEmail(e.target.value)}
                                                    className="beheer-input h-14 text-[10px] font-semibold  tracking-[0.2em]"
                                                    placeholder="EMAIL@VOORBEELD.NL"
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-[10px] font-semibold text-[var(--beheer-text-muted)]  tracking-widest mb-2.5 ml-1 group-focus-within:text-[var(--beheer-accent)] transition-colors">Telefoonnummer</label>
                                                <input
                                                    suppressHydrationWarning
                                                    type="tel"
                                                    value={guestPhone}
                                                    onChange={(e) => setGuestPhone(e.target.value)}
                                                    className="beheer-input h-14 text-[10px] font-semibold  tracking-[0.2em]"
                                                    placeholder="OPTIONEEL"
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Footer Actions */}
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
