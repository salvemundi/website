'use client';

import React, { useState } from 'react';
import { 
    Clock, Server, RefreshCw, History, Shield
} from 'lucide-react';
import { 
    approveSignupAction, 
    rejectSignupAction,
    updateAuditSettingsAction,
    getSystemLogsAction,
    bulkApproveSignupsAction,
    bulkRejectSignupsAction
} from '@/server/actions/audit.actions';
import { type PendingSignup, type QueueInfo, type SystemLog } from '@salvemundi/validations';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

import PendingTab from './audit/PendingTab';
import LogsTab from './audit/LogsTab';
import QueuesTab from './audit/QueuesTab';


interface AuditLogIslandProps {
    initialData: {
        signups: PendingSignup[];
        manualApproval: boolean;
        adminLogs: SystemLog[];
        adminLogsTotal: number;
        systemLogs: SystemLog[];
        systemLogsTotal: number;
        queueData: Record<string, QueueInfo>;
    };
}

export default function AuditLogIsland({ initialData }: AuditLogIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'pending' | 'admin_logs' | 'system_logs' | 'queues'>('pending');
    
    const [signups, setSignups] = useState<PendingSignup[]>(initialData.signups);
    const [adminLogs, setAdminLogs] = useState<SystemLog[]>(initialData.adminLogs);
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>(initialData.systemLogs);
    const [adminLogsTotalCount, setAdminLogsTotalCount] = useState(initialData.adminLogsTotal);
    const [systemLogsTotalCount, setSystemLogsTotalCount] = useState(initialData.systemLogsTotal);
    const [queueData, _setQueueData] = useState<Record<string, QueueInfo>>(initialData.queueData);
    
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState<'approve' | 'reject' | null>(null);
    const [manualApproval, setManualApproval] = useState(initialData.manualApproval);
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    const refreshLogs = async () => {
        const [adminLogsRes, systemLogsRes] = await Promise.all([
            getSystemLogsAction(50, 'admin'),
            getSystemLogsAction(50, 'system')
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

    // Only membership types remain in the queue
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
                refreshLogs();
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
                refreshLogs();
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
            refreshLogs();
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

    const _adminStats = [
        { label: 'Wachtrij', value: signups.length, icon: Clock, trend: 'Pending' },
        { label: 'Beheerder', value: adminLogsTotalCount, icon: Shield, trend: 'Actions' },
        { label: 'Systeem', value: systemLogsTotalCount, icon: History, trend: 'Events' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="space-y-6 mt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-1 bg-[var(--beheer-card-soft)] p-1 rounded-2xl w-fit border border-[var(--beheer-border)]">
                        {[
                            { id: 'pending', label: 'Wachtrij', icon: Clock },
                            { id: 'admin_logs', label: 'Beheerder', icon: Shield },
                            { id: 'system_logs', label: 'Systeem', icon: Server },
                            { id: 'queues', label: 'Wachtrijen', icon: RefreshCw },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[11px] transition-all ${activeTab === tab.id ? 'bg-[var(--beheer-card-bg)] shadow-md text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}
                            >
                                <tab.icon className="h-3 w-3" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Compact Config Toggle */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-[var(--beheer-card-soft)] rounded-2xl border border-[var(--beheer-border)] shadow-sm">
                        <div className="flex items-center gap-2">
                            <Shield className={`h-3.5 w-3.5 ${manualApproval ? 'text-amber-500' : 'text-green-500'}`} />
                            <span className="text-[11px] font-semibold text-[var(--beheer-text)] leading-tight">
                                {manualApproval 
                                    ? "Handmatige goedkeuring is ACTIEF. Alle aanmeldingen moeten worden goedgekeurd."
                                    : "Automatische goedkeuring is ACTIEF. Aanmeldingen worden direct verwerkt."}
                            </span>
                        </div>
                        <button 
                            onClick={toggleManualApproval}
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
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onBulkApprove={handleBulkApprove}
                        onBulkReject={handleBulkReject}
                        onRefresh={refreshLogs}
                    />
                )}

                {activeTab === 'admin_logs' && (
                    <LogsTab 
                        logs={adminLogs}
                        onRefresh={refreshLogs}
                        title="Beheerder Acties"
                    />
                )}

                {activeTab === 'system_logs' && (
                    <LogsTab 
                        logs={systemLogs}
                        onRefresh={refreshLogs}
                        title="Systeem Events"
                        actions={
                            <a
                                href="/beheer/sync"
                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] rounded-lg text-xs font-semibold hover:bg-[var(--beheer-accent)]/20 transition-all active:scale-95"
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
