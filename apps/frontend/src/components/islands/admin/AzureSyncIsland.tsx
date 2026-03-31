'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, AlertCircle, X, Info, Activity, UserPlus, CheckCircle
} from 'lucide-react';
import { triggerFullSyncAction, getSyncStatusAction, stopSyncAction, triggerUserSyncAction } from '@/server/actions/azure-sync.actions';
import SyncSkeleton from '@/components/ui/admin/SyncSkeleton';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import SyncStatus from '@/components/admin/sync/SyncStatus';
import SyncOverview from '@/components/admin/sync/SyncOverview';
import SyncLogs from '@/components/admin/sync/SyncLogs';

interface SyncStatus {
    jobId?: string;
    active: boolean;
    status: 'idle' | 'running' | 'completed' | 'failed' | 'aborted';
    total: number;
    processed: number;
    errorCount: number;
    warningCount: number;
    missingDataCount: number;
    successCount: number;
    excludedCount: number;
    createdCount: number;
    errors: { email: string; message: string; timestamp: string }[];
    warnings: { email: string; message: string }[];
    missingData: { email: string; reason: string }[];
    successfulUsers: { email: string }[];
    excludedUsers: { email: string }[];
    createdUsers: { email: string }[];
    startTime?: string;
    endTime?: string;
    lastHeartbeat?: string;
    abortRequested?: boolean;
}

const syncFieldOptions = [
    { id: 'membership_expiry', label: 'Lidmaatschap vervaldatum' },
    { id: 'geboortedatum', label: 'Geboortedatum' },
    { id: 'phone_number', label: 'Mobiel nummer' },
    { id: 'committees', label: 'Commissies' },
];

export default function AzureSyncIsland() {
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isUserSyncLoading, setIsUserSyncLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedSyncFields, setSelectedSyncFields] = useState<string[]>(['membership_expiry', 'geboortedatum', 'phone_number', 'committees']);
    const [forceLink, setForceLink] = useState(false);
    const [activeOnly, setActiveOnly] = useState(false);
    const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'created' | 'warnings' | 'missing' | 'errors' | 'excluded'>('all');

    const fetchStatus = useCallback(async () => {
        try {
            const data = await getSyncStatusAction();
            if (data && 'status' in data) {
                setStatus(data as SyncStatus);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch sync status:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (!mounted) return;
        
        let timeout: NodeJS.Timeout;
        const shouldPoll = status?.active || status?.status === 'running' || isStartingSync;
        
        const poll = async () => {
            if (!shouldPoll) return;
            await fetchStatus();
            timeout = setTimeout(poll, 2000); 
        };

        if (shouldPoll) {
            poll();
        }

        return () => clearTimeout(timeout);
    }, [status?.active, status?.status, isStartingSync, fetchStatus, mounted]);

    if (!mounted || (isLoading && !status)) return <SyncSkeleton />;

    const handleFullSync = async () => {
        setIsStartingSync(true);
        setError(null);
        try {
            const result = await triggerFullSyncAction({
                fields: selectedSyncFields,
                forceLink,
                activeOnly
            });
            if (!result.success) {
                setError(result.error || 'Kon sync niet starten');
            } else {
                fetchStatus();
            }
        } catch (err) {
            setError('Netwerkfout bij het starten van de sync.');
        } finally {
            setIsStartingSync(false);
        }
    };

    const handleStopSync = async () => {
        setIsStopping(true);
        setError(null);
        try {
            const result = await stopSyncAction();
            if (!result.success) {
                setError(result.error || 'Kon sync niet stoppen');
            } else {
                fetchStatus();
            }
        } catch (err) {
            setError('Netwerkfout bij het stoppen van de sync.');
        } finally {
            setIsStopping(false);
        }
    };

    const handleUserSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId.trim()) return;
        setIsUserSyncLoading(true);
        setError(null);
        try {
            const result = await triggerUserSyncAction(userId.trim());
            if (!result.success) {
                setError(result.error || 'Fout bij individuele sync');
            } else {
                setUserId('');
            }
        } catch (err) {
            setError('Netwerkfout bij het synchroniseren van de gebruiker.');
        } finally {
            setIsUserSyncLoading(false);
        }
    };

    const toggleField = (id: string) => {
        setSelectedSyncFields(prev => 
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const progress = status ? (status.total > 0 ? (status.processed / status.total) * 100 : 0) : 0;

    const adminStats = [
        { label: 'Status', value: status?.status || 'idle', icon: Activity, trend: status?.active ? 'Running' : 'Standby' },
        { label: 'Geslaagd', value: status?.successCount || 0, icon: CheckCircle, trend: 'Leden' },
        { label: 'Fouten', value: status?.errorCount || 0, icon: AlertCircle, trend: 'Issues' },
        { label: 'Nieuw', value: status?.createdCount || 0, icon: UserPlus, trend: 'Created' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Azure Sync"
                subtitle="Synchroniseer met Microsoft Azure AD"
                backHref="/beheer"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={fetchStatus}
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95"
                        >
                            <RefreshCw className={`h-4 w-4 ${status?.active ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AdminStatsBar stats={adminStats} />

                <div className="space-y-8">
                    {/* Global Error Banner */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-[var(--beheer-inactive)]/10 border border-[var(--beheer-inactive)]/20 rounded-[var(--beheer-radius)] text-[var(--beheer-inactive)] animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto hover:bg-[var(--beheer-inactive)]/10 p-1 rounded-lg">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <SyncOverview 
                        status={status}
                        selectedSyncFields={selectedSyncFields}
                        toggleField={toggleField}
                        forceLink={forceLink}
                        setForceLink={setForceLink}
                        activeOnly={activeOnly}
                        setActiveOnly={setActiveOnly}
                        isStopping={isStopping}
                        isStartingSync={isStartingSync}
                        handleStopSync={handleStopSync}
                        handleFullSync={handleFullSync}
                        userId={userId}
                        setUserId={setUserId}
                        isUserSyncLoading={isUserSyncLoading}
                        handleUserSync={handleUserSync}
                        syncFieldOptions={syncFieldOptions}
                    />

                    {status && (
                        <SyncStatus 
                            status={status}
                            progress={progress}
                            lastUpdated={lastUpdated}
                        />
                    )}

                    {status && (
                        <SyncLogs 
                            resultFilter={resultFilter}
                            setResultFilter={setResultFilter}
                            status={status}
                        />
                    )}

                    {/* Documentation Alert */}
                    <div className="bg-gradient-to-br from-[var(--beheer-accent)]/5 to-[var(--beheer-accent)]/10 p-10 rounded-[2.5rem] border border-[var(--beheer-border)] flex gap-6 items-start">
                        <div className="p-3 bg-[var(--beheer-accent)]/10 rounded-2xl text-[var(--beheer-accent)] shrink-0">
                            <Info className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-black uppercase tracking-widest text-[var(--beheer-text)]">Hoe werkt de Azure Synchronisatie?</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] leading-relaxed">
                                Dit proces koppelt de Microsoft 365 groepen van Salve Mundi aan de commissies in deze portal. 
                                Tevens worden verloopdata van lidmaatschappen en andere profielgegevens ververst op basis van Azure AD attributes. 
                                <strong className="text-[var(--beheer-inactive)] ml-1">Let op:</strong> Dit heeft invloed op wie toegang heeft tot de Beheer-secties en commissie-rechten.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
