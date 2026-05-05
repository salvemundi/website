import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-2 animate-in fade-in duration-1000">
            {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2 group whitespace-nowrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50 group-hover:opacity-100 transition-opacity">
                        {stat.label}
                    </span>
                    <span className="text-lg font-black text-[var(--beheer-text)] tabular-nums">
                        {stat.value}
                    </span>
                    {i < stats.length - 1 && (
                        <div className="hidden lg:block h-1 w-1 rounded-full bg-[var(--beheer-accent)]/20 ml-4" />
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
