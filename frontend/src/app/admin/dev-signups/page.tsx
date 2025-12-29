'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { format } from 'date-fns';
import { Shield, CheckCircle, XCircle, RefreshCw, Clock, AlertCircle } from 'lucide-react';

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
    errors: { email: string; error: string; timestamp: string }[];
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
            loadPendingSignups();
            fetchSyncStatus();
        }
    }, [user]);

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

    const loadPendingSignups = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch('/api/admin/pending-signups', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pending signups');
            }

            const data = await response.json();
            setSignups(data.signups || []);
        } catch (error) {
            console.error('Failed to load pending signups:', error);
            alert('Kon pending inschrijvingen niet laden. Controleer de console voor details.');
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

            alert('Inschrijving goedgekeurd! Account wordt aangemaakt.');
            await loadPendingSignups();
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
            await loadPendingSignups();
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
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start sync');
            }

            alert('Synchronisatie gestart op de achtergrond. Je kunt de voortgang hieronder volgen.');
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

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-theme-purple-lighter flex items-center gap-3">
                            <Shield className="h-8 w-8" />
                            Development Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-theme-purple-lighter/60">
                            Beheer inschrijvingen en synchroniseer gebruikers met Microsoft Entra ID.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {syncStatus && !syncStatus.active && syncStatus.status !== 'idle' && (
                            <button
                                onClick={() => setShowStatus(!showStatus)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-theme-purple-lighter rounded-xl border border-white/10 transition-all text-sm font-medium"
                            >
                                {showStatus ? 'Status Verbergen' : 'Laatste Sync Bekijken'}
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
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-sm text-theme-purple-lighter/60 mb-1">Tijd</div>
                                        <div className="font-bold text-theme-purple-lighter">
                                            {syncStatus.startTime ? format(new Date(syncStatus.startTime), 'HH:mm:ss') : '--:--'}
                                        </div>
                                    </div>
                                </div>

                                {syncStatus.errors.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-sm font-semibold text-theme-purple-lighter/80 mb-3 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                                            Foutrapportage ({syncStatus.errors.length})
                                        </h3>
                                        <div className="max-h-48 overflow-y-auto rounded-xl bg-black/20 border border-white/5 p-2 space-y-1 custom-scrollbar">
                                            {syncStatus.errors.map((err, idx) => (
                                                <div key={idx} className="p-2 text-xs border-b border-white/5 last:border-0 flex flex-col gap-1">
                                                    <div className="flex justify-between font-medium">
                                                        <span className="text-theme-purple-lighter">{err.email}</span>
                                                        <span className="text-theme-purple-lighter/40">{format(new Date(err.timestamp), 'HH:mm:ss')}</span>
                                                    </div>
                                                    <code className="text-red-300 break-all opacity-80">{err.error}</code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tile>
                    </div>
                )}

                {/* Main Content */}
                <Tile
                    title="Pending Signups"
                    icon={<Clock className="h-5 w-5" />}
                    actions={
                        <button
                            onClick={loadPendingSignups}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-theme-purple-lighter hover:bg-white/15 border border-white/10 transition disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Ververs
                        </button>
                    }
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                            <p className="mt-4 text-theme-purple-lighter/60">Laden...</p>
                        </div>
                    ) : signups.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-theme-purple/10 bg-white/30 p-8 text-center">
                            <p className="text-theme-purple-lighter font-medium">
                                Geen pending inschrijvingen.
                            </p>
                            <p className="mt-2 text-sm text-theme-purple-lighter/60">
                                Alle development signups zijn verwerkt of er zijn geen nieuwe.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-white/10">
                                        <tr className="border-b border-white/5 bg-white/5">
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">
                                                Datum
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">
                                                Naam
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">
                                                Email
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">
                                                Product
                                            </th>
                                            <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">
                                                Bedrag
                                            </th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">
                                                Status
                                            </th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">
                                                Acties
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {signups.map((signup) => (
                                            <tr key={signup.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">
                                                    {signup.created_at
                                                        ? format(new Date(signup.created_at), 'd MMM yyyy HH:mm')
                                                        : 'Onbekend'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter font-medium">
                                                    {signup.first_name} {signup.last_name}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">
                                                    {signup.email || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">
                                                    {signup.product_name}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm font-semibold text-theme-purple-lighter">
                                                    {formatAmount(signup.amount)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300">
                                                        {signup.payment_status === 'paid' ? 'Betaald' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(signup.id)}
                                                            disabled={isProcessing === signup.id || signup.payment_status !== 'paid'}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                            Goedkeuren
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(signup.id)}
                                                            disabled={isProcessing === signup.id}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Afwijzen
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {signups.map((signup) => (
                                    <div
                                        key={signup.id}
                                        className="rounded-2xl bg-white/40 p-4"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-theme-purple-lighter">
                                                    {signup.first_name} {signup.last_name}
                                                </h3>
                                                <p className="text-sm text-theme-purple-lighter/80">
                                                    {signup.email || 'N/A'}
                                                </p>
                                                <p className="text-xs text-theme-purple-lighter/60 mt-0.5">
                                                    {signup.created_at
                                                        ? format(new Date(signup.created_at), 'd MMM yyyy HH:mm')
                                                        : 'Datum onbekend'}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300">
                                                {signup.payment_status === 'paid' ? 'Betaald' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-theme-purple-lighter mb-2">
                                            {signup.product_name}
                                        </p>
                                        <p className="text-lg font-bold text-theme-purple-lighter mb-3">
                                            {formatAmount(signup.amount)}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(signup.id)}
                                                disabled={isProcessing === signup.id || signup.payment_status !== 'paid'}
                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Goedkeuren
                                            </button>
                                            <button
                                                onClick={() => handleReject(signup.id)}
                                                disabled={isProcessing === signup.id}
                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Afwijzen
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Tile>
            </div>
        </div>
    );
}
