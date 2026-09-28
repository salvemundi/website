'use client';

import React, { useState, useEffect } from 'react';
import SyncLogs from '@/components/admin/sync/SyncLogs';
import { Activity, AlertCircle } from 'lucide-react';
import { useSync } from './SyncContext';

interface FilterTabProps {
    active: boolean;
    label: string;
    count: number;
    onClick: () => void;
    color?: string;
}

function FilterTab({ active, label, count, onClick, color = 'indigo' }: FilterTabProps) {
    const colorVariants = new Map([
        ['indigo', 'bg-(--beheer-accent) text-white shadow-(--shadow-glow)'],
        ['green', 'bg-(--beheer-active) text-white shadow-lg shadow-(--beheer-active)/20'],
        ['amber', 'bg-(--theme-warning) text-white shadow-lg shadow-(--theme-warning)/20'],
        ['blue', 'bg-(--theme-info) text-white shadow-lg shadow-(--theme-info)/20'],
        ['red', 'bg-(--beheer-inactive) text-white shadow-lg shadow-(--beheer-inactive)/20'],
        ['slate', 'bg-(--beheer-text-muted) text-white shadow-lg shadow-(--beheer-text-muted)/20'],
        ['purple', 'bg-(--beheer-accent) text-white shadow-(--shadow-glow)'],
    ]);

    return (
        <button
            onClick={onClick}
            className={`beheer-button flex w-full items-center justify-between rounded-xl border px-3 py-2 text-[11px] font-semibold whitespace-nowrap transition-all ${active
                ? `${colorVariants.get(color)} border-transparent shadow-sm`
                : 'border-(--beheer-border)/50 bg-(--beheer-card-soft) text-(--beheer-text-muted) hover:border-(--beheer-accent)/30 hover:text-(--beheer-text)'
                }`}
        >
            <span>{label}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${active ? 'bg-white/20' : 'bg-(--beheer-border)/30'}`}>
                {count}
            </span>
        </button>
    );
}

export default function SyncMonitorIsland() {
    const {
        status, resultFilter, setResultFilter, lastUpdated
    } = useSync();

    const [mounted, setMounted] = useState(false);
    const [showStack, setShowStack] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const processed = (status?.processed as number) || 0;
    const total = (status?.total as number) || 0;
    const progress = total > 0 ? (processed / total) * 100 : 0;

    return (
        <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-sm">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-(--beheer-accent)/10 p-2.5 text-(--beheer-accent)">
                        <Activity className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight text-(--beheer-text)">Sync Monitor</h3>
                        <p className="mt-1 text-[11px] font-semibold text-(--beheer-text-muted)">
                            {lastUpdated && mounted ? `Laatste update: ${lastUpdated.toLocaleTimeString()}` : 'Real-time status & logs'}
                        </p>
                    </div>
                </div>
            </div>

            {status?.error && (
                <div className="mb-8 rounded-2xl border border-(--theme-error)/10 bg-(--theme-error)/5 p-5">
                    <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-(--theme-error)/10 p-2 text-(--theme-error)">
                            <AlertCircle className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold tracking-tight text-(--theme-error)">Verbindingsfout met Sync Service</h4>
                            <p className="mt-1 text-[11px] font-semibold text-(--beheer-text)/80">
                                {status.error} (Controleer of de service en de Netbird VPN verbinding actief zijn.)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {status?.fatalError && (
                <div className="mb-8 rounded-2xl border border-(--theme-error)/10 bg-(--theme-error)/5 p-5">
                    <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-(--theme-error)/10 p-2 text-(--theme-error)">
                            <AlertCircle className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold tracking-tight text-(--theme-error)">Kritieke Fout Gedetecteerd</h4>
                            <p className="mt-1 text-[11px] font-semibold text-(--beheer-text)/80">
                                {status.fatalError.message}
                            </p>

                            {status.fatalError.stack && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => setShowStack(!showStack)}
                                        className="beheer-button flex items-center gap-1 text-[11px] font-semibold text-(--theme-error) transition-colors hover:underline"
                                    >
                                        {showStack ? 'Verberg details' : 'Bekijk technische details (Stack Trace)'}
                                    </button>

                                    {showStack && (
                                        <div className="custom-scrollbar mt-3 overflow-x-auto rounded-xl border border-(--beheer-border) bg-black/5 p-4 dark:bg-white/5">
                                            <pre className="font-mono text-[10px] leading-relaxed text-(--beheer-text-muted)">
                                                {status.fatalError.stack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {/* PROGRESS BAR */}
                <div>
                    <div className="mb-3 flex items-end justify-between">
                        <span className="text-[11px] font-semibold text-(--beheer-text-muted)">Voortgang ({processed} / {total})</span>
                        <span className="text-[11px] font-semibold text-(--beheer-accent)">{Math.round(progress || 0)}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full border border-(--beheer-border)/20 bg-(--beheer-card-soft) shadow-inner">
                        <div
                            className="relative h-full bg-linear-to-r from-(--beheer-accent) to-(--theme-info) transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        >
                        </div>
                    </div>
                </div>

                {/* UNIFIED FILTERS GRID */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
                    <FilterTab active={resultFilter === 'all'} label="Alles" count={status?.processed || 0} onClick={() => setResultFilter('all')} />
                    <FilterTab active={resultFilter === 'success'} label="Success" count={status?.successCount || 0} onClick={() => setResultFilter('success')} color="green" />
                    <FilterTab active={resultFilter === 'created'} label="Nieuw" count={status?.createdCount || 0} onClick={() => setResultFilter('created')} color="purple" />
                    <FilterTab active={resultFilter === 'warnings'} label="Warnings" count={status?.warningCount || 0} onClick={() => setResultFilter('warnings')} color="amber" />
                    <FilterTab active={resultFilter === 'missing'} label="Missend" count={status?.missingDataCount || 0} onClick={() => setResultFilter('missing')} color="blue" />
                    <FilterTab active={resultFilter === 'errors'} label="Errors" count={status?.errorCount || 0} onClick={() => setResultFilter('errors')} color="red" />
                    <FilterTab active={resultFilter === 'excluded'} label="Excluded" count={status?.excludedCount || 0} onClick={() => setResultFilter('excluded')} color="slate" />
                </div>

                <div className="min-h-75 border-t border-(--beheer-border)/30 pt-8">
                    <SyncLogs
                        status={status || {
                            successfulUsers: [], createdUsers: [], warnings: [],
                            missingData: [], errors: [], excludedUsers: [],
                            processed: 0, total: 0, successCount: 0, errorCount: 0,
                            warningCount: 0, missingDataCount: 0, excludedCount: 0
                        }}
                        resultFilter={resultFilter || 'all'}
                        setResultFilter={setResultFilter}
                    />
                </div>
            </div>
        </div>
    );
}
