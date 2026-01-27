'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { format } from 'date-fns';
import { Shield, CheckCircle, XCircle, RefreshCw, Clock, CheckSquare, Square, Tag } from 'lucide-react';

interface Signup {
    id: string;
    created_at: string;
    email: string;
    first_name?: string;
    last_name?: string;
    product_name: string;
    amount: number;
    approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
    payment_status: string;
    coupon_code?: string;
}

interface SyncStatus {
    active: boolean;
    status: 'idle' | 'running' | 'completed' | 'failed';
    total: number;
    processed: number;
    errorCount: number;
    warningCount?: number;
    missingDataCount?: number;
    successCount?: number;
    excludedCount?: number;
    errors: { email: string; error: string; timestamp: string }[];
    warnings?: { email: string; message: string }[];
    missingData?: { email: string; reason: string }[];
    successfulUsers?: { email: string }[];
    excludedUsers?: { email: string }[];
    startTime?: string;
    endTime?: string;
    lastRunSuccess?: boolean | null;
}

interface PaymentSettings {
    manual_approval: boolean;
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
        'display_name',
        'committees'
    ]);
    const [forceLink, setForceLink] = useState(false);
    const [activeOnly, setActiveOnly] = useState(false);
    const [syncResultFilter, setSyncResultFilter] = useState<'all' | 'success' | 'warnings' | 'missing' | 'errors' | 'excluded'>('all');

    // Filters
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [filterType, setFilterType] = useState<'all' | 'membership_new' | 'membership_renewal' | 'event' | 'pub_crawl' | 'trip'>('all');
    const [showFailed, setShowFailed] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ manual_approval: false });
    const [isDevEnv, setIsDevEnv] = useState(false);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);

    const syncFieldOptions = [
        { id: 'membership_expiry', label: 'Lidmaatschap vervaldatum' },
        { id: 'first_name', label: 'Voornaam' },
        { id: 'last_name', label: 'Achternaam' },
        { id: 'display_name', label: 'Display naam' },
        { id: 'phone_number', label: 'Mobiel nummer (Entra → Directus)' },
        { id: 'committees', label: 'Commissies (Entra → Directus)' },
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
            const returnTo = window.location.pathname + window.location.search;
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        }

        const isLocal = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('dev.'));
        const isNodeDev = process.env.NODE_ENV === 'development';

        if (isLocal || isNodeDev) {
            setIsDevEnv(true);
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && !user.entra_id) {
            router.push('/account');
        }
    }, [user, router]);

    const loadSettings = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const res = await fetch('/api/admin/payment-settings', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setPaymentSettings(data);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const toggleManualApproval = async () => {
        const newValue = !paymentSettings.manual_approval;
        setPaymentSettings({ ...paymentSettings, manual_approval: newValue });

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch('/api/admin/payment-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ manual_approval: newValue })
            });

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            setPaymentSettings({ ...paymentSettings, manual_approval: !newValue });
            alert('Fout bij bijwerken instellingen.');
        }
    };

    useEffect(() => {
        if (user?.entra_id) {
            loadSignups();
            fetchSyncStatus();
            loadSettings();
        }
    }, [user, filterStatus, filterType, showFailed]);

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
                type: filterType,
                show_failed: showFailed.toString()
            });

            const response = await fetch(`/api/admin/pending-signups?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || 'Failed to fetch signups');
            }

            const data = await response.json();
            setSignups(data.signups || []);
            setSelectedIds(new Set());
        } catch (error: any) {
            console.error('Failed to load signups:', error);
            alert(`Kon inschrijvingen niet laden: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Selection Logic ---
    const toggleSelectAll = () => {
        if (selectedIds.size === signups.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(signups.map(s => s.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // --- Single Action Wrappers ---
    const handleApprove = async (signupId: string, silent = false) => {
        if (!silent && !confirm('Weet je zeker dat je deze inschrijving wilt goedkeuren?')) return;

        setIsProcessing(signupId);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch(`/api/admin/approve-signup/${signupId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const msg = error.details || error.error || error.message || 'Failed to approve';
                throw new Error(msg);
            }
            if (!silent) {
                alert('Inschrijving goedgekeurd!');
                await loadSignups();
            }
        } catch (error: any) {
            console.error('Failed to approve signup:', error);
            if (!silent) alert(`Fout: ${error.message}`);
            throw error;
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (signupId: string, silent = false) => {
        if (!silent && !confirm('Weet je zeker dat je deze inschrijving wilt afwijzen?')) return;

        setIsProcessing(signupId);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch(`/api/admin/reject-signup/${signupId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const msg = error.error || error.message || 'Failed to reject';
                throw new Error(msg);
            }

            if (!silent) {
                alert('Inschrijving afgewezen.');
                await loadSignups();
            }
        } catch (error: any) {
            console.error('Failed to reject signup:', error);
            if (!silent) alert(`Fout: ${error.message}`);
            throw error;
        } finally {
            setIsProcessing(null);
        }
    };

    // --- Batch Processing ---
    const handleBatchAction = async (action: 'approve' | 'reject') => {
        const count = selectedIds.size;
        if (count === 0) return;

        const actionText = action === 'approve' ? 'GOEDKEUREN' : 'AFWIJZEN';
        if (!confirm(`Weet je zeker dat je ${count} inschrijvingen wilt ${actionText}?`)) return;

        setIsBatchProcessing(true);
        let successCount = 0;
        let failCount = 0;

        const ids = Array.from(selectedIds);

        for (const id of ids) {
            try {
                if (action === 'approve') {
                    await handleApprove(id, true); // Silent mode
                } else {
                    await handleReject(id, true); // Silent mode
                }
                successCount++;
            } catch (e) {
                // Error is alerted by the handle function if silent was false, but here it is true.
                // We just count failures.
                failCount++;
            }
        }

        setIsBatchProcessing(false);
        // Only reload if we actually did something successful
        if (successCount > 0) {
            alert(`Batch voltooid.\nSucces: ${successCount}\nMislukt: ${failCount}`);
            loadSignups();
        } else {
            alert(`Batch mislukt.\nSucces: 0\nMislukt: ${failCount}`);
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
                body: JSON.stringify({ fields: selectedSyncFields, forceLink, activeOnly }),
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

    const typeTabs = [
        { id: 'all', label: 'Alles' },
        { id: 'membership_new', label: 'Leden Inschrijvingen' },
        { id: 'membership_renewal', label: 'Lidmaatschap Verlengingen' },
        { id: 'event', label: 'Events' },
        { id: 'pub_crawl', label: 'Kroegentocht' },
        { id: 'trip', label: 'Reis' },
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
                    <button
                        onClick={toggleManualApproval}
                        disabled={isDevEnv}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${isDevEnv
                            ? 'bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                            : paymentSettings.manual_approval
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30'
                                : 'bg-[var(--bg-highlight)] text-slate-400 border border-white/5 hover:border-white/10'
                            }`}
                        title={isDevEnv
                            ? "Ontwikkelomgeving: Altijd 'Manual Approval' (Pending) forced door backend."
                            : paymentSettings.manual_approval
                                ? "Alle nieuwe aanmeldingen worden handmatig gecontroleerd (ook in productie)"
                                : "Aanmeldingen worden automatisch goedgekeurd in productie"}
                    >
                        {paymentSettings.manual_approval || isDevEnv ? (
                            <>
                                <Shield className="w-3.5 h-3.5" />
                                {isDevEnv ? 'Dev Force: PENDING' : 'Handmatige Goedkeuring: AAN'}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Handmatige Goedkeuring: UIT
                            </>
                        )}
                    </button>
                </div>

                <div className="flex flex-col items-end gap-3 mb-6">
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
                    {/* Force Link Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="forceLink"
                            checked={forceLink}
                            onChange={(e) => setForceLink(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-theme-purple focus:ring-theme-purple focus:ring-offset-0"
                        />
                        <label htmlFor="forceLink" className="text-xs text-theme-purple-lighter/70 cursor-pointer">
                            Koppel bestaande accounts op e-mail (eenmalige migratie)
                        </label>
                    </div>
                    {/* Active Only Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="activeOnly"
                            checked={activeOnly}
                            onChange={(e) => setActiveOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-theme-purple focus:ring-theme-purple focus:ring-offset-0"
                        />
                        <label htmlFor="activeOnly" className="text-xs text-theme-purple-lighter/70 cursor-pointer">
                            Alleen actieve leden synchroniseren (sneller)
                        </label>
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

                {/* Sync Status Tile (Optional) */}
                {
                    showStatus && syncStatus && (
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
                                                <span className="2xl font-bold text-theme-purple-lighter">
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
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                                            <div className="text-sm text-theme-purple-lighter/60 mb-1">Waarschuwingen</div>
                                            <div className={`font-bold ${(syncStatus.warningCount || 0) > 0 ? 'text-amber-400' : 'text-theme-purple-lighter'}`}>
                                                {syncStatus.warningCount || 0}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="text-sm text-theme-purple-lighter/60 mb-1">Missende Data</div>
                                            <div className={`font-bold ${(syncStatus.missingDataCount || 0) > 0 ? 'text-blue-400' : 'text-theme-purple-lighter'}`}>
                                                {syncStatus.missingDataCount}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="text-sm text-theme-purple-lighter/60 mb-1">Fouten</div>
                                            <div className={`font-bold ${syncStatus.errorCount > 0 ? 'text-red-500' : 'text-theme-purple-lighter'}`}>
                                                {syncStatus.errorCount}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Sync Result Filter Tabs */}
                                    <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 overflow-x-auto max-w-full custom-scrollbar">
                                        {[
                                            { id: 'all' as const, label: 'Alles', count: syncStatus.processed },
                                            { id: 'success' as const, label: 'Geslaagd', count: syncStatus.successCount || 0 },
                                            { id: 'warnings' as const, label: 'Waarschuwingen', count: syncStatus.warningCount || 0 },
                                            { id: 'missing' as const, label: 'Missende Data', count: syncStatus.missingDataCount || 0 },
                                            { id: 'errors' as const, label: 'Fouten', count: syncStatus.errorCount },
                                            { id: 'excluded' as const, label: 'Uitgesloten', count: syncStatus.excludedCount || 0 },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setSyncResultFilter(tab.id)}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${syncResultFilter === tab.id
                                                    ? 'bg-theme-purple/20 text-theme-purple-lighter border border-theme-purple/30'
                                                    : 'text-theme-purple-lighter/60 hover:text-theme-purple-lighter hover:bg-white/5'
                                                    }`}
                                            >
                                                {tab.label} ({tab.count})
                                            </button>
                                        ))}
                                    </div>
                                    {/* Filtered Results */}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'success') && syncStatus.successfulUsers && syncStatus.successfulUsers.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-green-400/80 mb-2 px-1">✅ Succesvol gesynchroniseerd</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-green-400/5 border border-green-400/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.successfulUsers.map((user, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-green-400/10 last:border-0">
                                                        <div className="text-green-300">{user.email}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'warnings') && syncStatus.warnings && syncStatus.warnings.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-amber-400/80 mb-2 px-1">⚠️ Aandacht vereist (Mogelijke duplicaten)</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-amber-400/5 border border-amber-400/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.warnings.map((warn, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-amber-400/10 last:border-0">
                                                        <div className="font-bold text-amber-300">{warn.email}</div>
                                                        <div className="text-amber-200/70">{warn.message}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'missing') && syncStatus.missingData && syncStatus.missingData.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-blue-400/80 mb-2 px-1">ℹ️ Missende velden in Entra ID</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-blue-400/5 border border-blue-400/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.missingData.map((item, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-blue-400/10 last:border-0">
                                                        <div className="font-bold text-blue-300">{item.email}</div>
                                                        <div className="text-blue-200/70">{item.reason}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'excluded') && syncStatus.excludedUsers && syncStatus.excludedUsers.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-gray-400/80 mb-2 px-1">⛔ Uitgesloten van synchronisatie</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-gray-400/5 border border-gray-400/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.excludedUsers.map((user, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-gray-400/10 last:border-0">
                                                        <div className="text-gray-300">{user.email}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'errors') && syncStatus.errors.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-red-400/80 mb-2 px-1">❌ Fouten tijdens synchronisatie</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-red-400/5 border border-red-400/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.errors.map((err, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-red-400/10 last:border-0">
                                                        <span className="text-red-300">{err.email}: {err.error}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Tile>
                        </div>
                    )
                }

                {/* Filters & Content */}
                <Tile
                    title="Inschrijvingen"
                    icon={<Clock className="h-5 w-5" />}
                    actions={
                        <div className="flex gap-2">
                            {selectedIds.size > 0 && (
                                <>
                                    <button
                                        onClick={() => handleBatchAction('approve')}
                                        disabled={isBatchProcessing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/30 border border-green-500/30 transition disabled:opacity-50"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Keur ({selectedIds.size}) goed
                                    </button>
                                    <button
                                        onClick={() => handleBatchAction('reject')}
                                        disabled={isBatchProcessing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 border border-red-500/30 transition disabled:opacity-50"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Wijs ({selectedIds.size}) af
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => loadSignups()}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-theme-purple-lighter hover:bg-white/15 border border-white/10 transition disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Ververs
                            </button>
                        </div>
                    }
                >
                    {/* Filters Bar */}
                    <div className="mb-6 space-y-4 border-b border-white/5 pb-6">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            {/* Status Filter Tabs */}
                            <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 overflow-x-auto max-w-full custom-scrollbar">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilterStatus(tab.id as any)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${filterStatus === tab.id
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

                        {/* Type Filter Tabs */}
                        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 overflow-x-auto max-w-full custom-scrollbar">
                            {typeTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterType(tab.id as any)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${filterType === tab.id
                                        ? 'bg-theme-purple text-white shadow-lg'
                                        : 'text-theme-purple-lighter/60 hover:text-theme-purple-lighter hover:bg-white/5'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
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
                            {/* Desktop Table with Selection */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-white/10">
                                        <tr className="border-b border-white/5 bg-white/5">
                                            <th className="px-4 py-4 w-10">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="flex items-center justify-center text-theme-purple-lighter/60 hover:text-theme-purple-lighter"
                                                >
                                                    {selectedIds.size > 0 && selectedIds.size === signups.length ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                                </button>
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Datum</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Naam</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Email</th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Product</th>
                                            <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Bedrag</th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Betaalstatus</th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Status</th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {signups.map((signup) => (
                                            <tr key={signup.id} className={`transition-colors ${selectedIds.has(signup.id) ? 'bg-theme-purple/20' : 'hover:bg-white/5'}`}>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => toggleSelectOne(signup.id)}
                                                        className={`flex items-center justify-center ${selectedIds.has(signup.id) ? 'text-theme-purple' : 'text-theme-purple-lighter/40 hover:text-theme-purple-lighter'}`}
                                                    >
                                                        {selectedIds.has(signup.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter">
                                                    {signup.created_at ? format(new Date(signup.created_at), 'd MMM HH:mm') : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-white">
                                                    {signup.first_name} {signup.last_name}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter/80">
                                                    {signup.email}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-theme-purple-lighter/80">
                                                    <div>
                                                        {signup.product_name || 'Lidmaatschap'}
                                                        {signup.coupon_code && (
                                                            <div className="flex items-center gap-1 text-xs text-theme-purple font-medium mt-0.5">
                                                                <Tag className="h-3 w-3" />
                                                                {signup.coupon_code}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm font-mono text-theme-purple-lighter">
                                                    {formatAmount(signup.amount)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${signup.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' :
                                                        signup.payment_status === 'open' ? 'bg-blue-500/10 text-blue-400' :
                                                            'bg-red-500/10 text-red-400'
                                                        }`}>
                                                        {signup.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${signup.approval_status === 'approved' || signup.approval_status === 'auto_approved' ? 'bg-green-500/10 text-green-400' :
                                                        signup.approval_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                            'bg-amber-500/10 text-amber-400'
                                                        }`}>
                                                        {signup.approval_status === 'pending' ? 'Te keuren' : signup.approval_status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {signup.approval_status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(signup.id)}
                                                                    disabled={isProcessing === signup.id || isBatchProcessing}
                                                                    className="rounded-lg bg-green-500/20 p-1.5 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
                                                                    title="Goedkeuren"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(signup.id)}
                                                                    disabled={isProcessing === signup.id || isBatchProcessing}
                                                                    className="rounded-lg bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
                                                                    title="Afwijzen"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List View */}
                            <div className="md:hidden space-y-4">
                                {signups.map((signup) => (
                                    <div key={signup.id} className={`rounded-xl border p-4 ${selectedIds.has(signup.id) ? 'bg-theme-purple/10 border-theme-purple/30' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-start justify-between">
                                            <button
                                                onClick={() => toggleSelectOne(signup.id)}
                                                className={`mr-3 mt-1 ${selectedIds.has(signup.id) ? 'text-theme-purple' : 'text-theme-purple-lighter/40'}`}
                                            >
                                                {selectedIds.has(signup.id) ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                                            </button>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-theme-purple-lighter/60">
                                                        {signup.created_at ? format(new Date(signup.created_at), 'd MMM HH:mm') : '-'}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${signup.approval_status === 'approved' ? 'bg-green-500/10 text-green-400' :
                                                            signup.approval_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                                'bg-amber-500/10 text-amber-400'
                                                            }`}>
                                                            {signup.approval_status}
                                                        </span>
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${signup.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                            {signup.payment_status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold text-white">{signup.first_name} {signup.last_name}</h3>
                                                <p className="text-sm text-theme-purple-lighter/80">{signup.email}</p>
                                                <div className="mt-1">
                                                    <p className="text-xs text-theme-purple-lighter/50">{signup.product_name}</p>
                                                    {signup.coupon_code && (
                                                        <p className="text-xs text-theme-purple flex items-center gap-1 mt-0.5">
                                                            <Tag className="h-3 w-3" />
                                                            {signup.coupon_code}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="font-mono text-sm text-theme-purple-lighter">{formatAmount(signup.amount)}</span>
                                                    <div className="flex gap-2">
                                                        {signup.approval_status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(signup.id)}
                                                                    className="rounded-lg bg-green-500/20 p-2 text-green-400"
                                                                >
                                                                    <CheckCircle className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(signup.id)}
                                                                    className="rounded-lg bg-red-500/20 p-2 text-red-400"
                                                                >
                                                                    <XCircle className="h-5 w-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
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
