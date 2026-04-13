'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, X, Info, Users } from 'lucide-react';

interface ResultRowProps {
    email: string;
    message?: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'excluded';
    timestamp?: string;
    stack?: string;
    changes?: { field: string; old: any; new: any }[];
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
                    <div className="text-[10px] font-black text-[var(--beheer-text)] uppercase tracking-tight truncate">{email}</div>
                    {message && <div className="text-[10px] text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1">{message}</div>}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]/50">
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
                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Tijdstip:</span>
                                <span className="text-[9px] font-black text-[var(--beheer-text)] uppercase">{new Date(timestamp).toLocaleString()}</span>
                            </div>
                        )}
                        {stack && (
                            <div className="space-y-1.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Stack Trace:</span>
                                <pre className="text-[9px] text-[var(--theme-error)]/70 font-mono leading-relaxed overflow-x-auto p-3 bg-[var(--theme-error)]/5 rounded-xl border border-[var(--theme-error)]/10 custom-scrollbar">
                                    {stack}
                                </pre>
                            </div>
                        )}
                        {changes && changes.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Wijzigingen:</span>
                                <div className="space-y-1">
                                    {changes.map((change, idx) => (
                                        <div key={idx} className="flex flex-col gap-0.5 p-2 bg-[var(--beheer-card-bg)] rounded-xl border border-[var(--beheer-border)]/20">
                                            <span className="text-[9px] font-black text-[var(--beheer-text)] uppercase">{change.field}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] text-[var(--beheer-text-muted)] truncate max-w-[100px]">{String(change.old ?? 'leeg')}</span>
                                                <svg className="h-2 w-2 text-[var(--beheer-text-muted)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="text-[8px] font-black text-[var(--beheer-active)] truncate max-w-[100px]">{String(change.new ?? 'leeg')}</span>
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
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                active 
                    ? `${colorVariants[color]} shadow-[var(--shadow-glow)]` 
                    : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]'
            }`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white/20' : 'bg-[var(--beheer-card-soft)]'}`}>
                {count}
            </span>
        </button>
    );
}

interface SyncLogsProps {
    resultFilter: string;
    setResultFilter: (value: any) => void;
    status: any;
}

export default function SyncLogs({ resultFilter, setResultFilter, status }: SyncLogsProps) {
    const items: React.ReactNode[] = [];

    if (resultFilter === 'all' || resultFilter === 'success') {
        items.push(...status.successfulUsers.map((u: any, i: number) => (
            <ResultRow 
                key={`s-${i}`} 
                email={u.email} 
                type="success" 
                changes={u.changes}
            />
        )));
    }
    if (resultFilter === 'all' || resultFilter === 'created') {
        items.push(...(status.createdUsers || []).map((u: any, i: number) => (
            <ResultRow 
                key={`c-${i}`} 
                email={u.email} 
                type="success" 
                message="Nieuw lid aangemaakt" 
                changes={u.changes}
            />
        )));
    }
    if (resultFilter === 'all' || resultFilter === 'warnings') {
        items.push(...status.warnings.map((w: any, i: number) => (
            <ResultRow key={`w-${i}`} email={w.email} message={w.message} type="warning" />
        )));
    }
    if (resultFilter === 'all' || resultFilter === 'missing') {
        items.push(...status.missingData.map((m: any, i: number) => (
            <ResultRow key={`m-${i}`} email={m.email} message={m.reason} type="info" />
        )));
    }
    if (resultFilter === 'all' || resultFilter === 'errors') {
        items.push(...status.errors.map((e: any, i: number) => (
            <ResultRow 
                key={`e-${i}`} 
                email={e.email} 
                message={e.message} 
                type="error" 
                timestamp={e.timestamp}
                stack={e.stack}
            />
        )));
    }
    if (resultFilter === 'all' || resultFilter === 'excluded') {
        items.push(...status.excludedUsers.map((u: any, i: number) => (
            <ResultRow key={`ex-${i}`} email={u.email} type="excluded" />
        )));
    }

    return (
        <div className="space-y-6">
            <div className="flex bg-[var(--beheer-card-soft)] p-2 rounded-2xl overflow-x-auto gap-1 border border-[var(--beheer-border)]">
                <FilterTab active={resultFilter === 'all'} label="Alles" count={status.processed} onClick={() => setResultFilter('all')} />
                <FilterTab active={resultFilter === 'success'} label="Success" count={status.successCount} onClick={() => setResultFilter('success')} color="green" />
                <FilterTab active={resultFilter === 'created'} label="Nieuw" count={status.createdCount || 0} onClick={() => setResultFilter('created')} color="purple" />
                <FilterTab active={resultFilter === 'warnings'} label="Warnings" count={status.warningCount} onClick={() => setResultFilter('warnings')} color="amber" />
                <FilterTab active={resultFilter === 'missing'} label="Missend" count={status.missingDataCount} onClick={() => setResultFilter('missing')} color="blue" />
                <FilterTab active={resultFilter === 'errors'} label="Errors" count={status.errorCount} onClick={() => setResultFilter('errors')} color="red" />
                <FilterTab active={resultFilter === 'excluded'} label="Excluded" count={status.excludedCount} onClick={() => setResultFilter('excluded')} color="slate" />
            </div>

            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-sm">
                <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-[var(--beheer-text-muted)]">
                            <Users className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Geen resultaten gevonden voor dit filter.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--beheer-border)]/10">{items}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
