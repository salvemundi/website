'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, AlertCircle, X, Info, Activity, UserPlus, CheckCircle
} from 'lucide-react';
import { triggerFullSyncAction, getSyncStatusAction, stopSyncAction, triggerUserSyncAction } from '@/server/actions/azure-sync.actions';
import { Skeleton } from '@/components/ui/Skeleton';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import SyncStatus from '@/components/admin/sync/SyncStatus';
import SyncOverview from '@/components/admin/sync/SyncOverview';
import SyncLogs from '@/components/admin/sync/SyncLogs';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

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
    movedActiveCount: number;
    movedExpiredCount: number;
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

export default function AzureSyncIsland({ isLoading: propIsLoading = false }: { isLoading?: boolean }) {
    const [mounted, setMounted] = useState(false);
    const { toast, showToast, hideToast } = useAdminToast();
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isUserSyncLoading, setIsUserSyncLoading] = useState(false);
    const [userId, setUserId] = useState('');
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

    if (!mounted) return null;
    
    const showSkeleton = propIsLoading || (isLoading && !status);

    const handleFullSync = async () => {
        setIsStartingSync(true);
        try {
            const result = await triggerFullSyncAction({
                fields: selectedSyncFields,
                forceLink,
                activeOnly
            });
            if (!result.success) {
                showToast(result.error || 'Kon sync niet starten', 'error');
            } else {
                showToast('Azure synchronisatie gestart', 'success');
                fetchStatus();
            }
        } catch (err) {
            showToast('Netwerkfout bij het starten van de sync.', 'error');
        } finally {
            setIsStartingSync(false);
        }
    };

    const handleStopSync = async () => {
        setIsStopping(true);
        try {
            const result = await stopSyncAction();
            if (!result.success) {
                showToast(result.error || 'Kon sync niet stoppen', 'error');
            } else {
                showToast('Synchronisatie afgebroken', 'info');
                fetchStatus();
            }
        } catch (err) {
            showToast('Netwerkfout bij het stoppen van de sync.', 'error');
        } finally {
            setIsStopping(false);
        }
    };

    const handleUserSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId.trim()) return;
        setIsUserSyncLoading(true);
        try {
            const result = await triggerUserSyncAction(userId.trim());
            if (!result.success) {
                showToast(result.error || 'Fout bij individuele sync', 'error');
            } else {
                showToast(`Gebruiker ${userId} succesvol gesynchroniseerd`, 'success');
                setUserId('');
            }
        } catch (err) {
            showToast('Netwerkfout bij het synchroniseren van de gebruiker.', 'error');
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
        { label: 'Verlopen', value: status?.movedExpiredCount || 0, icon: Activity, trend: 'Moved' },
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
                {showSkeleton ? (
                    <div className="space-y-8 animate-pulse">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] shadow-sm border border-[var(--beheer-border)] min-h-[480px]">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-12 w-12 rounded-2xl" />
                                            <Skeleton className="h-6 w-32 rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <Skeleton className="h-4 w-40 mb-4" />
                                        <div className="flex flex-wrap gap-2">
                                            {[1, 2, 3, 4].map(i => (
                                                <Skeleton key={i} className="h-10 w-28 rounded-xl" />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--beheer-border)]">
                                            <Skeleton className="h-[72px] rounded-2xl" />
                                            <Skeleton className="h-[72px] rounded-2xl" />
                                        </div>
                                        <Skeleton className="h-16 w-full rounded-2xl mt-4" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] shadow-sm border border-[var(--beheer-border)] h-full min-h-[480px]">
                                    <div className="flex items-center gap-4 mb-8">
                                        <Skeleton className="h-12 w-12 rounded-2xl" />
                                        <Skeleton className="h-6 w-24 rounded-lg" />
                                    </div>
                                    <div className="space-y-3 mb-8">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                    <div className="space-y-4">
                                        <Skeleton className="h-14 w-full rounded-2xl" />
                                        <Skeleton className="h-14 w-full rounded-2xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[var(--beheer-card-soft)] p-8 rounded-[2.5rem] border border-[var(--beheer-border)] flex gap-6">
                            <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                            <div className="space-y-2 w-full">
                                <Skeleton className="h-5 w-64" />
                                <div className="space-y-2 pt-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <AdminStatsBar stats={adminStats} />

                <div className="space-y-8">
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
                    </>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
