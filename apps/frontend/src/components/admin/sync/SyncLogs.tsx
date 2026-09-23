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
    const icons = new Map<string, React.ReactNode>([
        ['success', <CheckCircle key="success" className="size-5 text-(--beheer-active)" />],
        ['warning', <AlertTriangle key="warning" className="size-5 text-(--theme-warning)" />],
        ['error', <X key="error" className="size-5 text-(--beheer-inactive)" />],
        ['info', <Info key="info" className="size-5 text-(--theme-info)" />],
        ['excluded', <Users key="excluded" className="size-5 text-(--beheer-text-muted)" />],
    ]);

    return (
        <div
            className={`flex flex-col border-b border-(--beheer-border)/10 transition-colors last:border-0 ${hasDetails ? 'cursor-pointer hover:bg-(--beheer-accent)/5' : ''}`}
            onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        >
            <div className="flex items-start gap-4 p-4 transition-colors">
                <div className="mt-0.5">{icons.get(type)}</div>
                <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold break-all text-(--beheer-text)">{email}</div>
                    {message && <div className="mt-1 text-sm font-medium text-(--beheer-text-muted)">{message}</div>}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <div className="text-sm font-semibold text-(--beheer-text-muted)/50 capitalize">
                        {type}
                    </div>
                    {hasDetails && (
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-(--beheer-accent)' : 'text-(--beheer-text-muted)'}`}>
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && hasDetails && (
                <div className="animate-in fade-in slide-in-from-top-2 px-12 pb-6 duration-300">
                    <div className="space-y-3 rounded-2xl border border-(--beheer-border)/30 bg-(--beheer-card-soft) p-4">
                        {timestamp && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-(--beheer-text-muted)">Tijdstip:</span>
                                <span className="text-base font-semibold text-(--beheer-text)">{new Date(timestamp).toLocaleString()}</span>
                            </div>
                        )}
                        {stack && (
                            <div className="space-y-1.5">
                                <span className="text-sm font-semibold text-(--beheer-text-muted)">Stack trace:</span>
                                <pre className="custom-scrollbar overflow-x-auto rounded-xl border border-(--theme-error)/10 bg-(--theme-error)/5 p-3 font-mono text-sm leading-relaxed text-(--theme-error)/70">
                                    {stack}
                                </pre>
                            </div>
                        )}
                        {changes && changes.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-sm font-semibold text-(--beheer-text-muted)">Wijzigingen:</span>
                                <div className="space-y-1">
                                    {changes.map((change, idx) => (
                                        <div key={idx} className="flex flex-col gap-0.5 rounded-xl border border-(--beheer-border)/20 bg-(--beheer-card-bg) p-2">
                                            <span className="text-sm font-semibold text-(--beheer-text)">{change.field}</span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm break-all text-(--beheer-text-muted)">{String(change.old ?? 'leeg')}</span>
                                                <svg className="size-3 shrink-0 text-(--beheer-text-muted)/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="text-sm font-semibold break-all text-(--beheer-active)">{String(change.new ?? 'leeg')}</span>
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Reset pagination to page 1 whenever the filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [resultFilter]);

    const itemMap = new Map<string, React.ReactNode>();

    const addItem = (email: string, node: React.ReactNode, type: string) => {
        const key = `${email}-${type}`;
        const globalKey = email;

        if (resultFilter !== 'all') {
            itemMap.set(key, node);
        } else {
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
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="flex flex-col overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-sm">
            <div className="custom-scrollbar max-h-120 overflow-y-auto">
                {paginatedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-(--beheer-text-muted)">
                        <Users className="mb-4 size-12 opacity-20" />
                        <p className="text-center text-base font-semibold">Geen resultaten gevonden voor dit filter.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-(--beheer-border)/10">{paginatedItems}</div>
                )}
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-(--beheer-border)/20 bg-(--beheer-card-soft) px-6 py-4">
                    <span className="text-[11px] font-semibold text-(--beheer-text-muted)">
                        Rij {startIndex + 1} t/m {Math.min(startIndex + itemsPerPage, totalItems)} van {totalItems}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="beheer-button rounded-lg border border-(--beheer-border) px-3.5 py-1.5 text-[11px] font-bold text-(--beheer-text) transition-all hover:border-(--beheer-accent) disabled:opacity-40"
                        >
                            Vorige
                        </button>
                        <span className="px-2 text-[11px] font-bold text-(--beheer-text)">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="beheer-button rounded-lg border border-(--beheer-border) px-3.5 py-1.5 text-[11px] font-bold text-(--beheer-text) transition-all hover:border-(--beheer-accent) disabled:opacity-40"
                        >
                            Volgende
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
