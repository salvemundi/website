'use client';

import React, { useState, useEffect } from 'react';
import SyncLogs from '@/components/admin/sync/SyncLogs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Info, Activity } from 'lucide-react';

interface SyncMonitorIslandProps {
    isLoading?: boolean;
    status?: any | null;
    progress?: number;
    lastUpdated?: Date | null;
    resultFilter?: 'all' | 'success' | 'created' | 'warnings' | 'missing' | 'errors' | 'excluded';
    setResultFilter?: (val: any) => void;
}

export default function SyncMonitorIsland({ isLoading, status, progress, lastUpdated, resultFilter, setResultFilter }: SyncMonitorIslandProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (isLoading && !status) {

        return (
            <div className="bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] border border-[var(--beheer-border)] shadow-sm skeleton-active min-h-[400px]">
                <div className="h-4 w-32 mb-4" />
                <div className="h-8 w-full" />
            </div>
        );
    }

    return (
        <div className="bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] border border-[var(--beheer-border)] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Sync Monitor</h3>
                        {lastUpdated && (
                            <p className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mt-1">
                                Laatste update: {mounted ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['all', 'success', 'created', 'warnings', 'missing', 'errors', 'excluded'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setResultFilter?.(filter)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${resultFilter === filter ? 'bg-[var(--beheer-accent)] text-white shadow-lg shadow-[var(--beheer-accent)]/20' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-border)]'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Voortgang ({status?.processed || 0} / {status?.total || 0})</span>
                        <span className="text-xs font-black text-[var(--beheer-accent)]">{Math.round(progress || 0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-[var(--beheer-card-soft)] rounded-full overflow-hidden border border-[var(--beheer-border)]/20">
                        <div 
                            className="h-full bg-gradient-to-r from-[var(--beheer-accent)] to-blue-500 transition-all duration-500 relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {status && setResultFilter && (
                        <SyncLogs 
                            status={status} 
                            resultFilter={resultFilter || 'all'} 
                            setResultFilter={setResultFilter} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
