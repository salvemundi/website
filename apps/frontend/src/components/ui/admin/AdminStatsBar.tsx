import { LucideIcon } from 'lucide-react';

interface StatItem {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string;
}

/**
 * A standardized horizontal statistics bar for admin views.
 * Automatically handles a 4-column layout.
 */
export default function AdminStatsBar({ stats = [] }: AdminStatsBarProps) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-2">
            {stats.map((stat, i) => (
                <div key={i} className="group flex items-center gap-2 whitespace-nowrap">
                    <span className="text-xs font-semibold text-text-muted opacity-50 transition-opacity group-hover:opacity-100">
                        {stat.label}
                    </span>
                    <span className="text-lg font-semibold text-text-main tabular-nums">
                        {stat.value}
                    </span>
                    {i < stats.length - 1 && (
                        <div className="ml-4 hidden size-1 rounded-full bg-theme-purple/20 lg:block" />
                    )}
                </div>
            ))}
        </div>
    );
}

interface AdminStatsBarProps {
    stats?: StatItem[];
    actions?: React.ReactNode;
}

