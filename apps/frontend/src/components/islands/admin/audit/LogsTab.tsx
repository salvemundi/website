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
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--beheer-border)]/50 flex justify-between items-center">
                <h3 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-tight">{title}</h3>
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
                        <tr className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]/50 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                            <th className="p-4">Datum</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Admin</th>
                            <th className="p-4">Details</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--beheer-border)]/10">
                        {logs.map((log) => (
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
                                    {(log.payload && typeof log.payload === 'object' && 'admin_name' in log.payload) ? String(log.payload.admin_name) : 'Systeem'}
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
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${log?.status === 'SUCCESS' ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20' : 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border-[var(--beheer-inactive)]/20'}`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-400 italic font-black uppercase tracking-widest text-[10px]">Geen logboekvermeldingen gevonden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
