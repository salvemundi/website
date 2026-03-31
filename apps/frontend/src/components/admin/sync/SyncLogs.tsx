'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, X, Info, Users } from 'lucide-react';

interface ResultRowProps {
    email: string;
    message?: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'excluded';
}

function ResultRow({ email, message, type }: ResultRowProps) {
    const icons = {
        success: <CheckCircle className="h-4 w-4 text-[var(--beheer-active)]" />,
        warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        error: <X className="h-4 w-4 text-[var(--beheer-inactive)]" />,
        info: <Info className="h-4 w-4 text-blue-500" />,
        excluded: <Users className="h-4 w-4 text-[var(--beheer-text-muted)]" />,
    };

    return (
        <div className="p-4 flex items-start gap-4 hover:bg-[var(--beheer-card-soft)] transition-colors border-b border-[var(--beheer-border)] last:border-0">
            <div className="mt-0.5">{icons[type]}</div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black text-[var(--beheer-text)] uppercase tracking-tight truncate">{email}</div>
                {message && <div className="text-[10px] text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1">{message}</div>}
            </div>
            <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]/50">
                {type}
            </div>
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
        indigo: 'bg-[var(--beheer-accent)] text-white',
        green: 'bg-[var(--beheer-active)] text-white',
        amber: 'bg-amber-500 text-white',
        blue: 'bg-blue-500 text-white',
        red: 'bg-[var(--beheer-inactive)] text-white',
        slate: 'bg-[var(--beheer-text-muted)] text-white',
        purple: 'bg-purple-500 text-white',
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
            <ResultRow key={`s-${i}`} email={u.email} type="success" />
        )));
    }
    if (resultFilter === 'all' || resultFilter === 'created') {
        items.push(...(status.createdUsers || []).map((u: any, i: number) => (
            <ResultRow key={`c-${i}`} email={u.email} type="success" message="Nieuw lid aangemaakt" />
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
            <ResultRow key={`e-${i}`} email={e.email} message={e.message} type="error" />
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
