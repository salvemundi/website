'use client';

import React, { useState, useEffect } from 'react';
import SyncLogs from '@/components/admin/sync/SyncLogs';
import { Info, Activity, AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useSync } from './SyncContext';

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
                        <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Sync Monitor</h3>
                        <p className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mt-1">
                            {lastUpdated && mounted ? `Laatste update: ${lastUpdated.toLocaleTimeString()}` : 'Real-time status & logs'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['all', 'success', 'created', 'warnings', 'missing', 'errors', 'excluded'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setResultFilter?.(filter)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${resultFilter === filter ? 'bg-[var(--beheer-accent)] text-white shadow-lg shadow-[var(--beheer-accent)]/20' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-border)]/50 hover:text-[var(--beheer-text)]'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>
            
            {status?.fatalError && (
                <div className="mb-8 p-6 bg-[var(--theme-error)]/5 border border-[var(--theme-error)]/10 rounded-3xl animate-in slide-in-from-top duration-500">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-[var(--theme-error)]/10 rounded-xl text-[var(--theme-error)]">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-[var(--theme-error)] uppercase tracking-tight">Kritieke Fout Gedetecteerd</h4>
                            <p className="text-xs font-black text-[var(--beheer-text)]/80 uppercase tracking-widest mt-1">
                                {status.fatalError.message}
                            </p>
                            
                            {status.fatalError.stack && (
                                <div className="mt-4">
                                    <button 
                                        onClick={() => setShowStack(!showStack)}
                                        className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-error)] hover:underline transition-colors flex items-center gap-1"
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

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Voortgang ({processed} / {total})</span>
                        <span className="text-xs font-black text-[var(--beheer-accent)]">{Math.round(progress || 0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-[var(--beheer-card-soft)] rounded-full overflow-hidden border border-[var(--beheer-border)]/20">
                        <div 
                            className="h-full bg-gradient-to-r from-[var(--beheer-accent)] to-[var(--theme-info)] transition-all duration-500 relative"
                            style={{ width: `${progress}%` }}
                        >
                            {isRunning && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                        </div>
                    </div>
                </div>

                <div className="mt-8 min-h-[200px]">
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
