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
        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-(--bg-card) p-4 shadow-xl">
            <div>
                <p className="text-[10px] font-black tracking-widest text-(--text-muted) uppercase">{label}</p>
                <p className="text-2xl font-black tracking-tighter text-(--text-main) uppercase">{value}</p>
            </div>
            <div className={`rounded-xl bg-slate-500/10 p-2 ${color}`}>
                <Icon className="size-5" />
            </div>
        </div>
    );
}
