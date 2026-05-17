'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';
import { SystemLog } from '@salvemundi/validations';
import { acknowledgeSystemLogAction } from '@/server/actions/infrastructure/audit.actions';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface LogsTabProps {
    logs: SystemLog[];
    totalCount: number;
    onRefresh: () => void;
    onLoadMore: () => void;
    title?: string;
    actions?: React.ReactNode;
}

export default function LogsTab({ logs, totalCount, onRefresh, onLoadMore, title = "Activiteitslogboek", actions }: LogsTabProps) {
    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'>('ERROR');
    const [acknowledging, setAcknowledging] = React.useState<string | null>(null);
    const { showToast } = useAdminToast();

    const filteredLogs = logs.filter(log => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'ERROR') return log.status === 'ERROR' && !log.acknowledged_at;
        return log.status === statusFilter;
    });

    const handleAcknowledge = async (id: string) => {
        setAcknowledging(id);
        try {
            const res = await acknowledgeSystemLogAction(id);
            if (res.success) {
                showToast('Markeren als gezien gelukt', 'success');
                onRefresh();
            } else {
                showToast(res.error || 'Mislukt', 'error');
            }
        } catch {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setAcknowledging(null);
        }
    };

    const hasMore = logs.length < totalCount;

    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--beheer-border)]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--beheer-text)] tracking-tight">{title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        {[
                            { id: 'ALL', label: 'Alles' },
                            { id: 'SUCCESS', label: 'Succes' },
                            { id: 'ERROR', label: 'Fouten' },
                            { id: 'WARNING', label: 'Waarschuwingen' },
                            { id: 'INFO', label: 'Info' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id as typeof statusFilter)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                    statusFilter === f.id 
                                        ? 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] border-[var(--beheer-accent)]/20' 
                                        : 'text-[var(--beheer-text-muted)] border-transparent hover:bg-[var(--beheer-card-soft)]'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                    <span className="text-[11px] font-semibold text-[var(--beheer-text-muted)]">
                        {logs.length} / {totalCount}
                    </span>
                    <button 
                        onClick={onRefresh}
                        className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-colors"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]/50 text-xs font-semibold text-[var(--beheer-text-muted)] tracking-tight">
                            <th className="p-4">Datum</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Context</th>
                            <th className="p-4">Admin</th>
                            <th className="p-4">Details</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--beheer-border)]/10">
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[var(--beheer-accent)]/[0.02] transition-colors group">
                                <td className="p-4 text-xs font-medium text-[var(--beheer-text-muted)] tracking-tight whitespace-nowrap">
                                    {formatDate(log.created_at, 'dd-MM-yyyy HH:mm')}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-[var(--beheer-text)] tracking-tight text-xs capitalize">
                                            {log.type}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {(log.payload && typeof log.payload === 'object' && 'context' in log.payload) ? (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[var(--beheer-text)] tracking-tight text-xs capitalize">
                                                {String(log.payload.context)}
                                            </span>
                                            {log.payload.context_name && (
                                                <span className="text-[10px] text-[var(--beheer-text-muted)] truncate max-w-[120px]" title={String(log.payload.context_name)}>
                                                    {String(log.payload.context_name)}
                                                </span>
                                            )}
                                        </div>
                                    ) : <span className="text-[var(--beheer-text-muted)]">-</span>}
                                </td>
                                <td className="p-4 text-xs font-semibold text-[var(--beheer-text-muted)]">
                                    {(log.payload && typeof log.payload === 'object' && 'admin_name' in log.payload) ? String(log.payload.admin_name) : 'Systeem'}
                                </td>
                                <td className="p-4">
                                    <div className="text-xs font-medium text-[var(--beheer-text-muted)] tracking-tight max-w-[300px] break-words">
                                        {log.payload && typeof log.payload === 'object' ? (
                                            <div className="space-y-1">
                                                {Object.entries(log.payload)
                                                    .filter(([key]) => !['admin_id', 'admin_name', 'timestamp', 'context', 'context_name'].includes(key))
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
                                    <div className="flex flex-col items-center gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight border ${
                                            log.status === 'SUCCESS' ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20'
                                            : log.status === 'INFO' ? 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] border-[var(--beheer-accent)]/20'
                                            : log.status === 'WARNING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border-[var(--beheer-inactive)]/20'
                                        }`}>
                                            {log.status}
                                        </span>
                                        {log.status === 'ERROR' && !log.acknowledged_at && (
                                            <button 
                                                onClick={() => handleAcknowledge(log.id)}
                                                disabled={acknowledging === log.id}
                                                className="text-[10px] text-[var(--beheer-accent)] hover:text-[var(--beheer-accent)]/80 hover:underline disabled:opacity-50"
                                            >
                                                {acknowledging === log.id ? 'Bezig...' : 'Markeer als gezien'}
                                            </button>
                                        )}
                                        {log.status === 'ERROR' && log.acknowledged_at && (
                                            <span className="text-[10px] text-[var(--beheer-text-muted)] flex items-center gap-1">
                                                Gezien
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-[var(--beheer-text-muted)] italic font-medium text-sm">Geen logboekvermeldingen gevonden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {hasMore && (
                <div className="p-4 border-t border-[var(--beheer-border)]/50 flex justify-center">
                    <button
                        onClick={onLoadMore}
                        className="px-6 py-2 bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] rounded-xl text-xs font-semibold hover:bg-[var(--beheer-accent)]/20 transition-all border border-[var(--beheer-accent)]/20 active:scale-95"
                    >
                        Meer laden
                    </button>
                </div>
            )}
        </div>
    );
}

