import { Skeleton } from '@/components/ui/Skeleton';
import { LucideIcon } from 'lucide-react';

interface StatItem {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string;
}

interface AdminStatsBarProps {
    stats?: StatItem[];
    isLoading?: boolean;
}

/**
 * A standardized horizontal statistics bar for admin views.
 * Automatically handles a 4-column layout.
 */
export default function AdminStatsBar({ stats = [], isLoading = false }: AdminStatsBarProps) {
    const columnCount = isLoading ? 4 : Math.min(stats.length, 5);
    const columnClass = {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
        5: 'lg:grid-cols-5',
    }[columnCount as 1 | 2 | 3 | 4 | 5] || 'lg:grid-cols-4';

    const items = isLoading ? [...Array(4)] : stats;

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${columnClass} gap-4 mb-10 w-full`}>
            {items.map((stat, i) => (
                <div 
                    key={i}
                    className={`bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-6 shadow-sm flex flex-col justify-between min-h-[120px] ${!isLoading ? 'hover:border-[var(--beheer-accent)]/30 transition-all group' : 'animate-pulse'}`}
                    aria-busy={isLoading}
                >
                    <div className="flex items-center justify-between mb-2">
                        {isLoading ? (
                            <Skeleton className="h-3 w-20" />
                        ) : (
                            <span className="text-xs font-black text-[var(--beheer-text-muted)] uppercase tracking-[0.2em] leading-tight pr-2">
                                {stat.label}
                            </span>
                        )}
                        {isLoading ? (
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        ) : stat.icon && (
                            <div className="p-2 rounded-lg bg-[var(--beheer-accent)]/5 text-[var(--beheer-accent)] group-hover:bg-[var(--beheer-accent)] group-hover:text-white transition-all duration-300">
                                <stat.icon className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <span className="text-2xl font-black text-[var(--beheer-text)] tracking-tighter leading-none">
                                    {stat.value}
                                </span>
                                {stat.trend && (
                                    <div className="text-[9px] font-black text-[var(--beheer-active)] uppercase tracking-widest bg-[var(--beheer-active)]/10 px-1.5 py-0.5 rounded">
                                        {stat.trend}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
