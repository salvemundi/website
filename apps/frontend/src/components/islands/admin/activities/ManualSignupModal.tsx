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
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10 scale-100 animate-in zoom-in-95 duration-200 ring-1 ring-slate-200 dark:ring-slate-700/50">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 p-2 rounded-xl">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        Handmatig Inschrijven
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 dark:bg-slate-900/50 p-2 border-b border-slate-100 dark:border-slate-700/50 gap-2">
                    <button
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex justify-center items-center gap-2 ${activeTab === 'member'
                            ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200 select-none dark:bg-slate-800 dark:ring-slate-700 dark:text-purple-400'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'
                            }`}
                        onClick={() => setActiveTab('member')}
                    >
                        <User className="h-4 w-4" />
                        Geregistreerd Lid
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex justify-center items-center gap-2 ${activeTab === 'guest'
                            ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200 select-none dark:bg-slate-800 dark:ring-slate-700 dark:text-purple-400'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeTab === 'member' ? (
                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Zoek bestaand lid
                                </label>
                                {selectedMember ? (
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 ring-1 ring-slate-200 dark:ring-slate-700/50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 font-bold rounded-full">
                                                {selectedMember.first_name[0]}{selectedMember.last_name?.[0] || ''}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {selectedMember.first_name} {selectedMember.last_name}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedMember.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMember(null)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
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
                                                className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                                                autoFocus
                                            />
                                            {isSearchingMember && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Dropdown Results */}
                                        {memberResults.length > 0 && !selectedMember && (
                                            <div className="w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2">
                                                {memberResults.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => handleMemberSelect(user)}
                                                        className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col items-start gap-0.5"
                                                    >
                                                        <span className="font-bold text-slate-900 dark:text-white">{user.first_name} {user.last_name}</span>
                                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.email}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {memberQuery.length >= 2 && !isSearchingMember && memberResults.length === 0 && (
                                            <p className="mt-3 ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">Niemand gevonden.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Guest Form
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Naam Gast *</label>
                                    <input
                                        suppressHydrationWarning
                                        type="text"
                                        required
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                                        placeholder="Volledige naam"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mailadres *</label>
                                    <input
                                        suppressHydrationWarning
                                        type="email"
                                        required
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                                        placeholder="email@voorbeeld.nl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Telefoonnummer</label>
                                    <input
                                        suppressHydrationWarning
                                        type="tel"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                                        placeholder="Optioneel"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-6 mt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all"
                                disabled={isLoading}
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
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
