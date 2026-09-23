'use client';

import { useState, Fragment, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';
import { SystemLog } from '@salvemundi/validations';
import { acknowledgeSystemLogAction } from '@/server/actions/infrastructure/audit.actions';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { safeConsoleError } from '@/server/utils/logger';
import { getLookupPrefix } from '@/shared/audit.config';

const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
};

interface SyncSummaryPayload {
    processed?: number;
    duration_ms?: number;
    moved_active?: number;
    moved_expired?: number;
    errors?: number;
    moved_active_users?: { email: string; name?: string }[];
    moved_expired_users?: { email: string; name?: string }[];
}

interface LogsTabProps {
    logs: SystemLog[];
    totalCount: number;
    onRefresh: () => void;
    onLoadMore: () => void;
    onSearch: (query: string) => void;
    searchQuery: string;
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
    onSearch,
    searchQuery,
    title = "Activiteitslogboek",
    actions,
    idNameLookup = {},
    defaultStatusFilter = 'ALL'
}: LogsTabProps) {
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'>(defaultStatusFilter);
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [acknowledging, setAcknowledging] = useState<string | null>(null);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const { showToast } = useAdminToast();

    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

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
            safeConsoleError('[LogsTab.tsx][LogsTab] ', error);
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setAcknowledging(null);
        }
    };



    const resolveIdToName = (key: string, val: unknown, context?: string, logType?: string) => {
        const valStr = String(val);
        if (!valStr || valStr === 'null' || valStr === 'undefined') return valStr;

        const prefix = getLookupPrefix(key, context, logType);
        const lookupKey = prefix ? `${prefix}${valStr}` : '';
        const mappedName = lookupMap.get(lookupKey);
        if (lookupKey && mappedName) {
            return `${mappedName} (ID: ${valStr})`;
        }
        return valStr;
    };

    const hasMore = logs.length < totalCount;

    return (
        <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-(--beheer-border)/50 p-6 md:flex-row md:items-center">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight text-(--beheer-text)">{title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
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
                                    className={`tab-button rounded-lg border px-3 py-1 text-[11px] font-semibold transition-all ${statusFilter === f.id
                                        ? 'border-(--beheer-accent)/20 bg-(--beheer-accent)/10 text-(--beheer-accent)'
                                        : 'border-transparent text-(--beheer-text-muted) hover:bg-(--beheer-card-soft)'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Zoeken..."
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch(localQuery);
                                }
                            }}
                            className="beheer-input w-48 rounded-lg border border-(--beheer-border)/50 bg-(--beheer-card-soft) px-3 py-1 text-xs text-(--beheer-text) placeholder-(--beheer-text-muted)/50 transition-all focus:border-(--beheer-accent) focus:outline-none md:w-64"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                    <span className="text-[11px] font-semibold text-(--beheer-text-muted)">
                        {logs.length} / {totalCount}
                    </span>
                    <button
                        onClick={onRefresh}
                        className="icon-button p-2 text-(--beheer-text-muted) transition-colors hover:text-(--beheer-accent)"
                    >
                        <RefreshCw className="size-5" />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-(--beheer-border)/50 bg-(--beheer-card-soft)/50 text-xs font-semibold tracking-tight text-(--beheer-text-muted)">
                            <th className="p-4">Datum</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Context</th>
                            <th className="p-4">Uitgevoerd door</th>
                            <th className="min-w-5 p-4">Details</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--beheer-border)/10">
                        {filteredLogs.map((log) => {
                            const isAcknowledged = !!log.acknowledged_at as boolean;
                            return (
                                <Fragment key={log.id}>
                                    <tr
                                        className="group cursor-pointer border-b border-(--beheer-border)/10 transition-colors hover:bg-(--beheer-accent)/2"
                                        onClick={() => toggleExpand(log.id)}
                                    >
                                        <td className="p-4 text-xs font-medium tracking-tight whitespace-nowrap text-(--beheer-text-muted)">
                                            {formatDate(log.created_at, 'dd-MM-yyyy HH:mm')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold tracking-tight text-(--beheer-text) capitalize">
                                                    {log.type}
                                                </span>
                                                {log.payload && typeof log.payload === 'object' && 'environment' in log.payload && (
                                                    <span className={`inline-block w-fit rounded border px-1.5 py-0.5 text-[9px] font-bold capitalize ${
                                                        String(log.payload.environment) === 'productie'
                                                            ? 'border-red-500/20 bg-red-500/10 text-red-500'
                                                            : String(log.payload.environment) === 'acceptatie'
                                                                ? 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                                                                : 'border-blue-500/20 bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                        {String(log.payload.environment)}
                                                    </span>
                                                )}
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
                                                    } else {
                                                        // Dynamically infer context name from ID keys if not explicitly provided
                                                        if (context === 'reis') {
                                                            if ('trip_id' in log.payload && log.payload.trip_id) {
                                                                const resolved = lookupMap.get(`trip_${String(log.payload.trip_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('signup_id' in log.payload && log.payload.signup_id) {
                                                                const resolved = lookupMap.get(`signup_${String(log.payload.signup_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'activiteit') {
                                                            if ('event_id' in log.payload && log.payload.event_id) {
                                                                const resolved = lookupMap.get(`event_${String(log.payload.event_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('id' in log.payload && log.payload.id) {
                                                                const isSignupLog = ['admin_event_signup_checked_in', 'admin_event_signup_checked_out', 'admin_event_signup_deleted', 'admin_event_signup_manual_created', 'system_event_signup_checkin_rollback', 'system_event_signup_delete_failed'].includes(log.type);
                                                                const prefix = isSignupLog ? 'event_signup_' : 'event_';
                                                                const resolved = lookupMap.get(`${prefix}${String(log.payload.id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'sticker') {
                                                            if ('sticker_id' in log.payload && log.payload.sticker_id) {
                                                                const resolved = lookupMap.get(`sticker_${String(log.payload.sticker_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'webshop') {
                                                            if ('product_id' in log.payload && log.payload.product_id) {
                                                                const resolved = lookupMap.get(`product_${String(log.payload.product_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('preorder_id' in log.payload && log.payload.preorder_id) {
                                                                const resolved = lookupMap.get(`preorder_${String(log.payload.preorder_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('drop_window_id' in log.payload && log.payload.drop_window_id) {
                                                                const resolved = lookupMap.get(`drop_window_${String(log.payload.drop_window_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'lidmaatschap') {
                                                            if ('member_id' in log.payload && log.payload.member_id) {
                                                                const resolved = lookupMap.get(`user_${String(log.payload.member_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        }
                                                    }
                                                }

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
                                                            <span className="text-xs font-semibold tracking-tight text-(--beheer-text) capitalize">
                                                                {context}
                                                            </span>
                                                            {contextName && (
                                                                <span className="max-w-30 truncate text-[10px] text-(--beheer-text-muted)" title={contextName}>
                                                                    {contextName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return <span className="text-(--beheer-text-muted)">-</span>;
                                            })()}
                                        </td>
                                        <td className="p-4 text-xs font-semibold text-(--beheer-text-muted)">
                                            {(() => {
                                                if (log.payload && typeof log.payload === 'object') {
                                                    if ('admin_id' in log.payload && log.payload.admin_id) {
                                                        const resolved = lookupMap.get(`user_${String(log.payload.admin_id)}`);
                                                        if (resolved) return resolved;
                                                    }
                                                    if ('admin_name' in log.payload && log.payload.admin_name) {
                                                        return String(log.payload.admin_name);
                                                    }
                                                }
                                                return 'Systeem';
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-70 text-xs font-medium tracking-tight break-all text-(--beheer-text-muted)">
                                                {log.payload && typeof log.payload === 'object' ? (
                                                    log.type === 'system_sync_summary' ? (
                                                        <div className="space-y-1">
                                                            {(() => {
                                                                // Gebruik de nieuwe interface in plaats van any
                                                                const p = log.payload as unknown as SyncSummaryPayload;
                                                                return (
                                                                    <>
                                                                        <p className="font-semibold text-(--beheer-text)">
                                                                            Sync voltooid
                                                                        </p>
                                                                        <p className="text-(--beheer-text-muted) opacity-95">
                                                                            {String(p.processed || 0)} leden verwerkt in {p.duration_ms ? formatDuration(Number(p.duration_ms)) : 'onbekende tijd'}.
                                                                        </p>
                                                                        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                                                                            <span className="rounded bg-green-500/10 px-1.5 py-0.5 font-semibold whitespace-nowrap text-green-500">
                                                                                +{p.moved_active || 0} actief
                                                                            </span>
                                                                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-semibold whitespace-nowrap text-amber-500">
                                                                                -{p.moved_expired || 0} verlopen
                                                                            </span>
                                                                            {Number(p.errors || 0) > 0 && (
                                                                                <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-semibold whitespace-nowrap text-red-500">
                                                                                    {p.errors} fouten
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {Array.isArray(p.moved_active_users) && p.moved_active_users.length > 0 && (
                                                                            <div className="mt-2 space-y-0.5">
                                                                                <p className="text-[10px] font-bold tracking-widest text-green-500 uppercase">Actief geworden</p>
                                                                                {p.moved_active_users.map((u, i) => (
                                                                                    <p key={i} className="truncate text-[10px] text-(--beheer-text)" title={u.email}>
                                                                                        {u.name ? String(u.name) : u.email}
                                                                                    </p>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {Array.isArray(p.moved_expired_users) && p.moved_expired_users.length > 0 && (
                                                                            <div className="mt-2 space-y-0.5">
                                                                                <p className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">Verlopen geworden</p>
                                                                                {p.moved_expired_users.map((u, i) => (
                                                                                    <p key={i} className="truncate text-[10px] text-(--beheer-text)" title={u.email}>
                                                                                        {u.name ? String(u.name) : u.email}
                                                                                    </p>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {Object.entries(log.payload)
                                                                .filter(([key]) => !['admin_id', 'admin_name', 'timestamp', 'context', 'context_name', 'impersonated_by_id', 'impersonated_by_name', 'impersonated_target_id', 'impersonated_target_name'].includes(key))
                                                                .map(([key, val]) => {
                                                                    const isArray = Array.isArray(val);
                                                                    const isComplex = typeof val === 'object' && val !== null && !isArray;
                                                                    const resolvedArray = isArray ? (val as unknown[]).map(item => {
                                                                        const itemStr = String(item);
                                                                        let lookupKey = '';
                                                                        if (key === 'activity_ids' || key === 'trip_activity_id') {
                                                                            lookupKey = `trip_activity_${itemStr}`;
                                                                        }
                                                                        const mappedName = lookupKey ? lookupMap.get(lookupKey) : null;
                                                                        return mappedName ? `${mappedName} (ID: ${itemStr})` : itemStr;
                                                                    }) : [];
                                                                    return (
                                                                        <div key={key} className="flex flex-col gap-0.5">
                                                                            <div className="flex flex-wrap items-center gap-1">
                                                                                <span className="font-semibold opacity-50">{key}:</span>
                                                                                 {isComplex ? (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleExpand(log.id);
                                                                                        }}
                                                                                        className="beheer-button flex items-center gap-1 rounded bg-(--beheer-accent)/10 px-2 py-0.5 text-[10px] font-semibold text-(--beheer-accent) transition-all hover:bg-(--beheer-accent)/20 active:scale-95"
                                                                                    >
                                                                                        {expandedLogs.has(log.id) ? 'Verberg details' : 'Toon details'}
                                                                                    </button>
                                                                                ) : isArray ? (
                                                                                    <span className="break-all text-(--beheer-text)">
                                                                                        {resolvedArray.length > 0 ? resolvedArray.join(', ') : 'Geen'}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="break-all text-(--beheer-text)">{resolveIdToName(key, val, (log.payload && typeof log.payload === 'object' && 'context' in log.payload) ? String(log.payload.context) : undefined, log.type)}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="break-all">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-tight ${log.status === 'SUCCESS' ? 'border-(--beheer-active)/20 bg-(--beheer-active)/10 text-(--beheer-active)'
                                                    : (log.status as string) === 'INFO' ? 'border-(--beheer-accent)/20 bg-(--beheer-accent)/10 text-(--beheer-accent)'
                                                        : (log.status as string) === 'WARNING' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                                                            : 'border-(--beheer-inactive)/20 bg-(--beheer-inactive)/10 text-(--beheer-inactive)'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                                {log.status === 'ERROR' && !(isAcknowledged as boolean) && (
                                                    <button
                                                        onClick={() => { void handleAcknowledge(log.id); }}
                                                        disabled={acknowledging === log.id}
                                                        className="beheer-button text-[10px] text-(--beheer-accent) hover:text-(--beheer-accent)/80 hover:underline disabled:opacity-50"
                                                    >
                                                        {acknowledging === log.id ? 'Bezig...' : 'Markeer als gezien'}
                                                    </button>
                                                )}
                                                {log.status === 'ERROR' && (isAcknowledged as boolean) && (
                                                    <span className="flex items-center gap-1 text-[10px] text-(--beheer-text-muted)">
                                                        Gezien
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedLogs.has(log.id) && (
                                        <tr className="border-b border-(--beheer-border)/40 bg-(--beheer-card-soft)/20">
                                            <td colSpan={6} className="p-4 md:p-6">
                                                <div className="mx-auto flex max-w-4xl flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-(--beheer-text-muted)">Volledige Payload Details</span>
                                                        <button
                                                            onClick={() => {
                                                                void navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
                                                                showToast('Gekopieerd naar klembord', 'success');
                                                            }}
                                                            className="beheer-button flex items-center gap-1 rounded-lg border border-(--beheer-border) bg-(--beheer-card-bg) px-3 py-1 text-xs font-semibold text-(--beheer-text) transition-all hover:bg-(--beheer-card-soft) active:scale-95"
                                                        >
                                                            Kopieer JSON
                                                        </button>
                                                    </div>
                                                    <pre className="max-h-87.5 overflow-x-auto rounded-xl border border-(--beheer-border)/80 bg-(--beheer-card-bg) p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-(--beheer-text) shadow-inner md:whitespace-pre">
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
                                <td colSpan={6} className="p-20 text-center text-sm font-medium text-(--beheer-text-muted) italic">Geen logboekvermeldingen gevonden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {hasMore && (
                <div className="flex justify-center border-t border-(--beheer-border)/50 p-4">
                    <button
                        onClick={onLoadMore}
                        className="beheer-button rounded-xl border border-(--beheer-accent)/20 bg-(--beheer-accent)/10 px-6 py-2 text-xs font-semibold text-(--beheer-accent) transition-all hover:bg-(--beheer-accent)/20 active:scale-95"
                    >
                        Meer laden
                    </button>
                </div>
            )}
        </div>
    );
}