'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { RefreshCw } from 'lucide-react';
import { usePagePermission } from '@/shared/lib/hooks/usePermissions';

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
                                <div className="shrink-0 rounded-xl bg-theme-purple/10 p-2 text-theme-text dark:text-theme-purple-lighter">
                                    {icon}
                                </div>
                            ) : null}
                            {title ? (
                                <h2 className="truncate text-lg font-bold text-theme-text dark:text-theme-purple-lighter">
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

export default function SyncPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { isAuthorized, isLoading: permissionLoading } = usePagePermission('admin_sync', ['ict', 'bestuur', 'kandi']);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

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
        if (!permissionLoading && isAuthorized === false) {
            router.push('/admin');
        }
        if (!permissionLoading && !user && isAuthorized === null) {
            const returnTo = window.location.pathname + window.location.search;
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        }
    }, [isAuthorized, permissionLoading, user, router]);


    useEffect(() => {
        if (user && !user.entra_id) {
            router.push('/account');
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.entra_id) {
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
                } else if (isSyncing && !data.active) {
                    setIsSyncing(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch sync status:', error);
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
            fetchSyncStatus();
        } catch (error: any) {
            console.error('Failed to sync users:', error);
            alert(`Fout bij starten synchronisatie: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    if (permissionLoading || isAuthorized === null) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple mb-4" />
                    <div className="text-theme-text dark:text-theme-purple-lighter text-xl font-semibold">
                        Toegang controleren...
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="text-theme-text dark:text-theme-purple-lighter text-xl font-semibold">
                    Geen toegang - onvoldoende rechten
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-theme-text dark:text-theme-purple-lighter flex items-center gap-3">
                        <RefreshCw className="h-8 w-8" />
                        Synchronisatie
                    </h1>
                    <p className="mt-1 text-sm text-theme-text/60 dark:text-theme-purple-lighter/60">
                        Synchroniseer gebruikers met Microsoft Entra ID.
                    </p>
                </div>

                <div className="mb-6">
                    <Tile title="Acties" className="mb-6">
                        <div className="flex flex-col items-start gap-4">
                            {/* Sync Controls */}
                            <div className="w-full">
                                <label className="text-sm font-medium text-theme-text dark:text-theme-purple-lighter mb-2 block">Te synchroniseren velden:</label>
                                <div className="flex flex-wrap gap-2">
                                    {syncFieldOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => toggleField(option.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm ${selectedSyncFields.includes(option.id)
                                                ? 'bg-theme-purple text-white border-theme-purple'
                                                : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 text-theme-text/60 dark:text-theme-purple-lighter/60 hover:border-theme-purple/40 hover:text-theme-purple'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 sm:items-center w-full">
                                {/* Force Link Checkbox */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="forceLink"
                                        checked={forceLink}
                                        onChange={(e) => setForceLink(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 bg-white/5 text-theme-purple focus:ring-theme-purple focus:ring-offset-0"
                                    />
                                    <label htmlFor="forceLink" className="text-xs text-theme-text/70 dark:text-theme-purple-lighter/70 cursor-pointer">
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
                                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 bg-white/5 text-theme-purple focus:ring-theme-purple focus:ring-offset-0"
                                    />
                                    <label htmlFor="activeOnly" className="text-xs text-theme-text/70 dark:text-theme-purple-lighter/70 cursor-pointer">
                                        Alleen actieve leden synchroniseren (sneller)
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleSyncUsers}
                                    disabled={isSyncing}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-theme-purple text-white hover:bg-theme-purple-light rounded-xl shadow-lg hover:shadow-theme-purple/20 transition-all font-bold disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Synchroniseren...' : 'Start Synchronisatie'}
                                </button>
                            </div>
                        </div>
                    </Tile>

                    {/* Sync Status Tile */}
                    {syncStatus && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <Tile
                                title="Synchronisatie Status"
                                icon={<RefreshCw className={`h-5 w-5 ${syncStatus.active ? 'animate-spin' : ''}`} />}
                            >
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <span className="text-sm font-medium text-theme-text/70 dark:text-theme-purple-lighter/70 block mb-1">Voortgang</span>
                                                <span className="text-2xl font-bold text-theme-text dark:text-theme-purple-lighter">
                                                    {syncStatus.total > 0 ? Math.round((syncStatus.processed / syncStatus.total) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="text-right text-sm text-theme-text/60 dark:text-theme-purple-lighter/60">
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
                                            <div className="text-sm text-theme-text/60 dark:text-theme-purple-lighter/60 mb-1">Status</div>
                                            <div className={`font-bold capitalize ${syncStatus.status === 'completed' ? 'text-theme-success' :
                                                syncStatus.status === 'failed' ? 'text-theme-error' : 'text-theme-text dark:text-theme-purple-lighter'
                                                }`}>
                                                {syncStatus.status === 'running' ? 'Bezig...' :
                                                    syncStatus.status === 'completed' ? 'Voltooid' :
                                                        syncStatus.status === 'failed' ? 'Mislukt' : 'Inactief'}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="text-sm text-theme-text/60 dark:text-theme-purple-lighter/60 mb-1">Waarschuwingen</div>
                                            <div className={`font-bold ${(syncStatus.warningCount || 0) > 0 ? 'text-theme-warning' : 'text-theme-text dark:text-theme-purple-lighter'}`}>
                                                {syncStatus.warningCount || 0}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="text-sm text-theme-text/60 dark:text-theme-purple-lighter/60 mb-1">Missende Data</div>
                                            <div className={`font-bold ${(syncStatus.missingDataCount || 0) > 0 ? 'text-theme-info' : 'text-theme-text dark:text-theme-purple-lighter'}`}>
                                                {syncStatus.missingDataCount}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="text-sm text-theme-text/60 dark:text-theme-purple-lighter/60 mb-1">Fouten</div>
                                            <div className={`font-bold ${syncStatus.errorCount > 0 ? 'text-theme-error' : 'text-theme-text dark:text-theme-purple-lighter'}`}>
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
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap shadow-sm ${syncResultFilter === tab.id
                                                    ? 'bg-theme-purple text-white'
                                                    : 'bg-white dark:bg-white/5 text-theme-text/60 dark:text-theme-purple-lighter/60 hover:text-theme-purple hover:bg-theme-purple/5'
                                                    }`}
                                            >
                                                {tab.label} ({tab.count})
                                            </button>
                                        ))}
                                    </div>
                                    {/* Filtered Results */}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'success') && syncStatus.successfulUsers && syncStatus.successfulUsers.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-theme-success/80 mb-2 px-1">✅ Succesvol gesynchroniseerd</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-theme-success/5 border border-theme-success/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.successfulUsers.map((user, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-theme-success/10 last:border-0">
                                                        <div className="text-theme-success">{user.email}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'warnings') && syncStatus.warnings && syncStatus.warnings.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-theme-warning/80 mb-2 px-1">⚠️ Aandacht vereist (Mogelijke duplicaten)</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-theme-warning/5 border border-theme-warning/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.warnings.map((warn, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-theme-warning/10 last:border-0">
                                                        <div className="font-bold text-theme-warning">{warn.email}</div>
                                                        <div className="text-theme-text/70 dark:text-theme-purple-lighter/70">{warn.message}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(syncResultFilter === 'all' || syncResultFilter === 'missing') && syncStatus.missingData && syncStatus.missingData.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-medium text-theme-info/80 mb-2 px-1">ℹ️ Missende velden in Entra ID</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-theme-info/5 border border-theme-info/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.missingData.map((item, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-theme-info/10 last:border-0">
                                                        <div className="font-bold text-theme-info">{item.email}</div>
                                                        <div className="text-theme-text/70 dark:text-theme-purple-lighter/70">{item.reason}</div>
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
                                            <div className="text-xs font-medium text-theme-error/80 mb-2 px-1">❌ Fouten tijdens synchronisatie</div>
                                            <div className="max-h-48 overflow-y-auto rounded-xl bg-theme-error/5 border border-theme-error/10 p-2 space-y-1 custom-scrollbar">
                                                {syncStatus.errors.map((err, idx) => (
                                                    <div key={idx} className="p-2 text-xs border-b border-theme-error/10 last:border-0">
                                                        <span className="text-theme-error">{err.email}: {err.error}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Tile>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
