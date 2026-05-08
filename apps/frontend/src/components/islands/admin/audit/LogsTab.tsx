'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';
import { SystemLog } from '@salvemundi/validations';

interface LogsTabProps {
    logs: SystemLog[];
    onRefresh: () => void;
    title?: string;
    actions?: React.ReactNode;
}

export default function LogsTab({ logs, onRefresh, title = "Activiteitslogboek", actions }: LogsTabProps) {
    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING'>('ALL');

    const filteredLogs = logs.filter(log => {
        if (statusFilter === 'ALL') return true;
        return log.status === statusFilter;
    });

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
                            { id: 'WARNING', label: 'Waarschuwingen' }
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
                    <button 
                        onClick={onRefresh}
                        className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
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
                            <th className="p-4">Admin</th>
                            <th className="p-4">Details</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--beheer-border)]/10">
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[var(--beheer-accent)]/[0.02] transition-colors group">
                                <td className="p-4 text-xs font-medium text-[var(--beheer-text-muted)] tracking-tight whitespace-nowrap">
                                    {formatDate(log.created_at, true)}
                                </td>
                                <td className="p-4">
                                    <span className="font-semibold text-[var(--beheer-text)] tracking-tight text-xs capitalize">
                                        {log.type}
                                    </span>
                                </td>
                                <td className="p-4 text-xs font-semibold text-[var(--beheer-text-muted)]">
                                    {(log.payload && typeof log.payload === 'object' && 'admin_name' in log.payload) ? String(log.payload.admin_name) : 'Systeem'}
                                </td>
                                <td className="p-4">
                                    <div className="text-xs font-medium text-[var(--beheer-text-muted)] tracking-tight max-w-md break-all">
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
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight border ${log?.status === 'SUCCESS' ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20' : 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border-[var(--beheer-inactive)]/20'}`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-400 italic font-medium text-sm">Geen logboekvermeldingen gevonden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
