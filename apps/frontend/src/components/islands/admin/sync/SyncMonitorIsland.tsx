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
    const colorVariants: Record<string, string> = {
        indigo: 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)]',
        green: 'bg-[var(--beheer-active)] text-white shadow-lg shadow-[var(--beheer-active)]/20',
        amber: 'bg-[var(--theme-warning)] text-white shadow-lg shadow-[var(--theme-warning)]/20',
        blue: 'bg-[var(--theme-info)] text-white shadow-lg shadow-[var(--theme-info)]/20',
        red: 'bg-[var(--beheer-inactive)] text-white shadow-lg shadow-[var(--beheer-inactive)]/20',
        slate: 'bg-[var(--beheer-text-muted)] text-white shadow-lg shadow-[var(--beheer-text-muted)]/20',
        purple: 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)]',
    };

    return (
        <button
            onClick={onClick}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-between border ${
                active 
                    ? `${colorVariants[color]} border-transparent` 
                    : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] border-[var(--beheer-border)]/50 hover:border-[var(--beheer-accent)]/50 hover:text-[var(--beheer-text)]'
            }`}
        >
            <span>{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-[var(--beheer-border)]/30'}`}>
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

    const isRunning = status?.active || status?.status === 'running' || status?.status === 'starting';
    
    // Nuclear SSR: Calculate progress in frontend since backend doesn't send it correctly
    const processed = (status?.processed as number) || 0;
    const total = (status?.total as number) || 0;
    const progress = total > 0 ? (processed / total) * 100 : 0;

    return (
        <div className="bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] border border-[var(--beheer-border)] shadow-sm animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--theme-info)]/10 rounded-2xl text-[var(--theme-info)]">
                        <Activity className={`h-6 w-6 ${isRunning ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-[var(--beheer-text)]  tracking-tight">Sync Monitor</h3>
                        <p className="text-xs font-semibold text-[var(--beheer-text-muted)]  tracking-widest mt-1 uppercase">
                            {lastUpdated && mounted ? `Laatste update: ${lastUpdated.toLocaleTimeString()}` : 'Real-time status & logs'}
                        </p>
                    </div>
                </div>
            </div>
            
            {status?.fatalError && (
                <div className="mb-8 p-6 bg-[var(--theme-error)]/5 border border-[var(--theme-error)]/10 rounded-3xl animate-in slide-in-from-top duration-500">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-[var(--theme-error)]/10 rounded-xl text-[var(--theme-error)]">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[var(--theme-error)]  tracking-tight">Kritieke Fout Gedetecteerd</h4>
                            <p className="text-xs font-semibold text-[var(--beheer-text)]/80  tracking-widest mt-1">
                                {status.fatalError.message}
                            </p>
                            
                            {status.fatalError.stack && (
                                <div className="mt-4">
                                    <button 
                                        onClick={() => setShowStack(!showStack)}
                                        className="text-xs font-semibold  tracking-widest text-[var(--theme-error)] hover:underline transition-colors flex items-center gap-1 uppercase"
                                    >
                                        {showStack ? 'Verberg details' : 'Bekijk technische details (Stack Trace)'}
                                    </button>
                                    
                                    {showStack && (
                                        <div className="mt-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--beheer-border)] overflow-x-auto custom-scrollbar">
                                            <pre className="text-[10px] text-[var(--beheer-text-muted)] font-mono leading-relaxed">
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

            <div className="space-y-10">
                {/* PROGRESS BAR */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-semibold  tracking-widest text-[var(--beheer-text-muted)] uppercase">Voortgang ({processed} / {total})</span>
                        <span className="text-xs font-semibold text-[var(--beheer-accent)]">{Math.round(progress || 0)}%</span>
                    </div>
                    <div className="h-4 w-full bg-[var(--beheer-card-soft)] rounded-full overflow-hidden border border-[var(--beheer-border)]/20 shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-[var(--beheer-accent)] to-[var(--theme-info)] transition-all duration-500 relative"
                            style={{ width: `${progress}%` }}
                        >
                            {isRunning && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                        </div>
                    </div>
                </div>

                {/* UNIFIED FILTERS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
                    <FilterTab active={resultFilter === 'all'} label="Alles" count={status?.processed || 0} onClick={() => setResultFilter?.('all')} />
                    <FilterTab active={resultFilter === 'success'} label="Success" count={status?.successCount || 0} onClick={() => setResultFilter?.('success')} color="green" />
                    <FilterTab active={resultFilter === 'created'} label="Nieuw" count={status?.createdCount || 0} onClick={() => setResultFilter?.('created')} color="purple" />
                    <FilterTab active={resultFilter === 'warnings'} label="Warnings" count={status?.warningCount || 0} onClick={() => setResultFilter?.('warnings')} color="amber" />
                    <FilterTab active={resultFilter === 'missing'} label="Missend" count={status?.missingDataCount || 0} onClick={() => setResultFilter?.('missing')} color="blue" />
                    <FilterTab active={resultFilter === 'errors'} label="Errors" count={status?.errorCount || 0} onClick={() => setResultFilter?.('errors')} color="red" />
                    <FilterTab active={resultFilter === 'excluded'} label="Excluded" count={status?.excludedCount || 0} onClick={() => setResultFilter?.('excluded')} color="slate" />
                </div>

                <div className="min-h-[300px] border-t border-[var(--beheer-border)]/30 pt-8">
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
