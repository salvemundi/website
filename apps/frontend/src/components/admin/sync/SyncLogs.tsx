'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, X, Info, Users } from 'lucide-react';
import { SyncStatus } from '@/components/islands/admin/sync/SyncContext';

interface LogItem {
    email: string;
    message?: string;
    timestamp?: string;
    stack?: string;
    changes?: { field: string; old: unknown; new: unknown }[];
    reason?: string;
}

interface ResultRowProps {
    email: string;
    message?: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'excluded';
    timestamp?: string;
    stack?: string;
    changes?: { field: string; old: unknown; new: unknown }[];
}

function ResultRow({ email, message, type, timestamp, stack, changes }: ResultRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasDetails = !!(timestamp || stack || (changes && changes.length > 0));
    const icons = {
        success: <CheckCircle className="h-4 w-4 text-[var(--beheer-active)]" />,
        warning: <AlertTriangle className="h-4 w-4 text-[var(--theme-warning)]" />,
        error: <X className="h-4 w-4 text-[var(--beheer-inactive)]" />,
        info: <Info className="h-4 w-4 text-[var(--theme-info)]" />,
        excluded: <Users className="h-4 w-4 text-[var(--beheer-text-muted)]" />,
    };

    return (
        <div 
            className={`flex flex-col border-b border-[var(--beheer-border)]/10 last:border-0 transition-colors ${hasDetails ? 'cursor-pointer hover:bg-[var(--beheer-accent)]/5' : ''}`}
            onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        >
            <div className="p-4 flex items-start gap-4 transition-colors">
                <div className="mt-0.5">{icons[type]}</div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--beheer-text)] uppercase tracking-tight truncate">{email}</div>
                    {message && <div className="text-[10px] text-[var(--beheer-text-muted)] font-semibold uppercase tracking-widest mt-1">{message}</div>}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)]/50">
                        {type}
                    </div>
                    {hasDetails && (
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)]'}`}>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && hasDetails && (
                <div className="px-12 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-[var(--beheer-card-soft)] rounded-2xl border border-[var(--beheer-border)]/30 space-y-3">
                        {timestamp && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)]">Tijdstip:</span>
                                <span className="text-xs font-semibold text-[var(--beheer-text)]">{new Date(timestamp).toLocaleString()}</span>
                            </div>
                        )}
                        {stack && (
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)]">Stack Trace:</span>
                                <pre className="text-xs text-[var(--theme-error)]/70 font-mono leading-relaxed overflow-x-auto p-3 bg-[var(--theme-error)]/5 rounded-xl border border-[var(--theme-error)]/10 custom-scrollbar">
                                    {stack}
                                </pre>
                            </div>
                        )}
                        {changes && changes.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)]">Wijzigingen:</span>
                                <div className="space-y-1">
                                    {changes.map((change, idx) => (
                                        <div key={idx} className="flex flex-col gap-0.5 p-2 bg-[var(--beheer-card-bg)] rounded-xl border border-[var(--beheer-border)]/20">
                                            <span className="text-xs font-semibold text-[var(--beheer-text)] uppercase">{change.field}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[var(--beheer-text-muted)] truncate max-w-[150px]">{String(change.old ?? 'leeg')}</span>
                                                <svg className="h-2 w-2 text-[var(--beheer-text-muted)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="text-[10px] font-semibold text-[var(--beheer-active)] truncate max-w-[150px]">{String(change.new ?? 'leeg')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface SyncLogsProps {
    resultFilter: string;
    setResultFilter: (value: string) => void;
    status: SyncStatus & { 
        errors?: LogItem[];
        createdUsers?: LogItem[];
        successfulUsers?: LogItem[];
        warnings?: LogItem[];
        missingData?: LogItem[];
        excludedUsers?: LogItem[];
    };
}

export default function SyncLogs({ resultFilter, status }: SyncLogsProps) {
    const itemMap = new Map<string, React.ReactNode>();

    // Helper to add/merge items into the map for deduplication
    const addItem = (email: string, node: React.ReactNode, type: string) => {
        const key = `${email}-${type}`; // Unique within type
        const globalKey = email; // Global for deduplication across types in 'all' view

        if (resultFilter !== 'all') {
            itemMap.set(key, node);
        } else {
            // Priority for 'all' view: Errors > Created > Success > Warnings > Info > Excluded
            itemMap.set(globalKey, node);
        }
    };

    if (resultFilter === 'all' || resultFilter === 'errors') {
        (status.errors || []).forEach((e, i) => {
            addItem(e.email, (
                <ResultRow 
                    key={`e-${i}`} 
                    email={e.email} 
                    message={e.message} 
                    type="error" 
                    timestamp={e.timestamp}
                    stack={e.stack}
                />
            ), 'errors');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'created') {
        (status.createdUsers || []).forEach((u, i) => {
            addItem(u.email, (
                <ResultRow 
                    key={`c-${i}`} 
                    email={u.email} 
                    type="success" 
                    message="Nieuw lid aangemaakt" 
                    changes={u.changes}
                />
            ), 'created');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'success') {
        (status.successfulUsers || []).forEach((u, i) => {
            // In 'all' view, don't overwrite 'created' status with generic 'success'
            if (resultFilter === 'all' && itemMap.has(u.email)) return;

            addItem(u.email, (
                <ResultRow 
                    key={`s-${i}`} 
                    email={u.email} 
                    type="success" 
                    changes={u.changes}
                />
            ), 'success');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'warnings') {
        (status.warnings || []).forEach((w, i) => {
            if (resultFilter === 'all' && itemMap.has(w.email)) return;
            addItem(w.email, <ResultRow key={`w-${i}`} email={w.email} message={w.message} type="warning" />, 'warnings');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'missing') {
        (status.missingData || []).forEach((m, i) => {
            if (resultFilter === 'all' && itemMap.has(m.email)) return;
            addItem(m.email, <ResultRow key={`m-${i}`} email={m.email} message={m.reason} type="info" />, 'missing');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'excluded') {
        (status.excludedUsers || []).forEach((u, i) => {
            if (resultFilter === 'all' && itemMap.has(u.email)) return;
            addItem(u.email, <ResultRow key={`ex-${i}`} email={u.email} type="excluded" />, 'excluded');
        });
    }

    const items = Array.from(itemMap.values());

    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-sm">
            <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-[var(--beheer-text-muted)]">
                        <Users className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-xs font-semibold uppercase tracking-widest text-center">Geen resultaten gevonden voor dit filter.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--beheer-border)]/10">{items}</div>
                )}
            </div>
        </div>
    );
}
