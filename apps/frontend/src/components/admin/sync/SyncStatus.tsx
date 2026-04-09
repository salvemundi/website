'use client';

import React from 'react';
import { CheckCircle, Users, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';

interface SyncStatusData {
    active: boolean;
    status: string;
    total: number;
    processed: number;
    successCount: number;
    createdCount: number;
    warningCount: number;
    missingDataCount: number;
    errorCount: number;
}

interface SyncStatusProps {
    status: SyncStatusData;
    progress: number;
    lastUpdated: Date | null;
}

export default function SyncStatus({ status, progress, lastUpdated }: SyncStatusProps) {
    return (
        <section className="bg-[var(--beheer-card-bg)] p-8 rounded-[var(--beheer-radius)] shadow-sm border border-[var(--beheer-border)] animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Live Voortgang</h3>
                        {status.active && <div className="h-2.5 w-2.5 rounded-full bg-[var(--beheer-active)] animate-pulse shadow-[0_0_8px_var(--beheer-active)]" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--beheer-text-muted)] font-black uppercase tracking-widest">
                        <p>Status: <span className="capitalize text-[var(--beheer-accent)]">{status.status}</span></p>
                        {lastUpdated && (
                            <>
                                <span>•</span>
                                <p>Laatst bijgewerkt: {formatDate(lastUpdated, true)}</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-[var(--beheer-accent)]">{Math.round(progress)}%</div>
                    <div className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{status.processed} / {status.total} Leden</div>
                </div>
            </div>

            {/* Thick Progress Bar */}
            <div className="h-6 w-full bg-[var(--beheer-card-soft)] rounded-full overflow-hidden mb-12 flex items-center p-1.5 border border-[var(--beheer-border)] shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-[var(--beheer-accent)] via-[var(--beheer-accent)] to-[var(--beheer-accent)] rounded-full transition-all duration-1000 ease-out shadow-lg opacity-80"
                    style={{ width: `${Math.max(progress, 3)}%` }}
                />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard icon={<CheckCircle className="text-[var(--beheer-active)]" />} label="Geslaagd" count={status.successCount} color="green" />
                <StatCard icon={<Users className="text-purple-500" />} label="Nieuw" count={status.createdCount || 0} color="purple" />
                <StatCard icon={<AlertTriangle className="text-amber-500" />} label="Warnings" count={status.warningCount} color="amber" />
                <StatCard icon={<Info className="text-blue-500" />} label="Missend" count={status.missingDataCount} color="blue" />
                <StatCard icon={<AlertCircle className="text-[var(--beheer-inactive)]" />} label="Fouten" count={status.errorCount} color="red" />
            </div>
        </section>
    );
}

function StatCard({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
    const colorClasses: Record<string, string> = {
        green: 'border-[var(--beheer-active)]/10 bg-[var(--beheer-active)]/5',
        amber: 'border-amber-500/10 bg-amber-500/5',
        blue: 'border-blue-500/10 bg-blue-500/5',
        red: 'border-[var(--beheer-inactive)]/10 bg-[var(--beheer-inactive)]/5',
        purple: 'border-purple-500/10 bg-purple-500/5',
    };

    return (
        <div className={`p-6 rounded-[var(--beheer-radius)] border transition-all hover:scale-[1.02] duration-300 ${colorClasses[color] || ''}`}>
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-3xl font-black text-[var(--beheer-text)]">{count}</div>
        </div>
    );
}
