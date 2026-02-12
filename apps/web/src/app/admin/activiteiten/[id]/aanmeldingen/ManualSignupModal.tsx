'use client';

import { useState, useEffect } from 'react';
import { usersApi, eventsApi } from '@/shared/lib/api/salvemundi';
import { X, Search, Check, Loader2 } from 'lucide-react';

import { useDebounce } from '@/shared/lib/hooks/useDebounce';

interface ManualSignupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
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

export default function ManualSignupModal({ isOpen, onClose, onSuccess, eventId, eventName, eventPrice }: ManualSignupModalProps) {
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
            try {
                const results = await usersApi.search(debouncedMemberQuery);
                setMemberResults(results);
            } catch (err) {
                console.error('Error searching members:', err);
                setMemberResults([]);
            } finally {
                setIsSearchingMember(false);
            }
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
        setMemberQuery(''); // Clear query to hide dropdown, or keep it to show selection? 
        // Better UX: Show selected user clearly and hide search results
        setMemberResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const commonData = {
                event_id: Number(eventId),
                event_name: eventName,
                event_price: eventPrice,
                payment_status: 'paid' // Handmatige inschrijvingen zijn altijd direct 'betaald'
            };

            let signupData;

            if (activeTab === 'member') {
                if (!selectedMember) {
                    throw new Error('Selecteer een lid');
                }
                signupData = {
                    ...commonData,
                    user_id: selectedMember.id,
                    name: `${selectedMember.first_name} ${selectedMember.last_name}`,
                    email: selectedMember.email
                };
            } else {
                if (!guestName || !guestEmail) {
                    throw new Error('Naam en email zijn verplicht');
                }
                signupData = {
                    ...commonData,
                    name: guestName,
                    email: guestEmail,
                    phone_number: guestPhone
                };
            }

            await eventsApi.createSignup(signupData);

            setSuccessMessage(`Succesvol ingeschreven: ${signupData.name}`);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (err: any) {
            console.error('Signup error:', err);
            // Check for specific duplicate error messages from API or generic fallback
            const msg = err.message || 'Er is een fout opgetreden bij het inschrijven.';
            if (msg.includes('al ingeschreven') || msg.toLowerCase().includes('duplicate')) {
                setError('Deze gebruiker is al ingeschreven voor dit evenement.');
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-admin-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-admin flex justify-between items-center bg-admin-card-soft">
                    <h2 className="text-xl font-bold text-admin">Handmatig inschrijven</h2>
                    <button onClick={onClose} className="text-admin-muted hover:text-admin transition">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-admin">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'member'
                            ? 'text-theme-purple border-b-2 border-theme-purple bg-theme-purple/5'
                            : 'text-admin-muted hover:text-admin hover:bg-admin-hover'
                            }`}
                        onClick={() => setActiveTab('member')}
                    >
                        Lid (Interne gebruiker)
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'guest'
                            ? 'text-theme-purple border-b-2 border-theme-purple bg-theme-purple/5'
                            : 'text-admin-muted hover:text-admin hover:bg-admin-hover'
                            }`}
                        onClick={() => setActiveTab('guest')}
                    >
                        Gast (Externe gebruiker)
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm border border-green-200 flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'member' ? (
                            <div className="relative">
                                <label className="block text-sm font-medium text-admin-muted mb-1">
                                    Zoek lid
                                </label>
                                {selectedMember ? (
                                    <div className="flex items-center justify-between p-3 border border-theme-purple bg-theme-purple/5 rounded-lg">
                                        <div>
                                            <p className="font-medium text-admin">
                                                {selectedMember.first_name} {selectedMember.last_name}
                                            </p>
                                            <p className="text-sm text-admin-muted">{selectedMember.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMember(null)}
                                            className="text-admin-muted hover:text-red-500"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                        <input
                                            type="text"
                                            id="member-search"
                                            name="member-search"
                                            autoComplete="off"
                                            placeholder="Zoek op naam..."
                                            value={memberQuery}
                                            onChange={(e) => setMemberQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-admin bg-transparent text-admin focus:border-theme-purple focus:ring-1 focus:ring-theme-purple outline-none"
                                            autoFocus
                                        />
                                        {isSearchingMember && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-admin-muted" />
                                            </div>
                                        )}

                                        {/* Dropdown Results */}
                                        {memberResults.length > 0 && !selectedMember && (
                                            <div className="absolute z-10 w-full mt-1 bg-admin-card border border-admin rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {memberResults.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => handleMemberSelect(user)}
                                                        className="w-full text-left px-4 py-2 hover:bg-admin-hover transition border-b border-admin last:border-0"
                                                    >
                                                        <p className="font-medium text-admin">{user.first_name} {user.last_name}</p>
                                                        <p className="text-xs text-admin-muted">{user.email}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {memberQuery.length >= 2 && !isSearchingMember && memberResults.length === 0 && (
                                            <p className="mt-2 text-sm text-admin-muted">Geen leden gevonden.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Guest Form
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-admin-muted mb-1">Naam *</label>
                                    <input
                                        type="text"
                                        id="guest-name"
                                        name="name"
                                        autoComplete="name"
                                        required
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-admin bg-transparent text-admin focus:border-theme-purple focus:ring-1 focus:ring-theme-purple outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-admin-muted mb-1">Email *</label>
                                    <input
                                        type="email"
                                        id="guest-email"
                                        name="email"
                                        autoComplete="email"
                                        required
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-admin bg-transparent text-admin focus:border-theme-purple focus:ring-1 focus:ring-theme-purple outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-admin-muted mb-1">Telefoon</label>
                                    <input
                                        type="tel"
                                        id="guest-phone"
                                        name="phone_number"
                                        autoComplete="tel"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-admin bg-transparent text-admin focus:border-theme-purple focus:ring-1 focus:ring-theme-purple outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-admin">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-admin text-admin-muted rounded-lg hover:bg-admin-hover transition"
                                disabled={isLoading}
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-theme-purple text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Inschrijven
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
