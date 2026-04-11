'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    CheckSquare, Square, Activity, History, Settings2, Clock, Shield, Tag, RefreshCw, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { 
    getPendingSignupsAction, 
    approveSignupAction, 
    rejectSignupAction,
    getAuditSettingsAction,
    updateAuditSettingsAction,
    getSystemLogsAction
} from '@/server/actions/audit.actions';
import { PendingSignup } from '@salvemundi/validations';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { formatDate } from '@/shared/lib/utils/date';

export default function AuditLogIsland() {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'pending' | 'logs'>('pending');
    const [signups, setSignups] = useState<PendingSignup[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [manualApproval, setManualApproval] = useState(false);
    
    // Filters
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [signupsRes, settingsRes, logsRes] = await Promise.all([
                getPendingSignupsAction(),
                getAuditSettingsAction(),
                getSystemLogsAction(50)
            ]);

            if (signupsRes.success && signupsRes.data) setSignups(signupsRes.data);
            if (settingsRes.success && settingsRes.data) setManualApproval(settingsRes.data.manual_approval);
            if (logsRes.success && logsRes.data) setLogs(logsRes.data);
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
                // Reload logs to show the approval
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
                // Reload logs to show the rejection
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

    const toggleManualApproval = async () => {
        const newValue = !manualApproval;
        setManualApproval(newValue);
        const res = await updateAuditSettingsAction(newValue);
        if (res.success) {
            showToast(`Automatische goedkeuring ${newValue ? 'uitgeschakeld' : 'ingeschakeld'}`, 'success');
            // Reload logs
            const logsRes = await getSystemLogsAction(50);
            if (logsRes.success && logsRes.data) setLogs(logsRes.data);
        } else {
            showToast('Fout bij bijwerken instellingen', 'error');
            setManualApproval(!newValue); // revert
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
        { label: 'Focus', value: activeTab.toUpperCase(), icon: Tag, trend: 'View' },
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
                <AdminStatsBar stats={adminStats} />

                <div className="space-y-6">
                    {/* Settings Mode Card */}
                    <div className="bg-[var(--beheer-card-bg)] p-8 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${manualApproval ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                                <Settings2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-1">
                                    Configuratie
                                </h3>
                                <p className="text-sm font-bold text-[var(--beheer-text)]">
                                    {manualApproval 
                                        ? "Handmatige goedkeuring is ACTIEF. Alle aanmeldingen moeten worden gecontroleerd."
                                        : "Automatische goedkeuring is ACTIEF. Aanmeldingen worden direct verwerkt."}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleManualApproval}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ring-2 ring-offset-2 ring-offset-[var(--beheer-card-bg)] ${manualApproval ? 'bg-amber-500 ring-amber-500/30' : 'bg-green-500 ring-green-500/30'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${manualApproval ? 'translate-x-[1.4rem]' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-1 bg-[var(--beheer-card-soft)] p-1 rounded-2xl w-fit border border-[var(--beheer-border)]">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'pending' ? 'bg-[var(--beheer-card-bg)] shadow-md text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}
                        >
                            <Clock className="h-3.5 w-3.5" /> Wachtrij
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'logs' ? 'bg-[var(--beheer-card-bg)] shadow-md text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}
                        >
                            <Tag className="h-3.5 w-3.5" /> Logboek
                        </button>
                    </div>

            {/* Main Content Area */}
            {activeTab === 'pending' ? (
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-[var(--beheer-border)]/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {['all', 'event', 'trip', 'pub_crawl', 'membership'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type 
                                        ? 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)]' 
                                        : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]'}`}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={loadData}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                        >
                            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]/50">
                                    <th className="p-4 w-12 text-center">
                                        <button onClick={toggleSelectAll} className="text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-colors">
                                            {selectedIds.size > 0 && selectedIds.size === filteredSignups.length ? <CheckSquare className="h-5 w-5 text-[var(--beheer-accent)]" /> : <Square className="h-5 w-5" />}
                                        </button>
                                    </th>
                                    <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Datum</th>
                                    <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Naam</th>
                                    <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Product</th>
                                    <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest text-center">Status</th>
                                    <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest text-right">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--beheer-border)]/10">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="p-8">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredSignups.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <CheckCircle className="h-12 w-12 text-[var(--beheer-active)] mb-4 opacity-20" />
                                                <h4 className="text-[var(--beheer-text)] font-black uppercase tracking-tight">Alles bijgewerkt!</h4>
                                                <p className="text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest text-[10px] mt-2">Er zijn geen inschrijvingen die op goedkeuring wachten.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSignups.map(s => (
                                        <tr key={s.id} className={`hover:bg-[var(--beheer-accent)]/[0.02] transition-colors group ${selectedIds.has(s.id) ? 'bg-[var(--beheer-accent)]/[0.05]' : ''}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => toggleSelectOne(s.id)} className={`transition-colors ${selectedIds.has(s.id) ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)]/30'}`}>
                                                    {selectedIds.has(s.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                                </button>
                                            </td>
                                            <td className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest whitespace-nowrap">
                                                {formatDate(s.created_at, true)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-black text-[var(--beheer-text)] uppercase tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors truncate">{s.first_name} {s.last_name}</span>
                                                    <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest truncate">{s.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-3.5 w-3.5 text-[var(--beheer-text-muted)]" />
                                                    <span className="text-[10px] text-[var(--beheer-text)] font-black uppercase tracking-widest">{s.product_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.payment_status === 'paid' ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                    {s.payment_status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleApprove(s.id, s.type)}
                                                        disabled={!!isProcessing}
                                                        className="p-2 bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] rounded-xl hover:bg-[var(--beheer-active)] hover:text-white transition-all disabled:opacity-50 border border-[var(--beheer-active)]/20"
                                                    >
                                                        {isProcessing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReject(s.id, s.type)}
                                                        disabled={!!isProcessing}
                                                        className="p-2 bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] rounded-xl hover:bg-[var(--beheer-inactive)] hover:text-white transition-all disabled:opacity-50 border border-[var(--beheer-inactive)]/20"
                                                    >
                                                        {isProcessing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-[var(--beheer-border)]/50 flex justify-between items-center">
                        <h3 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-tight">Activiteitslogboek</h3>
                        <button 
                            onClick={loadData}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                        >
                            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]/50 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                                    <th className="p-4">Datum</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Admin</th>
                                    <th className="p-4">Details</th>
                                    <th className="p-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--beheer-border)]/10">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="p-8"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full" /></td>
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-slate-400 italic">Geen logboekvermeldingen gevonden.</td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover:bg-[var(--beheer-accent)]/[0.02] transition-colors group">
                                            <td className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest whitespace-nowrap">
                                                {formatDate(log.created_at, true)}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-black text-[var(--beheer-text)] uppercase tracking-tight text-xs">
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                                                {log.payload?.admin_name || 'Systeem'}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest max-w-md break-all">
                                                    {log.payload && typeof log.payload === 'object' ? (
                                                        <div className="space-y-1">
                                                            {Object.entries(log.payload)
                                                                .filter(([key]) => !['admin_id', 'admin_name', 'timestamp'].includes(key))
                                                                .map(([key, val]) => (
                                                                    <div key={key} className="flex gap-2">
                                                                        <span className="opacity-50">{key}:</span>
                                                                        <span className="text-[var(--beheer-text)]">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    ) : (
                                                        <span>{String(log.payload || '-')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${log.status === 'SUCCESS' ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20' : 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border-[var(--beheer-inactive)]/20'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
