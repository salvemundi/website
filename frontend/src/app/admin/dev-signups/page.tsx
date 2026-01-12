'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { format } from 'date-fns';
import { Shield, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';

interface Signup {
    id: string;
    created_at: string;
    email: string;
    first_name?: string;
    last_name?: string;
    product_name: string;
    amount: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    payment_status: string;
}

interface SyncStatus {
    active: boolean;
    status: 'idle' | 'running' | 'completed' | 'failed';
    total: number;
    processed: number;
    errorCount: number;
    missingDataCount?: number;
    errors: { email: string; error: string; timestamp: string }[];
    missingData?: { email: string; reason: string }[];
    startTime?: string;
    endTime?: string;
    lastRunSuccess?: boolean | null;
}

function Tile({
    title,
    icon,
    children,
    className = '',
    actions,
}: {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}) {
    return (
        <section
            className={[
                'relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end shadow-lg',
                className,
            ].join(' ')}
        >
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

            <div className="relative p-6 sm:p-7">
                {(title || actions) && (
                    <header className="mb-5 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon ? (
                                <div className="shrink-0 rounded-xl bg-theme-purple/10 p-2 text-theme-purple-lighter">
                                    {icon}
                                </div>
                            ) : null}
                            {title ? (
                                <h2 className="truncate text-lg font-bold text-theme-purple-lighter">
                                    {title}
                                </h2>
                            ) : null}
                        </div>

                        {actions ? <div className="shrink-0">{actions}</div> : null}
                    </header>
                )}

                {children}
            </div>
        </section>
    );
}

export default function DevSignupsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [signups, setSignups] = useState<Signup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [showStatus, setShowStatus] = useState(false);
    const [selectedSyncFields, setSelectedSyncFields] = useState<string[]>([
        'membership_expiry',
        'first_name',
        'last_name',
        'phone_number',
        'display_name'
    ]);

    // Filters
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [showFailed, setShowFailed] = useState(false);

    const syncFieldOptions = [
        { id: 'membership_expiry', label: 'Lidmaatschap vervaldatum' },
        { id: 'first_name', label: 'Voornaam' },
        { id: 'last_name', label: 'Achternaam' },
        { id: 'display_name', label: 'Display naam' },
        { id: 'phone_number', label: 'Mobiel nummer (Entra → Directus)' },
    ];

    const toggleField = (fieldId: string) => {
        setSelectedSyncFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        );
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        // Check if user is admin (has entra_id)
        if (user && !user.entra_id) {
            router.push('/account');
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.entra_id) {
            loadSignups();
            fetchSyncStatus();
        }
    }, [user, filterStatus, showFailed]); // Reload when filters change

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSyncing || (syncStatus?.active)) {
            interval = setInterval(fetchSyncStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [isSyncing, syncStatus]);

    const fetchSyncStatus = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch('/api/admin/sync-status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSyncStatus(data);
                if (data.active) {
                    setIsSyncing(true);
                    setShowStatus(true);
                } else if (isSyncing && !data.active) {
                    setIsSyncing(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch sync status:', error);
        }
    };

    const loadSignups = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const params = new URLSearchParams({
                status: filterStatus,
                show_failed: showFailed.toString()
            });

            const response = await fetch(`/api/admin/pending-signups?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch signups');
            }

            const data = await response.json();
            setSignups(data.signups || []);
        } catch (error) {
            console.error('Failed to load signups:', error);
            alert('Kon inschrijvingen niet laden.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (signupId: string) => {
        if (!confirm('Weet je zeker dat je deze inschrijving wilt goedkeuren? Er wordt een account aangemaakt.')) {
            return;
        }

        setIsProcessing(signupId);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch(`/api/admin/approve-signup/${signupId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve signup');
            }

            alert('Inschrijving goedgekeurd!');
            await loadSignups();
        } catch (error: any) {
            console.error('Failed to approve signup:', error);
            alert(`Fout bij goedkeuren: ${error.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (signupId: string) => {
        if (!confirm('Weet je zeker dat je deze inschrijving wilt afwijzen? Er wordt GEEN account aangemaakt.')) {
            return;
        }

        setIsProcessing(signupId);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch(`/api/admin/reject-signup/${signupId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject signup');
            }

            alert('Inschrijving afgewezen.');
            await loadSignups();
        } catch (error: any) {
            console.error('Failed to reject signup:', error);
            alert(`Fout bij afwijzen: ${error.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleSyncUsers = async () => {
        setIsSyncing(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch('/api/admin/sync-users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields: selectedSyncFields }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start sync');
            }

            alert('Synchronisatie gestart op de achtergrond.');
            setShowStatus(true);
            fetchSyncStatus();
        } catch (error: any) {
            console.error('Failed to sync users:', error);
            alert(`Fout bij starten synchronisatie: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const formatAmount = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(numAmount);
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="text-theme-purple-lighter text-xl font-semibold">
                    Laden...
                </div>
            </div>
        );
    }

    if (!user.entra_id) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="text-theme-purple-lighter text-xl font-semibold">
                    Geen toegang - alleen admins
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'pending', label: 'Te Keuren' },
        { id: 'approved', label: 'Goedgekeurd' },
        { id: 'rejected', label: 'Afgewezen' },
        { id: 'all', label: 'Alles' },
    ] as const;

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-theme-purple-lighter flex items-center gap-3">
                            <Shield className="h-8 w-8" />
                            Signups Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-theme-purple-lighter/60">
                            Beheer inschrijvingen en synchroniseer gebruikers met Microsoft Entra ID.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        {/* Sync Controls */}
                        <div className="flex flex-wrap gap-2 justify-end max-w-xl">
                            {syncFieldOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => toggleField(option.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedSyncFields.includes(option.id)
                                        ? 'bg-theme-purple/20 border-theme-purple/40 text-theme-purple-lighter'
                                        : 'bg-white/5 border-white/10 text-theme-purple-lighter/40 hover:bg-white/10'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {syncStatus && !syncStatus.active && syncStatus.status !== 'idle' && (
                                <button
                                    onClick={() => setShowStatus(!showStatus)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-theme-purple-lighter rounded-xl border border-white/10 transition-all text-sm font-medium"
                                >
                                    {showStatus ? 'Status Verbergen' : 'Laatste Sync'}
                                </button>
                            )}
                            <button
                                onClick={handleSyncUsers}
                                disabled={isSyncing}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-theme-purple/20 hover:bg-theme-purple/30 text-theme-purple-lighter rounded-xl border border-theme-purple/30 transition-all font-semibold disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Synchroniseren...' : 'Sync Gebruikers'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sync Progress Tile */}
                {showStatus && syncStatus && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <Tile
                            title="Synchronisatie Status"
                            icon={<RefreshCw className={`h-5 w-5 ${syncStatus.active ? 'animate-spin' : ''}`} />}
                            actions={
                                <button
                                    onClick={() => setShowStatus(false)}
                                    className="text-theme-purple-lighter/60 hover:text-theme-purple-lighter text-sm"
                                >
                                    Sluiten
                                </button>
                            }
                        >
                            {/* Sync Status Content (same as before) */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <span className="text-sm font-medium text-theme-purple-lighter/70 block mb-1">Voortgang</span>
                                            <span className="text-2xl font-bold text-theme-purple-lighter">
                                                {syncStatus.total > 0 ? Math.round((syncStatus.processed / syncStatus.total) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="text-right text-sm text-theme-purple-lighter/60">
                                            {syncStatus.processed} van {syncStatus.total} gebruikers
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-theme-purple to-theme-purple-lighter transition-all duration-500 ease-out"
                                            style={{ width: `${syncStatus.total > 0 ? (syncStatus.processed / syncStatus.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-sm text-theme-purple-lighter/60 mb-1">Status</div>
                                        <div className={`font-bold capitalize ${syncStatus.status === 'completed' ? 'text-green-400' :
                                            syncStatus.status === 'failed' ? 'text-red-400' : 'text-theme-purple-lighter'
                                            }`}>
                                            {syncStatus.status === 'running' ? 'Bezig...' :
                                                syncStatus.status === 'completed' ? 'Voltooid' :
                                                    syncStatus.status === 'failed' ? 'Mislukt' : 'Inactief'}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-sm text-theme-purple-lighter/60 mb-1">Fouten</div>
                                        <div className={`font-bold ${syncStatus.errorCount > 0 ? 'text-yellow-400' : 'text-theme-purple-lighter'}`}>
                                            {syncStatus.errorCount}
                                        </div>
                                    </div>
                                </div>
                                {syncStatus.errors.length > 0 && (
                                    <div className="mt-4">
                                        <div className="max-h-48 overflow-y-auto rounded-xl bg-black/20 border border-white/5 p-2 space-y-1 custom-scrollbar">
                                            {syncStatus.errors.map((err, idx) => (
                                                <div key={idx} className="p-2 text-xs border-b border-white/5">
                                                    <span className="text-red-300">{err.email}: {err.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tile>
                    </div>
                )}

                {/* Filters & Content */}
                <Tile
                    title="Inschrijvingen"
                    icon={<Clock className="h-5 w-5" />}
                    actions={
                        <button
                            onClick={() => loadSignups()}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-theme-purple-lighter hover:bg-white/15 border border-white/10 transition disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Ververs
                        </button>
                    }
                >
                    {/* Filters Bar */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/5 pb-6">

                        {/* Filter Tabs */}
                        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id as any)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filterStatus === tab.id
                                        ? 'bg-theme-purple text-white shadow-lg'
                                        : 'text-theme-purple-lighter/60 hover:text-theme-purple-lighter hover:bg-white/5'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Toggle Failed */}
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <span className="text-sm font-medium text-theme-purple-lighter/70 group-hover:text-theme-purple-lighter transition-colors">
                                Toon ook mislukte/open betalingen
                            </span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showFailed}
                                    onChange={(e) => setShowFailed(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-purple"></div>
                            </div>
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                            <p className="mt-4 text-theme-purple-lighter/60">Laden...</p>
                        </div>
                    ) : signups.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-theme-purple/10 bg-white/30 p-8 text-center">
                            <p className="text-theme-purple-lighter font-medium">
                                Geen inschrijvingen gevonden.
                            </p>
                            <p className="mt-2 text-sm text-theme-purple-lighter/60">
                                Probeer andere filters.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table (Updated with extra status badge logic if needed) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-white/10">
                                        <tr className="border-b border-white/5 bg-white/5">
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Datum</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Naam</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Email</th>
                                            <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Bedrag</th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Betaalstatus</th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Keuring</th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {signups.map((signup) => (
                                            <tr key={signup.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">
                                                    {signup.created_at ? format(new Date(signup.created_at), 'd MMM HH:mm') : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter font-medium">
                                                    {signup.first_name} {signup.last_name}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">{signup.email}</td>
                                                <td className="px-4 py-4 text-right text-sm font-semibold text-theme-purple-lighter">
                                                    {formatAmount(signup.amount)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                                        ${signup.payment_status === 'paid' ? 'bg-green-500/20 text-green-300' :
                                                            signup.payment_status === 'open' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                                                        {signup.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                                        ${signup.approval_status === 'approved' || signup.approval_status === 'auto_approved' ? 'bg-green-500/20 text-green-300' :
                                                            signup.approval_status === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                                        {signup.approval_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {signup.approval_status === 'pending' && (
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() => handleApprove(signup.id)}
                                                                disabled={isProcessing === signup.id}
                                                                className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white transition"
                                                                title="Goedkeuren"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(signup.id)}
                                                                disabled={isProcessing === signup.id}
                                                                className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition"
                                                                title="Afwijzen"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Mobile Support (simplified for this update) */}
                            <div className="md:hidden space-y-4">
                                <p className="text-center text-sm text-theme-purple-lighter/50 italic">Switch naar desktop voor de beste weergave</p>
                            </div>
                        </>
                    )}
                </Tile>
            </div>
        </div>
    );
}
