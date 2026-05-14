'use client';

import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: string;
}

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
    return (
        <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-xl border border-white/5 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
                <p className="text-2xl font-black text-[var(--text-main)] tracking-tighter uppercase">{value}</p>
            </div>
            <div className={`p-2 rounded-xl bg-slate-500/10 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    );
}
