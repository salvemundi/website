'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { triggerFullSyncAction, triggerUserSyncAction } from '@/server/actions/azure-sync/sync-tasks.actions';
import { getSyncStatusAction, stopSyncAction, resetSyncStatusAction } from '@/server/actions/azure-sync/sync-monitoring.actions';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';

export interface SyncStatus {
    status?: string;
    active?: boolean;
    successCount?: number;
    errorCount?: number;
    warningCount?: number;
    createdCount?: number;
    missingDataCount?: number;
    movedExpiredCount?: number;
    processed?: number;
    total?: number;
    fatalError?: { message: string; stack?: string };
    abortRequested?: boolean;
    error?: string;
}

interface SyncContextType {
    status: SyncStatus | null;
    isLoading: boolean;
    isStartingSync: boolean;
    isStopping: boolean;
    isResetting: boolean;
    isUserSyncLoading: boolean;
    userId: string;
    setUserId: (id: string) => void;
    lastUpdated: Date | null;
    selectedSyncFields: string[];
    toggleField: (id: string) => void;
    forceLink: boolean;
    setForceLink: (val: boolean) => void;
    activeOnly: boolean;
    setActiveOnly: (val: boolean) => void;
    resultFilter: string;
    setResultFilter: (filter: string) => void;
    syncFieldOptions: { id: string; label: string }[];
    fetchStatus: () => Promise<void>;
    handleFullSync: () => Promise<void>;
    handleStopSync: () => Promise<void>;
    handleResetSync: () => Promise<void>;
    handleUserSync: (e: React.FormEvent) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children, initialStatus }: { children: ReactNode, initialStatus: SyncStatus | null }) {
    const { toast, showToast, hideToast } = useAdminToast();
    
    // Nuclear SSR: Initialize status directly. If null, we'll handle the empty state in the UI.
    const [status, setStatus] = useState<SyncStatus | null>(initialStatus);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isUserSyncLoading, setIsUserSyncLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(
        initialStatus && !initialStatus.error ? new Date() : null
    );

    const [selectedSyncFields, setSelectedSyncFields] = useState<string[]>(['membership_expiry', 'geboortedatum', 'phone_number', 'committees', 'profile_photo']);
    const [forceLink, setForceLink] = useState(false);
    const [activeOnly, setActiveOnly] = useState(false);
    const [resultFilter, setResultFilter] = useState<string>('all');

    const syncFieldOptions = [
        { id: 'membership_expiry', label: 'Lidmaatschap Expiry' },
        { id: 'geboortedatum', label: 'Geboortedatum' },
        { id: 'phone_number', label: 'Telefoonnummer' },
        { id: 'committees', label: 'Commissies' },
        { id: 'profile_photo', label: 'Profielfoto' },
    ];

    const fetchStatus = useCallback(async () => {
        try {
            const data = await getSyncStatusAction();
            if (data && ('status' in data || ('success' in data && data.success === false))) {
                setStatus(data);
                if ('status' in data) {
                    setLastUpdated(new Date());
                }
            }
        } catch (err) {
            // Background errors remain silent to avoid interrupting the user, 
            // but the status object will contain error details if the action fails.
        }
    }, []);

    useEffect(() => {
        // Instant UI: If no initial status from server, fetch it immediately on mount
        if (!initialStatus) {
            fetchStatus();
        }
    }, [initialStatus, fetchStatus]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const isRunning = status?.active || status?.status === 'running' || status?.status === 'starting';
        const shouldPoll = isRunning || isStartingSync;
        
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

    const handleResetSync = async () => {
        setIsResetting(true);
        try {
            const result = await resetSyncStatusAction();
            if (!result.success) {
                showToast(result.error || 'Kon sync niet resetten', 'error');
            } else {
                showToast('Synchronisatie status gereset naar Idle', 'success');
                fetchStatus();
            }
        } catch (err) {
            showToast('Netwerkfout bij het resetten van de sync.', 'error');
        } finally {
            setIsResetting(false);
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
                fetchStatus();
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

    return (
        <SyncContext.Provider value={{
            status, isLoading: false, isStartingSync, isStopping, isResetting, isUserSyncLoading,
            userId, setUserId, lastUpdated, selectedSyncFields, toggleField,
            forceLink, setForceLink, activeOnly, setActiveOnly,
            resultFilter, setResultFilter, syncFieldOptions, fetchStatus,
            handleFullSync, handleStopSync, handleResetSync, handleUserSync
        }}>
            {children}
            <AdminToast toast={toast} onClose={hideToast} />
        </SyncContext.Provider>
    );
}

export function useSync() {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
}
