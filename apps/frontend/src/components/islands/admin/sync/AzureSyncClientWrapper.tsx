'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { triggerFullSyncAction, triggerUserSyncAction } from '@/server/actions/azure-sync/sync-tasks.actions';
import { getSyncStatusAction, stopSyncAction } from '@/server/actions/azure-sync/sync-monitoring.actions';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';

// Modular Segments
import SyncHeaderIsland from './SyncHeaderIsland';
import SyncStatsIsland from './SyncStatsIsland';
import SyncControlIsland from './SyncControlIsland';
import SyncMonitorIsland from './SyncMonitorIsland';

interface AzureSyncClientWrapperProps {
    initialStatus: any | null;
}

const syncFieldOptions = [
    { id: 'membership_expiry', label: 'Lidmaatschap vervaldatum' },
    { id: 'geboortedatum', label: 'Geboortedatum' },
    { id: 'phone_number', label: 'Mobiel nummer' },
    { id: 'committees', label: 'Commissies' },
];

export default function AzureSyncClientWrapper({ initialStatus }: AzureSyncClientWrapperProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [status, setStatus] = useState<any | null>(initialStatus);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isUserSyncLoading, setIsUserSyncLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(initialStatus ? new Date() : null);
    const [isLoading, setIsLoading] = useState(!initialStatus);

    const [selectedSyncFields, setSelectedSyncFields] = useState<string[]>(['membership_expiry', 'geboortedatum', 'phone_number', 'committees']);
    const [forceLink, setForceLink] = useState(false);
    const [activeOnly, setActiveOnly] = useState(false);
    const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'created' | 'warnings' | 'missing' | 'errors' | 'excluded'>('all');

    const fetchStatus = useCallback(async () => {
        try {
            const data = await getSyncStatusAction();
            if (data && 'status' in data) {
                setStatus(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            // Error handled by UI states
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
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
    }, [status?.active, status?.status, isStartingSync, fetchStatus]);

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

    return (
        <>
            <div className="animate-in fade-in duration-700">
                <SyncHeaderIsland 
                    isLoading={isLoading} 
                    onRefresh={fetchStatus} 
                    isActive={status?.active} 
                />

                <div className="space-y-8 mt-8">
                    <SyncStatsIsland 
                        isLoading={isLoading} 
                        status={status} 
                    />

                    <SyncControlIsland 
                        isLoading={isLoading}
                        isStartingSync={isStartingSync}
                        isStopping={isStopping}
                        isUserSyncLoading={isUserSyncLoading}
                        selectedSyncFields={selectedSyncFields}
                        toggleField={toggleField}
                        forceLink={forceLink}
                        setForceLink={setForceLink}
                        activeOnly={activeOnly}
                        setActiveOnly={setActiveOnly}
                        handleFullSync={handleFullSync}
                        handleStopSync={handleStopSync}
                        userId={userId}
                        setUserId={setUserId}
                        handleUserSync={handleUserSync}
                        syncFieldOptions={syncFieldOptions}
                        status={status}
                    />

                    <SyncMonitorIsland 
                        isLoading={isLoading}
                        status={status}
                        progress={progress}
                        lastUpdated={lastUpdated}
                        resultFilter={resultFilter}
                        setResultFilter={setResultFilter}
                    />
                </div>
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
