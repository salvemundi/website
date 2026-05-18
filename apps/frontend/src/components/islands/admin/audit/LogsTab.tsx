'use client';

import { useState, Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';
import { SystemLog } from '@salvemundi/validations';
import { acknowledgeSystemLogAction } from '@/server/actions/infrastructure/audit.actions';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { safeConsoleError } from '@/server/utils/logger';

interface LogsTabProps {
    logs: SystemLog[];
    totalCount: number;
    onRefresh: () => void;
    onLoadMore: () => void;
    title?: string;
    actions?: ReactNode;
    idNameLookup?: Record<string, string>;
    defaultStatusFilter?: 'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
}

export default function LogsTab({
    logs,
    totalCount,
    onRefresh,
    onLoadMore,
    title = "Activiteitslogboek",
    actions,
    idNameLookup = {},
    defaultStatusFilter = 'ALL'
}: LogsTabProps) {
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'>(defaultStatusFilter);
    const [acknowledging, setAcknowledging] = useState<string | null>(null);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const { showToast } = useAdminToast();

    const lookupMap = useMemo(() => new Map(Object.entries(idNameLookup)), [idNameLookup]);

    const filteredLogs = logs.filter(log => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'ERROR') return log.status === 'ERROR' && !log.acknowledged_at;
        return (log.status as string) === statusFilter;
    });

    const toggleExpand = (id: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

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
        } catch (error) {
            safeConsoleError('[LogsTab][handleAcknowledge]', error);
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setAcknowledging(null);
        }
    };

    const resolveIdToName = (key: string, val: unknown, context?: string) => {
        const valStr = String(val);
        if (!valStr || valStr === 'null' || valStr === 'undefined') return valStr;

        let lookupKey = '';
        if (key === 'committee_id') {
            lookupKey = `committee_${valStr}`;
        } else if (key === 'event_id' || (key === 'id' && context === 'activiteit')) {
            lookupKey = `event_${valStr}`;
        } else if (key === 'trip_id' || (key === 'id' && context === 'reis')) {
            lookupKey = `trip_${valStr}`;
        } else if (key === 'admin_id' || key === 'target_id' || key === 'user_id') {
            lookupKey = `user_${valStr}`;
        }

        const mappedName = lookupMap.get(lookupKey);
        if (lookupKey && mappedName) {
            return `${mappedName} (ID: ${valStr})`;
        }
        return valStr;
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
                                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all border ${statusFilter === f.id
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
                            <th className="p-4 min-w-[200px]">Details</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--beheer-border)]/10">
                        {filteredLogs.map((log) => {
                            const isAcknowledged = !!log.acknowledged_at as boolean;
                            return (
                                <Fragment key={log.id}>
                                    <tr
                                        className="hover:bg-[var(--beheer-accent)]/[0.02] transition-colors group cursor-pointer border-b border-[var(--beheer-border)]/10"
                                        onClick={() => toggleExpand(log.id)}
                                    >
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
                                            {(() => {
                                                let context = '';
                                                let contextName = '';

                                                if (log.payload && typeof log.payload === 'object') {
                                                    if ('context' in log.payload && log.payload.context) {
                                                        context = String(log.payload.context);
                                                    }
                                                    if ('context_name' in log.payload && log.payload.context_name) {
                                                        contextName = String(log.payload.context_name);
                                                    }
                                                }

                                                // Fallback context mapping for impersonation logs
                                                if (!context && (log.type === 'impersonation_active' || log.type === 'admin_impersonation_started' || log.type === 'admin_impersonation_ended')) {
                                                    context = 'impersonatie';
                                                    if (log.payload && typeof log.payload === 'object' && 'target_id' in log.payload) {
                                                        const resolved = lookupMap.get(`user_${String(log.payload.target_id)}`);
                                                        if (resolved) {
                                                            contextName = resolved;
                                                        }
                                                    }
                                                }

                                                if (context) {
                                                    return (
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-[var(--beheer-text)] tracking-tight text-xs capitalize">
                                                                {context}
                                                            </span>
                                                            {contextName && (
                                                                <span className="text-[10px] text-[var(--beheer-text-muted)] truncate max-w-[120px]" title={contextName}>
                                                                    {contextName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return <span className="text-[var(--beheer-text-muted)]">-</span>;
                                            })()}
                                        </td>
                                        <td className="p-4 text-xs font-semibold text-[var(--beheer-text-muted)]">
                                            {(() => {
                                                if (log.payload && typeof log.payload === 'object') {
                                                    if ('admin_name' in log.payload && log.payload.admin_name) {
                                                        return String(log.payload.admin_name);
                                                    }
                                                    if ('admin_id' in log.payload && log.payload.admin_id) {
                                                        const resolved = lookupMap.get(`user_${String(log.payload.admin_id)}`);
                                                        if (resolved) return resolved;
                                                    }
                                                }
                                                return 'Systeem';
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-medium text-[var(--beheer-text-muted)] tracking-tight max-w-[280px] break-all">
                                                {log.payload && typeof log.payload === 'object' ? (
                                                    <div className="space-y-1">
                                                        {Object.entries(log.payload)
                                                            .filter(([key]) => !['admin_id', 'admin_name', 'timestamp', 'context', 'context_name'].includes(key))
                                                            .map(([key, val]) => {
                                                                const isComplex = typeof val === 'object' && val !== null;
                                                                return (
                                                                    <div key={key} className="flex flex-col gap-0.5">
                                                                        <div className="flex flex-wrap items-center gap-1">
                                                                            <span className="opacity-50 font-semibold">{key}:</span>
                                                                            {isComplex ? (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleExpand(log.id);
                                                                                    }}
                                                                                    className="px-2 py-0.5 bg-[var(--beheer-accent)]/10 hover:bg-[var(--beheer-accent)]/20 text-[var(--beheer-accent)] rounded text-[10px] font-semibold transition-all active:scale-95 flex items-center gap-1"
                                                                                >
                                                                                    {expandedLogs.has(log.id) ? 'Verberg details' : 'Toon details'}
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-[var(--beheer-text)] break-all">{resolveIdToName(key, val, (log.payload && typeof log.payload === 'object' && 'context' in log.payload) ? String(log.payload.context) : undefined)}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                ) : (
                                                    <span className="break-all">-</span>)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight border ${log.status === 'SUCCESS' ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20'
                                                    : (log.status as string) === 'INFO' ? 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] border-[var(--beheer-accent)]/20'
                                                        : (log.status as string) === 'WARNING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                            : 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border-[var(--beheer-inactive)]/20'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                                {log.status === 'ERROR' && !(isAcknowledged as boolean) && (
                                                    <button
                                                        onClick={() => { void handleAcknowledge(log.id); }}
                                                        disabled={acknowledging === log.id}
                                                        className="text-[10px] text-[var(--beheer-accent)] hover:text-[var(--beheer-accent)]/80 hover:underline disabled:opacity-50"
                                                    >
                                                        {acknowledging === log.id ? 'Bezig...' : 'Markeer als gezien'}
                                                    </button>
                                                )}
                                                {log.status === 'ERROR' && (isAcknowledged as boolean) && (
                                                    <span className="text-[10px] text-[var(--beheer-text-muted)] flex items-center gap-1">
                                                        Gezien
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedLogs.has(log.id) && (
                                        <tr className="bg-[var(--beheer-card-soft)]/20 border-b border-[var(--beheer-border)]/40">
                                            <td colSpan={6} className="p-4 md:p-6">
                                                <div className="flex flex-col gap-3 max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-[var(--beheer-text-muted)]">Volledige Payload Details</span>
                                                        <button
                                                            onClick={() => {
                                                                void navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
                                                                showToast('Gekopieerd naar klembord', 'success');
                                                            }}
                                                            className="px-3 py-1 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] hover:bg-[var(--beheer-card-soft)] text-xs rounded-lg font-semibold text-[var(--beheer-text)] transition-all flex items-center gap-1 active:scale-95"
                                                        >
                                                            Kopieer JSON
                                                        </button>
                                                    </div>
                                                    <pre className="text-xs p-4 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)]/80 rounded-xl overflow-x-auto text-[var(--beheer-text)] font-mono max-h-[350px] leading-relaxed shadow-inner break-all whitespace-pre-wrap md:whitespace-pre">
                                                        {JSON.stringify(log.payload, null, 2)}
                                                    </pre>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-20 text-center text-[var(--beheer-text-muted)] italic font-medium text-sm">Geen logboekvermeldingen gevonden.</td>
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