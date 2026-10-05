'use client';

import { useState } from 'react';
import {
    Shield
} from 'lucide-react';
import {
    approveSignupAction,
    rejectSignupAction,
    updateAuditSettingsAction,
    getSystemLogsAction,
    getQueueStatusAction,
    bulkApproveSignupsAction,
    bulkRejectSignupsAction
} from '@/server/actions/infrastructure/audit.actions';
import { type PendingSignup, type QueueInfo, type SystemLog } from '@salvemundi/validations';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';

import PendingTab from './audit/PendingTab';
import LogsTab from './audit/LogsTab';
import QueuesTab from './audit/QueuesTab';


interface QueueDataMap {
    new_users?: QueueInfo;
    sync_existing?: QueueInfo;
}

interface AuditLogIslandProps {
    initialData: {
        signups: PendingSignup[];
        manualApproval: boolean;
        adminLogs: SystemLog[];
        adminLogsTotal: number;
        systemLogs: SystemLog[];
        systemLogsTotal: number;
        idNameLookup: Record<string, string>;
    };
}

export default function AuditLogIsland({ initialData }: AuditLogIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'pending' | 'admin_logs' | 'system_logs' | 'queues'>('admin_logs');
    
    const [idNameLookup, setIdNameLookup] = useState<Record<string, string>>(initialData.idNameLookup);

    const [signups, setSignups] = useState<PendingSignup[]>(initialData.signups);
    const [adminLogs, setAdminLogs] = useState<SystemLog[]>(initialData.adminLogs);
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>(initialData.systemLogs);
    const [adminLogsTotalCount, setAdminLogsTotalCount] = useState(initialData.adminLogsTotal);
    const [systemLogsTotalCount, setSystemLogsTotalCount] = useState(initialData.systemLogsTotal);

    const [queueData, setQueueData] = useState<QueueDataMap | null>(null);
    const [isLoadingQueues, setIsLoadingQueues] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);
    const [hasFetchedQueues, setHasFetchedQueues] = useState(false);

    const fetchQueueData = async () => {
        setIsLoadingQueues(true);
        setQueueError(null);
        try {
            const res = await getQueueStatusAction();
            if (res.success) {
                setQueueData(res.data.queues);
            } else {
                setQueueData(null);
                setQueueError(res.error || 'Wachtrij status niet beschikbaar');
            }
        } catch {
            setQueueData(null);
            setQueueError('Fout bij ophalen wachtrij status');
        } finally {
            setIsLoadingQueues(false);
            setHasFetchedQueues(true);
        }
    };

    const handleTabChange = (tabId: 'pending' | 'admin_logs' | 'system_logs' | 'queues') => {
        setActiveTab(tabId);
        if (tabId === 'queues' && !hasFetchedQueues && !isLoadingQueues) {
            void fetchQueueData();
        }
    };

    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState<'approve' | 'reject' | null>(null);
    const [manualApproval, setManualApproval] = useState(initialData.manualApproval);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [adminLogsLimit, setAdminLogsLimit] = useState(50);
    const [systemLogsLimit, setSystemLogsLimit] = useState(50);
    const [adminSearch, setAdminSearch] = useState('');
    const [systemSearch, setSystemSearch] = useState('');

    const refreshLogs = async () => {
        const [adminLogsRes, systemLogsRes] = await Promise.all([
            getSystemLogsAction(adminLogsLimit, 'admin', adminSearch),
            getSystemLogsAction(systemLogsLimit, 'system', systemSearch)
        ]);

        if (adminLogsRes.success) {
            setAdminLogs(adminLogsRes.data);
            setAdminLogsTotalCount(adminLogsRes.totalCount);
            setIdNameLookup(prev => ({ ...prev, ...(adminLogsRes.resolvedNames || {}) }));
        }
        if (systemLogsRes.success) {
            setSystemLogs(systemLogsRes.data);
            setSystemLogsTotalCount(systemLogsRes.totalCount);
            setIdNameLookup(prev => ({ ...prev, ...(systemLogsRes.resolvedNames || {}) }));
        }
    };

    const loadMoreAdminLogs = async () => {
        const newLimit = adminLogsLimit + 50;
        setAdminLogsLimit(newLimit);
        const res = await getSystemLogsAction(newLimit, 'admin', adminSearch);
        if (res.success) {
            setAdminLogs(res.data);
            setAdminLogsTotalCount(res.totalCount);
            setIdNameLookup(prev => ({ ...prev, ...(res.resolvedNames || {}) }));
        }
    };

    const loadMoreSystemLogs = async () => {
        const newLimit = systemLogsLimit + 50;
        setSystemLogsLimit(newLimit);
        const res = await getSystemLogsAction(newLimit, 'system', systemSearch);
        if (res.success) {
            setSystemLogs(res.data);
            setSystemLogsTotalCount(res.totalCount);
            setIdNameLookup(prev => ({ ...prev, ...(res.resolvedNames || {}) }));
        }
    };

    const handleAdminSearch = async (query: string) => {
        setAdminSearch(query);
        const res = await getSystemLogsAction(adminLogsLimit, 'admin', query);
        if (res.success) {
            setAdminLogs(res.data);
            setAdminLogsTotalCount(res.totalCount);
            setIdNameLookup(prev => ({ ...prev, ...(res.resolvedNames || {}) }));
        }
    };

    const handleSystemSearch = async (query: string) => {
        setSystemSearch(query);
        const res = await getSystemLogsAction(systemLogsLimit, 'system', query);
        if (res.success) {
            setSystemLogs(res.data);
            setSystemLogsTotalCount(res.totalCount);
            setIdNameLookup(prev => ({ ...prev, ...(res.resolvedNames || {}) }));
        }
    };

    const filteredSignups = signups;

    const handleApprove = async (id: string, type: string) => {
        setIsProcessing(id);
        try {
            const res = await approveSignupAction(id, type);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
                showToast(type === 'membership_renewal' ? 'Verlenging goedgekeurd' : 'Inschrijving goedgekeurd', 'success');
                const adminLogsRes = await getSystemLogsAction(50, 'admin');
                if (adminLogsRes.success) {
                    setAdminLogs(adminLogsRes.data);
                    setAdminLogsTotalCount(adminLogsRes.totalCount);
                    setIdNameLookup(prev => ({ ...prev, ...(adminLogsRes.resolvedNames || {}) }));
                }
            } else {
                showToast(res.error || 'Goedkeuren mislukt', 'error');
            }
        } catch {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (id: string, type: string) => {
        if (!confirm(`Weet je zeker dat je deze ${type === 'membership_renewal' ? 'verlenging' : 'inschrijving'} wilt afwijzen?`)) return;
        setIsProcessing(id);
        try {
            const res = await rejectSignupAction(id, type);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
                showToast(type === 'membership_renewal' ? 'Verlenging afgewezen' : 'Inschrijving afgewezen', 'info');
                const adminLogsRes = await getSystemLogsAction(50, 'admin');
                if (adminLogsRes.success) {
                    setAdminLogs(adminLogsRes.data);
                    setAdminLogsTotalCount(adminLogsRes.totalCount);
                    setIdNameLookup(prev => ({ ...prev, ...(adminLogsRes.resolvedNames || {}) }));
                }
            } else {
                showToast(res.error || 'Afwijzen mislukt', 'error');
            }
        } catch {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing('approve');
        try {
            const itemsToProcess = filteredSignups
                .filter(s => selectedIds.has(s.id))
                .map(s => ({ id: s.id, type: s.type }));

            const res = await bulkApproveSignupsAction(itemsToProcess);
            if (res.success) {
                setSignups(prev => prev.filter(s => !selectedIds.has(s.id)));
                setSelectedIds(new Set());
                showToast(`${itemsToProcess.length} inschrijvingen goedgekeurd`, 'success');
                await refreshLogs();
            } else {
                showToast(res.error || 'Bulk goedkeuren mislukt', 'error');
            }
        } catch {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsBulkProcessing(null);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Weet je zeker dat je ${selectedIds.size} inschrijvingen wilt afwijzen?`)) return;
        setIsBulkProcessing('reject');
        try {
            const itemsToProcess = filteredSignups
                .filter(s => selectedIds.has(s.id))
                .map(s => ({ id: s.id, type: s.type }));

            const res = await bulkRejectSignupsAction(itemsToProcess);
            if (res.success) {
                setSignups(prev => prev.filter(s => !selectedIds.has(s.id)));
                setSelectedIds(new Set());
                showToast(`${itemsToProcess.length} inschrijvingen afgewezen`, 'info');
                await refreshLogs();
            } else {
                showToast(res.error || 'Bulk afwijzen mislukt', 'error');
            }
        } catch {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsBulkProcessing(null);
        }
    };

    const toggleManualApproval = async () => {
        const newValue = !manualApproval;
        setManualApproval(newValue);
        const res = await updateAuditSettingsAction(newValue);
        if (res.success) {
            showToast(`Automatische goedkeuring ${newValue ? 'uitgeschakeld' : 'ingeschakeld'}`, 'success');
            await refreshLogs();
        } else {
            showToast(res.error || 'Fout bij bijwerken instellingen', 'error');
            setManualApproval(!newValue);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredSignups.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredSignups.map(s => s.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };



    return (
        <div className="w-full">
            <div className="page-stack-large">
                <div className="page-header-row">
                    <div className="tab-bar-container">
                        {[
                            { id: 'pending', label: 'Wachtrij'},
                            { id: 'admin_logs', label: 'Commissie'},
                            { id: 'system_logs', label: 'Systeem'},
                            { id: 'queues', label: 'Wachtrijen'},
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as typeof activeTab)}
                                data-active={activeTab === tab.id}
                                className="tab-button"
                                type="button">
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="beheer-info-banner">
                        <div className="icon-label-row">
                            <Shield data-status={manualApproval ? 'warning' : 'success'} className="status-icon" />
                            <span className="beheer-info-text">
                                {manualApproval
                                    ? "Handmatige goedkeuring is ACTIEF. Alle aanmeldingen moeten worden goedgekeurd."
                                    : "Automatische goedkeuring is ACTIEF. Aanmeldingen worden direct verwerkt."}
                            </span>
                        </div>
                        <button
                            onClick={() => { void toggleManualApproval(); }}
                            aria-label="Toggle handmatige goedkeuring"
                            data-variant={manualApproval ? 'warning' : 'success'}
                            className="btn-toggle-switch"
                            type="button"
                        >
                            <span data-active={manualApproval} className="visibility-toggle-thumb" />
                        </button>
                    </div>
                </div>

                {activeTab === 'pending' && (
                    <PendingTab
                        isProcessing={isProcessing}
                        isBulkProcessing={isBulkProcessing}
                        filteredSignups={filteredSignups}
                        selectedIds={selectedIds}
                        onToggleSelectAll={toggleSelectAll}
                        onToggleSelectOne={toggleSelectOne}
                        onApprove={(id, type) => { void handleApprove(id, type); }}
                        onReject={(id, type) => { void handleReject(id, type); }}
                        onBulkApprove={() => { void handleBulkApprove(); }}
                        onBulkReject={() => { void handleBulkReject(); }}
                        onRefresh={() => { void refreshLogs(); }}
                    />
                )}

                {activeTab === 'admin_logs' && (
                    <LogsTab
                        logs={adminLogs}
                        totalCount={adminLogsTotalCount}
                        onRefresh={() => { void refreshLogs(); }}
                        onLoadMore={() => { void loadMoreAdminLogs(); }}
                        onSearch={(q) => { void handleAdminSearch(q); }}
                        searchQuery={adminSearch}
                        title="Commissie Acties"
                        idNameLookup={idNameLookup}
                    />
                )}

                {activeTab === 'system_logs' && (
                    <LogsTab
                        logs={systemLogs}
                        totalCount={systemLogsTotalCount}
                        onRefresh={() => { void refreshLogs(); }}
                        onLoadMore={() => { void loadMoreSystemLogs(); }}
                        onSearch={(q) => { void handleSystemSearch(q); }}
                        searchQuery={systemSearch}
                        title="Systeem Events"
                        idNameLookup={idNameLookup}
                        actions={
                            <a
                                href="/beheer/sync"
                                className="beheer-button text-(--beheer-accent)"
                            >
                                Sync Beheren
                            </a>
                        }
                    />
                )}

                {activeTab === 'queues' && (
                    <QueuesTab
                        queueData={queueData}
                        isLoading={isLoadingQueues}
                        error={queueError}
                        onRefresh={() => { void fetchQueueData(); }}
                    />
                )}
            </div>
            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}
