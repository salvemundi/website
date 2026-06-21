'use client';

import React, { useState } from 'react';
import {
    Clock, Server, RefreshCw, Shield
} from 'lucide-react';
import {
    approveSignupAction,
    rejectSignupAction,
    updateAuditSettingsAction,
    getSystemLogsAction,
    bulkApproveSignupsAction,
    bulkRejectSignupsAction
} from '@/server/actions/infrastructure/audit.actions';
import { type PendingSignup, type QueueInfo, type SystemLog } from '@salvemundi/validations';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

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
        queueData: QueueDataMap | null;
        idNameLookup: Record<string, string>;
    };
}

export default function AuditLogIsland({ initialData }: AuditLogIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'pending' | 'admin_logs' | 'system_logs' | 'queues'>('admin_logs');

    const [signups, setSignups] = useState<PendingSignup[]>(initialData.signups);
    const [adminLogs, setAdminLogs] = useState<SystemLog[]>(initialData.adminLogs);
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>(initialData.systemLogs);
    const [adminLogsTotalCount, setAdminLogsTotalCount] = useState(initialData.adminLogsTotal);
    const [systemLogsTotalCount, setSystemLogsTotalCount] = useState(initialData.systemLogsTotal);
    const queueData = initialData.queueData;

    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState<'approve' | 'reject' | null>(null);
    const [manualApproval, setManualApproval] = useState(initialData.manualApproval);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [adminLogsLimit, setAdminLogsLimit] = useState(50);
    const [systemLogsLimit, setSystemLogsLimit] = useState(50);

    const refreshLogs = async () => {
        const [adminLogsRes, systemLogsRes] = await Promise.all([
            getSystemLogsAction(adminLogsLimit, 'admin'),
            getSystemLogsAction(systemLogsLimit, 'system')
        ]);

        if (adminLogsRes.success) {
            setAdminLogs(adminLogsRes.data);
            setAdminLogsTotalCount(adminLogsRes.totalCount);
        }
        if (systemLogsRes.success) {
            setSystemLogs(systemLogsRes.data);
            setSystemLogsTotalCount(systemLogsRes.totalCount);
        }
    };

    const loadMoreAdminLogs = async () => {
        const newLimit = adminLogsLimit + 50;
        setAdminLogsLimit(newLimit);
        const res = await getSystemLogsAction(newLimit, 'admin');
        if (res.success) {
            setAdminLogs(res.data);
            setAdminLogsTotalCount(res.totalCount);
        }
    };

    const loadMoreSystemLogs = async () => {
        const newLimit = systemLogsLimit + 50;
        setSystemLogsLimit(newLimit);
        const res = await getSystemLogsAction(newLimit, 'system');
        if (res.success) {
            setSystemLogs(res.data);
            setSystemLogsTotalCount(res.totalCount);
        }
    };

    const filteredSignups = signups;

    const handleApprove = async (id: string, type: string) => {
        setIsProcessing(id);
        try {
            const res = await approveSignupAction(id, type);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
                showToast('Inschrijving goedgekeurd', 'success');
                const adminLogsRes = await getSystemLogsAction(50, 'admin');
                if (adminLogsRes.success) {
                    setAdminLogs(adminLogsRes.data);
                    setAdminLogsTotalCount(adminLogsRes.totalCount);
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
        if (!confirm('Weet je zeker dat je deze inschrijving wilt afwijzen?')) return;
        setIsProcessing(id);
        try {
            const res = await rejectSignupAction(id, type);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
                showToast('Inschrijving afgewezen', 'info');
                const adminLogsRes = await getSystemLogsAction(50, 'admin');
                if (adminLogsRes.success) {
                    setAdminLogs(adminLogsRes.data);
                    setAdminLogsTotalCount(adminLogsRes.totalCount);
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
            showToast('Fout bij bijwerken instellingen', 'error');
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
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-1 bg-(--beheer-card-soft) p-1 rounded-2xl w-fit border border-(--beheer-border)">
                        {[
                            { id: 'pending', label: 'Wachtrij', icon: Clock },
                            { id: 'admin_logs', label: 'Beheerder', icon: Shield },
                            { id: 'system_logs', label: 'Systeem', icon: Server },
                            { id: 'queues', label: 'Wachtrijen', icon: RefreshCw },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[11px] transition-all ${activeTab === tab.id ? 'bg-(--beheer-card-bg) shadow-md text-(--beheer-accent)' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                            >
                                <tab.icon className="h-3 w-3" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Compact Config Toggle */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-(--beheer-card-soft) rounded-2xl border border-(--beheer-border) shadow-sm">
                        <div className="flex items-center gap-2">
                            <Shield className={`h-3.5 w-3.5 ${manualApproval ? 'text-amber-500' : 'text-green-500'}`} />
                            <span className="text-[11px] font-semibold text-(--beheer-text) leading-tight">
                                {manualApproval
                                    ? "Handmatige goedkeuring is ACTIEF. Alle aanmeldingen moeten worden goedgekeurd."
                                    : "Automatische goedkeuring is ACTIEF. Aanmeldingen worden direct verwerkt."}
                            </span>
                        </div>
                        <button
                            onClick={() => { void toggleManualApproval(); }}
                            className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-all focus:outline-none ${manualApproval ? 'bg-amber-500' : 'bg-green-500'}`}
                        >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${manualApproval ? 'translate-x-[1.2rem]' : 'translate-x-1'}`} />
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
                        title="Beheerder Acties"
                        idNameLookup={initialData.idNameLookup}
                    />
                )}

                {activeTab === 'system_logs' && (
                    <LogsTab
                        logs={systemLogs}
                        totalCount={systemLogsTotalCount}
                        onRefresh={() => { void refreshLogs(); }}
                        onLoadMore={() => { void loadMoreSystemLogs(); }}
                        title="Systeem Events"
                        idNameLookup={initialData.idNameLookup}
                        actions={
                            <a
                                href="/beheer/sync"
                                className="flex items-center gap-2 px-3 py-1.5 bg-(--beheer-accent)/10 text-(--beheer-accent) rounded-lg text-xs font-semibold hover:bg-(--beheer-accent)/20 transition-all active:scale-95"
                            >
                                Sync Beheren
                            </a>
                        }
                    />
                )}

                {activeTab === 'queues' && (
                    <QueuesTab
                        queueData={queueData}
                    />
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
