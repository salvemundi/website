'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Clock, Tag, Server, RefreshCw, History, Shield
} from 'lucide-react';
import { 
    getPendingSignupsAction, 
    approveSignupAction, 
    rejectSignupAction,
    getAuditSettingsAction,
    updateAuditSettingsAction,
    getSystemLogsAction,
    getQueueStatusAction,
    bulkApproveSignupsAction,
    bulkRejectSignupsAction
} from '@/server/actions/audit.actions';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Sub-components
import AuditHeader from './audit/AuditHeader';
import PendingTab from './audit/PendingTab';
import LogsTab from './audit/LogsTab';
import QueuesTab from './audit/QueuesTab';

export default function AuditLogIsland() {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'pending' | 'logs' | 'queues'>('pending');
    const [signups, setSignups] = useState<PendingSignup[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [queueData, setQueueData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState<'approve' | 'reject' | null>(null);
    const [manualApproval, setManualApproval] = useState(false);
    
    // Filters
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [signupsRes, settingsRes, logsRes, queueRes] = await Promise.all([
                getPendingSignupsAction(),
                getAuditSettingsAction(),
                getSystemLogsAction(50),
                getQueueStatusAction()
            ]);

            if (signupsRes.success && signupsRes.data) setSignups(signupsRes.data);
            if (settingsRes.success && settingsRes.data) setManualApproval(settingsRes.data.manual_approval);
            if (logsRes.success && logsRes.data) setLogs(logsRes.data);
            if (queueRes.success && queueRes.data) setQueueData(queueRes.data.queues);
        } catch (err) {
            showToast('Fout bij laden audit data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredSignups = useMemo(() => {
        if (filterType === 'all') return signups;
        if (filterType === 'membership') {
            return signups.filter(s => s.type === 'membership_new' || s.type === 'membership_renewal');
        }
        return signups.filter(s => s.type === filterType);
    }, [signups, filterType]);

    const handleApprove = async (id: string, type: string) => {
        setIsProcessing(id);
        try {
            const res = await approveSignupAction(id, type);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
                showToast('Inschrijving goedgekeurd', 'success');
                const logsRes = await getSystemLogsAction(50);
                if (logsRes.success && logsRes.data) setLogs(logsRes.data);
            } else {
                showToast(res.error || 'Goedkeuren mislukt', 'error');
            }
        } catch (err) {
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
                const logsRes = await getSystemLogsAction(50);
                if (logsRes.success && logsRes.data) setLogs(logsRes.data);
            } else {
                showToast(res.error || 'Afwijzen mislukt', 'error');
            }
        } catch (err) {
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
                loadData();
            } else {
                showToast(res.error || 'Bulk goedkeuren mislukt', 'error');
            }
        } catch (err) {
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
                loadData();
            } else {
                showToast(res.error || 'Bulk afwijzen mislukt', 'error');
            }
        } catch (err) {
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
            const logsRes = await getSystemLogsAction(50);
            if (logsRes.success && logsRes.data) setLogs(logsRes.data);
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

    const adminStats = [
        { label: 'Wachtrij', value: signups.length, icon: Clock, trend: 'Pending' },
        { label: 'Modus', value: manualApproval ? 'Manueel' : 'Auto', icon: Shield, trend: 'Approval' },
        { label: 'Systeem', value: logs.length, icon: History, trend: 'Logs' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Audit & Logboek"
                subtitle="Beheer inschrijvingen en systeemlogs"
                backHref="/beheer"
                actions={
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Verversen
                    </button>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AuditHeader 
                    stats={adminStats}
                    manualApproval={manualApproval}
                    onToggleManualApproval={toggleManualApproval}
                />

                <div className="space-y-6 mt-6">
                    {/* Tabs Navigation */}
                    <div className="flex gap-1 bg-[var(--beheer-card-soft)] p-1 rounded-2xl w-fit border border-[var(--beheer-border)]">
                        {[
                            { id: 'pending', label: 'Wachtrij', icon: Clock },
                            { id: 'logs', label: 'Logboek', icon: Tag },
                            { id: 'queues', label: 'Wachtrijen', icon: Server },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === tab.id ? 'bg-[var(--beheer-card-bg)] shadow-md text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}
                            >
                                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    {activeTab === 'pending' && (
                        <PendingTab 
                            isLoading={isLoading}
                            isProcessing={isProcessing}
                            isBulkProcessing={isBulkProcessing}
                            filteredSignups={filteredSignups}
                            selectedIds={selectedIds}
                            filterType={filterType}
                            onSetFilterType={setFilterType}
                            onToggleSelectAll={toggleSelectAll}
                            onToggleSelectOne={toggleSelectOne}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onBulkApprove={handleBulkApprove}
                            onBulkReject={handleBulkReject}
                            onRefresh={loadData}
                        />
                    )}

                    {activeTab === 'logs' && (
                        <LogsTab 
                            isLoading={isLoading}
                            logs={logs}
                            onRefresh={loadData}
                        />
                    )}

                    {activeTab === 'queues' && (
                        <QueuesTab 
                            isLoading={isLoading}
                            queueData={queueData}
                        />
                    )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
