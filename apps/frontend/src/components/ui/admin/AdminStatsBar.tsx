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
    const columnCount = Math.min(stats.length, 5);
    const columnClass = {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
        5: 'lg:grid-cols-5',
    }[columnCount as 1 | 2 | 3 | 4 | 5] || 'lg:grid-cols-4';

    return (
        <div 
            className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 w-full",
                columnClass
            )}
        >
            {stats.map((stat, i) => (
                <div 
                    key={i}
                    className={cn(
                        "bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-4 shadow-sm flex items-center justify-between transition-all group",
                        "hover:border-[var(--beheer-accent)]/30"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-[var(--beheer-text-muted)] tracking-wider">
                            {stat.label}
                        </span>
                        <span className="text-2xl font-bold text-[var(--beheer-text)] tracking-tight">
                            {stat.value}
                        </span>
                    </div>

                    {stat.icon && (
                        <div className="p-2.5 rounded-xl bg-[var(--beheer-accent)]/5 text-[var(--beheer-accent)] group-hover:bg-[var(--beheer-accent)] group-hover:text-white transition-all duration-300">
                            <stat.icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

interface AdminStatsBarProps {
    stats?: StatItem[];
}
