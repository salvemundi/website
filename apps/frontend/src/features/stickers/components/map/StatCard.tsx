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
        <div className="stat-card-box">
            <div>
                <p className="stat-card-label">{label}</p>
                <p className="stat-card-value">{value}</p>
            </div>
            <div className={`rounded-xl bg-beheer-card-soft p-2 ${color}`}>
                <Icon className="size-5" />
            </div>
        </div>
    );
}
